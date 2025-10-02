import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api';
import { LoginCredentials, RegisterCredentials } from '@/types';

// Auth query keys
export const authKeys = {
  me: ['auth', 'me'] as const,
};

// Get current user
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => apiClient.getCurrentUser(),
    retry: false,
  });
}

// Login mutation
export function useLogin() {
  const { login } = useAuthStore();
  
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials.email, credentials.password),
  });
}

// Register mutation
export function useRegister() {
  const { register } = useAuthStore();
  
  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => 
      register(credentials.email, credentials.password, credentials.name),
  });
}

// Logout mutation
export function useLogout() {
  const { logout } = useAuthStore();
  
  return useMutation({
    mutationFn: logout,
  });
}

// Refresh token mutation
export function useRefreshToken() {
  const { refreshToken } = useAuthStore();
  
  return useMutation({
    mutationFn: refreshToken,
  });
}

