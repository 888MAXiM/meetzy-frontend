import { Fragment, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import queries from '../../api/queries'
import mutations from '../../api/mutations'
import { KEYS } from '../../constants/keys'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { setAllMembers, setCurrentUser, setSelectedUser } from '../../redux/reducers/messenger/chatSlice'
import { openCloseSidebar, setMobileMenu, setProfileToggle } from '../../redux/reducers/messenger/messengerSlice'
import { setMainSidebarActiveTab, setSettingsActiveTab } from '../../redux/reducers/messenger/mainSidebarSlice'
import MainSidebar from './MainSidebar'
import CallManager from './call'
import ChatBoard from './chat'
import LeftSidebarChat from './left-sidebar-chat'
import ProfileSection from './left-sidebar-chat/profile-section'
import { useMessageSelection } from './chat/chat-area/chat/message-action/useMessageSelection'
import { useE2EEncryption } from '../../hooks/useE2EEncryption'
import { toaster } from '../../utils/custom-functions'
import DocumentUploadModal from './left-sidebar-chat/main-sidebar-tab/settings/plans/DocumentUploadModal'
import '../customizer/ApplySavedChatWallpaper'
import '../customizer/initWallpaper'

const MessengerContainer = () => {
  const dispatch = useAppDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: contactsResponse, isLoading, isError } = queries.useGetContactList(1, 20)
  const { data: currentUserData } = queries.useGetUserDetails()
  const { selectedUser } = useAppSelector((state) => state.chat)
  const { clearSelection } = useMessageSelection()
  const paymentProcessedRef = useRef(false)
  const queryClient = useQueryClient()
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)
  const [verificationRequestId, setVerificationRequestId] = useState<string | null>(null)
  
  const { mutate: confirmPayment } = mutations.useConfirmPayment()
  const { mutate: syncStripeSubscription } = mutations.useSyncStripeSubscription()
  const { refetch: refetchVerificationStatus } = queries.useGetMyVerificationStatus()
  
  // Initialize E2E encryption
  useE2EEncryption()

  // Handle payment success redirect
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const token = searchParams.get('token') // PayPal order ID
    const PayerID = searchParams.get('PayerID') // PayPal payer ID
    const sessionId = searchParams.get('session_id') // Stripe checkout session ID
    
    if (paymentStatus === 'success' && !paymentProcessedRef.current) {
      paymentProcessedRef.current = true
      
      // Check if this is a Stripe return (has session_id parameter)
      if (sessionId) {
        syncStripeSubscription(
          { session_id: sessionId },
          {
            onSuccess: async () => {
              queryClient.invalidateQueries({ queryKey: [KEYS.MY_SUBSCRIPTION] })
              // Open settings section
              dispatch(setMainSidebarActiveTab('settings'))
              dispatch(setSettingsActiveTab('subscriptions'))
              // Show success message
              toaster('success', 'Payment successful! Your subscription is now active.')
              // Clean up URL
              setSearchParams({}, { replace: true })
              
              // Check verification status and open document upload modal if needed
              setTimeout(async () => {
                try {
                  const statusData = await refetchVerificationStatus()
                  const currentRequest = statusData?.data?.data?.current_request
                  if (currentRequest?.request_id && currentRequest.payment?.status === 'completed' && !currentRequest.document_front) {
                    setVerificationRequestId(currentRequest.request_id)
                    setShowDocumentUpload(true)
                  }
                } catch (error) {
                  console.error('Error checking verification status:', error)
                }
              }, 1500)
            },
            onError: (error: any) => {
              console.error('Stripe subscription sync error:', error)
              const errorMessage = error?.response?.data?.message || error?.message || 'Failed to sync subscription'
              toaster('warn', errorMessage)
              // Still open settings and clean URL
              dispatch(setMainSidebarActiveTab('settings'))
              dispatch(setSettingsActiveTab('subscriptions'))
              setSearchParams({}, { replace: true })
            },
          }
        )
        return
      }
      
      // Check if this is a PayPal return (has token parameter or payment=success)
      if (token || (paymentStatus === 'success' && !sessionId)) {
        // Get stored payment info
        const storedPayment = localStorage.getItem('pending_paypal_payment')
        if (storedPayment) {
          try {
            const paymentData = JSON.parse(storedPayment)
            const { payment_id, gateway_order_id, timestamp } = paymentData
            
            // Check if payment info is not too old (24 hours)
            if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
              // Use token from URL if available, otherwise use stored gateway_order_id
              const orderID = token || gateway_order_id
              
              if (!orderID) {
                console.error('No PayPal order ID available')
                toaster('error', 'Payment confirmation failed: Missing order ID')
                localStorage.removeItem('pending_paypal_payment')
                setSearchParams({}, { replace: true })
                return
              }
              
              confirmPayment(
                {
                  payment_id,
                  gateway_response: {
                    orderID: orderID,
                    payerID: PayerID,
                  },
                },
                {
                  onSuccess: async () => {
                    // Remove stored payment info
                    localStorage.removeItem('pending_paypal_payment')
                    queryClient.invalidateQueries({ queryKey: [KEYS.MY_SUBSCRIPTION] })
                    // Open settings section
                    dispatch(setMainSidebarActiveTab('settings'))
                    dispatch(setSettingsActiveTab('subscriptions'))
                    // Show success message
                    toaster('success', 'Payment successful! Your subscription is now active.')
                    // Clean up URL
                    setSearchParams({}, { replace: true })
                    
                    // Check verification status and open document upload modal if needed
                    setTimeout(async () => {
                      try {
                        const statusData = await refetchVerificationStatus()
                        const currentRequest = statusData?.data?.data?.current_request
                        if (currentRequest?.request_id && currentRequest.payment?.status === 'completed' && !currentRequest.document_front) {
                          setVerificationRequestId(currentRequest.request_id)
                          setShowDocumentUpload(true)
                        }
                      } catch (error) {
                        console.error('Error checking verification status:', error)
                      }
                    }, 1500)
                  },
                  onError: (error: any) => {
                    console.error('PayPal payment confirmation error:', error)
                    const errorMessage = error?.response?.data?.message || error?.message || 'Failed to confirm payment'
                    toaster('error', errorMessage)
                    // Still open settings and clean URL
                    dispatch(setMainSidebarActiveTab('settings'))
                    dispatch(setSettingsActiveTab('subscriptions'))
                    setSearchParams({}, { replace: true })
                  },
                }
              )
              return
            } else {
              // Payment info expired, remove it
              localStorage.removeItem('pending_paypal_payment')
            }
          } catch (error) {
            console.error('Error parsing stored payment data:', error)
            localStorage.removeItem('pending_paypal_payment')
          }
        }
      }
      
      // For Stripe or if PayPal capture failed, just show success
      // Open settings section
      dispatch(setMainSidebarActiveTab('settings'))
      dispatch(setSettingsActiveTab('subscriptions'))
      // Show success message
      toaster('success', 'Payment successful! Your subscription is now active.')
      // Clean up URL
      setSearchParams({}, { replace: true })
    } else if (paymentStatus === 'cancel') {
      // Remove stored payment info on cancel
      localStorage.removeItem('pending_paypal_payment')
      // Show cancel message
      toaster('warn', 'Payment was cancelled.')
      // Clean up URL
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, dispatch, setSearchParams, confirmPayment, syncStripeSubscription, queryClient, refetchVerificationStatus])

  useEffect(() => {
    document.body.classList.add('main-page')
    return () => {
      document.body.classList.remove('main-page')
    }
  }, [])

  useEffect(() => {
    if (currentUserData?.user) {
      dispatch(setCurrentUser(currentUserData?.user))
    }
  }, [currentUserData, dispatch])

  useEffect(() => {
    const contacts = contactsResponse?.contacts
    dispatch(setAllMembers(contacts || []))
  }, [contactsResponse, dispatch])

  useEffect(() => {
    const handleResize = () => {
      const isNowMobile = window.innerWidth <= 800
      const sidebarToggle = document.querySelector('.sidebar-toggle')

      if (isNowMobile) {
        dispatch(openCloseSidebar(false))
        dispatch(setMobileMenu(true))
        sidebarToggle?.classList.add('mobile-menu')
      } else {
        dispatch(openCloseSidebar(true))
        dispatch(setMobileMenu(false))
        sidebarToggle?.classList.remove('mobile-menu')
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    dispatch(setProfileToggle(false))
  }, [selectedUser])

  useEffect(() => {
    clearSelection()
  }, [selectedUser?.chat_id, clearSelection])

  useEffect(() => {
    return () => {
      clearSelection()
    }
  }, [clearSelection])

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      if (selectedUser) {
        dispatch(setSelectedUser(null))
        window.history.pushState(null, '', window.location.pathname)
      }
    }

    // Push initial state to track navigation
    window.history.pushState(null, '', window.location.pathname)

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [selectedUser, dispatch])

  if (isLoading) {
    return (
      <div className="loader-wrapper">
        <div className="loader-box">
          <div className="loader-3"></div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="error-wrapper">
        <div className="alert alert-danger">Failed to load contacts</div>
      </div>
    )
  }

  return (
    <Fragment>
      <div className="meetzy-container sidebar-toggle">
        <MainSidebar />
        <LeftSidebarChat />
        <ChatBoard />
        <ProfileSection />
        <CallManager />
      </div>
      <DocumentUploadModal
        isOpen={showDocumentUpload}
        onClose={() => {
          setShowDocumentUpload(false)
          setVerificationRequestId(null)
          refetchVerificationStatus()
        }}
        requestId={verificationRequestId}
        onUploadSuccess={() => {
          refetchVerificationStatus()
          toaster('success', 'Documents submitted successfully! Your verification is now under review.')
        }}
      />
    </Fragment>
  )
}

export default MessengerContainer
