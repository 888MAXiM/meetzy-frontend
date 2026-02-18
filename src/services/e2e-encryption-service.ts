import { PRIVATE_KEY_STORAGE_KEY, PUBLIC_KEY_STORAGE_KEY } from "../constants"

export interface KeyPair {
  publicKey: string
  privateKey: string
}

class E2EEncryptionService {
  private cachedPrivateKey: string | null = null
  private cachedPublicKey: string | null = null
  private cachedUserId: number | string | null = null
  async generateKeyPair(): Promise<KeyPair> {
    console.log("cachedUserId:", this.cachedUserId)
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
      )

      const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey)
      const publicKeyBase64 = this.arrayBufferToBase64(publicKeyBuffer)
      const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
      const privateKeyBase64 = this.arrayBufferToBase64(privateKeyBuffer)

      return {
        publicKey: publicKeyBase64,
        privateKey: privateKeyBase64,
      }
    } catch (error) {
      console.error('Error generating key pair:', error)
      throw new Error('Failed to generate encryption keys')
    }
  }

  async importPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
    try {
      const publicKeyBuffer = this.base64ToArrayBuffer(publicKeyBase64)
      return await crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['encrypt']
      )
    } catch (error) {
      console.error('Error importing public key:', error)
      throw new Error('Failed to import public key')
    }
  }

  async importPrivateKey(privateKeyBase64: string): Promise<CryptoKey> {
    try {
      const privateKeyBuffer = this.base64ToArrayBuffer(privateKeyBase64)
      return await crypto.subtle.importKey(
        'pkcs8',
        privateKeyBuffer,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['decrypt']
      )
    } catch (error) {
      console.error('Error importing private key:', error)
      throw new Error('Failed to import private key')
    }
  }

  async encryptMessage(message: string, recipientPublicKeyBase64: string): Promise<string> {
    try {
      const publicKey = await this.importPublicKey(recipientPublicKeyBase64)
      const messageBuffer = new TextEncoder().encode(message)
      const aesKey = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      )

      const iv = crypto.getRandomValues(new Uint8Array(12))
      const encryptedMessage = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        aesKey,
        messageBuffer
      )

      const exportedAesKey = await crypto.subtle.exportKey('raw', aesKey)
      const encryptedAesKey = await crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP',
        },
        publicKey,
        exportedAesKey
      )

      const combined = {
        encryptedKey: this.arrayBufferToBase64(encryptedAesKey),
        iv: this.arrayBufferToBase64(iv),
        encryptedData: this.arrayBufferToBase64(encryptedMessage),
      }

      return JSON.stringify(combined)
    } catch (error) {
      console.error('Error encrypting message:', error)
      throw new Error('Failed to encrypt message')
    }
  }

  async decryptMessage(encryptedMessage: string, privateKeyBase64: string): Promise<string> {
    try {   
      const privateKey = await this.importPrivateKey(privateKeyBase64)
      const combined = JSON.parse(encryptedMessage)

      const encryptedAesKeyBuffer = this.base64ToArrayBuffer(combined.encryptedKey)
      
      let aesKeyBuffer: ArrayBuffer
      try {
        aesKeyBuffer = await crypto.subtle.decrypt(
          {
            name: 'RSA-OAEP',
          },
          privateKey,
          encryptedAesKeyBuffer
        )
      } catch (rsaError) {
        throw new Error(`RSA decryption failed: ${rsaError instanceof Error ? rsaError.message : 'Unknown error'}. The private key may not match the public key used for encryption.`)
      }

      const aesKey = await crypto.subtle.importKey(
        'raw',
        aesKeyBuffer,
        {
          name: 'AES-GCM',
          length: 256,
        },
        false,
        ['decrypt']
      )

      const iv = this.base64ToArrayBuffer(combined.iv)
      const encryptedData = this.base64ToArrayBuffer(combined.encryptedData)
      
      let decryptedBuffer: ArrayBuffer
      try {
        decryptedBuffer = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: iv,
          },
          aesKey,
          encryptedData
        )
      } catch (aesError) {
        throw new Error(`AES decryption failed: ${aesError instanceof Error ? aesError.message : 'Unknown error'}`)
      }

      const decryptedText = new TextDecoder().decode(decryptedBuffer)

      if (decryptedText.includes('"encryptedKey"') || decryptedText.includes('"encryptedData"') || 
          (decryptedText.includes('"sender"') && decryptedText.includes('"members"'))) {
        throw new Error('Decryption returned invalid content - appears to contain encrypted structure')
      }

      return decryptedText
    } catch (error) {
      throw new Error(`Failed to decrypt message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async validateKeyPair(publicKeyBase64: string, privateKeyBase64: string): Promise<boolean> {
    try {
      const publicKey = await this.importPublicKey(publicKeyBase64)
      const privateKey = await this.importPrivateKey(privateKeyBase64)
      const aesKey = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      )
      
      const exportedAesKey = await crypto.subtle.exportKey('raw', aesKey)
      const encryptedAesKey = await crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP',
        },
        publicKey,
        exportedAesKey
      )
      
      try {
        await crypto.subtle.decrypt(
          {
            name: 'RSA-OAEP',
          },
          privateKey,
          encryptedAesKey
        )
        return true
      } catch {
        return false
      }
    } catch (error) {
      console.error('Error validating key pair:', error)
      return false
    }
  }

  async setKeysFromDatabase(publicKey: string, privateKey: string, userId: string | number): Promise<boolean> {
    try {
      const isValid = await this.validateKeyPair(publicKey, privateKey)
      
      if (!isValid) {
        console.error('KEY PAIR VALIDATION FAILED: Public and private keys do not match!', {
          userId,
          publicKeyLength: publicKey.length,
          privateKeyLength: privateKey.length
        })
        console.error('These keys cannot be used together. Old messages encrypted with these keys may not be decryptable.')
        return false
      }
      
      this.cachedPublicKey = publicKey
      this.cachedPrivateKey = privateKey
      this.cachedUserId = userId
      return true
    } catch (error) {
      console.error('Error setting keys from database:', error)
      return false
    }
  }

  clearCachedKeys(): void {
    this.cachedPublicKey = null
    this.cachedPrivateKey = null
    this.cachedUserId = null
  }

  storePrivateKey(privateKey: string): void {
    try {
      const encrypted = btoa(privateKey)
      localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, encrypted)
    } catch (error) {
      console.error('Error storing private key:', error)
    }
  }

  getPrivateKey(): string | null {
    if (this.cachedPrivateKey) {
      return this.cachedPrivateKey
    }
    
    try {
      const encrypted = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY)
      if (!encrypted) return null
      return atob(encrypted)
    } catch (error) {
      console.error('Error retrieving private key:', error)
      return null
    }
  }

  storePublicKey(publicKey: string): void {
    try {
      localStorage.setItem(PUBLIC_KEY_STORAGE_KEY, publicKey)
    } catch (error) {
      console.error('Error storing public key:', error)
    }
  }

  getPublicKey(): string | null {
    if (this.cachedPublicKey) {
      return this.cachedPublicKey
    }
    try {
      return localStorage.getItem(PUBLIC_KEY_STORAGE_KEY)
    } catch (error) {
      console.error('Error retrieving public key:', error)
      return null
    }
  }

  clearKeys(): void {
    localStorage.removeItem(PRIVATE_KEY_STORAGE_KEY)
    localStorage.removeItem(PUBLIC_KEY_STORAGE_KEY)
  }

  hasKeys(): boolean {
    return !!this.getPrivateKey() && !!this.getPublicKey()
  }

  hasCachedKeys(): boolean {
    return !!this.cachedPrivateKey && !!this.cachedPublicKey
  }

  // Helper methods
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }
}

export const e2eEncryptionService = new E2EEncryptionService()
