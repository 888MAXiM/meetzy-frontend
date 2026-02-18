import { useField } from 'formik'
import SvgIcon from '../icons/SvgIcon'
import FormFieldWrapper from './FormFieldWrapper'
import { SwitchInputProps } from '../../types/shared'

const SwitchInput = ({
  name,
  id,
  label,
  iconProps,
  containerClass = 'login-input',
  formGroupClass = '',
  labelClass = '',
  onToggle,
  disabled,
  helperText,
  layout = 'horizontal',
  subDescription,
  preventImmediateToggle = false,
}: SwitchInputProps) => {
  const [field, meta, helpers] = useField({ name, type: 'checkbox' })
  const inputId = id || name

  const switchElement = (
    <label className="custom-switch mb-0">
      <input
        {...field}
        id={inputId}
        checked={field.value ?? false}
        type="checkbox"
        disabled={disabled}
        onChange={(e) => {
          if (preventImmediateToggle) {
            onToggle?.(e.target.checked)
          } else {
            const checked = e.target.checked
            helpers.setValue(checked)
            onToggle?.(checked)
          }
        }}
      />
      <span className="slider" />
    </label>
  )

  const content = (
    <FormFieldWrapper
      label={label}
      id={inputId}
      name={name}
      error={meta.error}
      touched={meta.touched}
      helperText={helperText}
      layout={layout}
      labelClass={labelClass}
      formGroupClass={formGroupClass}
      subDescription={subDescription}
    >
      {switchElement}
    </FormFieldWrapper>
  )

  return iconProps?.iconId ? (
    <div className={containerClass}>
      <SvgIcon {...iconProps} />
      {content}
    </div>
  ) : (
    content
  )
}

export default SwitchInput
