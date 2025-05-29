import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const TOOL_DATABASE = [
  // 🛠️ Hand Tools
  'Cordless Drill',
  'Screwdriver Set',
  'Hammer',
  'Pliers',
  'Adjustable Wrench',
  'Wrench Set',
  'Wire Cutter',
  'Utility Knife',
  'Chisel Set',
  'Hand Saw',
  'Putty Knife',
  'Hacksaw',
  'Staple Gun',
  'Allen Key Set',
  'Clamps',

  // 🔌 Electrical & Electronics
  'Multimeter',
  'Soldering Iron',
  'Heat Gun',
  'Glue Gun',
  'Wire Stripper',
  'Desoldering Pump',
  'Insulation Tape',

  // 🔧 Plumbing Tools
  'Pipe Wrench',
  'Pipe Cutter',
  'Plumber’s Tape',
  'Basin Wrench',

  // 🎨 DIY & Painting
  'Paint Brush Set',
  'Paint Roller',
  'Sandpaper Set',
  'Masking Tape',
  'Drop Cloth',
  'Silicone Gun',
  'Caulking Tool',
  'Paint Scraper',
  'Putty Knife',

  // 🧰 Misc Tools
  'Safety Goggles',
  'Measuring Tape',
  'Spirit Level',
  'Tool Box',
  'Work Gloves',
  'Flashlight',
  'Headlamp',
  'Ladder',
  'Stud Finder'
];


export default function InventoryScreen() {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [user, setUser] = useState(null);

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
    console.log("🟡 Attempting to add tool:", toolName);

    if (!user) {
      console.warn("❌ No user available");
      return;
    }

    const docId = toolName.toLowerCase().replace(/\s+/g, '_');

    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('inventory')
        .doc(docId)
        .set({ name: toolName, owned: true });

      console.log("✅ Tool saved to Firestore:", docId);

      setInventory(prev => {
        const updated = [...prev, toolName];
        console.log("📦 Updated inventory state:", updated);
        return updated;
      });

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
    <View style={styles.container}>
      <Text style={styles.title}>🧰 Your Inventory</Text>
      <TextInput
        style={styles.input}
        placeholder="Search or add a tool..."
        value={search}
        onChangeText={handleSearch}
      />
      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                console.log("📲 Pressed item:", item);
                addTool(item);
              }}
              style={styles.suggestion}
            >
              <Text>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}
      <View style={styles.inventoryList}>
        {inventory.map((item) => (
          <View key={item} style={styles.tag}>
            <Text>{item}</Text>
            <TouchableOpacity onPress={() => removeTool(item)}>
              <Text style={styles.remove}> × </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  title: { fontSize: 22, marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  suggestion: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#eee',
    marginBottom: 5,
    borderRadius: 6,
  },
  inventoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
  },
  tag: {
    backgroundColor: '#ddd',
    paddingHorizontal: 10,
    paddingVertical: 6,
    margin: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  remove: {
    marginLeft: 8,
    color: 'red',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
