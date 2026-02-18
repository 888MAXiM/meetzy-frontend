import { Col, Container, Row } from 'reactstrap'
import { Image } from '../shared/image'
import { ImagePath } from '../constants'
import { ROUTES } from '../constants/route'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <section className="error-main">
      <Container className="position-relative">
        <Row>
          <Col xs="12" lg="6">
            <div className="error-images">
              <Image className="img-fluid" src={`${ImagePath}/error/1.png`} alt="footer-back-img" />
            </div>
          </Col>
          <Col xs="12" lg="6">
            <div className="error-contain">
              <h1>{'404'}</h1>
              <h2>{'Page Not Found'}</h2>
              <h4>
                {'The Page You Are Attempting To Reach Is Not Available. '}
                <br />
                {'This May Be Because The Page Does Not Exist Or Has Been Moved.'}
              </h4>
              <Link className="btn btn-primary" to={ROUTES.Messenger}>
                {'back to home'}
              </Link>
              <div className="animated-bg">
                <i />
                <i />
                <i />
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default NotFound
