import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { AppRoutes } from '@/routes/AppRoutes';
import { ScrollToTop } from '@/routes/ScrollToTop';
import { applyThemeFromConfig } from '@/config/salonConfig';

export default function App() {
  // Applica la palette del config come CSS variables all'avvio.
  useEffect(() => {
    applyThemeFromConfig();
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: '#fff',
              color: 'rgb(var(--brand-900))',
              border: '1px solid rgb(var(--brand-100))',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
