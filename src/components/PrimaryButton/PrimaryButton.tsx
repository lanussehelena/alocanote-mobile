import React from 'react';
import { Text, Pressable, PressableProps, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { styles } from './PrimaryButton.styles';

export interface PrimaryButtonProps extends PressableProps {
  title: string;
  isLoading?: boolean;
  variant?: 'primary' | 'danger' | 'secondary' | 'outline';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  dataSet?: Record<string, any>;
  'data-cy'?: string;
}

export function PrimaryButton({
  title,
  isLoading = false,
  variant = 'primary',
  disabled,
  style,
  textStyle,
  dataSet,
  'data-cy': dataCyProp,
  testID,
  ...rest
}: PrimaryButtonProps) {
  const isButtonDisabled = disabled || isLoading;
  const cyId = dataCyProp || (dataSet?.cy as string | undefined);
  const resolvedDataSet = cyId ? { ...dataSet, cy: cyId } : dataSet;
  const resolvedTestID = testID || cyId;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.baseButton,
        styles[variant],
        pressed && styles[`${variant}Pressed`],
        isButtonDisabled && styles.buttonDisabled,
        style,
      ]}
      disabled={isButtonDisabled}
      dataSet={resolvedDataSet}
      testID={resolvedTestID}
      {...(cyId ? { 'data-cy': cyId } : {})}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? '#4B0082' : '#FFFFFF'} />
      ) : (
        <Text style={[styles.baseText, styles[`${variant}Text`], textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
}