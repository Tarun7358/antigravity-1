import React, { createContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get extra profile data from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        setUser({
          _id: firebaseUser.uid,
          uid: firebaseUser.uid,
          username: userDoc.data()?.username || firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'User')}&background=6366f1&color=fff`,
          ...userDoc.data(),
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ─── Google Sign-In (1 click) ──────────────────────────────────────────────
  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;

    // Create/update user profile in Firestore
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        uid: firebaseUser.uid,
        username: firebaseUser.displayName?.replace(/\s+/g, '_').toLowerCase() || firebaseUser.email?.split('@')[0],
        email: firebaseUser.email,
        avatar: firebaseUser.photoURL || '',
        role: 'Member',
        createdAt: serverTimestamp(),
      });
    }

    return result;
  };

  // ─── Email/Password Sign-In ────────────────────────────────────────────────
  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // ─── Email/Password Register ───────────────────────────────────────────────
  const register = async (username, email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = result.user;

    // Set display name in Firebase Auth
    await updateProfile(firebaseUser, { displayName: username });

    // Store profile in Firestore
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      uid: firebaseUser.uid,
      username,
      email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6366f1&color=fff`,
      role: 'Member',
      createdAt: serverTimestamp(),
    });

    return result;
  };

  // ─── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
