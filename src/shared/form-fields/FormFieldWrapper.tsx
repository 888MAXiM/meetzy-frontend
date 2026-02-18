import { useTranslation } from 'react-i18next'
import { FormFeedback, FormGroup, FormText, Label } from 'reactstrap'
import type { FormFieldWrapperProps } from '../../types/shared'

const FormFieldWrapper = ({
  label,
  id,
  name,
  error,
  helperText,
  layout = 'horizontal',
  labelClass = '',
  formGroupClass = '',
  children,
  subDescription,
}: FormFieldWrapperProps) => {
  const { t } = useTranslation()
  const isHorizontal = layout === 'horizontal'

  return (
    <FormGroup className={`${formGroupClass}`}>
      {label && !subDescription && (
        <Label htmlFor={id || name} className={labelClass || (isHorizontal ? 'col-sm-12 col-form-label' : '')}>
          {t(label)}
        </Label>
      )}
      <div className={`{!isHorizontal ? 'col-sm-9' : 'col-xs-12'} ${subDescription ? 'd-flex' : ''}`}>
        {label && subDescription && (
          <Label htmlFor={id || name} className={labelClass || (isHorizontal ? 'col-sm-12 col-form-label' : '')}>
            {t(label)}
          </Label>
        )}
        {children}
        {error && <FormFeedback className="d-block">{typeof error === 'string' ? t(error) : error}</FormFeedback>}
        {helperText && !error && <FormText color="muted">{t(helperText)}</FormText>}
      </div>
      {subDescription && <p>Turn on this setting to whether your contact can see {t(subDescription)} or not.</p>}
    </FormGroup>
  )
}

export default FormFieldWrapper
