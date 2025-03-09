import Swal from 'sweetalert2';
import 'animate.css';

// Create a custom styled SweetAlert instance
const MySwal = Swal.mixin({
  customClass: {
    confirmButton: 'bg-primary text-primary-foreground px-4 py-2 rounded-md mx-2',
    cancelButton: 'bg-destructive text-destructive-foreground px-4 py-2 rounded-md',
    popup: 'rounded-lg shadow-lg border border-border',
  },
  buttonsStyling: false,
  showClass: {
    popup: 'animate__animated animate__fadeInUp animate__faster'
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutDown animate__faster'
  }
});

// Export the custom instance
export { MySwal };

// Custom SweetAlert utility functions
export const showConfirm = (title: string, text = '', options = {}) => {
  return MySwal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, proceed!',
    cancelButtonText: 'Cancel',
    ...options
  });
};

export const showSuccess = (title: string, text = '', timer = 1500) => {
  return MySwal.fire({
    title,
    text,
    icon: 'success',
    timer,
    showConfirmButton: false
  });
};

export const showError = (title: string, text = '') => {
  return MySwal.fire({
    title,
    text,
    icon: 'error'
  });
};

export const showInfo = (title: string, text = '') => {
  return MySwal.fire({
    title,
    text,
    icon: 'info'
  });
};

export const showToast = (title: string, options = {}) => {
  return MySwal.fire({
    title,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    ...options
  });
}; 