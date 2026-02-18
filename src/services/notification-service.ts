import { ImagePath } from '../constants'
import {
  CallNotificationPayload,
  MessageNotificationPayload,
  SupportedAudioContext,
  WebkitWindow,
} from '../types/shared'

const SOUND_STORAGE_KEY = 'notificationSoundEnabled'
const BROWSER_NOTIFICATION_STORAGE_KEY = 'browserNotificationsEnabled'
const DEFAULT_NOTIFICATION_ICON = `${ImagePath}/logos/2.svg`
const INCOMING_CALL_RINGTONE_PATH = '/assets/audio/outgoing-call.mp3'
const OUTGOING_CALL_RINGTONE_PATH = '/assets/audio/outgoing-call.mp3'

type RingtoneType = 'incoming' | 'outgoing'

export class NotificationServiceClass {
  private audioContext: AudioContext | null = null
  private isInitialized = false
  private isSoundEnabled = true
  private isBrowserNotificationEnabled = false
  private isRinging = false
  private currentRingtoneType: RingtoneType | null = null
  private notificationFavicon: string | null = null
  private notificationHandlers = new Map<number, () => void>()
  private notificationCounter = 0
  
  // Web Audio API nodes for ringtones
  private incomingRingtoneBuffer: AudioBuffer | null = null
  private outgoingRingtoneBuffer: AudioBuffer | null = null
  private ringtoneSource: AudioBufferSourceNode | null = null
  private ringtoneGain: GainNode | null = null

  private static isTabHighlighted = false
  private static blinkInterval?: number
  private static originalTitle = ''
  private static originalFavicon = ''
  private static notificationFaviconIcon = ''
  private static visibilityHandler?: () => void
  private static focusHandler?: () => void
  private static unreadCount = 0
  private static lastMessageUser = ''
  private static lastMessageText = ''

  static updateNotificationFavicon(newFaviconUrl: string) {
    this.notificationFaviconIcon = newFaviconUrl
  }

  static updateOriginalFavicon(newFaviconUrl: string) {
    this.originalFavicon = newFaviconUrl
    if (!this.isTabHighlighted) {
      this.setFavicon(newFaviconUrl)
    }
  }

  static getCurrentFavicon(): string {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement
    return link?.href || ''
  }

