import { useMemo } from 'react'
import { useAppSelector } from '../redux/hooks'
import { queries } from '../api'

/**
 * Hook to get user features based on subscription plan and settings
 * Subscription plan features override global settings
 */
export const useUserFeatures = () => {
  const { allow_media_send: settingsAllowMediaSend, video_calls_enabled: allowVideoCalls } = useAppSelector((state) => state.settings)
  const { data: limitsData } = queries.useGetUserLimits()

  const limits = limitsData?.data

  return useMemo(() => {
    const allow_media_send = limits?.allow_media_send ?? settingsAllowMediaSend ?? false
    const max_status = limits?.status_limit_per_day ?? 10 // Default is from settings
    const max_groups_per_user = limits?.max_groups_per_user ?? 50 // Default from settings
    const max_group_members = limits?.max_group_members ?? 10 // Default from settings
    const max_broadcasts_list = limits?.max_broadcasts_list ?? 10 // Default from settings
    const max_members_per_broadcasts_list = limits?.max_members_per_broadcasts_list ?? 10 // Default from settings
    const video_calls_enabled = limits?.video_calls_enabled ?? allowVideoCalls ?? false

    return {
      allow_media_send,
      max_status,
      max_groups_per_user,
      max_group_members,
      max_broadcasts_list,
      max_members_per_broadcasts_list,
      max_storage_per_user_mb: limits?.max_storage_per_user_mb ?? 5000,
      video_calls_enabled
    }
  }, [limits, settingsAllowMediaSend])
}

