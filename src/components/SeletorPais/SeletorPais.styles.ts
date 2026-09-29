import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  ddiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingRight: 6,
  },
  bandeira: {
    fontSize: 18,
    marginRight: 4,
  },
  seta: {
    fontSize: 10,
    color: '#374151',
    marginRight: 8,
  },
  divisor: {
    width: 1,
    height: 22,
    backgroundColor: '#7E22CE',
    marginRight: 8,
  },
  prefixo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    maxHeight: 380,
  },
  modalTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  itemOpcao: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemOpcaoAtiva: {
    backgroundColor: '#FAF5FF',
    borderRadius: 8,
  },
  bandeiraItem: {
    fontSize: 22,
    marginRight: 10,
  },
  nomeItem: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  ddiItem: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7E22CE',
  },
});