  async initialize(): Promise<void> {
    if (typeof window === 'undefined') return

    if (!NotificationServiceClass.originalTitle) {
      NotificationServiceClass.originalTitle = document.title
    }

    if (this.isInitialized) return

    this.setupGlobalListeners()
    await this.ensureAudioContext()
    this.loadPreferences()
    await this.loadRingtoneBuffers() // Load both ringtones

    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission()
          this.isBrowserNotificationEnabled = permission === 'granted'
          this.persistBrowserPreference()
        } catch (error) {
          console.warn('Notification permission request failed:', error)
        }
      } else {
        this.isBrowserNotificationEnabled = Notification.permission === 'granted'
      }
    }

    this.isInitialized = true
  }

  private async loadRingtoneBuffers() {
    if (typeof window === 'undefined') return
    
    await this.ensureAudioContext()
    if (!this.audioContext) return

    // Load both ringtones in parallel
    const loadRingtone = async (path: string, name: string): Promise<AudioBuffer | null> => {
      try {
        const response = await fetch(path, {
          // Prevent browser from treating this as media playback
          headers: {
            'Accept': 'audio/*'
          }
        })
        const arrayBuffer = await response.arrayBuffer()
        const buffer = await this.audioContext!.decodeAudioData(arrayBuffer)
        // console.log(`${name} ringtone loaded successfully`)
        return buffer
      } catch (error) {
        console.error(`Failed to load ${name} ringtone:`, error)
        return null
      }
    }

    const [incomingBuffer, outgoingBuffer] = await Promise.all([
      loadRingtone(INCOMING_CALL_RINGTONE_PATH, 'Incoming call'),
      loadRingtone(OUTGOING_CALL_RINGTONE_PATH, 'Outgoing call')
    ])

    this.incomingRingtoneBuffer = incomingBuffer
    this.outgoingRingtoneBuffer = outgoingBuffer
  }

  private setupGlobalListeners() {
    if (NotificationServiceClass.visibilityHandler) {
      document.removeEventListener('visibilitychange', NotificationServiceClass.visibilityHandler)
    }
    if (NotificationServiceClass.focusHandler) {
      window.removeEventListener('focus', NotificationServiceClass.focusHandler)
    }

    NotificationServiceClass.visibilityHandler = () => {
      if (!document.hidden) {
        NotificationServiceClass.stopTabHighlight()
      }
    }

    NotificationServiceClass.focusHandler = () => {
      NotificationServiceClass.stopTabHighlight()
    }

    document.addEventListener('visibilitychange', NotificationServiceClass.visibilityHandler)
    window.addEventListener('focus', NotificationServiceClass.focusHandler)
  }

  getStatus() {
    return {
      soundEnabled: this.isSoundEnabled,
      browserNotificationEnabled: this.isBrowserNotificationEnabled,
      isInitialized: this.isInitialized,
      isTabHighlighted: NotificationServiceClass.isTabHighlighted,
      isRinging: this.isRinging,
      currentRingtoneType: this.currentRingtoneType,
    }
  }

  toggleSound(enabled: boolean) {
    this.isSoundEnabled = enabled
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SOUND_STORAGE_KEY, String(enabled))
    }
    if (!enabled) {
      this.stopCallRingtone()
    }
  }

  async toggleBrowserNotifications(enabled: boolean) {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    if (enabled && Notification.permission !== 'granted') {
      try {
        const permission = await Notification.requestPermission()
        this.isBrowserNotificationEnabled = permission === 'granted'
      } catch (error) {
        console.warn('Browser notification permission request failed:', error)
        this.isBrowserNotificationEnabled = false
      }
    } else {
      this.isBrowserNotificationEnabled = enabled && Notification.permission === 'granted'
    }

    this.persistBrowserPreference()
  }

  async notifyMessage(
    payload: MessageNotificationPayload & {
      skipSound?: boolean
      userName?: string
      messagePreview?: string
      unreadCount?: number
    },
  ) {
    await this.initialize()

    if (this.isSoundEnabled && !payload.skipSound) {
      await this.playTone(880, 0.12, 0.28)
      await this.playTone(660, 0.08, 0.22, 120)
    }

    if (typeof document !== 'undefined' && document.hidden) {
      const userName = payload.userName ?? payload.title ?? 'Unknown User'
      const messagePreview = payload.messagePreview ?? payload.body ?? 'New message'

      NotificationServiceClass.startTabHighlight(payload.unreadCount ?? 1, userName, messagePreview)
    }

    const shouldShowNotification =
      typeof document !== 'undefined'
        ? document.hidden || payload.forceNotification === true
        : payload.forceNotification === true

    if (shouldShowNotification) {
      await this.showBrowserNotification(
        payload.title,
        {
          body: payload.body,
          tag: payload.tag,
        },
        payload.onClick,
      )
    }
  }

  async notifyIncomingCall(payload: CallNotificationPayload) {
    await this.initialize()

    if (this.isSoundEnabled) {
      this.startCallRingtone('incoming')
    }

    await this.showBrowserNotification(
      payload.title,
      {
        body: payload.body ?? 'Incoming call',
        tag: payload.tag,
        requireInteraction: payload.requireInteraction ?? true,
      },
      () => {
        this.stopCallRingtone()
        payload.onClick?.()
      },
    )
  }

  async notifyOutgoingCall(payload: CallNotificationPayload) {
    await this.initialize()

    if (this.isSoundEnabled) {
      this.startCallRingtone('outgoing')
    }

    await this.showBrowserNotification(
      payload.title,
      {
        body: payload.body ?? 'Outgoing call',
        tag: payload.tag,
        requireInteraction: payload.requireInteraction ?? false,
      },
      () => {
        this.stopCallRingtone()
        payload.onClick?.()
      },
    )
  }

  static startTabHighlight(unreadCount: number = 1, userName: string = '', messagePreview: string = '') {
    this.unreadCount = unreadCount
    this.lastMessageUser = userName
    this.lastMessageText = messagePreview

    if (this.isTabHighlighted) {
      return
    }

    if (!this.originalFavicon) {
      this.originalFavicon = this.getCurrentFavicon()
    }

    if (!this.originalTitle) {
      this.originalTitle = document.title
    }

    this.isTabHighlighted = true
    let showNotification = true

    if (this.blinkInterval) {
      clearInterval(this.blinkInterval)
    }

    const getNotificationTitle = () => {
      const count = this.unreadCount
      const user = this.lastMessageUser || 'Unknown'
      const preview = this.lastMessageText || 'New message'

      const maxPreviewLength = 50
      const truncatedPreview =
        preview.length > maxPreviewLength ? preview.substring(0, maxPreviewLength) + '...' : preview

      if (count > 1) {
        return `(${count}) ${user}: ${truncatedPreview}`
      }
      return `${user}: ${truncatedPreview}`
    }

    document.title = getNotificationTitle()
    this.setFavicon(this.notificationFaviconIcon)

    this.blinkInterval = window.setInterval(() => {
      if (showNotification) {
        document.title = getNotificationTitle()
        this.setFavicon(this.notificationFaviconIcon)
      } else {
        document.title = this.originalTitle || 'Chat'
        if (this.originalFavicon) {
          this.setFavicon(this.originalFavicon)
        }
      }
      showNotification = !showNotification
    }, 1000)
  }

  static stopTabHighlight() {
    if (this.blinkInterval) {
      clearInterval(this.blinkInterval)
      this.blinkInterval = undefined
    }

    if (!this.originalFavicon) {
      this.originalFavicon = this.getCurrentFavicon()
    }

    document.title = this.originalTitle || 'Meetzy-Front'

    if (this.originalFavicon) {
      this.setFavicon(this.originalFavicon)
    }

    this.isTabHighlighted = false
    this.unreadCount = 0
    this.lastMessageUser = ''
    this.lastMessageText = ''
  }

  private static setFavicon(url: string) {
    if (!url) return

    const existingLinks = document.querySelectorAll("link[rel*='icon']")
    existingLinks.forEach((link) => link.remove())

    const getImageType = (url: string) => {
      const lower = url.toLowerCase()
      if (lower.includes('.png') || lower.startsWith('data:image/png')) return 'image/png'
      if (lower.includes('.svg')) return 'image/svg+xml'
      if (lower.includes('.ico')) return 'image/x-icon'
      if (lower.includes('.jpg') || lower.includes('.jpeg')) return 'image/jpeg'
      return 'image/png'
    }

    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = getImageType(url)
    link.href = url
    document.head.appendChild(link)
  }

  async showBrowserNotification(
    title: string,
    options?: NotificationOptions & { tag?: string },
    onClick?: () => void,
  ): Promise<Notification | null> {
    if (typeof window === 'undefined' || !('Notification' in window)) return null
    if (!this.isBrowserNotificationEnabled || Notification.permission !== 'granted') return null
    if (!document.hidden) return null

    try {
      const notification = new Notification(title, {
        icon: options?.icon ?? this.notificationFavicon ?? DEFAULT_NOTIFICATION_ICON,
        badge: options?.badge ?? this.notificationFavicon ?? DEFAULT_NOTIFICATION_ICON,
        silent: false,
        ...options,
      })

      const handlerId = ++this.notificationCounter
      if (onClick) {
        this.notificationHandlers.set(handlerId, onClick)
      }

      notification.onclick = (event) => {
        event.preventDefault()
        window.focus()
        NotificationServiceClass.stopTabHighlight()
        this.stopCallRingtone()
        const handler = this.notificationHandlers.get(handlerId)
        handler?.()
        notification.close()
        this.notificationHandlers.delete(handlerId)
      }

      notification.onclose = () => {
        this.notificationHandlers.delete(handlerId)
      }

      notification.onerror = (error) => {
        console.error('Notification error:', error)
        this.notificationHandlers.delete(handlerId)
      }

      if (!options?.requireInteraction) {
        setTimeout(() => {
          try {
            notification.close()
          } catch (error) {
            console.warn('Unable to close notification:', error)
          }
        }, 6000)
      }

      return notification
    } catch (error) {
      console.error('Notification creation failed:', error)
      return null
    }
  }

  startCallRingtone(type: RingtoneType = 'incoming') {
    if (this.isRinging && this.currentRingtoneType === type) {
      // console.log(`${type} ringtone is already playing`)
      return
    }
    
    if (!this.isSoundEnabled) {
      console.log('Sound is disabled')
      return
    }

    const ringtoneBuffer = type === 'incoming' ? this.incomingRingtoneBuffer : this.outgoingRingtoneBuffer

    if (!this.audioContext || !ringtoneBuffer) {
      console.error(`AudioContext or ${type} ringtone buffer not ready`)
      return
    }

    try {
      // Ensure AudioContext is running
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }

      // Stop any existing ringtone
      this.stopCallRingtone()

      // Create gain node for volume control
      this.ringtoneGain = this.audioContext.createGain()
      this.ringtoneGain.gain.value = 0.7
      this.ringtoneGain.connect(this.audioContext.destination)

      // Create and configure source
      this.ringtoneSource = this.audioContext.createBufferSource()
      this.ringtoneSource.buffer = ringtoneBuffer
      this.ringtoneSource.loop = true
      this.ringtoneSource.connect(this.ringtoneGain)
      
      // Add event listener to handle source end (shouldn't happen with loop=true, but good practice)
      this.ringtoneSource.onended = () => {
        // Don't reset state here, let stopCallRingtone() handle it
        console.log(`${type} ringtone source ended`)
      }
      
      // Start playing
      this.ringtoneSource.start(0)
      this.isRinging = true
      this.currentRingtoneType = type
      
      // Prevent the browser from suspending audio when tab is inactive
      // by keeping a reference and ensuring the audio context stays active
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }
      
      console.log(`${type} call ringtone started playing (Web Audio API)`)
    } catch (error) {
      console.error(`Failed to play ${type} call ringtone:`, error)
      this.isRinging = false
      this.currentRingtoneType = null
    }
  }

  stopCallRingtone() {
    if (this.ringtoneSource) {
      try {
        this.ringtoneSource.stop()
        this.ringtoneSource.disconnect()
      } catch (error) {
        console.warn('Failed to stop ringtone source:', error)
      }
      this.ringtoneSource = null
    }

    if (this.ringtoneGain) {
      try {
        this.ringtoneGain.disconnect()
      } catch (error) {
        console.warn('Failed to disconnect ringtone gain:', error)
      }
      this.ringtoneGain = null
    }

    this.isRinging = false
    this.currentRingtoneType = null
    console.log('Ringtone stopped')
  }

  stopAllSounds() {
    this.stopCallRingtone()
  }

  private async playTone(frequency: number, volume: number, duration: number, delayMs = 0) {
    await this.ensureAudioContext()
    if (!this.audioContext) return

    const ctx = this.audioContext
    const startTime = ctx.currentTime + delayMs / 1000
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, startTime)

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

    oscillator.start(startTime)
    oscillator.stop(startTime + duration + 0.05)
  }

  private async ensureAudioContext() {
    if (typeof window === 'undefined') return
    if (this.audioContext) {
      if (this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume()
        } catch (error) {
          console.warn('AudioContext resume failed:', error)
        }
      }
      return
    }

    try {
      const ctor: SupportedAudioContext | undefined = window.AudioContext || (window as WebkitWindow).webkitAudioContext
      if (!ctor) {
        console.warn('AudioContext is not supported in this browser')
        return
      }
      this.audioContext = new ctor()
      
      // Set up visibility change listener to keep audio playing in background
      this.setupAudioContextVisibilityHandler()
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume().catch((error) => console.warn('AudioContext resume failed:', error))
      }
    } catch (error) {
      console.warn('Unable to create AudioContext:', error)
      this.audioContext = null
    }
  }

  private setupAudioContextVisibilityHandler() {
    if (!this.audioContext) return

    // Keep audio playing when tab becomes hidden
    const handleVisibilityChange = () => {
      if (this.audioContext && this.audioContext.state === 'suspended' && this.isRinging) {
        this.audioContext.resume().catch((error) => {
          console.warn('Failed to resume AudioContext on visibility change:', error)
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Also handle page focus/blur
    const handleFocus = () => {
      if (this.audioContext && this.audioContext.state === 'suspended' && this.isRinging) {
        this.audioContext.resume().catch((error) => {
          console.warn('Failed to resume AudioContext on focus:', error)
        })
      }
    }

    window.addEventListener('focus', handleFocus)
  }

  private loadPreferences() {
    if (typeof localStorage === 'undefined') return

    const soundPref = localStorage.getItem(SOUND_STORAGE_KEY)
    if (soundPref !== null) {
      this.isSoundEnabled = soundPref === 'true'
    }

    const notificationPref = localStorage.getItem(BROWSER_NOTIFICATION_STORAGE_KEY)
    if (notificationPref !== null) {
      this.isBrowserNotificationEnabled = notificationPref === 'true'
    }
  }

  private persistBrowserPreference() {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(BROWSER_NOTIFICATION_STORAGE_KEY, String(this.isBrowserNotificationEnabled))
  }

  cleanup() {
    this.stopAllSounds()
    
    if (this.audioContext) {
      try {
        this.audioContext.close()
      } catch (error) {
        console.warn('Failed to close AudioContext:', error)
      }
      this.audioContext = null
    }
    
    this.incomingRingtoneBuffer = null
    this.outgoingRingtoneBuffer = null
  }
}

export const NotificationService = new NotificationServiceClass()
export default NotificationService
