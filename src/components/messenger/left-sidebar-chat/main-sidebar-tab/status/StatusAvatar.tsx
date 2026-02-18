import { FC } from 'react'
import { Plus } from 'react-feather'
import ChatAvatar from '../../../../../shared/image/ChatAvatar'
import { StatusAvatarProps } from '../../../../../types/components/chat'

const StatusAvatar: FC<StatusAvatarProps> = ({
  avatar,
  name,
  hasStatus,
  handleFileSelect,
  userData,
  fileInputRef,
}) => {
  const avatarData = { avatar: avatar }

  const nameData = {
    name: name || userData?.name,
    first_name: userData?.first_name,
  }

  return (
    <div className="img-status">
      <div className={`profile ${hasStatus ? 'two' : ''}`}>
        <ChatAvatar data={avatarData} name={nameData} customClass="img-fluid bg-img" height={50} width={50} />
      </div>

      <div
        className="upload-img cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        role="button"
        aria-label="Upload status"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
        />
        <Plus size={20} />
      </div>
    </div>
  )
}

export default StatusAvatar