import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Login } from '../screens/Login/Login';
import { Cadastro } from '../screens/Cadastro/Cadastro';
import { VerificarEmail } from '../screens/VerificarEmail/VerificarEmail';
import { AuthStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthRoutes() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Cadastro" component={Cadastro} />
      <Stack.Screen name="VerificarEmail" component={VerificarEmail} />
    </Stack.Navigator>
  );
}