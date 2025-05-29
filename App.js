import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, ActivityIndicator } from 'react-native';
import auth from '@react-native-firebase/auth';
import { Provider as PaperProvider } from 'react-native-paper';
// Screens
import ProblemUploader from './app/screens/ProblemUploader';
import ResultsHistoryScreen from './app/screens/ResultHistoryScreen';
import SettingsScreen from './app/screens/SettingsScreen';
import AuthScreen from './app/screens/AuthScreen';
import InventoryScreen from './app/screens/InventoryScreen';
import ProfileScreen from './app/screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function AppTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Upload" component={ProblemUploader} />
      <Tab.Screen name="History" component={ResultsHistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function DrawerWrapper() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen name="Main" component={AppTabs} options={{ headerShown: false }} />
      <Drawer.Screen name="Inventory" component={InventoryScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
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
    return unsubscribe;
  }, [initializing]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <PaperProvider>
      <NavigationContainer>
        {user ? (
          <DrawerWrapper />
        ) : (
          <AuthScreen onAuthenticated={() => setUser(auth().currentUser)} />
        )}
      </NavigationContainer>
    </PaperProvider>
  );
}
