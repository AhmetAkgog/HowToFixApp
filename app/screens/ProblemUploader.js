import React, { useState, useEffect, useRef } from 'react';
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
  FlatList,
  KeyboardAvoidingView,
  Platform,
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
  const [sessionId, setSessionId] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  const flatListRef = useRef(null);

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

      if (response.data?.success) {
        const {
          object,
          issue,
          taskType,
          likelyCause,
          instructions,
          toolSuggestions,
          sessionId: returnedSessionId,
        } = response.data;

        setResult(
          `🧠 Object: ${object}\n🔧 Issue: ${issue}\n📂 Task Type: ${taskType}\n💡 Likely Cause: ${likelyCause}\n📋 Instructions:\n${instructions}\n🛍️ Suggested Products:\n${toolSuggestions || 'None'}`
        );

        setSessionId(returnedSessionId);
        setChatMessages([
          { role: 'user', content: description || '(image-based problem)' },
          { role: 'assistant', content: instructions }
        ]);
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

  const handleSendFollowUp = async () => {
    if (!chatInput.trim()) return;
    const chatWithAssistant = functions().httpsCallable('chatWithAssistant');

    const newMessage = { role: 'user', content: chatInput.trim() };
    const updatedMessages = [...chatMessages, newMessage];
    setChatMessages(updatedMessages);
    setChatInput('');

    try {
      const response = await chatWithAssistant({ sessionId, userMessage: newMessage.content });
      const assistantReply = response.data.reply;
      setChatMessages(prev => [...prev, { role: 'assistant', content: assistantReply }]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      console.error('❌ Follow-up failed:', err);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
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

          <Button title="Select Image & Submit" onPress={handleUpload} />

          {!textOnlyMode && imageUri && (
            <Image source={{ uri: imageUri }} style={styles.image} />
          )}

          {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

          {result && <Text style={styles.result}>{result}</Text>}

          {result && !showChat && (
            <Button title="🗨️ Continue Chat" onPress={() => setShowChat(true)} />
          )}
        </ScrollView>

        {showChat && (
          <>
            <FlatList
              ref={flatListRef}
              data={chatMessages}
              renderItem={({ item }) => (
                <View style={[styles.bubble, item.role === 'user' ? styles.user : styles.assistant]}>
                  <Text>{item.content}</Text>
                </View>
              )}
              keyExtractor={(_, index) => index.toString()}
              contentContainerStyle={{ padding: 10 }}
              style={styles.chatBox}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
            <View style={[styles.inputRow, { padding: 10 }]}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Ask a follow-up..."
                value={chatInput}
                onChangeText={setChatInput}
              />
              <Button title="Send" onPress={handleSendFollowUp} />
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
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
  chatBox: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  bubble: {
    padding: 10,
    marginVertical: 4,
    borderRadius: 10,
    maxWidth: '85%',
  },
  user: {
    alignSelf: 'flex-end',
    backgroundColor: '#d0f0c0',
  },
  assistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
  },
});
