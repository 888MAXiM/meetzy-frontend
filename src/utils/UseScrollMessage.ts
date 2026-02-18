export const scrollToMessage = (
  messageId: number | string,
  messageRefs: React.MutableRefObject<{ [key: string | number]: HTMLLIElement | null }>,
  keepHighlight: boolean = false,
) => {
  const messageElement = messageRefs.current[messageId] || messageRefs.current[Number(messageId)] || messageRefs.current[String(messageId)]

  if (!messageElement) {
    console.warn(`Message element with ID ${messageId} not found`)
    return
  }
  messageElement.scrollIntoView({
    behavior: 'smooth', 
    block: 'center',
  })
  messageElement.classList.add('message-highlighted')

  if (!keepHighlight) {
    setTimeout(() => {
      messageElement.classList.remove('message-highlighted')
    }, 2000)
  }
  return undefined
}
