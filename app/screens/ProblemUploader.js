import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { launchImageLibrary } from 'react-native-image-picker';
import functions from '@react-native-firebase/functions';
import auth from '@react-native-firebase/auth';

export default function ProblemUploader() {
  const [imageUri, setImageUri] = useState(null);
  const [description, setDescription] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [textOnlyMode, setTextOnlyMode] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const flatListRef = useRef(null);
  const tabBarHeight = useBottomTabBarHeight();

  useEffect(() => {
    return auth().onAuthStateChanged(u => {
      console.log("👤 Authenticated:", u?.email);
    });
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
      const res = await launchImageLibrary({ mediaType: 'photo', includeBase64: true });
      const asset = res?.assets?.[0];
      if (!asset?.base64) return;
      setImageUri(asset.uri);
      data.base64Image = asset.base64;
    }

    setLoading(true);
    try {
      const extractProblem = functions().httpsCallable('extractProblemMultimodalV2');
      const response = await extractProblem(data);
      const { object, issue, taskType, likelyCause, instructions, toolSuggestions, sessionId: sid } = response.data;

      if (response.data?.success) {
        setResult(
          `🧠 Object: ${object}\n🔧 Issue: ${issue}\n📂 Task Type: ${taskType}\n💡 Likely Cause: ${likelyCause}\n📋 Instructions:\n${instructions}\n🛍️ Suggested Products:\n${toolSuggestions || 'None'}`
        );
        setSessionId(sid);
        setChatMessages([
          { role: 'user', content: description || '(image-based problem)' },
          { role: 'assistant', content: instructions }
        ]);
      } else {
        setResult("⚠️ Backend error: " + response.data?.error);
      }
    } catch (e) {
      console.error(e);
      setResult('❌ Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFollowUp = async () => {
    if (!chatInput.trim()) return;
    const chatWithAssistant = functions().httpsCallable('chatWithAssistant');
    const newMessage = { role: 'user', content: chatInput.trim() };
    setChatMessages(prev => [...prev, newMessage]);
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
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <ImageBackground source={require('../../assets/background.png')} style={styles.background} resizeMode="cover">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={80}
        >
          <View style={styles.overlay}>
            <ScrollView
              contentContainerStyle={[styles.container, { paddingBottom: tabBarHeight + 60 }]}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.title}>🔧 Fix It Assistant</Text>

              <View style={styles.card}>
                <TextInput
                  style={styles.input}
                  placeholder="Describe the problem (optional)"
                  placeholderTextColor="#888"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />

                <View style={styles.toggleArea}>
                  <Text style={styles.toggleLabel}>📝 Text Only</Text>
                  <Switch
                    value={textOnlyMode}
                    onValueChange={setTextOnlyMode}
                    trackColor={{ false: '#999', true: '#4caf50' }}
                    thumbColor="#fff"
                  />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleUpload}>
                  <Text style={styles.buttonText}>
                    {textOnlyMode ? 'Submit' : 'Select Image & Submit'}
                  </Text>
                </TouchableOpacity>
              </View>

              {!textOnlyMode && imageUri && (
                <Image source={{ uri: imageUri }} style={styles.image} />
              )}

              {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

              {result && <Text style={styles.result}>{result}</Text>}

              {result && !showChat && (
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#222', marginBottom: 20 }]}
                  onPress={() => setShowChat(true)}
                >
                  <Text style={styles.buttonText}>🗨️ Continue Chat</Text>
                </TouchableOpacity>
              )}

              {showChat && (
                <View style={[styles.card, { marginBottom: tabBarHeight + 20 }]}>
                  <FlatList
                    ref={flatListRef}
                    data={chatMessages}
                    renderItem={({ item }) => (
                      <View style={[styles.bubble, item.role === 'user' ? styles.user : styles.assistant]}>
                        <Text>{item.content}</Text>
                      </View>
                    )}
                    keyExtractor={(_, index) => index.toString()}
                    contentContainerStyle={{ paddingBottom: 10 }}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    showsVerticalScrollIndicator={true}
                  />

                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.chatInput, { flex: 1 }]}
                      placeholder="Ask a follow-up..."
                      value={chatInput}
                      onChangeText={setChatInput}
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleSendFollowUp}>
                      <Text style={styles.sendButtonText}>Send</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
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
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    padding: 20,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 16,
    borderRadius: 12,
    elevation: 5,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#000',
    marginBottom: 10,
  },
  chatInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#000',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#004f5d',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 15,
  },
  toggleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  toggleLabel: {
    fontSize: 14,
    marginRight: 10,
    color: '#333',
  },
  button: {
    backgroundColor: '#004f5d',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  image: {
    marginTop: 20,
    width: '100%',
    height: 250,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  result: {
    marginTop: 25,
    fontSize: 15,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 14,
    borderRadius: 8,
    lineHeight: 22,
    color: '#222',
    whiteSpace: 'pre-line',
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
});
