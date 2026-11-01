import axios from 'axios';
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TOKEN_STORAGE_KEY = '@alocanote:token';
export const USER_STORAGE_KEY = '@alocanote:user';

const BACKEND_PORT = '8082';
const FALLBACK_LAN_IP = '192.168.18.9';

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

  // 2. Se estiver rodando via Expo Go no celular/emulador na mesma rede local
  const liveExpoHost = getExpoBundleHost();
  if (liveExpoHost) {
    return `http://${liveExpoHost}:${BACKEND_PORT}`;
  }

  // 3. Se houver URL configurada no .env (ex: IP local)
  if (envUrl) {
    const normalizedPortUrl = envUrl.replace(':8081', `:${BACKEND_PORT}`);
    if (normalizedPortUrl.includes('172.20.10.3')) {
      return `http://${FALLBACK_LAN_IP}:${BACKEND_PORT}`;
    }
    return normalizedPortUrl;
  }

  // 4. IP fallback padrão
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
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Erro ao recuperar token do storage:', error);
  }
  return config;
});

export const setAuthToken = (token?: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export function getApiErrorMessage(error: any, fallbackMessage = 'Ocorreu um erro inesperado.'): string {
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
