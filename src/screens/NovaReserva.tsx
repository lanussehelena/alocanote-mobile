import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
  ActivityIndicator,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notebookService } from '../services/notebookService';
import { reservationService } from '../services/reservationService';
import { getApiErrorMessage, isUnauthorizedError } from '../services/api';
import { NotebookResponseDTO, NotebookStatus } from '../types';
import { AppStackParamList } from '../types/navigation';
import { PrimaryButton } from '../components/PrimaryButton/PrimaryButton';
import { dataCy } from '../utils/dataCy';

type NovaReservaNavProp = NativeStackNavigationProp<AppStackParamList, 'NovaReserva'>;
type NovaReservaRouteProp = RouteProp<AppStackParamList, 'NovaReserva'>;

export function NovaReserva() {
  const navigation = useNavigation<NovaReservaNavProp>();
  const route = useRoute<NovaReservaRouteProp>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const preSelectedNotebookId = route.params?.notebookId;

  const [notebooks, setNotebooks] = useState<NotebookResponseDTO[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<NotebookResponseDTO | null>(null);

  // Campos de data/hora (DD/MM/AAAA e HH:mm)
  const [dataInicio, setDataInicio] = useState('');
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [dataTermino, setDataTermino] = useState('');
  const [horaTermino, setHoraTermino] = useState('12:00');
  const [purpose, setPurpose] = useState('');

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalNotebookVisible, setModalNotebookVisible] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      try {
        const listaNotebooks = await notebookService.listNotebooks();

        const disponiveis = listaNotebooks.filter(
          (nb) => nb.status === NotebookStatus.DISPONIVEL
        );
        setNotebooks(disponiveis);

        if (preSelectedNotebookId) {
          const encontrado = disponiveis.find((nb) => nb.id === preSelectedNotebookId);
          if (encontrado) setSelectedNotebook(encontrado);
        } else if (disponiveis.length > 0) {
          setSelectedNotebook(disponiveis[0]);
        }

        // Sugerir a data de amanhã por padrão
        const amanha = new Date();
        amanha.setDate(amanha.getDate() + 1);
        const dia = String(amanha.getDate()).padStart(2, '0');
        const mes = String(amanha.getMonth() + 1).padStart(2, '0');
        const ano = amanha.getFullYear();
        const dataPadrao = `${dia}/${mes}/${ano}`;
        setDataInicio(dataPadrao);
        setDataTermino(dataPadrao);
      } catch (error) {
        if (isUnauthorizedError(error)) return;
        const mensagem = getApiErrorMessage(error, 'Erro ao carregar dados para a reserva.');
        Alert.alert('Erro', mensagem);
      } finally {
        setIsLoadingData(false);
      }
    }

    carregarDados();
  }, [preSelectedNotebookId]);

  const formatarData = (texto: string): string => {
    const digitos = texto.replace(/\D/g, '').slice(0, 8);
    if (digitos.length <= 2) return digitos;
    if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
    return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4, 8)}`;
  };

  const formatarHora = (texto: string): string => {
    const digitos = texto.replace(/\D/g, '').slice(0, 4);
    if (digitos.length <= 2) return digitos;
    return `${digitos.slice(0, 2)}:${digitos.slice(2, 4)}`;
  };

  const converterParaISO = (dataStr: string, horaStr: string): string | null => {
    // Formato esperado dataStr: DD/MM/AAAA ou AAAA-MM-DD
    // Formato esperado horaStr: HH:mm
    if (!dataStr.trim() || !horaStr.trim()) return null;

    let ano = '';
    let mes = '';
    let dia = '';

    if (dataStr.includes('/')) {
      const partes = dataStr.split('/');
      if (partes.length === 3) {
        dia = partes[0].padStart(2, '0');
        mes = partes[1].padStart(2, '0');
        ano = partes[2];
      }
    } else if (dataStr.includes('-')) {
      const partes = dataStr.split('-');
      if (partes.length === 3) {
        ano = partes[0];
        mes = partes[1].padStart(2, '0');
        dia = partes[2].padStart(2, '0');
      }
    }

    const partesHora = horaStr.split(':');
    if (partesHora.length !== 2 || !partesHora[0] || !partesHora[1]) return null;

    const horas = partesHora[0].padStart(2, '0');
    const minutos = partesHora[1].padStart(2, '0');

    const numDia = Number(dia);
    const numMes = Number(mes);
    const numAno = Number(ano);
    const numHoras = Number(horas);
    const numMinutos = Number(minutos);

    if (
      ano.length !== 4 ||
      !numDia ||
      numDia < 1 ||
      numDia > 31 ||
      !numMes ||
      numMes < 1 ||
      numMes > 12 ||
      isNaN(numAno) ||
      isNaN(numHoras) ||
      numHoras < 0 ||
      numHoras > 23 ||
      isNaN(numMinutos) ||
      numMinutos < 0 ||
      numMinutos > 59
    ) {
      return null;
    }

    return `${ano}-${mes}-${dia}T${horas}:${minutos}:00`;
  };

  const handleAgendar = async () => {
    if (!selectedNotebook) {
      Alert.alert('Equipamento', 'Selecione um notebook disponível.');
      return;
    }

    const isoInicio = converterParaISO(dataInicio, horaInicio);
    const isoTermino = converterParaISO(dataTermino, horaTermino);

    if (!isoInicio || !isoTermino) {
      Alert.alert(
        'Data Inválida',
        'Por favor, preencha as datas no formato DD/MM/AAAA e horários no formato HH:mm.'
      );
      return;
    }

    if (new Date(isoTermino) <= new Date(isoInicio)) {
      Alert.alert('Horário Inválido', 'A data de término deve ser posterior à data de início.');
      return;
    }

    if (!purpose.trim()) {
      Alert.alert('Motivo Obrigatório', 'Informe a justificativa ou finalidade do uso.');
      return;
    }

    setIsSubmitting(true);

    try {
      await reservationService.createReservation({
        notebookId: selectedNotebook.id,
        startTime: isoInicio,
        endTime: isoTermino,
        purpose: purpose.trim(),
      });

      Alert.alert('Sucesso', 'Reserva agendada com sucesso!', [
        {
          text: 'Ver Minhas Reservas',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Não foi possível concluir a reserva.');
      Alert.alert('Falha ao Agendar', mensagem);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4B0082" />
        <Text style={styles.loadingText}>Carregando dados para agendamento...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#F8F6FD' }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom + 20, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contentBox, isDesktop && styles.contentBoxDesktop]}>
          <Text style={styles.title}>Nova Reserva</Text>
          <Text style={styles.subtitle}>
            Selecione o equipamento, datas e finalidade do uso (o local de retirada será confirmado no check-in)
          </Text>

          {/* Seleção de Notebook */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Notebook</Text>
            <Pressable
              style={({ pressed }) => [styles.selectBox, pressed && styles.selectBoxPressed]}
              onPress={() => setModalNotebookVisible(true)}
            >
              <Text style={styles.selectText}>
                {selectedNotebook
                  ? `${selectedNotebook.name} (${selectedNotebook.modelDescription})`
                  : 'Nenhum notebook disponível'}
              </Text>
              <Text style={styles.arrowText}>▼</Text>
            </Pressable>
          </View>

          {/* Data e Hora de Início */}
          <View style={styles.row}>
            <View style={[styles.fieldBlock, { flex: 1.2, marginRight: 10 }]}>
              <Text style={styles.label}>Data de Início</Text>
              <TextInput
                style={styles.input}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#7E758C"
                value={dataInicio}
                onChangeText={(texto) => setDataInicio(formatarData(texto))}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <View style={[styles.fieldBlock, { flex: 0.8 }]}>
              <Text style={styles.label}>Hora Início</Text>
              <TextInput
                style={styles.input}
                placeholder="09:00"
                placeholderTextColor="#7E758C"
                value={horaInicio}
                onChangeText={(texto) => setHoraInicio(formatarHora(texto))}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>

          {/* Data e Hora de Término */}
          <View style={styles.row}>
            <View style={[styles.fieldBlock, { flex: 1.2, marginRight: 10 }]}>
              <Text style={styles.label}>Data de Término</Text>
              <TextInput
                style={styles.input}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#7E758C"
                value={dataTermino}
                onChangeText={(texto) => setDataTermino(formatarData(texto))}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <View style={[styles.fieldBlock, { flex: 0.8 }]}>
              <Text style={styles.label}>Hora Término</Text>
              <TextInput
                style={styles.input}
                placeholder="12:00"
                placeholderTextColor="#7E758C"
                value={horaTermino}
                onChangeText={(texto) => setHoraTermino(formatarHora(texto))}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>

          {/* Motivo do Uso */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Finalidade / Motivo</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ex: Apresentação de projeto de móveis para cliente"
              placeholderTextColor="#7E758C"
              value={purpose}
              onChangeText={setPurpose}
              multiline
              numberOfLines={3}
            />
          </View>

          <PrimaryButton
            title="Confirmar Agendamento"
            onPress={handleAgendar}
            isLoading={isSubmitting}
            {...dataCy('btn-reservar')}
          />
        </View>

        {/* Modal de Notebooks */}
        <Modal
          visible={modalNotebookVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalNotebookVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setModalNotebookVisible(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Selecione um Notebook Disponível</Text>
              <FlatList
                data={notebooks}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalItem,
                      item.id === selectedNotebook?.id && styles.modalItemActive,
                      pressed && styles.modalItemPressed,
                    ]}
                    onPress={() => {
                      setSelectedNotebook(item);
                      setModalNotebookVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemTitle}>{item.name}</Text>
                    <Text style={styles.modalItemSubtitle}>{item.modelDescription}</Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyModalText}>Nenhum equipamento disponível no momento.</Text>
                }
              />
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F8F6FD',
    flexGrow: 1,
    justifyContent: 'center',
  },
  contentBox: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  contentBoxDesktop: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    shadowColor: '#7E22CE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F6FD',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E1B4B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  fieldBlock: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1B4B',
    marginBottom: 6,
  },
  input: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
  },
  selectBox: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectBoxPressed: {
    opacity: 0.8,
  },
  selectText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
    marginRight: 6,
  },
  arrowText: {
    fontSize: 10,
    color: '#4B0082',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemActive: {
    backgroundColor: '#FAF5FF',
    borderRadius: 8,
  },
  modalItemPressed: {
    backgroundColor: '#F3E8FF',
  },
  modalItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalItemSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyModalText: {
    textAlign: 'center',
    color: '#6B7280',
    paddingVertical: 20,
  },
});
