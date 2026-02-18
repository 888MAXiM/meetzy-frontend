import { post } from '../api';
import { NotificationService } from './notification-service';
import { ChatType } from '../constants';
import { CallParticipant, CallState } from '../types/webrtc';
import { URL_KEYS } from '../constants/url';
import { socket } from './socket-setup';
import { SOCKET } from '../constants/socket';
import { toaster } from '../utils/custom-functions';

const initialCallState: CallState = { 
  callId: null,
  isInCall: false,
  isInitiator: false,
  callType: 'audio',
  chatType: ChatType.DM,
  chatId: null,
  chatName: null,
  participants: new Map(),
  localStream: null,
  screenShareStream: null,
  isVideoEnabled: false,
  isAudioEnabled: true,
  isScreenSharing: false,
  audioOutputMode: 'speaker',
  callStartTime: null,
  callStatus: 'idle',
  targetBusy: false,
  currentUserId: null,
  waitingIncoming: null,
};

class WebRTCService {
  private callState: CallState = { ...initialCallState };
  private peerConnections = new Map<string, RTCPeerConnection>();
  private pendingIce = new Map<string, RTCIceCandidate[]>();
  private stateCallbacks = new Set<(s: CallState) => void>();
  private participantCallbacks = new Set<(p: Map<string, CallParticipant>) => void>();
  private ringingTimer?: NodeJS.Timeout;
  private callingTimer?: NodeJS.Timeout;

