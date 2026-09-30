import React from 'react';
import { Text, Pressable, PressableProps } from 'react-native';
import { styles } from './PrimaryButton.styles';

interface PrimaryButtonProps extends PressableProps {
  title: string;
}

export function PrimaryButton({ title, ...rest }: PrimaryButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
      {...rest}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}