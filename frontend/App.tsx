import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { GamificationProvider } from './src/contexts/GamificationContext';
import AppNavigator from './src/navigation/AppNavigator';

function AppContent() {
  const { theme, isDarkMode } = useTheme();
  
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <AppNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GamificationProvider>
          <AppContent />
        </GamificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
} 