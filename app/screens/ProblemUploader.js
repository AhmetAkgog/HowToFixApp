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

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(u => {
      setUser(u);
      console.log("👤 Authenticated user:", u?.email);
    });
    return unsubscribe;
  }, []);

  const handleUpload = async () => {
    const res = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
    });

    const asset = res?.assets?.[0];
    if (!asset?.base64) return;

    setImageUri(asset.uri);
    setLoading(true);

    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        setResult("❌ Not signed in");
        return;
      }

      const idToken = await currentUser.getIdToken(true);
      const extractProblem = functions().httpsCallable('extractProblemMultimodalV2');

      const response = await extractProblem({
        base64Image: asset.base64,
        textDescription: description || '',
        token: idToken,
      });

      console.log("✅ Response:", response.data);

      if (response.data?.success) {
        const { object, issue, taskType, likelyCause, instructions } = response.data;
        setResult(
          `🧠 Object: ${object}\n🔧 Issue: ${issue}\n📂 Task Type: ${taskType}\n💡 Likely Cause: ${likelyCause}\n📋 Instructions:\n${instructions}`
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
      <TextInput
        style={styles.input}
        placeholder="Describe the problem (optional)"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Button title="Select Image & Submit" onPress={handleUpload} />
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
      {result && <Text style={styles.result}>{result}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
