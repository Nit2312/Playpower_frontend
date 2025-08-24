// Encryption service for password-protected notes
// Simple encryption using Web Crypto API

export class EncryptionService {
  private encoder = new TextEncoder()
  private decoder = new TextDecoder()

  // Base64 helpers (browser-safe, handle large arrays and padding)
  private toBase64(bytes: Uint8Array): string {
    let binary = ""
    const chunkSize = 0x8000 // 32KB chunks to avoid call stack limits
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize)
      binary += String.fromCharCode.apply(null, Array.from(chunk) as unknown as number[])
    }
    return btoa(binary)
  }

  private fromBase64(b64: string): Uint8Array {
    // Normalize potential base64url input and fix padding
    let normalized = b64.replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "")
    const pad = normalized.length % 4
    if (pad) {
      normalized += "=".repeat(4 - pad)
    }
    const binary = atob(normalized)
    const len = binary.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }

  // Generate a key from password using PBKDF2
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey("raw", this.encoder.encode(password), "PBKDF2", false, [
      "deriveKey",
    ])

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    )
  }

  // Encrypt content with password
  async encrypt(content: string, password: string): Promise<string> {
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const key = await this.deriveKey(password, salt)

      const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, this.encoder.encode(content))

      // Combine salt, iv, and encrypted data
      const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
      combined.set(salt, 0)
      combined.set(iv, salt.length)
      combined.set(new Uint8Array(encrypted), salt.length + iv.length)

      // Convert to base64 for storage
      return this.toBase64(combined)
    } catch (error) {
      console.error("Encryption failed:", error)
      throw new Error("Failed to encrypt content")
    }
  }

  // Decrypt content with password
  async decrypt(encryptedContent: string, password: string): Promise<string> {
    try {
      // Convert from base64
      const combined = this.fromBase64(encryptedContent)

      // Extract salt, iv, and encrypted data
      const salt = combined.slice(0, 16)
      const iv = combined.slice(16, 28)
      const encrypted = combined.slice(28)

      const key = await this.deriveKey(password, salt)

      const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, encrypted)

      return this.decoder.decode(decrypted)
    } catch (error) {
      console.error("Decryption failed:", error)
      throw new Error("Invalid password or corrupted data")
    }
  }

  // Simple hash function for password verification (not for encryption)
  async hashPassword(password: string): Promise<string> {
    const data = this.encoder.encode(password)
    const hash = await crypto.subtle.digest("SHA-256", data)
    return this.toBase64(new Uint8Array(hash))
  }
}

export const encryptionService = new EncryptionService()
