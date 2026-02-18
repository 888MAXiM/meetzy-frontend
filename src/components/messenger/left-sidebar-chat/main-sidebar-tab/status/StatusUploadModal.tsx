import { useTranslation } from 'react-i18next'
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import type { StatusUploadModalProps } from '../../../../../types/components/chat'

const StatusUploadModal: React.FC<StatusUploadModalProps> = ({
  isOpen,
  onClose,
  selectedFile,
  caption,
  onCaptionChange,
  onUpload,
  uploading
}) => {
  const { t } = useTranslation()
  return (
    <Modal isOpen={isOpen} toggle={onClose} centered>
      <ModalHeader toggle={onClose}>{t('add_caption')}</ModalHeader>
      <ModalBody>
        {selectedFile && (
          <div className="preview mb-3">
            {selectedFile.type.startsWith('image/') ? (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="preview"
                className="img-fluid rounded status-upload-img"
              />
            ) : (
              <video src={URL.createObjectURL(selectedFile)} controls className="w-100 rounded status-upload-video" />
            )}
          </div>
        )}
        <textarea
          className="form-control"
          placeholder="Add a caption (optional)"
          value={caption ?? ''}
          onChange={(e) => onCaptionChange(e.target.value)}
          rows={3}
          maxLength={200}
        />
        <small className="text-muted">{caption.length}/200</small>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button color="primary" onClick={onUpload} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Status'}
          {' '}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default StatusUploadModal
