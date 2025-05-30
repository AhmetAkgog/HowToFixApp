import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
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
            setSkillLevel(data.skillLevel?.toLowerCase() || '');
            setToolPreference(data.toolPreference?.toLowerCase() || '');
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

  const handleLogout = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert('Logout Error', error.message);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>👤 Your Profile</Text>

          <TextInput
            style={styles.input}
            placeholder="First Name"
            placeholderTextColor="#666"
            value={firstName}
            onChangeText={setFirstName}
          />

          <TextInput
            style={styles.input}
            placeholder="Last Name"
            placeholderTextColor="#666"
            value={lastName}
            onChangeText={setLastName}
          />

          <Text style={styles.label}>Skill Level</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={skillLevel}
              onValueChange={setSkillLevel}
              style={styles.picker}
            >
              <Picker.Item label="Select..." value="" />
              <Picker.Item label="Beginner" value="beginner" />
              <Picker.Item label="Intermediate" value="intermediate" />
              <Picker.Item label="Expert" value="expert" />
            </Picker>
          </View>

          <Text style={styles.label}>Tool Preference</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={toolPreference}
              onValueChange={setToolPreference}
              style={styles.picker}
            >
              <Picker.Item label="Select..." value="" />
              <Picker.Item label="Manual Tools" value="manual" />
              <Picker.Item label="Power Tools" value="power" />
              <Picker.Item label="No Preference" value="no_preference" />
            </Picker>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>💾 Save Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>🚪 Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const LOGO_Yellow = '#f5b900';
const orange = '#ff6f00';

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: LOGO_Yellow,
    padding: 12,
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    color: '#000',
  },
  label: {
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: LOGO_Yellow,
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    color: '#666',
  },
  saveButton: {
    backgroundColor: orange,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#888',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
