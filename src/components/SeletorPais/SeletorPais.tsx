import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { PAISES, Pais } from '../../constants/paises';
import { styles } from './SeletorPais.styles';

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