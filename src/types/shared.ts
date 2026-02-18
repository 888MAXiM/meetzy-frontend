import type {
  ButtonHTMLAttributes,
  ImgHTMLAttributes,
  MouseEventHandler,
  ReactNode,
  JSX,
  ReactElement,
  HTMLAttributes,
  ChangeEvent,
} from 'react'
import type { InputProps } from 'reactstrap'
import { Props as SelectProps } from 'react-select'
import { ID, Message } from './api'

export type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: any
  baseUrl?: string
  fallbackSrc?: string
}

export type PhoneInputGroupProps = {
  label?: string
  name?: string
  codeName: string
  containerClass?: string
  xxlClass?: number
  xxlClass2?: number
  phoneName?: string
  formGroupClass?: string
  xs1?: string
  xs2?: string
}

export interface SvgProps {
  id?: string
  iconId: string | undefined
  className?: string
  style?: {
    height?: number
    width?: number
    fill?: string
    marginRight?: number
  }
  onClick?: (e?: any) => void
  title?: string
}

export interface SolidButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
  color?: string
  icon?: string
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: MouseEventHandler<HTMLButtonElement>
  iconClass?: string
}

export interface FormFieldWrapperProps {
  label?: string
  id?: string
  name?: string
  error?: string
  touched?: boolean
  helperText?: string
  layout?: 'horizontal' | 'vertical'
  children: ReactNode
  formGroupClass?: string
  labelClass?: string
  fieldColSize?: number
  labelColSize?: number
  subDescription?: string
}

interface IconProps {
  iconId: string
  className?: string
}

export interface TextInputProps extends Omit<InputProps, 'type' | 'innerRef'> {
  name: string
  label?: string
  iconProps?: IconProps
  formGroupClass?: string
  labelClass?: string
  containerClass?: string
  children?: React.ReactNode
  autoComplete?: string
  onlyAlphabets?: boolean
  helperText?: string
  layout?: 'horizontal' | 'vertical'
  noWrapper?: boolean
  autoFocus?: boolean
  type?:
    | 'text'
    | 'textarea'
    | 'email'
    | 'password'
    | 'number'
    | 'tel'
    | 'url'
    | 'search'
    | 'date'
    | 'time'
    | 'datetime-local'
    | 'checkbox'
  placeholder?: string
  id?: string
}

export interface AuthTabsProps {
  activeRoute: string
  loginRoute: string
  signupRoute: string
}

export interface AuthHeaderProps {
  isSignupPage: string
  homeRoute: string
  logoLightPath: string
  logoDarkPath: string
  back?:boolean
}

export interface AuthFormValues {
  name: string
  email: string
  password: string
  phone: string
  countryCode: string
}

export interface AuthFormProps {
  isSignupPage: boolean
  loading: boolean
  forgotPasswordRoute?: string
}

export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  isLoading?: boolean

  title?: string
  subtitle?: string
  confirmText?: string
  cancelText?: string

  variant?: 'default' | 'danger' | 'warning' | 'success' | 'info'

  iconId?: string
  showIcon?: boolean
  showCancelButton?: boolean
  loadingText?: string
}

export interface ModalAction {
  text?: string
  title?: string
  onClick: () => void | Promise<void>
  color?: string
  disabled?: boolean
  loading?: boolean
  className?: string
  autoClose?: boolean
  confirmRequired?: boolean
  confirmText?: string
  icon?: string
  iconClass?: string
  type?: 'button' | 'submit' | 'reset'
}

export interface SimpleModalProps {
  isOpen: boolean
  onClose: () => void
  subtitle?: string | ReactNode
  title?: string | ReactNode
  children: ReactNode
  actions?: ModalAction[]
  centered?: boolean
  scrollable?: boolean
  fullscreen?: boolean
  closable?: boolean
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  autoFocus?: boolean
  returnFocusAfterClose?: boolean
  loading?: boolean
  loadingText?: string
  className?: string
  headerClassName?: string
  bodyClassName?: string
  footerClassName?: string
  modalClassName?: string
  onOpened?: () => void
  onClosed?: () => void
  ariaLabel?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  ariaDescribedBy?: string
  footerJustify?: 'start' | 'center' | 'end' | 'between' | 'around'
  fade?: boolean
  backdropTransition?: object
  modalTransition?: object
  titleTag?: keyof JSX.IntrinsicElements
}

