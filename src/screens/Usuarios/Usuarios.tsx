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
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { userService } from '../../services/userService';
import { getApiErrorMessage } from '../../services/api';
import { UserResponseDTO, Role, RegisterUserRequestDTO } from '../../types';
import { AppStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';

type UsuariosNavProp = NativeStackNavigationProp<AppStackParamList>;

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<UserResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Novo Usuário
  const [modalNovoVisivel, setModalNovoVisivel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  const [novoCargo, setNovoCargo] = useState<Role>(Role.PROJETISTA);

  // Modal Editar Cargo
  const [modalEditarVisivel, setModalEditarVisivel] = useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<UserResponseDTO | null>(null);
  const [cargoEditado, setCargoEditado] = useState<Role>(Role.PROJETISTA);

  const navigation = useNavigation<UsuariosNavProp>();
  const { user: currentUser } = useAuth();
  const insets = useSafeAreaInsets();

  const carregarUsuarios = useCallback(async () => {
    try {
      const dados = await userService.listUsers();
      setUsuarios(dados);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Erro ao carregar colaboradores.');
      Alert.alert('Erro', mensagem);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  const onRefresh = () => {
    setIsRefreshing(true);
    carregarUsuarios();
  };

  const handleCadastrarUsuario = async () => {
    if (!novoNome.trim() || !novoEmail.trim() || !novaSenha.trim()) {
      Alert.alert('Atenção', 'Preencha nome, e-mail e senha do colaborador.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: RegisterUserRequestDTO = {
        name: novoNome.trim(),
        email: novoEmail.trim().toLowerCase(),
        password: novaSenha,
        phone: novoTelefone.trim() || undefined,
        role: novoCargo,
      };

      await userService.createUser(payload);
      Alert.alert('Sucesso', 'Colaborador cadastrado com sucesso!');
      setModalNovoVisivel(false);
      setNovoNome('');
      setNovoEmail('');
      setNovaSenha('');
      setNovoTelefone('');
      setNovoCargo(Role.PROJETISTA);
      carregarUsuarios();
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Não foi possível cadastrar o colaborador.');
      Alert.alert('Erro', mensagem);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSalvarEdicaoCargo = async () => {
    if (!usuarioEmEdicao) return;

    try {
      setIsSubmitting(true);
      await userService.updateUser(usuarioEmEdicao.id, {
        role: cargoEditado,
      });
      Alert.alert('Sucesso', 'Cargo atualizado com sucesso!');
      setModalEditarVisivel(false);
      setUsuarioEmEdicao(null);
      carregarUsuarios();
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Não foi possível atualizar o cargo.');
      Alert.alert('Erro', mensagem);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExcluirUsuario = (usuario: UserResponseDTO) => {
    if (usuario.email.toLowerCase() === 'admin@alocanote.com' || usuario.id === currentUser?.id) {
      Alert.alert('Ação Não Permitida', 'Você não pode excluir o seu próprio perfil ou o administrador mestre.');
      return;
    }

    Alert.alert(
      'Excluir Colaborador',
      `Tem certeza que deseja remover ${usuario.name}? As reservas vinculadas a este colaborador serão canceladas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.deleteUser(usuario.id);
              Alert.alert('Sucesso', 'Colaborador removido.');
              carregarUsuarios();
            } catch (error) {
              const mensagem = getApiErrorMessage(error, 'Erro ao remover colaborador.');
              Alert.alert('Erro', mensagem);
            }
          },
        },
      ]
    );
  };

  const getRoleLabel = (role: Role | string) => {
    switch (role) {
      case Role.ADMINISTRADOR:
        return 'Administrador';
      case Role.PROJETISTA:
        return 'Projetista';
      case Role.CONFERENTE:
        return 'Conferente';
      case Role.CONSULTOR_VENDAS:
        return 'Consultor de Vendas';
      default:
        return 'Outros';
    }
  };

  const getRoleBadgeStyle = (role: Role | string) => {
    switch (role) {
      case Role.ADMINISTRADOR:
        return { bg: '#FDF2F8', color: '#BE185D' };
      case Role.PROJETISTA:
        return { bg: '#EFF6FF', color: '#1D4ED8' };
      case Role.CONFERENTE:
        return { bg: '#ECFDF5', color: '#047857' };
      case Role.CONSULTOR_VENDAS:
        return { bg: '#FFFBEB', color: '#B45309' };
      default:
        return { bg: '#F3F4F6', color: '#4B5563' };
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const termo = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(termo) ||
      u.email.toLowerCase().includes(termo) ||
      (u.phone && u.phone.includes(termo))
    );
  });

  const renderUsuarioItem = ({ item }: { item: UserResponseDTO }) => {
    const badgeStyle = getRoleBadgeStyle(item.role);
    const isMaster = item.email.toLowerCase() === 'admin@alocanote.com';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            {item.phone ? <Text style={styles.userPhone}>{item.phone}</Text> : null}
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
            <Text style={[styles.badgeText, { color: badgeStyle.color }]}>
              {getRoleLabel(item.role)}
            </Text>
          </View>

          <View style={styles.actionButtonsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.editBtn,
                pressed && styles.editBtnPressed,
              ]}
              onPress={() => {
                setUsuarioEmEdicao(item);
                setCargoEditado(item.role);
                setModalEditarVisivel(true);
              }}
            >
              <Feather name="edit-2" size={15} color="#5B1B8E" />
              <Text style={styles.editBtnText}>Cargo</Text>
            </Pressable>

            {!isMaster ? (
              <Pressable
                style={({ pressed }) => [
                  styles.deleteBtn,
                  pressed && styles.deleteBtnPressed,
                ]}
                onPress={() => handleExcluirUsuario(item)}
              >
                <Feather name="trash-2" size={15} color="#DC2626" />
                <Text style={styles.deleteBtnText}>Excluir</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  const rolesDisponiveis: Role[] = [
    Role.ADMINISTRADOR,
    Role.PROJETISTA,
    Role.CONFERENTE,
    Role.CONSULTOR_VENDAS,
    Role.OUTROS,
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerTop}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.backButtonText}>← Início</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Gestão de Usuários</Text>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={() => setModalNovoVisivel(true)}
          >
            <Ionicons name="person-add" size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Novo</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitleText}>Painel Master de Controle de Colaboradores</Text>

        {/* Barra de Busca */}
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome ou e-mail..."
            placeholderTextColor="#9CA3AF"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 ? (
            <Pressable onPress={() => setSearchTerm('')}>
              <Feather name="x" size={18} color="#6B7280" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Conteúdo Principal */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7E22CE" />
          <Text style={styles.loadingText}>Carregando colaboradores...</Text>
        </View>
      ) : (
        <FlatList
          data={usuariosFiltrados}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderUsuarioItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: 85 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={['#7E22CE']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum colaborador encontrado.</Text>
            </View>
          }
        />
      )}

      {/* Modal Novo Usuário */}
      <Modal
        visible={modalNovoVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalNovoVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Colaborador</Text>
              <Pressable onPress={() => setModalNovoVisivel(false)}>
                <Feather name="x" size={24} color="#4B5563" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Nome Completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: João da Silva"
                placeholderTextColor="#9CA3AF"
                value={novoNome}
                onChangeText={setNovoNome}
              />

              <Text style={styles.inputLabel}>E-mail Corporativo</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: joao@loja.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={novoEmail}
                onChangeText={setNovoEmail}
              />

              <Text style={styles.inputLabel}>Senha Temporária</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo de 6 caracteres"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={novaSenha}
                onChangeText={setNovaSenha}
              />

              <Text style={styles.inputLabel}>Telefone / WhatsApp</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 83999999999"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={novoTelefone}
                onChangeText={setNovoTelefone}
              />

              <Text style={styles.inputLabel}>Cargo / Papel</Text>
              <View style={styles.roleSelector}>
                {rolesDisponiveis.map((role) => (
                  <Pressable
                    key={role}
                    style={({ pressed }) => [
                      styles.roleChip,
                      novoCargo === role && styles.roleChipSelected,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => setNovoCargo(role)}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        novoCargo === role && styles.roleChipTextSelected,
                      ]}
                    >
                      {getRoleLabel(role)}
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
                onPress={handleCadastrarUsuario}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Cadastrar Colaborador</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Editar Cargo */}
      <Modal
        visible={modalEditarVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalEditarVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alterar Cargo</Text>
              <Pressable onPress={() => setModalEditarVisivel(false)}>
                <Feather name="x" size={24} color="#4B5563" />
              </Pressable>
            </View>

            <Text style={styles.editModalSubtitle}>
              Colaborador: {usuarioEmEdicao?.name}
            </Text>

            <View style={styles.roleSelector}>
              {rolesDisponiveis.map((role) => (
                <Pressable
                  key={role}
                  style={({ pressed }) => [
                    styles.roleChip,
                    cargoEditado === role && styles.roleChipSelected,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => setCargoEditado(role)}
                >
                  <Text
                    style={[
                      styles.roleChipText,
                      cargoEditado === role && styles.roleChipTextSelected,
                    ]}
                  >
                    {getRoleLabel(role)}
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
              onPress={handleSalvarEdicaoCargo}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Salvar Cargo</Text>
              )}
            </Pressable>
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
    paddingBottom: 20,
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
    fontSize: 19,
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
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1E1B4B',
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
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    elevation: 2,
    shadowColor: '#7E22CE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#7E22CE',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  userPhone: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  editBtnPressed: {
    backgroundColor: '#E9D5FF',
  },
  editBtnText: {
    color: '#5B1B8E',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  deleteBtnPressed: {
    backgroundColor: '#FEE2E2',
  },
  deleteBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
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
  editModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
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
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    marginBottom: 16,
  },
  roleChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  roleChipSelected: {
    backgroundColor: '#5B1B8E',
  },
  roleChipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  roleChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
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
