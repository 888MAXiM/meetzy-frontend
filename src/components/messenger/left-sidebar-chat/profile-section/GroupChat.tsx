import { useEffect, useState } from 'react'
import { Badge, Collapse } from 'reactstrap'
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks'
import ChatAvatar from '../../../../shared/image/ChatAvatar'
import { queries } from '../../../../api'
import { selectChat, setSelectedUser } from '../../../../redux/reducers/messenger/chatSlice'
import { ChatType } from '../../../../constants'

const GroupChat = () => {
  const dispatch = useAppDispatch()
  const [messages, setMessages] = useState(true)
  const [selectedGroupId, setSelectedGroupId] = useState<number | string | null>(null)
  const { selectedUserProfile } = useAppSelector((state) => state.chat)
  const { data } = queries.useGetGroupInfo(selectedGroupId!, {
    enabled: !!selectedGroupId,
  })

  const handleGroupClick = (groupId: number | string) => {
    setSelectedGroupId(groupId)
  }

  useEffect(() => {
    if (selectedGroupId && data?.group) {
      dispatch(
        selectChat({
          id: data.group.id,
          type: ChatType.group,
          pinned: data.group.isPinned,
        }),
      )
      dispatch(setSelectedUser({ ...data.group, chat_id: data.group.id, chat_type: ChatType.group }))
    }
  }, [data, selectedGroupId])

  return (
    <div className="status">
      <div className="collapse-block profile-collapse-block open">
        <h5 className="block-title" onClick={() => setMessages(!messages)}>
          Common groups
          <Badge className="badge-outline-dark sm ms-2">{selectedUserProfile?.common_groups.length}</Badge>
        </h5>

        <Collapse isOpen={messages} className="block-content">
          <ul className="group-main custom-scrollbar">
            {selectedUserProfile?.common_groups?.length ? (
              selectedUserProfile.common_groups.map((item, index) => (
                <li key={index} onClick={() => handleGroupClick(item.id)}>
                  <div className="group-box">
                    <div className="profile">
                      <ChatAvatar data={{ avatar: item.avatar }} name={{ name: item.name }} />
                    </div>

                    <div className="details">
                      <h6>{item.name}</h6>
                      <p>{item.members.map((m) => m.name).join(', ')}</p>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <p>No Group Chat</p>
            )}
          </ul>
        </Collapse>
      </div>
    </div>
  )
}

export default GroupChat
