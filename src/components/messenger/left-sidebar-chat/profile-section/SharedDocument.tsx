import { useState } from 'react'
import { Badge, Collapse } from 'reactstrap'
import { useAppSelector } from '../../../../redux/hooks'

const SharedDocument = () => {
  const [isOpen, setIsOpen] = useState(true)
  const { selectedUserProfile } = useAppSelector((state) => state.chat)

  return (
    <div className="document">
      <div className="filter-block">
        <div className="collapse-block profile-collapse-block open">
          <h5 className="block-title" onClick={() => setIsOpen(!isOpen)}>
            Shared Document
            <Badge className="badge-outline-dark sm">{selectedUserProfile?.shared_documents.length}</Badge>
          </h5>
          <Collapse isOpen={isOpen} className="block-content">
            <ul className="document-list">
              {selectedUserProfile && selectedUserProfile?.shared_documents.length > 0 ? (
                selectedUserProfile?.shared_documents.map((item, index) => (
                  <li key={index}>
                    <i className={`ti-folder font-danger`} />
                    <h6>{item.name}</h6>
                  </li>
                ))
              ) : (
                <p>No Shared Documents</p>
              )}
            </ul>
          </Collapse>
        </div>
      </div>
    </div>
  )
}

export default SharedDocument
