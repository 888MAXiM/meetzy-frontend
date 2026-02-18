import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Accordion, AccordionBody, AccordionHeader, AccordionItem } from 'reactstrap'
import { queries } from '../../../../../api'
import { ImagePath } from '../../../../../constants'
import { useAppSelector } from '../../../../../redux/hooks'
import { Image } from '../../../../../shared/image'
import type { MutedUserData, UserStatusFeed } from '../../../../../types/api'
import type { ContactStatusProps } from '../../../../../types/components/chat'
import UserStatus from './UserStatus'

const ContactStatus: React.FC<ContactStatusProps> = ({ currentUserId }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState<string[]>(['1', '2'])
  const { statuses } = useAppSelector((store) => store.status)
  const otherUsersStatus = statuses.filter((feed: any) => feed.user.id !== currentUserId)
  const currentUserStatus = statuses.find((feed: any) => feed.user.id === currentUserId) // Add this
  const { data: getMutedStatuses } = queries.useGetMutedStatuses()

  const toggle = (id: string) => {
    if (open.includes(id)) {
      setOpen(open.filter((item) => item !== id))
    } else {
      setOpen([...open, id])
    }
  }

  const mutedUserIds = useMemo(() => {
    return new Set(getMutedStatuses?.data?.map((m) => m.muted_user.id) || [])
  }, [getMutedStatuses])

  const hasViewedAnyStatus = useCallback((feed: UserStatusFeed) => {
    if (feed.is_viewed !== undefined) {
      return feed.is_viewed
    }
    return feed.statuses.some((status) => status.view_count > 0)
  }, [])

  const unViewedStatuses = otherUsersStatus.filter((feed: any) => !hasViewedAnyStatus(feed))
  const viewedStatuses = otherUsersStatus.filter((feed: any) => hasViewedAnyStatus(feed))

  return (
    <div className="contact-status-box">
      {(unViewedStatuses.length > 0 || (getMutedStatuses && getMutedStatuses?.data.length < 0)) && (
        <div className="template-title border-0">
          <h5 className="ps-0">{t('recent_updates')}</h5>
        </div>
      )}

      {unViewedStatuses.length === 0 &&
        viewedStatuses.length === 0 &&
        getMutedStatuses &&
        getMutedStatuses?.data.length === 0 &&
        !currentUserStatus && (
          <div className="empty-state text-center">
            <div className="mb-3">
              <Image src={`${ImagePath}/gif/download.gif`} />
            </div>
            <h5>{t('no_status')}</h5>
            <p className="text-muted">{t('status_desc')}</p>
          </div>
        )}

      <div className="recent-updates-section">
        {unViewedStatuses.map((feed: any) => (
          <UserStatus key={feed.user.id} feed={feed} isViewed={false} />
        ))}
      </div>

      <Accordion open={open} toggle={toggle}>
        {viewedStatuses.length > 0 && (
          <AccordionItem>
            <AccordionHeader targetId="1" className="py-1">
              <div>
                <span>{t('viewed_updates')}</span>
              </div>
            </AccordionHeader>
            <AccordionBody accordionId="1" className="accordion-collapse collapse">
              <div className="viewed-updates-section">
                {viewedStatuses.map((feed: any) => (
                  <UserStatus key={feed.user.id} feed={feed} isViewed={true} />
                ))}
              </div>
            </AccordionBody>
          </AccordionItem>
        )}
        {getMutedStatuses && getMutedStatuses?.data.length > 0 && (
          <>
            <hr className="mt-0" />
            <AccordionItem>
              <AccordionHeader targetId="2" className="py-1">
                <div>
                  <span>{t('Muted Status')}</span>
                </div>
              </AccordionHeader>
              <AccordionBody accordionId="2" className="accordion-collapse collapse">
                <div className="viewed-updates-section">
                  {getMutedStatuses.data.map((feed: MutedUserData) => {
                    const feedData = {
                      user: feed.muted_user,
                      statuses: feed.statuses,
                      is_sponsored: false,
                      isMutedStatus: false,
                    }

                    return (
                      <UserStatus
                        key={feed.muted_user.id}
                        mutedUserIds={mutedUserIds}
                        feed={feedData}
                        isViewed={true}
                      />
                    )
                  })}
                </div>
              </AccordionBody>
            </AccordionItem>
          </>
        )}
      </Accordion>
    </div>
  )
}

export default ContactStatus
