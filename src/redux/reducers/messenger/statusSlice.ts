import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  AddStatusPayload,
  AddViewPayload,
  MyStatusesGroup,
  StatusItem,
  StatusSliceState,
  UserStatusGroup,
} from '../../../types/store'

const initialState: StatusSliceState = {
  statuses: [],
  myStatuses: { statuses: [] },
}

const statusSlice = createSlice({
  name: 'status',
  initialState,
  reducers: {
    setStatuses: (state, action: PayloadAction<UserStatusGroup[]>) => {
      state.statuses = action.payload
    },

    setMyStatuses: (state, action: PayloadAction<MyStatusesGroup | undefined>) => {
      state.myStatuses = action.payload
    },

    addStatusToFeed: (state, action: PayloadAction<AddStatusPayload>) => {
      const { status, user } = action.payload

      const formattedStatus: StatusItem = {
        ...status,
        views: status.views || [],
        view_count: status.view_count || 0,
        caption: status.caption || null,
      }

      const existingGroup = state.statuses.find((item: any) => item.user.id == user.id)

      if (existingGroup) {
        if (!existingGroup.statuses.some((s: any) => s.id == formattedStatus.id)) {
          existingGroup.statuses.push(formattedStatus)
        }
      } else {
        status.is_sponsored
          ? state.statuses.unshift({
              user,
              statuses: [formattedStatus],
            })
          : state.statuses.push({
              user,
              statuses: [formattedStatus],
            })
      }
    },

    addMyStatus: (state, action: PayloadAction<AddStatusPayload>) => {
      const { status } = action.payload

      if (!state.myStatuses) {
        state.myStatuses = { statuses: [] }
      }

      if (!state.myStatuses.statuses) {
        state.myStatuses.statuses = []
      }

      if (!state.myStatuses.statuses.some((s: any) => s.id === status.id)) {
        state.myStatuses.statuses.push(status)
      }
    },

    addViewToStatus: (state, action: PayloadAction<AddViewPayload>) => {
      const { status_id, viewer_id, viewer_name, viewed_at, view_count, current_user_id } = action.payload

      const newView = {
        id: viewer_id,
        name: viewer_name || 'Unknown User',
        avatar: null,
        viewed_at: viewed_at,
        viewed_ago: 'now',
        viewer_id: viewer_id,
        viewer_name: viewer_name,
      }

      const myStatus = state.myStatuses?.statuses?.find((s: StatusItem) => s.id == status_id)
      if (myStatus) {
        if (!myStatus.views) myStatus.views = []
        if (!myStatus.views.find((v: any) => v.viewer_id == viewer_id)) {
          myStatus.views.push(newView)
        }
        if (view_count !== undefined) {
          myStatus.view_count = view_count
        }
      }

      state.statuses.forEach((userGroup: UserStatusGroup) => {
        const feedStatus = userGroup.statuses.find((s: StatusItem) => s.id == status_id)
        if (feedStatus) {
          if (!feedStatus.views) feedStatus.views = []
          if (!feedStatus.views.find((v) => v.viewer_id === viewer_id)) {
            feedStatus.views.push(newView)
          }
          if (view_count !== undefined) {
            feedStatus.view_count = view_count
          }

          if (viewer_id === current_user_id) {
            userGroup.is_viewed = true
          }
        }
      })
    },

    deleteStatusFromFeed: (state, action: PayloadAction<{ status_id: string | number; user_id: string | number }>) => {
      const { status_id, user_id } = action.payload

      const groupIndex = state.statuses.findIndex((item: UserStatusGroup) => item.user.id === user_id)

      if (groupIndex !== -1) {
        state.statuses[groupIndex].statuses = state.statuses[groupIndex].statuses.filter(
          (s: StatusItem) => s.id !== status_id,
        )

        if (state.statuses[groupIndex].statuses.length === 0) {
          state.statuses.splice(groupIndex, 1)
        }
      }

      if (state.myStatuses?.statuses) {
        state.myStatuses.statuses = state.myStatuses.statuses.filter((s: StatusItem) => s.id !== status_id)
      }
    },
  },
})

export const { setStatuses, setMyStatuses, addViewToStatus, addStatusToFeed, addMyStatus, deleteStatusFromFeed } =
  statusSlice.actions

export default statusSlice.reducer
