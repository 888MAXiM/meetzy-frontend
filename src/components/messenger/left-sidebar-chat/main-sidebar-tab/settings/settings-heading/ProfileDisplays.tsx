import React from 'react'

interface ProfileDisplayProps {
  username: string
  bio: string
  noBioText: string
}

export const ProfileDisplays: React.FC<ProfileDisplayProps> = ({ 
  username, 
  bio, 
  noBioText 
}) => {
  return (
    <div className="details pt-0 flex-grow-1">
      <h6>{username || 'User'}</h6>
      <p className="font-light">{bio || noBioText}</p>
    </div>
  )
}