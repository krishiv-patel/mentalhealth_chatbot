// Sonner toast utility functions
import { toast } from 'sonner';

// Success toast
export const showSuccess = (message: string, description?: string) => {
  return toast.success(message, {
    description,
    duration: 3000,
    className: 'group',
  });
};

// Error toast
export const showError = (message: string, description?: string) => {
  return toast.error(message, {
    description,
    duration: 5000,
    className: 'group',
  });
};

// Info toast
export const showInfo = (message: string, description?: string) => {
  return toast.info(message, {
    description,
    duration: 4000,
    className: 'group',
  });
};

// Warning toast
export const showWarning = (message: string, description?: string) => {
  return toast.warning(message, {
    description,
    duration: 4000,
    className: 'group',
  });
};

// Custom toast
export const showCustom = (message: string, options = {}) => {
  return toast(message, options);
};

// Loading toast
export const showLoading = (message: string) => {
  return toast.loading(message);
};

// Default export
export default toast; 