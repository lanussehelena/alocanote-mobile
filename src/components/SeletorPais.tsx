import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { PAISES, Pais } from '../constants/paises';

interface SeletorPaisProps {
  paisSelecionado: Pais;
  onSelecionarPais: (pais: Pais) => void;
}

export function SeletorPais({ paisSelecionado, onSelecionarPais }: SeletorPaisProps) {
  const [modalVisivel, setModalVisivel] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.ddiContainer}
        onPress={() => setModalVisivel(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.bandeira}>{paisSelecionado.bandeira}</Text>
        <Text style={styles.seta}>▼</Text>
        <View style={styles.divisor} />
        <Text style={styles.prefixo}>{paisSelecionado.ddi}</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisivel(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisivel(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Selecione o País</Text>
            <FlatList
              data={PAISES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.itemOpcao,
                    item.id === paisSelecionado.id && styles.itemOpcaoAtiva,
                  ]}
                  onPress={() => {
                    onSelecionarPais(item);
                    setModalVisivel(false);
                  }}
                >
                  <Text style={styles.bandeiraItem}>{item.bandeira}</Text>
                  <Text style={styles.nomeItem}>{item.nome}</Text>
                  <Text style={styles.ddiItem}>{item.ddi}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  ddiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingRight: 6,
  },
  bandeira: {
    fontSize: 18,
    marginRight: 4,
  },
  seta: {
    fontSize: 10,
    color: '#374151',
    marginRight: 8,
  },
  divisor: {
    width: 1,
    height: 22,
    backgroundColor: '#7E22CE',
    marginRight: 8,
  },
  prefixo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    maxHeight: 380,
  },
  modalTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  itemOpcao: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemOpcaoAtiva: {
    backgroundColor: '#FAF5FF',
    borderRadius: 8,
  },
  bandeiraItem: {
    fontSize: 22,
    marginRight: 10,
  },
  nomeItem: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  ddiItem: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7E22CE',
  },
});