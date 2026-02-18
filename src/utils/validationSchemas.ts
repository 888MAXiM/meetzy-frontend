import * as Yup from 'yup'

export const loginValidationSchema = Yup.object({
  identifier: Yup.string().required('Email is required').email('Please enter a valid email address'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
})

export const signupValidationSchema = Yup.object({
  name: Yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  phone: Yup.string()
    .matches(/^[0-9]{7,15}$/, 'Phone number must be between 7 and 15 digits')
    .required('Phone number is required'),
  countryCode: Yup.string().required('Country code is required'),
})

export const signupValidation = Yup.object().shape({
  name: Yup.string().required('Name required'),

  email: Yup.string().when('$activeTab', {
    is: 'email',
    then: (s) => s.required('Email required').email('Invalid email'),
    otherwise: (s) => s.notRequired(),
  }),

  phone: Yup.string().when('$activeTab', {
    is: 'phone',
    then: (s) => s.matches(/^[0-9]{7,15}$/, 'Invalid phone').required('Phone required'),
    otherwise: (s) => s.notRequired(),
  }),

  countryCode: Yup.string().when('$activeTab', {
    is: 'phone',
    then: (s) => s.required('Country code required'),
    otherwise: (s) => s.notRequired(),
  }),

  password: Yup.string().when('$login_method', {
    is: (lm: string) => lm === 'password' || lm === 'both',
    then: (s) => s.required('Password required').min(6),
    otherwise: (s) => s.notRequired(),
  }),
})

export const emailPhoneSchema = Yup.object({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  phone: Yup.string()
    .matches(/^[0-9]{7,15}$/, 'Phone number must be between 7 and 15 digits')
    .required('Phone number is required'),
  countryCode: Yup.string().required('Country code is required'),
})

export const linkPasswordSchema = Yup.object({
  email: Yup.string().when('$activeTab', {
    is: 'email',
    then: (s) => s.required('Email required').email('Invalid email'),
    otherwise: (s) => s.notRequired(),
  }),

  phone: Yup.string().when('$activeTab', {
    is: 'phone',
    then: (s) => s.matches(/^[0-9]{7,15}$/, 'Invalid phone').required('Phone required'),
    otherwise: (s) => s.notRequired(),
  }),

  countryCode: Yup.string().when('$activeTab', {
    is: 'phone',
    then: (s) => s.required('Country code required'),
    otherwise: (s) => s.notRequired(),
  }),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
})

export const emailSchema = Yup.object({
  email: Yup.string().email('Invalid email address').required('Email is required'),
})

export const forgotPasswordSchema = Yup.object({
  email: Yup.string().when('$activeTab', {
    is: 'email',
    then: (s) => s.required('Email required').email('Invalid email'),
    otherwise: (s) => s.notRequired(),
  }),

  phone: Yup.string().when('$activeTab', {
    is: 'phone',
    then: (s) => s.matches(/^[0-9]{7,15}$/, 'Invalid phone').required('Phone required'),
    otherwise: (s) => s.notRequired(),
  }),

  countryCode: Yup.string().when('$activeTab', {
    is: 'phone',
    then: (s) => s.required('Country code required'),
    otherwise: (s) => s.notRequired(),
  }),
})

export const otpSchema = Yup.object().shape({
  otp: Yup.string()
    .required('OTP is required')
    .matches(/^[0-9]+$/, 'OTP must contain only numbers')
    .min(4, 'OTP must be at least 4 digits')
    .max(6, 'OTP must be at most 6 digits'),
})

export const confirmPasswordSchema = Yup.object().shape({
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirm_password: Yup.string()
    .oneOf([Yup.ref('password'), undefined], "Password doesn't match")
    .required('Confirm Password is required'),
})
