import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from 'reactstrap'
import { SvgIcon } from '../../../../../shared/icons'
import { X } from 'react-feather'
import { toast } from 'react-toastify'

interface AudioRecorderProps {
  onDirectSend: (file: File) => Promise<void>
  onCancel: () => void
  disabled?: boolean
  autoStart?: boolean
}

const WAVE_BAR_COUNT = 60

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onDirectSend,
  onCancel,
  disabled = false,
  autoStart = false,
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const shouldSendAfterStopRef = useRef(false)

  const AUDIO_MIME_TYPE = 'audio/webm;codecs=opus'

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const stopMediaStream = useCallback(() => {
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const resetState = useCallback(() => {
    setAudioBlob(null)
    setAudioUrl(null)
    setIsRecording(false)
    setIsPaused(false)
    setRecordingTime(0)
    setIsPlaying(false)
    shouldSendAfterStopRef.current = false
    clearTimer()
    stopMediaStream()
    mediaRecorderRef.current = null
  }, [clearTimer, stopMediaStream])

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1)
    }, 1000) as unknown as number
  }, [])

  const createAudioFile = useCallback((blob: Blob) => {
    return new File([blob], `recording-${Date.now()}.webm`, { type: AUDIO_MIME_TYPE })
  }, [])

  const sendAudio = useCallback(
    async (blob: Blob, url: string | null) => {
      const audioFile = createAudioFile(blob)
      await onDirectSend(audioFile)
      if (url) URL.revokeObjectURL(url)
      resetState()
    },
    [createAudioFile, onDirectSend, resetState],
  )

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: AUDIO_MIME_TYPE })
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: AUDIO_MIME_TYPE })

        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setIsRecording(false)
        stopMediaStream()
        clearTimer()

        if (shouldSendAfterStopRef.current) {
          await sendAudio(blob, audioUrl)
        }
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setIsPaused(false)
      startTimer()
    } catch (error) {
      console.error('Microphone access error:', error)
      toast.error('Microphone not found. Please plug in your microphone and try again.')
      onCancel()
    }
  }, [clearTimer, sendAudio, startTimer, stopMediaStream, onCancel])

  const pauseResumeRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return

    if (isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      startTimer()
    } else {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      clearTimer()
    }
  }, [isPaused, startTimer, clearTimer])

  const deleteAudio = useCallback(() => {
    if (mediaRecorderRef.current && (isRecording || isPaused)) {
      mediaRecorderRef.current.stop()
    }
    resetState()
  }, [isRecording, isPaused, resetState])

  const playPauseAudio = useCallback(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const handleSend = useCallback(async () => {
    if (isRecording || isPaused) {
      if (mediaRecorderRef.current) {
        shouldSendAfterStopRef.current = true
        mediaRecorderRef.current.stop()
        setIsRecording(false)
        setIsPaused(false)
        clearTimer()
      }
    } else if (audioBlob) {
      await sendAudio(audioBlob, audioUrl)
    }
  }, [audioBlob, audioUrl, isRecording, isPaused, clearTimer, sendAudio])

  const handleCancel = useCallback(() => {
    deleteAudio()
    onCancel()
  }, [deleteAudio, onCancel])

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false)
  }, [])

  useEffect(() => {
    return () => {
      clearTimer()
      stopMediaStream()
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl, clearTimer, stopMediaStream])

  const showRecordingControls = isRecording || isPaused
  const showPlaybackControls = !isRecording && !isPaused && audioBlob
  const showAudioPreview = isRecording || isPaused || audioBlob

  useEffect(() => {
    if (autoStart && !isRecording && !audioBlob) {
      startRecording()
    }
  }, [autoStart])

  return (
    <div className={`audio-recorder-interface ${showAudioPreview ? 'switched' : ''}`}>
      {showAudioPreview && (
        <div className="audio-preview">
          <div className="waveform-placeholder">
            {Array.from({ length: WAVE_BAR_COUNT }).map((_, i) => (
              <div key={i} className={`wave-bar ${isRecording && !isPaused ? 'active' : ''}`} />
            ))}
          </div>
          <span className="recording-time">{formatTime(recordingTime)}</span>
          {audioBlob && !isRecording && (
            <audio
              ref={audioRef}
              src={audioUrl || ''}
              onEnded={handleAudioEnded}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              className="hidden-audio"
            />
          )}
        </div>
      )}

      <div className="audio-controls">
        {showRecordingControls && (
          <>
            {isPaused && audioBlob && (
              <Button
                className="audio-play-btn"
                onClick={playPauseAudio}
                size="sm"
                disabled={disabled}
                title={isPlaying ? 'Pause Preview' : 'Play Preview'}
              >
                <SvgIcon className="audio-icon" iconId={isPlaying ? 'pause' : 'play'} />
              </Button>
            )}

            <Button
              className="audio-pause-btn"
              disabled={disabled}
              color="transparent"
              onClick={pauseResumeRecording}
              size="lg"
              title={isPaused ? 'Resume Recording' : 'Pause Recording'}
            >
              <SvgIcon className="audio-icon" iconId={isPaused ? 'play' : 'pause'} />
            </Button>

            <Button
              className="audio-send-btn"
              onClick={handleSend}
              size="sm"
              color="transparent"
              disabled={disabled}
              title="Send Recording"
            >
              <SvgIcon className="audio-icon" iconId="send-btn" />
            </Button>
          </>
        )}

        {showPlaybackControls && (
          <>
            <Button
              className="audio-replay-btn"
              onClick={playPauseAudio}
              size="sm"
              color="transparent"
              disabled={disabled}
              title={isPlaying ? 'Pause Playback' : 'Play Recording'}
            >
              <SvgIcon className="audio-icon" iconId={isPlaying ? 'pause' : 'play'} />
            </Button>
            <Button
              className="audio-send-btn"
              onClick={handleSend}
              size="sm"
              disabled={disabled}
              title="Send Recording"
              color="transparent"
            >
              <SvgIcon className="audio-icon" iconId="send-btn" />
            </Button>
          </>
        )}

        <Button
          className="audio-cancel-btn"
          color="transparent"
          onClick={handleCancel}
          size="sm"
          disabled={disabled}
          title="Cancel Recording"
        >
          <X />
        </Button>
      </div>
    </div>
  )
}

export default AudioRecorder
