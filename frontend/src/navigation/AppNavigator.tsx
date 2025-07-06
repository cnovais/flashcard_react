import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LoginScreen } from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import DecksScreen from '../screens/DecksScreen';
import CreateDeckScreen from '../screens/CreateDeckScreen';
import EditDeckScreen from '../screens/EditDeckScreen';
import CreateCardScreen from '../screens/CreateCardScreen';
import EditCardScreen from '../screens/EditCardScreen';
import StudyScreen from '../screens/StudyScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DeckDetailScreen from '../screens/DeckDetailScreen';
import PremiumScreen from '../screens/PremiumScreen';
import StatsScreen from '../screens/StatsScreen';
import GamificationScreen from '../screens/GamificationScreen';
import RegisterScreen from '../screens/RegisterScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AboutScreen from '../screens/AboutScreen';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import { RootStackParamList, TabParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Decks') {
            iconName = focused ? 'cards' : 'cards-outline';
          } else if (route.name === 'Study') {
            iconName = focused ? 'school' : 'school-outline';
          } else if (route.name === 'Gamification') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          } else {
            iconName = 'circle';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Início' }}
      />
      <Tab.Screen 
        name="Decks" 
        component={DecksScreen}
        options={{ title: 'Decks' }}
      />
      <Tab.Screen 
        name="Study" 
        component={StudyScreen}
        options={{ title: 'Estudar', headerShown: false }}
      />
      <Tab.Screen 
        name="Gamification" 
        component={GamificationScreen}
        options={{ title: 'Gamificação' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  console.log('AppNavigator - Estado atual:', { user: !!user, isLoading, userId: user?.id });

  if (isLoading) {
    console.log('AppNavigator - Carregando...');
    return null; // Loading screen
  }

  console.log('AppNavigator - Renderizando navegador para usuário:', !!user);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="CreateDeck" component={CreateDeckScreen} options={{ headerShown: false }} />
          <Stack.Screen name="DeckDetail" component={DeckDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Study" component={StudyScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CreateCard" component={CreateCardScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EditCard" component={EditCardScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Premium" component={PremiumScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Stats" component={StatsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EditDeck" component={EditDeckScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
          <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
} 