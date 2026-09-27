import React from 'react';
import { Routes } from './src/routes';
import { AuthProvider } from './src/contexts/AuthContext';
import { NavigationContainer } from '@react-navigation/native';

export default function App() {
  return (
    <AuthProvider> 
        <Routes /> 
    </AuthProvider>
  );
}