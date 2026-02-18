import { useEffect, useRef, useState } from 'react'
import { queries } from '../../../../../../api'
import { decryptMessageIfNeeded } from '../../../../../../utils/e2e-helpers'

interface DecryptedMessageProps {
  message: any
  children: (decryptedContent: string) => React.ReactNode
}

const DecryptedMessage: React.FC<DecryptedMessageProps> = ({ message, children }) => {
  const { data: currentUserData } = queries.useGetUserDetails()
  const currentUser = currentUserData?.user
  const isSent = !!currentUser?.id && (message.sender?.id === currentUser.id || message.sender_id === currentUser.id)
  const [decryptedContent, setDecryptedContent] = useState<string>('')
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [decryptionError, setDecryptionError] = useState<string | null>(null)
  const hasDecryptedRef = useRef<{ messageId: string; content: string } | null>(null)

  const looksEncrypted = (content: string): boolean => {
    if (!content) return false
    if (content.startsWith('U2FsdGVk')) return true
    try {
      const parsed = JSON.parse(content)
      return (
        parsed &&
        typeof parsed === 'object' &&
        (('encryptedKey' in parsed && 'iv' in parsed && 'encryptedData' in parsed) ||
          ('sender' in parsed && 'recipient' in parsed) ||
          ('sender' in parsed && 'members' in parsed && typeof parsed.members === 'object'))
      )
    } catch {
      return false
    }
  }

  const lastLoggedMessageId = useRef<string | undefined>(undefined)
  if (lastLoggedMessageId.current !== message.id) {
    lastLoggedMessageId.current = message.id
  }

  useEffect(() => {
    const content = message.content || ''
    const messageId = message.id
    const isEncrypted =
      message.is_encrypted === true ||
      message.is_encrypted === 1 ||
      message.is_encrypted === 'true' ||
      message.is_encrypted === '1'

    if (hasDecryptedRef.current?.messageId === messageId && hasDecryptedRef.current?.content === content) {
      return
    }

    let isEncryptedFormat = false
    let isDualEncryptedFormat = false
    
    if (content.startsWith('U2FsdGVk')) {
      isEncryptedFormat = true
    } else {
      try {
        const parsed = JSON.parse(content)
  
        if (
          parsed &&
          typeof parsed === 'object' &&
          'sender' in parsed &&
          'members' in parsed &&
          typeof parsed.members === 'object'
        ) {
          isDualEncryptedFormat = true
          isEncryptedFormat = true
        } else if (parsed && typeof parsed === 'object' && 'sender' in parsed && 'recipient' in parsed) {
          isDualEncryptedFormat = true
          isEncryptedFormat = true
        } else if (
          parsed &&
          typeof parsed === 'object' &&
          'encryptedKey' in parsed &&
          'iv' in parsed &&
          'encryptedData' in parsed
        ) {
          isEncryptedFormat = true
        }
      } catch {
        isEncryptedFormat = false
        isDualEncryptedFormat = false
      }
    }

    const shouldDecrypt = isEncrypted || isEncryptedFormat

    if (!shouldDecrypt) {
      if (decryptedContent !== content) {
        setDecryptedContent(content)
      }
      setDecryptionError(null)
      hasDecryptedRef.current = { messageId, content }
      return
    }

    if (decryptedContent === '' || decryptedContent === content) {
      setDecryptedContent('')
    }

    const decryptContent = async (retryAttempt = 0) => {
      if (isDecrypting && retryAttempt === 0) {
        return
      }
      
      if (retryAttempt === 0) {
        setIsDecrypting(true)
        setDecryptionError(null)
      }

      try {
        const decrypted = await decryptMessageIfNeeded(
          content,
          shouldDecrypt,
          isSent,
          message.sender?.id || message.sender_id,
          message.isForwarded,
          currentUser?.id,
          isDualEncryptedFormat,
        )
        
        // Validate decrypted content
        if (decrypted && decrypted.trim() && !decrypted.startsWith('[') && !decrypted.includes('Encrypted message')) {
          setDecryptedContent(decrypted)
          setDecryptionError(null)
          hasDecryptedRef.current = { messageId, content }
          setIsDecrypting(false)
          return
        } else {
          throw new Error('Decryption returned invalid content')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const isRSAError =
          errorMessage.includes('RSA decryption failed') || errorMessage.includes('private key may not match')

        let isDualEncrypted = false
        try {
          const parsed = JSON.parse(content)
          isDualEncrypted = parsed && typeof parsed === 'object' && 'sender' in parsed && ('recipient' in parsed || 'members' in parsed)
        } catch {}

        // Check if it's a key mismatch (old messages with regenerated keys) - no retry for these
        const isKeyMismatch = isRSAError && !isDualEncrypted
        
        if (isKeyMismatch) {
          setDecryptionError(null)
          setDecryptedContent('[Encrypted message]')
          hasDecryptedRef.current = { messageId, content }
          setIsDecrypting(false)
          return
        }

        // For other errors, retry once after a short delay (in case key is still loading)
        if (retryAttempt === 0) {
          setTimeout(() => {
            decryptContent(1) // Retry attempt
          }, 500)
          return
        }

        setDecryptionError(null)
        setDecryptedContent('[Encrypted message]')
        hasDecryptedRef.current = { messageId, content }
        setIsDecrypting(false)
      }
    }

    decryptContent()
  }, [message.content, message.is_encrypted, message.id])

  if (isDecrypting) {
    return <>{children('Decrypting...')}</>
  }

  if (decryptionError) {
    return <>{children('[Encrypted message]')}</>
  }

  if (!decryptedContent) {
    const content = message.content || ''
    const isContentEncrypted = message.is_encrypted || looksEncrypted(content)

    if (isContentEncrypted) {
      return <>{children('Decrypting...')}</>
    }
    return <>{children(content)}</>
  }
  return <>{children(decryptedContent)}</>
}

export default DecryptedMessage
