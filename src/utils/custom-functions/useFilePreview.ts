import { ImageBaseUrl } from '../../constants'

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export const getFileIconId = (file: File) => {
  const type = file.type
  if (type.startsWith('image/')) return 'file-image'
  if (type.startsWith('video/')) return 'file-video'
  if (type.startsWith('audio/') || type === 'application/pdf') return 'file-document'
  return 'file-generic'
}

export const getDocumentIconId = (fileType?: string, messageType?: string): string => {
  const type = fileType?.toLowerCase() || messageType?.toLowerCase() || ''

  if (type.includes('pdf')) return 'file-pdf'
  if (type.includes('doc') || type.includes('word')) return 'file-word'
  if (type.includes('xls') || type.includes('excel') || type.includes('sheet')) return 'file-excel'
  if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg'))
    return 'file-image'
  if (type.includes('video') || type.includes('mp4')) return 'file-video'
  if (type.includes('audio') || type.includes('mp3')) return 'file-audio'
  if (type.includes('zip') || type.includes('rar')) return 'file-archive'
  if (type.includes('text') || type.includes('txt')) return 'file-text'

  return 'file-generic'
}

export const getDocumentColorClass = (fileType?: string, messageType?: string): string => {
  const type = fileType?.toLowerCase() || messageType?.toLowerCase() || ''

  if (type.includes('pdf')) return 'bg-light-danger'
  if (type.includes('doc') || type.includes('word')) return 'bg-light-primary'
  if (type.includes('xls') || type.includes('excel') || type.includes('sheet')) return 'bg-light-success'
  if (type.includes('image')) return 'bg-light-warning'
  if (type.includes('video')) return 'bg-light-info'
  if (type.includes('audio')) return 'bg-light-primary'

  return 'bg-light'
}

//file download
export const downloadFile = async (fileUrl: string, fileName?: string): Promise<void> => {
  if (!fileUrl) {
    console.warn('File URL not available')
    return
  }
  const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${ImageBaseUrl}${fileUrl}`
  try {
    const response = await fetch(fullUrl, {
      mode: 'cors',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = fileName || 'download'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    URL.revokeObjectURL(url)
    console.log(URL.revokeObjectURL(url))
  } catch (error) {
    console.error('Error downloading file:', error)

    window.open(fullUrl, '_blank')
  }
}

//file sharing
export const shareFile = async (fileUrl: string, fileName: string): Promise<boolean> => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: fileName,
        url: fileUrl,
      })
      return true
    } catch (err) {
      return false
    }
  } else {
    try {
      await navigator.clipboard.writeText(fileUrl)
      alert('Link copied to clipboard!')
      return true
    } catch (err) {
      console.error('Error copying to clipboard:', err)
      return false
    }
  }
}
