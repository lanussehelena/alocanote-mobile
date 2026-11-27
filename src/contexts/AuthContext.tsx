import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  api,
  setAuthToken,
  setOnUnauthorizedCallback,
  isJwtTokenValid,
  isUnauthorizedError,
  clearStoredAuthSession,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
} from '../services/api';
import { authService, GoogleSignInParams } from '../services/authService';
import { userService } from '../services/userService';
import { LoginRequestDTO, LoginResponseDTO } from '../types';

export interface AuthUser {
  id?: number;
  email: string;
  name: string;
  role: string;
  phone?: string;
  customRole?: string | null;
  profilePictureUrl?: string | null;
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  emailVerified?: boolean;
}

interface AuthContextData {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  signed: boolean;
  isLoadingAuth: boolean;
  loading: boolean;
  signIn: (credentials: LoginRequestDTO) => Promise<LoginResponseDTO>;
  completeEmailVerificationSignIn: (params: {
    email: string;
    password?: string;
  }) => Promise<LoginResponseDTO>;
  signInWithGoogle: (params?: GoogleSignInParams) => Promise<LoginResponseDTO>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    await Promise.all([clearStoredAuthSession(), authService.signOutFirebase()]);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorizedCallback(() => {
      signOut();
    });
    return () => {
      setOnUnauthorizedCallback(null);
    };
  }, [signOut]);

  const refreshUserProfile = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const profile = await userService.getMyProfile();
      const updated: AuthUser = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        phone: profile.phone,
        customRole: profile.customRole,
        profilePictureUrl: profile.profilePictureUrl,
        street: profile.street,
        number: profile.number,
        neighborhood: profile.neighborhood,
        city: profile.city,
        state: profile.state,
        zipCode: profile.zipCode,
        emailVerified: profile.emailVerified,
      };
      setUser(updated);
      await Promise.all([
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated)),
        AsyncStorage.setItem('@AlocaNote:user', JSON.stringify(updated)),
      ]);
      return updated;
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await signOut();
      }
      return null;
    }
  }, [signOut]);

  useEffect(() => {
    async function loadStorageData() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_STORAGE_KEY),
          AsyncStorage.getItem(USER_STORAGE_KEY),
        ]);

        let activeToken = storedToken;
        let activeUserRaw = storedUser;

        if (!activeToken || !activeUserRaw) {
          activeToken = await AsyncStorage.getItem('@AlocaNote:token');
          activeUserRaw = await AsyncStorage.getItem('@AlocaNote:user');
        }

        if (activeToken && activeUserRaw) {
          if (!isJwtTokenValid(activeToken)) {
            await signOut();
            return;
          }

          const cleanToken = activeToken.trim();
          setAuthToken(cleanToken);
          api.defaults.headers.Authorization = `Bearer ${cleanToken}`;
          setToken(cleanToken);
          setUser(JSON.parse(activeUserRaw));
          await refreshUserProfile();
        }
      } catch (error) {
        console.error('Falha ao restaurar autenticação:', error);
        await signOut();
      } finally {
        setIsLoadingAuth(false);
      }
    }

    loadStorageData();
  }, [refreshUserProfile, signOut]);

  const persistAuthSession = async (data: LoginResponseDTO): Promise<LoginResponseDTO> => {
    const cleanToken = data.token?.trim() || '';
    setAuthToken(cleanToken);
    api.defaults.headers.Authorization = `Bearer ${cleanToken}`;

    await Promise.all([
      AsyncStorage.setItem(TOKEN_STORAGE_KEY, cleanToken),
      AsyncStorage.setItem('@AlocaNote:token', cleanToken),
    ]);

    let authUser: AuthUser = {
      email: data.email,
      name: data.name,
      role: data.role,
    };

    try {
      const profile = await userService.getMyProfile();
      authUser = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role || data.role,
        phone: profile.phone,
        customRole: profile.customRole,
        profilePictureUrl: profile.profilePictureUrl,
        street: profile.street,
        number: profile.number,
        neighborhood: profile.neighborhood,
        city: profile.city,
        state: profile.state,
        zipCode: profile.zipCode,
        emailVerified: profile.emailVerified,
      };
    } catch {
      // Caso a rota /users/me falhe, mantemos os dados retornados no login
    }

    await Promise.all([
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser)),
      AsyncStorage.setItem('@AlocaNote:user', JSON.stringify(authUser)),
    ]);

    setToken(cleanToken);
    setUser(authUser);
    return data;
  };

  const signIn = async (credentials: LoginRequestDTO): Promise<LoginResponseDTO> => {
    const data = await authService.login(credentials);
    return persistAuthSession(data);
  };

  const completeEmailVerificationSignIn = async (params: {
    email: string;
    password?: string;
  }): Promise<LoginResponseDTO> => {
    const data = await authService.completeEmailVerificationSignIn(params);
    return persistAuthSession(data);
  };

  const signInWithGoogle = async (params?: GoogleSignInParams): Promise<LoginResponseDTO> => {
    const data = await authService.authenticateWithGoogle(params);
    return persistAuthSession(data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        signed: !!token,
        isLoadingAuth,
        loading: isLoadingAuth,
        signIn,
        completeEmailVerificationSignIn,
        signInWithGoogle,
        signOut,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
