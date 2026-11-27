import { Platform } from 'react-native';
import { api } from './api';
import { firebaseAuthClient } from './firebase';
import {
  FirebaseAuthRequestDTO,
  LoginRequestDTO,
  LoginResponseDTO,
  RegisterUserRequestDTO,
  Role,
  UserResponseDTO,
} from '../types';

export interface GoogleSignInParams {
  googleIdToken?: string | null;
  googleAccessToken?: string | null;
  phone?: string;
  role?: Role;
  customRole?: string | null;
}

export interface RegisterResult {
  user: UserResponseDTO;
  verificationEmailSent: boolean;
}

export const EMAIL_NOT_VERIFIED_DEFAULT_MESSAGE =
  'Seu e-mail ainda não foi verificado. Abra sua caixa de entrada e clique no link de confirmação para liberar o acesso.';

export class EmailNotVerifiedError extends Error {
  readonly code = 'EMAIL_NOT_VERIFIED';
  readonly email: string;

  constructor(email: string, message = EMAIL_NOT_VERIFIED_DEFAULT_MESSAGE) {
    super(message);
    this.name = 'EmailNotVerifiedError';
    this.email = email.trim().toLowerCase();
  }
}

export function isEmailNotVerifiedError(error: unknown): error is EmailNotVerifiedError {
  return (
    error instanceof EmailNotVerifiedError ||
    (typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'EMAIL_NOT_VERIFIED')
  );
}

function extractBackendErrorMessage(error: any): string {
  return typeof error?.response?.data?.message === 'string'
    ? error.response.data.message
    : '';
}

function isBackendEmailNotVerifiedError(error: any): boolean {
  const message = extractBackendErrorMessage(error).toLowerCase();
  return message.includes('não verificado') || message.includes('nao verificado');
}

export const authService = {
  isFirebaseConfigured(): boolean {
    return firebaseAuthClient.isConfigured();
  },

  async login(credentials: LoginRequestDTO): Promise<LoginResponseDTO> {
    const normalizedEmail = credentials.email.trim().toLowerCase();

    if (firebaseAuthClient.isConfigured()) {
      try {
        const fbResult = await firebaseAuthClient.signInWithEmailAndPassword(
          normalizedEmail,
          credentials.password
        );

        if (fbResult) {
          if (!fbResult.emailVerified) {
            throw new EmailNotVerifiedError(normalizedEmail);
          }

          if (fbResult.idToken) {
            const response = await api.post<LoginResponseDTO>('/auth/firebase', {
              idToken: fbResult.idToken,
              email: fbResult.email,
              name: fbResult.name,
              profilePictureUrl: fbResult.photoUrl,
            });
            return response.data;
          }
        }
      } catch (error) {
        if (isEmailNotVerifiedError(error)) {
          throw error;
        }
        if (isBackendEmailNotVerifiedError(error)) {
          throw new EmailNotVerifiedError(normalizedEmail, extractBackendErrorMessage(error));
        }
        // Fallback para login direto no backend (ex: usuários seed locais como admin@alocanote.com)
      }
    }

    try {
      const response = await api.post<LoginResponseDTO>('/auth/login', {
        ...credentials,
        email: normalizedEmail,
      });
      return response.data;
    } catch (error) {
      if (isBackendEmailNotVerifiedError(error)) {
        throw new EmailNotVerifiedError(normalizedEmail, extractBackendErrorMessage(error));
      }
      throw error;
    }
  },

  async register(data: RegisterUserRequestDTO): Promise<RegisterResult> {
    const normalizedEmail = data.email.trim().toLowerCase();
    const response = await api.post<UserResponseDTO>('/auth/register', {
      ...data,
      email: normalizedEmail,
    });

    let verificationEmailSent = false;

    if (firebaseAuthClient.isConfigured()) {
      try {
        const fbResult = await firebaseAuthClient.registerWithEmailAndPassword(
          normalizedEmail,
          data.password,
          data.name
        );
        verificationEmailSent = Boolean(fbResult?.verificationEmailSent);
      } catch (error: any) {
        console.error('Erro ao registrar usuário no Firebase:', error);
        if (error?.code === 'auth/email-already-in-use') {
          try {
            const resendResult = await firebaseAuthClient.resendVerificationEmail(
              normalizedEmail,
              data.password
            );
            verificationEmailSent = !resendResult.alreadyVerified;
          } catch (resendError) {
            console.error('Erro ao reenviar e-mail de verificação no cadastro:', resendError);
            verificationEmailSent = false;
          }
        }
      }
    }

    return {
      user: response.data,
      verificationEmailSent,
    };
  },

  async completeEmailVerificationSignIn(params: {
    email: string;
    password?: string;
  }): Promise<LoginResponseDTO> {
    const normalizedEmail = params.email.trim().toLowerCase();

    if (firebaseAuthClient.isConfigured()) {
      const fbResult = await firebaseAuthClient.checkEmailVerificationStatus(
        normalizedEmail,
        params.password
      );

      if (!fbResult) {
        throw new Error(
          'Não foi possível consultar o status de verificação. Volte para o Login e entre com seu e-mail e senha.'
        );
      }

      if (!fbResult.emailVerified) {
        throw new EmailNotVerifiedError(
          normalizedEmail,
          'Ainda não detectamos a confirmação do seu e-mail. Clique no link recebido na sua caixa de entrada e tente novamente.'
        );
      }

      const response = await api.post<LoginResponseDTO>('/auth/firebase', {
        idToken: fbResult.idToken,
        email: fbResult.email,
        name: fbResult.name,
        profilePictureUrl: fbResult.photoUrl,
      });
      return response.data;
    }

    if (params.password) {
      try {
        const response = await api.post<LoginResponseDTO>('/auth/login', {
          email: normalizedEmail,
          password: params.password,
        });
        return response.data;
      } catch (error) {
        if (isBackendEmailNotVerifiedError(error)) {
          throw new EmailNotVerifiedError(normalizedEmail, extractBackendErrorMessage(error));
        }
        throw error;
      }
    }

    throw new EmailNotVerifiedError(
      normalizedEmail,
      'Configure o Firebase Authentication (EXPO_PUBLIC_FIREBASE_*) para validar a confirmação por e-mail.'
    );
  },

  async resendVerificationEmail(params: {
    email: string;
    password?: string;
  }): Promise<{ alreadyVerified: boolean }> {
    return firebaseAuthClient.resendVerificationEmail(params.email, params.password);
  },

  async signOutFirebase(): Promise<void> {
    await firebaseAuthClient.signOut();
  },

  async authenticateWithFirebase(data: FirebaseAuthRequestDTO): Promise<LoginResponseDTO> {
    const response = await api.post<LoginResponseDTO>('/auth/firebase', data);
    return response.data;
  },

  async authenticateWithGoogle(params?: GoogleSignInParams): Promise<LoginResponseDTO> {
    const fbResult =
      Platform.OS === 'web' && !params?.googleIdToken && !params?.googleAccessToken
        ? await firebaseAuthClient.signInWithGoogleWebPopup()
        : await firebaseAuthClient.signInWithGoogleCredential(
            params?.googleIdToken,
            params?.googleAccessToken
          );

    const response = await api.post<LoginResponseDTO>('/auth/google', {
      idToken: fbResult.idToken,
      email: fbResult.email || undefined,
      name: fbResult.name || undefined,
      profilePictureUrl: fbResult.photoUrl || undefined,
      phone: params?.phone,
      role: params?.role,
      customRole: params?.customRole,
    });

    return response.data;
  },
};
