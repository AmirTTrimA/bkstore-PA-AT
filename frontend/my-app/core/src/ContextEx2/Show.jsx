// Show.jsx
import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthProvider, { useAuth } from './Context/AuthContext';
import { ThemeProvider } from './Context/ThemeContext';
import { LanguageProvider } from './Context/LanguageContext';
import Router from './Routes/Router';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes fresh window
      gcTime: 15 * 60 * 1000,   // 15 minutes cache retention
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        if (error?.response?.status >= 400 && error?.response?.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

function AppContent() {
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    console.log('Is Logged In:', isLoggedIn);
  }, [isLoggedIn]);

  return (
    <div className="app">
      <header>
        {isLoggedIn ? null : <div></div>}
      </header>

      <Router />

      <main style={{ padding: '20px' }}></main>
    </div>
  );
}

function Show() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}





export default Show;