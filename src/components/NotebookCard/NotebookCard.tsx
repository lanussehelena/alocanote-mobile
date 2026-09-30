import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Notebook } from '../../types';
import { styles } from './NotebookCard.styles';

interface NotebookCardProps {
  notebook: Notebook;
  onAgendar: (notebook: number) => void;
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
            <View
              style={[
                styles.statusIndicator,
                isAvailable ? styles.bgGreen : styles.bgRed,
              ]}
            />
            <Text
              style={[
                styles.statusText,
                isAvailable ? styles.textGreen : styles.textRed,
              ]}
            >
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
          !isAvailable && styles.buttonDisabled,
        ]}
        onPress={() => onAgendar(notebook.id)}
        disabled={!isAvailable}
      >
        <Text style={styles.buttonText}>Agendar</Text>
      </Pressable>
    </View>
  );
}