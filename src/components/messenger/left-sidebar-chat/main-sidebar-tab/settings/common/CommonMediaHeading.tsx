import { ChevronLeft, ChevronRight } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '../../../../../../redux/hooks'
import { setSettingsActiveTab } from '../../../../../../redux/reducers/messenger/mainSidebarSlice'
import type { CommonMediaHeadingType } from '../../../../../../types/components/chat'

const CommonMediaHeading: React.FC<CommonMediaHeadingType> = ({ title, text, type, onClick }) => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e)
    } else {
      dispatch(setSettingsActiveTab(type))
    }
  }

  return (
    <div className={`d-flex ${!type && 'align-items-center'}`} onClick={handleClick}>
      <div className="flex-grow-1">
        <h6>{t(title)}</h6>
        <p>{t(text || '')}</p>
      </div>
      <div className="media-right">
        <a
          className={`icon-btn btn-outline-light btn-sm pull-right ${type ? 'next' : 'previous'}`}
          onClick={handleClick}
        >
          {type ? <ChevronRight /> : <ChevronLeft />}
        </a>
      </div>
    </div>
  )
}

export default CommonMediaHeading
