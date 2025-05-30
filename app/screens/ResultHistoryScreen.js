import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  ImageBackground,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResultHistoryScreen() {
  const [results, setResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;

    const unsubscribe = firestore()
      .collection('problem_results')
      .where('uid', '==', uid)
      .orderBy('timestamp', 'desc')
      .onSnapshot(
        snapshot => {
          const list = snapshot?.docs?.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) || [];
          setResults(list);
        },
        error => {
          console.error("❌ Firestore onSnapshot error:", error);
        }
      );

    return unsubscribe;
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedItem(item)}>
      <Text style={styles.timestamp}>
        {item.timestamp?.toDate().toLocaleString() || 'No Date'}
      </Text>
      <Text style={styles.line}><Text style={styles.bold}>🧠 Object:</Text> {item.object}</Text>
      <Text style={styles.line}><Text style={styles.bold}>🔧 Issue:</Text> {item.issue}</Text>
      <Text style={styles.line}><Text style={styles.bold}>💡 Cause:</Text> {item.likelyCause}</Text>
      <Text style={styles.line} numberOfLines={3}><Text style={styles.bold}>📋 Instructions:</Text> {item.instructions}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/background.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <Text style={styles.header}>🔍 Search History</Text>

          <FlatList
            data={results}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.container}
            ListEmptyComponent={
              <Text style={styles.empty}>📭 No past results found.</Text>
            }
          />

          <Modal
            visible={!!selectedItem}
            animationType="slide"
            transparent
            onRequestClose={() => setSelectedItem(null)}
          >
            <View style={styles.modalBackground}>
              <ScrollView contentContainerStyle={styles.modalContainer}>
                <View style={styles.modalCard}>
                  <Text style={styles.modalText}><Text style={styles.bold}>🧠 Object:</Text> {selectedItem?.object}</Text>
                  <Text style={styles.modalText}><Text style={styles.bold}>🔧 Issue:</Text> {selectedItem?.issue}</Text>
                  <Text style={styles.modalText}><Text style={styles.bold}>💡 Cause:</Text> {selectedItem?.likelyCause}</Text>
                  <Text style={styles.modalText}><Text style={styles.bold}>📋 Instructions:</Text> {selectedItem?.instructions}</Text>
                  <Text style={styles.modalText}><Text style={styles.bold}>🛠️ Tool Suggestions:</Text> {selectedItem?.toolSuggestions || 'None'}</Text>

                  <Pressable style={styles.closeButton} onPress={() => setSelectedItem(null)}>
                    <Text style={styles.closeButtonText}>Close</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </Modal>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  container: {
    paddingBottom: 100,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  line: {
    fontSize: 14,
    marginVertical: 2,
    color: '#333',
  },
  bold: {
    fontWeight: 'bold',
    color: '#111',
  },
  empty: {
    textAlign: 'center',
    marginTop: 60,
    fontSize: 16,
    color: '#eee',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
  },
  modalContainer: {
    padding: 20,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    elevation: 10,
  },
  modalText: {
    fontSize: 15,
    color: '#333',
    marginVertical: 4,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#ff0000',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
