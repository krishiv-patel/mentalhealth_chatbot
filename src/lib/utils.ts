import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getEnvVariable(name: string): string | undefined {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    return import.meta.env[`VITE_${name}`] || undefined;
  }
  
  // Check if we're in a Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name] as string;
  }
  
  return undefined;
}

export function formatNumber(
  number: number,
  options: {
    decimals?: number
  } = {}
) {
  const { decimals = 0 } = options

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number)
}

export function formatDate(date: Date | string | number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

export function isValidUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}