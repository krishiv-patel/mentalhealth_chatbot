import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '../ThemeProvider';

export function Toaster() {
  const { theme } = useTheme();
  
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: theme === 'dark' ? 'hsl(224, 71%, 4%)' : 'white',
          color: theme === 'dark' ? 'white' : 'black',
          border: '1px solid var(--border)',
        },
        className: 'sonner-toast',
      }}
      closeButton
      richColors
      expand
      theme={theme}
    />
  );
} 