import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// User profile structure for the application
interface AppUser {
  id: string;
  email: string;
  displayName: string;
}

// Context interface defining available auth methods and states
interface AuthContextType {
  user: AppUser | null;
  role: string | null;
  centerId: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<any>;
  // UPDATED: signup now only takes 3 parameters (no more dynamic role from UI)
  signup: (email: string, pass: string, fullName: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mapping of roles to their respective landing pages
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
   * Helper: Synchronizes Firebase Auth state with Firestore user profiles.
   * This is key for Admin changes: if an admin changes a role in Firestore, 
   * this function detects it and updates the app state.
   */
  const applyUserSession = async (firebaseUser: FirebaseUser, shouldRedirect = false) => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userDocRef);
      const userData = userSnap.data();

      // Retrieve role from Firestore first, fallback to 'user'
      const userRole = userData?.role || 'user';
      const userCenterId = userData?.centerId || null;

      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'KitarCash User',
      });
      setRole(userRole);
      setCenterId(userCenterId);

      // Trigger navigation if requested (usually right after Login/Signup)
      if (shouldRedirect) {
        const destination = ROLE_ROUTES[userRole] || '/dashboard';
        navigate(destination, { replace: true });
      }
    } catch (err) {
      console.error("Session sync failed:", err);
    }
  };

  /**
   * Listener: Monitors Auth state changes (Login/Logout/Refresh)
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
   * Login: Authenticates existing users and routes them based on their Firestore role
   */
  const login = async (email: string, pass: string): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, pass);
      await applyUserSession(credential.user, true);
      return credential;
    } catch (err: any) {
      setError(err.code === 'auth/invalid-credential' ? 'Incorrect email or password' : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Signup: Logic updated to force all new accounts to the 'user' role.
   * Admin must manually change the role in Firestore to 'driver' or 'recycling_center'.
   */
  const signup = async (email: string, pass: string, fullName: string): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      // 1. Create account in Firebase Authentication
      const credential = await createUserWithEmailAndPassword(auth, email, pass);

      // 2. Set the display name in the Auth profile
      await updateProfile(credential.user, { displayName: fullName });

      // 3. Create the user document in Firestore. 
      // ROLE IS HARDCODED TO 'user' FOR SECURITY.
      await setDoc(doc(db, 'users', credential.user.uid), {
        uid: credential.user.uid,
        email: credential.user.email,
        fullName: fullName,
        role: 'user',
        walletBalance: 0,
        centerId: null,
        isApproved: false,
        createdAt: serverTimestamp(),
      });

      // 4. Set the 'user' custom claim on the Auth token via Cloud Function
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const setDefaultRoleFn = httpsCallable(getFunctions(), 'setDefaultRole');
      await setDefaultRoleFn();

      // 5. Force-refresh the token so the new claim is available immediately
      await credential.user.getIdToken(true);

      // 6. Update local state
      setUser({ id: credential.user.uid, email: credential.user.email!, displayName: fullName });
      setRole('user');

      // Navigate all new signups to the standard user dashboard
      navigate('/dashboard', { replace: true });

      return credential;
    } catch (err: any) {
      setError(err.code === 'auth/email-already-in-use' ? 'Email already registered' : 'Registration failed');
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
        <div className="min-h-screen flex items-center justify-center bg-green-50">
          <div className="text-xl font-bold text-green-600 animate-pulse">Loading KitarCash...</div>
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