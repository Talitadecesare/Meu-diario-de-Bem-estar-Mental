import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  Alert,
  Button
} from 'react-native';

import * as Database from './services/Database';
import Formulario from './components/Formulario';
import ListaRegistros from './components/ListaRegistros';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system'; 

export default function App() {
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [ordenacao, setOrdenacao] = useState('recentes'); 

  useEffect(() => {
    const init = async () => {
      const dados = await Database.carregarDados();
      setRegistros(dados);
      setCarregando(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!carregando) {
      Database.salvarDados(registros);
    }
  }, [registros, carregando]);

  const handleSave = (horasAutocuidado, momentosGratidao, interacoesSociais) => {
    const autocuidadoNum = parseFloat(String(horasAutocuidado).replace(',', '.'));
    const gratidaoNum = parseInt(momentosGratidao, 10);
    const interacoesNum = parseInt(interacoesSociais, 10);

    if (editingId) {
      const registrosAtualizados = registros.map(reg =>
        reg.id === editingId
          ? {
              ...reg,
              autocuidado: autocuidadoNum,
              gratidao: gratidaoNum,
              interacoes: interacoesNum,
            }
          : reg
      );
      setRegistros(registrosAtualizados);
    } else {
      const novoRegistro = {
        id: new Date().getTime(),
        autocuidado: autocuidadoNum,
        gratidao: gratidaoNum,
        interacoes: interacoesNum,
      };
      setRegistros([...registros, novoRegistro]);
    }
    setEditingId(null);
  };

  const handleDelete = (id) => {
    setRegistros(registros.filter(reg => reg.id !== id));
  };

  const handleEdit = (registro) => {
    setEditingId(registro.id);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const exportarDados = async () => {
    const fileUri = Database.fileUri;

    if (Platform.OS === 'web') {
      const jsonString = JSON.stringify(registros, null, 2);
      if (registros.length === 0) {
        return Alert.alert("Aviso", "Nenhum dado para exportar.");
      }
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dados.json';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        return Alert.alert("Aviso", "Nenhum dado para exportar.");
      }
      if (!(await Sharing.isAvailableAsync())) {
        return Alert.alert("Erro", "Compartilhamento não disponível.");
      }
      await Sharing.shareAsync(fileUri);
    }
  };

  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  let registrosExibidos = [...registros]; 
  if (ordenacao === 'maior_agua') {
    registrosExibidos.sort((a, b) => b.agua - a.agua);
  } else {
    registrosExibidos.sort((a, b) => b.id - a.id);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.titulo}>Minha Vida em Numeros</Text>
        <Text style={styles.subtituloApp}>App Componentizado</Text>

        {/* Botões de ordenação */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10, gap: 10 }}>
          <Button title="Mais Recentes" onPress={() => setOrdenacao('recentes')} />
          <Button title="Maior Valor (Água)" onPress={() => setOrdenacao('maior_agua')} />
        </View>

        <Formulario
          onSave={handleSave}
          onCancel={handleCancel}
          registroEmEdicao={registros.find(r => r.id === editingId) || null}
        />

        <ListaRegistros
          registros={registrosExibidos} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <View style={styles.card}>
          <Text style={styles.subtitulo}>Exportar "Banco de Dados"</Text>
          <TouchableOpacity style={styles.botaoExportar} onPress={exportarDados}>
            <Text style={styles.botaoTexto}>Exportar arquivo dados.json</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
    backgroundColor: '#f8e1f4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#e91e63', 
  },
  subtituloApp: {
    textAlign: 'center',
    fontSize: 16,
    color: '#f48fb1', 
    marginTop: -20,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 20,
    elevation: 3,
  },
  subtitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#e91e63',
  },
  botaoExportar: {
    backgroundColor: '#e91e63',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 5,
  },
  botaoTexto: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  botaoOrdenacao: {
    backgroundColor: '#f06292', 
    padding: 10,
    borderRadius: 5,
  },
  botaoTextoOrdenacao: {
    color: 'white',
    fontSize: 16,
  },
});
