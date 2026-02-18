import i18n from '../i18n'

export const loadTranslations = (locale: string, translations: Record<string, any>) => {
  if (!translations || typeof translations !== 'object') {
    return
  }

  i18n.addResourceBundle(locale, 'translations', translations, true, true)
  i18n.reloadResources(locale, 'translations')
}

export const loadTranslationsFromBackend = (locale: string, translationJson: Record<string, any> | null) => {
  if (!translationJson) {
    return
  }

  const translations = translationJson.translations || translationJson
  loadTranslations(locale, translations)
}

