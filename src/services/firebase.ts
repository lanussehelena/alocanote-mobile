import { Platform } from 'react-native';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  reload,
  signOut as firebaseSignOut,
  Auth,
} from 'firebase/auth';

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

export const googleOAuthConfig = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
};

export interface FirebaseAuthResult {
  idToken: string;
  uid: string;
  email: string;
  name?: string;
  photoUrl?: string;
  emailVerified?: boolean;
  verificationEmailSent?: boolean;
  provider: 'GOOGLE' | 'FIREBASE_EMAIL';
}

let firebaseAppInstance: FirebaseApp | null = null;
let firebaseAuthInstance: Auth | null = null;

function getFirebaseAuth(): Auth | null {
  if (!firebaseConfig.apiKey || !firebaseConfig.apiKey.trim()) {
    return null;
  }

  if (!firebaseAppInstance) {
    firebaseAppInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }

  if (!firebaseAuthInstance) {
    firebaseAuthInstance = getAuth(firebaseAppInstance);
    firebaseAuthInstance.languageCode = 'pt';
  }

  return firebaseAuthInstance;
}

export const firebaseAuthClient = {
  isConfigured(): boolean {
    return Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.trim().length > 0);
  },

  isGoogleConfigured(): boolean {
    return Boolean(
      (googleOAuthConfig.webClientId && googleOAuthConfig.webClientId.trim().length > 0) ||
      (googleOAuthConfig.androidClientId && googleOAuthConfig.androidClientId.trim().length > 0) ||
      (googleOAuthConfig.iosClientId && googleOAuthConfig.iosClientId.trim().length > 0) ||
      (Platform.OS === 'web' && this.isConfigured())
    );
  },

  async registerWithEmailAndPassword(
    email: string,
    password: string,
    displayName?: string
  ): Promise<FirebaseAuthResult | null> {
    const auth = getFirebaseAuth();
    if (!auth) {
      return null;
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password
    );

    if (displayName && displayName.trim()) {
      try {
        await updateProfile(userCredential.user, { displayName: displayName.trim() });
      } catch {
        // Ignora falha opcional ao definir displayName
      }
    }

    let verificationEmailSent = false;
    try {
      await sendEmailVerification(userCredential.user);
      verificationEmailSent = true;
    } catch (error) {
      console.error('Erro ao enviar e-mail de verificação no Firebase:', error);
      verificationEmailSent = false;
    }

    const idToken = await userCredential.user.getIdToken();

    return {
      idToken,
      uid: userCredential.user.uid,
      email: userCredential.user.email || email.trim().toLowerCase(),
      name: userCredential.user.displayName || displayName?.trim(),
      photoUrl: userCredential.user.photoURL || undefined,
      emailVerified: userCredential.user.emailVerified,
      verificationEmailSent,
      provider: 'FIREBASE_EMAIL',
    };
  },

  async signInWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<FirebaseAuthResult | null> {
    const auth = getFirebaseAuth();
    if (!auth) {
      return null;
    }

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password
    );
    try {
      await reload(userCredential.user);
    } catch {
      // Continua com os dados atuais caso o reload falhe
    }

    const idToken = await userCredential.user.getIdToken(true);

    return {
      idToken,
      uid: userCredential.user.uid,
      email: userCredential.user.email || email.trim().toLowerCase(),
      name: userCredential.user.displayName || undefined,
      photoUrl: userCredential.user.photoURL || undefined,
      emailVerified: userCredential.user.emailVerified,
      provider: 'FIREBASE_EMAIL',
    };
  },

  async checkEmailVerificationStatus(
    email?: string,
    password?: string
  ): Promise<FirebaseAuthResult | null> {
    const auth = getFirebaseAuth();
    if (!auth) {
      return null;
    }

    const normalizedEmail = email?.trim().toLowerCase();
    let currentUser = auth.currentUser;

    if (
      (!currentUser ||
        (normalizedEmail && currentUser.email?.trim().toLowerCase() !== normalizedEmail)) &&
      normalizedEmail &&
      password
    ) {
      try {
        const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        currentUser = credential.user;
      } catch (signInError: any) {
        if (
          signInError?.code === 'auth/user-not-found' ||
          signInError?.code === 'auth/invalid-credential'
        ) {
          return null;
        }
        throw signInError;
      }
    }

    if (!currentUser) {
      return null;
    }

    await reload(currentUser);
    const idToken = await currentUser.getIdToken(true);

    return {
      idToken,
      uid: currentUser.uid,
      email: currentUser.email || normalizedEmail || '',
      name: currentUser.displayName || undefined,
      photoUrl: currentUser.photoURL || undefined,
      emailVerified: currentUser.emailVerified,
      provider: 'FIREBASE_EMAIL',
    };
  },

  async resendVerificationEmail(
    email?: string,
    password?: string
  ): Promise<{ alreadyVerified: boolean }> {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error(
        'O Firebase Authentication não está configurado neste ambiente. Configure as variáveis EXPO_PUBLIC_FIREBASE_* no arquivo .env.'
      );
    }

    const normalizedEmail = email?.trim().toLowerCase();
    let currentUser = auth.currentUser;

    if (
      (!currentUser ||
        (normalizedEmail && currentUser.email?.trim().toLowerCase() !== normalizedEmail)) &&
      normalizedEmail &&
      password
    ) {
      try {
        const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        currentUser = credential.user;
      } catch (signInError: any) {
        if (
          signInError?.code === 'auth/user-not-found' ||
          signInError?.code === 'auth/invalid-credential'
        ) {
          try {
            const created = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
            currentUser = created.user;
          } catch (createError: any) {
            if (createError?.code === 'auth/email-already-in-use') {
              throw new Error(
                'Não foi possível autenticar sua conta no Firebase para reenviar o e-mail. Verifique sua senha no Login.'
              );
            }
            throw createError;
          }
        } else {
          throw signInError;
        }
      }
    }

    if (!currentUser) {
      throw new Error(
        'Sessão de verificação expirada. Volte para o Login e informe seu e-mail e senha para solicitar um novo link.'
      );
    }

    await reload(currentUser);

    if (currentUser.emailVerified) {
      return { alreadyVerified: true };
    }

    try {
      await sendEmailVerification(currentUser);
      return { alreadyVerified: false };
    } catch (error: any) {
      if (error?.code === 'auth/too-many-requests') {
        throw new Error(
          'Muitas tentativas em pouco tempo. Aguarde alguns instantes e verifique sua caixa de entrada ou spam.'
        );
      }
      throw new Error('Não foi possível reenviar o e-mail de verificação. Tente novamente em instantes.');
    }
  },

  async signOut(): Promise<void> {
    const auth = getFirebaseAuth();
    if (!auth) {
      return;
    }
    try {
      await firebaseSignOut(auth);
    } catch {
      // Ignora erro ao encerrar sessão Firebase
    }
  },

  async signInWithGoogleWebPopup(): Promise<FirebaseAuthResult> {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error(
        'Configure EXPO_PUBLIC_FIREBASE_API_KEY e EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN no arquivo .env.'
      );
    }

    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    const userCredential = await signInWithPopup(auth, provider);
    const idToken = await userCredential.user.getIdToken();

    return {
      idToken,
      uid: userCredential.user.uid,
      email: userCredential.user.email || '',
      name: userCredential.user.displayName || undefined,
      photoUrl: userCredential.user.photoURL || undefined,
      emailVerified: userCredential.user.emailVerified,
      provider: 'GOOGLE',
    };
  },

  async signInWithGoogleCredential(
    googleIdToken?: string | null,
    googleAccessToken?: string | null
  ): Promise<FirebaseAuthResult> {
    if (!googleIdToken && !googleAccessToken) {
      throw new Error('Token de autenticação do Google não retornado pelo provedor.');
    }

    const auth = getFirebaseAuth();
    if (auth) {
      const credential = GoogleAuthProvider.credential(
        googleIdToken || null,
        googleAccessToken || undefined
      );
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseIdToken = await userCredential.user.getIdToken();

      return {
        idToken: firebaseIdToken,
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
        name: userCredential.user.displayName || undefined,
        photoUrl: userCredential.user.photoURL || undefined,
        emailVerified: userCredential.user.emailVerified,
        provider: 'GOOGLE',
      };
    }

    if (googleIdToken) {
      return {
        idToken: googleIdToken,
        uid: '',
        email: '',
        emailVerified: true,
        provider: 'GOOGLE',
      };
    }

    throw new Error(
      'Configure EXPO_PUBLIC_FIREBASE_API_KEY no arquivo .env para finalizar a autenticação com o Firebase.'
    );
  },
};
