import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  AppState,
  AppStateStatus,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getApiErrorMessage } from '../../services/api';
import { authService, isEmailNotVerifiedError } from '../../services/authService';
import { AuthStackParamList } from '../../types/navigation';
import { PrimaryButton } from '../../components/PrimaryButton/PrimaryButton';
import { styles } from './VerificarEmail.styles';

type VerificarEmailNavProp = NativeStackNavigationProp<AuthStackParamList, 'VerificarEmail'>;
type VerificarEmailRouteProp = RouteProp<AuthStackParamList, 'VerificarEmail'>;

type FeedbackTone = 'info' | 'success' | 'warning' | 'error';

interface FeedbackState {
  tone: FeedbackTone;
  message: string;
}

const RESEND_COOLDOWN_SECONDS = 60;

export function VerificarEmail() {
  const navigation = useNavigation<VerificarEmailNavProp>();
  const route = useRoute<VerificarEmailRouteProp>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const { completeEmailVerificationSignIn } = useAuth();

  const email = route.params?.email?.trim().toLowerCase() || '';
  const password = route.params?.password;
  const verificationEmailSent = route.params?.verificationEmailSent;
  const firebaseConfigured = authService.isFirebaseConfigured();

  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState<number>(verificationEmailSent ? RESEND_COOLDOWN_SECONDS : 0);
  const [feedback, setFeedback] = useState<FeedbackState | null>(() => {
    if (!firebaseConfigured) {
      return {
        tone: 'warning',
        message:
          'O envio automático do link depende das variáveis EXPO_PUBLIC_FIREBASE_* configuradas no ambiente.',
      };
    }
    if (verificationEmailSent) {
      return {
        tone: 'success',
        message:
          'Link de verificação enviado! Confira sua caixa de entrada e também a pasta de spam.',
      };
    }
    return null;
  });

  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleCheckVerification = useCallback(
    async (silent = false) => {
      if (isCheckingRef.current || !email) {
        return;
      }

      isCheckingRef.current = true;
      if (!silent) {
        setIsChecking(true);
        setFeedback(null);
      }

      try {
        await completeEmailVerificationSignIn({ email, password });
      } catch (error) {
        if (silent) {
          return;
        }
        if (isEmailNotVerifiedError(error)) {
          setFeedback({
            tone: 'warning',
            message: error.message,
          });
        } else {
          setFeedback({
            tone: 'error',
            message: getApiErrorMessage(
              error,
              'Não foi possível verificar o status do seu e-mail. Tente novamente.'
            ),
          });
        }
      } finally {
        isCheckingRef.current = false;
        if (!silent) {
          setIsChecking(false);
        }
      }
    },
    [completeEmailVerificationSignIn, email, password]
  );

  // Ao retornar do aplicativo de e-mail para o AlocaNote, verifica automaticamente se já foi confirmado
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && firebaseConfigured) {
        handleCheckVerification(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [firebaseConfigured, handleCheckVerification]);

  const handleResendEmail = async () => {
    if (cooldown > 0 || isResending || !email) {
      return;
    }

    setIsResending(true);
    setFeedback(null);

    try {
      const result = await authService.resendVerificationEmail({ email, password });
      if (result.alreadyVerified) {
        setFeedback({
          tone: 'success',
          message: 'Seu e-mail já foi confirmado! Liberando seu acesso...',
        });
        await handleCheckVerification(false);
        return;
      }

      setCooldown(RESEND_COOLDOWN_SECONDS);
      setFeedback({
        tone: 'success',
        message:
          'Novo link de verificação enviado! Verifique sua caixa de entrada e a pasta de spam.',
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: getApiErrorMessage(
          error,
          'Não foi possível reenviar o e-mail de verificação. Tente novamente.'
        ),
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = async () => {
    await authService.signOutFirebase();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login', params: { email } }],
    });
  };

  const getFeedbackIcon = (tone: FeedbackTone): keyof typeof Ionicons.glyphMap => {
    if (tone === 'success') return 'checkmark-circle-outline';
    if (tone === 'warning') return 'alert-circle-outline';
    if (tone === 'error') return 'close-circle-outline';
    return 'information-circle-outline';
  };

  const getFeedbackIconColor = (tone: FeedbackTone): string => {
    if (tone === 'success') return '#059669';
    if (tone === 'warning') return '#D97706';
    if (tone === 'error') return '#DC2626';
    return '#4B0082';
  };

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 20, 28),
            paddingBottom: Math.max(insets.bottom + 24, 28),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contentBox, isDesktop && styles.contentBoxDesktop]}>
          <View style={styles.iconBadge}>
            <Ionicons name="mail-unread-outline" size={42} color="#4B0082" />
          </View>

          <Text style={styles.title}>Verifique seu e-mail</Text>

          <Text style={styles.subtitle}>
            Para proteger sua conta, o acesso ao AlocaNote só é liberado após confirmar o endereço abaixo:
          </Text>

          <View style={styles.emailPill}>
            <Text style={styles.emailPillText}>{email || 'E-mail cadastrado'}</Text>
          </View>

          <View style={styles.instructionsCard}>
            <View style={styles.instructionsHeader}>
              <Ionicons name="lock-closed-outline" size={18} color="#4B0082" />
              <Text style={styles.instructionsTitle}>Entrada bloqueada até a confirmação</Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Abra sua caixa de entrada e procure o e-mail de verificação (confira também{' '}
                <Text style={styles.stepTextBold}>Spam</Text> ou{' '}
                <Text style={styles.stepTextBold}>Lixo eletrônico</Text>).
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Toque no <Text style={styles.stepTextBold}>link de confirmação</Text> enviado pelo Firebase.
              </Text>
            </View>

            <View style={[styles.stepRow, { marginBottom: 0 }]}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Volte para esta tela e toque em{' '}
                <Text style={styles.stepTextBold}>Já verifiquei meu e-mail</Text>.
              </Text>
            </View>
          </View>

          {feedback && (
            <View
              style={[
                styles.feedbackBox,
                feedback.tone === 'info' && styles.feedbackInfo,
                feedback.tone === 'success' && styles.feedbackSuccess,
                feedback.tone === 'warning' && styles.feedbackWarning,
                feedback.tone === 'error' && styles.feedbackError,
              ]}
            >
              <Ionicons
                name={getFeedbackIcon(feedback.tone)}
                size={20}
                color={getFeedbackIconColor(feedback.tone)}
              />
              <Text
                style={[
                  styles.feedbackText,
                  feedback.tone === 'info' && styles.feedbackTextInfo,
                  feedback.tone === 'success' && styles.feedbackTextSuccess,
                  feedback.tone === 'warning' && styles.feedbackTextWarning,
                  feedback.tone === 'error' && styles.feedbackTextError,
                ]}
              >
                {feedback.message}
              </Text>
            </View>
          )}

          <PrimaryButton
            title="Já verifiquei meu e-mail"
            onPress={() => handleCheckVerification(false)}
            isLoading={isChecking}
            disabled={isResending}
          />

          <PrimaryButton
            title={
              cooldown > 0
                ? `Reenviar e-mail (${cooldown}s)`
                : 'Reenviar e-mail de verificação'
            }
            variant="outline"
            onPress={handleResendEmail}
            isLoading={isResending}
            disabled={cooldown > 0 || isChecking}
            style={styles.resendButton}
          />

          <Pressable
            onPress={handleBackToLogin}
            style={({ pressed }) => [
              styles.backPressable,
              pressed && styles.backPressablePressed,
            ]}
          >
            <Text style={styles.backText}>Voltar para o Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
