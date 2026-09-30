import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Alert, 
  Image, 
  Pressable, 
  ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { styles } from './Login.styles';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<any>();
  const { signIn } = useAuth();
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos obrigatórios', 'Por favor, preencha o email e a senha.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { 
        email: email, 
        password: password 
      });

      const { token, name, email: userEmail, role } = response.data;
      
      await signIn(token, { name, email: userEmail, role });
      
      Alert.alert('Sucesso', 'Login efetuado com sucesso!');

    } catch (error) {
      console.error(error);
      Alert.alert(
        'Erro na Autenticação', 
        'Credenciais inválidas ou não foi possível contactar o servidor.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image 
        source={require('../../../assets/logo.png')} 
        style={styles.logo} 
        resizeMode="contain" 
      />

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email ou Usuário</Text>
        <TextInput 
          style={styles.input}
          placeholder="Seu email ou usuário"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput 
          style={styles.input}
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <Pressable 
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </Pressable>

      <Pressable 
        onPress={() => navigation.navigate('Cadastro')}
        style={({ pressed }) => [
          pressed && { opacity: 0.6 }
        ]}
      >
        <Text style={styles.registerText}>Não tem conta? Cadastre-se</Text>
      </Pressable>
    </SafeAreaView>
  );
}
