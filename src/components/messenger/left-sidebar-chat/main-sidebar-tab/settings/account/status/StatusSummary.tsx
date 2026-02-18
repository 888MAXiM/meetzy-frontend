import { Alert } from 'reactstrap'

interface StatusSummaryProps {
  privacyOption: string
  allMembers: any[]
  selectedUsers: string[]
}

const StatusSummary = ({ privacyOption, allMembers, selectedUsers }: StatusSummaryProps) => {
  return (
    <>
      <Alert color="info" className="mt-2 py-2">
        <small>
          <i className="fa fa-info-circle me-1" />
          {privacyOption === 'my_contacts'
            ? `Status visible to all ${allMembers.length} contacts`
            : `Status shared with ${selectedUsers.length} contact${selectedUsers.length !== 1 ? 's' : ''}`}
        </small>
      </Alert>

      {privacyOption === 'only_share_with' && selectedUsers.length === 0 && (
        <Alert color="warning" className="mt-2 py-2">
          <small>
            <i className="fa fa-exclamation-triangle me-1" />
            No contacts selected. Your status won't be visible to anyone.
          </small>
        </Alert>
      )}
    </>
  )
}

export default StatusSummary
