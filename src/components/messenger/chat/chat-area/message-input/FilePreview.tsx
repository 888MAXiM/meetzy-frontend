import { useEffect, useState } from 'react'
import { X } from 'react-feather'
import { SvgIcon } from '../../../../../shared/icons'
import { FilePreviewProps } from '../../../../../types/components/chat'
import { formatFileSize, getFileIconId } from '../../../../../utils/custom-functions/useFilePreview'

const FilePreview = ({ file, onRemove }: FilePreviewProps) => {
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }

    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [file])

  return (
    <div className="file-preview-item d-flex align-items-center gap-2 p-2 border rounded bg-light position-relative">
      {preview ? (
        <img src={preview} alt={file.name} className="rounded" />
      ) : (
        <div
          className="file-preview-item-content d-flex align-items-center justify-content-center bg-secondary rounded"
        >
          <SvgIcon iconId={getFileIconId(file)} />
        </div>
      )}

      <div className="flex-grow-1 text-truncate">
        <div className="text-truncate small fw-medium" title={file.name}>
          {file.name}
        </div>
        <div className="text-muted" >
          {formatFileSize(file.size)}
        </div>
      </div>

      <button onClick={onRemove} className="btn btn-sm btn-link text-danger p-0 border-0 bg-transparent" type="button">
        <X size={18} />
      </button>
    </div>
  )
}

export default FilePreview
