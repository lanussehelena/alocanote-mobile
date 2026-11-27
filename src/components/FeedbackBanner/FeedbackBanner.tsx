import React from 'react';
import { View, Text, Pressable, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './FeedbackBanner.styles';

export type FeedbackType = 'info' | 'success' | 'warning' | 'error';

export interface FeedbackState {
  type: FeedbackType;
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface FeedbackBannerProps {
  feedback: FeedbackState | null;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
}

const ICON_BY_TYPE: Record<FeedbackType, keyof typeof Ionicons.glyphMap> = {
  info: 'information-circle-outline',
  success: 'checkmark-circle-outline',
  warning: 'alert-circle-outline',
  error: 'close-circle-outline',
};

const ICON_COLOR_BY_TYPE: Record<FeedbackType, string> = {
  info: '#4B0082',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
};

export function FeedbackBanner({ feedback, onDismiss, style }: FeedbackBannerProps) {
  if (!feedback) {
    return null;
  }

  const { type, title, message, actionLabel, onAction } = feedback;

  const containerToneStyle =
    type === 'success'
      ? styles.containerSuccess
      : type === 'warning'
        ? styles.containerWarning
        : type === 'error'
          ? styles.containerError
          : styles.containerInfo;

  const textToneStyle =
    type === 'success'
      ? styles.textSuccess
      : type === 'warning'
        ? styles.textWarning
        : type === 'error'
          ? styles.textError
          : styles.textInfo;

  const actionToneStyle =
    type === 'success'
      ? styles.actionButtonSuccess
      : type === 'warning'
        ? styles.actionButtonWarning
        : type === 'error'
          ? styles.actionButtonError
          : styles.actionButtonInfo;

  return (
    <View style={[styles.container, containerToneStyle, style]} accessibilityRole="alert">
      <View style={styles.iconWrapper}>
        <Ionicons name={ICON_BY_TYPE[type]} size={20} color={ICON_COLOR_BY_TYPE[type]} />
      </View>

      <View style={styles.textWrapper}>
        {title ? <Text style={[styles.title, textToneStyle]}>{title}</Text> : null}
        <Text style={[styles.message, textToneStyle]}>{message}</Text>

        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            style={({ pressed }) => [
              styles.actionButton,
              actionToneStyle,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <Text style={[styles.actionButtonText, textToneStyle]}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>

      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          hitSlop={8}
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          accessibilityLabel="Fechar aviso"
        >
          <Ionicons name="close" size={18} color={ICON_COLOR_BY_TYPE[type]} />
        </Pressable>
      ) : null}
    </View>
  );
}
