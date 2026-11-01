import { registerRootComponent } from 'expo';
import { Platform, Alert } from 'react-native';

// Polyfill do Alert.alert para React Native Web (onde por padrão é uma função vazia)
if (Platform.OS === 'web') {
  Alert.alert = (
    title: string,
    message?: string,
    buttons?: Array<{ text?: string; onPress?: () => void; style?: string }>
  ) => {
    const text = [title, message].filter(Boolean).join('\n\n');
    if (!buttons || buttons.length <= 1) {
      if (text) {
        window.alert(text);
      }
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    } else {
      const confirmed = window.confirm(text);
      if (confirmed) {
        const confirmBtn = buttons.find((b) => b.style !== 'cancel') || buttons[1];
        confirmBtn?.onPress?.();
      } else {
        const cancelBtn = buttons.find((b) => b.style === 'cancel') || buttons[0];
        cancelBtn?.onPress?.();
      }
    }
  };
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
