import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from './contexts/ThemeContext';
import { ConfigProvider } from './contexts/ConfigContext';
import './index.css';
import App from './App.tsx';

// Create a client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - how long data stays fresh (5 minutes)
      staleTime: 5 * 60 * 1000,
      // Cache time - how long inactive data stays in cache (10 minutes)
      gcTime: 10 * 60 * 1000,
      // Retry failed requests
      retry: 2,
      // Don't refetch on window focus for better performance
      refetchOnWindowFocus: false,
      // Refetch on network reconnect
      refetchOnReconnect: true,
      // Background refetch interval (5 minutes)
      refetchInterval: 5 * 60 * 1000,
    },
    mutations: {
      // Retry failed mutations
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <ConfigProvider>
          <App />
          {/* Only show devtools in development */}
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </ConfigProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);

