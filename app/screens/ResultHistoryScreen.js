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
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

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
          if (!snapshot || !snapshot.docs) {
            console.warn("📭 Snapshot or docs missing");
            return;
          }

          const list = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setResults(list);
        },
        error => {
          console.error("❌ Firestore onSnapshot error:", error);
        }
      );

    return unsubscribe;
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => setSelectedItem(item)}
    >
      <Text style={styles.timestamp}>
        {item.timestamp?.toDate().toLocaleString() || 'No Date'}
      </Text>
      <Text style={styles.line}>🧠 Object: {item.object}</Text>
      <Text style={styles.line}>🔧 Issue: {item.issue}</Text>
      <Text style={styles.line}>💡 Cause: {item.likelyCause}</Text>
      <Text style={styles.line} numberOfLines={4}>📋 Instructions: {item.instructions}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.container}
        ListEmptyComponent={
          <Text style={styles.empty}>No past results yet.</Text>
        }
      />

      {/* Detail Modal */}
      <Modal
        visible={!!selectedItem}
        animationType="slide"
        onRequestClose={() => setSelectedItem(null)}
      >
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalTitle}>🧠 Object: {selectedItem?.object}</Text>
          <Text style={styles.modalText}>🔧 Issue: {selectedItem?.issue}</Text>
          <Text style={styles.modalText}>💡 Cause: {selectedItem?.likelyCause}</Text>
          <Text style={styles.modalText}>📋 Instructions:</Text>
          <Text style={styles.modalText}>{selectedItem?.instructions}</Text>
          <Text style={styles.modalText}>🛠️ Tool Suggestions:</Text>
          <Text style={styles.modalText}>{selectedItem?.toolSuggestions}</Text>

          <Pressable style={styles.closeButton} onPress={() => setSelectedItem(null)}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </ScrollView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  item: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  line: {
    marginTop: 4,
    fontSize: 14,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#999',
  },
  modalContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginVertical: 6,
  },
  closeButton: {
    marginTop: 30,
    backgroundColor: '#007aff',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});
