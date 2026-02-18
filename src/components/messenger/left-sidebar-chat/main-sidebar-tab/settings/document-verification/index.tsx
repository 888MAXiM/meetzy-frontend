import { useState } from 'react'
import { queries } from '../../../../../../api'
import CommonMediaHeading from '../common/CommonMediaHeading'
import DocumentUploadModal from '../plans/DocumentUploadModal'
import { useAppSelector } from '../../../../../../redux/hooks'
import { SolidButton } from '../../../../../../shared/button'
import { CheckCircle, XCircle, Clock, FileText } from 'react-feather'
import { toaster } from '../../../../../../utils/custom-functions'

const DocumentVerification = () => {
  const { settingsActiveTab } = useAppSelector((state) => state.mainSidebar)
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)
  const { data: verificationStatus, refetch: refetchVerificationStatus } = queries.useGetMyVerificationStatus()
  const { data: subscriptionData } = queries.useGetMySubscription()

  const currentRequest = verificationStatus?.data?.current_request
  const isVerified = verificationStatus?.data?.is_verified
  const hasPendingRequest = verificationStatus?.data?.has_pending_request
  const subscription = subscriptionData?.data?.subscription
  const hasActiveSubscription = subscription?.status === 'active'
  const paymentCompleted = currentRequest?.payment?.status === 'completed' || hasActiveSubscription

  // Check if documents are uploaded - both document_front and selfie must exist and be non-empty strings
  const documentFront = currentRequest?.document_front
  const selfie = currentRequest?.selfie
  const documentsUploaded = !!(documentFront && selfie && documentFront.trim() !== '' && selfie.trim() !== '')

  const handleUploadClick = () => {
    // If documents already uploaded, show info message
    if (documentsUploaded) {
      toaster('info', 'Documents have already been uploaded. Your verification is under review.')
      return
    }

    // If there's a verification request but payment not completed
    if (currentRequest?.request_id && !paymentCompleted) {
      toaster('error', 'Please complete payment before uploading documents.')
      return
    }

    // Allow upload if there's a subscription (even without verification request)
    if (hasActiveSubscription || (currentRequest?.request_id && paymentCompleted)) {
      setShowDocumentUpload(true)
      return
    }

    toaster('error', 'Please complete a subscription plan payment to start the verification process.')
  }

  const getStatusBadge = () => {
    if (isVerified) {
      return (
        <span className="badge bg-success d-flex align-items-center gap-1">
          <CheckCircle size={14} />
          Verified
        </span>
      )
    }

    // If documents are uploaded, show "Under Review" even if status is still pending
    if (documentsUploaded && currentRequest?.status === 'pending') {
      return (
        <span className="badge bg-warning d-flex align-items-center gap-1">
          <Clock size={14} />
          Under Review
        </span>
      )
    }

    if (!hasPendingRequest) {
      return (
        <span className="badge bg-secondary d-flex align-items-center gap-1">
          <FileText size={14} />
          Not Started
        </span>
      )
    }

    if (currentRequest?.status === 'pending') {
      return (
        <span className="badge bg-warning d-flex align-items-center gap-1">
          <Clock size={14} />
          Pending
        </span>
      )
    }

    if (currentRequest?.status === 'approved') {
      return (
        <span className="badge bg-success d-flex align-items-center gap-1">
          <CheckCircle size={14} />
          Approved
        </span>
      )
    }

    if (currentRequest?.status === 'rejected') {
      return (
        <span className="badge bg-danger d-flex align-items-center gap-1">
          <XCircle size={14} />
          Rejected
        </span>
      )
    }

    if (currentRequest?.status === 'payment_failed') {
      return (
        <span className="badge bg-danger d-flex align-items-center gap-1">
          <XCircle size={14} />
          Payment Failed
        </span>
      )
    }

    return null
  }

  return (
    <>
      <div className="setting-block border-0">
        <div className={`block ${settingsActiveTab === 'document-verification' ? 'open' : ''}`}>
          <CommonMediaHeading title={'document_verification'} />
          <div className="p-3">
            {isVerified ? (
              <div className="text-center py-4">
                <CheckCircle size={48} className="text-success mb-3" />
                <h5 className="mb-2">You are verified!</h5>
                <p className="text-muted small">
                  Your account has been verified. You can now enjoy all verified features.
                </p>
              </div>
            ) : (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Verification Status</h6>
                  {getStatusBadge()}
                </div>

                {hasPendingRequest && currentRequest && (
                  <div className="mb-4">
                    <div className="card border">
                      <div className="card-body">
                        <div className="mb-3">
                          <strong>Request ID:</strong> <span className="text-muted">{currentRequest.request_id}</span>
                        </div>
                        <div className="mb-3">
                          <strong>Full Name:</strong> <span className="text-muted">{currentRequest.full_name}</span>
                        </div>
                        <div className="mb-3">
                          <strong>Category:</strong>{' '}
                          <span className="text-capitalize text-muted">{currentRequest.category}</span>
                        </div>
                        {currentRequest.document_type && (
                          <div className="mb-3">
                            <strong>Document Type:</strong>{' '}
                            <span className="text-capitalize text-muted">{currentRequest.document_type}</span>
                          </div>
                        )}
                        <div className="mb-3">
                          <strong>Payment Status:</strong>{' '}
                          <span
                            className={`badge ${
                              paymentCompleted
                                ? 'bg-success'
                                : currentRequest.payment?.status === 'failed'
                                ? 'bg-danger'
                                : 'bg-warning'
                            }`}
                          >
                            {currentRequest.payment?.status || 'Pending'}
                          </span>
                        </div>
                        {currentRequest.status === 'rejected' && currentRequest.rejection_reason && (
                          <div className="alert alert-danger mt-3">
                            <strong>Rejection Reason:</strong> {currentRequest.rejection_reason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Priority 1: Show "Documents Submitted" message if documents are already uploaded - this takes highest priority */}
                {documentsUploaded ? (
                  <div className="alert alert-success">
                    <p className="mb-0">
                      <strong>Documents Already Uploaded!</strong> Your verification request is under review. We'll
                      notify you once the review is complete.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Priority 2: Show upload button if subscription exists but no verification request */}
                    {hasActiveSubscription && !hasPendingRequest && (
                      <div className="mb-3">
                        <div className="alert alert-success">
                          <p className="mb-2">
                            <strong>Subscription Active!</strong> Your subscription is active. Please upload your
                            verification documents to complete the verification process.
                          </p>
                        </div>
                        <SolidButton color="primary" className="btn-bg-primary w-100" onClick={handleUploadClick}>
                          <FileText size={18} className="me-2" />
                          Upload Documents
                        </SolidButton>
                      </div>
                    )}

                    {/* Priority 3: Show upload button if verification request exists, payment completed, but documents not uploaded */}
                    {hasPendingRequest && paymentCompleted && (
                      <div className="mb-3">
                        <div className="alert alert-warning">
                          <p className="mb-2">
                            <strong>Payment Completed!</strong> Please upload your verification documents to complete
                            the verification process.
                          </p>
                        </div>
                        <SolidButton color="primary" className="btn-bg-primary w-100" onClick={handleUploadClick}>
                          <FileText size={18} className="me-2" />
                          Upload Documents
                        </SolidButton>
                      </div>
                    )}
                  </>
                )}

                {/* Show info message if no subscription and no verification request */}
                {!hasPendingRequest && !hasActiveSubscription && !documentsUploaded && (
                  <div className="alert alert-info">
                    <p className="mb-0">
                      <strong>Get Verified:</strong> Complete a subscription plan payment to start the verification
                      process.
                    </p>
                  </div>
                )}

                {/* Show payment required message if verification request exists but payment not completed */}
                {hasPendingRequest && !paymentCompleted && !hasActiveSubscription && !documentsUploaded && (
                  <div className="alert alert-warning">
                    <p className="mb-0">
                      <strong>Payment Required:</strong> Please complete the payment to proceed with document upload.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <CommonMediaHeading
          title={'document_verification'}
          text={'upload_verification_documents'}
          type="document-verification"
        />
      </div>

      <DocumentUploadModal
        isOpen={showDocumentUpload}
        onClose={() => {
          setShowDocumentUpload(false)
          refetchVerificationStatus()
        }}
        requestId={currentRequest?.request_id || null}
        subscriptionId={subscription?.id || null}
        onUploadSuccess={() => {
          refetchVerificationStatus()
          toaster('success', 'Documents submitted successfully! Your verification is now under review.')
        }}
      />
    </>
  )
}

export default DocumentVerification
