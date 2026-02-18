import { Card, CardBody, CardHeader, Collapse } from 'reactstrap'
import { useQueryClient } from '@tanstack/react-query'
import { mutations } from '../../../../../../api'
import { useAppDispatch, useAppSelector } from '../../../../../../redux/hooks'
import { logout } from '../../../../../../redux/reducers/authSlice'
import { resetChatState } from '../../../../../../redux/reducers/messenger/chatSlice'
import { setAccount } from '../../../../../../redux/reducers/messenger/mainSidebarSlice'
import { ChevronDown, ChevronUp } from 'react-feather'
import ConfirmModal from '../../../../../../shared/modal/ConfirmationModal'
import { useState } from 'react'

const DeleteAccount = () => {
  const { account } = useAppSelector((state) => state.mainSidebar)
  const { user } = useAppSelector((state) => state.auth)
  const { mutate } = mutations.useDeleteAccount()
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleDelete = () => {
    setShowConfirmation(true)
  }

  const handleCancel = () => {
    setShowConfirmation(false)
  }

  const deleteAccount = () => {
    mutate(
      { userId: user?.id },
      {
        onSuccess: () => {
          setShowConfirmation(false)
          queryClient.clear()
          dispatch(resetChatState())
          dispatch(logout())
        },
      },
    )
  }

  return (
    <>
      <Card>
        <CardHeader onClick={() => dispatch(setAccount(account !== '6' ? '6' : ''))}>
          <a className="account-setting">
            {account === '6' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            Delete My account
          </a>
        </CardHeader>
        <Collapse className={`${account === '6' ? 'show' : ''}`}>
          <CardBody className="delete-account-body">
            <a className="p-0 req-info font-danger" onClick={handleDelete}>
              Delete Account
            </a>
            <p>
              <b>Note :</b>Deleting your account will delete your account info, profile photo, all groups & chat
              history.
            </p>
          </CardBody>
        </Collapse>
      </Card>
      <ConfirmModal
        subtitle={`Are you sure you want to delete this account?`}
        title="Delete Account"
        variant="danger"
        isOpen={showConfirmation}
        onClose={handleCancel}
        onConfirm={deleteAccount}
      />
    </>
  )
}

export default DeleteAccount
