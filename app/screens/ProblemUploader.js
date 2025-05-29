import React, { useState, useEffect } from 'react';
import {
  View,
  Button,
  Image,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import functions from '@react-native-firebase/functions';
import auth from '@react-native-firebase/auth';

export default function ProblemUploader() {
  const [imageUri, setImageUri] = useState(null);
  const [description, setDescription] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [textOnlyMode, setTextOnlyMode] = useState(false);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(u => {
      setUser(u);
      console.log("👤 Authenticated user:", u?.email);
    });
    return unsubscribe;
  }, []);

  const handleUpload = async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      setResult("❌ Not signed in");
      return;
    }

    const data = {
      textDescription: description || '',
      textOnlyMode,
      token: await currentUser.getIdToken(true),
    };

    if (!textOnlyMode) {
      const res = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: true,
      });

      const asset = res?.assets?.[0];
      if (!asset?.base64) return;

      setImageUri(asset.uri);
      data.base64Image = asset.base64;
    }

    setLoading(true);

    try {
      const extractProblem = functions().httpsCallable('extractProblemMultimodalV2');
      const response = await extractProblem(data);

      console.log("✅ Response:", response.data);

      if (response.data?.success) {
        const {
          object,
          issue,
          taskType,
          likelyCause,
          instructions,
          toolSuggestions,
        } = response.data;

        setResult(
          `🧠 Object: ${object}\n🔧 Issue: ${issue}\n📂 Task Type: ${taskType}\n💡 Likely Cause: ${likelyCause}\n📋 Instructions:\n${instructions}\n🛍️ Suggested Products:\n${toolSuggestions || 'None'}`
        );
      } else {
        setResult("⚠️ Backend error: " + response.data?.error);
      }
    } catch (error) {
      console.error('❌ Function call error:', error);
      setResult('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 📝 Text input and toggle row */}
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Describe the problem (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <View style={styles.switchWrapper}>
          <Text style={styles.toggleLabel}>📝 Text Only</Text>
          <Switch
            value={textOnlyMode}
            onValueChange={setTextOnlyMode}
            trackColor={{ false: '#ccc', true: '#4caf50' }}
            thumbColor={textOnlyMode ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* 📤 Submit Button */}
      <Button title="Select Image & Submit" onPress={handleUpload} />

      {/* 🖼️ Only show image if in image mode and image is selected */}
      {!textOnlyMode && imageUri && (
        <Image source={{ uri: imageUri }} style={styles.image} />
      )}

      {/* ⏳ Loading indicator */}
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

      {/* 📋 Result display */}
      {result && <Text style={styles.result}>{result}</Text>}
    </ScrollView>
  );

}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },

  switchWrapper: {
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  toggleLabel: {
    fontSize: 14,
    marginBottom: 4,
  },

  container: {
    padding: 20,
    alignItems: 'center',
    flexGrow: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    width: '100%',
    fontSize: 16,
    marginBottom: 15,
  },
  image: {
    marginTop: 20,
    width: 300,
    height: 300,
    borderRadius: 8,
  },
  result: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'left',
    whiteSpace: 'pre-line',
  },
});
