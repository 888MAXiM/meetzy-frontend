import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { queries } from '../../api'
import { useAppDispatch } from '../../redux/hooks'
import { setChatWallpaper } from '../../redux/reducers/templateCustomizerSlice'
import { Image } from '../../shared/image'
import { getStorage } from '../../utils'

const ChatWallpaper = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { data } = queries.useGetChatWallpapers()
  const storage = getStorage()

  let chatWallpaper = null
  try {
    const stored = storage.getItem('chatWallpaper')
    if (stored) {
      chatWallpaper = typeof stored === 'string' ? JSON.parse(stored) : stored
    }
  } catch (error) {
    console.error('Error parsing chatWallpaper:', error)
  }

  const currentWallpaperInData = chatWallpaper?.id
    ? data?.wallpapers?.find((item) => String(item.id) === String(chatWallpaper.id))
    : undefined
  const isDefaultWallpaper = currentWallpaperInData?.is_default === true
  const shouldShowRemoveOption =
    chatWallpaper?.wallpaper && (!chatWallpaper.id || currentWallpaperInData === undefined || !isDefaultWallpaper)

  const removeWallpaper = () => {
    dispatch(setChatWallpaper({ ...chatWallpaper, wallpaper: null }))
    localStorage.removeItem('chatWallpaper')
    document.documentElement.style.setProperty(
      '--chat-wallpaper',
      `url('../../../public/assets/images/wallpaper/1.png')`,
    )
  }

  return (
    <Fragment>
      {((data?.wallpapers && data?.wallpapers.length > 0) || chatWallpaper?.wallpaper) && (
        <h5>{t('chat_wallpaper')}</h5>
      )}
      {data?.wallpapers && data?.wallpapers.length > 0 && (
        <>
          <ul className="wallpaper">
            {data?.wallpapers
              .filter((item) => item.status)
              .map((item, index) => (
                <Fragment key={index}>
                  <li
                    className={`${chatWallpaper?.id == item?.id ? 'active' : ''}`}
                    onClick={() => dispatch(setChatWallpaper(item))}
                  >
                    <Image className="bg-img" src={item.wallpaper} alt="Avatar" />
                  </li>
                </Fragment>
              ))}
          </ul>
        </>
      )}
      {shouldShowRemoveOption && (
        <>
          <div role="button" className="text-secondary" onClick={removeWallpaper}>
            Remove wallpaper
          </div>
        </>
      )}
    </Fragment>
  )
}

export default ChatWallpaper
