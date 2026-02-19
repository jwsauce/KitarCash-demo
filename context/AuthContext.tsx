
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  signup: (fullName: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for a saved user session in localStorage on initial load
    try {
      const savedUser = localStorage.getItem('kitarCashUser');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      localStorage.removeItem('kitarCashUser');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Mock login function
  const login = async (email: string, pass: string): Promise<void> => {
    setLoading(true);
    setError(null);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === 'test@kitacash.com' && pass === 'password123') {
          const userData: User = { id: '1', fullName: 'John Doe', email };
          setUser(userData);
          localStorage.setItem('kitarCashUser', JSON.stringify(userData));
          setLoading(false);
          resolve();
        } else {
          setError('Invalid email or password.');
          setLoading(false);
          reject(new Error('Invalid credentials'));
        }
      }, 1500);
    });
  };

  // Mock signup function
  const signup = async (fullName: string, email: string, pass: string): Promise<void> => {
    setLoading(true);
    setError(null);
    return new Promise((resolve) => {
      setTimeout(() => {
        const userData: User = { id: Date.now().toString(), fullName, email };
        setUser(userData);
        localStorage.setItem('kitarCashUser', JSON.stringify(userData));
        setLoading(false);
        resolve();
      }, 1500);
    });
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('kitarCashUser');
  };

  const value = { user, loading, error, login, signup, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
