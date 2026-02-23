import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// The shape of a logged-in user we care about in the UI
interface AppUser {
  id: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: AppUser | null;
  role: string | null;
  centerId: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  signup: (fullName: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Maps role strings to their dashboard URLs
const ROLE_ROUTES: Record<string, string> = {
  user: '/dashboard',
  recycling_center: '/center-dashboard',
  driver: '/driver-dashboard',
  admin: '/admin-dashboard',
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [centerId, setCenterId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Helper: extract role from JWT and update state
  const applyUserSession = async (firebaseUser: FirebaseUser, shouldRedirect = false) => {
    // Force token refresh so we get the latest custom claims
    const tokenResult = await firebaseUser.getIdTokenResult(true);
    const userRole = (tokenResult.claims.role as string) || 'user';
    const userCenterId = (tokenResult.claims.centerId as string) || null;

    setUser({
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || 'KitarCash User',
    });
    setRole(userRole);
    setCenterId(userCenterId);

    if (shouldRedirect) {
      const destination = ROLE_ROUTES[userRole] || '/';
      navigate(destination, { replace: true });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        await applyUserSession(firebaseUser, false); // Don't redirect on page reload
      } else {
        setUser(null);
        setRole(null);
        setCenterId(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, pass);
      await applyUserSession(credential.user, true); // Redirect after login
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
      const credential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(credential.user, { displayName: fullName });

      // Create the user document in Firestore at signup
      // walletBalance starts at 0 and is never set by the client again
      await setDoc(doc(db, 'users', credential.user.uid), {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: fullName,
        fullName: fullName,      //  for email service compatibility
        role: 'user',
        walletBalance: 0,
        centerId: null,
        createdAt: serverTimestamp(),
      });

      // After the setDoc call in signup:
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const setDefaultRole = httpsCallable(getFunctions(), 'setDefaultRole');
      await setDefaultRole({});

      // Then force token refresh so the new claim is available immediately
      await credential.user.getIdToken(true);

      // New signups default to 'user' role — redirect to user dashboard
      setUser({ id: credential.user.uid, email: credential.user.email!, displayName: fullName });
      setRole('user');
      setCenterId(null);
      navigate('/dashboard', { replace: true });

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
    navigate('/', { replace: true });
  };

  const value = { user, role, centerId, loading, error, login, signup, logout };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-100">
          <div className="text-xl font-medium text-green-600">Loading KitarCash...</div>
        </div>
      ) : (
        children
      )}
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