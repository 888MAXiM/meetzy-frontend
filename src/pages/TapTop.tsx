import { useEffect, useState, useCallback, useRef } from 'react'
import { ChevronDown } from 'react-feather'

interface ScrollToBottomButtonProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  threshold?: number
  className?: string
  unreadCount?: number
}

const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
  containerRef,
  threshold = 300,
  className = '',
  unreadCount = 0,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const scrollContainerRef = useRef<HTMLElement | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const setupCompleteRef = useRef(false)

  // Find the scrollable container
  const findScrollContainer = useCallback((): HTMLElement | null => {
    const container = containerRef.current
    if (!container) return null

    // Strategy 1: Find .chatappend element (the actual scrollable ul)
    let element: HTMLElement | null = container
    let depth = 0
    while (element && element !== document.body && depth < 15) {
      if (element.classList && element.classList.contains('chatappend')) {
        return element
      }
      element = element.parentElement
      depth++
    }

    // Strategy 2: Find .messages element (main chat container)
    element = container
    depth = 0
    while (element && element !== document.body && depth < 15) {
      if (element.classList && element.classList.contains('messages')) {
        return element
      }
      element = element.parentElement
      depth++
    }

    // Strategy 3: Find any scrollable parent
    element = container.parentElement
    depth = 0
    while (element && element !== document.body && depth < 15) {
      const style = window.getComputedStyle(element)
      const overflowY = style.overflowY
      const overflow = style.overflow
      const scrollHeight = element.scrollHeight
      const clientHeight = element.clientHeight
      
      const isScrollable = 
        (overflowY === 'auto' || overflowY === 'scroll' || 
         overflow === 'auto' || overflow === 'scroll') &&
        scrollHeight > clientHeight

      if (isScrollable) {
        return element
      }
      element = element.parentElement
      depth++
    }

    return null
  }, [containerRef])

  // Check if button should be visible
  const checkVisibility = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
    }

    rafIdRef.current = requestAnimationFrame(() => {
      const scrollContainer = scrollContainerRef.current
      if (!scrollContainer) {
        setIsVisible(false)
        return
      }

      const scrollTop = scrollContainer.scrollTop
      const scrollHeight = scrollContainer.scrollHeight
      const clientHeight = scrollContainer.clientHeight

      // Calculate distance from bottom
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      const shouldShow = distanceFromBottom > threshold

      setIsVisible(shouldShow)
    })
  }, [threshold])

  // Initialize scroll container and set up listeners
  useEffect(() => {
    setupCompleteRef.current = false

    let scrollContainer: HTMLElement | null = null
    let resizeObserver: ResizeObserver | null = null
    let mutationObserver: MutationObserver | null = null
    let handleScroll: (() => void) | null = null
    let handleResize: (() => void) | null = null
    let initCheckTimeout: NodeJS.Timeout | null = null
    let retryCount = 0
    const maxRetries = 15

    const setup = () => {
      const container = containerRef.current
      if (!container) {
        if (retryCount < maxRetries) {
          retryCount++
          setTimeout(setup, 100)
        }
        return
      }

      // Find and set scroll container
      scrollContainer = findScrollContainer()
      if (!scrollContainer) {
        if (retryCount < maxRetries) {
          retryCount++
          setTimeout(setup, 100)
        }
        return
      }

      scrollContainerRef.current = scrollContainer
      setupCompleteRef.current = true

      // Initial check with multiple attempts to ensure layout is calculated
      const doCheck = () => {
        checkVisibility()
      }
      
      // Immediate check
      doCheck()
      
      // Check after short delays to catch layout changes
      setTimeout(doCheck, 50)
      setTimeout(doCheck, 150)
      setTimeout(doCheck, 300)
      initCheckTimeout = setTimeout(doCheck, 500)

      // Set up scroll listener
      handleScroll = () => {
        checkVisibility()
      }

      scrollContainer.addEventListener('scroll', handleScroll, { passive: true })

      // Set up resize observer for container changes
      resizeObserver = new ResizeObserver(() => {
        checkVisibility()
      })
      resizeObserver.observe(container)
      resizeObserver.observe(scrollContainer)

      // Set up mutation observer for DOM changes
      mutationObserver = new MutationObserver(() => {
        requestAnimationFrame(() => {
          checkVisibility()
        })
      })
      mutationObserver.observe(container, {
        childList: true,
        subtree: true,
      })

      // Also listen to window resize
      handleResize = () => {
        checkVisibility()
      }
      window.addEventListener('resize', handleResize, { passive: true })
    }

    // Start setup
    const initTimeout = setTimeout(setup, 100)

    // Cleanup function
    return () => {
      setupCompleteRef.current = false
      clearTimeout(initTimeout)
      if (initCheckTimeout) {
        clearTimeout(initCheckTimeout)
      }
      if (scrollContainer && handleScroll) {
        scrollContainer.removeEventListener('scroll', handleScroll)
      }
      if (handleResize) {
        window.removeEventListener('resize', handleResize)
      }
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      if (mutationObserver) {
        mutationObserver.disconnect()
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [containerRef, findScrollContainer, checkVisibility])

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    scrollContainer.scrollTo({
      top: scrollContainer.scrollHeight,
      behavior: 'smooth',
    })
  }, [])

  // Don't render if not visible
  if (!isVisible) {
    return null
  }

  return (
    <button
      className={`scroll-to-bottom-btn ${className}`}
      onClick={scrollToBottom}
      type="button"
      aria-label="Scroll to bottom"
    >
      <ChevronDown size={20} />
      {unreadCount > 0 && (
        <span className='unread-count'>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}

export default ScrollToBottomButton
