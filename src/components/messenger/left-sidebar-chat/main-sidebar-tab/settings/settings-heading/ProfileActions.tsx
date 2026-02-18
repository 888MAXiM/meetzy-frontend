import React from 'react'
import { Edit } from 'react-feather'
import { Button } from 'reactstrap'
import { SvgIcon } from '../../../../../../shared/icons'

interface ProfileActionsProps {
  isEditing: boolean
  isSaving: boolean
  isSaveDisabled: boolean
  onEdit: (e: React.MouseEvent<HTMLAnchorElement>) => void
  onSave: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export const ProfileActions: React.FC<ProfileActionsProps> = ({
  isEditing,
  isSaving,
  isSaveDisabled,
  onEdit,
  onSave,
}) => {
  return (
    <div className="save-btn">
      {isEditing ? (
        <Button
          color="primary"
          className="icon-btn btn-outline-light btn-sm pull-right edit-btn"
          onClick={onSave}
          disabled={isSaveDisabled}
        >
          {!isSaving && <SvgIcon iconId="save" />}
        </Button>
      ) : (
        <a className="icon-btn btn-outline-light btn-sm pull-right edit-btn" onClick={onEdit}>
          <Edit />
        </a>
      )}
    </div>
  )
}
