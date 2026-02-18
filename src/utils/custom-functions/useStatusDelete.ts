import { toast } from 'react-toastify'
import { useQueryClient } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { mutations } from '../../api'
import { KEYS } from '../../constants/keys'
import { deleteStatusFromFeed } from '../../redux/reducers/messenger/statusSlice'

export const useStatusDelete = () => {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const currentUser = useAppSelector((store) => store.auth.user)
  const deleteStatusMutation = mutations.useDeleteStatus()

  const handleDeleteStatus = async (statusId: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this status?')

    if (!confirmed) return

    if (!currentUser?.id) {
      toast.error('User not found')
      return
    }

    try {
      await deleteStatusMutation.mutateAsync({ status_ids: [statusId] })

      dispatch(
        deleteStatusFromFeed({
          status_id: statusId,
          user_id: currentUser.id,
        }),
      )

      queryClient.invalidateQueries({ queryKey: [KEYS.STATUS_FEED] })
      queryClient.invalidateQueries({ queryKey: [KEYS.MUTED_STATUSES] })
      toast.success('Status deleted successfully!')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete status')
    }
  }

  return {
    handleDeleteStatus,
    isDeleting: deleteStatusMutation.isPending,
  }
}
