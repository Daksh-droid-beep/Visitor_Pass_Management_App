import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationEmail, setVerificationEmail] = useState('');

  // Check login status on reload
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/profile');
        if (response.data.success) {
          setUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          logout();
        }
      } catch (error) {
        console.error('Auto-login failed:', error.response?.data?.message || error.message);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      
      // If server demands email OTP verification
      if (error.response?.status === 403 && error.response?.data?.requiresVerification) {
        setVerificationEmail(error.response.data.email);
        return { 
          success: false, 
          requiresVerification: true, 
          email: error.response.data.email,
          message: error.response.data.message 
        };
      }

      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please check your credentials.' 
      };
    }
  };

  const register = async (formData) => {
    setIsLoading(true);
    try {
      // Formdata will contain fields and possibly the profilePhoto file
      const response = await api.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setIsLoading(false);
      if (!response.data.isVerified) {
        setVerificationEmail(response.data.email);
        return { success: true, requiresVerification: true, email: response.data.email };
      }
      return { success: true, requiresVerification: false };
    } catch (error) {
      setIsLoading(false);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed.' 
      };
    }
  };

  const verifyOtp = async (email, otp) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      setIsLoading(false);
      return { success: true, message: response.data.message };
    } catch (error) {
      setIsLoading(false);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Verification failed. Invalid OTP.' 
      };
    }
  };

  const sendOtp = async (email) => {
    try {
      await api.post('/auth/send-otp', { email });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to send OTP.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setVerificationEmail('');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      isLoading,
      verificationEmail,
      setVerificationEmail,
      login,
      register,
      verifyOtp,
      sendOtp,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
