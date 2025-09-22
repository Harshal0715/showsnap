import React, { createContext, useState, useEffect, useMemo } from 'react';

export const AuthContext = createContext();

// ✅ Utility: Decode JWT safely
const decodePayload = (jwtToken) => {
  try {
    const base64Url = jwtToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch (err) {
    console.error('❌ Failed to decode JWT:', err);
    return null;
  }
};

// ✅ Utility: Check expiry
const isTokenExpired = (jwtToken) => {
  const payload = decodePayload(jwtToken);
  if (!payload?.exp) return true;
  return payload.exp * 1000 < Date.now();
};

export const AuthProvider = ({ children }) => {
  // ⚡ Initialize directly from localStorage
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  const storedRole = localStorage.getItem('role');

  const initialUser = storedUser ? (() => {
    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  })() : null;

  const [user, setUser] = useState(initialUser);
  const [token, setToken] = useState(storedToken || null);
  const [role, setRole] = useState(storedRole || (initialUser?.role || 'user'));
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!storedToken && !!initialUser && !isTokenExpired(storedToken)
  );

  // 🧹 Clear auth state
  const clearAuthState = () => {
    setUser(null);
    setIsAuthenticated(false);
    setRole('user');
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
  };

  // 🔑 Login handler
  const login = (userData, jwtToken) => {
    if (!userData || !jwtToken) return;

    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('role', (userData.role || 'user').toLowerCase());

    setUser(userData);
    setIsAuthenticated(true);
    setRole((userData.role || 'user').toLowerCase());
    setToken(jwtToken);
  };

  // 🔄 Validate stored token on mount
  useEffect(() => {
    if (storedToken && storedUser) {
      if (isTokenExpired(storedToken)) {
        console.warn('⚠️ Token expired. Clearing auth state.');
        clearAuthState();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ⏱️ Auto-logout on token expiry
  useEffect(() => {
    if (!token) return;

    const payload = decodePayload(token);
    if (!payload?.exp) return;

    const expiryTime = payload.exp * 1000 - Date.now();
    if (expiryTime <= 0) {
      clearAuthState();
      return;
    }

    const timeout = setTimeout(() => {
      console.warn('⚠️ Token expired. Logging out.');
      clearAuthState();
    }, expiryTime);

    return () => clearTimeout(timeout);
  }, [token]);

  // 🔧 Memoized context value for performance
  const contextValue = useMemo(() => ({
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    role,
    setRole,
    token,
    login,
    clearAuthState
  }), [user, isAuthenticated, role, token]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
