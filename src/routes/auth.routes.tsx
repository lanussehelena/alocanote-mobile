import React from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Login } from '../screens/Login';
import { Cadastro } from '../screens/Cadastro';
import { TelaVerificacaoToken } from '../screens/TelaVerificacaoToken';

const Stack = createNativeStackNavigator();

export function AuthRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Cadastro" component={Cadastro} />
      <Stack.Screen name="VerificacaoToken" component={TelaVerificacaoToken} options={{ headerShown: false }} />
    </Stack.Navigator>
    
  );
}