import Swal from 'sweetalert2';
import 'animate.css';

// Create a custom styled SweetAlert instance
const MySwal = Swal.mixin({
  customClass: {
    confirmButton: 'bg-gradient-to-r from-primary to-rose-500 text-white font-medium px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 mx-2',
    cancelButton: 'bg-card text-foreground border border-border px-5 py-2.5 rounded-lg hover:bg-muted transition-all duration-200',
    popup: 'rounded-xl shadow-xl border border-border backdrop-blur-sm',
    title: 'text-xl font-bold gradient-text',
    htmlContainer: 'text-muted-foreground',
    actions: 'mt-4',
    icon: 'text-rose-500 border-rose-500',
  },
  buttonsStyling: false,
  showClass: {
    popup: 'animate__animated animate__fadeIn animate__faster'
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOut animate__faster'
  },
  background: 'var(--background)',
  color: 'var(--foreground)',
  backdrop: 'rgba(0,0,0,0.4) backdrop-blur-sm',
});

// Export the custom instance
export { MySwal };

// Custom SweetAlert utility functions
export const showConfirm = (title: string, text = '', options = {}) => {
  return MySwal.fire({
    title,
    icon: undefined,
    html: `
      <div class="flex flex-col items-center gap-4 mb-4">
        <div class="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-500">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <h2 class="text-xl font-bold gradient-text mb-1">${title}</h2>
        <p class="text-muted-foreground text-center max-w-xs">${text}</p>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Yes, start new chat',
    cancelButtonText: 'Cancel',
    showClass: {
      popup: 'animate__animated animate__zoomIn animate__faster'
    },
    hideClass: {
      popup: 'animate__animated animate__zoomOut animate__faster'
    },
    padding: '2rem',
    width: 'auto',
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