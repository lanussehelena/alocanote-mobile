import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  Pressable,
  ActivityIndicator,
  Modal,
  FlatList,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { PAISES, Pais } from '../constants/paises';
import { SeletorPais } from '../components/SeletorPais';
import { styles } from './Cadastro.style';
import { SafeAreaView } from 'react-native-safe-area-context';

const CARGOS = [
  { chave: 'PROJETISTA', rotulo: 'Projetista' },
  { chave: 'CONFERENTE', rotulo: 'Conferente' },
  { chave: 'CONSULTOR_VENDAS', rotulo: 'Consultor de Vendas' },
  { chave: 'OUTROS', rotulo: 'Outros' },
];

export function Cadastro() {
  const navigation = useNavigation<any>();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [paisSelecionado, setPaisSelecionado] = useState<Pais>(PAISES[0]);
  
  const [cargoSelecionado, setCargoSelecionado] = useState(CARGOS[1]);
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
    const telefoneLimpo = telefone.replace(/\D/g, '');

    if (!nome.trim() || !email.trim() || !senha.trim() || !telefoneLimpo) {
      Alert.alert('Campos obrigatórios', 'Por favor, preencha todos os campos.');
      return;
    }

    if (cargoSelecionado.chave === 'OUTROS' && !outroCargo.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, digite qual é o seu cargo.');
      return;
    }

    setIsLoading(true);

    const ddiLimpo = paisSelecionado.ddi.replace('+', '');
    const telefoneCompleto = `${ddiLimpo}${telefoneLimpo}`;

    try {
      await api.post('/users/register', {
        name: nome,
        email: email,
        password: senha,
        phone: telefoneCompleto,
        role: cargoSelecionado.chave,
        otherRoleDescription: cargoSelecionado.chave === 'OUTROS' ? outroCargo.trim() : null,
      });

      navigation.navigate('VerificacaoToken', { telefone: telefoneCompleto });
    } catch (error: any) {
      const mensagem = error?.response?.data?.message || 'Não foi possível realizar o cadastro.';
      Alert.alert('Erro', mensagem);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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
            keyboardType="email-address"
          />
        </View>

        <View style={styles.blocoCampo}>
          <Text style={styles.labelCampo}>Senha</Text>
          <TextInput
            style={styles.inputLilas}
            placeholder="Digite sua senha"
            placeholderTextColor="#7E758C"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
          />
        </View>

        <View style={styles.blocoCampo}>
          <Text style={styles.labelCampo}>Telefone</Text>
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
          <TouchableOpacity
            style={styles.selectCargo}
            activeOpacity={0.7}
            onPress={() => setModalCargoVisivel(true)}
          >
            <Text style={styles.textoCargo}>{cargoSelecionado.rotulo}</Text>
            <Text style={styles.seta}>▼</Text>
          </TouchableOpacity>

          {cargoSelecionado.chave === 'OUTROS' && (
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

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleCadastro}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Cadastrar</Text>
          )}
        </Pressable>

        <Modal
          visible={modalCargoVisivel}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalCargoVisivel(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalCargoVisivel(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitulo}>Selecione o Cargo</Text>
              <FlatList
                data={CARGOS}
                keyExtractor={(item) => item.chave}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.itemOpcao,
                      item.chave === cargoSelecionado.chave && styles.itemOpcaoAtiva,
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
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}