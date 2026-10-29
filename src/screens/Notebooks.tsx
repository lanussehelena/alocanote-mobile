import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { notebookService } from '../services/notebookService';
import { getApiErrorMessage } from '../services/api';
import { NotebookResponseDTO, NotebookStatus, CreateNotebookRequestDTO } from '../types';
import { AppStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';

type NotebooksNavProp = NativeStackNavigationProp<AppStackParamList>;

export function Notebooks() {
  const [notebooks, setNotebooks] = useState<NotebookResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal Novo / Editar Notebook
  const [modalVisivel, setModalVisivel] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nome, setNome] = useState('');
  const [modeloDescricao, setModeloDescricao] = useState('');
  const [status, setStatus] = useState<NotebookStatus>(NotebookStatus.DISPONIVEL);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigation = useNavigation<NotebooksNavProp>();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const isAdmin = user?.role === 'ADMINISTRADOR';

  const carregarNotebooks = useCallback(async () => {
    try {
      const dados = await notebookService.listNotebooks();
      setNotebooks(dados);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Erro ao carregar notebooks.');
      Alert.alert('Erro', mensagem);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarNotebooks();
  }, [carregarNotebooks]);

  const onRefresh = () => {
    setIsRefreshing(true);
    carregarNotebooks();
  };

  const handleOpenNovo = () => {
    setIsEditMode(false);
    setEditingId(null);
    setNome('');
    setModeloDescricao('');
    setStatus(NotebookStatus.DISPONIVEL);
    setModalVisivel(true);
  };

  const handleOpenEditar = (item: NotebookResponseDTO) => {
    setIsEditMode(true);
    setEditingId(item.id);
    setNome(item.name);
    setModeloDescricao(item.modelDescription);
    setStatus(item.status);
    setModalVisivel(true);
  };

  const handleSalvarNotebook = async () => {
    if (!nome.trim() || !modeloDescricao.trim()) {
      Alert.alert('Atenção', 'Preencha o nome e a descrição do notebook.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateNotebookRequestDTO = {
        name: nome.trim(),
        modelDescription: modeloDescricao.trim(),
        status,
      };

      if (isEditMode && editingId) {
        await notebookService.updateNotebook(editingId, payload);
        Alert.alert('Sucesso', 'Notebook atualizado com sucesso!');
      } else {
        await notebookService.createNotebook(payload);
        Alert.alert('Sucesso', 'Novo notebook cadastrado!');
      }

      setModalVisivel(false);
      carregarNotebooks();
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Não foi possível salvar o notebook.');
      Alert.alert('Erro', mensagem);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExcluirNotebook = (item: NotebookResponseDTO) => {
    Alert.alert(
      'Excluir Notebook',
      `Tem certeza que deseja remover o "${item.name}"? Todas as reservas vinculadas serão removidas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await notebookService.deleteNotebook(item.id);
              Alert.alert('Sucesso', 'Equipamento removido com sucesso.');
              carregarNotebooks();
            } catch (error) {
              const mensagem = getApiErrorMessage(error, 'Erro ao excluir notebook.');
              Alert.alert('Erro', mensagem);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (s: NotebookStatus) => {
    switch (s) {
      case NotebookStatus.DISPONIVEL:
        return '#15803D';
      case NotebookStatus.EM_USO:
        return '#D97706';
      case NotebookStatus.MANUTENCAO:
        return '#DC2626';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (s: NotebookStatus) => {
    switch (s) {
      case NotebookStatus.DISPONIVEL:
        return 'Disponível';
      case NotebookStatus.EM_USO:
        return 'Em Uso';
      case NotebookStatus.MANUTENCAO:
        return 'Em Manutenção';
      default:
        return s;
    }
  };

  const renderItem = ({ item }: { item: NotebookResponseDTO }) => {
    const isDisponivel = item.status === NotebookStatus.DISPONIVEL;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '1A' }]}>
            <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <Text style={styles.cardDescription}>{item.modelDescription}</Text>

        {isDisponivel ? (
          <Pressable
            style={({ pressed }) => [styles.reserveButton, pressed && styles.reserveButtonPressed]}
            onPress={() => navigation.navigate('NovaReserva', { notebookId: item.id })}
          >
            <Text style={styles.reserveButtonText}>Reservar Equipamento</Text>
          </Pressable>
        ) : (
          <View style={styles.indisponivelContainer}>
            <Text style={styles.indisponivelText}>
              {item.status === NotebookStatus.MANUTENCAO
                ? 'Equipamento em reparo técnico'
                : 'Atualmente alocado por outro colaborador'}
            </Text>
          </View>
        )}

        {/* Barra de Ações Administrativas (Exclusiva do Admin) */}
        {isAdmin && (
          <View style={styles.adminBar}>
            <Pressable
              style={({ pressed }) => [styles.adminBtn, pressed && styles.adminBtnPressed]}
              onPress={() => handleOpenEditar(item)}
            >
              <Feather name="edit-2" size={14} color="#5B1B8E" />
              <Text style={styles.adminBtnText}>Editar</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.adminDeleteBtn, pressed && styles.adminDeleteBtnPressed]}
              onPress={() => handleExcluirNotebook(item)}
            >
              <Feather name="trash-2" size={14} color="#DC2626" />
              <Text style={styles.adminDeleteBtnText}>Excluir</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerTop}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.backButtonText}>← Início</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Notebooks</Text>
          {isAdmin ? (
            <Pressable
              style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
              onPress={handleOpenNovo}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Novo</Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
              onPress={signOut}
            >
              <Text style={styles.logoutButtonText}>Sair</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.subtitleText}>
          {isAdmin
            ? 'Gestão de Ativos Corporativos (Master)'
            : 'Equipamentos disponíveis para alocação'}
        </Text>
      </View>

      {/* Lista */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7E22CE" />
          <Text style={styles.loadingText}>Carregando equipamentos...</Text>
        </View>
      ) : (
        <FlatList
          data={notebooks}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: 85 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#7E22CE']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum equipamento cadastrado no momento.</Text>
            </View>
          }
        />
      )}

      {/* Modal Criar / Editar Notebook */}
      <Modal
        visible={modalVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditMode ? 'Editar Notebook' : 'Novo Notebook'}
              </Text>
              <Pressable onPress={() => setModalVisivel(false)}>
                <Feather name="x" size={24} color="#4B5563" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Identificação / Nome</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Dell Inspiron 15 (Projetos 3D)"
                placeholderTextColor="#9CA3AF"
                value={nome}
                onChangeText={setNome}
              />

              <Text style={styles.inputLabel}>Configuração / Modelo</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Ex: Intel Core i7, 16GB RAM, RTX 3050"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                value={modeloDescricao}
                onChangeText={setModeloDescricao}
              />

              <Text style={styles.inputLabel}>Status Atual</Text>
              <View style={styles.statusSelector}>
                {[
                  NotebookStatus.DISPONIVEL,
                  NotebookStatus.EM_USO,
                  NotebookStatus.MANUTENCAO,
                ].map((s) => (
                  <Pressable
                    key={s}
                    style={({ pressed }) => [
                      styles.statusChip,
                      status === s && {
                        backgroundColor: getStatusColor(s),
                        borderColor: getStatusColor(s),
                      },
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => setStatus(s)}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        status === s && styles.statusChipTextSelected,
                      ]}
                    >
                      {getStatusLabel(s)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  pressed && styles.submitBtnPressed,
                  isSubmitting && { opacity: 0.6 },
                ]}
                onPress={handleSalvarNotebook}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {isEditMode ? 'Salvar Alterações' : 'Cadastrar Equipamento'}
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6FD',
  },
  header: {
    backgroundColor: '#5B1B8E',
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  backButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7E22CE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C084FC',
  },
  addButtonPressed: {
    backgroundColor: '#6B21A8',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  subtitleText: {
    color: '#E9D5FF',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  logoutButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    elevation: 2,
    shadowColor: '#7E22CE',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1B4B',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  cardDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 14,
  },
  reserveButton: {
    backgroundColor: '#7E22CE',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    elevation: 2,
  },
  reserveButtonPressed: {
    backgroundColor: '#6B21A8',
  },
  reserveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  indisponivelContainer: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  indisponivelText: {
    color: '#6B7280',
    fontSize: 13,
    fontStyle: 'italic',
  },
  adminBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  adminBtnPressed: {
    backgroundColor: '#E9D5FF',
  },
  adminBtnText: {
    color: '#5B1B8E',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  adminDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  adminDeleteBtnPressed: {
    backgroundColor: '#FEE2E2',
  },
  adminDeleteBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  inputMultiline: {
    height: 70,
    textAlignVertical: 'top',
  },
  statusSelector: {
    flexDirection: 'row',
    marginTop: 6,
    marginBottom: 16,
  },
  statusChip: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  statusChipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '700',
  },
  statusChipTextSelected: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#7E22CE',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnPressed: {
    backgroundColor: '#6B21A8',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
