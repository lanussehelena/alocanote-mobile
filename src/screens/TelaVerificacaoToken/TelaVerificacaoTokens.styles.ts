import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
  },
  titulo: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 32,
  },
  codigoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  campoDigito: {
    width: 46,
    height: 54,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#6B21A8',
  },
  campoDigitoPreenchido: {
    borderColor: '#7E22CE',
    backgroundColor: '#FAF5FF',
  },
  botaoReenviar: {
    paddingVertical: 10,
    marginBottom: 36,
  },
  textoReenviar: {
    color: '#6B21A8',
    fontWeight: '700',
    fontSize: 14,
  },
  botaoConfirmar: {
    width: '100%',
    height: 52,
    backgroundColor: '#4C056A',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoDesativado: {
    opacity: 0.6,
  },
  textoConfirmar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
