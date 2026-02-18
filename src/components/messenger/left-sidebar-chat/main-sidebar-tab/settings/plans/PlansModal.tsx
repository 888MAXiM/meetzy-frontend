import { useState } from 'react'
import { Modal, ModalBody, ModalHeader, Button, ModalFooter } from 'reactstrap'
import { FileText, AlertCircle } from 'react-feather'
import { queries } from '../../../../../../api'
import { SinglePlan } from '../../../../../../types/api'

interface PlansModalProps {
  isOpen: boolean
  onClose: () => void
  onPlanClick: (plan: SinglePlan) => void
}

const PlansModal = ({ isOpen, onClose, onPlanClick }: PlansModalProps) => {
  const { data, isLoading } = queries.useGetActivePlans()
  const { data: subscriptionData } = queries.useGetMySubscription()
  const [showRestrictionModal, setShowRestrictionModal] = useState(false)

  const plans: SinglePlan[] = Array.isArray(data?.data) ? data.data : data?.data?.plans || data?.plans || []

  const currentSubscription = subscriptionData?.data?.subscription
  const hasActiveSubscription =
    currentSubscription?.status === 'active' ||
    currentSubscription?.status === 'trialing' ||
    currentSubscription?.status === 'past_due'

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const handlePlanClick = (plan: SinglePlan) => {
    const extendSupport = import.meta.env.VITE_EXTEND_SUPPORT
    if (extendSupport === 'true' || extendSupport === true) {
      onPlanClick(plan)
      onClose()
    } else {
      setShowRestrictionModal(true)
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} toggle={onClose} centered className="plans-modal-modern">
        <ModalHeader toggle={onClose}>
          <FileText size={20} className="me-2" />
          Available Plans
        </ModalHeader>
        <ModalBody className="p-4">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : plans.length > 0 ? (
            <ul className="g-4">
              {plans.map((plan) => {
                const isActivePlan = hasActiveSubscription && currentSubscription?.plan_id === plan.id
                return (
                  <li key={plan.id} className="">
                    <div
                      className={`plan-card ${isActivePlan ? 'active-plan' : ''}`}
                      onClick={() => handlePlanClick(plan)}
                    >
                      <div className="plan-header">
                        <h4 className="plan-name">{plan.name}</h4>
                        {plan.description && <p className="plan-description">{plan.description}</p>}
                      </div>

                      <div className="plan-price-section">
                        <div className="price-display">
                          <span className="price-amount">{formatPrice(plan.price_per_user_per_month)}</span>
                          {plan.price_per_user_per_year && (
                            <span className="price-original">{formatPrice(plan.price_per_user_per_year)}</span>
                          )}
                        </div>
                      </div>

                      <button className="select-plan-btn">🛒 Select Plan</button>

                      <div className="plan-features">
                        <div className="features-title">What's included:</div>

                        <div className="feature-item">
                          <span className="feature-icon">✓</span>
                          <span className="feature-text">Max Members/Group: {plan.max_members_per_group}</span>
                        </div>

                        <div className="feature-item">
                          <span className="feature-icon">✓</span>
                          <span className="feature-text">Max Groups: {plan.max_groups}</span>
                        </div>

                        <div className="feature-item">
                          <span className="feature-icon">✓</span>
                          <span className="feature-text">Broadcasts List: {plan.max_broadcasts_list}</span>
                        </div>

                        <div className="feature-item">
                          <span className="feature-icon">✓</span>
                          <span className="feature-text">
                            Max Members/Broadcasts: {plan.max_members_per_broadcasts_list}
                          </span>
                        </div>

                        <div className="feature-item">
                          <span className="feature-icon">✓</span>
                          <span className="feature-text">Max Status: {plan.max_status}</span>
                        </div>

                        <div className="feature-item">
                          <span className="feature-icon">✓</span>
                          <span className="feature-text">File Sharing {plan.allows_file_sharing}</span>
                        </div>

                        <div className="feature-item">
                          <span className="feature-icon">✓</span>
                          <span className="feature-text">Video Calls {plan.video_calls_enabled}</span>
                        </div>

                        {plan.is_default && (
                          <div className="feature-item">
                            <span className="feature-icon">✓</span>
                            <span className="feature-text">Default Plan</span>
                          </div>
                        )}

                        {isActivePlan && (
                          <div className="active-badge mt-3">
                            <span className="badge bg-success">✓ Active Subscription</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">No plans available</p>
            </div>
          )}
        </ModalBody>
      </Modal>

      <Modal
        isOpen={showRestrictionModal}
        toggle={() => setShowRestrictionModal(false)}
        centered
        className="modal-dialog-centered"
      >
        <ModalHeader toggle={() => setShowRestrictionModal(false)}>
          <div className="d-flex align-items-center">

          <AlertCircle className="text-warning me-2" size={20} />
          Feature Restricted
          </div>
        </ModalHeader>
        <ModalBody>
          <p className="text-center mb-0">
            The plan module is available only in the Extended version of the product. To access plan functionality,
            please purchase the Extended version.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setShowRestrictionModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default PlansModal
