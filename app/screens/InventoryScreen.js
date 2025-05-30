import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ImageBackground,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

const TOOL_DATABASE = [
  'Cordless Drill', 'Screwdriver Set', 'Hammer', 'Pliers', 'Adjustable Wrench', 'Wrench Set',
  'Wire Cutter', 'Utility Knife', 'Chisel Set', 'Hand Saw', 'Putty Knife', 'Hacksaw',
  'Staple Gun', 'Allen Key Set', 'Clamps', 'Multimeter', 'Soldering Iron', 'Heat Gun',
  'Glue Gun', 'Wire Stripper', 'Desoldering Pump', 'Insulation Tape', 'Pipe Wrench',
  'Pipe Cutter', 'Plumber’s Tape', 'Basin Wrench', 'Paint Brush Set', 'Paint Roller',
  'Sandpaper Set', 'Masking Tape', 'Drop Cloth', 'Silicone Gun', 'Caulking Tool',
  'Paint Scraper', 'Putty Knife', 'Safety Goggles', 'Measuring Tape', 'Spirit Level',
  'Tool Box', 'Work Gloves', 'Flashlight', 'Headlamp', 'Ladder', 'Stud Finder'
];

export default function InventoryScreen() {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [user, setUser] = useState(null);
  const tabBarHeight = useBottomTabBarHeight();

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(setUser);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchInventory = async () => {
      if (user) {
        const snapshot = await firestore()
          .collection('users')
          .doc(user.uid)
          .collection('inventory')
          .get();

        const tools = snapshot.docs.map(doc => doc.data().name);
        setInventory(tools);
      }
    };

    fetchInventory();
  }, [user]);

  const handleSearch = (text) => {
    setSearch(text);
    const filtered = TOOL_DATABASE.filter(
      item => item.toLowerCase().includes(text.toLowerCase()) && !inventory.includes(item)
    );
    setSuggestions(filtered);
  };

  const addTool = async (toolName) => {
    if (!user) return;
    const docId = toolName.toLowerCase().replace(/\s+/g, '_');

    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('inventory')
        .doc(docId)
        .set({ name: toolName, owned: true });

      setInventory(prev => [...prev, toolName]);
      setSearch('');
      setSuggestions([]);
    } catch (error) {
      console.error("🔥 Error adding tool:", error);
    }
  };

  const removeTool = async (toolName) => {
    if (!user) return;
    const docId = toolName.toLowerCase().replace(/\s+/g, '_');

    await firestore()
      .collection('users')
      .doc(user.uid)
      .collection('inventory')
      .doc(docId)
      .delete();

    setInventory(prev => prev.filter(item => item !== toolName));
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/background.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={80}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              Keyboard.dismiss();
              setSuggestions([]);
            }}
          >
            <ScrollView
              contentContainerStyle={[styles.overlay, { paddingBottom: tabBarHeight + 30 }]}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.title}>🧰 My Inventory</Text>

              <TextInput
                style={styles.input}
                placeholder="Search or add a tool..."
                placeholderTextColor="#999"
                value={search}
                onChangeText={handleSearch}
              />

              {suggestions.length > 0 && (
                <FlatList
                  data={suggestions}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => addTool(item)}
                      style={styles.suggestion}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.suggestionText}>➕ {item}</Text>
                    </TouchableOpacity>
                  )}
                  keyboardShouldPersistTaps="handled"
                  style={{ marginBottom: 20 }}
                />
              )}

              <Text style={styles.subtitle}>📦 Owned Tools</Text>
              {inventory.length === 0 ? (
                <Text style={styles.empty}>You haven’t added any tools yet.</Text>
              ) : (
                <View style={styles.inventoryList}>
                  {inventory.map((item) => (
                    <View key={item} style={styles.tag}>
                      <Text style={styles.tagText}>{item}</Text>
                      <TouchableOpacity onPress={() => removeTool(item)} activeOpacity={0.6}>
                        <Text style={styles.remove}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  suggestion: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  suggestionText: {
    fontSize: 15,
    color: '#333',
  },
  empty: {
    textAlign: 'center',
    color: '#ddd',
    fontSize: 15,
    marginTop: 20,
  },
  inventoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    margin: 5,
    minHeight: 36,
  },
  tagText: {
    fontSize: 14,
    color: '#000',
  },
  remove: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'red',
  },
});
