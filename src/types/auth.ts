import type { UseMutateFunction } from '@tanstack/react-query'
import type { FormikHelpers } from 'formik'
import type { CombinedErrorResponse, User } from './api'
import type { Dispatch } from '@reduxjs/toolkit'
import type { NavigateFunction } from 'react-router-dom'

interface OtpPayload {
  otp: string
}

export interface OtpInputProps {
  val: string[]
  setVal: (val: string[]) => void
  submitForm?: (values: OtpPayload, helpers: FormikHelpers<OtpPayload>) => void
  digits?: number
}

export interface ResetPasswordFormValues {
  password: string
  confirm_password: string
}

export interface LoginResponse {
  message?: string;
  token: string
  user: User
}

export interface LoginCredentials {
  email?: string
  identifier?: string
  password: string
}

export interface LoginFormProps {
  loginMutate: UseMutateFunction<LoginResponse, CombinedErrorResponse, LoginCredentials, unknown>
  dispatch: Dispatch
  navigate: NavigateFunction
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
  phone: string
  countryCode: string
  country?: string
}

export interface SignupFormProps {
  registerMutate: UseMutateFunction<void, CombinedErrorResponse, RegisterCredentials, unknown>
  navigate: NavigateFunction
}

export interface OtpInputProps {
  val: string[]
  setVal: (val: string[]) => void
  submitForm?: (values: OtpPayload, helpers: FormikHelpers<OtpPayload>) => void
  digits?: number
}

export interface OTPInitResponse {
  type: string;
  message: string;
  user_exists?: boolean;
}