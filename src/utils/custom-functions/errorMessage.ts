import { AxiosError } from 'axios'

export const errorMessage = (error: any, fallback = 'Something went wrong'): string => {
  if (!error) return fallback

  if ((error as AxiosError).isAxiosError) {
    const axiosError = error as AxiosError<any>
    return axiosError.response?.data?.message || axiosError.response?.data?.error || axiosError.message || fallback
  }

  if (error instanceof Error) {
    return error.message || fallback
  }

  return fallback
}
