import { Input, InputGroup, InputGroupText } from 'reactstrap'
import AllCall from '../call/AllCalls'
import { useAppDispatch, useAppSelector } from '../../../../../redux/hooks'
import { setNewModal } from '../../../../../redux/reducers/messenger/messengerSlice'
import SimpleModal from '../../../../../shared/modal/SimpleModal'
import { CallFilter } from '../../../../../constants'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useDebounce } from '../../../../../utils/useDebounce'

const Calls = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { newModal } = useAppSelector((state) => state.messenger)

  const [localSearchTerm, setLocalSearchTerm] = useState('')
  const debouncedLocalSearch = useDebounce(localSearchTerm, 500)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value)
  }

  const closeModal = () => {
    dispatch(setNewModal(1))
    setLocalSearchTerm('')
  }

  return (
    <SimpleModal
      isOpen={newModal[1]}
      onClose={closeModal}
      title={t('start_new_call')}
      className="fade show add-popup msg-chat-modal"
      centered
    >
      <div className="chat-msg-search">
        <InputGroup>
          <Input type="text" placeholder="Search" value={localSearchTerm} onChange={handleSearchChange} />
          <div className="input-group-append">
            <InputGroupText>@</InputGroupText>
          </div>
        </InputGroup>
      </div>
      <AllCall filter={CallFilter.All} searchTerm={debouncedLocalSearch} />
    </SimpleModal>
  )
}

export default Calls