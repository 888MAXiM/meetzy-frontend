import CryptoJS from 'crypto-js'
import { STORAGE_KEYS } from '../constants/storageKeys'
import { KEYS } from '../constants/keys'
import { CombinedErrorResponse, Message } from '../types/api'

export const getTokenFromUrl = () => {
  const hash = window.location.hash
  if (hash) {
    const hashParams = new URLSearchParams(hash.substring(1))
    const tokenFromHash = hashParams.get('token')
    if (tokenFromHash) {
      return tokenFromHash
    }
  }
  const params = new URLSearchParams(window.location.search)
  return params.get('token')
}

export const stringify = (value: unknown): string => {
  try {
    return JSON.stringify(value)
  } catch (err) {
    console.error('Stringify error:', err)
    return ''
  }
}

export const safeJsonParse = (jsonString: string): any => {
  let result = jsonString

  while (true) {
    if (typeof result === 'string') {
      try {
        const parsed = JSON.parse(result)
        result = parsed
      } catch {
        break
      }
    } else {
      break
    }
  }

  return result
}

export const getMetadata = (message: Message | undefined | null) => {
  try {
    if (!message) {
      return null
    }

    if (message?.metadata) {
      if (typeof message?.metadata === 'object') {
        return message?.metadata
      }
      if (typeof message?.metadata === 'string') {
        return safeJsonParse(message?.metadata) as Record<string, unknown>
      }
    }
    return null
  } catch (error) {
    console.error('Error parsing metadata:', error)
    return null
  }
}

export const getFileName = (message: Message) => {
  const metadata = getMetadata(message)
  return metadata?.original_filename || null
}

const getSecretKey = (): string => {
  const key = import.meta.env.VITE_STORAGE_SECRET_KEY
  if (!key) {
    throw new Error('VITE_STORAGE_SECRET_KEY is not defined in environment variables')
  }
  return key
}

export const getStorage = () => ({
  getItem: (key: string) => {
    const encryptedValue = localStorage.getItem(key)
    if (!encryptedValue) return null

    try {
      const secretKey = getSecretKey()
      const bytes = CryptoJS.AES.decrypt(encryptedValue, secretKey)
      const decryptedValue = bytes.toString(CryptoJS.enc.Utf8)

      try {
        return JSON.parse(decryptedValue)
      } catch {
        return decryptedValue
      }
    } catch (e) {
      console.error('Decryption error:', e)
      return null
    }
  },

  setItem: (key: string, value: unknown): void => {
    try {
      const secretKey = getSecretKey()
      const stringValue = stringify(value)
      const encryptedValue = CryptoJS.AES.encrypt(stringValue, secretKey).toString()
      localStorage.setItem(key, encryptedValue)
    } catch (e) {
      console.error('Encryption error:', e)
    }
  },

  removeItem: (key: string): void => localStorage.removeItem(key),
  clear: (): void => localStorage.clear(),
})

export const getToken = (): string | null => {
  const storage = getStorage()
  const token = storage.getItem(STORAGE_KEYS.TOKEN)

  return typeof token === 'string' ? token : null
}

export const dynamicNumber = (totalLength: number) => {
  return Array.from({ length: totalLength }, (_, index) => index + 1)
}

export const extractTextWithMentions = (deltaContent: string): string => {
  try {
    const delta = JSON.parse(deltaContent)

    if (!delta.ops || !Array.isArray(delta.ops)) {
      return deltaContent
    }

    let text = ''

    delta.ops.forEach((op: any) => {
      if (typeof op.insert === 'string') {
        text += op.insert
      } else if (op.insert?.mention) {
        const mentionText = `@${op.insert.mention.value || op.insert.mention.name || 'Unknown'}`
        text += mentionText
      }
    })

    return text.trim()
  } catch (error) {
    return deltaContent
  }
}

export const getPlainTextFromMessage = (content: string): string => {
  try {
    const delta = JSON.parse(content)

    if (!delta.ops || !Array.isArray(delta.ops)) {
      return content.replace(/<[^>]*>/g, '').trim()
    }

    return extractTextWithMentions(content)
  } catch (error) {
    return content.replace(/<[^>]*>/g, '').trim()
  }
}