export interface AvatarProps {
  data?: {
    avatar?: string | null
    type?: string
    name?: string | null
    first_name?: string | null
  }
  placeHolder?: string
  name?: {
    first_name?: string | null
    name?: string | null
  }
  customClass?: string
  height?: number
  width?: number
  noPrevClass?: boolean
  nameWithRound?: boolean
  type?: string
}
export interface DynamicPopoverProps {
  trigger?: ReactNode
  children: ReactNode | ((opts: { closePopover: () => void }) => ReactNode)
  title?: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  popoverClassName?: string
  hideArrow?: boolean
  delay?: { show: number; hide: number }
  triggerType?: 'click' | 'hover'
  isOpen?: boolean
  toggle?: (isOpen?: boolean) => void
  onToggle?: (isOpen: boolean) => void
  closeOnScroll?: boolean
  style?: React.CSSProperties
}

export interface TriggerElementProps {
  ref?: ((node: HTMLElement | null) => void) | { current: HTMLElement | null }
  onClick?: (e: React.MouseEvent<HTMLElement>) => void
  onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void
  onMouseLeave?: (e: React.MouseEvent<HTMLElement>) => void
  className?: string
  [key: string]: unknown
}

export interface HintProps {
  label: string
  children: ReactElement<HTMLAttributes<HTMLElement>>
  placement?: 'top' | 'bottom' | 'right' | 'left'
  forceOpen?: boolean
}

export interface DeleteMessageModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (deleteType: 'delete-for-me' | 'delete-for-everyone') => void
  isLoading?: boolean
  isGroupChat?: boolean
  canDeleteForEveryone?: boolean
  selectedCount?: number
}
export interface OptionType {
  label: string
  value: string | number
}

export interface SearchableSelectProps extends Partial<SelectProps<OptionType>> {
  options: OptionType[]
  value: OptionType | null
  onChange: (selected: OptionType | null | any) => void
  placeholder?: string
  isClearable?: boolean
}
export interface SwitchInputProps {
  name: string
  id?: string
  label?: string
  iconProps?: SvgProps
  containerClass?: string
  onToggle?: (checked: boolean) => void
  disabled?: boolean
  helperText?: string
  layout?: 'horizontal' | 'vertical'
  formGroupClass?: string
  checked?: boolean
  labelClass?: string
  subDescription?: string
  preventImmediateToggle?: boolean
  useFormik?: boolean
}

export interface SelectImageHookProps {
  name?: string | undefined
  image: string | undefined
}

export interface UseImagePreviewReturn {
  previewUrl: string | null
  handleFileSelect: (file: File) => void
  clearPreview: () => void
  setPreviewUrl: (url: string | null) => void
}

export interface SelectImageProps {
  name?: string
  image?: string | null
  avatarPreview: string | null
  removeAvatar: boolean
  hasAvatar: boolean
  onAvatarChange: (e: ChangeEvent<HTMLInputElement>) => void
  onRemoveAvatar: () => void
  removeBtn?: boolean
}

export interface MessageReadByModalProps {
  isOpen: boolean
  onClose: () => void
  channelMembers?: Array<{
    id: string
    name: string
    avatar: string
    profile_color: string
  }>
  message: Message
}

export interface GalleryMedia {
  src: string
  alt: string
  messageId?: ID
  fileName?: string | null
  type?: 'image' | 'video'
  fileType?: string | null
  originalFile?: any
  isDeleted?: boolean
}

export interface MediaGalleryProps {
  media: GalleryMedia[]
  initialIndex?: number
  onClose: () => void
  onSlideChange?: (index: number) => void
  className?: string
}

export type SupportedAudioContext = typeof AudioContext

export interface WebkitWindow extends Window {
  webkitAudioContext?: SupportedAudioContext
}

export interface MessageNotificationPayload {
  title: string
  body: string
  tag?: string
  highlightLabel?: string
  forceNotification?: boolean
  onClick?: () => void
}

export interface CallNotificationPayload {
  title: string
  body?: string
  tag?: string
  requireInteraction?: boolean
  onClick?: () => void
}

export interface FriendRequestNotificationPayload {
  title: string
  body: string
  tag?: string
  onClick?: () => void
  highlightLabel?: string
  forceNotification?: boolean
}
