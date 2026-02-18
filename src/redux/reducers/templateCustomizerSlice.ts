import { createSlice } from '@reduxjs/toolkit'
import { ImageBaseUrl } from '../../constants'
import { chatWallpaperData, colorPickerData, templateLayoutData } from '../../data/messenger'
import type { TemplateCustomizerState } from '../../types/store'
import { getStorage, stringify } from '../../utils'
import Config from '../../utils/config'

const getInitialTemplateLayout = () => {
  const savedLayout = localStorage.getItem('templateLayout')
  if (!savedLayout) return templateLayoutData

  const parsed = JSON.parse(savedLayout)
  return templateLayoutData.map((item) => ({
    ...item,
    active: parsed.layoutValue === item.layoutValue,
  }))
}

const storage = getStorage()

const getInitialChatWallpaper = () => {
  try {
    const stored = storage.getItem('chatWallpaper')
    if (!stored) return chatWallpaperData

    if (typeof stored === 'object') return stored

    if (typeof stored === 'string') {
      return JSON.parse(stored)
    }

    return chatWallpaperData
  } catch (error) {
    console.error('Error parsing chatWallpaper:', error)
    return chatWallpaperData
  }
}

const initialState: TemplateCustomizerState = {
  layoutType: JSON.parse(localStorage.getItem('layoutType') || 'false'),
  colorPicker: JSON.parse(localStorage.getItem('colorPicker') || JSON.stringify(colorPickerData)),
  templateLayout: getInitialTemplateLayout(),
  chatWallpaper: getInitialChatWallpaper(),
}

const TemplateCustomizerSlice = createSlice({
  name: 'TemplateCustomizer',
  initialState,
  reducers: {
    setLayoutType: (state) => {
      state.layoutType = !state.layoutType
      if (state.layoutType) {
        Config.layout_type = 'rtl'
        document.body.classList.add('rtl')
        document.querySelector('.rtl-setting')?.classList.add('rtl')
      } else {
        Config.layout_type = ''
        document.body.classList.remove('rtl')
        document.querySelector('.rtl-setting')?.classList.remove('rtl')
      }
      localStorage.setItem('layoutType', `${state.layoutType}`)
    },

    setColorPicker: (state, action) => {
      Config.color = action.payload
      document.documentElement.className = action.payload
      state.colorPicker = state.colorPicker.map((item) =>
        item.color === action.payload ? { ...item, active: true } : { ...item, active: false },
      )
      localStorage.setItem('colorPicker', JSON.stringify(state.colorPicker))
    },

    setTemplateLayoutData: (state, action) => {
      Config.sidebar_layout = action.payload
      document.body.classList.remove('dark-sidebar', 'dark', 'colorfull', 'light')
      if (action.payload === 'light' || action.payload === '') {
        document.body.classList.add('light')
      } else if (action.payload === 'dark-sidebar') {
        document.body.classList.add('dark-sidebar')
      } else if (action.payload === 'dark') {
        document.body.classList.add('dark')
      } else if (action.payload === 'colorfull') {
        document.body.classList.add('colorfull')
      }
      state.templateLayout = state.templateLayout.map((item) =>
        item.layoutValue === action.payload ? { ...item, active: true } : { ...item, active: false },
      )

      localStorage.setItem('templateLayout', JSON.stringify({ layoutValue: action.payload }))
    },

    setChatWallpaper: (state, action) => {
      const wallpaperData = action.payload
      const wallpaper = wallpaperData.wallpaper
      const fullUrl = !wallpaper
        ? '../../../public/assets/images/wallpaper/1.png'
        : wallpaper.startsWith('http')
        ? wallpaper
        : `${ImageBaseUrl}${wallpaper}`
      document.documentElement.style.setProperty('--chat-wallpaper', `url("${fullUrl}")`)
      const updateBackground = (selector: string) => {
        const el = document.querySelector(selector) as HTMLElement
        if (el) {
          el.style.backgroundImage = `url("${fullUrl}")`
        }
      }
      updateBackground('.meetzy-main .messages')
      updateBackground('.chat-content .messages')
      updateBackground('#group_chat')
      Config.wallpaper = wallpaper
      state.chatWallpaper = wallpaperData
      storage.setItem('chatWallpaper', stringify(wallpaperData))
    },
  },
})

export const { setLayoutType, setColorPicker, setTemplateLayoutData, setChatWallpaper } =
  TemplateCustomizerSlice.actions

export default TemplateCustomizerSlice.reducer
