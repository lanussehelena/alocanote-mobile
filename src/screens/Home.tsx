import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, Pressable } from 'react-native';
import { NotebookCard } from '../components/NotebookCard';
import { Notebook } from '../types';
import { api } from '../services/api';
import { Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export function Home() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { signOut, user } = useAuth();

 useEffect(() => {
    const fetchNotebooks = async () => {
      try {
        setLoading(true);
        const response = await api.get<Notebook[]>('/notebooks'); 
        
        setNotebooks(response.data);
      } catch (error: any) {
        console.error("Erro ao buscar notebooks:", error);
        Alert.alert('Erro', 'Não foi possível carregar a lista de equipamentos.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotebooks();
  }, []);

  const handleAgendar = (notebookId: number) => {
    console.log(`Navegar para ecrã de Agendamento do notebook: ${notebookId}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Bem-vindo, {user?.name}!</Text>
        <Pressable onPress={signOut} style={{ marginTop: 10 }}>
          <Text style={{ color: '#FFF', textDecorationLine: 'underline' }}>Sair da conta</Text>
        </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar..."
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <Text style={styles.sectionTitle}>Selecionar Notebook</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#4B0082" style={styles.loader} />
          ) : (
            <FlatList
              data={notebooks}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <NotebookCard notebook={item} onAgendar={handleAgendar} />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#4B0082',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  loader: {
    marginTop: 50,
  }
});