import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { getStorage, getToken } from '../../utils'
import { STORAGE_KEYS } from '../../constants/storageKeys'
import type { User } from '../../types/api'
import type { AuthState, LoginPayload } from '../../types/store'
import Cookies from 'js-cookie'
import CryptoJS from 'crypto-js'

const storage = getStorage()
const token = getToken()
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY

const COOKIE_KEYS = {
  REMEMBER_EMAIL: 'remember_email',
  REMEMBER_PASSWORD: 'remember_password',
  REMEMBER_PHONE: 'remember_phone',
  REMEMBER_COUNTRY_CODE: 'remember_country_code',
  REMEMBER_ME: 'remember_me',
}

const encryptData = (data: string): string => {
  try {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString()
  } catch (error) {
    console.error('Encryption error:', error)
    return ''
  }
}

const decryptData = (encryptedData: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    console.error('Decryption error:', error)
    return ''
  }
}

const getUserFromStorage = (): User | null => {
  const storedUser = storage.getItem(STORAGE_KEYS.USER)
  if (!storedUser) return null

  try {
    return typeof storedUser === 'string' ? JSON.parse(storedUser) : (storedUser as User)
  } catch {
    return null
  }
}

const getRememberedCredentials = () => {
  const rememberMe = Cookies.get(COOKIE_KEYS.REMEMBER_ME)

  if (rememberMe === 'true') {
    const encryptedEmail = Cookies.get(COOKIE_KEYS.REMEMBER_EMAIL)
    const encryptedPassword = Cookies.get(COOKIE_KEYS.REMEMBER_PASSWORD)
    const encryptedPhone = Cookies.get(COOKIE_KEYS.REMEMBER_PHONE)
    const encryptedCountryCode = Cookies.get(COOKIE_KEYS.REMEMBER_COUNTRY_CODE)

    return {
      email: encryptedEmail ? decryptData(encryptedEmail) : '',
      password: encryptedPassword ? decryptData(encryptedPassword) : '',
      phone: encryptedPhone ? decryptData(encryptedPhone) : '',
      countryCode: encryptedCountryCode ? decryptData(encryptedCountryCode) : '91',
      rememberMe: true,
    }
  }

  return {
    email: '',
    password: '',
    phone: '',
    countryCode: '91',
    rememberMe: false,
  }
}

const initialState: AuthState = {
  token: token || null,
  user: getUserFromStorage(),
  isAuthenticated: !!token,
  forgotPasswordEmail: (storage.getItem(STORAGE_KEYS.FORGOT_PASSWORD_EMAIL) as string) || null,
  identifier: '',
  rememberedCredentials: getRememberedCredentials(),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<LoginPayload>) => {
      state.token = action.payload.token
      state.user = action.payload.user
      state.isAuthenticated = true
      storage.setItem(STORAGE_KEYS.USER, JSON.stringify(action.payload.user))
      storage.setItem(STORAGE_KEYS.TOKEN, action.payload.token)
    },
    setIsAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload.isAuthenticated
      state.token = action.payload.token
      storage.setItem(STORAGE_KEYS.TOKEN, action.payload.token)
    },
    setIdentifier: (state, action) => {
      state.identifier = action.payload
    },
    setForgotPasswordEmail: (state, action: PayloadAction<string>) => {
      state.forgotPasswordEmail = action.payload
      storage.setItem(STORAGE_KEYS.FORGOT_PASSWORD_EMAIL, action.payload)
    },
    clearForgotPasswordEmail: (state) => {
      state.forgotPasswordEmail = null
      storage.removeItem(STORAGE_KEYS.FORGOT_PASSWORD_EMAIL)
    },
    saveRememberMe: (
      state,
      action: PayloadAction<{
        email?: string
        password?: string
        phone?: string
        countryCode?: string
        rememberMe: boolean
      }>,
    ) => {
      const { email, password, phone, countryCode, rememberMe } = action.payload

      if (rememberMe) {
        Cookies.remove(COOKIE_KEYS.REMEMBER_EMAIL)
        Cookies.remove(COOKIE_KEYS.REMEMBER_PASSWORD)
        Cookies.remove(COOKIE_KEYS.REMEMBER_PHONE)
        Cookies.remove(COOKIE_KEYS.REMEMBER_COUNTRY_CODE)
        Cookies.remove(COOKIE_KEYS.REMEMBER_ME)

        const cookieOptions = { expires: 30 }

        if (email) {
          const encryptedEmail = encryptData(email)
          Cookies.set(COOKIE_KEYS.REMEMBER_EMAIL, encryptedEmail, cookieOptions)
        }
        if (password) {
          const encryptedPassword = encryptData(password)
          Cookies.set(COOKIE_KEYS.REMEMBER_PASSWORD, encryptedPassword, cookieOptions)
        }
        if (phone) {
          const encryptedPhone = encryptData(phone)
          Cookies.set(COOKIE_KEYS.REMEMBER_PHONE, encryptedPhone, cookieOptions)
        }
        if (countryCode) {
          const encryptedCountryCode = encryptData(countryCode)
          Cookies.set(COOKIE_KEYS.REMEMBER_COUNTRY_CODE, encryptedCountryCode, cookieOptions)
        }

        Cookies.set(COOKIE_KEYS.REMEMBER_ME, 'true', cookieOptions)

        state.rememberedCredentials = {
          email: email || '',
          password: password || '',
          phone: phone || '',
          countryCode: countryCode || '91',
          rememberMe: true,
        }
      } else {
        Cookies.remove(COOKIE_KEYS.REMEMBER_EMAIL)
        Cookies.remove(COOKIE_KEYS.REMEMBER_PASSWORD)
        Cookies.remove(COOKIE_KEYS.REMEMBER_PHONE)
        Cookies.remove(COOKIE_KEYS.REMEMBER_COUNTRY_CODE)
        Cookies.remove(COOKIE_KEYS.REMEMBER_ME)

        state.rememberedCredentials = {
          email: '',
          password: '',
          phone: '',
          countryCode: '91',
          rememberMe: false,
        }
      }
    },
    logout: (state) => {
      state.token = null
      state.user = null
      state.isAuthenticated = false
      state.forgotPasswordEmail = null
      storage.clear()
      localStorage.clear()
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('isImpersonation')
      }
    },
  },
})

export const {
  loginSuccess,
  setIsAuthenticated,
  setIdentifier,
  logout,
  setForgotPasswordEmail,
  clearForgotPasswordEmail,
  saveRememberMe,
} = authSlice.actions

export default authSlice.reducer
