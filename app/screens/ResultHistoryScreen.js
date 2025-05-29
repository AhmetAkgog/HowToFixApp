import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export default function ResultHistoryScreen() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    const uid = auth().currentUser?.uid;
    if (!uid) return;

    const unsubscribe = firestore()
      .collection('problem_results')
      .where('uid', '==', uid)
      .orderBy('timestamp', 'desc')
      .onSnapshot(snapshot => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setResults(list);
      });

    return unsubscribe;
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.timestamp}>
        {item.timestamp?.toDate().toLocaleString() || 'No Date'}
      </Text>
      {item.description ? <Text style={styles.desc}>📝 {item.description}</Text> : null}
      <Text style={styles.result}>🔍 {item.result}</Text>
    </View>
  );

  return (
    <FlatList
      data={results}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  item: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  timestamp: { fontSize: 12, color: '#666' },
  desc: { marginTop: 5, fontSize: 14 },
  result: { marginTop: 8, fontSize: 16, fontWeight: 'bold' },
});
