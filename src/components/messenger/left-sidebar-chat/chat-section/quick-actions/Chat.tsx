import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input, InputGroup, InputGroupText } from 'reactstrap'
import { useAppDispatch, useAppSelector } from '../../../../../redux/hooks'
import { setNewModal } from '../../../../../redux/reducers/messenger/messengerSlice'
import SimpleModal from '../../../../../shared/modal/SimpleModal'
import { useDebounce } from '../../../../../utils/useDebounce'
import Contacts from '../chat/Contacts'

const Chats = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { newModal } = useAppSelector((state) => state.messenger)
  const closeModal = () => dispatch(setNewModal(0))

  const [localSearchTerm, setLocalSearchTerm] = useState('')
  const debouncedLocalSearch = useDebounce(localSearchTerm, 500)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value)
  }

  return (
    <SimpleModal
      isOpen={newModal[0]}
      onClose={closeModal}
      title={t('start_new_chat')}
      className="fade show add-popup msg-chat-modal"
      centered
    >
      <div className="chat-msg-search">
        <InputGroup>
          <Input type="text" placeholder={t('search')} value={localSearchTerm} onChange={handleSearchChange} />
          <div className="input-group-append">
            <InputGroupText>@</InputGroupText>
          </div>
        </InputGroup>
      </div>
      <Contacts onChatSelect={closeModal} localSearch={debouncedLocalSearch} />
    </SimpleModal>
  )
}

export default Chats
