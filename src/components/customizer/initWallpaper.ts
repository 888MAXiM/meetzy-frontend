import { setChatWallpaper } from '../../redux/reducers/templateCustomizerSlice'
import Store from '../../redux/store'
import { getStorage } from '../../utils'

const initWallpaper = () => {
  const storage = getStorage()
  const saved = storage.getItem('chatWallpaper')
  if (saved) {
    let data
    try {
      data = typeof saved === 'string' ? JSON.parse(saved) : saved
    } catch {}
    if (data?.wallpaper) {
      Store.dispatch(setChatWallpaper(data)) 
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWallpaper)
} else {
  initWallpaper()
}
