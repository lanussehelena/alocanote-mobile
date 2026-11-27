import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  containerInfo: {
    backgroundColor: '#F3E8FF',
    borderColor: '#D8B4FE',
  },
  containerSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  containerWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  containerError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  iconWrapper: {
    marginTop: 1,
    marginRight: 10,
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  textInfo: {
    color: '#4B0082',
  },
  textSuccess: {
    color: '#065F46',
  },
  textWarning: {
    color: '#92400E',
  },
  textError: {
    color: '#991B1B',
  },
  actionButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonInfo: {
    backgroundColor: '#EDE9FE',
    borderColor: '#C4B5FD',
  },
  actionButtonSuccess: {
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
  },
  actionButtonWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  actionButtonError: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  actionButtonPressed: {
    opacity: 0.75,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
    marginLeft: 6,
    borderRadius: 6,
  },
  closeButtonPressed: {
    opacity: 0.6,
  },
});
