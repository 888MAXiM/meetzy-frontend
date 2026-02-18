import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Form, Input, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import { toaster } from '../../../../../utils/custom-functions'
import type { FavoriteModalProps } from '../../../../../types/components/chat'
import { X } from 'react-feather'

const FavoriteModal: React.FC<FavoriteModalProps> = ({ toggle, modal, refetch: _ }) => {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) {
      toaster('error', t('please_enter_email_or_username'))
      return
    }
    setIsLoading(true)
    try {
      toaster('info', t('search_and_add_feature_coming_soon'))
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || t('failed_to_add_contact')
      toaster('error', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSearchTerm('')
    setContactNumber('')
    toggle()
  }

  return (
    <Modal fade className="fev-addcall-main add-popup" isOpen={modal} toggle={handleClose}>
      <ModalHeader>
        {t('add_contact')}
        <Button className="close" onClick={handleClose}>
          <X />
        </Button>
      </ModalHeader>
      <ModalBody>
        <Form className="default-form" onSubmit={handleSubmit}>
          <div className="form-group text-center">
            <h5>{t('email_or_username')}</h5>
            <Input
              type="text"
              placeholder="Josephin water"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-group text-center">
            <h5>{t('contact_number')}</h5>
            <Input
              type="text"
              placeholder="12345678912"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
            />
          </div>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button color="danger" className="button-effect btn-sm" onClick={handleClose}>
          {t('cancel')}
        </Button>
        <Button color="primary" className="button-effect btn-sm" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? t('adding') : t('add_contact')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default FavoriteModal