export const getInitials = (str?: string) => {
  if (typeof str !== 'string' || str.trim() === '') {
    return 'NA'
  }
  return str
    .split(' ')
    .filter((word) => word.length)
    ?.slice(0, 1)
    .map((word) => word[0].toUpperCase())
    .join('')
}

export const formatDate = (
  date: Date | string | number,
  format: 'full' | 'long' | 'medium' | 'short' | string = 'medium',
  options?: {
    locale?: string
    timeZone?: string
    calendar?:
      | 'gregory'
      | 'buddhist'
      | 'chinese'
      | 'coptic'
      | 'ethiopic'
      | 'hebrew'
      | 'indian'
      | 'islamic'
      | 'iso8601'
      | 'japanese'
      | 'persian'
      | 'roc'
    numberingSystem?:
      | 'arab'
      | 'arabext'
      | 'bali'
      | 'beng'
      | 'deva'
      | 'fullwide'
      | 'gujr'
      | 'guru'
      | 'hanidec'
      | 'khmr'
      | 'knda'
      | 'laoo'
      | 'latn'
      | 'limb'
      | 'mlym'
      | 'mong'
      | 'mymr'
      | 'orya'
      | 'tamldec'
      | 'telu'
      | 'thai'
      | 'tibt'
    customFormat?: Intl.DateTimeFormatOptions
  },
): string => {
  try {
    const parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) return 'Invalid Date'

    const locale = options?.locale || 'en-US'
    const timeZone = options?.timeZone || undefined

    if (['full', 'long', 'medium', 'short'].includes(format)) {
      return parsedDate.toLocaleDateString(locale, {
        dateStyle: format as 'full' | 'long' | 'medium' | 'short',
        timeZone,
        calendar: options?.calendar,
        numberingSystem: options?.numberingSystem,
      })
    }

    if (typeof format === 'string') {
      const formatMap: Record<string, Intl.DateTimeFormatOptions> = {
        'YYYY-MM-DD': { year: 'numeric', month: '2-digit', day: '2-digit' },
        'DD/MM/YYYY': { day: '2-digit', month: '2-digit', year: 'numeric' },
        'MMM DD, YYYY': { year: 'numeric', month: 'short', day: 'numeric' },
        'MMMM D, YYYY': { year: 'numeric', month: 'long', day: 'numeric' },
        'YYYY-MM': { year: 'numeric', month: '2-digit' },
        Weekday: { weekday: 'long' },
      }

      const formatOptions = formatMap[format] ||
        options?.customFormat || {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }

      return parsedDate.toLocaleDateString(locale, {
        ...formatOptions,
        timeZone,
        calendar: options?.calendar,
        numberingSystem: options?.numberingSystem,
      })
    }

    return parsedDate.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone,
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid Date'
  }
}

export const formatTime = (
  time: Date | string | number,
  options?: {
    locale?: string
    hour12?: boolean
    showSeconds?: boolean
    timeStyle?: Intl.DateTimeFormatOptions['timeStyle']
    customFormat?: {
      hour?: 'numeric' | '2-digit'
      minute?: 'numeric' | '2-digit'
      second?: 'numeric' | '2-digit'
      hourCycle?: 'h11' | 'h12' | 'h23' | 'h24'
      timeZone?: string
    }
  },
): string => {
  try {
    const date = new Date(time)
    if (isNaN(date.getTime())) return 'Invalid Date'

    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: options?.hour12 ?? true,
    }

    if (options?.showSeconds) {
      defaultOptions.second = '2-digit'
    }

    if (options?.timeStyle) {
      return date.toLocaleTimeString(options?.locale || 'en-US', {
        timeStyle: options.timeStyle,
        hour12: options?.hour12,
        timeZone: options?.customFormat?.timeZone,
      })
    }

    return date.toLocaleTimeString(options?.locale || 'en-US', {
      ...defaultOptions,
      ...options?.customFormat,
    })
  } catch (error) {
    console.error('Error formatting time:', error)
    return 'Invalid Date'
  }
}

