import axios from 'axios';
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TOKEN_STORAGE_KEY = '@alocanote:token';
export const USER_STORAGE_KEY = '@alocanote:user';

const BACKEND_PORT = '8082';
const FALLBACK_LAN_IP = '192.168.18.9';
const CLOUD_PROD_API_URL = 'https://alocanote-backend-7c5x.onrender.com';

type UnauthorizedCallback = () => void;
let onUnauthorizedCallback: UnauthorizedCallback | null = null;

export const setOnUnauthorizedCallback = (callback: UnauthorizedCallback | null) => {
  onUnauthorizedCallback = callback;
};

function decodeBase64Url(input: string): string | null {
  try {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    if (typeof globalThis.atob === 'function') {
      return globalThis.atob(padded);
    }
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = '';
    for (let bc = 0, bs = 0, buffer, i = 0; (buffer = padded.charAt(i++)); ) {
      buffer = chars.indexOf(buffer);
      if (~buffer) {
        bs = bc % 4 ? bs * 64 + buffer : buffer;
        if (bc++ % 4) {
          str += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
        }
      }
    }
    return str;
  } catch {
    return null;
  }
}

export function isJwtTokenValid(token?: string | null): boolean {
  if (!token) return false;
  const cleaned = token.trim();
  if (!cleaned || cleaned === 'null' || cleaned === 'undefined') {
    return false;
  }
  const parts = cleaned.split('.');
  if (parts.length !== 3) {
    return false;
  }
  const payloadJson = decodeBase64Url(parts[1]);
  if (!payloadJson) {
    return true;
  }
  try {
    const payload = JSON.parse(payloadJson);
    if (typeof payload?.exp === 'number') {
      // Considera expirado se já passou do horário atual (com 10s de margem)
      return payload.exp * 1000 > Date.now() + 10000;
    }
    return true;
  } catch {
    return true;
  }
}

export async function clearStoredAuthSession(): Promise<void> {
  delete api.defaults.headers.common['Authorization'];
  delete api.defaults.headers['Authorization'];
  try {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_STORAGE_KEY),
      AsyncStorage.removeItem(USER_STORAGE_KEY),
      AsyncStorage.removeItem('@AlocaNote:token'),
      AsyncStorage.removeItem('@AlocaNote:user'),
    ]);
  } catch {
    // Ignora falha de limpeza do storage
  }
}

function extractHostFromUrl(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/^(?:https?:\/\/|exp:\/\/)?([^/:?#]+)/i);
  return match?.[1] || null;
}

function isTunnelOrLocalhost(host: string): boolean {
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.exp.direct') ||
    host.endsWith('.ngrok.io') ||
    host.endsWith('.ngrok-free.app')
  );
}

function getExpoBundleHost(): string | null {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
      return window.location.hostname;
    }
    const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
    const host = extractHostFromUrl(scriptURL);
    if (host && !isTunnelOrLocalhost(host)) {
      return host;
    }
  } catch {
    // Ignora falha ao inspecionar NativeModules
  }
  return null;
}

export function resolveApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  // 1. Se a URL configurada for de produção na nuvem (HTTPS), usa diretamente sem sobrescrever por IP local
  if (envUrl && envUrl.startsWith('https://')) {
    return envUrl;
  }

  // 2. Se estiver rodando na Web em domínio de produção (ex: Vercel), usa o backend em nuvem
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    (window.location?.hostname?.endsWith('.vercel.app') || window.location?.protocol === 'https:')
  ) {
    return CLOUD_PROD_API_URL;
  }

  // 3. Se estiver rodando via Expo Go no celular/emulador na mesma rede local
  const liveExpoHost = getExpoBundleHost();
  if (liveExpoHost) {
    return `http://${liveExpoHost}:${BACKEND_PORT}`;
  }

  // 4. Se houver URL configurada no .env (ex: IP local)
  if (envUrl) {
    const normalizedPortUrl = envUrl.replace(':8081', `:${BACKEND_PORT}`);
    if (normalizedPortUrl.includes('172.20.10.3')) {
      return `http://${FALLBACK_LAN_IP}:${BACKEND_PORT}`;
    }
    return normalizedPortUrl;
  }

  // 5. IP fallback padrão
  return `http://${FALLBACK_LAN_IP}:${BACKEND_PORT}`;
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  config.baseURL = resolveApiBaseUrl();
  try {
    const token =
      (await AsyncStorage.getItem(TOKEN_STORAGE_KEY)) ||
      (await AsyncStorage.getItem('@AlocaNote:token'));
    if (token && isJwtTokenValid(token) && config.headers) {
      config.headers.Authorization = `Bearer ${token.trim()}`;
    } else if (token && !isJwtTokenValid(token)) {
      await clearStoredAuthSession();
    }
  } catch (error) {
    console.error('Erro ao recuperar token do storage:', error);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const requestUrl: string = error?.config?.url || '';
    const isPublicAuthRoute =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/firebase') ||
      requestUrl.includes('/auth/google');

    if (status === 401 && !isPublicAuthRoute) {
      await clearStoredAuthSession();
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    return Promise.reject(error);
  }
);

export const setAuthToken = (token?: string | null) => {
  if (token && isJwtTokenValid(token)) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token.trim()}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export function isUnauthorizedError(error: any): boolean {
  return error?.response?.status === 401;
}

export function getApiErrorMessage(error: any, fallbackMessage = 'Ocorreu um erro inesperado.'): string {
  if (error?.response?.status === 401) {
    return 'Sua sessão expirou. Por favor, faça login novamente.';
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('Network Error')) {
    return `Não foi possível conectar ao servidor (${resolveApiBaseUrl()}). Verifique se o backend está rodando e na mesma rede Wi-Fi.`;
  }
  if (error?.message) {
    return error.message;
  }
  return fallbackMessage;
}
