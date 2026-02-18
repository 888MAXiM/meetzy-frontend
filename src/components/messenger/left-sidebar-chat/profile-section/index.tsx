import { useEffect, useRef } from 'react'
import { X } from 'react-feather'
import { ImageBaseUrl } from '../../../../constants'
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks'
import { setProfileToggle } from '../../../../redux/reducers/messenger/messengerSlice'
import { Image } from '../../../../shared/image'
import ContactIcon from './ContactIcon'
import ContactInformation from './ContactInformation'
import GroupChat from './GroupChat'
import Messages from './Messages'
import SharedMedia from './SharedMedia'
import SharedDocument from './SharedDocument'

const ProfileSection = () => {
  const { selectedUserProfile, selectedUser } = useAppSelector((state) => state.chat)
  const { profileToggle } = useAppSelector((state) => state.messenger)
  const { app_name } = useAppSelector((state) => state.settings)
  const dispatch = useAppDispatch()

  const sidebarRef = useRef<HTMLDivElement | null>(null)

  const handleClose = () => {
    dispatch(setProfileToggle(false))
  }

  useEffect(() => {
    if (!profileToggle) return

    const handleClickOutside = (event: MouseEvent) => {
      const isModalOpen = document.querySelector('.custom-delete-modal')
      if (isModalOpen) return

      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        handleClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileToggle])

  if (!profileToggle) return null

  return (
    <aside className="meetzy-right-sidebar active" ref={sidebarRef}>
      <div className="custom-scroll right-sidebar">
        <div className="contact-profile-img">
          <div className={`profile`}>
            <Image src={ImageBaseUrl + selectedUserProfile?.avatar} />
            <a className="icon-btn btn-sm close-profile" onClick={handleClose}>
              <X />
            </a>
            <div className="profile-content">
              <h4 className="text-white">{selectedUser?.isAnnouncement ? app_name : selectedUserProfile?.name}</h4>
              {!selectedUser?.isAnnouncement && selectedUserProfile?.phone && (
                <p className="text-white mb-0 d-flex align-items-center gap-2">
                  {!selectedUserProfile?.userSetting?.hide_phone && `+${selectedUserProfile?.phone}`}
                </p>
              )}
            </div>
          </div>
        </div>
        <ContactIcon />
        <SharedDocument />
        <SharedMedia />
        <Messages />
        {!selectedUser?.isAnnouncement && <GroupChat />}
        <ContactInformation />
      </div>
    </aside>
  )
}

export default ProfileSection
