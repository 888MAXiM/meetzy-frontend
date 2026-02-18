import { Fragment, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { queries } from '../../../../../api'
import { useAppDispatch, useAppSelector } from '../../../../../redux/hooks'
import { setHighlightedMessageId } from '../../../../../redux/reducers/messenger/chatSlice'
import { SvgIcon } from '../../../../../shared/icons'
import { ContactType, PageSearchMessage, SearchMessage, SearchParams } from '../../../../../types/components/chat'
import { Message } from '../../../../../types/api'
import DecryptedMessage from '../chat/messages/DecryptedMessage'
import { getPlainTextFromMessage } from '../../../../../utils'
import { ChatType } from '../../../../../constants'

const Search: React.FC<ContactType> = ({ search, setSearch }) => {
  const { t } = useTranslation()
  const { selectedChat, selectedUser } = useAppSelector((store) => store.chat)
  const { user } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (search && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [search])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node) && search) {
        setSearch(false)
      }
    }

    if (search) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [search, dispatch])

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    setSearchTerm('')
    setDebouncedSearchTerm('')
    setSearch(false)
  }, [selectedChat?.id])

  useEffect(() => {
    if (!search) {
      setSearchTerm('')
      setDebouncedSearchTerm('')
    }
  }, [search])

  const getSearchParams = () => {
    if (!selectedChat || !debouncedSearchTerm) return null

    const params: SearchParams = {
      query: debouncedSearchTerm.trim(),
      scope: selectedChat.type === ChatType.group ? ChatType.group : ChatType.DM,
      limit: 5,
      page: 1,
      groupId: selectedChat.id || null,
      recipientId: selectedChat.id || null,
      isAnnouncement: selectedUser?.isAnnouncement ? true : undefined,
    }

    return params
  }

  const searchParams = getSearchParams() ?? { query: '', limit: 5, page: 1 }
  const {
    data: searchResults,
    isLoading: isSearchLoading,
    fetchNextPage,
    hasNextPage,
    isRefetching,
  } = queries.useSearchMessages(searchParams, user?.id)

  const highlightSearchTerm = (text: string) => {
    if (!debouncedSearchTerm || !text) return text

    const regex = new RegExp(`(${debouncedSearchTerm})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) =>
      part.toLowerCase() === debouncedSearchTerm.toLowerCase() ? (
        <mark key={index} className="search-highlight">
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const handleResultClick = (message: SearchMessage) => {
    dispatch(
      setHighlightedMessageId({
        id: message.id,
        timestamp: message.created_at,
      }),
    )
    setSearch(false)
    setSearchTerm('')
    setDebouncedSearchTerm('')
  }

  return (
    <div className={`form-inline search-form ${search ? 'open' : ''}`}>
      <div className="header-right-wrapper">
        <div ref={searchContainerRef} className={`search-full ${search ? 'active' : ''}`}>
          <div className="form-group w-100">
            <div className="Typeahead">
              <div className="u-posRelative">
                <input
                  ref={searchInputRef}
                  className="search-input form-control-plaintext w-100"
                  type="text"
                  placeholder={t('search_anything')}
                  name="q"
                  autoFocus={search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {search && (
                  <button type="button" className="close-search" onClick={() => setSearch(false)}>
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Search Results Dropdown */}
          {search && debouncedSearchTerm.length > 0 && (
            <div className="search-results-dropdown custom-scroll">
              {isSearchLoading && <div className="loading">{t('searching')}</div>}

              {searchResults && searchResults?.pages?.length > 0 ? (
                <>
                  {searchResults?.pages?.map((page: PageSearchMessage, pageIndex) => {
                    return (
                      <Fragment key={pageIndex}>
                        {page.messages.length > 0 ? (
                          page.messages.map((message) => (
                            <div
                              key={`${pageIndex}-${message.id}`}
                              className="message-result cursor-pointer"
                              onClick={() => handleResultClick(message)}
                            >
                              <div className="message-header">
                                <span className="sender-name">{message.sender?.name || t('you')}</span>
                                <span className="message-time">{formatDate(message.created_at)}</span>
                              </div>

                              <div className="message-content">
                                <DecryptedMessage message={message as unknown as Message}>
                                  {(decryptedContent) => (
                                    <>{highlightSearchTerm(getPlainTextFromMessage(decryptedContent))}</>
                                  )}
                                </DecryptedMessage>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-results">
                            <SvgIcon iconId="no-data-available" />
                            <span>{t('no_messages_found')}</span>
                          </div>
                        )}
                      </Fragment>
                    )
                  })}
                  {hasNextPage && (
                    <button
                      className="load-more-btn btn btn-light w-100"
                      onClick={() => fetchNextPage()}
                      disabled={isRefetching}
                    >
                      {isRefetching ? t('loading') : t('load_more')}
                    </button>
                  )}
                </>
              ) : (
                !isSearchLoading && <p className="no-results">{t('no_messages_found')}</p>
              )}
            </div>
          )}
        </div>
        <span className="header-search" onClick={() => setSearch(false)}>
          <SvgIcon iconId="search-sidebar" className="search-bar" />
        </span>
      </div>
    </div>
  )
}

export default Search
