import React, { useRef } from 'react'
import { Camera, X } from 'react-feather'
import { Button } from 'reactstrap'
import { Image } from '../../../../../../shared/image'

interface AvatarUploadProps {
  currentAvatar: string | null
  username: string
  isEditing: boolean
  onAvatarChange: (file: File) => void
  onRemoveAvatar: () => void
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  username,
  isEditing,
  onAvatarChange,
  onRemoveAvatar,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onAvatarChange(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="profile profile-box-div position-relative">
      {currentAvatar ? (
        <Image className="bg-img" src={currentAvatar} alt={username || 'Avatar'} />
      ) : (
        <span className="profile-box-span">{username?.charAt(0).toUpperCase() || 'U'}</span>
      )}
      
      {isEditing && (
        <>
          <div 
            className="avatar-overlay"
            onClick={handleClick}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              borderRadius: 'inherit'
            }}
          >
            <Camera size={20} color="white" />
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />
          
          {currentAvatar && (
            <Button
              size="sm"
              color="danger"
              className="position-absolute canceluploadimg"
              style={{ top: '-5px', right: '-5px', padding: '2px 6px' }}
              onClick={onRemoveAvatar}
            >
              <X size={14} />
            </Button>
          )}
        </>
      )}
    </div>
  )
}