import { AccountPayload } from "../types/api"

export const buildProfilePayload = (
  profile: {
    username: string
    bio: string
    phone: string
    country: string
    country_code: string
  },
  userName: string | undefined,
  avatarFile: File | null,
  removeAvatar: boolean
): FormData | AccountPayload => {
  const baseData = {
    name: profile.username.trim() || userName || '',
    bio: profile.bio.trim(),
    phone: profile.phone.trim(),
    country: profile.country.trim(),
    country_code: profile.country_code.trim(),
  }

  if (avatarFile || removeAvatar) {
    const formData = new FormData()
    Object.entries(baseData).forEach(([key, value]) => {
      formData.append(key, value)
    })
    
    if (removeAvatar) {
      formData.append('remove_avatar', 'true')
    } else if (avatarFile) {
      formData.append('avatar', avatarFile)
    }
    
    return formData
  }

  return baseData
}