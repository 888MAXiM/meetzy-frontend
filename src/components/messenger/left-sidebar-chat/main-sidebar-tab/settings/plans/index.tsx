import { useState } from 'react'
import { useAppSelector } from '../../../../../../redux/hooks'
import { SinglePlan } from '../../../../../../types/api'
import CommonMediaHeading from '../common/CommonMediaHeading'
import PlansModal from './PlansModal'
import SubscriptionModal from './SubscriptionModal'

const Plans = () => {
  const { app_name } = useAppSelector((state) => state.settings)
  const [selectedPlanForSubscription, setSelectedPlanForSubscription] = useState<SinglePlan | null>(null)
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false)
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false)

  const handlePlanClick = (plan: SinglePlan) => {
    setIsSubscriptionModalOpen(true)
    setSelectedPlanForSubscription(plan)
  }

  const handleCloseSubscriptionModal = () => {
    setIsSubscriptionModalOpen(false)
    setSelectedPlanForSubscription(null)
  }

  const handleMeetzyVerifiedClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsPlansModalOpen(true)
  }

  return (
    <>
      <div className="setting-block">
        <CommonMediaHeading
          title={`${app_name} verified`}
          text={'view_and_manage_subscription'}
          type="plans"
          onClick={handleMeetzyVerifiedClick}
        />
      </div>
      <PlansModal isOpen={isPlansModalOpen} onClose={() => setIsPlansModalOpen(false)} onPlanClick={handlePlanClick} />
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={handleCloseSubscriptionModal}
        plan={selectedPlanForSubscription}
      />
    </>
  )
}

export default Plans
