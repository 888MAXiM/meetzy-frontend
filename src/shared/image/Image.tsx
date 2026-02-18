import { useEffect, useState, useMemo, type FC } from 'react'
import { ImageBaseUrl, ImagePath } from '../../constants'
import type { ImageProps } from '../../types/shared'

const Image: FC<ImageProps> = ({ src, fallbackSrc, alt, className = '', ...rest }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [hasError, setHasError] = useState<boolean>(false)

  const defaultPlaceholder = `${ImagePath}/contact/default.png`

  const isAbsoluteUrl = (url: string): boolean => {
    return /^(https?:|data:|\/\/|blob:)/i.test(url)
  }

  const resolveImageSource = useMemo(() => {
    if (!src) {
      return fallbackSrc || defaultPlaceholder
    }

    try {
      let sourceString: string

      if (typeof src === 'string') {
        sourceString = src.trim()
        if (sourceString === '') {
          return fallbackSrc || defaultPlaceholder
        }
      } else if (typeof src === 'object' && src !== null) {
        if (src?.url && typeof src.url === 'string' && src.url.trim() !== '') {
          sourceString = src?.url.trim()
        } else {
          return fallbackSrc || defaultPlaceholder
        }
      } else {
        sourceString = String(src)
        if (sourceString === '') {
          return fallbackSrc || defaultPlaceholder
        }
      }

      if (isAbsoluteUrl(sourceString)) {
        return sourceString
      }

      if (sourceString.startsWith('/assets/')) {
        return sourceString
      }

      if (sourceString.startsWith(ImagePath)) {
        return sourceString
      }

      if (sourceString.startsWith('/uploads/')) {
        return `${ImageBaseUrl}${sourceString}`
      }

      if (sourceString.startsWith('./')) {
        return `${ImageBaseUrl}${sourceString.replace('./', '')}`
      }

      if (sourceString.startsWith('/')) {
        return `${ImagePath}${sourceString}`
      }

      if (!sourceString.includes('/') && sourceString.includes('.')) {
        return `${ImageBaseUrl}${sourceString}`
      }

      return `${ImageBaseUrl}${sourceString.replace(/^\//, '')}`
    } catch (error) {
      console.error('Error resolving image source:', error)
      return fallbackSrc || defaultPlaceholder
    }
  }, [src, fallbackSrc])

  useEffect(() => {
    if (resolveImageSource) {
      setHasError(false)
      setImgSrc(resolveImageSource)
    } else {
      setImgSrc(fallbackSrc || defaultPlaceholder)
    }
  }, [resolveImageSource, fallbackSrc])

  const handleError = () => {
    if (fallbackSrc && !hasError) {
      setHasError(true)
      setImgSrc(fallbackSrc)
    } else if (!hasError) {
      setHasError(true)
      setImgSrc(defaultPlaceholder)
    }
  }

  if (imgSrc === null) {
    return <img src={defaultPlaceholder} alt={alt || 'placeholder'} className={className} {...rest} />
  }

  return <img src={imgSrc} alt={alt} onError={handleError} className={className} {...rest} />
}

export default Image
