import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Picker } from '@react-native-picker/picker';


export default function ProfileScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [toolPreference, setToolPreference] = useState('');
  const user = auth().currentUser;

  useEffect(() => {
    if (user) {
      firestore()
        .collection('users')
        .doc(user.uid)
        .collection('profile')
        .doc('info')
        .get()
        .then(doc => {
          if (doc.exists) {
            const data = doc.data();
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
            setSkillLevel(data.skillLevel || '');
            setToolPreference(data.toolPreference || '');
          }
        });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('profile')
        .doc('info')
        .set({
          firstName,
          lastName,
          skillLevel,
          toolPreference,
        });

      Alert.alert('✅ Profile saved');
    } catch (err) {
      console.error('❌ Failed to save profile:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 Your Profile</Text>

      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />

      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />

      <Text style={styles.label}>Skill Level</Text>
      <Picker selectedValue={skillLevel} onValueChange={setSkillLevel}>
        <Picker.Item label="Select..." value="" />
        <Picker.Item label="Beginner" value="beginner" />
        <Picker.Item label="Intermediate" value="intermediate" />
        <Picker.Item label="Expert" value="expert" />
      </Picker>

      <Text style={styles.label}>Tool Preference</Text>
      <Picker selectedValue={toolPreference} onValueChange={setToolPreference}>
        <Picker.Item label="Select..." value="" />
        <Picker.Item label="Manual Tools" value="manual" />
        <Picker.Item label="Power Tools" value="power" />
        <Picker.Item label="No Preference" value="no_preference" />
      </Picker>

      <Button title="💾 Save Profile" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  title: { fontSize: 24, marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  label: {
    marginTop: 15,
    fontWeight: 'bold',
    marginBottom: 5,
  },
});
