// services/authService.ts
import { useUserStore } from '@/store/userStore';

// Get the current user ID from the store
export const getCurrentUserId = (): string | null => {
  return useUserStore.getState()._id;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return useUserStore.getState().isAuthenticated;
};

// Get the JWT auth token from cookies or localStorage
export const getAuthToken = (): string | null => {
  // Try different storage locations where the token might be
  if (typeof window === 'undefined') return null;

  // Try localStorage options first
  const tokenFromStorage =
    localStorage.getItem('auth_token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('accessToken');

  if (tokenFromStorage) return tokenFromStorage;

  // If not in localStorage, try cookies
  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  // Try different possible cookie names
  return getCookie('accessToken') || getCookie('token') || getCookie('session');
};

// Create headers with authentication token
export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const userId = getCurrentUserId();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // First try to use the actual JWT token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('Using auth token in request');
  }
  // Fallback to using user ID as token (not ideal but matches your current API)
  else if (userId) {
    headers['Authorization'] = `Bearer ${userId}`;
    console.log('Using user ID as fallback in request');
  } else {
    console.log('No auth credentials available for request');
  }

  return headers;
};

// Fetch with authentication headers
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const authHeaders = getAuthHeaders();

  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...(options.headers || {}),
    },
  });
};

// Debug function to check auth state
export const debugAuth = () => {
  const store = useUserStore.getState();
  const token = getAuthToken();

  return {
    userId: store._id,
    isAuthenticated: store.isAuthenticated,
    hasToken: !!token,
    tokenType: token ? (token.length > 40 ? 'JWT' : 'Simple ID') : 'None',
    store: {
      email: store.email,
      role: store.role,
      name: `${store.firstName} ${store.lastName}`,
    },
  };
};

// Check if the current user owns a resource
export const isResourceOwner = (
  resourceAuthorId: string | undefined
): boolean => {
  if (!resourceAuthorId) return false;

  const currentUserId = getCurrentUserId();
  return !!currentUserId && String(currentUserId) === String(resourceAuthorId);
};
