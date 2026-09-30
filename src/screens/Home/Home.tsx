import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, ActivityIndicator, Pressable, Alert } from 'react-native';
import { NotebookCard } from '../../components/NotebookCard/NotebookCard';
import { Notebook } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { styles } from './Home.styles';

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
          <Text style={styles.signOutText}>Sair da conta</Text>
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
