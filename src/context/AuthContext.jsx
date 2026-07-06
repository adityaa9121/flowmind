import { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up with Email & Password
  const signup = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    await sendEmailVerification(userCredential.user);
    return userCredential;
  };

  // Login with Email & Password
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Google Login
  const googleLogin = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  // Logout
  const logout = () => {
    setDbUser(null);
    return signOut(auth);
  };

  // Reset Password
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };
  
  // Update Profile
  const updateUserProfile = (data) => {
    return updateProfile(auth.currentUser, data);
  };

  // Update Password
  const updateUserPassword = (newPassword) => {
    return updatePassword(auth.currentUser, newPassword);
  };

  const updateDbUser = (data) => {
    setDbUser(data);
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      // Sync user to MongoDB
      if (user) {
        try {
          const token = await user.getIdToken();
          const res = await fetch(`${API_BASE_URL}/api/users/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await res.json();
          setDbUser(data.user); // MongoDB user with preferences, theme, etc
        } catch (error) {
          console.error("Failed to sync user with MongoDB:", error);
        }
      } else {
        setDbUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    dbUser,
    updateDbUser,
    signup,
    login,
    googleLogin,
    logout,
    resetPassword,
    updateUserProfile,
    updateUserPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
