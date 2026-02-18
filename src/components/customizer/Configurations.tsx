import { useState } from 'react'
import { X } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { Button, Container, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap'
import type { SettingSidebarType } from '../../types/components/chat'
import Config from '../../utils/config'

const Configurations: React.FC<SettingSidebarType> = ({ setCustomizer }) => {
  const { t } = useTranslation()
  const [modal, setModal] = useState(false)
  const toggle = () => setModal(!modal)

  const handleThemeCopy = async () => {
    const clipBoardString = JSON.stringify(Config, null, 2)
    await navigator.clipboard.writeText(clipBoardString)
    toast.success('Code Copied to clipboard !', { position: 'bottom-right' })
  }
  return (
    <div className="template-title">
      <div className="d-flex">
        <div>
          <h2>{t('customizer')}</h2>
          <h4>{t('real_time_customize')}</h4>
          <Button color="primary" className="plus-popup mt-2 btn-sm" onClick={() => setModal(!modal)}>
            {t('configuration')}
          </Button>
        </div>
        <div className="flex-grow-1">
          <a
            className="icon-btn btn-outline-light button-effect pull-right cog-close"
            onClick={setCustomizer}
          >
            <X />
          </a>
        </div>
        <Modal isOpen={modal} toggle={toggle} className="modal-body configuration-modal add-popup" centered={true}>
          <ModalHeader toggle={toggle}>{t('configuration')}</ModalHeader>
          <ModalBody>
            <Container fluid={true} className="bd-example-row">
              <Row>
                <p>{t('config_desc')} </p>
                <p>
                  <b>{'Path : src > Config > TemplateConfig.tsx'}</b>
                </p>
              </Row>
              {Object.keys(Config).map((key, index) => (
                <h5 className="mb-2" key={index}>
                  <p>
                    <b>{key} :- </b>
                    <span>
                      <b> {Config[key as keyof typeof Config]}</b>
                    </span>
                  </p>
                </h5>
              ))}
            </Container>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" className="notification btn-sm" onClick={handleThemeCopy}>
              {t('copy_text')}
            </Button>
            <Button color="secondary" className="btn-sm" onClick={toggle}>
              {t('cancel')}
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </div>
  )
}

export default Configurations
