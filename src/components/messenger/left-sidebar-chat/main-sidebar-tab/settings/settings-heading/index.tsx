import React from 'react'
import { X } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { mutations, queries } from '../../../../../../api'
import { useAppDispatch } from '../../../../../../redux/hooks'
import { closeLeftSide } from '../../../../../../redux/reducers/messenger/mainSidebarSlice'
import { setScreen } from '../../../../../../redux/reducers/messenger/screenSlice'
import { buildProfilePayload } from '../../../../../../utils/profileUtils'
import { useProfileForm } from '../../../../../../utils/useProfileForm'
import CommonLeftHeading from '../../common/CommonLeftHeading'
import { AvatarUpload } from './AvatarUpload'
import { ProfileActions } from './ProfileActions'
import { ProfileDisplays } from './ProfileDisplays'
import { ProfileEditForm } from './ProfileEditForm'

const SettingsHeading = () => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { data: userData, isLoading } = queries.useGetUserDetails()
  const user = userData?.user
  const updateProfile = mutations.useUpdateProfile()

  const {
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
  } = useProfileForm(user)

  const handleEdit = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    toggleEditMode()
  }

  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    if (updateProfile.isPending) return

    try {
      const payload = buildProfilePayload(profile, user?.name, avatarFile, removeAvatar)
      await updateProfile.mutateAsync(payload)
      setProfile((prev) => ({ ...prev, editStatus: false }))
      resetAvatarState()
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="template-title">
        <div className="d-flex">
          <div>
            <h3>{t('settings_title')}</h3>
            <p>Loading...</p>
          </div>
          <div className="flex-grow-1">
            <a
              className="icon-btn btn-outline-light btn-sm close-panel"
              onClick={() => {
                dispatch(setScreen('chat'))
                dispatch(closeLeftSide())
              }}
            >
              <X />
            </a>
          </div>
        </div>
      </div>
    )
  }

  const currentAvatar = getCurrentAvatar()

  return (
    <>
      <CommonLeftHeading title={'settings_title'} subTitle={'settings_description'} />
      <div className="profile-box mt-3">
        <div className={`d-flex gap-2 ${profile.editStatus ? 'open' : ''}`}>
          <AvatarUpload
            currentAvatar={currentAvatar}
            username={profile.username}
            isEditing={profile.editStatus}
            onAvatarChange={handleAvatarChange}
            onRemoveAvatar={handleRemoveAvatar}
          />

          {!profile.editStatus ? (
            <ProfileDisplays username={user?.name || ''} bio={user?.bio || ''} noBioText={t('settings_no_bio')} />
          ) : (
            <ProfileEditForm profile={profile} onChange={handleInputChange} />
          )}

          <ProfileActions
            isEditing={profile.editStatus}
            isSaving={updateProfile.isPending}
            isSaveDisabled={updateProfile.isPending || !profile.username.trim()}
            onEdit={handleEdit}
            onSave={handleSave}
          />
        </div>
      </div>
    </>
  )
}

export default SettingsHeading
