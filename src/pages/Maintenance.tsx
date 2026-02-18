import { Container } from 'reactstrap'
import { useAppSelector } from '../redux/hooks'
import { ImageBaseUrl } from '../constants'

const MaintenancePage = () => {
  const { maintenance_image_url, maintenance_title, maintenance_message } = useAppSelector((state) => state.settings)

  const defaultBgImage = '../../public/assets/images/error/maintenance-bg.jpg'

  const backgroundImage = ImageBaseUrl + maintenance_image_url

  return (
    <div
      className="error-wrapper maintenance-bg"
      style={
        {
          '--maintenance-bg-image': `url(${maintenance_image_url ? backgroundImage : defaultBgImage})`,
        } as React.CSSProperties
      }
    >
      <Container>
        <ul className="simple-list maintenance-icons">
          <li>
            <i className="fa fa-cog"></i>
          </li>
          <li>
            <i className="fa fa-cog"></i>
          </li>
          <li>
            <i className="fa fa-cog"></i>
          </li>
        </ul>
        <div className="maintenance-heading">
          <h2 className="headline">{maintenance_title}</h2>
          <p className="sub-content">{maintenance_message}</p>
        </div>
      </Container>
    </div>
  )
}

export default MaintenancePage
