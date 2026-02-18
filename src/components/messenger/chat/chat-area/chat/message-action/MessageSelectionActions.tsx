import React, { useCallback } from 'react'
import { X } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { SvgIcon } from '../../../../../../shared/icons'
import { Message } from '../../../../../../types/api'
import { useMessageSelection } from './useMessageSelection'
import { downloadFile } from '../../../../../../utils/custom-functions/useFilePreview'
import { MessageSelectionActionsProps } from '../../../../../../types/components/chat'

const MessageSelectionActions: React.FC<MessageSelectionActionsProps> = ({
  selectedCount,
  onDelete,
  onForward,
  onStar,
  selectedMessages,
  allMessages = [],
}) => {
  const { t } = useTranslation()
  const { clearSelection, selectAllMessages, selectedMessages: selectedMessagesSet } = useMessageSelection()

  const isDownloadableMessage = (msg: Message) => {
    const downloadableTypes = ['image', 'video', 'document', 'file', 'audio']
    return downloadableTypes.includes(msg.message_type) && !!msg.file_url
  }

  const isTextMessage = (msg: Message) => {
    return msg.message_type === 'text' || msg.message_type === 'sticker' || msg.message_type === 'call'
  }

  const downloadableMessages = selectedMessages.filter(isDownloadableMessage)
  const textMessages = selectedMessages.filter(isTextMessage)
  const hasOnlyDownloadableContent = downloadableMessages.length > 0 && textMessages.length === 0

  const handleClear = () => {
    if ((window as any).__longPressTimeout) {
      clearTimeout((window as any).__longPressTimeout)
      ;(window as any).__longPressTimeout = null
    }
    ;(window as any).__longPressStarted = false
    ;(window as any).__longPressTriggered = false

    clearSelection()
  }

  const handleDownloadAll = useCallback(async () => {
    if (!hasOnlyDownloadableContent) return

    for (const msg of downloadableMessages) {
      if (!msg.file_url) continue

      const fileName =
        msg.metadata?.original_filename || `download-${msg.id}.${msg.metadata?.mime_type?.split('/')[1] || 'file'}`

      await downloadFile(msg.file_url, fileName)
    }
  }, [downloadableMessages, hasOnlyDownloadableContent])

  const allMessagesAreStarred = selectedMessages.every((msg) => msg.isStarred)
  const someMessagesAreStarred = selectedMessages.some((msg) => msg.isStarred)

  const handleAction = (action: () => void) => {
    action()
  }

  const isAllSelected = allMessages.length > 0 && allMessages.every((msg) => selectedMessagesSet.has(String(msg.id)))

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      clearSelection()
    } else {
      const allMessageIds = allMessages.map((msg) => msg.id)
      selectAllMessages(allMessageIds)
    }
  }, [isAllSelected, allMessages, clearSelection, selectAllMessages])

  return (
    <div className="message-selection-header" data-selection-related="true">
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3 flex-1">
          <X size={24} onClick={handleClear} />
          <span className="fw-semibold with-label-count">
            {selectedCount > 1
              ? t('messages_selected', { count: selectedCount })
              : t('message_selected', { count: selectedCount })}
          </span>
          <span className="without-label-count">{selectedCount}</span>
          {allMessages.length > 0 && (
            <div className="d-flex align-items-center gap-2">
              <input
                type="checkbox"
                className="form-check-input mt-0"
                checked={isAllSelected}
                onChange={handleSelectAll}
                id="select-all-messages"
              />
              <label
                className="form-check-label fw-semibold mb-0"
                htmlFor="select-all-messages"
                style={{ cursor: 'pointer' }}
              >
                {t('select_all')}
              </label>
            </div>
          )}
        </div>

        <div className="d-flex gap-3">
          <SvgIcon
            className={`${selectedCount > 0 ? '' : 'disabled'}`}
            iconId="trash"
            onClick={() => selectedCount > 0 && handleAction(onDelete)}
          />

          <SvgIcon
            className={`${selectedCount > 0 ? '' : 'disabled'}`}
            iconId="forward"
            onClick={() => selectedCount > 0 && handleAction(onForward)}
          />

          <SvgIcon
            className={`${selectedCount > 0 ? '' : 'disabled'} favorite`}
            iconId="dropdown-star"
            onClick={() => selectedCount > 0 && handleAction(onStar)}
            title={allMessagesAreStarred ? t('unstar_all') : someMessagesAreStarred ? t('toggle_star') : t('star_all')}
          />

          {hasOnlyDownloadableContent && (
            <SvgIcon
              iconId="download"
              onClick={handleDownloadAll}
              title={
                downloadableMessages.length > 1
                  ? t('download_files', { count: downloadableMessages.length })
                  : t('download_file')
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageSelectionActions
