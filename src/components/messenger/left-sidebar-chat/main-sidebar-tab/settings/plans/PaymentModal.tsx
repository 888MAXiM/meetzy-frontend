import { useState, useEffect } from 'react'
import { Modal, ModalBody, ModalHeader, Card, CardBody } from 'reactstrap'
import { CreditCard, Lock } from 'react-feather'
import { SinglePlan } from '../../../../../../types/api'
import { SolidButton } from '../../../../../../shared/button'
import { useAppSelector } from '../../../../../../redux/hooks'
import { toaster } from '../../../../../../utils/custom-functions'
import { mutations } from '../../../../../../api'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  plan: SinglePlan | null
  billingCycle: 'monthly' | 'yearly'
  amount: number
  onPaymentSuccess?: () => void
}

const PaymentModal = ({ isOpen, onClose, plan, billingCycle, amount }: PaymentModalProps) => {
  const { user } = useAppSelector((state) => state.auth)
  const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'paypal'>('stripe')
  const [isProcessing, setIsProcessing] = useState(false)

  const { mutate: initiateVerification } = mutations.useInitiateVerification()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const handlePaymentInitiation = async (gateway: 'stripe' | 'paypal') => {
    if (!plan || !user) {
      toaster('error', 'Invalid request. Please select a plan first.')
      return
    }

    setIsProcessing(true)
    try {
      initiateVerification(
        {
          full_name: user.name || '',
          category: 'individual',
          currency: 'USD',
          payment_gateway: gateway,
          plan_slug: plan.slug,
          billing_cycle: billingCycle,
        },
        {
          onSuccess: (response) => {
            const approvalUrl = response.data?.approval_url

            if (approvalUrl) {
              // Store payment info for PayPal capture after redirect
              if (gateway === 'paypal' && response.data?.payment_id && response.data?.gateway_order_id) {
                localStorage.setItem(
                  'pending_paypal_payment',
                  JSON.stringify({
                    payment_id: response.data.payment_id,
                    gateway_order_id: response.data.gateway_order_id,
                    timestamp: Date.now(),
                  }),
                )
              }
              toaster('success', `Redirecting to ${gateway === 'stripe' ? 'Stripe Checkout' : 'PayPal'}...`)
              window.location.href = approvalUrl
            } else {
              toaster('error', 'Payment initialization failed - no payment URL received')
              setIsProcessing(false)
            }
          },
          onError: (error: any) => {
            console.error('Payment error:', error)
            const errorMessage = error?.message || 'Failed to initialize payment'

            if (errorMessage.includes('already verified')) {
              toaster('warn', 'You are already verified. If you want to upgrade your plan, please contact support.')
            } else if (errorMessage.includes('404')) {
              toaster('error', 'Service unavailable. Please try again later.')
            } else {
              toaster('error', errorMessage)
            }
            setIsProcessing(false)
          },
        },
      )
    } catch (error) {
      console.error('Payment error:', error)
      toaster('error', 'Failed to process payment')
      setIsProcessing(false)
    }
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false)
    }
  }, [isOpen])

  if (!plan) {
    return null
  }

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="lg" centered>
      <ModalHeader toggle={onClose} className="d-flex align-items-center gap-2">
        <CreditCard size={20} className="me-2" />
        Complete Your Payment
      </ModalHeader>
      <ModalBody>
        {/* Plan Summary */}
        <Card className="mb-4">
          <CardBody>
            <h5 className="mb-3">Order Summary</h5>
            <div className="d-flex justify-content-between mb-2">
              <span>Plan:</span>
              <strong>{plan.name}</strong>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span>Billing Cycle:</span>
              <strong className="text-capitalize">{billingCycle}</strong>
            </div>
            <div className="d-flex justify-content-between mb-3 pt-2 border-top">
              <span className="h5 mb-0">Total:</span>
              <span className="h4 mb-0 text-primary">{formatPrice(amount)}</span>
            </div>
          </CardBody>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardBody>
            <h5 className="mb-4">Select Payment Method</h5>

            {/* Stripe Option */}
            <div
              className={`payment-method-card p-3 mb-3 border rounded cursor-pointer ${
                selectedGateway === 'stripe' ? 'border-primary bg-light' : ''
              }`}
              onClick={() => setSelectedGateway('stripe')}
            >
              <div className="payment-wrap d-flex align-items-center">
                <div className="form-check me-3">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentGateway"
                    checked={selectedGateway === 'stripe'}
                    onChange={() => setSelectedGateway('stripe')}
                  />
                </div>
                <div className="me-3" style={{ width: '24px', height: '24px' }}>
                  <svg viewBox="0 0 24 24" fill="#635BFF" width="24" height="24">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l-1.569 4.03c-1.951-.723-4.076-1.946-4.076-1.946zm-1.776 5.4c-2.134.833-4.077 1.47-5.94 2.12C4.5 17.306 3.2 17.7 2.1 18.05l1.569-4.03c.776.29 1.57.58 2.362.87 1.817.58 3.516 1.12 5.169 1.55zm-3.1-12.3c-1.1-.406-2.1-.78-2.9-1.1L3.2 1.05c1.1.35 2.4.75 3.9 1.2 1.863.65 3.806 1.29 5.94 2.12l1.569-4.03c-1.575-.773-3.863-1.631-6.09-1.631-.683 0-1.305.087-1.901.262zm10.5 4.5c-1.1-.406-2.1-.78-2.9-1.1L13.7 5.55c1.1.35 2.4.75 3.9 1.2 1.863.65 3.806 1.29 5.94 2.12l1.569-4.03c-1.575-.773-3.863-1.631-6.09-1.631-.683 0-1.305.087-1.901.262z" />
                  </svg>
                </div>
                <div className="flex-grow-1">
                  <strong>Stripe</strong>
                  <p className="text-muted small mb-0">Pay securely with Stripe Checkout</p>
                </div>
              </div>
            </div>

            {/* PayPal Option */}
            <div
              className={`payment-method-card p-3 mb-4 border rounded cursor-pointer ${
                selectedGateway === 'paypal' ? 'border-primary bg-light' : ''
              }`}
              onClick={() => setSelectedGateway('paypal')}
            >
              <div className="payment-wrap d-flex align-items-center">
                <div className="form-check me-3">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentGateway"
                    checked={selectedGateway === 'paypal'}
                    onChange={() => setSelectedGateway('paypal')}
                  />
                </div>
                <div className="me-3" style={{ width: '24px', height: '24px' }}>
                  <svg viewBox="0 0 24 24" fill="#0070ba" width="24" height="24">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.174 1.351 1.05 3.3.93 4.855v.08h.192c.577 0 1.112.285 1.435.762.312.454.395 1.04.223 1.58l-1.968 6.46c-.348 1.193-1.472 2.01-2.785 2.01H9.95a.641.641 0 0 1-.633-.74l1.533-5.03H7.076z" />
                  </svg>
                </div>
                <div className="flex-grow-1">
                  <strong>PayPal</strong>
                  <p className="text-muted small mb-0">Pay with your PayPal account</p>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="d-flex align-items-start mb-4 p-3 bg-light rounded">
              <Lock size={20} className="me-2 text-primary flex-shrink-0 mt-1" />
              <div className="small text-muted">
                Your payment information is secure and encrypted. We never store your card details.
              </div>
            </div>

            {/* Pay Button */}
            <div className="d-flex gap-2">
              <SolidButton color="light" className="btn-bg-light flex-fill" onClick={onClose} disabled={isProcessing}>
                Cancel
              </SolidButton>
              <SolidButton
                color="primary"
                className="btn-bg-primary flex-fill"
                onClick={() => handlePaymentInitiation(selectedGateway)}
                disabled={isProcessing}
              >
                {isProcessing
                  ? 'Processing...'
                  : `Pay ${formatPrice(amount)} with ${selectedGateway === 'stripe' ? 'Stripe' : 'PayPal'}`}
              </SolidButton>
            </div>
          </CardBody>
        </Card>
      </ModalBody>
    </Modal>
  )
}

export default PaymentModal
