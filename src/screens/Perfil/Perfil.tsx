import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { getApiErrorMessage } from '../../services/api';
import { Role } from '../../types';
import { FeedbackBanner, FeedbackState } from '../../components/FeedbackBanner/FeedbackBanner';
import { ConfirmModal } from '../../components/ConfirmModal/ConfirmModal';
import { styles } from './Perfil.styles';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300';

interface CargoOption {
  chave: Role;
  rotulo: string;
}

const CARGOS: CargoOption[] = [
  { chave: Role.PROJETISTA, rotulo: 'Projetista' },
  { chave: Role.CONFERENTE, rotulo: 'Conferente' },
  { chave: Role.CONSULTOR_VENDAS, rotulo: 'Consultor de Vendas' },
  { chave: Role.OUTROS, rotulo: 'Outros' },
];

function formatarCargo(role?: string, customRole?: string | null): string {
  if (role === Role.OUTROS && customRole) {
    return customRole;
  }
  switch (role) {
    case Role.PROJETISTA:
      return 'Projetista';
    case Role.CONFERENTE:
      return 'Conferente';
    case Role.CONSULTOR_VENDAS:
      return 'Consultor de Vendas';
    case Role.ADMINISTRADOR:
      return 'Administrador';
    case Role.OUTROS:
      return customRole || 'Outros';
    case 'ROLE_USER':
      return 'Colaborador';
    case 'ROLE_ADMIN':
      return 'Administrador';
    default:
      return role || 'Colaborador';
  }
}

function formatarTelefone(telefone?: string): string {
  if (!telefone) return '-';
  const numeros = telefone.replace(/\D/g, '');
  if (numeros.length === 13) {
    return `+${numeros.slice(0, 2)} (${numeros.slice(2, 4)}) ${numeros.slice(4, 9)}-${numeros.slice(9)}`;
  }
  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }
  return telefone;
}

