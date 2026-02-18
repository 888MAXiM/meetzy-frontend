import { type FC, useState } from 'react'
import type { AvatarProps } from '../../types/shared'
import { getInitials } from '../../utils'
import Image from './Image'

const ChatAvatar: FC<AvatarProps> = ({ data, placeHolder, name, customClass = '', height = 50, width = 50 }) => {
  const [hasError, setHasError] = useState(false)
  const displayName = name?.name || name?.first_name || data?.name || data?.first_name || ''
  const initials = getInitials(displayName)
  const firstLetter = initials ? initials : displayName.charAt(0).toUpperCase()

  const renderInitial = () => (
    <>
      <div
        className={`profile chatavtar-div ${customClass}`}
      >
        <span>{firstLetter}</span>
      </div>
    </>
  )

  const imageSrc = data?.avatar

  if (!hasError && imageSrc) {
    return (
      <div className="profile">
        <Image
          src={imageSrc}
          fallbackSrc={placeHolder}
          height={height}
          width={width}
          alt={displayName}
          onError={() => setHasError(true)}
          className={customClass}
        />
      </div>
    )
  }

  return renderInitial()
}

export default ChatAvatar
