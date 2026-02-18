import type { ConfirmModalProps } from '../../types/shared'
import { SolidButton } from '../button'
import { SvgIcon } from '../icons'
import SimpleModal from './SimpleModal'

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title = 'Are you sure?',
  subtitle = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  iconId,
  showIcon = true,
  showCancelButton = true,
  loadingText,
}: ConfirmModalProps) => {
  const getVariantConfig = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: iconId || 'delete-chat',
          iconClass: 'delete-icon',
          confirmColor: 'danger' as const,
          loaderVariant: 'danger',
        }
      case 'warning':
        return {
          icon: iconId || 'alert-triangle',
          iconClass: 'warning-fill',
          confirmColor: 'warning' as const,
          loaderVariant: 'warning',
        }
      case 'success':
        return {
          icon: iconId || 'check-circle',
          iconClass: 'success-fill-stroke',
          confirmColor: 'success' as const,
          loaderVariant: 'success',
        }
      case 'info':
        return {
          icon: iconId || 'confirmation',
          iconClass: 'info-fill-stroke',
          confirmColor: 'primary' as const,
          loaderVariant: 'info',
        }
      default:
        return {
          icon: iconId || 'table-delete',
          iconClass: 'delete-icon',
          confirmColor: 'danger' as const,
          loaderVariant: 'danger',
        }
    }
  }

  const config = getVariantConfig()

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      closable={!isLoading}
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
      bodyClassName="text-center custom-delete-modal"
    >
      {showIcon && (
        <ul className="decoration common-flex p-0">
          <li className="loader-gif">
            <span className={`${config.loaderVariant} loader-1`}>
              <SvgIcon iconId={config.icon} className={`${config.iconClass} modal-common-svg-hw`} />
            </span>
          </li>
        </ul>
      )}

      <div className="mb-4">
        <h4>{title}</h4>
        <span className="sub-title mb-3">{subtitle}</span>

        {isLoading && loadingText && (
          <div className="loading-text mt-2">
            <span className="text-muted">{loadingText}</span>
          </div>
        )}
      </div>

      <div className="common-flex logout-modal">
        {showCancelButton && (
          <SolidButton className="w-100 btn" color="light" onClick={onClose} disabled={isLoading} title={cancelText} />
        )}

        <SolidButton
          loading={isLoading}
          className="w-100 btn"
          color={config.confirmColor}
          onClick={onConfirm}
          disabled={isLoading}
          title={confirmText}
        />
      </div>
    </SimpleModal>
  )
}

export default ConfirmModal
