import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { mutations } from "../api"
import { ROUTES } from "../constants/route"
import { STORAGE_KEYS } from "../constants/storageKeys"
import { useAppDispatch } from "../redux/hooks"
import { logout as logoutAction } from "../redux/reducers/authSlice"
import { resetChatState } from "../redux/reducers/messenger/chatSlice"
import { getStorage } from "../utils"
import { toaster } from "../utils/custom-functions"

const Home = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const { useLogout } = mutations

  const { mutate: logoutMutate, isPending } = useLogout()

  const handleLogout = () => {
    logoutMutate(undefined, {
      onSuccess: () => {
        const storage = getStorage()
        storage.removeItem(STORAGE_KEYS.TOKEN)
        storage.removeItem(STORAGE_KEYS.USER)
        // Clear React Query cache
        queryClient.clear()
        // Reset chat state
        dispatch(resetChatState())
        dispatch(logoutAction())
        toaster('success','Logged out successfully!')
        navigate(ROUTES.Login, {replace: true})
      },
      onError: (error: any) => {
        toaster("error",error?.response?.data?.message || 'Logout failed')
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Home</h1>
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Logging out...' : 'Logout'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Welcome to your dashboard!</p>
        </div>
      </div>
    </div>
  )
}

export default Home
