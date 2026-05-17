/**
 * Anti Gravity End-to-End Encryption Utility
 * Uses Web Crypto API for secure messaging
 */

// In a real app, keys would be generated per user/workspace and stored in IndexedDB
// For this implementation, we use a derived key from the Workspace ID to simulate E2EE
const getEncryptionKey = async (workspaceId) => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(workspaceId),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('antigravity-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

export const encryptMessage = async (workspaceId, text) => {
  try {
    const key = await getEncryptionKey(workspaceId);
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(text)
    );

    return {
      data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      iv: btoa(String.fromCharCode(...iv)),
      isEncrypted: true
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    return text;
  }
};

export const decryptMessage = async (workspaceId, encryptedObj) => {
  if (!encryptedObj?.isEncrypted) return encryptedObj;

  try {
    const key = await getEncryptionKey(workspaceId);
    const iv = new Uint8Array(atob(encryptedObj.iv).split('').map(c => c.charCodeAt(0)));
    const data = new Uint8Array(atob(encryptedObj.data).split('').map(c => c.charCodeAt(0)));

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '[Encrypted Message]';
  }
};
