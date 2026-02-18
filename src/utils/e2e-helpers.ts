import { e2eEncryptionService } from '../services/e2e-encryption-service'
import apiClient from '../api/apiClient'
import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || ''

export const encryptMessageIfNeeded = async (
  content: string,
  recipientId: string | number | undefined,
  isGroupChat: boolean,
  isE2EEnabled: boolean,
  groupMembers?: Array<{ id: number  | string }>,
  currentUserId?: string | number | null,
): Promise<{ encryptedContent: string; isEncrypted: boolean }> => {
  if (!isE2EEnabled) {
    return { encryptedContent: content, isEncrypted: false }
  }

  if (isGroupChat && groupMembers && groupMembers.length > 0) {
    try {
      if (!currentUserId) {
        throw new Error('Cannot encrypt group message: current user ID is required but not provided')
      }

      let senderPublicKey: string | null = null
      try {
        const senderResponse = await apiClient.get(`/e2e/keys/${currentUserId}`)
        if (senderResponse.data?.public_key && senderResponse.data?.has_encryption) {
          senderPublicKey = senderResponse.data.public_key
        }
      } catch (error) {
        console.error('Failed to get sender public key:', error)
      }

      if (!senderPublicKey) {
        throw new Error('Sender does not have encryption keys. Please ensure your encryption keys are set up.')
      }

      const memberKeys = await Promise.all(
        groupMembers.map(async (member) => {
          if (member.id === currentUserId) {
            return null
          }
          try {
            const response = await apiClient.get(`/e2e/keys/${member.id}`)
            const data = response.data
            if (data.public_key && data.has_encryption) {
              return { userId: member.id, publicKey: data.public_key }
            }
            return null
          } catch (error) {
            return null
          }
        }),
      )

      const validMemberKeys = memberKeys.filter((key) => key !== null) as Array<{
        userId: number
        publicKey: string
      }>

      // Encrypt for sender
      const senderEncrypted = await e2eEncryptionService.encryptMessage(content, senderPublicKey)

      // Encrypt for each member
      const membersEncrypted: Record<string, string> = {}
      for (const memberKey of validMemberKeys) {
        try {
          const memberEncrypted = await e2eEncryptionService.encryptMessage(content, memberKey.publicKey)
          membersEncrypted[`user_${memberKey.userId}`] = memberEncrypted
        } catch (error) {
          console.error(`Failed to encrypt for member ${memberKey.userId}:`, error)
        }
      }

      if (validMemberKeys.length === 0) {
        console.warn('No group members (other than sender) have encryption enabled')
      }

      const groupEncrypted = {
        sender: senderEncrypted,
        members: membersEncrypted,
      }

      const encryptedContent = JSON.stringify(groupEncrypted)

      if (encryptedContent === content) {
        throw new Error('Encryption failed: content unchanged after encryption')
      }

      const finalContent = CryptoJS.AES.encrypt(encryptedContent, ENCRYPTION_KEY).toString()

      return { encryptedContent: finalContent, isEncrypted: true }
    } catch (error) {
      console.error('Error encrypting group message:', error)
      throw new Error(`Failed to encrypt group message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (!recipientId) {
    return { encryptedContent: content, isEncrypted: isE2EEnabled }
  }

  try {
    const response = await apiClient.get(`/e2e/keys/${recipientId}`)
    const data = response.data

    if (!data.public_key || !data.has_encryption) {
      console.warn('Recipient does not have encryption enabled, but E2E is required')
      if (!currentUserId) {
        throw new Error('Cannot encrypt message: current user ID is required but not provided')
      }
      try {
        const senderResponse = await apiClient.get(`/e2e/keys/${currentUserId}`)
        if (senderResponse.data?.public_key && senderResponse.data?.has_encryption) {
          const encryptedContent = await e2eEncryptionService.encryptMessage(content, senderResponse.data.public_key)

          if (encryptedContent === content) {
            throw new Error('Encryption failed: content unchanged after encryption')
          }
          const finalContent = CryptoJS.AES.encrypt(encryptedContent, ENCRYPTION_KEY).toString()
          return { encryptedContent: finalContent, isEncrypted: true }
        } else {
          throw new Error('Sender does not have encryption keys. Please ensure your encryption keys are set up.')
        }
      } catch (error) {
        console.error('Failed to encrypt with sender key:', error)
        throw error instanceof Error ? error : new Error('Failed to encrypt with sender key')
      }
    }

    if (!currentUserId) {
      throw new Error('Cannot encrypt message: current user ID is required but not provided')
    }

    const [senderResponse, recipientResponse] = await Promise.all([
      apiClient.get(`/e2e/keys/${currentUserId}`),
      apiClient.get(`/e2e/keys/${recipientId}`),
    ])

    if (!senderResponse.data?.public_key || !senderResponse.data?.has_encryption) {
      throw new Error('Sender does not have encryption keys. Please ensure your encryption keys are set up.')
    }

    if (!recipientResponse.data?.public_key || !recipientResponse.data?.has_encryption) {
      throw new Error('Recipient does not have encryption keys. Please ensure recipient has encryption set up.')
    }

    const [encryptedForSender, encryptedForRecipient] = await Promise.all([
      e2eEncryptionService.encryptMessage(content, senderResponse.data.public_key),
      e2eEncryptionService.encryptMessage(content, recipientResponse.data.public_key),
    ])
    
    const dualEncryptedContent = JSON.stringify({
      sender: encryptedForSender,
      recipient: encryptedForRecipient,
    })

    const finalContent = CryptoJS.AES.encrypt(dualEncryptedContent, ENCRYPTION_KEY).toString()

    return { encryptedContent: finalContent, isEncrypted: true }
  } catch (error) {
    console.error('Error encrypting message:', error)
    throw new Error(`Failed to encrypt message: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export const decryptMessageIfNeeded = async (
  content: string,
  isEncrypted: boolean | number | string,
  isSentMessage?: boolean,
  senderId?: number | string,
  isForwarded?: boolean,
  currentUserId?: number | string,
  isDualEncryptedFormat?: boolean,
): Promise<string> => {
  console.log('~ senderId:', senderId)
  console.log('isDualEncryptedFormat:', isDualEncryptedFormat)
  if (!isEncrypted) {
    return content
  }

  let encryptedData: string = content
  let isDualEncrypted = false
  let isGroupEncrypted = false

  // Unwrap CryptoJS encryption if present
  if (content.startsWith('U2FsdGVk')) {
    try {
      const bytes = CryptoJS.AES.decrypt(content, ENCRYPTION_KEY)
      const decryptedOuter = bytes.toString(CryptoJS.enc.Utf8)
      if (decryptedOuter) {
        encryptedData = decryptedOuter
      }
    } catch (e) {
      console.warn('Failed to unwrap outer encryption:', e)
    }
  }

  try {
    const parsed = JSON.parse(encryptedData)

    if (
      parsed &&
      typeof parsed === 'object' &&
      'sender' in parsed &&
      'members' in parsed &&
      typeof parsed.members === 'object'
    ) {
      isGroupEncrypted = true
      isDualEncrypted = true

      if (isSentMessage) {
        encryptedData = parsed.sender
      } else {
        if (currentUserId && parsed.members[`user_${currentUserId}`]) {
          encryptedData = parsed.members[`user_${currentUserId}`]
        } else {
          encryptedData = parsed.sender
        }
      }
    } else if (parsed && typeof parsed === 'object' && 'sender' in parsed && 'recipient' in parsed) {
      isDualEncrypted = true
      encryptedData = isSentMessage ? parsed.sender : parsed.recipient
    } else if (
      parsed &&
      typeof parsed === 'object' &&
      'encryptedKey' in parsed &&
      'iv' in parsed &&
      'encryptedData' in parsed
    ) {
      encryptedData = content
    } else {
      console.warn('Content does not appear to be encrypted format')
      return content
    }
  } catch (error) {
    console.warn('Failed to parse content as JSON, treating as plain text:', error)
    return content
  }

  let privateKey = e2eEncryptionService.getPrivateKey()
  if (!privateKey) {
    await new Promise(resolve => setTimeout(resolve, 100))
    privateKey = e2eEncryptionService.getPrivateKey()
    
    if (!privateKey) {
      console.error('No private key found after retry, cannot decrypt message')
      throw new Error(
        'No private key available for decryption. The message was encrypted but decryption keys are not available.',
      )
    }
  }

  try {
    const decryptedContent = await e2eEncryptionService.decryptMessage(encryptedData, privateKey)
    
    // Validate decrypted content
    if (!decryptedContent || !decryptedContent.trim()) {
      throw new Error('Decryption returned empty content')
    }
    
    try {
      const parsed = JSON.parse(decryptedContent)
      if (parsed && typeof parsed === 'object' && 
          (('encryptedKey' in parsed && 'encryptedData' in parsed) ||
           ('sender' in parsed && 'recipient' in parsed) ||
           ('sender' in parsed && 'members' in parsed))) {
        throw new Error('Decryption returned encrypted structure - invalid decryption')
      }
    } catch {
      // Not JSON, which is fine
    }
    
    return decryptedContent
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isRSAError =
      errorMessage.includes('RSA decryption failed') || errorMessage.includes('private key may not match')
    if (isDualEncrypted && isRSAError) {
      // Silent fallback attempt - don't log, just try the fallback
      try {
        const parsed = JSON.parse(content)

        if (isGroupEncrypted && parsed.members && typeof parsed.members === 'object') {
          const privateKey = e2eEncryptionService.getPrivateKey()
          if (privateKey) {
            for (const [memberUserId, memberEncryptedValue] of Object.entries(parsed.members)) {
              if (typeof memberEncryptedValue === 'string' && memberEncryptedValue.trim()) {
                try {
                  const decryptedContent = await e2eEncryptionService.decryptMessage(memberEncryptedValue, privateKey)
                  if (decryptedContent && decryptedContent.trim() && 
                      !decryptedContent.includes('"encryptedKey"') &&
                      !decryptedContent.includes('"encryptedData"') &&
                      !(decryptedContent.includes('"sender"') && decryptedContent.includes('"members"'))) {
                    console.log(`Successfully decrypted group message using member: ${memberUserId}`)
                    return decryptedContent
                  }
                } catch (memberError) {
                  continue
                }
              }
            }
            if (parsed.sender && typeof parsed.sender === 'string' && parsed.sender.trim()) {
              try {
                const decryptedContent = await e2eEncryptionService.decryptMessage(parsed.sender, privateKey)
                if (decryptedContent && decryptedContent.trim() &&
                    !decryptedContent.includes('"encryptedKey"') &&
                    !decryptedContent.includes('"encryptedData"') &&
                    !(decryptedContent.includes('"sender"') && decryptedContent.includes('"members"'))) {
                  console.log('Successfully decrypted group message using sender fallback')
                  return decryptedContent
                }
              } catch (senderError) {}
            }
          }
        } else if (parsed.sender && parsed.recipient) {
          const fallbackEncrypted = isSentMessage ? parsed.recipient : parsed.sender
          if (typeof fallbackEncrypted === 'string' && fallbackEncrypted.trim()) {
            const privateKey = e2eEncryptionService.getPrivateKey()
            if (privateKey) {
              try {
                const decryptedContent = await e2eEncryptionService.decryptMessage(fallbackEncrypted, privateKey)
                if (decryptedContent && decryptedContent.trim() &&
                    !decryptedContent.includes('"encryptedKey"') &&
                    !decryptedContent.includes('"encryptedData"') &&
                    !(decryptedContent.includes('"sender"') && decryptedContent.includes('"members"'))) {
                  console.log('Successfully decrypted message using fallback (dual encrypted format)')
                  return decryptedContent
                }
              } catch (fallbackError) {}
            }
          }
        }
      } catch (fallbackError) {
        if (isForwarded && !isDualEncrypted) {
          throw new Error(
            'Forwarded message cannot be decrypted: it may have been encrypted for the original sender/recipient, not for you.',
          )
        }
      }
    }

    if (isRSAError) {
    } else {
      console.error('Error decrypting message (non-RSA error):', error)
    }

    throw error
  }
}
