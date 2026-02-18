import { useState, useEffect, useCallback } from 'react'
import { decryptMessageIfNeeded } from './e2e-helpers'
import { isContentEncrypted } from './index'
import { SearchMessage } from '../types/components/chat'

export const useMessageSearch = (
  searchTerm: string,
  context: {
    recipientId?: string
    groupId?: string
    broadcastId?: string
    isAnnouncement?: boolean
    isBroadcast?: boolean
  },
  currentUserId: string
) => {
  const [results, setResults] = useState<SearchMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const searchMessages = useCallback(async (page = 1) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        limit: '100',
        page: page.toString(),
        ...(context.recipientId && { recipientId: context.recipientId }),
        ...(context.groupId && { groupId: context.groupId }),
        ...(context.broadcastId && { broadcast_id: context.broadcastId }),
        ...(context.isAnnouncement && { isAnnouncement: 'true' }),
        ...(context.isBroadcast && { isBroadcast: 'true' }),
      })

      const response = await fetch(`/api/messages/search?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Search failed')
      }

      const { messages, pagination } = data
      const decryptedMessages: SearchMessage[] = []

      for (const msg of messages) {
        let decryptedContent = msg.content
        if (msg.is_encrypted || isContentEncrypted(msg.content)) {
          const isSent = msg.sender_id === currentUserId
          const shouldDecrypt = msg.is_encrypted || isContentEncrypted(msg.content)
          
          try {
            decryptedContent = await decryptMessageIfNeeded(
              msg.content,
              shouldDecrypt,
              isSent,
              msg.sender_id,
              false,
              currentUserId,
              false
            )
            
            if (!decryptedContent || !decryptedContent.trim() || 
                decryptedContent.startsWith('[') || 
                decryptedContent.includes('Encrypted message')) {
              throw new Error('Decryption returned invalid content')
            }
          } catch (err) {
            console.error('Failed to decrypt message during search, retrying...', err)
            
            try {
              await new Promise(resolve => setTimeout(resolve, 300))
              decryptedContent = await decryptMessageIfNeeded(
                msg.content,
                shouldDecrypt,
                isSent,
                msg.sender_id,
                false,
                currentUserId,
                false
              )
              
              if (!decryptedContent || !decryptedContent.trim() || 
                  decryptedContent.startsWith('[') || 
                  decryptedContent.includes('Encrypted message')) {
                throw new Error('Retry also returned invalid content')
              }
            } catch (retryErr) {
              console.error('Failed to decrypt message after retry:', retryErr)
              continue
            }
          }
        }

        const searchLower = searchTerm.toLowerCase().trim()
        if (decryptedContent.toLowerCase().includes(searchLower)) {
          decryptedMessages.push({
            ...msg,
            decryptedContent,
          })
        }
      }

      setResults(decryptedMessages)
      setHasMore(pagination.hasMore)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, context, currentUserId])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchMessages(1)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchMessages])

  return { results, loading, error, hasMore, searchMessages }
}
