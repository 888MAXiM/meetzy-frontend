import { useState } from 'react'
import { Check } from 'react-feather'
import { Modal, ModalBody, ModalHeader } from 'reactstrap'
import { useAppSelector } from '../../../../../../redux/hooks'
import { SolidButton } from '../../../../../../shared/button'
import { SinglePlan } from '../../../../../../types/api'
import { toaster } from '../../../../../../utils/custom-functions'
import { queries } from '../../../../../../api'
import PaymentModal from './PaymentModal'
import { ROUTES } from '../../../../../../constants/route'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  plan: SinglePlan | null
}

const SubscriptionModal = ({ isOpen, onClose, plan }: SubscriptionModalProps) => {
  const { user } = useAppSelector((state) => state.auth)
  const { data: subscriptionData } = queries.useGetMySubscription()
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const currentSubscription = subscriptionData?.data?.subscription
  const hasActiveSubscription = currentSubscription?.status === 'active' || 
                                 currentSubscription?.status === 'trialing' || 
                                 currentSubscription?.status === 'past_due'

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const getPrice = () => {
    if (!plan) return 0
    if (selectedBillingCycle === 'yearly' && plan.price_per_user_per_year) {
      return plan.price_per_user_per_year
    }
    return plan.price_per_user_per_month
  }

  const handlePayNow = () => {
    if (!plan) {
      toaster('error', 'Plan information not available')
      return
    }

    if (!user) {
      toaster('error', 'Please login to continue')
      return
    }

    if (hasActiveSubscription) {
      toaster('error', 'You already have an active subscription. Please cancel your current subscription before subscribing to a new plan.')
      return
    }

    setIsPaymentModalOpen(true)
  }

  if (!plan) {
    return null
  }

  const features = [
    { label: 'Verified Badge', value: true },
    { label: 'Max Members Per Group', value: plan.max_members_per_group },
    { label: 'Max Groups', value: plan.max_groups },
    { label: 'Max Broadcasts list', value: `${plan.max_broadcasts_list} per user` },
    { label: 'Max Members Per Broadcasts List', value: plan.max_members_per_broadcasts_list },
    { label: 'Max Status', value: plan.max_status },
    { label: 'File Sharing', value: plan.allows_file_sharing ? 'Enabled' : 'Disabled' },
    { label: 'Video Calls', value: plan.video_calls_enabled ? 'Enabled' : 'Disabled' },
  ]

  return (
    <>
      <Modal isOpen={isOpen} toggle={onClose} size="lg" centered>
        <ModalHeader toggle={onClose} className="d-flex align-items-center gap-2">
          {plan.name}
        </ModalHeader>
        <ModalBody>
          {plan.description && <p className="text-muted mb-4">{plan.description}</p>}

          {/* Billing Cycle Toggle */}
          {plan.billing_cycle === 'both' && (
            <div className="mb-4">
              <div className="d-flex gap-2 p-2 bg-light rounded">
                <button
                  className={`btn flex-fill ${selectedBillingCycle === 'monthly' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setSelectedBillingCycle('monthly')}
                >
                  Monthly
                </button>
                <button
                  className={`btn flex-fill ${selectedBillingCycle === 'yearly' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setSelectedBillingCycle('yearly')}
                >
                  Yearly
                  {plan.price_per_user_per_year && (
                    <span className="badge bg-success ms-2">
                      Save {formatPrice(plan.price_per_user_per_month * 12 - plan.price_per_user_per_year)}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Pricing Card */}
          <div className="p-4 border rounded mb-4 bg-light">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                {selectedBillingCycle === 'yearly' && plan.price_per_user_per_year ? (
                  <>
                    <div className="text-decoration-line-through text-muted small">
                      {formatPrice(plan.price_per_user_per_month * 12)}
                    </div>
                    <div className="h3 mb-0 text-success">
                      {formatPrice(plan.price_per_user_per_year)}/year
                    </div>
                    <div className="text-muted small">
                      Then {formatPrice(plan.price_per_user_per_year)}/year until you cancel
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h3 mb-0">
                      {formatPrice(plan.price_per_user_per_month)}/month
                    </div>
                    <div className="text-muted small">
                      Then {formatPrice(plan.price_per_user_per_month)}/month until you cancel
                    </div>
                  </>
                )}
              </div>
              {selectedBillingCycle === 'yearly' && plan.price_per_user_per_year && (
                <span className="badge bg-success">Welcome offer applied</span>
              )}
            </div>
            <div className="text-muted small">Price may include taxes when applicable</div>
          </div>

          {/* Features List */}
          <div className="mb-4">
            <h5 className="mb-3">What you get with your subscription</h5>
            <ul className="list-unstyled">
              {features.map((feature, index) => (
                <li key={index} className="mb-3 d-flex align-items-start">
                  <Check size={20} className="text-success me-2 flex-shrink-0 mt-1" />
                  <div>
                    <strong>{feature.label}</strong>
                    {typeof feature.value !== 'boolean' && (
                      <span className="text-muted ms-2">{feature.value}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Terms */}
          <div className="mb-4 p-3 bg-light rounded">
            <p className="small text-muted mb-0">
              By tapping Pay now, you agree the{' '}
              <a href={ROUTES.Help} className="text-primary">
                Terms of Service
              </a>{' '}
              apply to your subscription. You'll be enrolled in Advanced Protection. Cancel 24 hours before your
              next payment date to avoid charges.
            </p>
          </div>

          {/* Pay Now Button */}
          {hasActiveSubscription ? (
            <div className="alert alert-warning mb-0">
              <strong>Active Subscription Exists</strong>
              <p className="mb-0 small">You already have an active subscription. Please cancel your current subscription before subscribing to a new plan.</p>
            </div>
          ) : (
          <SolidButton
            color="primary"
            className="btn-bg-primary w-100"
            onClick={handlePayNow}
          >
            Pay now
          </SolidButton>
          )}
        </ModalBody>
      </Modal>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        plan={plan}
        billingCycle={selectedBillingCycle}
        amount={getPrice()}
        onPaymentSuccess={() => {
          setIsPaymentModalOpen(false)
          onClose()
        }}
      />
    </>
  )
}

export default SubscriptionModal

