import { createSlice } from '@reduxjs/toolkit'
import { SettingsState } from '../../types/api'

const getCachedSettings = (): Partial<SettingsState> => {
  try {
    const cached = localStorage.getItem('app_settings')
    return cached ? JSON.parse(cached) : {}
  } catch {
    return {}
  }
}

const cachedSettings = getCachedSettings()

const initialState: SettingsState = {
  settings: null,
  sidebar_logo_url: cachedSettings.sidebar_logo_url || '',
  logo_light_url: cachedSettings.logo_light_url || '',
  logo_dark_url: cachedSettings.logo_dark_url || '',
  favicon_url: cachedSettings.favicon_url || '',
  favicon_notification_logo: cachedSettings.favicon_notification_logo || '',
  app_name: cachedSettings.app_name || '',
  app_description: cachedSettings.app_description || '',
  no_internet_title: cachedSettings.no_internet_title || '',
  no_internet_content: cachedSettings.no_internet_content || '',
  page_404_content: cachedSettings.page_404_content || '',
  page_404_title: cachedSettings.page_404_title || '',
  maintenance_mode: cachedSettings.maintenance_mode || '',
  maintenance_image_url: cachedSettings.maintenance_image_url || '',
  maintenance_title: cachedSettings.maintenance_title || '',
  maintenance_message: cachedSettings.maintenance_message || '',
  display_customizer: cachedSettings.display_customizer || '',
  audio_calls_enabled: cachedSettings.audio_calls_enabled || '',
  video_calls_enabled: cachedSettings.video_calls_enabled || '',
  allow_archive_chat: cachedSettings.allow_archive_chat ?? true,
  allow_media_send: cachedSettings.allow_media_send || '',
  allow_screen_share: cachedSettings.allow_screen_share || '',
  login_method: cachedSettings.login_method || 'both',
  auth_method: cachedSettings.auth_method || 'both',
  time_format: cachedSettings.time_format || '12h',
  allow_status: '',
  allow_user_signup: '',
  svg_color: cachedSettings.svg_color || '',
  default_language: cachedSettings.default_language || '',
  e2e_encryption_enabled: cachedSettings.e2e_encryption_enabled ?? false,
  maximum_message_length: cachedSettings.maximum_message_length || 5000,
}

const settingSlice = createSlice({
  name: 'setting',
  initialState,
  reducers: {
    setSetting: (state, action) => {
      if (!action.payload || !action.payload.settings) {
        console.error('Invalid settings payload:', action.payload)
        return
      }

      const settings = action.payload?.settings || action.payload?.setting

      if (!settings) {
        console.error('Invalid settings payload:', action.payload)
        return
      }

      state.settings = action.payload
      state.sidebar_logo_url = settings.sidebar_logo_url
      state.logo_light_url = settings.logo_light_url || state.logo_light_url
      state.logo_dark_url = settings.logo_dark_url || state.logo_dark_url
      state.favicon_url = settings.favicon_url || state.favicon_url
      state.favicon_notification_logo = settings.favicon_notification_logo_url || state.favicon_notification_logo
      state.app_name = settings.app_name || state.app_name
      state.app_description = settings.app_description || state.app_description
      state.no_internet_title = settings.no_internet_title || state.no_internet_title
      state.no_internet_content = settings.no_internet_content || state.no_internet_content
      state.page_404_content = settings.page_404_content || state.page_404_content
      state.page_404_title = settings.page_404_title || state.page_404_title
      state.maintenance_mode = settings.maintenance_mode ?? state.maintenance_mode
      state.maintenance_image_url = settings.maintenance_image_url || state.maintenance_image_url
      state.maintenance_title = settings.maintenance_title || state.maintenance_title
      state.maintenance_message = settings.maintenance_message || state.maintenance_message
      state.display_customizer = settings.display_customizer ?? state.display_customizer
      state.audio_calls_enabled = settings.audio_calls_enabled ?? state.audio_calls_enabled
      state.video_calls_enabled = settings.video_calls_enabled ?? state.video_calls_enabled
      state.allow_archive_chat = settings.allow_archive_chat ?? state.allow_archive_chat
      state.allow_media_send = settings.allow_media_send ?? state.allow_media_send
      state.allow_screen_share = settings.allow_screen_share ?? state.allow_screen_share
      state.login_method = settings.login_method || state.login_method
      state.auth_method = settings.auth_method || state.auth_method
      state.time_format = settings.time_format || state.time_format
      state.allow_status = action.payload.settings.allow_status
      state.allow_user_signup = action.payload.settings.allow_user_signup
      state.svg_color = settings.svg_color || state.svg_color
      state.default_language = settings.default_language || state.default_language
      state.e2e_encryption_enabled = settings.e2e_encryption_enabled || state.e2e_encryption_enabled
      state.maximum_message_length = settings.maximum_message_length || state.maximum_message_length

      try {
        localStorage.setItem('app_settings', JSON.stringify(state))
      } catch (error) {
        console.error('Failed to cache settings:', error)
      }
    },
  },
})

export const { setSetting } = settingSlice.actions

export default settingSlice.reducer
