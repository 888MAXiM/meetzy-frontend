import { useState, useEffect } from 'react'
import { User } from '../types/api'

export const useProfileForm = (user: User | undefined) => {
  const [profile, setProfile] = useState({
    username: '',
    bio: '',
    phone: '',
    country: '',
    country_code: '',
    editStatus: false,
    email: '',
  })

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)

  useEffect(() => {
    if (user) {
      setProfile({
        username: user.name || '',
        bio: user.bio || '',
        phone: user.phone || '',
        country: user.country || '',
        country_code: user.country_code || '',
        editStatus: false,
        email: user.email || '',
      })
      setAvatarPreview(null)
      setRemoveAvatar(false)
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile({ ...profile, [name]: value })
  }

  const handleAvatarChange = (file: File) => {
    setAvatarFile(file)
    setRemoveAvatar(false)

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemoveAvatar(true)
  }

  const toggleEditMode = () => {
    const newEditStatus = !profile.editStatus
    setProfile({ ...profile, editStatus: newEditStatus })

    if (newEditStatus === false) {
      setAvatarFile(null)
      setAvatarPreview(null)
      setRemoveAvatar(false)
    }
  }

  const getCurrentAvatar = () => {
    if (avatarPreview) return avatarPreview
    if (removeAvatar) return null
    return user?.avatar || null
  }

  const resetAvatarState = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemoveAvatar(false)
  }

  return {
    profile,
    setProfile,
    avatarFile,
    removeAvatar,
    handleInputChange,
    handleAvatarChange,
    handleRemoveAvatar,
    toggleEditMode,
    getCurrentAvatar,
    resetAvatarState,
  }
}
