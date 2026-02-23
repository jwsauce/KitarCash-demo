
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { auth } from '../firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile,
    User as FirebaseUser
} from 'firebase/auth';

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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
            setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                fullName: firebaseUser.displayName || 'KitarCash User',
            });
        } else {
            setUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const login = async (email: string, pass: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Email or password is incorrect');
      } else {
        setError('An unknown error occurred. Please try again.');
      }
      throw err;
    } finally {
        setLoading(false);
    }
  };

  const signup = async (fullName: string, email: string, pass: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(userCredential.user, {
        displayName: fullName
      });
      // The onAuthStateChanged listener will pick up the new user and update the state.
      // We can also set it here to ensure the UI updates instantly with the full name.
      setUser({
        id: userCredential.user.uid,
        email: userCredential.user.email!,
        fullName: fullName,
      });
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('User already exists. Please sign in');
      } else {
        setError('Failed to create an account. Please try again.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
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
