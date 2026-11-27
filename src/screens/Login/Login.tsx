import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getApiErrorMessage, wakeUpBackend } from '../../services/api';
import { isEmailNotVerifiedError } from '../../services/authService';
import { AuthStackParamList } from '../../types/navigation';
import { PrimaryButton } from '../../components/PrimaryButton/PrimaryButton';
import { FeedbackBanner, FeedbackState } from '../../components/FeedbackBanner/FeedbackBanner';
import { styles } from './Login.styles';

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;
type LoginRouteProp = RouteProp<AuthStackParamList, 'Login'>;

export function Login() {
  const route = useRoute<LoginRouteProp>();
  const [email, setEmail] = useState(route.params?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const { signIn } = useAuth();
  const navigation = useNavigation<LoginNavProp>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  useEffect(() => {
    wakeUpBackend();
  }, []);

  useEffect(() => {
    if (route.params?.email) {
      setEmail(route.params.email);
    }
  }, [route.params?.email]);

  const handleLogin = async () => {
    const emailLimpo = email.trim().toLowerCase();
    setFeedback(null);

    if (!emailLimpo || !password) {
      setFeedback({
        type: 'warning',
        title: 'Campos obrigatórios',
        message: 'Por favor, preencha o e-mail e a senha.',
      });
      return;
    }

    if (!emailLimpo.includes('@') || !emailLimpo.includes('.')) {
      setFeedback({
        type: 'warning',
        title: 'E-mail inválido',
        message: 'Digite um endereço de e-mail válido para continuar.',
      });
      return;
    }

    setIsLoading(true);

    try {
      await signIn({
        email: emailLimpo,
        password,
      });
    } catch (error) {
      if (isEmailNotVerifiedError(error)) {
        navigation.navigate('VerificarEmail', {
          email: emailLimpo,
          password,
        });
        return;
      }
      console.error('Erro no login:', error);
      const mensagem = getApiErrorMessage(
        error,
        'Credenciais inválidas ou não foi possível conectar ao servidor.'
      );
      setFeedback({
        type: 'error',
        title: 'Erro na autenticação',
        message: mensagem,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDesktop && styles.containerDesktop]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contentBox, isDesktop && styles.contentBoxDesktop]}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.inputContainer}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu e-mail cadastrado"
              placeholderTextColor="#7E758C"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (feedback) setFeedback(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            <Text style={styles.label}>Senha</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Sua senha de acesso"
                placeholderTextColor="#7E758C"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (feedback) setFeedback(null);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.eyeButton}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#4B0082"
                />
              </Pressable>
            </View>
          </View>

          <FeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />

          <PrimaryButton
            title="Entrar"
            onPress={handleLogin}
            isLoading={isLoading}
          />

          <Pressable
            onPress={() => navigation.navigate('Cadastro')}
            style={({ pressed }) => [
              styles.registerPressable,
              pressed && styles.registerPressed,
            ]}
          >
            <Text style={styles.registerText}>
              Não tem conta? <Text style={styles.registerLink}>Cadastre-se</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
