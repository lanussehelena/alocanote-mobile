import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Home } from '../screens/Home/Home';
import { Notebooks } from '../screens/Notebooks';
import { MinhasReservas } from '../screens/MinhasReservas';
import { NovaReserva } from '../screens/NovaReserva';
import { Perfil } from '../screens/Perfil/Perfil';
import { Usuarios } from '../screens/Usuarios/Usuarios';
import { AppStackParamList, AppTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<AppTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#5B1B8E',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3E8FF',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Notebooks"
        component={Notebooks}
        options={{
          tabBarLabel: 'Notebooks',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="laptop" size={size || 24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MinhasReservas"
        component={MinhasReservas}
        options={{
          tabBarLabel: 'Minhas Reservas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size || 24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppRoutes() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={Home}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MainTabs"
        component={AppTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Notebooks"
        component={Notebooks}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MinhasReservas"
        component={MinhasReservas}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Calendario"
        component={MinhasReservas}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NovaReserva"
        component={NovaReserva}
        options={{
          title: 'Agendar Notebook',
          headerStyle: { backgroundColor: '#5B1B8E' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen
        name="Perfil"
        component={Perfil}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Usuarios"
        component={Usuarios}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
