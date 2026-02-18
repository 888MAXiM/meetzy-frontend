import { ErrorMessage, Field, Form, Formik, FormikHelpers } from 'formik'
import { useState } from 'react'
import { Button, Col, Label, Modal, ModalBody, ModalHeader } from 'reactstrap'
import * as Yup from 'yup'
import { mutations, queries } from '../../../../api'
import { useAppSelector } from '../../../../redux/hooks'
import SearchableSelect from '../../../../shared/form-fields/SearchableSelectInput'
import TextInput from '../../../../shared/form-fields/TextInput'
import { ReportFormValues, SelectOption } from '../../../../types/components/chat'
import { toaster } from '../../../../utils/custom-functions'

const ReportUserModal = ({ open, toggleModal }: { open: boolean; toggleModal: () => void }) => {
  const { selectedUser } = useAppSelector((state) => state.chat)
  const { data } = queries.useGetReportSettings()
  const { mutate, isPending } = mutations.useCreateReport()

  const [selectedType, setSelectedType] = useState<SelectOption | null>(null)

  const options: SelectOption[] =
    data?.reports?.map((item) => ({
      value: item.id,
      label: item.title,
    })) ?? []

  const validationSchema = Yup.object().shape({
    reason: Yup.object().nullable().required('Please select a reason.'),
    message:
      selectedType?.label?.toLowerCase() === 'other'
        ? Yup.string().required('Please provide details.')
        : Yup.string().optional(),
  })

  const initialValues: ReportFormValues = {
    reason: null,
    message: '',
    exitGroup: false,
  }

  const onSubmit = (values: ReportFormValues, { setSubmitting }: FormikHelpers<ReportFormValues>) => {
    const isGroup = selectedUser?.chat_type === 'group'
    const payload: any = {
      reportedUserId: !isGroup ? selectedUser?.chat_id : null,
      groupId: isGroup ? selectedUser?.chat_id : null,
      reason: values.reason?.label || '',
      description: values.message || '',
      exitGroup: values.exitGroup || false,
    }

    mutate(payload, {
      onSuccess: () => {
        toaster('success', 'Report submitted successfully')
        toggleModal()
        setSelectedType(null)
      },
      onSettled: () => setSubmitting(false),
    })
  }

  return (
    <Modal isOpen={open} toggle={toggleModal} centered>
      <ModalHeader toggle={toggleModal}>Report User</ModalHeader>
      <ModalBody>
        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {({ setFieldValue, isSubmitting }) => (
            <Form>
              <Col md="12" className="mb-3">
                <Label>Reason for reporting *</Label>

                <SearchableSelect
                  options={options}
                  value={selectedType}
                  onChange={(opt) => {
                    setSelectedType(opt)
                    setFieldValue('reason', opt)
                  }}
                  placeholder="Select a reason"
                  isClearable={false}
                />

                <ErrorMessage name="reason" render={(msg) => <div className="text-danger small mt-1">{msg}</div>} />
              </Col>

              <Col md="12" className="mb-3">
                <Label>Additional details</Label>
                <Field
                  as="textarea"
                  name="message"
                  className="form-control"
                  placeholder="Please provide more information..."
                  rows={4}
                />
                <ErrorMessage name="message" render={(msg) => <div className="text-danger small mt-1">{msg}</div>} />
              </Col>

              {(selectedUser?.isGroup || selectedUser?.chat_type == 'group') && (
                <Col md="12" className="mb-3">
                  <div className="d-flex gap-2">
                    <TextInput type="checkbox" name="exitGroup" className="form-control" />
                    <Label>Exit group</Label>
                  </div>
                  <ErrorMessage
                    name="exitGroup"
                    render={(msg) => <div className="text-danger small mt-1">{msg}</div>}
                  />
                </Col>
              )}

              <div className="alert alert-info p-2 text-center">
                Your report is anonymous. The reported user won't know who sent it.
              </div>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <Button color="secondary" onClick={toggleModal}>
                  Cancel
                </Button>

                <Button type="submit" color="primary" disabled={isPending || isSubmitting}>
                  Submit
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </ModalBody>
    </Modal>
  )
}

export default ReportUserModal
