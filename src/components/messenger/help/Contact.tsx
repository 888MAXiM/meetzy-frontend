import { Form, Formik, FormikHelpers } from 'formik'
import { Button } from 'reactstrap'
import * as Yup from 'yup'
import { mutations } from '../../../api'
import TextInput from '../../../shared/form-fields/TextInput'
import { toaster } from '../../../utils/custom-functions'

interface ContactFormValues {
  name: string
  email: string
  subject: string
  message: string
}

const ContactSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  subject: Yup.string().required('Subject is required'),
  message: Yup.string().required('Message is required'),
})

const Contact = () => {
  const { mutate } = mutations.useCreateInquiry()

  const initialValues: ContactFormValues = {
    name: '',
    email: '',
    subject: '',
    message: '',
  }

  const handleSubmit = (values: ContactFormValues, { resetForm }: FormikHelpers<ContactFormValues>) => {
    const payload = { ...values }

    mutate(payload, {
      onSuccess: () => {
        toaster('success', 'Successful submit.')
        resetForm()
      },
    })
  }

  return (
    <Formik<ContactFormValues> initialValues={initialValues} validationSchema={ContactSchema} onSubmit={handleSubmit}>
      {() => (
        <Form className="contact-form">
          <TextInput label="Name" name="name" placeholder="Enter Name" formGroupClass="mb-3" autoComplete="off" />

          <TextInput
            label="Email"
            name="email"
            type="email"
            placeholder="john@example.com"
            formGroupClass="mb-3"
            autoComplete="off"
          />

          <TextInput
            label="Subject"
            name="subject"
            placeholder="Enter Subject"
            formGroupClass="mb-3"
            autoComplete="off"
          />

          <TextInput
            tag="textarea"
            name="message"
            rows={5}
            placeholder="Enter Your Message Here.."
            className="form-control"
          />

          <Button type="submit" color="primary" className="mt-3">
            Send Message
          </Button>
        </Form>
      )}
    </Formik>
  )
}

export default Contact
