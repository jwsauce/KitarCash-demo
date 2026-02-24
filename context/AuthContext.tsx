import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { auth, db } from '../firebase'; // Ensure db is imported
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'; // Added getDoc

// User profile structure for the application
interface AppUser {
  id: string;
  email: string;
  displayName: string;
}

// Updated interface: login and signup now return Promise<any> to fix AuthCard errors
interface AuthContextType {
  user: AppUser | null;
  role: string | null;
  centerId: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<any>;
  signup: (fullName: string, email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Routes mapping for different user roles
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

  /**
   * Helper: Extracts user data and role, then handles redirection.
   * Modified to read directly from Firestore to ensure manual role changes are immediate.
   */
  const applyUserSession = async (firebaseUser: FirebaseUser, shouldRedirect = false) => {
    try {
      // 1. Fetch real-time user data from Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userDocRef);
      const userData = userSnap.data();

      // 2. Determine role: Firestore > Token Claims > Default 'user'
      const tokenResult = await firebaseUser.getIdTokenResult(true);
      const userRole = userData?.role || (tokenResult.claims.role as string) || 'user';
      const userCenterId = userData?.centerId || (tokenResult.claims.centerId as string) || null;

      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'KitarCash User',
      });
      setRole(userRole);
      setCenterId(userCenterId);

      // 3. Handle navigation if required (e.g., right after login)
      if (shouldRedirect) {
        const destination = ROLE_ROUTES[userRole] || '/dashboard';
        console.log(`System: User identified as [${userRole}]. Routing to ${destination}`);
        navigate(destination, { replace: true });
      }
    } catch (err) {
      console.error("Session sync failed:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        await applyUserSession(firebaseUser, false);
      } else {
        setUser(null);
        setRole(null);
        setCenterId(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  /**
   * Login: Returns the credential so AuthCard can access the user object.
   */
  const login = async (email: string, pass: string): Promise<any> => {
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

  const signup = async (fullName: string, email: string, pass: string): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(credential.user, { displayName: fullName });

      await setDoc(doc(db, 'users', credential.user.uid), {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: fullName,
        fullName: fullName,
        role: 'user',
        walletBalance: 0,
        centerId: null,
        createdAt: serverTimestamp(),
      });

      // Optional: Initialize custom claims if functions are available
      try {
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        const setDefaultRole = httpsCallable(getFunctions(), 'setDefaultRole');
        await setDefaultRole({});
        await credential.user.getIdToken(true);
      } catch (e) {
        console.warn("Custom claims skipped (normal for frontend-only demo)");
      }

      setUser({ id: credential.user.uid, email: credential.user.email!, displayName: fullName });
      setRole('user');
      setCenterId(null);
      navigate('/dashboard', { replace: true });
      
      return credential;
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
          <div className="text-xl font-medium text-green-600 animate-pulse">Loading KitarCash...</div>
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