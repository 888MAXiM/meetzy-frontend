import { useEffect, useRef, useState } from 'react'

const HtmlRenderer = ({ content, className = '' }: { content: string; className?: string }) => {
  const containerRef = useRef(null)
  const [processedHtml, setProcessedHtml] = useState('')

  useEffect(() => {
    if (!content) {
      setProcessedHtml('')
      return
    }

    let html = content.trim()

    html = makeUrlsClickable(html)

    setProcessedHtml(html)
  }, [content])

  if (!processedHtml) return null

  return (
    <div
      ref={containerRef}
      className={`html-content ${className}`}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  )
}

const makeUrlsClickable = (html: string) => {
  const urlRegex = /(https?:\/\/[^\s<>"]+)/gi

  return html.replace(urlRegex, (url) => {
    if (html.includes(`href="${url}"`)) {
      return url
    }
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #0066cc; text-decoration: underline;">${url}</a>`
  })
}

export default HtmlRenderer