  private rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      {
        urls: ['turn:116.74.126.0:3478', 'turn:116.74.126.0:3478?transport=tcp'],
        username: 'myuser',
        credential: 'mypassword',
      },
    ],
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceCandidatePoolSize: 10,
  }

  constructor() {
    this.setupSocket();
    this.setupPageUnloadHandler();
  }

  onStateChange(cb: (s: CallState) => void) {
    this.stateCallbacks.add(cb);
    return () => this.stateCallbacks.delete(cb);
  }

  onParticipantUpdate(cb: (p: Map<string, CallParticipant>) => void) {
    this.participantCallbacks.add(cb);
    return () => this.participantCallbacks.delete(cb);
  }

  getCallState = () => ({ ...this.callState });

  async initiateCall(
    chatId: number | string,
    chatName: string,
    chatType: ChatType,
    callType: 'audio' | 'video',
    currentUser: { id: number | string; name?: string; avatar?: string | null },
  ) {
    if (this.callState.isInCall) return false;

    const wantVideo = callType === 'video';
    const stream = await this.getUserMedia(wantVideo);
    if (!stream) return false;

    const hasVideo = stream.getVideoTracks().length > 0;
    const actualVideo = wantVideo && hasVideo;

    const currentUserIdStr = String(currentUser.id);

    this.callState = {
      ...initialCallState,
      isInCall: true,
      isInitiator: true,
      callType,
      chatType,
      chatId,
      chatName,
      localStream: stream,
      isVideoEnabled: actualVideo,
      isAudioEnabled: true,
      callStatus: 'calling',
      participants: new Map(),
      currentUserId: currentUserIdStr,
    };

    // Add self to participants
    this.callState.participants.set(currentUserIdStr, {
      userId: currentUserIdStr,
      socketId: socket.id || '',
      name: currentUser.name,
      avatar: currentUser.avatar,
      isVideoEnabled: actualVideo,
      isAudioEnabled: true,
      stream,
      joinedAt: new Date(),
    });

    let serverCallId: string | null = null;
    try {
      const resp: any = await post(URL_KEYS.Call.Initiate, {
        callType,
        chatType,
        chatId,
      });
      serverCallId = String(resp?.call?.id ?? resp?.callId ?? '');
      if (serverCallId) this.callState.callId = serverCallId;
    } catch (e) {
      this.resetState();
      return false;
    }

    // Initialize and start outgoing ringtone (callertune) for the initiator
    // Ensure AudioContext is ready before starting ringtone
    NotificationService.initialize().then(() => {
      NotificationService.startCallRingtone('outgoing');
    }).catch(err => {
      console.warn('Failed to initialize notification service for ringtone:', err);
    });

    this.callingTimer = setTimeout(() => {
      if (this.callState.callStatus === 'calling') this.endCall();
    }, 20_000);

    this.callState.participants = this.normalizeParticipants(this.callState.participants, currentUserIdStr);

    this.notifyState();
    this.notifyParticipants();
    return true;
  }

  async acceptCall(callId: string, currentUser: { id: number | string; name?: string; avatar?: string | null }) {
    if (this.callState.callStatus !== 'ringing') return false;

    // Stop all ringtones immediately when call is accepted
    NotificationService.stopAllSounds();

    const wantVideo = this.callState.callType === 'video';
    const stream = await this.getUserMedia(wantVideo);
    if (!stream) return false;

    const hasVideo = stream.getVideoTracks().length > 0;
    const actualVideo = wantVideo && hasVideo;

    const localUserId = String(currentUser.id);
    this.callState = {
      ...this.callState,
      isInCall: true,
      isInitiator: false,
      localStream: stream,
      isVideoEnabled: actualVideo,
      isAudioEnabled: true,
      callStartTime: new Date(),
      callStatus: 'connected',
      participants: this.callState.participants,
      currentUserId: localUserId,
    };

    if (!this.callState.participants.has(localUserId)) {
      this.callState.participants.set(localUserId, {
        userId: localUserId,
        socketId: socket.id || '',
        name: currentUser.name,
        avatar: currentUser.avatar,
        isVideoEnabled: actualVideo,
        isAudioEnabled: true,
        stream,
        joinedAt: new Date(),
      });
    }

    await post(URL_KEYS.Call.Answer, { callId });

    socket.emit('join-call', {
      callId,
      user: {
        userId: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        isAudioEnabled: true,
        isVideoEnabled: actualVideo,
      },
    });

    this.callState.participants = this.normalizeParticipants(this.callState.participants, localUserId);

    this.notifyState();
    this.notifyParticipants();
    return true;
  }

  async joinOngoingCall(
    callId: string,
    chatId: number | string,
    chatName: string,
    chatType: ChatType,
    callType: 'audio' | 'video',
    currentUser: { id: number | string; name?: string; avatar?: string | null },
  ) {
    if (this.callState.isInCall && this.callState.callId !== callId) {
      console.warn('Already in a different call');
      return false;
    }

    NotificationService.stopAllSounds();

    const wantVideo = callType === 'video';
    const stream = await this.getUserMedia(wantVideo);
    if (!stream) return false;

    const hasVideo = stream.getVideoTracks().length > 0;
    const actualVideo = wantVideo && hasVideo;

    const localUserId = String(currentUser.id);
    this.callState = {
      ...this.callState,
      callId,
      isInCall: true,
      isInitiator: false,
      callType,
      chatType,
      chatId,
      chatName,
      localStream: stream,
      isVideoEnabled: actualVideo,
      isAudioEnabled: true,
      callStartTime: new Date(),
      callStatus: 'connected',
      participants: new Map(),
      currentUserId: localUserId,
    };

    // Add self to participants
    this.callState.participants.set(localUserId, {
      userId: localUserId,
      socketId: socket.id || '',
      name: currentUser.name,
      avatar: currentUser.avatar,
      isVideoEnabled: actualVideo,
      isAudioEnabled: true,
      stream,
      joinedAt: new Date(),
    });

    try {
      await post(URL_KEYS.Call.Answer, { callId });
    } catch (error) {
      console.error('Failed to answer call:', error);
      this.resetState();
      return false;
    }

    socket.emit('join-call', {
      callId,
      user: {
        userId: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        isAudioEnabled: true,
        isVideoEnabled: actualVideo,
      },
    });

    this.callState.participants = this.normalizeParticipants(this.callState.participants, localUserId);

    this.notifyState();
    this.notifyParticipants();
    return true;
  }

  async declineCall(callId: string) {
    NotificationService.stopAllSounds();
    clearTimeout(this.ringingTimer);
    try { await post(URL_KEYS.Call.Decline, { callId }); } catch {}
    this.resetState();
  }

  async endCall() {
    NotificationService.stopAllSounds();
    this.callingTimer && clearTimeout(this.callingTimer);
    this.ringingTimer && clearTimeout(this.ringingTimer);

    const callId = this.callState.callId;
    
    // Stop all tracks and close peer connections before resetting state
    if (this.callState.localStream) {
      this.callState.localStream.getTracks().forEach(track => {
        try { 
          track.stop();
          this.callState.localStream?.removeTrack(track);
        } catch (e) {}
      });
    }
    if (this.callState.screenShareStream) {
      this.callState.screenShareStream.getTracks().forEach(track => {
        try { 
          track.stop();
          this.callState.screenShareStream?.removeTrack(track);
        } catch (e) {}
      });
    }
    
    // Remove all tracks from peer connections before closing
    this.peerConnections.forEach(pc => {
      try {
        pc.getSenders().forEach(sender => {
          if (sender.track) {
            sender.track.stop();
          }
        });
        pc.close();
      } catch (e) {}
    });
    this.peerConnections.clear();
    this.pendingIce.clear();
    
    this.resetState();

    if (callId) {
      try { await post(URL_KEYS.Call.End, { callId }); } catch {}
    }
  }

  async toggleAudio() {
    const track = this.callState.localStream?.getAudioTracks()[0];
    if (!track) return false;
    track.enabled = !track.enabled;
    this.callState.isAudioEnabled = track.enabled;

    const currentUserIdStr = String(this.callState.currentUserId);
    const localParticipant = this.callState.participants.get(currentUserIdStr);
    if (localParticipant) {
      localParticipant.isAudioEnabled = track.enabled;
      this.callState.participants.set(currentUserIdStr, localParticipant);
    }

    socket.emit('toggle-audio', { 
      callId: this.callState.callId, 
      isAudioEnabled: track.enabled 
    });

    this.notifyState();
    this.notifyParticipants(); // Important!
    return track.enabled;
  }

  async toggleVideo() {
    const track = this.callState.localStream?.getVideoTracks()[0];
    if (!track) return false;
    track.enabled = !track.enabled;
    this.callState.isVideoEnabled = track.enabled;
    socket.emit('toggle-video', { callId: this.callState.callId, isVideoEnabled: track.enabled });
    this.notifyState();
    this.notifyParticipants();
    return track.enabled;
  }

  async toggleAudioOutput() {
    const newMode = this.callState.audioOutputMode === 'speaker' ? 'microphone' : 'speaker';
    this.callState.audioOutputMode = newMode;
    this.notifyState();
    return newMode;
  }

  getAudioOutputMode() {
    return this.callState.audioOutputMode;
  }

  setWaitingIncomingCall(incomingData: any) {
    this.callState.waitingIncoming = {
      callId: String(incomingData.id),
      callType: incomingData.call_type === 'video' ? 'video' : 'audio',
      initiator: {
        userId: incomingData.initiator.userId,
        name: incomingData.initiator.name || '',
        avatar: incomingData.initiator.avatar,
      },
      chatType: incomingData.call_mode === 'direct' ? ChatType.DM : ChatType.group,
      chatId: incomingData.call_mode === 'direct' ? incomingData.receiver_id : incomingData.group_id,
      chatName: incomingData.initiator.name || '',
    };

    this.notifyState();
    NotificationService.notifyIncomingCall({
      title: `${incomingData.initiator.name} is calling`,
      body: `Incoming ${this.callState?.waitingIncoming?.callType} call`,
      tag: `waiting-call-${this.callState.waitingIncoming?.callId}`,
    });
  }

  async acceptWaitingCall(currentUser: { id: number | string; name?: string; avatar?: string | null }) {
    if (!this.callState.waitingIncoming) return false;
    const waitingCall = { ...this.callState.waitingIncoming };
    
    // End current call
    await this.endCall();
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // FORCE COMPLETE RESET
    this.callState = {
      callId: null,
      isInCall: false,
      isInitiator: false,
      callType: 'audio',
      chatType: ChatType.DM,
      chatId: null,
      chatName: null,
      participants: new Map(),
      localStream: null,
      screenShareStream: null,
      isVideoEnabled: false,
      isAudioEnabled: true,
      isScreenSharing: false,
      audioOutputMode: 'speaker',
      callStartTime: null,
      callStatus: 'idle',
      targetBusy: false,
      currentUserId: null,
      waitingIncoming: null,
    };
    this.notifyState();
    this.notifyParticipants();
    
    await new Promise(resolve => setTimeout(resolve, 300));

    // Set up new call
    const currentUserIdStr = String(currentUser.id);
    const callerIdStr = String(waitingCall.initiator.userId);
    const newParticipantsMap = new Map<string, CallParticipant>();
    newParticipantsMap.set(callerIdStr, {
      userId: callerIdStr,
      socketId: '',
      name: waitingCall.initiator.name,
      avatar: waitingCall.initiator.avatar,
      isVideoEnabled: waitingCall.callType === 'video',
      isAudioEnabled: true,
      stream: null,
      joinedAt: new Date(),
    });
    
    this.callState = {
      callId: waitingCall.callId,
      isInCall: false,
      isInitiator: false,
      callType: waitingCall.callType,
      chatType: waitingCall.chatType,
      chatId: waitingCall.chatId,
      chatName: waitingCall.initiator.name || '',
      participants: newParticipantsMap,
      localStream: null,
      screenShareStream: null,
      isVideoEnabled: false,
      isAudioEnabled: true,
      isScreenSharing: false,
      audioOutputMode: 'speaker',
      callStartTime: null,
      callStatus: 'ringing',
      targetBusy: false,
      currentUserId: currentUserIdStr,
      waitingIncoming: null,
    };
    
    this.notifyState();
    this.notifyParticipants();
      
    setTimeout(async () => {
      try {
        await this.acceptCall(waitingCall.callId, currentUser);
      } catch (err) {
        console.error('Failed to auto-accept:', err);
      }
    }, 600);

    return true;
  }

  async startScreenShare(): Promise<boolean> {
    if (!this.callState.isInCall || this.callState.isScreenSharing) return false

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      })

      const videoTrack = screenStream.getVideoTracks()[0]
      if (!videoTrack) throw new Error("No video track")

      videoTrack.onended = () => {
        this.stopScreenShare()
      }

      // Store screen stream
      this.callState.screenShareStream = screenStream
      this.callState.isScreenSharing = true
      this.callState.isVideoEnabled = true

      // Update local participant
      const currentUserIdStr = String(this.callState.currentUserId)
      const localParticipant = this.callState.participants.get(currentUserIdStr)
      if (localParticipant) {
        localParticipant.isScreenSharing = true
        localParticipant.isVideoEnabled = true
        this.callState.participants.set(currentUserIdStr, localParticipant)
      }

      // CRITICAL: Renegotiate with all peers
      const renegotiatePromises = Array.from(this.peerConnections.entries()).map(async ([userId, pc]) => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video')
        if (sender) {
          await sender.replaceTrack(videoTrack)
        } else {
          pc.addTrack(videoTrack, screenStream)
        }

        // Force renegotiation
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        socket.emit(SOCKET.Emitters.Webrtc_Offer, {
          callId: this.callState.callId,
          targetUserId: userId,
          offer: pc.localDescription,
        })
      })

      await Promise.all(renegotiatePromises)

      socket.emit('start-screen-share', { callId: this.callState.callId })
      socket.emit('toggle-video', { callId: this.callState.callId, isVideoEnabled: true })

      this.notifyState()
      this.notifyParticipants()
      return true
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        console.error('Screen share failed:', err)
        toaster('error', 'Failed to share screen')
      }
      return false
    }
  }

  async stopScreenShare(): Promise<void> {
  if (!this.callState.isScreenSharing) return

  // Stop all screen share tracks
  this.callState.screenShareStream?.getTracks().forEach(track => track.stop())
  this.callState.screenShareStream = null
  this.callState.isScreenSharing = false

  // Update local participant state
  const currentUserIdStr = String(this.callState.currentUserId)
  const localParticipant = this.callState.participants.get(currentUserIdStr)
  if (localParticipant) {
    localParticipant.isScreenSharing = false
    this.callState.participants.set(currentUserIdStr, localParticipant)
  }

  // Get camera video track to switch back to (if available)
  let cameraVideoTrack: MediaStreamTrack | null = null
  if (this.callState.callType === 'video' && this.callState.localStream) {
    cameraVideoTrack = this.callState.localStream.getVideoTracks()[0] || null
    this.callState.isVideoEnabled = !!cameraVideoTrack
  } else {
    this.callState.isVideoEnabled = false
  }

  // Update local participant video state
  if (localParticipant) {
    localParticipant.isVideoEnabled = this.callState.isVideoEnabled
    this.callState.participants.set(currentUserIdStr, localParticipant)
  }

  // Renegotiate with all peers: replace screen track → camera track (or null)
  const renegotiatePromises = Array.from(this.peerConnections.entries()).map(async ([userId, pc]) => {
    try {
      const videoSender = pc.getSenders().find(s => s.track?.kind === 'video')
      if (videoSender) {
        await videoSender.replaceTrack(cameraVideoTrack) // This can be null → disables video
      }

      // Force renegotiation so remote peers re-attach the new stream
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      socket.emit(SOCKET.Emitters.Webrtc_Offer, {
        callId: this.callState.callId!,
        targetUserId: userId,
        offer: pc.localDescription!,
      })
    } catch (err) {
      console.error(`Renegotiation failed for user ${userId}:`, err)
    }
  })

  await Promise.all(renegotiatePromises)

  // Notify server
  if (this.callState.callId) {
    socket.emit('stop-screen-share', { callId: this.callState.callId })
    socket.emit(SOCKET.Emitters.Toggle_Video, {
      callId: this.callState.callId,
      isVideoEnabled: this.callState.isVideoEnabled,
    })
  }

  this.notifyState()
  this.notifyParticipants()
}

  private resetState() {
    this.peerConnections.forEach((pc) => {
      try { 
        pc.getSenders().forEach(sender => {
          if (sender.track) {
            sender.track.stop();
          }
        });
        pc.close(); 
      } catch (e) {}
    });
    this.peerConnections.clear();
    this.pendingIce.clear();
    
    if (this.callState.localStream) {
      this.callState.localStream.getTracks().forEach(track => {
        try { 
          track.stop();
          this.callState.localStream?.removeTrack(track);
        } catch (e) {}
      });
    }
    if (this.callState.screenShareStream) {
      this.callState.screenShareStream.getTracks().forEach(track => {
        try { 
          track.stop();
          this.callState.screenShareStream?.removeTrack(track);
        } catch (e) {}
      });
    }
    
    this.callState = {
      ...initialCallState,
      participants: new Map()
    };
    this.notifyState();
    this.notifyParticipants();
  }

  private notifyState() {
    // Stop all ringtones when call status changes to 'connected'
    if (this.callState.callStatus === 'connected') {
      NotificationService.stopAllSounds();
    }
    
    const snap = { ...this.callState };
    this.stateCallbacks.forEach(cb => cb(snap));
  }
  
  declineWaitingCall() {
    if (!this.callState.waitingIncoming) return;
    this.callState.waitingIncoming = null;
    NotificationService.stopAllSounds();
    this.notifyState();
  }

  private notifyParticipants() {
    const freshMap = new Map<string, CallParticipant>();
    
    if (this.callState.currentUserId) {
      this.callState.participants.forEach((participant) => {
        const participantId = String(participant.userId);
        
        if (participant.name && !freshMap.has(participantId)) {
          freshMap.set(participantId, {
            ...participant,
            userId: participantId,
          });
        }
      });
      
      this.callState.participants = freshMap;
    }
    
    const callbackMap = new Map<string, CallParticipant>();
    (this.callState.participants || new Map()).forEach((participant, key) => {
      callbackMap.set(key, { ...participant });
    });
    
    this.participantCallbacks.forEach(cb => cb(callbackMap));
  }

  private normalizeParticipants(participants: Map<string, CallParticipant>, currentUserId: string | null): Map<string, CallParticipant> {
    if (!currentUserId) return new Map();
    
    const normalized = new Map<string, CallParticipant>();
    const seenIds = new Set<string>();
    
    participants.forEach((participant) => {
      const participantId = String(participant.userId);
      
      if (seenIds.has(participantId) || !participant.name) {
        console.warn(`Skipping duplicate or invalid participant: ${participantId}`);
        return;
      }
      
      seenIds.add(participantId);
      normalized.set(participantId, {
        ...participant,
        userId: participantId,
        stream: participant.stream || null,
      });
    });
    return normalized;
  }

  private handleMediaError(error: any, includeVideo: boolean): string {
    console.error('Media access error:', error);
    
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return includeVideo 
        ? 'Camera or microphone not found. Please check your devices.'
        : 'Microphone not found. Please check your device connection.';
    } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return 'Permission denied. Please allow access to your microphone in browser settings.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'Device is already in use by another application.';
    } else if (error.name === 'OverconstrainedError') {
      return 'Unable to satisfy device constraints. Try with different settings.';
    } else {
      return 'Failed to access media devices. Please check your permissions.';
    }
  }

  // Update the getUserMedia method to throw errors with messages
  private async getUserMedia(includeVideo: boolean): Promise<MediaStream | null> {
    if (this.callState.localStream) {
      this.callState.localStream.getTracks().forEach(track => {
        try {
          track.stop();
          this.callState.localStream?.removeTrack(track);
        } catch (e) {}
      });
    }
    if (this.callState.screenShareStream) {
      this.callState.screenShareStream.getTracks().forEach(track => {
        try {
          track.stop();
          this.callState.screenShareStream?.removeTrack(track);
        } catch (e) {}
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const constraints: MediaStreamConstraints = {
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: includeVideo
          ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
          : false,
      };
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error: any) {
      // If video failed, try audio only
      if (includeVideo) {
        try {
          await new Promise(resolve => setTimeout(resolve, 100));
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          toaster('warn', 'Camera not found. Continuing with audio only.');
          return audioStream;
        } catch (audioError: any) {
          const errorMsg = this.handleMediaError(audioError, false);
          toaster('error', errorMsg);
          return null;
        }
      } else {
        // Audio-only call failed
        const errorMsg = this.handleMediaError(error, false);
        toaster('error', errorMsg);
        return null;
      }
    }
  }

  private async createPeerConnection(remoteUserId: string) {
    const pc = new RTCPeerConnection(this.rtcConfig);
    
    pc.onicecandidate = ev => {
      if (ev.candidate && this.callState.callId) {
        socket.emit(SOCKET.Emitters.Ice_Candidate, {
          callId: this.callState.callId,
          targetUserId: remoteUserId,
          candidate: ev.candidate,
        });
      }
    };

    pc.ontrack = ev => {
      const [stream] = ev.streams;
      
      if (!stream) {
        console.warn(`No stream received for ${remoteUserId}`);
        return;
      }
      
      const remoteUserIdStr = String(remoteUserId);
      const existingParticipant = this.callState.participants.get(remoteUserIdStr);
      const updatedParticipant: CallParticipant = {
        userId: remoteUserIdStr,
        socketId: existingParticipant?.socketId ?? '',
        name: existingParticipant?.name ?? '',
        avatar: existingParticipant?.avatar ?? null,
        isVideoEnabled: existingParticipant?.isVideoEnabled ?? true,
        isAudioEnabled: existingParticipant?.isAudioEnabled ?? true,
        stream: stream,
        joinedAt: existingParticipant?.joinedAt ?? new Date(),
      };
      this.callState.participants.set(remoteUserIdStr, updatedParticipant);
      
      if (this.callState.currentUserId) {
        this.callState.participants = this.normalizeParticipants(
          this.callState.participants, 
          this.callState.currentUserId
        );
      }
      
      this.notifyParticipants();
      this.notifyState();
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        console.error(`ICE connection failed for ${remoteUserId}`);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state for ${remoteUserId}:`, pc.connectionState);
    };

    if (this.callState.localStream) {
      this.callState.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.callState.localStream!);
      });
    }
    
    this.peerConnections.set(remoteUserId, pc);
    return pc;
  }

  private async sendOffer(toUserId: string) {
    const pc = this.peerConnections.get(toUserId);
    if (!pc) {
      console.warn(`No peer connection found for ${toUserId}`);
      return;
    }

    try {
      const offer = await pc.createOffer({ 
        offerToReceiveAudio: true, 
        offerToReceiveVideo: true 
      });
      
      
      await pc.setLocalDescription(offer);
      
      socket.emit(SOCKET.Emitters.Webrtc_Offer, {
        callId: this.callState.callId,
        targetUserId: toUserId,
        offer,
      });
      
    } catch (e) {
      console.error(`Failed to create/send offer to ${toUserId}:`, e);
    }
  }

  private async flushIce(userId: string) {
    const pc = this.peerConnections.get(userId);
    if (!pc) return;
    const list = this.pendingIce.get(userId);
    if (!list) return;
    for (const c of list) await pc.addIceCandidate(c);
    this.pendingIce.delete(userId);
  }

  private setupSocket() {
    socket.on('incoming-call', (data: any) => {
      if (this.callState.isInCall && this.callState.callStatus === 'connected') {
        this.setWaitingIncomingCall(data);
        return;
      }
      
      // Stop any existing ringtones before handling new incoming call
      NotificationService.stopAllSounds();
      
      const { id, call_type, call_mode, initiator, receiver_id, group_id } = data || {};
      this.callState = {
        ...initialCallState,
        callId: String(id),
        callType: call_type === 'video' ? 'video' : 'audio',
        chatType: call_mode === 'direct' ? ChatType.DM : ChatType.group,
        chatId: call_mode === 'direct' ? receiver_id : group_id,
        chatName: initiator?.name ?? null,
        callStatus: 'ringing',
        isVideoEnabled: call_type === 'video',
        participants: new Map(),
        currentUserId: null,
      };

      const uid = String(initiator?.id ?? initiator?.userId);
      this.callState.participants.set(uid, {
        userId: uid,
        socketId: '',
        name: initiator?.name,
        avatar: initiator?.avatar,
        isVideoEnabled: this.callState.isVideoEnabled,
        isAudioEnabled: true,
        stream: null,
        joinedAt: new Date(),
      });

      NotificationService.notifyIncomingCall({
        title: `${initiator?.name ?? 'Incoming call'}`,
        body: `Incoming ${this.callState.callType} call`,
        tag: `call-${this.callState.callId}`,
      });

      this.ringingTimer = setTimeout(() => {
        if (this.callState.callStatus === 'ringing') this.declineCall(this.callState.callId!);
      }, 20_000);

      this.notifyState();
      this.notifyParticipants();
    });

    socket.on('call-participants-sync', (data: any) => {
      const { callId, participants } = data || {};
      if (!this.callState.callId || callId !== this.callState.callId) return;

      const localUserId = this.callState.currentUserId;
      if (!localUserId) return;

      const localEntry = this.callState.participants.get(localUserId);
      if (!localEntry) return;

      const remoteMap = new Map<string, CallParticipant>();

      (participants || []).forEach((p: any) => {
        const uid = String(p.userId);
        const localUserIdStr = String(localUserId);
        
        if (uid === localUserIdStr) {
          return;
        }

        const existingParticipant = this.callState.participants.get(uid);
        if (existingParticipant && uid === localUserIdStr) {
          return;
        }

        remoteMap.set(uid, {
          userId: uid,
          socketId: p.socketId ?? '',
          name: p.name ?? '',
          avatar: p.avatar ?? null,
          isVideoEnabled: p.isVideoEnabled ?? false,
          isAudioEnabled: p.isAudioEnabled ?? true,
          isScreenSharing: p.isScreenSharing ?? false,
          stream: existingParticipant?.stream ?? null,
          joinedAt: new Date(p.joinedAt ?? Date.now()),
        });
      });

      const mergedParticipants = new Map(this.callState.participants);
      
      remoteMap.forEach((participant, uid) => {
        const uidStr = String(uid);
        if (uidStr !== String(localUserId)) {
          const existing = mergedParticipants.get(uidStr);
          if (existing) {
            mergedParticipants.set(uidStr, {
              ...participant,
              stream: existing.stream || participant.stream,
            });
          } else {
            mergedParticipants.set(uidStr, participant);
          }
        }
      });
      
      this.callState.participants = this.normalizeParticipants(mergedParticipants, localUserId);

      this.notifyParticipants();
      this.notifyState();
    });

    socket.on('participant-joined', async (data: any) => {
      const { callId, userId, user } = data || {};
      if (callId !== this.callState.callId) return;

      const uid = String(userId ?? user?.userId);
      const localUserId = String(this.callState.currentUserId);

      if (uid === localUserId) {
        console.warn('Received participant-joined for self, skipping');
        return;
      }

      const existingParticipant = this.callState.participants.get(uid)
      this.callState.participants.set(uid, {
        userId: uid,
        socketId: user?.socketId ?? existingParticipant?.socketId ?? '',
        name: user?.name ?? existingParticipant?.name ?? '',
        avatar: user?.avatar ?? existingParticipant?.avatar ?? null,
        isVideoEnabled: user?.isVideoEnabled ?? existingParticipant?.isVideoEnabled ?? false,
        isAudioEnabled: user?.isAudioEnabled ?? existingParticipant?.isAudioEnabled ?? true,
        stream: existingParticipant?.stream ?? null,
        joinedAt: existingParticipant?.joinedAt ?? new Date(),
      });
      if (!this.callState.isInitiator) {
        if (!this.peerConnections.has(uid)) {
          await this.createPeerConnection(uid);
        }
      }

      this.callState.participants = this.normalizeParticipants(this.callState.participants, localUserId);

      this.notifyParticipants();
      this.notifyState();
    });

    socket.on('call-accepted', async (data: any) => {
      // Stop all ringtones when call is accepted (for both initiator and receiver)
      NotificationService.stopAllSounds();
      this.callState.callStatus = 'connected';
      if (!this.callState.callStartTime) this.callState.callStartTime = new Date();
      const acceptedUserId = String(data?.userId);
      if (acceptedUserId && !this.peerConnections.has(acceptedUserId)) {
        await this.createPeerConnection(acceptedUserId);
        await this.sendOffer(acceptedUserId);
      }
      
      if (this.callState.currentUserId) {
        this.callState.participants = this.normalizeParticipants(this.callState.participants, this.callState.currentUserId);
      }
      
      this.notifyState();
      this.notifyParticipants();
    });

    socket.on(SOCKET.Emitters.Webrtc_Offer, async (data: any) => {
      const { offer, fromUserId } = data;
      const fromUserIdStr = String(fromUserId);
      
      
      let pc = this.peerConnections.get(fromUserIdStr);
      if (!pc) {
        pc = await this.createPeerConnection(fromUserIdStr);
      }
      
      try {
        await pc!.setRemoteDescription(new RTCSessionDescription(offer));
        
        await this.flushIce(fromUserIdStr);
        
        const answer = await pc!.createAnswer();
        
        await pc!.setLocalDescription(answer);
        
        socket.emit(SOCKET.Emitters.Webrtc_Answer, {
          callId: this.callState.callId,
          targetUserId: fromUserId,
          answer,
        });
        
      } catch (e) {
        console.error(`Error handling offer from ${fromUserIdStr}:`, e);
      }
    });

    socket.on(SOCKET.Emitters.Webrtc_Answer, async (data: any) => {
      const { answer, fromUserId } = data;
      const fromUserIdStr = String(fromUserId);
      const pc = this.peerConnections.get(fromUserIdStr);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));   
          await this.flushIce(fromUserIdStr);
        } catch (e) {
          console.error(`Error handling answer from ${fromUserIdStr}:`, e);
        }
      } else {
        console.warn(`No peer connection found for answer from ${fromUserIdStr}`);
      }
    });

    socket.on(SOCKET.Emitters.Ice_Candidate, async (data: any) => {
      const { candidate, fromUserId } = data;
      const fromUserIdStr = String(fromUserId);
      const pc = this.peerConnections.get(fromUserIdStr);
      
      if (!pc) {
        if (!this.pendingIce.has(fromUserIdStr)) this.pendingIce.set(fromUserIdStr, []);
        this.pendingIce.get(fromUserIdStr)!.push(new RTCIceCandidate(candidate));
        return;
      }
      
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error(`Error adding ICE candidate from ${fromUserIdStr}:`, e);
      }
    });

    socket.on('participant-left', (data) => {
      const { callId, userId } = data;
      if (callId !== this.callState.callId) return;
      const userIdStr = String(userId);
      if (this.callState.participants.has(userIdStr)) {
        this.callState.participants.delete(userIdStr);
        const pc = this.peerConnections.get(userIdStr);
        if (pc) {
            pc.close();
            this.peerConnections.delete(userIdStr);
        }
        this.notifyParticipants();
        this.notifyState();
      }
    });

    socket.on('participant-toggle-audio', (data: any) => {
      const { callId, userId, isAudioEnabled } = data;
      if (callId !== this.callState.callId) return;

      const userIdStr = String(userId);
      const participant = this.callState.participants.get(userIdStr);
      if (participant) {
        this.callState.participants.set(userIdStr, {
          ...participant,
          isAudioEnabled: isAudioEnabled,
        });
        this.callState.participants = this.normalizeParticipants(this.callState.participants, this.callState.currentUserId);
        this.notifyParticipants();
        this.notifyState();
      }
    });

    socket.on('participant-toggle-video', (data: any) => {
      const { callId, userId, isVideoEnabled } = data;
      if (callId !== this.callState.callId) return;

      const userIdStr = String(userId);
      const participant = this.callState.participants.get(userIdStr);
      if (participant) {
        this.callState.participants.set(userIdStr, {
          ...participant,
          isVideoEnabled: isVideoEnabled,
        });
        this.callState.participants = this.normalizeParticipants(this.callState.participants, this.callState.currentUserId);
        this.notifyParticipants();
        this.notifyState();
      }
    });

    socket.on('participant-screen-share-started', (data: any) => {
      const { callId, userId, isScreenSharing } = data;
      if (callId !== this.callState.callId) return;

      const userIdStr = String(userId);
      const participant = this.callState.participants.get(userIdStr);
      if (participant) {
        participant.isScreenSharing = isScreenSharing;
        this.callState.participants.set(userIdStr, { ...participant });
        this.notifyParticipants();
        this.notifyState();
      }
    });

    socket.on('participant-screen-share-stopped', (data: any) => {
      const { callId, userId, isScreenSharing } = data;
      if (callId !== this.callState.callId) return;

      const userIdStr = String(userId);
      const participant = this.callState.participants.get(userIdStr);
      if (participant) {
        participant.isScreenSharing = isScreenSharing;
        this.callState.participants.set(userIdStr, { ...participant });
        this.notifyParticipants();
        this.notifyState();
      }
    });

    socket.on('force-stop-screen-share', async (data: any) => {
      const { callId } = data;
      if (this.callState.callId === callId && this.callState.isScreenSharing) {
        toaster('info', 'Someone else has started screen sharing');
        await this.stopScreenShare();
      }
    });

    socket.on(SOCKET.Listeners.Call_Ended, () => this.endCall());
  }

   private setupPageUnloadHandler() {
    window.addEventListener('beforeunload', () => {
      if (this.callState.isInCall && this.callState.callId) {
        const apiUrl = URL_KEYS.Call.End;
        
        const payload = JSON.stringify({
          callId: this.callState.callId
        });
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(apiUrl, blob);
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.callState.isInCall) {
        console.log('Tab hidden while in call');
      }
    });
  }
}

export const webrtcService = new WebRTCService();
export default webrtcService;