import { format } from 'date-fns'
import { AlertCircle, File } from 'react-feather'
import { queries } from '../../../../../../api'
import { useAppSelector } from '../../../../../../redux/hooks'
import CommonMediaHeading from '../common/CommonMediaHeading'

const Subscriptions = () => {
  const { settingsActiveTab } = useAppSelector((state) => state.mainSidebar)
  const { data, isLoading } = queries.useGetMySubscription()

  const subscription = data?.data?.subscription || null
  const user = data?.data?.user || null

  const formatPrice = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success'
      case 'trialing':
        return 'bg-info'
      case 'past_due':
        return 'bg-warning'
      case 'canceled':
        return 'bg-secondary'
      case 'incomplete':
        return 'bg-danger'
      default:
        return 'bg-secondary'
    }
  }

  return (
    <div className="setting-block">
      <div className={`block ${settingsActiveTab === 'subscriptions' ? 'open' : ''}`}>
        <CommonMediaHeading title={'subscriptions'} />
        <div className="template-according" id="accordion">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : subscription ? (
            <div className="subscription-details">
              <div className="mb-4 p-3 border rounded">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h6 className="mb-1">Current Subscription</h6>
                    <p className="text-muted small mb-0">{subscription.plan?.name || 'N/A'}</p>
                  </div>
                  <span className={`badge ${getStatusBadgeClass(subscription.status)}`}>{subscription.status}</span>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6 mb-2">
                    <div className="subscription-detail-item">
                      <label className="text-muted small">Billing Cycle</label>
                      <div className="fw-semibold text-capitalize">{subscription.billing_cycle}</div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-2">
                    <div className="subscription-detail-item">
                      <label className="text-muted small">Amount</label>
                      <div className="fw-semibold">{formatPrice(subscription.amount, subscription.currency)}</div>
                    </div>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6 mb-2">
                    <div className="subscription-detail-item">
                      <label className="text-muted small">Current Period Start</label>
                      <div className="fw-semibold">
                        {format(new Date(subscription.current_period_start), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-2">
                    <div className="subscription-detail-item">
                      <label className="text-muted small">Current Period End</label>
                      <div className="fw-semibold">
                        {format(new Date(subscription.current_period_end), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                </div>

                {subscription.cancel_at_period_end && (
                  <div className="alert alert-warning mb-0 d-flex align-items-center">
                    <AlertCircle size={16} className="me-2" />
                    <small>This subscription will be canceled at the end of the billing period.</small>
                  </div>
                )}

                {subscription.payment_gateway && (
                  <div className="mt-3">
                    <label className="text-muted small">Payment Gateway</label>
                    <div className="fw-semibold text-capitalize">{subscription.payment_gateway}</div>
                  </div>
                )}
              </div>

              {subscription.plan && (
                <div className="mb-4 p-3 border rounded">
                  <h6 className="mb-3">Plan Details</h6>
                  <div className="row">
                    <div className="col-md-6 mb-2">
                      <div className="d-flex justify-content-between">
                        <span className="text-muted small">Max Members Per Group:</span>
                        <span className="fw-semibold">{subscription.plan.max_members_per_group ?? 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-md-6 mb-2">
                      <div className="d-flex justify-content-between">
                        <span className="text-muted small">Max Groups:</span>
                        <span className="fw-semibold">{subscription.plan.max_groups ?? 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-md-6 mb-2">
                      <div className="d-flex justify-content-between">
                        <span className="text-muted small">Max Broadcasts List:</span>
                        <span className="fw-semibold">{subscription.plan.max_broadcasts_list ?? 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-md-6 mb-2">
                      <div className="d-flex justify-content-between">
                        <span className="text-muted small">Max Members Per Broadcasts List:</span>
                        <span className="fw-semibold">{subscription.plan.max_members_per_broadcasts_list ?? 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-md-6 mb-2">
                      <div className="d-flex justify-content-between">
                        <span className="text-muted small">Max Status:</span>
                        <span className="fw-semibold">{subscription.plan.max_status ?? 'N/A'}</span>
                      </div>
                    </div>
                    <div className="col-md-6 mb-2">
                      <div className="d-flex justify-content-between">
                        <span className="text-muted small">File Sharing:</span>
                        <span className="fw-semibold">
                          {subscription.plan.allows_file_sharing !== undefined 
                            ? (subscription.plan.allows_file_sharing ? 'Enabled' : 'Disabled')
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-6 mb-2">
                      <div className="d-flex justify-content-between">
                        <span className="text-muted small">Video Calls:</span>
                        <span className="fw-semibold">
                          {subscription.plan.video_calls_enabled !== undefined 
                            ? (subscription.plan.video_calls_enabled ? 'Enabled' : 'Disabled')
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {user && (
                <div className="p-3 border rounded">
                  <h6 className="mb-3">Account Status</h6>
                  <div className="row">
                    <div className="col-md-6 mb-2">
                      <div className="d-flex justify-content-between">
                        <span className="text-muted small">Verified:</span>
                        <span className={`badge ${user.is_verified ? 'bg-success' : 'bg-secondary'}`}>
                          {user.is_verified ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    {user.verified_at && (
                      <div className="col-md-6 mb-2">
                        <div className="d-flex justify-content-between">
                          <span className="text-muted small">Verified At:</span>
                          <span className="fw-semibold">{format(new Date(user.verified_at), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <File size={48} className="mb-3 text-muted" />
              <p className="text-muted">No active subscription found</p>
              <p className="text-muted small">Subscribe to a plan to unlock premium features</p>
            </div>
          )}
        </div>
      </div>
      <CommonMediaHeading title={'subscriptions'} text={'manage_your_subscription'} type="subscriptions" />
    </div>
  )
}

export default Subscriptions
