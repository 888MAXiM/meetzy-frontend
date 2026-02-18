import { useState, useRef, useCallback } from 'react'
import { Modal, ModalBody, ModalHeader, ModalFooter, Form, FormGroup, Label, Input, Row, Col } from 'reactstrap'
import { Upload, X, FileText, Camera } from 'react-feather'
import { mutations } from '../../../../../../api'
import { SolidButton } from '../../../../../../shared/button'
import { toaster } from '../../../../../../utils/custom-functions'
import { useAppSelector } from '../../../../../../redux/hooks'

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  requestId: string | null
  subscriptionId?: number | string | null
  onUploadSuccess?: () => void
}

const DOCUMENT_TYPES = [
  "Driver's license",
  'Passport',
  'National identification card',
  'Tax filing',
  'Recent utility bill',
  'Articles of incorporation',
]

const DocumentUploadModal = ({ isOpen, onClose, requestId, subscriptionId, onUploadSuccess }: DocumentUploadModalProps) => {
  const { user } = useAppSelector((state) => state.auth)
  const [documentType, setDocumentType] = useState<string>('')
  const [showDocumentTypeModal, setShowDocumentTypeModal] = useState(false)
  const [fullName, setFullName] = useState<string>(user?.name || '')
  const [category, setCategory] = useState<string>('individual')
  const [documentFront, setDocumentFront] = useState<File | null>(null)
  const [documentBack, setDocumentBack] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [previewFront, setPreviewFront] = useState<string | null>(null)
  const [previewBack, setPreviewBack] = useState<string | null>(null)
  const [previewSelfie, setPreviewSelfie] = useState<string | null>(null)

  const frontInputRef = useRef<HTMLInputElement>(null)
  const backInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)

  const uploadDocumentsMutation = mutations.useUploadDocuments()
  
  // Show additional fields if using subscription_id (no verification request exists yet)
  const needsAdditionalInfo = !requestId && subscriptionId

  const handleFileSelect = useCallback((file: File | null, type: 'front' | 'back' | 'selfie') => {
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toaster('error', 'Please select a valid image file (JPEG, PNG, or WebP)')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toaster('error', 'File size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      if (type === 'front') {
        setDocumentFront(file)
        setPreviewFront(result)
      } else if (type === 'back') {
        setDocumentBack(file)
        setPreviewBack(result)
      } else if (type === 'selfie') {
        setSelfie(file)
        setPreviewSelfie(result)
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const handleRemoveFile = useCallback((type: 'front' | 'back' | 'selfie') => {
    if (type === 'front') {
      setDocumentFront(null)
      setPreviewFront(null)
      if (frontInputRef.current) frontInputRef.current.value = ''
    } else if (type === 'back') {
      setDocumentBack(null)
      setPreviewBack(null)
      if (backInputRef.current) backInputRef.current.value = ''
    } else if (type === 'selfie') {
      setSelfie(null)
      setPreviewSelfie(null)
      if (selfieInputRef.current) selfieInputRef.current.value = ''
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!requestId && !subscriptionId) {
      toaster('error', 'Verification request ID or subscription ID is required')
      return
    }

    if (!documentType) {
      toaster('error', 'Please select a document type')
      return
    }

    if (needsAdditionalInfo) {
      if (!fullName.trim()) {
        toaster('error', 'Please enter your full name')
        return
      }
      if (!category) {
        toaster('error', 'Please select a category')
        return
      }
    }

    if (!documentFront) {
      toaster('error', 'Please upload the front of your document')
      return
    }

    if (!selfie) {
      toaster('error', 'Please upload a selfie')
      return
    }

    const formData = new FormData()
    if (requestId) {
      formData.append('request_id', requestId)
    } else if (subscriptionId) {
      formData.append('subscription_id', subscriptionId.toString())
      formData.append('full_name', fullName.trim())
      formData.append('category', category)
    }
    formData.append('document_type', documentType)
    formData.append('front', documentFront)
    if (documentBack) {
      formData.append('back', documentBack)
    }
    formData.append('selfie', selfie)

    try {
      await uploadDocumentsMutation.mutateAsync(formData)
      toaster('success', 'Documents uploaded successfully! Your verification is now under review.')
      
      // Reset form
      setDocumentType('')
      setFullName(user?.name || '')
      setCategory('individual')
      setDocumentFront(null)
      setDocumentBack(null)
      setSelfie(null)
      setPreviewFront(null)
      setPreviewBack(null)
      setPreviewSelfie(null)
      
      if (frontInputRef.current) frontInputRef.current.value = ''
      if (backInputRef.current) backInputRef.current.value = ''
      if (selfieInputRef.current) selfieInputRef.current.value = ''

      onUploadSuccess?.()
      onClose()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to upload documents'
      toaster('error', errorMessage)
    }
  }, [requestId, subscriptionId, documentType, fullName, category, documentFront, documentBack, selfie, user, uploadDocumentsMutation, onUploadSuccess, onClose, needsAdditionalInfo])

  const handleClose = useCallback(() => {
    // Reset form on close
    setDocumentType('')
    setFullName(user?.name || '')
    setCategory('individual')
    setDocumentFront(null)
    setDocumentBack(null)
    setSelfie(null)
    setPreviewFront(null)
    setPreviewBack(null)
    setPreviewSelfie(null)
    
    if (frontInputRef.current) frontInputRef.current.value = ''
    if (backInputRef.current) backInputRef.current.value = ''
    if (selfieInputRef.current) selfieInputRef.current.value = ''
    
    onClose()
  }, [onClose, user])

  const isUploading = uploadDocumentsMutation.isPending
  const canSubmit = 
    documentType && 
    documentFront && 
    selfie && 
    (!needsAdditionalInfo || (fullName.trim() && category)) &&
    !isUploading

  return (
    <>
      <Modal isOpen={isOpen} toggle={handleClose} size="lg" centered>
        <ModalHeader toggle={handleClose} className="d-flex align-items-center gap-2">
          <FileText size={20} />
          Upload Verification Documents
        </ModalHeader>
        <ModalBody>
          <Form>
            {/* Full Name and Category - Only shown when using subscription_id */}
            {needsAdditionalInfo && (
              <>
                <FormGroup>
                  <Label for="full-name" className="fw-semibold">
                    Full Name <span className="text-danger">*</span>
                  </Label>
                  <Input
                    id="full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="category" className="fw-semibold">
                    Category <span className="text-danger">*</span>
                  </Label>
                  <Input
                    id="category"
                    type="select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="individual">Individual</option>
                    <option value="business">Business</option>
                    <option value="creator">Creator</option>
                  </Input>
                </FormGroup>
              </>
            )}

            {/* Document Type Selection */}
            <FormGroup>
              <Label for="document-type" className="fw-semibold">
                Document Type <span className="text-danger">*</span>
              </Label>
              <Input
                id="document-type"
                type="text"
                value={documentType}
                readOnly
                onClick={() => setShowDocumentTypeModal(true)}
                placeholder="Select a document type"
                className="cursor-pointer"
              />
            </FormGroup>
            <Row>
              {/* Document Front Upload */}
              <Col xs="4">
                <FormGroup>
                  <Label className="fw-semibold">
                    Document Front <span className="text-danger">*</span>
                  </Label>
                  <div className="image-upload border rounded p-3 text-center">
                    {previewFront ? (
                      <div className="position-relative">
                        <img
                          src={previewFront}
                          alt="Document front"
                          className="img-fluid rounded mb-2"
                          style={{ maxHeight: '200px' }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 image-upload-btn"
                          onClick={() => handleRemoveFile('front')}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload size={40} className="text-muted mb-2" />
                        <p className="text-muted small mb-2">Upload the front of your document</p>
                        <SolidButton
                          color="secondary"
                          onClick={() => frontInputRef.current?.click()}
                          className="btn-bg-secondary btn-sm"
                        >
                          Choose File
                        </SolidButton>
                      </div>
                    )}
                    <input
                      ref={frontInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] || null, 'front')}
                      className="d-none"
                    />
                  </div>
                </FormGroup>
              </Col>

              {/* Document Back Upload (Optional) */}
              <Col xs="4">
                <FormGroup>
                  <Label className="fw-semibold">
                    Document Back <span className="text-muted small">(Optional)</span>
                  </Label>
                  <div className="image-upload border rounded p-3 text-center">
                    {previewBack ? (
                      <div className="position-relative">
                        <img
                          src={previewBack}
                          alt="Document back"
                          className="img-fluid rounded mb-2"
                          style={{ maxHeight: '200px' }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 image-upload-btn"
                          onClick={() => handleRemoveFile('back')}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload size={40} className="text-muted mb-2" />
                        <p className="text-muted small mb-2">Upload the back of your document (if applicable)</p>
                        <SolidButton
                          color="secondary"
                          onClick={() => backInputRef.current?.click()}
                          className="btn-bg-secondary btn-sm"
                        >
                          Choose File
                        </SolidButton>
                      </div>
                    )}
                    <input
                      ref={backInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] || null, 'back')}
                      className="d-none"
                    />
                  </div>
                </FormGroup>
              </Col>

              {/* Selfie Upload */}
              <Col xs="4">
                <FormGroup>
                  <Label className="fw-semibold">
                    Selfie <span className="text-danger">*</span>
                  </Label>
                  <div className="image-upload border rounded p-3 text-center">
                    {previewSelfie ? (
                      <div className="position-relative">
                        <img
                          src={previewSelfie}
                          alt="Selfie"
                          className="img-fluid rounded mb-2"
                          style={{ maxHeight: '200px' }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 image-upload-btn"
                          onClick={() => handleRemoveFile('selfie')}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Camera size={40} className="text-muted mb-2" />
                        <p className="text-muted small mb-2">Upload a clear selfie of yourself</p>
                        <SolidButton
                          color="secondary"
                          onClick={() => selfieInputRef.current?.click()}
                          className="btn-bg-secondary btn-sm"
                        >
                          Choose File
                        </SolidButton>
                      </div>
                    )}
                    <input
                      ref={selfieInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] || null, 'selfie')}
                      className="d-none"
                    />
                  </div>
                </FormGroup>
              </Col>
            </Row>
            <div className="alert alert-info mt-3">
              <small>
                <strong>Note:</strong> Please ensure all documents are clear and readable. Documents will be reviewed by our team.
              </small>
            </div>
          </Form>
        </ModalBody>
        <ModalFooter>
          <SolidButton color="secondary" className="btn-bg-secondary" onClick={handleClose} disabled={isUploading}>
            Cancel
          </SolidButton>
          <SolidButton
            color="primary"
            className="btn-bg-primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isUploading ? 'Uploading...' : 'Submit Documents'}
          </SolidButton>
        </ModalFooter>
      </Modal>

      {/* Document Type Selection Modal */}
      <Modal isOpen={showDocumentTypeModal} toggle={() => setShowDocumentTypeModal(false)} centered>
        <ModalHeader toggle={() => setShowDocumentTypeModal(false)}>Select a document type</ModalHeader>
        <ModalBody>
          <ul className="list-unstyled mb-0">
            {DOCUMENT_TYPES.map((type) => (
              <li
                key={type}
                className="p-3 border-bottom cursor-pointer hover-bg-light"
                onClick={() => {
                  setDocumentType(type)
                  setShowDocumentTypeModal(false)
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {type}
              </li>
            ))}
          </ul>
        </ModalBody>
      </Modal>
    </>
  )
}

export default DocumentUploadModal
