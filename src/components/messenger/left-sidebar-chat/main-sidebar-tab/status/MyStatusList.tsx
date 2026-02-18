import { useState } from 'react'
import { Eye, Trash2 } from 'react-feather'
import { Button } from 'reactstrap'
import { ImageBaseUrl } from '../../../../../constants'
import { useAppSelector } from '../../../../../redux/hooks'
import type { MyStatusListProps, StatusView } from '../../../../../types/components/chat'
import ViewersModal from './ViewersModal'

const MyStatusList: React.FC<MyStatusListProps> = ({
  onDelete,
  isDeleting,
  formatTimeAgo,
  onStatusClick,
}) => {
  const [showViewersModal, setShowViewersModal] = useState(false)
  const [selectedStatusViewers, setSelectedStatusViewers] = useState<StatusView[]>([]) 
  const { myStatuses } = useAppSelector((store) => store.status)

  if (!myStatuses?.statuses || myStatuses?.statuses.length === 0) return null

  const handleViewersClick = (e: React.MouseEvent, views: StatusView[]) => {
    e.stopPropagation()
    setSelectedStatusViewers(views)
    setShowViewersModal(true)
  }

  return (
    <>
      <div className="my-status-list">
        {myStatuses?.statuses?.map((status: any) => {
          return (
            <div key={status.id} className="status-item cursor-pointer" onClick={() => onStatusClick(status)}>
              <div className="status-content">
                {status.type === 'image' && status.file_url && (
                  <img src={ImageBaseUrl + status.file_url} alt="status" />
                )}
                {status.type === 'video' && status.file_url && <video src={ImageBaseUrl + status.file_url} />}
                {status.type === 'text' && (
                  <div className="profile-text">{status.caption?.charAt(0).toUpperCase() || 'T'}</div>
                )}
                <div>
                  <h6>{formatTimeAgo(status.created_at)}</h6>
                  {status.caption && <p className="mb-0 cursor-pointer">{status.caption}</p>}
                  {status.view_count > 0 && (
                    <span onClick={(e) => handleViewersClick(e, status.views)}>
                      <Eye size={14} /> {status.view_count} view{status.view_count !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(status.id)
                }}
                disabled={isDeleting}
                title="Delete status"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          )
        })}
      </div>
      <ViewersModal
        isOpen={showViewersModal}
        onClose={() => setShowViewersModal(false)}
        viewers={selectedStatusViewers}
      />
    </>
  )
}

export default MyStatusList
