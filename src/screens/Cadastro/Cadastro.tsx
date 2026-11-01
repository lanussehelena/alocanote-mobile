import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  Pressable,
  Modal,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { getApiErrorMessage } from '../../services/api';
import { Role } from '../../types';
import { AuthStackParamList } from '../../types/navigation';
import { PAISES, Pais } from '../../constants/paises';
import { SeletorPais } from '../../components/SeletorPais/SeletorPais';
import { PrimaryButton } from '../../components/PrimaryButton/PrimaryButton';
import { styles } from './Cadastro.styles';

interface CargoItem {
  chave: Role;
  rotulo: string;
}

const CARGOS: CargoItem[] = [
  { chave: Role.PROJETISTA, rotulo: 'Projetista' },
  { chave: Role.CONFERENTE, rotulo: 'Conferente' },
  { chave: Role.CONSULTOR_VENDAS, rotulo: 'Consultor de Vendas' },
  { chave: Role.OUTROS, rotulo: 'Outros' },
];

type CadastroNavProp = NativeStackNavigationProp<AuthStackParamList, 'Cadastro'>;

export function Cadastro() {
  const navigation = useNavigation<CadastroNavProp>();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [confirmarEmail, setConfirmarEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [telefone, setTelefone] = useState('');
  const [paisSelecionado, setPaisSelecionado] = useState<Pais>(PAISES[0]);

  const [cargoSelecionado, setCargoSelecionado] = useState<CargoItem>(CARGOS[0]);
  const [modalCargoVisivel, setModalCargoVisivel] = useState(false);
  const [outroCargo, setOutroCargo] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const aplicarMascaraTelefone = (valor: string) => {
    let apenasNumeros = valor.replace(/\D/g, '');
    if (apenasNumeros.length > 11) apenasNumeros = apenasNumeros.substring(0, 11);

    let formatado = apenasNumeros;
    if (apenasNumeros.length > 2) formatado = `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(2)}`;
    if (apenasNumeros.length > 7) formatado = `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(2, 7)}-${apenasNumeros.substring(7, 11)}`;

    setTelefone(formatado);
  };

  const handleCadastro = async () => {
    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();
    const confirmarEmailLimpo = confirmarEmail.trim().toLowerCase();
    const senhaLimpa = senha.trim();

    if (!nomeLimpo || !emailLimpo || !confirmarEmailLimpo || !senhaLimpa) {
      Alert.alert('Campos obrigatórios', 'Por favor, preencha nome, e-mail, confirmação de e-mail e senha.');
      return;
    }

    if (emailLimpo !== confirmarEmailLimpo) {
      Alert.alert('E-mails não coincidem', 'O e-mail digitado e a confirmação de e-mail devem ser iguais.');
      return;
    }

    if (cargoSelecionado.chave === Role.OUTROS && !outroCargo.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, digite qual é o seu cargo.');
      return;
    }

    setIsLoading(true);

    const telefoneLimpo = telefone.replace(/\D/g, '');
    const ddiLimpo = paisSelecionado.ddi.replace('+', '');
    const telefoneCompleto = telefoneLimpo ? `${ddiLimpo}${telefoneLimpo}` : undefined;

    try {
      await authService.register({
        name: nomeLimpo,
        email: emailLimpo,
        password: senhaLimpa,
        phone: telefoneCompleto,
        role: cargoSelecionado.chave,
        customRole: cargoSelecionado.chave === Role.OUTROS ? outroCargo.trim() : null,
      });

      if (Platform.OS === 'web') {
        window.alert('Conta criada com sucesso! Redirecionando...');
        try {
          await signIn({ email: emailLimpo, password: senhaLimpa });
        } catch {
          navigation.navigate('Login', { email: emailLimpo });
        }
        return;
      }

      Alert.alert(
        'Conta Criada com Sucesso!',
        'Seu cadastro foi realizado. Um e-mail de confirmação foi enviado para o seu endereço.',
        [
          {
            text: 'Entrar agora',
            onPress: async () => {
              try {
                await signIn({ email: emailLimpo, password: senhaLimpa });
              } catch {
                navigation.navigate('Login', { email: emailLimpo });
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Erro ao cadastrar usuário:', error);
      const mensagem = getApiErrorMessage(error, 'Não foi possível realizar o cadastro.');
      Alert.alert('Erro no Cadastro', mensagem);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Criar Conta</Text>

        <View style={styles.blocoCampo}>
          <Text style={styles.labelCampo}>Nome Completo</Text>
          <TextInput
            style={styles.inputLilas}
            placeholder="Digite seu nome completo"
            placeholderTextColor="#7E758C"
            value={nome}
            onChangeText={setNome}
          />
        </View>

        <View style={styles.blocoCampo}>
          <Text style={styles.labelCampo}>E-mail</Text>
          <TextInput
            style={styles.inputLilas}
            placeholder="Digite seu e-mail"
            placeholderTextColor="#7E758C"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </View>

        <View style={styles.blocoCampo}>
          <Text style={styles.labelCampo}>Confirmar E-mail</Text>
          <TextInput
            style={styles.inputLilas}
            placeholder="Confirme o seu e-mail"
            placeholderTextColor="#7E758C"
            value={confirmarEmail}
            onChangeText={setConfirmarEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </View>

        <View style={styles.blocoCampo}>
          <Text style={styles.labelCampo}>Senha</Text>
          <View style={styles.senhaContainer}>
            <TextInput
              style={styles.senhaInput}
              placeholder="Digite sua senha"
              placeholderTextColor="#7E758C"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!mostrarSenha}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={() => setMostrarSenha((prev) => !prev)}
              style={styles.botaoOlho}
              hitSlop={8}
            >
              <Ionicons
                name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#4B0082"
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.blocoCampo}>
          <Text style={styles.labelCampo}>Telefone (opcional)</Text>
          <View style={styles.telefoneContainer}>
            <SeletorPais
              paisSelecionado={paisSelecionado}
              onSelecionarPais={setPaisSelecionado}
            />
            <TextInput
              style={styles.telefoneInput}
              placeholder="(  ) "
              placeholderTextColor="#7E758C"
              keyboardType="phone-pad"
              value={telefone}
              onChangeText={aplicarMascaraTelefone}
              maxLength={15}
            />
          </View>
        </View>

        <View style={styles.blocoCampo}>
          <Text style={styles.labelCampo}>Cargo</Text>
          <Pressable
            style={({ pressed }) => [styles.selectCargo, pressed && styles.selectCargoPressed]}
            onPress={() => setModalCargoVisivel(true)}
          >
            <Text style={styles.textoCargo}>{cargoSelecionado.rotulo}</Text>
            <Text style={styles.seta}>▼</Text>
          </Pressable>

          {cargoSelecionado.chave === Role.OUTROS && (
            <TextInput
              style={[styles.inputLilas, styles.inputOutroCargo]}
              placeholder="Digite o seu cargo"
              placeholderTextColor="#7E758C"
              value={outroCargo}
              onChangeText={setOutroCargo}
              autoFocus
            />
          )}
        </View>

        <PrimaryButton
          title="Cadastrar"
          onPress={handleCadastro}
          isLoading={isLoading}
        />

        <Pressable
          onPress={() => navigation.navigate('Login')}
          style={({ pressed }) => [
            styles.loginPressable,
            pressed && styles.loginPressed,
          ]}
        >
          <Text style={styles.loginText}>
            Já tem conta? <Text style={styles.loginLink}>Faça Login</Text>
          </Text>
        </Pressable>

        <Modal
          visible={modalCargoVisivel}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalCargoVisivel(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setModalCargoVisivel(false)}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitulo}>Selecione o Cargo</Text>
              <FlatList
                data={CARGOS}
                keyExtractor={(item) => item.chave}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [
                      styles.itemOpcao,
                      item.chave === cargoSelecionado.chave && styles.itemOpcaoAtiva,
                      pressed && styles.itemOpcaoPressed,
                    ]}
                    onPress={() => {
                      setCargoSelecionado(item);
                      setModalCargoVisivel(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.textoOpcao,
                        item.chave === cargoSelecionado.chave && styles.textoOpcaoAtiva,
                      ]}
                    >
                      {item.rotulo}
                    </Text>
                  </Pressable>
                )}
              />
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
