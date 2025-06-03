import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ImageBackground,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/Feather';

const LOGO_YELLOW = '#f5b900';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    try {
      if (isLogin) {
        await auth().signInWithEmailAndPassword(email, password);
        Alert.alert('Success', 'You are now logged in.');
      } else {
        const userCredential = await auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        await firestore()
          .collection('users')
          .doc(user.uid)
          .collection('profile')
          .doc('info')
          .set({
            uid: user.uid,
            email: user.email || '',
            firstName: '',
            lastName: '',
            skillLevel: '',
            toolPreference: '',
          });

        Alert.alert('Success', 'Account created successfully!');
      }
    } catch (err) {
      Alert.alert('Auth Error', err.message);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <View style={styles.cardWrapper}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />

        <Text style={styles.header}>
          {isLogin ? 'Login to HowToFixApp' : 'Sign up to HowToFixApp'}
        </Text>

        <View style={styles.card}>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#666"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            value={email}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#666"
              style={[styles.input, styles.passwordInput]}
              secureTextEntry={!showPassword}
              onChangeText={setPassword}
              value={password}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(prev => !prev)}
              style={styles.toggleIcon}
            >
              <Icon name={showPassword ? 'eye' : 'eye-off'} size={22} color="#333" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleAuth}>
            <View style={styles.buttonContent}>
              <Icon name={isLogin ? 'log-in' : 'user-plus'} size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>{isLogin ? 'LOGIN' : 'SIGN UP'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.toggleText}>
              {isLogin ? (
                <>Don’t have an account? <Text style={styles.underlineBold}>Sign up</Text></>
              ) : (
                <>Already have an account? <Text style={styles.underlineBold}>Login</Text></>
              )}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    maxWidth: 400,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  logo: {
    width: 190,
    height: 190,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: LOGO_YELLOW,
    padding: 12,
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    color: '#000',
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  toggleIcon: {
    position: 'absolute',
    right: 16,
    top: 15,
  },
  button: {
    backgroundColor: LOGO_YELLOW,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  toggleText: {
    textAlign: 'center',
    color: '#5e6266',
    marginTop: 12,
  },
  underlineBold: {
    fontWeight: '700',
    textDecorationLine: 'underline',
    color: '#000',
  },
});
