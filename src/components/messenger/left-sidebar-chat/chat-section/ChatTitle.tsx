import { Fragment, useEffect, useState } from 'react'
import { Plus, Search, X } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Input } from 'reactstrap'
import { useAppSelector } from '../../../../redux/hooks'
import { setGlobalSearchTerm } from '../../../../redux/reducers/messenger/messengerSlice'
import Config from '../../../../utils/config'
import { useDebounce } from '../../../../utils/useDebounce'
import ChatContactSetting from './quick-actions'

const ChatTitle = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const [chatContact, setChatContact] = useState(false)
  const [searchToggle, setSearchToggle] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 500)
  const { subChatActiveTab, messengerActiveTab } = useAppSelector((state) => state.messenger)
  const mode = Config.sidebar_layout
  const toggleChatContact = () => setChatContact(!chatContact)

  useEffect(() => {
    dispatch(setGlobalSearchTerm(debouncedSearch))
  }, [debouncedSearch, dispatch])

  const toggleSearchClose = () => {
    setSearchToggle(!searchToggle)
    setSearchTerm('')
    dispatch(setGlobalSearchTerm(''))
  }

  return (
    <Fragment>
      <div className="template-title border-0">
        <div className="d-flex align-items-center justify-content-between">
          <h5>{t('messages')}</h5>
          {messengerActiveTab !== 'call' && (
            <div className="flex-grow-1">
              <a
                className="icon-btn btn-outline-light btn-sm search contact-search mt-0"
                onClick={() => setSearchToggle(!searchToggle)}
              >
                <Search />
              </a>
              <div className={`form-inline search-form message-search ${searchToggle ? 'open' : ''}`}>
                <div className="form-group">
                  <Input
                    className="form-control-plaintext"
                    type="search"
                    placeholder={`Search ${subChatActiveTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="icon-close close-search" onClick={toggleSearchClose}>
                    <X />
                  </div>
                </div>
              </div>
              <button className="icon-btn btn-primary btn-fix chat-cont-toggle outside" onClick={toggleChatContact}>
                <Plus className={mode !== "dark" ? "dark" : "light"}/>
                <ChatContactSetting setChatContact={toggleChatContact} chatContact={chatContact} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Fragment>
  )
}

export default ChatTitle
