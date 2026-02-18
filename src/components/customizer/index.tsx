import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { setLayoutType } from '../../redux/reducers/templateCustomizerSlice'
import { SvgIcon } from '../../shared/icons'
import ChatWallpaper from './ChatWallpaper'
import SettingSidebar from './Configurations'
import SidebarSetting from './SidebarSetting' 
import TemplateLayout from './TemplateLayout'
import ColorChoose from './ThemeColor'

const TemplateCustomizer = () => {
  const dispatch = useAppDispatch();
  const { layoutType } = useAppSelector((state) => state.templateCustomizer);
  const [customizer, setCustomizer] = useState(false);
  const toggleCustomizer = () => setCustomizer(!customizer);

  return (
    <>
      <div className="sidebar-panel-main">
        <ul>
          <li className="rtl-setting icon-btn btn-primary" onClick={() => dispatch(setLayoutType())}>
            {layoutType ? 'RTL' : 'LTR'}
          </li>
          <li className="cog-click icon-btn btn-success" onClick={toggleCustomizer}>
            <SvgIcon iconId="setting" className='common-svg-hw' />
          </li>
        </ul>
      </div>
      <section className="setting-sidebar" style={customizer ? { right: '0px' } : { right: '-400px' }}>
        <SettingSidebar setCustomizer={toggleCustomizer} />
        <ColorChoose />
        <TemplateLayout />
        <div className="chat-wallpaper">
          <ChatWallpaper />
          <SidebarSetting />
        </div>
      </section>
    </>
  )
}

export default TemplateCustomizer
