import { useEffect, useState } from 'react'
import { decryptMessageIfNeeded } from '../../../../../utils/e2e-helpers'
import { queries } from '../../../../../api'
import type { Message } from '../../../../../types/api'
import { LastMessage } from '../../../../../types/components/chat'

interface DecryptedMessagePreviewProps {
  message: Message | null | undefined | LastMessage
  fallback?: string
  maxLength?: number
  className?: string
}

const DecryptedMessagePreview: React.FC<DecryptedMessagePreviewProps> = ({
  className,
  message, 
  fallback = 'No messages yet',
  maxLength = 35
}) => {
  const { data: currentUserData } = queries.useGetUserDetails()
  const currentUser = currentUserData?.user
  const [decryptedContent, setDecryptedContent] = useState<string>('')
  const [isDecrypting, setIsDecrypting] = useState(false)

  useEffect(() => {
    const decryptContent = async () => {
      if (message?.isDeleted || message?.isDeletedForEveryone) {
        setDecryptedContent('This message was deleted')
        return
      }

      if (!message?.content) {
        setDecryptedContent(fallback)
        return
      }

      const content = message.content
      const isEncrypted = message.is_encrypted === true || message.is_encrypted === 1 || message.is_encrypted === 'true' || message.is_encrypted === '1'
      
      // Check if content looks encrypted
      let isEncryptedFormat = false
      if (content.startsWith('U2FsdGVk')) {
        isEncryptedFormat = true
      } else {
        try {
          const parsed = JSON.parse(content)
          if (parsed && typeof parsed === 'object' && 
            (('encryptedKey' in parsed && 'iv' in parsed && 'encryptedData' in parsed) ||
             ('sender' in parsed && 'recipient' in parsed) ||
             ('sender' in parsed && 'members' in parsed && typeof parsed.members === 'object'))) {
            isEncryptedFormat = true
          }
        } catch {}
      }

      const shouldDecrypt = isEncrypted || isEncryptedFormat

      if (!shouldDecrypt) {
        const displayContent = content === 'Sticker' ? 'Sticker' : content
        setDecryptedContent(displayContent.length > maxLength ? `${displayContent.substring(0, maxLength)}...` : displayContent)
        return
      }

      const decryptWithRetry = async (attempt = 0) => {
        if (attempt === 0) {
          setIsDecrypting(true)
        }

        try {
          const isSent = !!currentUser?.id && (message.sender?.id === currentUser.id || message.sender_id === currentUser.id)
          const decrypted = await decryptMessageIfNeeded(
            content,
            shouldDecrypt,
            isSent,
            message.sender?.id || message.sender_id,
            message.isForwarded,
            currentUser?.id
          )
          
          // Validate decrypted content
          if (decrypted && decrypted.trim() && 
              !decrypted.startsWith('[') && 
              !decrypted.includes('Encrypted message')) {
            const displayContent = decrypted.length > maxLength ? `${decrypted.substring(0, maxLength)}...` : decrypted
            setDecryptedContent(displayContent)
            setIsDecrypting(false)
            return
          } else {
            throw new Error('Decryption returned invalid content')
          }
        } catch (error) {
          if (attempt === 0) {
            setTimeout(() => {
              decryptWithRetry(1)
            }, 500)
            return
          }
          
          setDecryptedContent('Encrypted message')
          setIsDecrypting(false)
        }
      }

      decryptWithRetry()
    }

    decryptContent()
  }, [message?.content, message?.is_encrypted, message?.id, message?.sender?.id, message?.sender_id, currentUser?.id, fallback, maxLength, message?.isDeleted, message?.isDeletedForEveryone])

  if (isDecrypting) {
    return <span>Decrypting...</span>
  }

  if (!decryptedContent) {
    return <span>{fallback}</span>
  }

  return <span className={className}>{decryptedContent}</span>
}

export default DecryptedMessagePreview