export const getPreferredTimeZone = (): string | undefined => {
  try {
    const stored = localStorage.getItem('selected_time_zone')
    if (stored) return stored
  } catch {
    // ignore storage errors
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export const formatDateTime = (
  date: Date | string | number,
  dateFormat: 'full' | 'long' | 'medium' | 'short' | string = 'medium',
  timeFormat: {
    locale?: string
    hour12?: boolean
    showSeconds?: boolean
    timeStyle?: Intl.DateTimeFormatOptions['timeStyle']
    customFormat?: {
      hour?: 'numeric' | '2-digit'
      minute?: 'numeric' | '2-digit'
      second?: 'numeric' | '2-digit'
      hourCycle?: 'h11' | 'h12' | 'h23' | 'h24'
      timeZone?: string
    }
  } = {},
  options?: {
    locale?: string
    timeZone?: string
    separator?: string
  },
): string => {
  try {
    const parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) return 'Invalid Date'

    const formattedDate = formatDate(parsedDate, dateFormat, {
      locale: options?.locale,
      timeZone: options?.timeZone || getPreferredTimeZone(),
    })

    const formattedTime = formatTime(parsedDate, {
      locale: timeFormat.locale || options?.locale,
      hour12: timeFormat.hour12,
      showSeconds: timeFormat.showSeconds,
      timeStyle: timeFormat.timeStyle,
      customFormat: {
        ...timeFormat.customFormat,
        timeZone: timeFormat.customFormat?.timeZone || options?.timeZone || getPreferredTimeZone(),
      },
    })

    return `${formattedDate}${options?.separator || ' '}${formattedTime}`
  } catch (error) {
    console.error('Error formatting date-time:', error)
    return 'Invalid Date'
  }
}

export const formatNumber = (value: number, decimalPlaces?: number, thousandSeparator = true): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
    useGrouping: thousandSeparator,
  }).format(value)
}

export const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ]

  for (const i of intervals) {
    const count = Math.floor(seconds / i.seconds)
    if (count >= 1) return `${count} ${i.label}${count > 1 ? 's' : ''} ago`
  }
  return 'just now'
}

export const getSelectedUserIdFromStorage = (): number | null => {
  try {
    const stored = localStorage.getItem(KEYS.SELECTED_USER_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export const saveSelectedUserIdToStorage = (userId: number | null) => {
  try {
    if (userId) {
      localStorage.setItem(KEYS.SELECTED_USER_KEY, JSON.stringify(userId))
    } else {
      localStorage.removeItem(KEYS.SELECTED_USER_KEY)
    }
  } catch (error) {
    console.error('Failed to save selected user:', error)
  }
}

export const formatChatDateTime = (
  dateString: string | Date,
  options?: {
    locale?: string
    use24Hour?: boolean
    shortYear?: boolean
    timeZone?: string
  },
): string => {
  try {
    const messageDate = new Date(dateString)
    if (isNaN(messageDate.getTime())) return ''

    const now = new Date()
    const diffMs = now.getTime() - messageDate.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    const locale = options?.locale || 'en-US'
    const timeZone = options?.timeZone || getPreferredTimeZone()
    const hour12 = !(options?.use24Hour ?? false)

    const isSameDay = (date1: Date, date2: Date) => {
      return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
      )
    }

    if (diffSeconds < 60) {
      return 'just now'
    }

    if (isSameDay(messageDate, now)) {
      return messageDate.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12,
        timeZone,
      })
    }

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (isSameDay(messageDate, yesterday)) {
      return 'Yesterday'
    }

    if (diffDays < 7) {
      return messageDate.toLocaleDateString(locale, {
        weekday: 'long',
        timeZone,
      })
    }

    if (messageDate.getFullYear() === now.getFullYear()) {
      const day = String(messageDate.getDate()).padStart(2, '0')
      const month = String(messageDate.getMonth() + 1).padStart(2, '0')
      const year =
        options?.shortYear !== false ? String(messageDate.getFullYear()).slice(-2) : messageDate.getFullYear()

      return `${day}/${month}/${year}`
    }

    const day = String(messageDate.getDate()).padStart(2, '0')
    const month = String(messageDate.getMonth() + 1).padStart(2, '0')
    const year = messageDate.getFullYear()

    return `${day}/${month}/${year}`
  } catch (error) {
    console.error('Error formatting chat date:', error)
    return ''
  }
}

