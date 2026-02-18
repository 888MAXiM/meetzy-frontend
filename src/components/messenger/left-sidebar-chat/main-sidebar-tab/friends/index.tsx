import { useState } from 'react'
import { Fragment } from 'react/jsx-runtime'
import { queries } from '../../../../../api'
import CommonLeftHeading from '../common/CommonLeftHeading'
import FriendRequestList from './FriendRequestList'
import { Image } from '../../../../../shared/image'
import { ImagePath } from '../../../../../constants'
import { useTranslation } from 'react-i18next'

const Friends = () => {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const { data: searchData } = queries.useSearchFriend(searchTerm)

  const searchDatas = searchTerm ? searchData?.suggestions || [] : []
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }

  return (
    <Fragment>
      <CommonLeftHeading
        title={'find_friends'}
        subTitle={'find_friends_desc'}
        search
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />
      {!searchTerm ? (
        <div className="empty-state text-center">
          <div className="mb-3">
            <Image src={`${ImagePath}/gif/download.gif`} />
          </div>
          <h5>{t('find_your_friends')}</h5>
          <p>{t('find_friends_des')}</p>
        </div>
      ) : (
        <FriendRequestList filteredItems={searchDatas} searchTerm={searchTerm} />
      )}
    </Fragment>
  )
}

export default Friends
