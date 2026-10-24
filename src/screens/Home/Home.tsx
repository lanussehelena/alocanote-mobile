import React from 'react';
import {
  Text,
  View,
  Pressable,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { styles } from './Home.styles';

interface HomeProps {
  navigation?: any;
}

export function Home({ navigation }: HomeProps) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const primeiroNome = user?.name ? user.name.trim().split(' ')[0] : 'Colaborador';
  const isAdmin = user?.role === 'ADMINISTRADOR';

  const handleOpenNotebooks = () => {
    navigation?.navigate('MainTabs', { screen: 'Notebooks' });
  };

  const handleOpenReservas = () => {
    navigation?.navigate('MainTabs', { screen: 'MinhasReservas' });
  };

  const handleOpenPerfil = () => {
    navigation?.navigate('Perfil');
  };

  const handleOpenUsuarios = () => {
    navigation?.navigate('Usuarios');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 110 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho Curvo Roxo */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top + 12, 20) }]}>
          <View style={styles.headerTop}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingTitle}>Olá,</Text>
              <Text style={styles.greetingName}>{primeiroNome}!</Text>
            </View>

            <Pressable
              style={styles.avatarBorder}
              onPress={handleOpenPerfil}
            >
              <Image
                source={{
                  uri:
                    user?.profilePictureUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
                }}
                style={styles.avatarImage}
              />
            </Pressable>
          </View>
        </View>

        {/* Lista de Ações / Cards */}
        <View style={styles.cardsContainer}>
          {/* Card Especial Admin: Gestão de Usuários */}
          {isAdmin && (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
              onPress={handleOpenUsuarios}
            >
              <LinearGradient
                colors={['#7E22CE', '#9333EA']}
                style={styles.cardIconBox}
              >
                <Feather name="users" size={30} color="#FFFFFF" />
              </LinearGradient>

              <View style={styles.cardTextBox}>
                <Text style={styles.cardTitle}>Gestão de Usuários</Text>
                <Text style={styles.cardSubtitle}>
                  Controle master: adicione ou remova colaboradores e altere permissões da equipe.
                </Text>
              </View>

              <View style={styles.actionArrowCircle}>
                <Feather name="arrow-right" size={20} color="#FFFFFF" />
              </View>
            </Pressable>
          )}

          {/* Card: Notebooks */}
          <Pressable
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            onPress={handleOpenNotebooks}
          >
            <LinearGradient
              colors={['#7E22CE', '#9333EA']}
              style={styles.cardIconBox}
            >
              <MaterialCommunityIcons name="laptop" size={32} color="#FFFFFF" />
            </LinearGradient>

            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>Notebooks</Text>
              <Text style={styles.cardSubtitle}>
                {isAdmin
                  ? 'Cadastre novos notebooks, altere estados de manutenção ou remova equipamentos.'
                  : 'Veja os notebooks disponíveis, faça sua reserva e confira as datas e horários.'}
              </Text>
            </View>

            <View style={styles.actionArrowCircle}>
              <Feather name="arrow-right" size={20} color="#FFFFFF" />
            </View>
          </Pressable>

          {/* Card: Meu Perfil */}
          <Pressable
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            onPress={handleOpenPerfil}
          >
            <LinearGradient
              colors={['#7E22CE', '#9333EA']}
              style={styles.cardIconBox}
            >
              <Feather name="user" size={30} color="#FFFFFF" />
            </LinearGradient>

            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>Meu Perfil</Text>
              <Text style={styles.cardSubtitle}>
                Edite sua foto de perfil, atualize seus dados e mantenha seu cadastro em dia.
              </Text>
            </View>

            <View style={styles.actionArrowCircle}>
              <Feather name="arrow-right" size={20} color="#FFFFFF" />
            </View>
          </Pressable>

          {/* Card: Calendário / Reservas */}
          <Pressable
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            onPress={handleOpenReservas}
          >
            <LinearGradient
              colors={['#7E22CE', '#9333EA']}
              style={styles.cardIconBox}
            >
              <Ionicons name="calendar-outline" size={30} color="#FFFFFF" />
            </LinearGradient>

            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>
                {isAdmin ? 'Gestão de Reservas' : 'Calendário'}
              </Text>
              <Text style={styles.cardSubtitle}>
                {isAdmin
                  ? 'Visualize, libere, cancele ou exclua agendamentos de qualquer colaborador.'
                  : 'Veja os agendamentos feitos, confira quais notebooks já foram reservados e os horários disponíveis.'}
              </Text>
            </View>

            <View style={styles.actionArrowCircle}>
              <Feather name="arrow-right" size={20} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Menu Inferior */}
      <View
        style={[
          styles.bottomNavContainer,
          {
            height: 70 + insets.bottom,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [styles.navButton, pressed && { opacity: 0.6 }]}
          onPress={handleOpenPerfil}
        >
          <Feather name="user" size={28} color="#9CA3AF" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.floatingCenterButton,
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleOpenNotebooks}
        >
          <LinearGradient
            colors={['#C084FC', '#7E22CE']}
            style={styles.floatingGradient}
          >
            <MaterialCommunityIcons name="laptop" size={28} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.navButton, pressed && { opacity: 0.6 }]}
          onPress={handleOpenReservas}
        >
          <Ionicons name="calendar-outline" size={28} color="#9CA3AF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
