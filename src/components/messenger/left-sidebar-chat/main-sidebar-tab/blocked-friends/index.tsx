import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { queries } from '../../../../../api'
import { ImagePath } from '../../../../../constants'
import { SolidButton } from '../../../../../shared/button'
import { Image } from '../../../../../shared/image'
import { useDebounce } from '../../../../../utils/useDebounce'
import CommonLeftHeading from '../common/CommonLeftHeading'
import BlockedUsersList from './BlockedUsersList'

const BlockedUsers = () => {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 500)
  const { data, isLoading, refetch } = queries.useGetBlockedUsers(page, 20)
  const { data: searchData } = queries.useSearchBlock(debouncedSearch)
  const blockedUsers = data?.blocked || []
  const searchBlockedUsers = searchData?.blockedUsers || []
  const hasMore = data?.hasMore || false
  const handleLoadMore = () => {
    setPage((prev) => prev + 1)
  }
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setPage(1)
  }

  return (
    <Fragment>
      <CommonLeftHeading
        title={'blocked_users'}
        subTitle={'manage_blocked_users'}
        search
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />
      <div className="notification-container">
        {isLoading ? (
          <div className="text-center p-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="empty-state text-center">
            <div className="mb-3">
              <Image src={`${ImagePath}/gif/download.gif`} />
            </div>
            <h5>{t('no_blocked_users')}</h5>
            <p className="text-muted">{t('no_blocked_users_desc')}</p>
          </div>
        ) : (
          <>
            <BlockedUsersList
              blockedUsers={debouncedSearch ? searchBlockedUsers : blockedUsers}
              searchTerm={searchTerm}
              refetch={refetch}
            />

            {hasMore && (
              <div className="text-center p-3">
                <SolidButton color="primary" onClick={handleLoadMore} className="load-more-btn">
                  {t('load_more')}
                </SolidButton>
              </div>
            )}
          </>
        )}
      </div>
    </Fragment>
  )
}

export default BlockedUsers
