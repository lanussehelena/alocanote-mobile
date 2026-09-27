// src/components/NotebookCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Notebook } from '../types';

interface NotebookCardProps {
  notebook: Notebook;
  onAgendar: (notebookId: number) => void;
}

export function NotebookCard({ notebook, onAgendar }: NotebookCardProps) {
  const isAvailable = notebook.status === 'DISPONIVEL';

  return (
    <View style={styles.cardContainer}>
      <View style={styles.infoContainer}>

        <View style={styles.iconPlaceholder} />
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{notebook.name}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, isAvailable ? styles.bgGreen : styles.bgRed]} />
            <Text style={[styles.statusText, isAvailable ? styles.textGreen : styles.textRed]}>
              {isAvailable ? 'Disponível' : 'Em uso'}
            </Text>
          </View>
        </View>

      
        {!isAvailable && notebook.currentUser && (
          <View style={styles.userContainer}>
            <Text style={styles.userName} numberOfLines={1}>
              {notebook.currentUser.name}
            </Text>
          </View>
        )}
      </View>

      <Pressable 
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          !isAvailable && styles.buttonDisabled
        ]}
        onPress={() => onAgendar(notebook.id)}
        disabled={!isAvailable}
      >
        <Text style={styles.buttonText}>Agendar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bgGreen: { backgroundColor: '#4CAF50' },
  bgRed: { backgroundColor: '#F44336' },
  textGreen: { color: '#4CAF50' },
  textRed: { color: '#F44336' },
  userContainer: {
    alignItems: 'flex-end',
    maxWidth: 80,
  },
  userName: {
    fontSize: 12,
    color: '#666',
  },
  button: {
    backgroundColor: '#4B0082', // Roxo do AlocaNote
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: '#3A0066',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  }
});