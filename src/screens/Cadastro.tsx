import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { Picker } from '@react-native-picker/picker';

export function Cadastro() {
  const navigation = useNavigation<any>();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [funcao, setFuncao] = useState('CONSULTOR_VENDAS');
  const [isLoading, setIsLoading] = useState(false);

  const handleCadastro = async () => {
    if (!nome || !email || !senha || !telefone) {
      Alert.alert('Campos obrigatórios', 'Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/users/register', { 
        name: nome,
        email: email,
        password: senha,
        phone: telefone,
        role: funcao, 
      });

      Alert.alert('Sucesso', 'Conta criada com sucesso!');
      navigation.navigate('Login');

    } catch (error: any) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível realizar o cadastro. Verifique os dados.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar Conta</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome Completo"
        value={nome}
        onChangeText={setNome}
      />

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Telefone"
        value={telefone}
        onChangeText={setTelefone}
        keyboardType="phone-pad"
      />

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Cargo:</Text>
        <Picker
          selectedValue={funcao}
          onValueChange={(itemValue) => setFuncao(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Consultor de Vendas" value="CONSULTOR_VENDAS" />
          <Picker.Item label="Projetista" value="PROJETISTA" />
          <Picker.Item label="Administrador" value="ADMINISTRADOR" />
          <Picker.Item label="Conferente" value="CONFERENTE" />
          <Picker.Item label="Outros" value="OUTROS" />
        </Picker>
      </View>

      <Pressable 
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed
        ]}
        onPress={handleCadastro} 
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Cadastrar</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#F5F5F5',
  },
  button: {
    backgroundColor: '#4B0082',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
    backgroundColor: '#3A0066',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 15,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    overflow: 'hidden',
  },
  pickerLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 12,
    marginTop: 8,
  },
  picker: {
    height: 50,
    width: '100%',
  }
});