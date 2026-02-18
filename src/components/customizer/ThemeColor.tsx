import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { setColorPicker } from '../../redux/reducers/templateCustomizerSlice'

const ThemeColor = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { colorPicker } = useAppSelector((state) => state.templateCustomizer)

  return (
    <div className="color-picker">
      <h5>{t('choose_color')}</h5>
      <ul className="colors">
        {colorPicker.map((item, index) => (
          <li
            className={`${item.class} ${item.active ? 'active' : ''}`}
            data-attr={item.color}
            onClick={() => dispatch(setColorPicker(item.color))}
            key={index}
          />
        ))}
      </ul>
    </div>
  )
}

export default ThemeColor
