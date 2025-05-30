import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
  View,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import { Provider as PaperProvider } from 'react-native-paper';

// Screens
import ProblemUploader from './app/screens/ProblemUploader';
import ResultsHistoryScreen from './app/screens/ResultHistoryScreen';
import AuthScreen from './app/screens/AuthScreen';
import InventoryScreen from './app/screens/InventoryScreen';
import ProfileScreen from './app/screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
       tabBarStyle: {
  position: 'absolute',
  height: 64,
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  backgroundColor: 'rgba(255,255,255,0.95)',
  elevation: 10,
  paddingBottom: 10,
},

        tabBarActiveTintColor: '#eb5822',
        tabBarInactiveTintColor: '#555',
      }}
    >
      <Tab.Screen
        name="Upload"
        component={ProblemUploader}
        options={{
          tabBarIcon: ({ color }) => (
            <FeatherIcon name="upload" size={24} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="History"
        component={ResultsHistoryScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="history" size={24} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Logo"
        component={() => null}
        options={{
          tabBarButton: () => (
            <Image
              height={80}
              width={100}
              source={require('././assets/logo.png')}
              style={styles.centerLogo}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="inventory" size={24} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <FeatherIcon name="settings" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function DrawerWrapper() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen
        name="Main"
        component={AppTabs}
        options={{ headerShown: false }}
      />
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

const styles = StyleSheet.create({
centerLogo: {
  width: 100,
  height: 100,
  borderRadius: 50,
  marginTop: -43,
  alignSelf: 'center',
},
});
