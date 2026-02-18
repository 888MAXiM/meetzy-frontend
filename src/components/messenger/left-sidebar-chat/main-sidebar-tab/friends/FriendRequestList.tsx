import { useQueryClient } from '@tanstack/react-query'
import React, { useState } from 'react'
import { mutations } from '../../../../../api'
import { KEYS } from '../../../../../constants/keys'
import { SvgIcon } from '../../../../../shared/icons'
import ChatAvatar from '../../../../../shared/image/ChatAvatar'
import type { ContactListType } from '../../../../../types/components/chat'
import { toaster } from '../../../../../utils/custom-functions'
import { Image } from '../../../../../shared/image'
import { ImagePath } from '../../../../../constants'

const FriendRequestList: React.FC<ContactListType> = ({ filteredItems, searchTerm }) => {
  const [sendingRequestId, setSendingRequestId] = useState<number | string | null>(null)
  const sendFriendRequest = mutations.useSendFriendRequest()
  const queryClient = useQueryClient()

  const handleSendRequest = async (friendId: number | string) => {
    setSendingRequestId(friendId)
    try {
      await sendFriendRequest.mutateAsync({ friendId })
      toaster('success', 'Friend request sent successfully!')
      queryClient.invalidateQueries({ queryKey: [KEYS.FRIEND_SUGGESTIONS] })
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to send friend request'
      toaster('error', errorMessage)
    } finally {
      setSendingRequestId(null)
    }
  }

  return (
    <ul className="people-list">
      {filteredItems.length !== 0 ? (
        filteredItems.map((item) => (
          <li className="clearfix" key={item.id}>
            <div className="people-friend">
              <div className="profile">
                <ChatAvatar data={item} name={item} customClass="user-info avatar-sm" />
              </div>
              <div className="about">
                <div className="name">{item.name}</div>
                <div className="status">{item.email}</div>
              </div>
              <div className="ms-auto">
                <SvgIcon
                  iconId={`${sendingRequestId === item.id ? 'animate-spin' : 'send-request'}`}
                  className={`${sendingRequestId === item.id ? 'request-animation' : 'disable'}`}
                  onClick={() => handleSendRequest(item?.id || 0)}
                />
              </div>
            </div>
          </li>
        ))
      ) : (
        <div className="text-center p-4 text-muted">
          {searchTerm ? (
            'No Friends found matching your search.'
          ) : (
            <div className="empty-state text-center">
              <div className="mb-3">
                <Image src={`${ImagePath}/gif/download.gif`} />
              </div>
              <h5>No Friends</h5>
              <p className="text-muted">You don't have any friends at the moment</p>
            </div>
          )}
        </div>
      )}
    </ul>
  )
}

export default FriendRequestList
