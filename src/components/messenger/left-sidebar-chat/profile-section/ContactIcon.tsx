import { useAppSelector } from '../../../../redux/hooks'

const ContactIcon = () => {
  const { selectedUserProfile } = useAppSelector((state) => state.chat)

  return (
    <div className="right-chat-content">
      <h5>{selectedUserProfile?.bio}</h5>
    </div>
  )
}

export default ContactIcon
