import React from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { styles } from './Home.styles';

interface HomeProps {
  navigation?: any;
}

export function Home({ navigation }: HomeProps) {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4C1D95" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho Curvo Roxo */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingTitle}>Bem-vindo,</Text>
              <Text style={styles.greetingName}>
                {user?.name || 'Tamires'}!
              </Text>
            </View>

           <View style={styles.avatarBorder}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
              }}
              style={styles.avatarImage}
            />
          </View>
        </View>
      </View>

        {/* Lista de Ações / Cards */}
        <View style={styles.cardsContainer}>
          {/* Card: Notebooks */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation?.navigate('Notebooks')}
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
                Veja os notebooks disponíveis, faça sua reserva e confira as datas e horários.
              </Text>
            </View>

            <View style={styles.actionArrowCircle}>
              <Feather name="arrow-right" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Card: Meu Perfil */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation?.navigate('Perfil')}
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
          </TouchableOpacity>

          {/* Card: Calendário */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation?.navigate('Calendario')}
          >
            <LinearGradient
              colors={['#7E22CE', '#9333EA']}
              style={styles.cardIconBox}
            >
              <Ionicons name="calendar-outline" size={30} color="#FFFFFF" />
            </LinearGradient>

            <View style={styles.cardTextBox}>
              <Text style={styles.cardTitle}>Calendário</Text>
              <Text style={styles.cardSubtitle}>
                Veja os agendamentos feitos, confira quais notebooks já foram reservados e os horários disponíveis.
              </Text>
            </View>

            <View style={styles.actionArrowCircle}>
              <Feather name="arrow-right" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Menu Inferior */}
      <View style={styles.bottomNavContainer}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation?.navigate('Perfil')}
        >
          <Feather name="user" size={28} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.floatingCenterButton}
          activeOpacity={0.9}
          onPress={() => navigation?.navigate('Notebooks')}
        >
          <LinearGradient
            colors={['#C084FC', '#7E22CE']}
            style={styles.floatingGradient}
          >
            <MaterialCommunityIcons name="laptop" size={28} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation?.navigate('Calendario')}
        >
          <Ionicons name="calendar-outline" size={28} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}