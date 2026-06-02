import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/authApi.js';
import { clearStoredAuth, getStoredAuth, setStoredAuth } from '../utils/authStorage.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const storedAuth = getStoredAuth();
  const [token, setToken] = useState(storedAuth.token);
  const [user, setUser] = useState(storedAuth.user);
  const [loading, setLoading] = useState(Boolean(storedAuth.token));

  const logout = useCallback(() => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return undefined;
    }

    let active = true;

    authApi
      .getCurrentUser()
      .then((response) => {
        if (!active) {
          return;
        }

        setUser(response.data);
        setStoredAuth(token, response.data);
      })
      .catch(() => {
        if (active) {
          logout();
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [logout, token]);

  useEffect(() => {
    const handleExpiredSession = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('tropilot:auth-expired', handleExpiredSession);
    return () => window.removeEventListener('tropilot:auth-expired', handleExpiredSession);
  }, []);

  const signIn = useCallback(async (credentials) => {
    const response = await authApi.login(credentials);
    const loggedInUser = {
      id: response.data.userId,
      fullName: response.data.fullName,
      email: response.data.email,
      role: response.data.role,
      mustChangePassword: response.data.mustChangePassword
    };

    setStoredAuth(response.data.token, loggedInUser);
    setToken(response.data.token);
    setUser(loggedInUser);

    return loggedInUser;
  }, []);

  const changeFirstPassword = useCallback(async (payload) => {
    const response = await authApi.changePasswordFirstTime(payload);
    const updatedUser = response.data;

    setUser(updatedUser);

    if (token) {
      setStoredAuth(token, updatedUser);
    }

    return updatedUser;
  }, [token]);

  const updateProfile = useCallback(async (payload) => {
    const response = await authApi.updateCurrentUser(payload);
    const updatedUser = response.data;

    setUser(updatedUser);

    if (token) {
      setStoredAuth(token, updatedUser);
    }

    return updatedUser;
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      signIn,
      logout,
      changeFirstPassword,
      updateProfile
    }),
    [changeFirstPassword, loading, logout, signIn, token, updateProfile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
