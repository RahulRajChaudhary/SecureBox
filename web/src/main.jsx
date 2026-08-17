import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#15171a',
            color: '#e8e9eb',
            border: '1px solid #26292e',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#a6e22e', secondary: '#0b0d0f' } },
          error: { iconTheme: { primary: '#f87171', secondary: '#0b0d0f' } },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
);
