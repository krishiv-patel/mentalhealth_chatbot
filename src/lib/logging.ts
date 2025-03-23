import { supabase } from './supabase';

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

// Log categories
export enum LogCategory {
  CHAT = 'chat',
  AUTH = 'auth',
  SYSTEM = 'system',
  ENCRYPTION = 'encryption',
  FILE = 'file'
}

// Log entry interface
export interface LogEntry {
  id?: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  user_id?: string | null;
  conversation_id?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Log an event to the database and console
 */
export async function logEvent(
  level: LogLevel,
  category: LogCategory,
  message: string,
  userId?: string | null,
  conversationId?: string | null,
  metadata?: Record<string, any>
): Promise<void> {
  const timestamp = new Date().toISOString();
  
  // Create log entry
  const logEntry: LogEntry = {
    timestamp,
    level,
    category,
    message,
    user_id: userId,
    conversation_id: conversationId,
    metadata
  };
  
  // Console log based on level
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(`[${category}] ${message}`, metadata);
      break;
    case LogLevel.INFO:
      console.info(`[${category}] ${message}`, metadata);
      break;
    case LogLevel.WARNING:
      console.warn(`[${category}] ${message}`, metadata);
      break;
    case LogLevel.ERROR:
      console.error(`[${category}] ${message}`, metadata);
      break;
  }
  
  // Store in database if authenticated
  try {
    if (userId) {
      const { error } = await supabase
        .from('logs')
        .insert(logEntry);
        
      if (error) {
        console.error('Error storing log entry:', error);
      }
    }
  } catch (error) {
    console.error('Failed to store log entry:', error);
  }
}

// Convenience functions for different log levels
export const logDebug = (
  category: LogCategory,
  message: string,
  userId?: string | null,
  conversationId?: string | null,
  metadata?: Record<string, any>
) => logEvent(LogLevel.DEBUG, category, message, userId, conversationId, metadata);

export const logInfo = (
  category: LogCategory,
  message: string,
  userId?: string | null,
  conversationId?: string | null,
  metadata?: Record<string, any>
) => logEvent(LogLevel.INFO, category, message, userId, conversationId, metadata);

export const logWarning = (
  category: LogCategory,
  message: string,
  userId?: string | null,
  conversationId?: string | null,
  metadata?: Record<string, any>
) => logEvent(LogLevel.WARNING, category, message, userId, conversationId, metadata);

export const logError = (
  category: LogCategory,
  message: string,
  userId?: string | null,
  conversationId?: string | null,
  metadata?: Record<string, any>
) => logEvent(LogLevel.ERROR, category, message, userId, conversationId, metadata); 