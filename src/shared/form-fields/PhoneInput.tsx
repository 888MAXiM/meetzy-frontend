import { useField } from 'formik'
import Select from 'react-select'
import { Col, FormFeedback, FormGroup, Input, Label, Row } from 'reactstrap'
import { useTranslation } from 'react-i18next'
import type { PhoneInputGroupProps } from '../../types/shared'
import { countryCodes } from '../../data/shared'

const PhoneInput = ({ label, name, codeName, containerClass, xxlClass, xxlClass2, xs1, xs2 }: PhoneInputGroupProps) => {
  const [codeField, codeMeta, codeHelpers] = useField(codeName || 'country_code')
  const [phoneField, phoneMeta] = useField(name || 'phone')
  const { t } = useTranslation()

  const countryCodeOptions = countryCodes.map((c) => ({
    label: c.name,
    value: c.code.replace('+', ''),
    flag: c.flag,
    displayCode: c.code,
  }))

  const selectedCode = countryCodeOptions.find((opt) => opt.value === codeField.value)

  return (
    <FormGroup className={`${containerClass ? containerClass : ''} text-start `}>
      {label && <Label>{t(label)}</Label>}
      <Row className="g-2">
        <Col xxl={xxlClass} xs={xs1}>
          <Select
            className="phone-input"
            defaultValue={countryCodeOptions}
            options={countryCodeOptions}
            value={selectedCode}
            onChange={(option) => {
              codeHelpers.setValue(option?.value || '')
            }}
            onBlur={() => codeHelpers.setTouched(true)}
            isClearable={false}
            isSearchable
            classNamePrefix="react-select"
            placeholder="Select"
            formatOptionLabel={(option) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {option.flag.startsWith('http') ? (
                  <img src={option.flag} alt={option.label} width={20} height={15} style={{ objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.2rem' }}>{option.flag}</span>
                )}
                <span>{option.displayCode}</span>
              </div>
            )}
          />
          {codeMeta.touched && codeMeta.error && (
            <FormFeedback style={{ display: 'block' }}>{codeMeta.error}</FormFeedback>
          )}
        </Col>
        <Col xxl={xxlClass2} xs={xs2}>
          <Input
            {...phoneField}
            type="tel"
            className="custom-input"
            placeholder={t('type_a_number')}
            value={phoneField.value ?? ''}
            invalid={phoneMeta.touched && !!phoneMeta.error}
          />
          {phoneMeta.touched && phoneMeta.error && <FormFeedback>{phoneMeta.error}</FormFeedback>}
        </Col>
      </Row>
    </FormGroup>
  )
}

export default PhoneInput
