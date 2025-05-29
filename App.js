// App.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';

import ProblemUploader from './app/screens/ProblemUploader';
import ResultsHistoryScreen from './app/screens/ResultHistoryScreen';
import SettingsScreen from './app/screens/SettingsScreen';
import AuthScreen from './app/screens/AuthScreen';

const Tab = createBottomTabNavigator();

function AppTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Upload" component={ProblemUploader} />
      <Tab.Screen name="History" component={ResultsHistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(currentUser => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return unsubscribe; // Clean up on unmount
  }, [initializing]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <AppTabs />
      ) : (
        <AuthScreen onAuthenticated={() => setUser(auth().currentUser)} />
      )}
    </NavigationContainer>
  );
}
