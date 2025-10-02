import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Dashboard } from '@/components/Dashboard';
import { useCurrentUser } from '@/hooks/useAuth';

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Public Route component (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

// Main Layout component
function MainLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  
  // Initialize user data on mount
  useCurrentUser();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-col sm:flex-row h-[calc(100vh-73px)]">
        <Sidebar />
        <main className="flex-1 overflow-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}

// Auth Layout component
function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {children}
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated, getCurrentUser } = useAuthStore();
  
  // Try to get current user on app load
  useEffect(() => {
    if (isAuthenticated) {
      getCurrentUser().catch(() => {
        // If getting current user fails, user will be redirected to login
      });
    }
  }, [isAuthenticated, getCurrentUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <AuthLayout>
                  <LoginForm />
                </AuthLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <AuthLayout>
                  <RegisterForm />
                </AuthLayout>
              </PublicRoute>
            }
          />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Default redirect */}
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />
          
          {/* Catch all route */}
          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

