import React from 'react'
import { Form, FormGroup, Input } from 'reactstrap'

interface ProfileEditFormProps {
  profile: {
    username: string
    bio: string
    phone: string
    country: string
    country_code: string
    email: string
  }
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ profile, onChange }) => {
  return (
    <div className="details edit flex-grow-1">
      <Form className="form-radius form-sm">
        <FormGroup className="m-0 mb-2">
          <Input
            id="username"
            type="text"
            name="username"
            value={profile.username ?? ''}
            onChange={onChange}
            placeholder="Enter name"
            className="userinput"
          />
        </FormGroup>

        <FormGroup className="m-0 mb-2">
          <Input
            id="bio"
            type="textarea"
            name="bio"
            value={profile.bio ?? ''}
            onChange={onChange}
            placeholder="Enter bio"
            rows={1}
            className="hide-scrollbar"
          />
        </FormGroup>

        <FormGroup className="m-0 mb-2">
          <Input
            id="email"
            type="email"
            name="email"
            value={profile.email ?? ''}
            onChange={onChange}
            disabled
            placeholder="Enter email"
            className="hide-scrollbar"
          />
        </FormGroup>
      </Form>
    </div>
  )
}
