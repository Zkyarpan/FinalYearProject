'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store/userStore';

/**
 * This component helps debug the user store initialization
 * Add it to your Root Layout to see when your user state gets initialized
 */
const AuthInitializer = () => {
  const store = useUserStore();
  
  useEffect(() => {
    // Log the initial auth state
    console.log('🔑 Auth Initializer - Initial state:', {
      userId: store._id,
      isAuthenticated: store.isAuthenticated,
      name: `${store.firstName} ${store.lastName}`,
      role: store.role,
      profileComplete: store.profileComplete
    });
    
    // Try to get token from localStorage/cookies
    if (typeof window !== 'undefined') {
      const possibleTokenKeys = [
        'accessToken', 
        'token', 
        'auth_token', 
        'jwt',
        'session_token'
      ];
      
      const tokens = {};
      for (const key of possibleTokenKeys) {
        const value = localStorage.getItem(key);
        if (value) tokens[key] = value.substring(0, 15) + '...';
      }
      
      console.log('🔑 Stored tokens:', tokens);
      
      // Check cookies
      console.log('🔑 Cookies:', document.cookie);
    }
  }, [store]);
  
  return null; // This component doesn't render anything
};

export default AuthInitializer;