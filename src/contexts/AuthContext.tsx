import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface User {
  name: string;
  email: string;
  role: string;
}

interface AuthContextData {
  signed: boolean;
  user: User | null;
  loading: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function clearStorageOnStart() {
      await AsyncStorage.multiRemove(['@AlocaNote:user', '@AlocaNote:token']);
      setLoading(false);
    }

    clearStorageOnStart();
  }, []);

  async function signIn(token: string, loggedUser: User) {
    setUser(loggedUser);
    api.defaults.headers.Authorization = `Bearer ${token}`;
    
    await AsyncStorage.setItem('@AlocaNote:user', JSON.stringify(loggedUser));
    await AsyncStorage.setItem('@AlocaNote:token', token);
  }

  async function signOut() {
    await AsyncStorage.removeItem('@AlocaNote:user');
    await AsyncStorage.removeItem('@AlocaNote:token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}