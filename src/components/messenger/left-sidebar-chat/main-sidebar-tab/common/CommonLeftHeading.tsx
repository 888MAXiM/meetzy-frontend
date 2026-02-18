import { Fragment, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Search, X } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Input } from 'reactstrap'
import { useAppDispatch } from '../../../../../redux/hooks'
import { openCloseSidebar } from '../../../../../redux/reducers/messenger/messengerSlice'
import type { CommonLeftHeadingType } from '../../../../../types/components/chat'

const CommonLeftHeading: React.FC<CommonLeftHeadingType> = ({
  title,
  subTitle,
  search,
  searchTerm,
  onSearchChange,
  modalToggle,
  showArrow = false,
  onArrowClick,
  customContent,
  customActions,
  hideDefaultClose = false,
}) => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleRightAction = () => {
    if (showArrow && onArrowClick) {
      onArrowClick()
    } else {
      dispatch(openCloseSidebar())
      setSidebarOpen(!sidebarOpen)
    }
  }

  const toggleSearch = (e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(!open)
    onSearchChange?.('')
  }

  return (
    <div className="template-title">
      <div className="d-flex align-items-center flex-grow-1">
        {customContent ? (
          customContent
        ) : (
          <div>
            {title && <h5>{t(title)}</h5>}
            {subTitle && <p>{t(subTitle)}</p>}
          </div>
        )}

        <div className="flex-grow-1 d-flex justify-content-end align-items-center">
          {customActions}
          {!customActions && (
            <>
              {search && (
                <Fragment>
                  <a className="icon-btn btn-outline-light btn-sm m-r-5 search" onClick={toggleSearch}>
                    <Search />
                  </a>
                  <div className={`form-inline search-form ${open && 'open'}`}>
                    <div className="form-group">
                      <Input
                        className="form-control-plaintext"
                        type="search"
                        placeholder="Search.."
                        value={searchTerm || ''}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                      />
                      <div className="icon-close close-search" onClick={toggleSearch}>
                        <X />
                      </div>
                    </div>
                  </div>
                </Fragment>
              )}
              {modalToggle && (
                <a className="icon-btn btn-outline-light btn-sm m-r-5" onClick={modalToggle}>
                  <Plus />
                </a>
              )}
              {!hideDefaultClose && (
                <a
                  className="icon-btn btn-outline-light btn-sm close-panel"
                  onClick={handleRightAction}
                  aria-label={showArrow ? t('go_back') : t('toggle_sidebar')}
                >
                  {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommonLeftHeading
