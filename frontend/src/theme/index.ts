import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#FF6200',
    secondary: '#02036C',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceVariant: '#FFFFFF',
    surfaceDisabled: '#FFFFFF',
    error: '#b00020',
    text: '#000000',
    textSecondary: '#666666',
    onSurface: '#000000',
    onSurfaceVariant: '#000000',
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
    primary: '#FF6200',
    secondary: '#02036C',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceVariant: '#FFFFFF',
    surfaceDisabled: '#FFFFFF',
    error: '#cf6679',
    text: '#FFFFFF',
    textSecondary: '#FFFFFF',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#FFFFFF',
    disabled: '#FFFFFF',
    placeholder: '#FFFFFF',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#f50057',
    success: '#4caf50',
    warning: '#ff9800',
    info: '#2196f3',
  },
};

export const theme = lightTheme; 