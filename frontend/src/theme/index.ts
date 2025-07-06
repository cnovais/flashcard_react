import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac6',
    background: '#f6f6f6',
    surface: '#ffffff',
    error: '#b00020',
    text: '#000000',
    textSecondary: '#666666',
    onSurface: '#000000',
    disabled: '#bdbdbd',
    placeholder: '#9e9e9e',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#f50057',
    success: '#4caf50',
    warning: '#ff9800',
    info: '#2196f3',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#bb86fc',
    secondary: '#03dac6',
    background: '#121212',
    surface: '#1e1e1e',
    error: '#cf6679',
    text: '#ffffff',
    textSecondary: '#666666',
    onSurface: '#ffffff',
    disabled: '#666666',
    placeholder: '#888888',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#f50057',
    success: '#4caf50',
    warning: '#ff9800',
    info: '#2196f3',
  },
};

export const theme = lightTheme; 