export function Perfil() {
  const { user, signOut, refreshUserProfile } = useAuth();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // Estado de upload da foto da galeria
  const [salvandoFoto, setSalvandoFoto] = useState(false);

  // Estados de Edição de Dados Pessoais (sem endereço)
  const [editandoDados, setEditandoDados] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cargo, setCargo] = useState<Role>(Role.PROJETISTA);
  const [customRole, setCustomRole] = useState('');
  const [modalCargoVisivel, setModalCargoVisivel] = useState(false);
  const [salvandoDados, setSalvandoDados] = useState(false);

  // Estados de Alteração de Senha
  const [editandoSenha, setEditandoSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  // Feedbacks em tela e modal de confirmação de saída
  const [feedbackGeral, setFeedbackGeral] = useState<FeedbackState | null>(null);
  const [feedbackDados, setFeedbackDados] = useState<FeedbackState | null>(null);
  const [feedbackSenha, setFeedbackSenha] = useState<FeedbackState | null>(null);
  const [modalLogoutVisivel, setModalLogoutVisivel] = useState(false);
  const [saindoConta, setSaindoConta] = useState(false);

  useEffect(() => {
    refreshUserProfile();
  }, []);

  useEffect(() => {
    if (user) {
      setNome(user.name || '');
      setTelefone(user.phone || '');
      if (
        user.role === Role.PROJETISTA ||
        user.role === Role.CONFERENTE ||
        user.role === Role.CONSULTOR_VENDAS ||
        user.role === Role.OUTROS ||
        user.role === Role.ADMINISTRADOR
      ) {
        setCargo(user.role as Role);
      }
      setCustomRole(user.customRole || '');
    }
  }, [user]);

  const cargoFormatado = formatarCargo(user?.role, user?.customRole);
  const avatarAtual = user?.profilePictureUrl || DEFAULT_AVATAR;

  const handleEscolherFotoGaleria = async () => {
    setFeedbackGeral(null);
    try {
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissao.granted) {
        setFeedbackGeral({
          type: 'warning',
          title: 'Permissão necessária',
          message: 'Precisamos de permissão para acessar as fotos da sua galeria.',
        });
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.25,
        base64: true,
      });

      if (resultado.canceled || !resultado.assets || resultado.assets.length === 0) {
        return;
      }

      const asset = resultado.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      const fotoDataUri = asset.base64
        ? `data:${mimeType};base64,${asset.base64}`
        : asset.uri;

      setSalvandoFoto(true);
      await userService.updateMyProfile({
        profilePictureUrl: fotoDataUri,
      });
      await refreshUserProfile();
      setFeedbackGeral({
        type: 'success',
        title: 'Foto atualizada',
        message: 'Foto do perfil atualizada com sucesso!',
      });
    } catch (error) {
      setFeedbackGeral({
        type: 'error',
        title: 'Erro ao atualizar foto',
        message: getApiErrorMessage(error, 'Não foi possível atualizar a foto do perfil.'),
      });
    } finally {
      setSalvandoFoto(false);
    }
  };

  const handleSalvarDados = async () => {
    setFeedbackDados(null);
    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (!nome.trim() || !telefoneLimpo) {
      setFeedbackDados({
        type: 'warning',
        title: 'Campos obrigatórios',
        message: 'Nome e telefone não podem ficar vazios.',
      });
      return;
    }

    if (cargo === Role.OUTROS && !customRole.trim()) {
      setFeedbackDados({
        type: 'warning',
        title: 'Campo obrigatório',
        message: 'Informe a descrição do seu cargo.',
      });
      return;
    }

    setSalvandoDados(true);
    try {
      await userService.updateMyProfile({
        name: nome.trim(),
        phone: telefoneLimpo,
        role: cargo,
        customRole: cargo === Role.OUTROS ? customRole.trim() : null,
      });
      await refreshUserProfile();
      setEditandoDados(false);
      setFeedbackDados(null);
      setFeedbackGeral({
        type: 'success',
        title: 'Dados atualizados',
        message: 'Seus dados foram atualizados com sucesso!',
      });
    } catch (error) {
      setFeedbackDados({
        type: 'error',
        title: 'Erro ao atualizar',
        message: getApiErrorMessage(error, 'Não foi possível atualizar seus dados.'),
      });
    } finally {
      setSalvandoDados(false);
    }
  };

  const handleSalvarSenha = async () => {
    setFeedbackSenha(null);
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setFeedbackSenha({
        type: 'warning',
        title: 'Campos obrigatórios',
        message: 'Preencha a senha atual, a nova senha e a confirmação.',
      });
      return;
    }

    if (novaSenha.length < 6) {
      setFeedbackSenha({
        type: 'warning',
        title: 'Senha curta',
        message: 'A nova senha deve ter pelo menos 6 caracteres.',
      });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setFeedbackSenha({
        type: 'warning',
        title: 'Senhas divergentes',
        message: 'A confirmação da nova senha não confere.',
      });
      return;
    }

    setSalvandoSenha(true);
    try {
      await userService.updateMyProfile({
        currentPassword: senhaAtual,
        newPassword: novaSenha,
      });
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setEditandoSenha(false);
      setFeedbackSenha(null);
      setFeedbackGeral({
        type: 'success',
        title: 'Senha alterada',
        message: 'Sua senha foi alterada com sucesso!',
      });
    } catch (error) {
      setFeedbackSenha({
        type: 'error',
        title: 'Erro ao alterar senha',
        message: getApiErrorMessage(error, 'Não foi possível alterar a senha. Verifique sua senha atual.'),
      });
    } finally {
      setSalvandoSenha(false);
    }
  };

  const handleLogout = () => {
    setModalLogoutVisivel(true);
  };

  const handleConfirmarLogout = async () => {
    setSaindoConta(true);
    try {
      await signOut();
    } finally {
      setSaindoConta(false);
      setModalLogoutVisivel(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Voltar</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.profileHeaderContent}>
          <Pressable
            style={({ pressed }) => [
              styles.avatarWrapper,
              pressed && styles.avatarWrapperPressed,
            ]}
            onPress={handleEscolherFotoGaleria}
            disabled={salvandoFoto}
          >
            <View style={styles.avatarBorder}>
              <Image
                source={{ uri: avatarAtual }}
                style={styles.avatarImage}
              />
              {salvandoFoto && (
                <View style={styles.avatarLoadingOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
            </View>
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.changePhotoButton,
              pressed && styles.changePhotoButtonPressed,
            ]}
            onPress={handleEscolherFotoGaleria}
            disabled={salvandoFoto}
          >
            <Text style={styles.changePhotoText}>
              {salvandoFoto ? 'Atualizando foto...' : 'Alterar foto da galeria'}
            </Text>
          </Pressable>

          <Text style={styles.userName}>{user?.name || 'Colaborador'}</Text>
          <View style={styles.userRoleBadge}>
            <Text style={styles.userRoleText}>{cargoFormatado}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <FeedbackBanner feedback={feedbackGeral} onDismiss={() => setFeedbackGeral(null)} />

        {/* Card: Informações da Conta e Edição de Dados */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Informações da Conta</Text>
            <Pressable
              style={({ pressed }) => [
                styles.editToggleButton,
                pressed && styles.editToggleButtonPressed,
              ]}
              onPress={() => setEditandoDados((prev) => !prev)}
            >
              <Feather
                name={editandoDados ? 'x' : 'edit-2'}
                size={14}
                color="#6B21A8"
              />
              <Text style={styles.editToggleButtonText}>
                {editandoDados ? 'Cancelar' : 'Editar Dados'}
              </Text>
            </Pressable>
          </View>

          {!editandoDados ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nome Completo</Text>
                <Text style={styles.infoValue}>{user?.name || '-'}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Cargo / Função</Text>
                <Text style={styles.infoValue}>{cargoFormatado}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>E-mail Corporativo</Text>
                <Text style={styles.infoValue}>{user?.email || '-'}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Telefone</Text>
                <Text style={styles.infoValue}>{formatarTelefone(user?.phone)}</Text>
              </View>
            </>
          ) : (
            <View>
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Nome Completo</Text>
                <TextInput
                  style={styles.input}
                  value={nome}
                  onChangeText={setNome}
                  placeholder="Digite seu nome completo"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Telefone (com DDI/DDD)</Text>
                <TextInput
                  style={styles.input}
                  value={telefone}
                  onChangeText={setTelefone}
                  placeholder="Ex: 5583999999999"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>

              {cargo !== Role.ADMINISTRADOR && (
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Cargo / Função</Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.selectField,
                      pressed && styles.selectFieldPressed,
                    ]}
                    onPress={() => setModalCargoVisivel(true)}
                  >
                    <Text style={styles.selectFieldText}>
                      {CARGOS.find((c) => c.chave === cargo)?.rotulo || 'Selecione'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#4B0082" />
                  </Pressable>

                  {cargo === Role.OUTROS && (
                    <TextInput
                      style={[styles.input, { marginTop: 8 }]}
                      value={customRole}
                      onChangeText={setCustomRole}
                      placeholder="Digite qual é o seu cargo"
                      placeholderTextColor="#9CA3AF"
                    />
                  )}
                </View>
              )}

              <FeedbackBanner feedback={feedbackDados} onDismiss={() => setFeedbackDados(null)} />

              <View style={styles.actionButtonsRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelButton,
                    pressed && styles.cancelButtonPressed,
                  ]}
                  onPress={() => {
                    setFeedbackDados(null);
                    setEditandoDados(false);
                  }}
                  disabled={salvandoDados}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.saveButton,
                    pressed && styles.saveButtonPressed,
                  ]}
                  onPress={handleSalvarDados}
                  disabled={salvandoDados}
                >
                  {salvandoDados ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Salvar Dados</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Card: Segurança e Alteração de Senha */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Segurança e Senha</Text>
            <Pressable
              style={({ pressed }) => [
                styles.editToggleButton,
                pressed && styles.editToggleButtonPressed,
              ]}
              onPress={() => setEditandoSenha((prev) => !prev)}
            >
              <Feather
                name={editandoSenha ? 'x' : 'lock'}
                size={14}
                color="#6B21A8"
              />
              <Text style={styles.editToggleButtonText}>
                {editandoSenha ? 'Cancelar' : 'Alterar Senha'}
              </Text>
            </Pressable>
          </View>

          {!editandoSenha ? (
            <Text style={styles.passwordHintText}>
              Mantenha sua conta protegida. Toque em "Alterar Senha" para definir uma nova senha de acesso.
            </Text>
          ) : (
            <View>
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Senha Atual</Text>
                <View style={styles.passwordFieldContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={senhaAtual}
                    onChangeText={setSenhaAtual}
                    placeholder="Digite sua senha atual"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!mostrarSenhaAtual}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    onPress={() => setMostrarSenhaAtual((prev) => !prev)}
                    style={styles.eyeButton}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={mostrarSenhaAtual ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#4B0082"
                    />
                  </Pressable>
                </View>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Nova Senha</Text>
                <View style={styles.passwordFieldContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={novaSenha}
                    onChangeText={setNovaSenha}
                    placeholder="Digite a nova senha"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!mostrarNovaSenha}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    onPress={() => setMostrarNovaSenha((prev) => !prev)}
                    style={styles.eyeButton}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={mostrarNovaSenha ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#4B0082"
                    />
                  </Pressable>
                </View>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Confirmar Nova Senha</Text>
                <View style={styles.passwordFieldContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmarSenha}
                    onChangeText={setConfirmarSenha}
                    placeholder="Repita a nova senha"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!mostrarConfirmarSenha}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    onPress={() => setMostrarConfirmarSenha((prev) => !prev)}
                    style={styles.eyeButton}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={mostrarConfirmarSenha ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#4B0082"
                    />
                  </Pressable>
                </View>
              </View>

              <FeedbackBanner feedback={feedbackSenha} onDismiss={() => setFeedbackSenha(null)} />

              <Pressable
                style={({ pressed }) => [
                  styles.saveButtonFull,
                  pressed && styles.saveButtonPressed,
                ]}
                onPress={handleSalvarSenha}
                disabled={salvandoSenha}
              >
                {salvandoSenha ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Atualizar Senha</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed,
          ]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Sair da Conta</Text>
        </Pressable>
      </ScrollView>

      {/* Modal: Selecionar Cargo */}
      <Modal
        visible={modalCargoVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalCargoVisivel(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalCargoVisivel(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Selecione o Cargo</Text>
            {CARGOS.map((item) => {
              const ativo = item.chave === cargo;
              return (
                <Pressable
                  key={item.chave}
                  style={({ pressed }) => [
                    styles.roleModalItem,
                    ativo && styles.roleModalItemActive,
                    pressed && styles.roleModalItemPressed,
                  ]}
                  onPress={() => {
                    setCargo(item.chave);
                    setModalCargoVisivel(false);
                  }}
                >
                  <Text
                    style={[
                      styles.roleModalItemText,
                      ativo && styles.roleModalItemTextActive,
                    ]}
                  >
                    {item.rotulo}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
      <ConfirmModal
        visible={modalLogoutVisivel}
        title="Encerrar Sessão"
        message="Tem certeza de que deseja sair da sua conta?"
        confirmLabel="Sim, Sair"
        cancelLabel="Cancelar"
        destructive
        isLoading={saindoConta}
        onConfirm={handleConfirmarLogout}
        onCancel={() => setModalLogoutVisivel(false)}
      />
    </KeyboardAvoidingView>
  );
}
