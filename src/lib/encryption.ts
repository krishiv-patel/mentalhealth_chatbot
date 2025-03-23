import * as nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';

// Generate a new key pair for the user
export const generateKeyPair = () => {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: naclUtil.encodeBase64(keyPair.publicKey),
    privateKey: naclUtil.encodeBase64(keyPair.secretKey)
  };
};

// Store keys in localStorage
export const storeKeys = (publicKey: string, privateKey: string) => {
  localStorage.setItem('chatEncryptionPublicKey', publicKey);
  localStorage.setItem('chatEncryptionPrivateKey', privateKey);
};

// Retrieve keys from localStorage
export const getKeys = () => {
  const publicKey = localStorage.getItem('chatEncryptionPublicKey');
  const privateKey = localStorage.getItem('chatEncryptionPrivateKey');
  return { publicKey, privateKey };
};

// Check if the user already has encryption keys
export const hasEncryptionKeys = () => {
  const { publicKey, privateKey } = getKeys();
  return !!(publicKey && privateKey);
};

// Initialize encryption for a new user
export const initializeEncryption = () => {
  if (!hasEncryptionKeys()) {
    const { publicKey, privateKey } = generateKeyPair();
    storeKeys(publicKey, privateKey);
    return { publicKey, privateKey };
  }
  return getKeys();
};

// Generate a random nonce
export const generateNonce = () => {
  return naclUtil.encodeBase64(nacl.randomBytes(24));
};

// Encrypt a message
export const encryptMessage = (message: string, receiverPublicKey: string) => {
  const { privateKey } = getKeys();
  
  if (!privateKey) {
    throw new Error('No private key found. Please initialize encryption first.');
  }
  
  const decodedPrivateKey = naclUtil.decodeBase64(privateKey);
  const decodedPublicKey = naclUtil.decodeBase64(receiverPublicKey);
  const messageUint8 = naclUtil.decodeUTF8(message);
  const nonce = nacl.randomBytes(24);
  
  const encryptedMessage = nacl.box(
    messageUint8,
    nonce,
    decodedPublicKey,
    decodedPrivateKey
  );
  
  return {
    encryptedMessage: naclUtil.encodeBase64(encryptedMessage),
    nonce: naclUtil.encodeBase64(nonce)
  };
};

// Decrypt a message
export const decryptMessage = (
  encryptedMessage: string,
  nonce: string,
  senderPublicKey: string
) => {
  const { privateKey } = getKeys();
  
  if (!privateKey) {
    throw new Error('No private key found. Please initialize encryption first.');
  }
  
  const decodedPrivateKey = naclUtil.decodeBase64(privateKey);
  const decodedPublicKey = naclUtil.decodeBase64(senderPublicKey);
  const decodedMessage = naclUtil.decodeBase64(encryptedMessage);
  const decodedNonce = naclUtil.decodeBase64(nonce);
  
  const decryptedMessage = nacl.box.open(
    decodedMessage,
    decodedNonce,
    decodedPublicKey,
    decodedPrivateKey
  );
  
  if (!decryptedMessage) {
    throw new Error('Failed to decrypt message');
  }
  
  return naclUtil.encodeUTF8(decryptedMessage);
};

// Encrypt message for storing in the database
export const encryptForStorage = (message: string) => {
  // For messages stored in the database, we encrypt with a symmetric key
  // derived from the user's private key
  const { privateKey } = getKeys();
  
  if (!privateKey) {
    throw new Error('No private key found. Please initialize encryption first.');
  }
  
  const messageUint8 = naclUtil.decodeUTF8(message);
  const nonce = nacl.randomBytes(24);
  const key = naclUtil.decodeBase64(privateKey).slice(0, nacl.secretbox.keyLength);
  
  const encryptedMessage = nacl.secretbox(messageUint8, nonce, key);
  
  return {
    encryptedData: naclUtil.encodeBase64(encryptedMessage),
    nonce: naclUtil.encodeBase64(nonce)
  };
};

// Decrypt message from storage
export const decryptFromStorage = (encryptedData: string, nonce: string) => {
  const { privateKey } = getKeys();
  
  if (!privateKey) {
    throw new Error('No private key found. Please initialize encryption first.');
  }
  
  const key = naclUtil.decodeBase64(privateKey).slice(0, nacl.secretbox.keyLength);
  const decodedMessage = naclUtil.decodeBase64(encryptedData);
  const decodedNonce = naclUtil.decodeBase64(nonce);
  
  const decryptedMessage = nacl.secretbox.open(
    decodedMessage,
    decodedNonce,
    key
  );
  
  if (!decryptedMessage) {
    throw new Error('Failed to decrypt message');
  }
  
  return naclUtil.encodeUTF8(decryptedMessage);
}; 