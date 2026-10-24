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
  Image,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { reservationService } from '../services/reservationService';
import { getApiErrorMessage } from '../services/api';
import { ReservationResponseDTO, ReservationStatus } from '../types';

type LocationOptionType = 'LOJA' | 'OUTRO_LOCAL';

interface PlaceSearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

export function MinhasReservas() {
  const [reservas, setReservas] = useState<ReservationResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<number | null>(null);

  // Estados do Modal de Check-in (Retirada)
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [selectedReservaCheckIn, setSelectedReservaCheckIn] =
    useState<ReservationResponseDTO | null>(null);
  const [checkInLocationType, setCheckInLocationType] = useState<LocationOptionType>('LOJA');
  const [checkInAddress, setCheckInAddress] = useState('');
  const [checkInLatitude, setCheckInLatitude] = useState<number | null>(null);
  const [checkInLongitude, setCheckInLongitude] = useState<number | null>(null);
  const [checkInSuggestions, setCheckInSuggestions] = useState<PlaceSearchResult[]>([]);
  const [isGettingCheckInLocation, setIsGettingCheckInLocation] = useState(false);
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);

  // Estados do Modal de Devolução (Finalizar com local + foto automática)
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [selectedReservaReturn, setSelectedReservaReturn] =
    useState<ReservationResponseDTO | null>(null);
  const [returnLocationType, setReturnLocationType] = useState<LocationOptionType>('LOJA');
  const [returnAddress, setReturnAddress] = useState('');
  const [returnLatitude, setReturnLatitude] = useState<number | null>(null);
  const [returnLongitude, setReturnLongitude] = useState<number | null>(null);
  const [returnSuggestions, setReturnSuggestions] = useState<PlaceSearchResult[]>([]);
  const [returnPhotoBase64, setReturnPhotoBase64] = useState<string | null>(null);
  const [isGettingReturnLocation, setIsGettingReturnLocation] = useState(false);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMINISTRADOR';

  const carregarReservas = useCallback(async () => {
    try {
      const dados = await reservationService.listMyReservations();
      const ordenadas = [...dados].sort((a, b) => b.id - a.id);
      setReservas(ordenadas);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Erro ao buscar suas reservas.');
      Alert.alert('Erro', mensagem);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarReservas();
    const unsubscribe = navigation.addListener('focus', () => {
      carregarReservas();
    });
    return unsubscribe;
  }, [carregarReservas, navigation]);

  const onRefresh = () => {
    setIsRefreshing(true);
    carregarReservas();
  };

  const obterEnderecoPorCoordenadas = async (lat: number, lng: number): Promise<string> => {
    // 1. Geocodificação reversa nativa do dispositivo (Google Play Services / Apple CoreLocation)
    if (Platform.OS !== 'web') {
      try {
        const locais = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (Array.isArray(locais) && locais.length > 0) {
          const item = locais[0];
          const numero =
            item.streetNumber || (item.name && item.name !== item.street ? item.name : null);
          const ruaNumero = [item.street, numero].filter(Boolean).join(', ');
          const cidadeUf = [item.city || item.subregion, item.region].filter(Boolean).join(' - ');
          const cep = item.postalCode ? `CEP ${item.postalCode}` : null;

          const partes = [ruaNumero, item.district, cidadeUf, cep].filter(Boolean);
          if (partes.length > 0 && (ruaNumero || item.district)) {
            return partes.join(', ');
          }
        }
      } catch {
        // Continua para Nominatim abaixo
      }
    }

    // 2. Geocodificação reversa via OpenStreetMap Nominatim
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'pt-BR',
            'User-Agent': 'AlocaNoteApp/1.0',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data?.address) {
          const addr = data.address;
          const rua = addr.road || addr.pedestrian || addr.suburb;
          const numero = addr.house_number;
          const ruaNumero = [rua, numero].filter(Boolean).join(', ');
          const bairro = addr.suburb || addr.neighbourhood || addr.quarter;
          const cidade = addr.city || addr.town || addr.municipality || addr.village;
          const estado = addr.state_code || addr.state;
          const cidadeUf = [cidade, estado].filter(Boolean).join(' - ');
          const cep = addr.postcode ? `CEP ${addr.postcode}` : null;

          const partes = [ruaNumero, bairro !== rua ? bairro : null, cidadeUf, cep].filter(Boolean);
          if (partes.length > 0) {
            return partes.join(', ');
          }
        }
        if (data?.display_name) {
          return data.display_name;
        }
      }
    } catch {
      // Fallback para coordenadas formatadas
    }

    return `Coordenadas GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const obterPosicaoAtualDispositivo = async (
    mostrarAlerta = false
  ): Promise<{
    latitude: number;
    longitude: number;
    address: string;
  } | null> => {
    // 1. Usa o GPS nativo via expo-location (Android / iOS / Web)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (mostrarAlerta) {
          Alert.alert(
            'Permissão de Localização',
            'Permita o acesso à localização (GPS) nas configurações do aparelho para detectar seu endereço atual com precisão.'
          );
        }
        return null;
      }

      const servicoAtivo = await Location.hasServicesEnabledAsync();
      if (!servicoAtivo) {
        if (mostrarAlerta) {
          Alert.alert(
            'GPS Desativado',
            'Ative a localização (GPS) do seu aparelho e tente tocar em "Detectar Local" novamente.'
          );
        }
        return null;
      }

      let position: Location.LocationObject | null = null;
      try {
        position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
      } catch {
        try {
          position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        } catch {
          position = await Location.getLastKnownPositionAsync();
        }
      }

      if (position?.coords) {
        const { latitude, longitude } = position.coords;
        const address = await obterEnderecoPorCoordenadas(latitude, longitude);
        return { latitude, longitude, address };
      }
    } catch {
      // Continua para tentativa via navigator.geolocation (Web)
    }

    // 2. Fallback para navigator.geolocation (navegadores Web)
    const geo = (globalThis as any)?.navigator?.geolocation;
    if (geo && typeof geo.getCurrentPosition === 'function') {
      try {
        const coords = await new Promise<{ latitude: number; longitude: number }>(
          (resolve, reject) => {
            geo.getCurrentPosition(
              (pos: any) =>
                resolve({
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                }),
              (err: any) => reject(err),
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
          }
        );
        const address = await obterEnderecoPorCoordenadas(coords.latitude, coords.longitude);
        return { latitude: coords.latitude, longitude: coords.longitude, address };
      } catch {
        if (mostrarAlerta) {
          Alert.alert(
            'Não foi possível detectar o local',
            'Verifique se a permissão de localização e o GPS estão ativados ou digite o CEP/endereço manualmente.'
          );
        }
      }
    } else if (mostrarAlerta) {
      Alert.alert(
        'Não foi possível detectar o local',
        'Verifique se o GPS está ativado ou digite o CEP/endereço manualmente.'
      );
    }

    return null;
  };

  const pesquisarEnderecosAPI = async (termo: string): Promise<PlaceSearchResult[]> => {
    const query = termo.trim();
    if (!query) return [];

    // Verifica se o usuário digitou um CEP (8 dígitos)
    const apenasDigitos = query.replace(/\D/g, '');
    if (apenasDigitos.length === 8) {
      try {
        const viaCepRes = await fetch(`https://viacep.com.br/ws/${apenasDigitos}/json/`);
        if (viaCepRes.ok) {
          const cepData = await viaCepRes.json();
          if (!cepData.erro) {
            const enderecoFormatado = [
              cepData.logradouro,
              cepData.bairro,
              `${cepData.localidade} - ${cepData.uf}`,
              `CEP ${cepData.cep}`,
            ]
              .filter(Boolean)
              .join(', ');

            const nominatimRes = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                `${cepData.logradouro || ''} ${cepData.localidade} ${cepData.uf} Brasil`
              )}&limit=1`,
              {
                headers: {
                  'Accept-Language': 'pt-BR',
                  'User-Agent': 'AlocaNoteApp/1.0',
                },
              }
            );
            if (nominatimRes.ok) {
              const nomList = await nominatimRes.json();
              if (Array.isArray(nomList) && nomList.length > 0) {
                return [
                  {
                    display_name: enderecoFormatado,
                    lat: nomList[0].lat,
                    lon: nomList[0].lon,
                  },
                ];
              }
            }
            return [{ display_name: enderecoFormatado, lat: '-7.1195', lon: '-34.8450' }];
          }
        }
      } catch {
        // Continua para busca geral
      }
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=br&limit=4&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'pt-BR',
            'User-Agent': 'AlocaNoteApp/1.0',
          },
        }
      );
      if (response.ok) {
        const results = await response.json();
        if (Array.isArray(results)) {
          return results;
        }
      }
    } catch {
      // Fallback caso sem internet externa
    }
    return [];
  };

  const abrirNoGoogleMaps = async (
    lat?: number | null,
    lng?: number | null,
    endereco?: string | null
  ) => {
    let url = 'https://www.google.com/maps';
    if (lat != null && lng != null) {
      url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    } else if (endereco && endereco.trim().length > 0) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco.trim())}`;
    }

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o Google Maps neste dispositivo.');
    }
  };

  // --- Fluxo de Check-in (Retirada) ---
  const capturarLocalizacaoCheckIn = async (
    reservaRef?: ReservationResponseDTO | null,
    manual = false
  ) => {
    setIsGettingCheckInLocation(true);
    setCheckInSuggestions([]);
    try {
      const pos = await obterPosicaoAtualDispositivo(manual);
      if (pos) {
        setCheckInLatitude(pos.latitude);
        setCheckInLongitude(pos.longitude);
        setCheckInAddress(pos.address);
      } else if (reservaRef?.locationName && !checkInAddress) {
        setCheckInAddress(reservaRef.locationName);
      }
    } finally {
      setIsGettingCheckInLocation(false);
    }
  };

  const buscarEnderecoCheckInNoGoogle = async () => {
    if (!checkInAddress.trim()) {
      Alert.alert('Endereço', 'Digite um endereço, CEP ou nome do local para buscar.');
      return;
    }

    setIsGettingCheckInLocation(true);
    try {
      const resultados = await pesquisarEnderecosAPI(checkInAddress);
      if (resultados.length > 0) {
        setCheckInSuggestions(resultados);
        const primeiro = resultados[0];
        setCheckInAddress(primeiro.display_name);
        setCheckInLatitude(parseFloat(primeiro.lat));
        setCheckInLongitude(parseFloat(primeiro.lon));
      } else {
        Alert.alert(
          'Endereço Definido',
          'Você pode tocar em "Confirmar no Google Maps" para visualizar o local diretamente no Google Maps.'
        );
      }
    } finally {
      setIsGettingCheckInLocation(false);
    }
  };

  const handleAbrirCheckIn = (reserva: ReservationResponseDTO) => {
    setSelectedReservaCheckIn(reserva);
    const isLoja = reserva.locationName?.toLowerCase().includes('loja') ?? true;
    setCheckInLocationType(isLoja ? 'LOJA' : 'OUTRO_LOCAL');
    setCheckInAddress(reserva.locationName || 'Loja Central');
    setCheckInLatitude(null);
    setCheckInLongitude(null);
    setCheckInSuggestions([]);
    setCheckInModalVisible(true);
    capturarLocalizacaoCheckIn(reserva);
  };

  const handleConfirmarCheckIn = async () => {
    if (!selectedReservaCheckIn) return;

    const enderecoFinal = checkInAddress.trim();
    if (!enderecoFinal) {
      Alert.alert(
        'Local Obrigatório',
        'Confirme o endereço ou referência do local de retirada antes de concluir o check-in.'
      );
      return;
    }

    setIsSubmittingCheckIn(true);
    setLoadingActionId(selectedReservaCheckIn.id);
    try {
      await reservationService.checkInReservation(selectedReservaCheckIn.id, {
        locationType: checkInLocationType,
        address: enderecoFinal,
        latitude: checkInLatitude,
        longitude: checkInLongitude,
      });

      setCheckInModalVisible(false);
      setSelectedReservaCheckIn(null);
      Alert.alert(
        'Check-in Realizado!',
        `Retirada registrada com sucesso (${
          checkInLocationType === 'LOJA' ? 'Na Loja' : 'Outro Local'
        }). Bom trabalho!`
      );
      await carregarReservas();
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Não foi possível realizar o check-in.');
      Alert.alert('Falha no Check-in', mensagem);
    } finally {
      setIsSubmittingCheckIn(false);
      setLoadingActionId(null);
    }
  };

  // --- Fluxo de Devolução / Finalização (Local + Foto Automática) ---
  const capturarLocalizacaoDevolucao = async (manual = false) => {
    setIsGettingReturnLocation(true);
    setReturnSuggestions([]);
    try {
      const pos = await obterPosicaoAtualDispositivo(manual);
      if (pos) {
        setReturnLatitude(pos.latitude);
        setReturnLongitude(pos.longitude);
        setReturnAddress(pos.address);
      }
    } finally {
      setIsGettingReturnLocation(false);
    }
  };

  const buscarEnderecoDevolucaoNoGoogle = async () => {
    if (!returnAddress.trim()) {
      Alert.alert('Endereço', 'Digite um endereço, CEP ou nome do local para buscar.');
      return;
    }

    setIsGettingReturnLocation(true);
    try {
      const resultados = await pesquisarEnderecosAPI(returnAddress);
      if (resultados.length > 0) {
        setReturnSuggestions(resultados);
        const primeiro = resultados[0];
        setReturnAddress(primeiro.display_name);
        setReturnLatitude(parseFloat(primeiro.lat));
        setReturnLongitude(parseFloat(primeiro.lon));
      } else {
        Alert.alert(
          'Endereço Definido',
          'Você pode tocar em "Confirmar no Google Maps" para visualizar o local diretamente no Google Maps.'
        );
      }
    } finally {
      setIsGettingReturnLocation(false);
    }
  };

  const capturarFotoDevolucao = async (usarGaleriaComoAlternativa = false) => {
    setIsCapturingPhoto(true);
    try {
      if (!usarGaleriaComoAlternativa) {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraPermission.status === 'granted') {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.25,
            base64: true,
          });

          if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            if (asset.base64) {
              setReturnPhotoBase64(`data:image/jpeg;base64,${asset.base64}`);
              return;
            }
          } else {
            return;
          }
        }
      }

      // Fallback para galeria caso esteja em emulador sem câmera ou usuário escolha galeria
      const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (galleryPermission.status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Permita o acesso à câmera para registrar a foto automática de devolução do notebook.'
        );
        return;
      }

      const galleryResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.25,
        base64: true,
      });

      if (!galleryResult.canceled && galleryResult.assets && galleryResult.assets.length > 0) {
        const asset = galleryResult.assets[0];
        if (asset.base64) {
          setReturnPhotoBase64(`data:image/jpeg;base64,${asset.base64}`);
        }
      }
    } catch {
      Alert.alert(
        'Câmera',
        'Não foi possível abrir a câmera automaticamente. Toque em "Abrir Câmera" ou "Galeria" para anexar a foto do notebook.'
      );
    } finally {
      setIsCapturingPhoto(false);
    }
  };

  const handleAbrirDevolucao = async (reserva: ReservationResponseDTO) => {
    setSelectedReservaReturn(reserva);
    const tipoInicial: LocationOptionType =
      reserva.checkInLocationType === 'OUTRO_LOCAL' ? 'OUTRO_LOCAL' : 'LOJA';
    setReturnLocationType(tipoInicial);
    setReturnAddress(reserva.checkInAddress || reserva.locationName || 'Loja Central');
    setReturnLatitude(null);
    setReturnLongitude(null);
    setReturnSuggestions([]);
    setReturnPhotoBase64(null);
    setReturnModalVisible(true);

    // Dispara automaticamente a captura do local e a abertura automática da câmera
    capturarLocalizacaoDevolucao();
    setTimeout(() => {
      capturarFotoDevolucao(false);
    }, 350);
  };

  const handleConfirmarDevolucao = async () => {
    if (!selectedReservaReturn) return;

    const enderecoFinal = returnAddress.trim();
    if (!enderecoFinal) {
      Alert.alert(
        'Local da Devolução',
        'Confirme o endereço ou local onde o notebook está sendo devolvido.'
      );
      return;
    }

    if (!returnPhotoBase64) {
      Alert.alert(
        'Foto Obrigatória na Devolução',
        'Para concluir a devolução é necessário registrar a foto do notebook.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Tirar Foto Agora',
            onPress: () => capturarFotoDevolucao(false),
          },
        ]
      );
      return;
    }

    setIsSubmittingReturn(true);
    setLoadingActionId(selectedReservaReturn.id);
    try {
      await reservationService.finishReservation(selectedReservaReturn.id, {
        locationType: returnLocationType,
        address: enderecoFinal,
        latitude: returnLatitude,
        longitude: returnLongitude,
        photoUrl: returnPhotoBase64,
      });

      setReturnModalVisible(false);
      setSelectedReservaReturn(null);
      setReturnPhotoBase64(null);
      Alert.alert(
        'Devolução Registrada!',
        'O local da devolução e a foto do equipamento foram salvos com sucesso.'
      );
      await carregarReservas();
    } catch (error) {
      const mensagem = getApiErrorMessage(error, 'Não foi possível finalizar a reserva.');
      Alert.alert('Falha na Devolução', mensagem);
    } finally {
      setIsSubmittingReturn(false);
      setLoadingActionId(null);
    }
  };

    const handleExcluirReserva = (reservaId: number) => {
    Alert.alert(
      'Excluir Reserva',
      'Tem certeza de que deseja excluir permanentemente esta reserva? Essa ação é irreversível.',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, excluir',
          style: 'destructive',
          onPress: async () => {
            setLoadingActionId(reservaId);
            try {
              await reservationService.deleteReservation(reservaId);
              Alert.alert('Sucesso', 'Registro de reserva excluído com sucesso.');
              await carregarReservas();
            } catch (error) {
              const mensagem = getApiErrorMessage(error, 'Não foi possível excluir a reserva.');
              Alert.alert('Falha', mensagem);
            } finally {
              setLoadingActionId(null);
            }
          },
        },
      ]
    );
  };

  const handleCancelar = async (reservaId: number) => {
    Alert.alert(
      'Cancelar Reserva',
      'Tem certeza de que deseja cancelar esta reserva?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            setLoadingActionId(reservaId);
            try {
              await reservationService.cancelReservation(reservaId);
              Alert.alert('Sucesso', 'Reserva cancelada.');
              await carregarReservas();
            } catch (error) {
              const mensagem = getApiErrorMessage(error, 'Não foi possível cancelar a reserva.');
              Alert.alert('Falha', mensagem);
            } finally {
              setLoadingActionId(null);
            }
          },
        },
      ]
    );
  };

  const formatarData = (isoDate?: string | null) => {
    if (!isoDate) return '';
    try {
      const data = new Date(isoDate);
      if (isNaN(data.getTime())) return isoDate;
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      const horas = String(data.getHours()).padStart(2, '0');
      const minutos = String(data.getMinutes()).padStart(2, '0');
      return `${dia}/${mes}/${ano} às ${horas}:${minutos}`;
    } catch {
      return isoDate;
    }
  };

  const formatarTipoLocal = (tipo?: string | null) => {
    if (!tipo) return 'Não informado';
    if (tipo === 'LOJA') return 'Na Loja';
    if (tipo === 'OUTRO_LOCAL') return 'Outro Local';
    return tipo;
  };

  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.AGENDADO:
        return '#2563EB';
      case ReservationStatus.CHECKED_IN:
        return '#059669';
      case ReservationStatus.FINALIZADO:
        return '#4B5563';
      case ReservationStatus.CANCELADO:
        return '#DC2626';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.AGENDADO:
        return 'Agendado';
      case ReservationStatus.CHECKED_IN:
        return 'Em Andamento (Check-in)';
      case ReservationStatus.FINALIZADO:
        return 'Finalizado';
      case ReservationStatus.CANCELADO:
        return 'Cancelado';
      default:
        return status;
    }
  };

  const renderItem = ({ item }: { item: ReservationResponseDTO }) => {
    const isActionLoading = loadingActionId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.notebookName}>{item.notebookName}</Text>
          <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '1A' }]}>
            <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <Text style={styles.modelDescription}>{item.notebookModel}</Text>

        {isAdmin && item.userName ? (
          <View style={styles.adminUserBadgeRow}>
            <Text style={styles.adminUserBadgeLabel}>👤 Solicitante:</Text>
            <Text style={styles.adminUserBadgeName}>{item.userName}</Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Início:</Text>
          <Text style={styles.infoValue}>{formatarData(item.startTime)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Término:</Text>
          <Text style={styles.infoValue}>{formatarData(item.endTime)}</Text>
        </View>

        {item.locationName ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Previsto:</Text>
            <Text style={styles.infoValue}>{item.locationName}</Text>
          </View>
        ) : null}

        {item.purpose ? (
          <View style={styles.purposeBox}>
            <Text style={styles.purposeLabel}>Motivo:</Text>
            <Text style={styles.purposeText}>{item.purpose}</Text>
          </View>
        ) : null}

        {/* Registro do Check-in (Local de Retirada confirmado) */}
        {(item.checkInAddress || item.checkInLocationType || item.checkInAt) && (
          <View style={styles.recordBoxCheckIn}>
            <View style={styles.recordHeaderRow}>
              <Text style={styles.recordTitleCheckIn}>📍 Retirada (Check-in)</Text>
              <View style={styles.recordTagCheckIn}>
                <Text style={styles.recordTagTextCheckIn}>
                  {formatarTipoLocal(item.checkInLocationType)}
                </Text>
              </View>
            </View>
            {item.checkInAddress ? (
              <Text style={styles.recordAddressText}>{item.checkInAddress}</Text>
            ) : null}
            {item.checkInAt ? (
              <Text style={styles.recordTimestamp}>
                Retirado em: {formatarData(item.checkInAt)}
              </Text>
            ) : null}
            <Pressable
              style={({ pressed }) => [
                styles.mapLinkButton,
                pressed && styles.mapLinkButtonPressed,
              ]}
              onPress={() =>
                abrirNoGoogleMaps(item.checkInLatitude, item.checkInLongitude, item.checkInAddress)
              }
            >
              <Text style={styles.mapLinkButtonText}>🗺️ Ver local de retirada no Google Maps</Text>
            </Pressable>
          </View>
        )}

        {/* Registro da Devolução (Local + Foto Automática) */}
        {(item.returnAddress || item.returnLocationType || item.returnPhotoUrl || item.returnedAt) && (
          <View style={styles.recordBoxReturn}>
            <View style={styles.recordHeaderRow}>
              <Text style={styles.recordTitleReturn}>🏁 Devolução Registrada</Text>
              <View style={styles.recordTagReturn}>
                <Text style={styles.recordTagTextReturn}>
                  {formatarTipoLocal(item.returnLocationType)}
                </Text>
              </View>
            </View>
            {item.returnAddress ? (
              <Text style={styles.recordAddressText}>{item.returnAddress}</Text>
            ) : null}
            {item.returnedAt ? (
              <Text style={styles.recordTimestamp}>
                Devolvido em: {formatarData(item.returnedAt)}
              </Text>
            ) : null}
            <Pressable
              style={({ pressed }) => [
                styles.mapLinkButton,
                pressed && styles.mapLinkButtonPressed,
              ]}
              onPress={() =>
                abrirNoGoogleMaps(item.returnLatitude, item.returnLongitude, item.returnAddress)
              }
            >
              <Text style={styles.mapLinkButtonText}>🗺️ Ver local de devolução no Google Maps</Text>
            </Pressable>

            {item.returnPhotoUrl ? (
              <View style={styles.cardPhotoContainer}>
                <Text style={styles.cardPhotoLabel}>📷 Foto de devolução do equipamento:</Text>
                <Image
                  source={{ uri: item.returnPhotoUrl }}
                  style={styles.cardReturnPhoto}
                  resizeMode="cover"
                />
              </View>
            ) : null}
          </View>
        )}

        {/* Botões contextuais pelo ciclo de vida */}
        {item.status === ReservationStatus.AGENDADO && (
          <View style={styles.actionsContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.checkInButton,
                pressed && styles.checkInButtonPressed,
                isActionLoading && styles.buttonDisabled,
              ]}
              onPress={() => handleAbrirCheckIn(item)}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.actionButtonText}>Fazer Check-in</Text>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
                isActionLoading && styles.buttonDisabled,
              ]}
              onPress={() => handleCancelar(item.id)}
              disabled={isActionLoading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
          </View>
        )}

        {item.status === ReservationStatus.CHECKED_IN && (
          <View style={styles.actionsContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.finishButton,
                pressed && styles.finishButtonPressed,
                isActionLoading && styles.buttonDisabled,
              ]}
              onPress={() => handleAbrirDevolucao(item)}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.actionButtonText}>Devolver / Finalizar</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
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
          <Text style={styles.headerTitle}>{isAdmin ? 'Gestão de Reservas' : 'Minhas Reservas'}</Text>
          <View style={{ width: 60 }} />
        </View>
        <Text style={styles.headerSubtitle}>
          {isAdmin
            ? 'Visualização master de todas as reservas da empresa'
            : 'Acompanhamento, check-in e devoluções'}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7E22CE" />
          <Text style={styles.loadingText}>Carregando reservas...</Text>
        </View>
      ) : (
        <FlatList
          data={reservas}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: 85 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#7E22CE']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Nenhuma reserva encontrada</Text>
              <Text style={styles.emptySubtitle}>
                Vá até a aba "Notebooks" e selecione um equipamento para agendar.
              </Text>
            </View>
          }
        />
      )}

      {/* MODAL DE CONFIRMAÇÃO DE CHECK-IN (LOCAL DE RETIRADA + GOOGLE MAPS) */}
      <Modal
        visible={checkInModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isSubmittingCheckIn) setCheckInModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Confirmar Local de Retirada</Text>
              <Text style={styles.modalSubtitle}>
                {selectedReservaCheckIn
                  ? `Equipamento: ${selectedReservaCheckIn.notebookName}`
                  : 'Confirme onde você está retirando o notebook'}
              </Text>

              <Text style={styles.sectionLabel}>Onde está sendo feita a retirada?</Text>
              <View style={styles.locationTypeRow}>
                <Pressable
                  style={[
                    styles.locationTypeButton,
                    checkInLocationType === 'LOJA' && styles.locationTypeButtonActive,
                  ]}
                  onPress={() => {
                    setCheckInLocationType('LOJA');
                    if (!checkInAddress.trim()) {
                      setCheckInAddress('Loja Central');
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.locationTypeButtonText,
                      checkInLocationType === 'LOJA' && styles.locationTypeButtonTextActive,
                    ]}
                  >
                    🏪 Na Loja
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.locationTypeButton,
                    checkInLocationType === 'OUTRO_LOCAL' && styles.locationTypeButtonActive,
                  ]}
                  onPress={() => setCheckInLocationType('OUTRO_LOCAL')}
                >
                  <Text
                    style={[
                      styles.locationTypeButtonText,
                      checkInLocationType === 'OUTRO_LOCAL' && styles.locationTypeButtonTextActive,
                    ]}
                  >
                    📍 Outro Local
                  </Text>
                </Pressable>
              </View>

              {/* Bloco de Geolocalização / Google Maps */}
              <View style={styles.googleCard}>
                <View style={styles.googleCardHeader}>
                  <Text style={styles.googleCardTitle}>🌍 Localização Google Maps</Text>
                  {isGettingCheckInLocation && (
                    <ActivityIndicator size="small" color="#059669" />
                  )}
                </View>

                {checkInLatitude != null && checkInLongitude != null ? (
                  <Text style={styles.coordsText}>
                    Coordenadas: {checkInLatitude.toFixed(5)}, {checkInLongitude.toFixed(5)}
                  </Text>
                ) : (
                  <Text style={styles.coordsText}>
                    {isGettingCheckInLocation
                      ? 'Consultando localização atual...'
                      : 'Busque o endereço/CEP abaixo ou confirme no Google Maps'}
                  </Text>
                )}

                <View style={styles.googleActionsRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.googleSmallButton,
                      pressed && styles.googleSmallButtonPressed,
                    ]}
                    onPress={() => capturarLocalizacaoCheckIn(selectedReservaCheckIn, true)}
                    disabled={isGettingCheckInLocation}
                  >
                    <Text style={styles.googleSmallButtonText}>🔄 Detectar Local</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.googleSmallButton,
                      styles.googleMapsOpenBtn,
                      pressed && styles.googleSmallButtonPressed,
                    ]}
                    onPress={() =>
                      abrirNoGoogleMaps(checkInLatitude, checkInLongitude, checkInAddress)
                    }
                  >
                    <Text style={styles.googleMapsOpenBtnText}>🗺️ Confirmar no Google Maps</Text>
                  </Pressable>
                </View>
              </View>

              <Text style={styles.sectionLabel}>Endereço, CEP ou Referência da Retirada</Text>
              <TextInput
                style={styles.addressInput}
                placeholder="Digite o endereço, CEP ou nome do local da retirada"
                placeholderTextColor="#9CA3AF"
                value={checkInAddress}
                onChangeText={setCheckInAddress}
                multiline
              />

              <Pressable
                style={({ pressed }) => [
                  styles.geocodeSearchButton,
                  pressed && styles.geocodeSearchButtonPressed,
                ]}
                onPress={buscarEnderecoCheckInNoGoogle}
                disabled={isGettingCheckInLocation}
              >
                <Text style={styles.geocodeSearchButtonText}>
                  🔍 Buscar endereço / CEP no Mapa
                </Text>
              </Pressable>

              {checkInSuggestions.length > 1 && (
                <View style={styles.suggestionsBox}>
                  <Text style={styles.suggestionsTitle}>Endereços encontrados (toque para selecionar):</Text>
                  {checkInSuggestions.map((sug, index) => (
                    <Pressable
                      key={`${sug.lat}-${sug.lon}-${index}`}
                      style={styles.suggestionItem}
                      onPress={() => {
                        setCheckInAddress(sug.display_name);
                        setCheckInLatitude(parseFloat(sug.lat));
                        setCheckInLongitude(parseFloat(sug.lon));
                        setCheckInSuggestions([]);
                      }}
                    >
                      <Text style={styles.suggestionText}>{sug.display_name}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={styles.modalFooterButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalCancelBtn,
                    pressed && styles.modalCancelBtnPressed,
                  ]}
                  onPress={() => setCheckInModalVisible(false)}
                  disabled={isSubmittingCheckIn}
                >
                  <Text style={styles.modalCancelBtnText}>Voltar</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.modalConfirmCheckInBtn,
                    pressed && styles.checkInButtonPressed,
                    isSubmittingCheckIn && styles.buttonDisabled,
                  ]}
                  onPress={handleConfirmarCheckIn}
                  disabled={isSubmittingCheckIn}
                >
                  {isSubmittingCheckIn ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.modalConfirmBtnText}>Confirmar Check-in</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL DE DEVOLUÇÃO / FINALIZAÇÃO (LOCAL DA DEVOLUÇÃO + FOTO AUTOMÁTICA) */}
      <Modal
        visible={returnModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!isSubmittingReturn) setReturnModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Registrar Devolução</Text>
              <Text style={styles.modalSubtitle}>
                {selectedReservaReturn
                  ? `Equipamento: ${selectedReservaReturn.notebookName}`
                  : 'Confirme o local da devolução e a foto do notebook'}
              </Text>

              {/* Seção da Foto Automática */}
              <Text style={styles.sectionLabel}>📷 Foto Automática do Notebook na Devolução</Text>
              <View style={styles.photoBox}>
                {returnPhotoBase64 ? (
                  <View style={styles.photoPreviewWrapper}>
                    <Image
                      source={{ uri: returnPhotoBase64 }}
                      style={styles.returnPhotoPreview}
                      resizeMode="cover"
                    />
                    <Text style={styles.photoSuccessText}>✅ Foto capturada e pronta para envio</Text>
                  </View>
                ) : (
                  <View style={styles.photoPlaceholder}>
                    {isCapturingPhoto ? (
                      <>
                        <ActivityIndicator size="small" color="#5B1B8E" />
                        <Text style={styles.photoPlaceholderText}>Abrindo câmera...</Text>
                      </>
                    ) : (
                      <Text style={styles.photoPlaceholderText}>
                        Nenhuma foto capturada ainda. Tire uma foto do equipamento para registrar a devolução.
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.photoButtonsRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.photoActionBtn,
                      pressed && styles.photoActionBtnPressed,
                    ]}
                    onPress={() => capturarFotoDevolucao(false)}
                    disabled={isCapturingPhoto}
                  >
                    <Text style={styles.photoActionBtnText}>
                      {returnPhotoBase64 ? '📷 Tirar Outra Foto' : '📷 Abrir Câmera'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.photoSecondaryBtn,
                      pressed && styles.photoSecondaryBtnPressed,
                    ]}
                    onPress={() => capturarFotoDevolucao(true)}
                    disabled={isCapturingPhoto}
                  >
                    <Text style={styles.photoSecondaryBtnText}>🖼️ Galeria</Text>
                  </Pressable>
                </View>
              </View>

              {/* Seletor do Local de Devolução */}
              <Text style={styles.sectionLabel}>Onde está sendo feita a devolução?</Text>
              <View style={styles.locationTypeRow}>
                <Pressable
                  style={[
                    styles.locationTypeButton,
                    returnLocationType === 'LOJA' && styles.locationTypeButtonActive,
                  ]}
                  onPress={() => setReturnLocationType('LOJA')}
                >
                  <Text
                    style={[
                      styles.locationTypeButtonText,
                      returnLocationType === 'LOJA' && styles.locationTypeButtonTextActive,
                    ]}
                  >
                    🏪 Na Loja
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.locationTypeButton,
                    returnLocationType === 'OUTRO_LOCAL' && styles.locationTypeButtonActive,
                  ]}
                  onPress={() => setReturnLocationType('OUTRO_LOCAL')}
                >
                  <Text
                    style={[
                      styles.locationTypeButtonText,
                      returnLocationType === 'OUTRO_LOCAL' && styles.locationTypeButtonTextActive,
                    ]}
                  >
                    📍 Outro Local
                  </Text>
                </Pressable>
              </View>

              {/* Bloco de Geolocalização / Google Maps da Devolução */}
              <View style={styles.googleCard}>
                <View style={styles.googleCardHeader}>
                  <Text style={styles.googleCardTitle}>🌍 Localização Google Maps</Text>
                  {isGettingReturnLocation && (
                    <ActivityIndicator size="small" color="#5B1B8E" />
                  )}
                </View>

                {returnLatitude != null && returnLongitude != null ? (
                  <Text style={styles.coordsText}>
                    Coordenadas: {returnLatitude.toFixed(5)}, {returnLongitude.toFixed(5)}
                  </Text>
                ) : (
                  <Text style={styles.coordsText}>
                    {isGettingReturnLocation
                      ? 'Consultando localização da devolução...'
                      : 'Busque o endereço/CEP abaixo ou confirme no Google Maps'}
                  </Text>
                )}

                <View style={styles.googleActionsRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.googleSmallButton,
                      pressed && styles.googleSmallButtonPressed,
                    ]}
                    onPress={() => capturarLocalizacaoDevolucao(true)}
                    disabled={isGettingReturnLocation}
                  >
                    <Text style={styles.googleSmallButtonText}>🔄 Detectar Local</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.googleSmallButton,
                      styles.googleMapsOpenBtn,
                      pressed && styles.googleSmallButtonPressed,
                    ]}
                    onPress={() =>
                      abrirNoGoogleMaps(returnLatitude, returnLongitude, returnAddress)
                    }
                  >
                    <Text style={styles.googleMapsOpenBtnText}>🗺️ Confirmar no Google Maps</Text>
                  </Pressable>
                </View>
              </View>

              <Text style={styles.sectionLabel}>Endereço, CEP ou Local da Devolução Confirmado</Text>
              <TextInput
                style={styles.addressInput}
                placeholder="Digite o endereço, CEP ou nome do local da devolução"
                placeholderTextColor="#9CA3AF"
                value={returnAddress}
                onChangeText={setReturnAddress}
                multiline
              />

              <Pressable
                style={({ pressed }) => [
                  styles.geocodeSearchButton,
                  pressed && styles.geocodeSearchButtonPressed,
                ]}
                onPress={buscarEnderecoDevolucaoNoGoogle}
                disabled={isGettingReturnLocation}
              >
                <Text style={styles.geocodeSearchButtonText}>
                  🔍 Buscar endereço / CEP no Mapa
                </Text>
              </Pressable>

              {returnSuggestions.length > 1 && (
                <View style={styles.suggestionsBox}>
                  <Text style={styles.suggestionsTitle}>Endereços encontrados (toque para selecionar):</Text>
                  {returnSuggestions.map((sug, index) => (
                    <Pressable
                      key={`${sug.lat}-${sug.lon}-${index}`}
                      style={styles.suggestionItem}
                      onPress={() => {
                        setReturnAddress(sug.display_name);
                        setReturnLatitude(parseFloat(sug.lat));
                        setReturnLongitude(parseFloat(sug.lon));
                        setReturnSuggestions([]);
                      }}
                    >
                      <Text style={styles.suggestionText}>{sug.display_name}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={styles.modalFooterButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalCancelBtn,
                    pressed && styles.modalCancelBtnPressed,
                  ]}
                  onPress={() => setReturnModalVisible(false)}
                  disabled={isSubmittingReturn}
                >
                  <Text style={styles.modalCancelBtnText}>Voltar</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.modalConfirmReturnBtn,
                    pressed && styles.finishButtonPressed,
                    isSubmittingReturn && styles.buttonDisabled,
                  ]}
                  onPress={handleConfirmarDevolucao}
                  disabled={isSubmittingReturn}
                >
                  {isSubmittingReturn ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.modalConfirmBtnText}>Concluir Devolução</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  headerSubtitle: {
    color: '#E9D5FF',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
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
    marginBottom: 6,
  },
  notebookName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modelDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    width: 68,
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
  },
  purposeBox: {
    marginTop: 8,
    backgroundColor: '#FAF5FF',
    padding: 10,
    borderRadius: 8,
  },
  purposeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B21A8',
    marginBottom: 2,
  },
  purposeText: {
    fontSize: 13,
    color: '#374151',
  },
  recordBoxCheckIn: {
    marginTop: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 10,
  },
  recordBoxReturn: {
    marginTop: 10,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 10,
    padding: 10,
  },
  recordHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recordTitleCheckIn: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  recordTitleReturn: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4C1D95',
  },
  recordTagCheckIn: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recordTagTextCheckIn: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  recordTagReturn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recordTagTextReturn: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5B21B6',
  },
  recordAddressText: {
    fontSize: 13,
    color: '#1F2937',
    marginTop: 2,
    lineHeight: 18,
  },
  recordTimestamp: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  mapLinkButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  mapLinkButtonPressed: {
    backgroundColor: '#F1F5F9',
  },
  mapLinkButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  cardPhotoContainer: {
    marginTop: 10,
    alignItems: 'flex-start',
  },
  cardPhotoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4C1D95',
    marginBottom: 6,
  },
  cardReturnPhoto: {
    width: 220,
    height: 140,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInButton: {
    backgroundColor: '#059669',
  },
  checkInButtonPressed: {
    backgroundColor: '#047857',
  },
  finishButton: {
    backgroundColor: '#4B0082',
  },
  finishButtonPressed: {
    backgroundColor: '#3A0066',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  cancelButtonPressed: {
    backgroundColor: '#FEF2F2',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelButtonText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
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
    paddingVertical: 48,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Estilos dos Modais
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E1B4B',
    marginBottom: 8,
    marginTop: 6,
  },
  locationTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  locationTypeButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationTypeButtonActive: {
    borderColor: '#5B1B8E',
    backgroundColor: '#F3E8FF',
  },
  locationTypeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  locationTypeButtonTextActive: {
    color: '#5B1B8E',
  },
  googleCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  googleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  googleCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  coordsText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  googleActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  googleSmallButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleSmallButtonPressed: {
    opacity: 0.8,
  },
  googleSmallButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  googleMapsOpenBtn: {
    flex: 1,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  googleMapsOpenBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  addressInput: {
    minHeight: 68,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D8B4FE',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
  },
  geocodeSearchButton: {
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  geocodeSearchButtonPressed: {
    backgroundColor: '#DBEAFE',
  },
  geocodeSearchButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  suggestionsBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
  },
  suggestionsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  suggestionText: {
    fontSize: 12,
    color: '#1E293B',
  },
  photoBox: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    alignItems: 'center',
  },
  photoPreviewWrapper: {
    alignItems: 'center',
    marginBottom: 10,
  },
  returnPhotoPreview: {
    width: 240,
    height: 160,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#7E22CE',
  },
  photoSuccessText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  photoPlaceholder: {
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  photoButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  photoActionBtn: {
    flex: 1,
    height: 40,
    backgroundColor: '#5B1B8E',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoActionBtnPressed: {
    backgroundColor: '#4C1D95',
  },
  photoActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  photoSecondaryBtn: {
    paddingHorizontal: 14,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C4B5FD',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoSecondaryBtnPressed: {
    backgroundColor: '#F3E8FF',
  },
  photoSecondaryBtnText: {
    color: '#5B1B8E',
    fontSize: 13,
    fontWeight: '700',
  },
  modalFooterButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 0.8,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  modalCancelBtnPressed: {
    backgroundColor: '#F3F4F6',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  modalConfirmCheckInBtn: {
    flex: 1.4,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmReturnBtn: {
    flex: 1.4,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#4B0082',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  adminUserBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D8B4FE',
    gap: 6,
  },
  adminUserBadgeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B21A8',
  },
  adminUserBadgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  adminDeleteBtn: {
    marginTop: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminDeleteBtnPressed: {
    backgroundColor: '#FEE2E2',
  },
  adminDeleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
});
