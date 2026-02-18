import { ImageBaseUrl } from '../../constants'
import { setChatWallpaper } from '../../redux/reducers/templateCustomizerSlice'
import Store from '../../redux/store'
import { getStorage } from '../../utils'
import Config from '../../utils/config'

const applySavedChatWallpaper = () => {
  const storage = getStorage()
  const saved = storage.getItem('chatWallpaper')

  if (!saved) return

  let wallpaperData
  try {
    wallpaperData = typeof saved === 'string' ? JSON.parse(saved) : saved
  } catch {
    return
  }

  if (!wallpaperData?.wallpaper) return

  const updateBackground = (selector: string, wallpaper: string) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      const wallpaperUrl = wallpaper.startsWith('http') ? wallpaper : `${ImageBaseUrl}${wallpaper}`

      element.style.backgroundImage = `url("${wallpaperUrl}")`
      element.style.backgroundBlendMode = 'overlay'
      element.style.backgroundSize = 'cover'
      element.style.backgroundPosition = 'center'
      element.style.backgroundRepeat = 'no-repeat'
    }
  }

  updateBackground('.meetzy-main .messages', wallpaperData.wallpaper)
  updateBackground('.chat-content .messages', wallpaperData.wallpaper)
  updateBackground('#group_chat', wallpaperData.wallpaper)

  Config.wallpaper = wallpaperData.wallpaper

  Store.dispatch(setChatWallpaper(wallpaperData))
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySavedChatWallpaper)
  } else {
    applySavedChatWallpaper()
  }
}
