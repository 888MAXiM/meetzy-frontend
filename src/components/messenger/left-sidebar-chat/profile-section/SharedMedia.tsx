import { Fragment, useState, type MutableRefObject } from 'react'
import { Gallery, Item } from 'react-photoswipe-gallery'
import { Badge, Col, Collapse, Row } from 'reactstrap'
import { ImageBaseUrl } from '../../../../constants'
import { useAppSelector } from '../../../../redux/hooks'
import { SharedImage } from '../../../../types/api'

const SharedMedia = () => {
  const [isOpen, setIsOpen] = useState(true)
  const { selectedUserProfile } = useAppSelector((state) => state.chat)

  const grouped = selectedUserProfile?.shared_images.reduce((acc, item) => {
    const dateKey = new Date(item?.date)?.toISOString()?.split('T')[0]

    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(item)

    return acc
  }, {} as Record<string, SharedImage[]>)

  const groupedArr = grouped
    ? Object.entries(grouped).map(([date, images]) => ({
        date,
        images,
        badgeCount: images.length,
      }))
    : []

  return (
    <div className="media-gallery portfolio-section grid-portfolio">
      <div className="collapse-block profile-collapse-block open">
        <h5 className="block-title" onClick={() => setIsOpen(!isOpen)}>
          Shared Media
          <Badge className="badge-outline-dark sm">{selectedUserProfile?.shared_images.length}</Badge>
        </h5>
        <Collapse isOpen={isOpen}>
          <div className="block-content">
            <Row className="share-media zoom-gallery custom-scrollbar">
              {groupedArr.length > 0 ? (
                groupedArr.slice(0, 3).map((item, index) => (
                  <Gallery key={index}>
                    <Fragment key={index}>
                      <div className="col-12">
                        <h6 className="mb-2">{item.date}</h6>
                      </div>
                      {item.images.map((img, index) => (
                        <Col xs="4" key={index} className={`${index + 1 === 1 ? 'isotopeSelector filter' : ''}`}>
                          <div className={`${index + 1 !== 1 ? 'isotopeSelector filter' : ''}`}>
                            <div className="overlay">
                              <div className="border-portfolio">
                                <Item original={`${ImageBaseUrl}${img.url}`} width="500" height="500">
                                  {({ ref, open }) => (
                                    <a onClick={open} className="bg-img">
                                      <div className="overlay-background">
                                        <i className="ti-plus" />
                                      </div>
                                      <img
                                        className="img-fluid bg-img"
                                        ref={ref as unknown as MutableRefObject<HTMLImageElement>}
                                        src={`${ImageBaseUrl}${img.url}`}
                                        alt="portfolio-image"
                                      />
                                    </a>
                                  )}
                                </Item>
                              </div>
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Fragment>
                  </Gallery>
                ))
              ) : (
                <p>No Shared Media</p>
              )}
            </Row>
          </div>
        </Collapse>
      </div>
    </div>
  )
}

export default SharedMedia