export const formatChatDateTimeAdvanced = (
  dateString: string | Date,
  config?: {
    justNowThreshold?: number // seconds, default 60
    showTimeToday?: boolean // default true
    showYesterday?: boolean // default true
    showWeekday?: boolean // default true
    dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' // default 'DD/MM/YYYY'
    timeFormat?: '12h' | '24h' // default '12h'
    locale?: string
    timeZone?: string
  },
): string => {
  try {
    const messageDate = new Date(dateString)
    if (isNaN(messageDate.getTime())) return ''

    const now = new Date()
    const diffMs = now.getTime() - messageDate.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    const justNowThreshold = config?.justNowThreshold ?? 60
    const showTimeToday = config?.showTimeToday ?? true
    const showYesterday = config?.showYesterday ?? true
    const showWeekday = config?.showWeekday ?? true
    const dateFormat = config?.dateFormat ?? 'DD/MM/YYYY'
    const timeFormat = config?.timeFormat ?? '12h'
    const locale = config?.locale ?? 'en-US'
    const timeZone = config?.timeZone || getPreferredTimeZone()

    const isSameDay = (date1: Date, date2: Date) => {
      return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
      )
    }

    if (diffSeconds < justNowThreshold) {
      return 'just now'
    }

    if (isSameDay(messageDate, now)) {
      if (showTimeToday) {
        return messageDate.toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: timeFormat === '12h',
          timeZone,
        })
      }
      return 'Today'
    }

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (isSameDay(messageDate, yesterday) && showYesterday) {
      return 'Yesterday'
    }

    if (diffDays < 7 && showWeekday) {
      return messageDate.toLocaleDateString(locale, {
        weekday: 'long',
      })
    }

    const day = String(messageDate.getDate()).padStart(2, '0')
    const month = String(messageDate.getMonth() + 1).padStart(2, '0')
    const year = messageDate.getFullYear()
    const shortYear = String(year).slice(-2)

    const isCurrentYear = messageDate.getFullYear() === now.getFullYear()

    switch (dateFormat) {
      case 'MM/DD/YYYY':
        return isCurrentYear ? `${month}/${day}/${shortYear}` : `${month}/${day}/${year}`
      case 'YYYY-MM-DD':
        return isCurrentYear ? `${shortYear}-${month}-${day}` : `${year}-${month}-${day}`
      case 'DD/MM/YYYY':
      default:
        return isCurrentYear ? `${day}/${month}/${shortYear}` : `${day}/${month}/${year}`
    }
  } catch (error) {
    console.error('Error formatting chat date:', error)
    return ''
  }
}

export const getChatId = (user: any): number | undefined => {
  if (!user) return undefined
  return user.id || user.chat_id || user.user_id
}

export const isSingleEmoji = (text: string): number => {
  if (!text || text.trim().length === 0) return 0
  const cleanText = text.replace(/\s+/g, '')

  const emojiRegex =
    /^([\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}\u{2194}-\u{2199}\u{21A9}-\u{21AA}\u{231A}-\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}\u{FE0F}\u{200D}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}\u{1F1E6}-\u{1F1FF}\u{1FA70}-\u{1FAFF}\u{1F780}-\u{1F7FF}\u{1F3FB}-\u{1F3FF}]+)$/u
  if (!emojiRegex.test(cleanText)) return 0

  let graphemes: string[] = []
  // @ts-ignore
  if (typeof Intl?.Segmenter === 'function') {
    // @ts-ignore
    graphemes = Array.from(new Intl.Segmenter().segment(cleanText)).map((seg) => seg.segment)
  } else {
    graphemes = [...cleanText]
  }
  return graphemes.length
}

export const getErrorMessage = (error: CombinedErrorResponse): string => {
  if (Array.isArray(error.data)) {
    // DefaultErrorResponse case
    return error.data.length > 0 ? String(error.data[0]) : 'An error occurred'
  } else if (typeof error.data === 'object') {
    // FormErrorResponse case - get first field error
    const firstField = Object.keys(error.data)[0]
    if (firstField && error.data[firstField]?.[0]?.code) {
      return error.data[firstField][0].code
    }
  }
  return 'An error occurred'
}

export function isContentEncrypted(content: string): boolean {
  if (!content) return false
  if (content.trim().startsWith('U2FsdGVk')) return true
  try {
    const parsed = JSON.parse(content)
    return (
      parsed &&
      typeof parsed === 'object' &&
      (('encryptedKey' in parsed && 'iv' in parsed && 'encryptedData' in parsed) ||
        ('sender' in parsed && 'recipient' in parsed) ||
        ('sender' in parsed && 'members' in parsed))
    )
  } catch {
    return false
  }
}