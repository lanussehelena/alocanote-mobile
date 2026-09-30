import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../../services/api';
import { styles } from './TelaVerificacaoTokens.styles';
import { SafeAreaView } from 'react-native-safe-area-context';

export function TelaVerificacaoToken() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Recebe o telefone vindo do Cadastro
  const telefone = route.params?.telefone || '';

  const [codigo, setCodigo] = useState<string[]>(['', '', '', '', '', '']);
  const [carregando, setCarregando] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  const inputsRef = useRef<Array<TextInput | null>>([]);

  const formatarTelefoneExibicao = (num: string) => {
    if (!num) return '';
    const limpo = num.replace(/\D/g, '');
    if (limpo.length >= 12) {
      const ddi = limpo.slice(0, 2);
      const ddd = limpo.slice(2, 4);
      const p1 = limpo.slice(4, 9);
      const p2 = limpo.slice(9);
      return `+${ddi} (${ddd}) ${p1}-${p2}`;
    }
    return num;
  };

  const lidarMudancaDigito = (texto: string, indice: number) => {
    const apenasNumero = texto.replace(/\D/g, '');
    const novoCodigo = [...codigo];
    novoCodigo[indice] = apenasNumero;
    setCodigo(novoCodigo);

    if (apenasNumero && indice < 5) {
      inputsRef.current[indice + 1]?.focus();
    }
  };

  const lidarPressionarTecla = (e: any, indice: number) => {
    if (e.nativeEvent.key === 'Backspace' && !codigo[indice] && indice > 0) {
      inputsRef.current[indice - 1]?.focus();
    }
  };

  const handleConfirmar = async () => {
    const tokenCompleto = codigo.join('');

    if (tokenCompleto.length < 6) {
      Alert.alert('Atenção', 'Digite o código de 6 dígitos completo.');
      return;
    }

    setCarregando(true);

    try {
      // POST para o endpoint implementado no AuthController
      const resposta = await api.post('/auth/verify-sms', {
        phone: telefone,
        code: tokenCompleto,
      });

      if (resposta.status === 200) {
        Alert.alert('Sucesso', 'Token validado com sucesso!', [
          {
            text: 'Ir para o Login',
            onPress: () => navigation.navigate('Login'),
          },
        ]);
      }
    } catch (erro: any) {
      const mensagem =
        erro?.response?.data?.message || 'Código incorreto ou expirado. Tente novamente.';
      Alert.alert('Falha na Validação', mensagem);
    } finally {
      setCarregando(false);
    }
  };

  const handleReenviarCodigo = async () => {
    setReenviando(true);
    try {
      await api.post('/auth/send-sms', { phone: telefone });
      
      Alert.alert('Enviado', 'Um novo código foi enviado por SMS.');
    } catch (erro: any) {
      const mensagem =
        erro?.response?.data?.message || 'Não foi possível reenviar o SMS no momento.';
      Alert.alert('Erro ao Reenviar', mensagem);
    } finally {
      setReenviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.innerContainer}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.titulo}>Verificação{'\n'}de Token</Text>
        <Text style={styles.subtitulo}>
          Digite o código de 6 dígitos enviado por SMS
          {telefone ? (
            <>
              {'\n'}para{' '}
              <Text style={{ fontWeight: '700', color: '#6B21A8' }}>
                {formatarTelefoneExibicao(telefone)}
              </Text>
            </>
          ) : null}
        </Text>

        <View style={styles.codigoContainer}>
          {codigo.map((digito, indice) => (
            <TextInput
              key={indice}
              ref={(ref) => {
                inputsRef.current[indice] = ref;
              }}
              style={[
                styles.campoDigito,
                digito ? styles.campoDigitoPreenchido : null,
              ]}
              keyboardType="number-pad"
              maxLength={1}
              value={digito}
              placeholder="-"
              placeholderTextColor="#9CA3AF"
              onChangeText={(texto) => lidarMudancaDigito(texto, indice)}
              onKeyPress={(e) => lidarPressionarTecla(e, indice)}
            />
          ))}
        </View>

        <Pressable
          onPress={handleReenviarCodigo}
          style={({ pressed }) => [styles.botaoReenviar, pressed && { opacity: 0.6 }]}
          disabled={reenviando}
        >
          {reenviando ? (
            <ActivityIndicator size="small" color="#6B21A8" />
          ) : (
            <Text style={styles.textoReenviar}>Reenviar Código</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.botaoConfirmar,
            carregando && styles.botaoDesativado,
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleConfirmar}
          disabled={carregando}
        >
          {carregando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.textoConfirmar}>Confirmar</Text>
          )}
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
