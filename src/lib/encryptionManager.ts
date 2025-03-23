import { supabase } from './supabase';
import {
  initializeEncryption,
  hasEncryptionKeys,
  getKeys,
  storeKeys,
  generateKeyPair
} from './encryption';

/**
 * Initialize encryption for a user
 * - Checks if user already has local keys
 * - If not, generates new keys
 * - Stores public key in Supabase
 */
export const setupUserEncryption = async (userId: string) => {
  // First, initialize local encryption
  const keys = initializeEncryption();
  
  if (!keys.publicKey || !keys.privateKey) {
    throw new Error('Failed to initialize encryption keys');
  }
  
  try {
    // Check if user_keys table exists by trying to query it
    try {
      // Check if user already has a public key stored in the database
      const { data, error } = await supabase
        .from('user_keys')
        .select('public_key')
        .eq('user_id', userId);
      
      // If we found existing key data but it doesn't match local storage
      if (data && data.length > 0 && data[0].public_key !== keys.publicKey) {
        // User has different keys in DB than in local storage
        // We should prioritize the server keys and update local storage
        console.log('Updating local keys to match server keys');
        storeKeys(data[0].public_key, keys.privateKey);
        return { publicKey: data[0].public_key, privateKey: keys.privateKey };
      }
      
      // If no key exists in the database, store the public key
      if (!data || data.length === 0) {
        const { error: insertError } = await supabase
          .from('user_keys')
          .insert({
            user_id: userId,
            public_key: keys.publicKey,
            created_at: new Date().toISOString()
          });
        
        // If insertion failed due to missing table or other error, just continue
        // with local keys only
        if (insertError) {
          console.warn('Could not store public key in database:', insertError);
          // Don't throw here - continue with local keys only
        }
      }
    } catch (error) {
      // If the table doesn't exist or there's another issue, just log it 
      // and continue with local encryption only
      console.warn('Error accessing user_keys table:', error);
      // Don't rethrow - allow local encryption to work
    }
    
    return keys;
  } catch (error) {
    console.error('Error in setupUserEncryption:', error);
    // Still return the keys so local encryption can work
    return keys;
  }
};

/**
 * Get the public key for a given user
 */
export const getUserPublicKey = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_keys')
      .select('public_key')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching user public key:', error);
      return null;
    }
    
    return data && data.length > 0 ? data[0].public_key : null;
  } catch (error) {
    console.error('Error in getUserPublicKey:', error);
    return null;
  }
};

/**
 * Get the server public key (for assistant messages)
 */
export const getServerPublicKey = async () => {
  // In a real implementation, this would fetch from a secure API
  // For simplicity, we'll use a fixed key for the assistant
  const ASSISTANT_PUBLIC_KEY = 'SERVER_PUBLIC_KEY';
  return ASSISTANT_PUBLIC_KEY;
}; 