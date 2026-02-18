import { FC, useEffect, useRef, useState } from 'react'
import DynamicPopover from '../../../../../shared/popover'
import { useAppSelector } from '../../../../../redux/hooks'
import type { EmojiMartPicker, EmojiWrapperProps } from '../../../../../types/components/chat'
import 'emoji-mart'

const EmojiWrapper: FC<EmojiWrapperProps> = ({
  children,
  onEmojiSelect,
  id,
  onPickerStateChange,
  onParentHoverChange,
  position = 'top',
  disabled = false,
  className,
  theme,
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [pickerReady, setPickerReady] = useState(false)
  const pickerContainerRef = useRef<HTMLDivElement>(null)
  const pickerInstanceRef = useRef<EmojiMartPicker | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const { templateLayout } = useAppSelector((store) => store.templateCustomizer)

  const togglePopover = (newState?: boolean) => {
    if (disabled) return
    const nextState = newState !== undefined ? newState : !popoverOpen
    setPopoverOpen(nextState)

    if (onPickerStateChange) {
      onPickerStateChange(nextState)
    }

    if (!isLoaded && nextState) {
      setIsLoaded(true)
    }
  }

  const handleEmojiSelect = (emoji: any) => {
    const emojiData = {
      emoji: emoji.native,
      unified: emoji.unified,
      names: emoji.names || [emoji.name],
      originalUnified: emoji.unified,
      ...emoji,
    }

    onEmojiSelect(emojiData)
  }

  useEffect(() => {
    const initializePicker = async () => {
      if (popoverOpen && pickerContainerRef.current && !pickerInstanceRef.current) {
        try {
          const { Picker } = await import('emoji-mart')
          const wrapperDiv = document.createElement('div')

          const activeLayout = templateLayout.find((item) => item.active)
          const layoutValue = theme || activeLayout?.layoutValue || 'light'

          const pickerTheme =
            layoutValue === 'light' || layoutValue === '' || layoutValue === 'colorfull' ? 'light' : 'dark'

          const picker = new Picker({
            data: async () => {
              const response = await fetch('https://cdn.jsdelivr.net/npm/@emoji-mart/data')
              return response.json()
            },
            onEmojiSelect: handleEmojiSelect,
            theme: pickerTheme,
            previewPosition: 'none',
            searchPosition: 'sticky',
            navPosition: 'bottom',
            perLine: 9,
            maxFrequentRows: 2,
            set: 'native',
          }) as unknown as EmojiMartPicker

          if ((picker as EmojiMartPicker).el) {
            wrapperDiv.appendChild((picker as EmojiMartPicker).el)
          } else {
            wrapperDiv.appendChild(picker as unknown as Node)
          }

          if (pickerContainerRef.current) {
            pickerContainerRef.current.appendChild(wrapperDiv)
            pickerInstanceRef.current = picker as unknown as EmojiMartPicker

            cleanupRef.current = () => {
              try {
                if (pickerContainerRef.current && wrapperDiv.parentNode === pickerContainerRef.current) {
                  pickerContainerRef.current.removeChild(wrapperDiv)
                }
              } catch (error) {
                console.warn('Cleanup warning:', error)
              }
            }

            setPickerReady(true)
          }
        } catch (error) {
          console.error('Failed to load emoji picker:', error)
          setPickerReady(true)
        }
      }
    }

    if (popoverOpen && !pickerReady) {
      void initializePicker()
    }
  }, [popoverOpen, pickerReady, templateLayout])

  useEffect(() => {
    if (!popoverOpen && pickerInstanceRef.current) {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }

      pickerInstanceRef.current = null
      setPickerReady(false)
    }
  }, [popoverOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!popoverOpen || !event.target) return

      const target = event.target as Node
      const path = event.composedPath()
      if (!document.body.contains(target)) {
        return
      }

      const buttonElement = document.getElementById(id)
      
      if (buttonElement && (buttonElement === target || buttonElement.contains(target) || path.includes(buttonElement))) {
        return
      }

      if (pickerContainerRef.current && (pickerContainerRef.current === target || pickerContainerRef.current.contains(target) || path.includes(pickerContainerRef.current))) {
        return
      }

      const popoverElement =
        document.querySelector(`[aria-describedby*="${id}"]`) ||
        document.querySelector(`[id*="popover-${id}"]`) ||
        document.querySelector('.popover')
      
      if (popoverElement && (popoverElement === target || popoverElement.contains(target) || path.includes(popoverElement))) {
        return
      }

      setPopoverOpen(false)

      if (onPickerStateChange) {
        onPickerStateChange(false)
      }
    }

    if (popoverOpen) {
      document.addEventListener('mousedown', handleClickOutside, true)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true)
    }
  }, [popoverOpen, id, onPickerStateChange])

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (onParentHoverChange) {
      if (!popoverOpen) return
      onParentHoverChange((isHovered: boolean) => {
        if (!isHovered) {
          setPopoverOpen(false)
          if (onPickerStateChange) {
            onPickerStateChange(false)
          }
        }
      })
    }
  }, [popoverOpen, onParentHoverChange, onPickerStateChange])

  return (
    <DynamicPopover
      placement={position}
      trigger={<div>{children}</div>}
      className={className}
      isOpen={popoverOpen}
      toggle={togglePopover}
      closeOnScroll={false}
    >
      <div ref={pickerContainerRef}>{popoverOpen && !pickerReady && <div>Loading emojis...</div>}</div>
    </DynamicPopover>
  )
}

export default EmojiWrapper
