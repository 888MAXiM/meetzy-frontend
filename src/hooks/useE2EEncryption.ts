import { useEffect, useState, useRef } from 'react'
import { useAppSelector } from '../redux/hooks'
import { mutations, queries } from '../api'
import { e2eEncryptionService } from '../services/e2e-encryption-service'

export const useE2EEncryption = () => {
  const { user } = useAppSelector((state) => state.auth)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isE2EEnabled, setIsE2EEnabled] = useState(false)
  const savePublicKeyMutation = mutations.useSavePublicKey()
  const { data: publicSettings } = queries.useGetPublicSettings()
  const { data: userKeysData, isLoading: isLoadingKeys } = queries.useGetPublicKey(user?.id)

  const isProcessingRef = useRef(false)
  const hasAttemptedSaveRef = useRef(false)
  const lastSavedPublicKeyRef = useRef<string | null>(null)

  useEffect(() => {
    const checkE2EEnabled = async () => {
      if (isProcessingRef.current) {
        return
      }

      if (!user?.id) {
        e2eEncryptionService.clearCachedKeys()
        setIsInitialized(true)
        isProcessingRef.current = false
        hasAttemptedSaveRef.current = false
        lastSavedPublicKeyRef.current = null
        return
      }

      isProcessingRef.current = true

      const e2eSetting = publicSettings?.settings?.e2e_encryption_enabled
      const e2eEnabled = e2eSetting === true || e2eSetting === 1 || e2eSetting === '1' || e2eSetting === 'true'
      setIsE2EEnabled(e2eEnabled)

      if (e2eEnabled && isInitialized && !e2eEncryptionService.hasKeys() && !userKeysData?.public_key) {
        setIsInitialized(false)
        hasAttemptedSaveRef.current = false
        lastSavedPublicKeyRef.current = null
      }

      if (isLoadingKeys) {
        isProcessingRef.current = false
        return
      }

      if (userKeysData?.public_key && userKeysData?.private_key) {
        const keysValid = await e2eEncryptionService.setKeysFromDatabase(
          userKeysData.public_key,
          userKeysData.private_key,
          user.id,
        )

        if (!keysValid) {
          console.error('❌ Keys in database are not a valid pair. This may indicate keys were regenerated.')
          console.error('Old messages encrypted with previous keys cannot be decrypted.')
          setIsInitialized(true)
          isProcessingRef.current = false
          hasAttemptedSaveRef.current = false
          return
        }

        setIsInitialized(true)
        isProcessingRef.current = false
        hasAttemptedSaveRef.current = false
        return
      }
      const localPublicKey = e2eEncryptionService.getPublicKey()
      const localPrivateKey = e2eEncryptionService.getPrivateKey()

      if (localPublicKey && localPrivateKey) {
        if (e2eEnabled) {
          try {
            await savePublicKeyMutation.mutateAsync({
              public_key: localPublicKey,
              private_key: localPrivateKey,
            })
            const keysValid = await e2eEncryptionService.setKeysFromDatabase(localPublicKey, localPrivateKey, user.id)
            if (!keysValid) {
              console.error('❌ Migrated keys are not a valid pair. Regenerating...')
              e2eEncryptionService.clearKeys()
            } else {
              setIsInitialized(true)
              isProcessingRef.current = false
              hasAttemptedSaveRef.current = false
              return
            }
          } catch (migrationError) {
            console.error('❌ Failed to migrate keys to database:', migrationError)
            const keysValid = await e2eEncryptionService.setKeysFromDatabase(localPublicKey, localPrivateKey, user.id)
            if (keysValid) {
              setIsInitialized(true)
              isProcessingRef.current = false
              hasAttemptedSaveRef.current = false
              return
            }
            setIsInitialized(true)
            isProcessingRef.current = false
            hasAttemptedSaveRef.current = false
            return
          }
        } else {
          try {
            const keysValid = await e2eEncryptionService.setKeysFromDatabase(localPublicKey, localPrivateKey, user.id)
            if (keysValid) {
              setIsInitialized(true)
              isProcessingRef.current = false
              hasAttemptedSaveRef.current = false
              return
            } else {
              console.warn('Keys in localStorage are not valid, but E2E is disabled so we cannot regenerate')
              setIsInitialized(true)
              isProcessingRef.current = false
              hasAttemptedSaveRef.current = false
              return
            }
          } catch (error) {
            console.error('Failed to load keys from localStorage:', error)
            setIsInitialized(true)
            isProcessingRef.current = false
            hasAttemptedSaveRef.current = false
            return
          }
        }
      }

      if (userKeysData?.public_key || userKeysData?.private_key) {
        if (userKeysData.public_key && !userKeysData.private_key) {
          console.error('Public key exists in database but private key is missing!')
          console.error('Cannot decrypt messages. Old messages may be lost.')
          console.error('Generating new key pair will make old messages undecryptable.')
          setIsInitialized(true)
          isProcessingRef.current = false
          hasAttemptedSaveRef.current = false
          return
        } else if (!userKeysData.public_key && userKeysData.private_key) {
          console.error('Private key exists in database but public key is missing!')
          console.error('Cannot encrypt messages for others.')
          setIsInitialized(true)
          isProcessingRef.current = false
          hasAttemptedSaveRef.current = false
          return
        }
      }

      if (!e2eEnabled) {
        setIsInitialized(true)
        isProcessingRef.current = false
        hasAttemptedSaveRef.current = false
        return
      }

      if (e2eEncryptionService.hasKeys()) {
        setIsInitialized(true)
        isProcessingRef.current = false
        hasAttemptedSaveRef.current = false
        return
      }

      if (hasAttemptedSaveRef.current && lastSavedPublicKeyRef.current) {
        if (userKeysData?.public_key === lastSavedPublicKeyRef.current) {
          setIsInitialized(true)
          isProcessingRef.current = false
          hasAttemptedSaveRef.current = false
          lastSavedPublicKeyRef.current = null
          return
        }
        isProcessingRef.current = false
        return
      }

      try {
        const keyPair = await e2eEncryptionService.generateKeyPair()
        hasAttemptedSaveRef.current = true
        lastSavedPublicKeyRef.current = keyPair.publicKey

        try {
          await savePublicKeyMutation.mutateAsync({
            public_key: keyPair.publicKey,
            private_key: keyPair.privateKey,
          })

          const keysValid = await e2eEncryptionService.setKeysFromDatabase(
            keyPair.publicKey,
            keyPair.privateKey,
            user.id,
          )
          if (!keysValid) {
            console.error('❌ CRITICAL: Newly generated keys failed validation! This should never happen.')
          }

          setIsInitialized(true)
        } catch (error) {
          console.error('❌ Failed to save keys to database:', error)
          e2eEncryptionService.storePrivateKey(keyPair.privateKey)
          e2eEncryptionService.storePublicKey(keyPair.publicKey)
          console.warn('Keys stored in localStorage as fallback')
          setIsInitialized(true)
          isProcessingRef.current = false
          hasAttemptedSaveRef.current = false
          lastSavedPublicKeyRef.current = null
        }
      } catch (error) {
        console.error('❌ Failed to initialize E2E encryption:', error)
        setIsInitialized(true)
        isProcessingRef.current = false
        hasAttemptedSaveRef.current = false
        lastSavedPublicKeyRef.current = null
      }
    }

    checkE2EEnabled()
  }, [user?.id, publicSettings?.settings?.e2e_encryption_enabled, userKeysData, isLoadingKeys])

  return {
    isInitialized,
    isE2EEnabled: isE2EEnabled && isInitialized,
    hasKeys: e2eEncryptionService.hasKeys(),
  }
}
