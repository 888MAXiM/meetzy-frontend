import { useQueryClient } from '@tanstack/react-query'
import { Fragment, useState } from 'react'
import { Star } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { mutations, queries } from '../../../../../api'
import { ImagePath } from '../../../../../constants'
import { KEYS } from '../../../../../constants/keys'
import { useAppSelector } from '../../../../../redux/hooks'
import { setRecentChatFavoriteStatus, setSelectedUser } from '../../../../../redux/reducers/messenger/chatSlice'
import { Image } from '../../../../../shared/image'
import type { FavoriteItem } from '../../../../../types/components/chat'
import { toaster } from '../../../../../utils/custom-functions'
import { useDebounce } from '../../../../../utils/useDebounce'
import CommonLeftHeading from '../common/CommonLeftHeading'
import ChatAvatar from '../../../../../shared/image/ChatAvatar'

const Favorite = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()
  const { selectedUser } = useAppSelector((state) => state.chat)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 500)
  const { data, isLoading, refetch } = queries.useGetFavorites(page, 20)
  const { data: searchData } = queries.useSearchFavorites(debouncedSearch)
  const toggleFavorite = mutations.useToggleFavorite()
  const searchArchiveUsers = searchData?.favorites || []
  const favorites = data?.favorites || []
  const displayData = debouncedSearch ? searchArchiveUsers : favorites
  const hasMore = data?.hasMore || false

  const handleToggleFavorite = async (targetId: string, targetType:string) => {
    try {
      const result = await toggleFavorite.mutateAsync({ targetId, targetType:targetType === 'direct' ? 'user' : targetType })

      toaster('success', result.message || t('favorite_updated'))
      const nextFavoriteState = result.isFavorite
      dispatch(setSelectedUser({ ...selectedUser, isFavorite: nextFavoriteState }))

      dispatch(
        setRecentChatFavoriteStatus({
          chatId: targetId,
          chatType: targetType === 'group' ? 'group' : 'direct',
          isFavorite: nextFavoriteState,
        }),
      )

      queryClient.invalidateQueries({ queryKey: [KEYS.FAVORITES] })
      refetch()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || t('favorite_update_failed')
      toaster('error', errorMessage)
    }
  }

  const handleLoadMore = () => {
    setPage((prev) => prev + 1)
  }

  const getTitle = (item: FavoriteItem) => {
    if (item.chat_type === 'direct') return item.name || 'Unknown'
    if (item.chat_type === 'group') return item.name || 'Unknown Group'
    return 'Unknown'
  }

  const getSubtitle = (item: FavoriteItem) => {
    if (item.chat_type === 'direct') return item.email || ''
    if (item.chat_type === 'group') return item.description || '-'
    return ''
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setPage(1)
  }

  return (
    <Fragment>
      <CommonLeftHeading
        title={'favorite'}
        subTitle={'liked_message'}
        search
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />

      {isLoading ? (
        <div className="text-center p-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : favorites.length === 0 ? (
        <div className="empty-state text-center p-4">
          <div className="mb-3">
            <Image src={`${ImagePath}/gif/star.gif`} />
          </div>
          <h5>{t('no_favorites')}</h5>
          <p className="text-muted">{t('no_favorites_desc')}</p>
        </div>
      ) : (
        <>
          <ul className="chat-main">
            {displayData.length > 0 ? (
              displayData.map((item, index) => {
                return (
                  <li className="border-0" key={index}>
                    <div className="bookmark-box">
                      <div className="chat-box">
                        <div className="d-flex">
                          <div className="profile online">
                            <ChatAvatar customClass="bg-img img-fluid media" data={item} name={item} />
                          </div>
                          <div className="details">
                            <h6>{getTitle(item)}</h6>
                            <p>{getSubtitle(item)}</p>
                          </div>
                          <div className="flex-grow-1">
                            <a
                              className="icon-btn btn-outline-primary btn-sm pull-right favourite"
                              onClick={(e) => {
                                e.preventDefault()
                                handleToggleFavorite(item.chat_id, item.chat_type)
                              }}
                            >
                              <Star />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })
            ) : (
              <div className="text-center p-4 text-muted">
                {searchTerm ? 'No favorite user found matching your search.' : 'No favorite user available.'}
              </div>
            )}
          </ul>

          {hasMore && (
            <div className="text-center p-3">
              <button className="btn btn-primary btn-sm" onClick={handleLoadMore} disabled={isLoading}>
                {isLoading ? t('loading') : t('load_more')}
              </button>
            </div>
          )}
        </>
      )}
    </Fragment>
  )
}

export default Favorite
