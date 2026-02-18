import { Form, FormGroup, Input, Label } from 'reactstrap'

interface PrivacyOptionsProps {
  privacyOption: string
  onPrivacyChange: (option: 'my_contacts' | 'only_share_with') => void
  onToggleContactList: () => void
  displayCount: number
}

const PrivacyOptions = ({ privacyOption, onPrivacyChange, onToggleContactList, displayCount }: PrivacyOptionsProps) => {
  return (
    <Form>
      <FormGroup check className="mb-2">
        <Input
          type="checkbox"
          name="statusPrivacy"
          id="allContacts"
          checked={privacyOption === 'my_contacts'}
          onChange={() => onPrivacyChange('my_contacts')}
        />
        <Label check for="allContacts" className="form-check-label ms-1">
          My contacts
        </Label>
      </FormGroup>

      <FormGroup check className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <Input
            type="checkbox"
            name="statusPrivacy"
            id="onlyShareWith"
            checked={privacyOption === 'only_share_with'}
            onChange={() => onPrivacyChange('only_share_with')}
          />
          <Label check for="onlyShareWith" className="form-check-label ms-2">
            Only share with...
          </Label>
        </div>

        {privacyOption === 'only_share_with' && <span onClick={onToggleContactList}>{displayCount} included</span>}
      </FormGroup>
    </Form>
  )
} 

export default PrivacyOptions
