import { createTheme } from '@mui/material/styles';

const bsiTheme = createTheme({
  palette: {
    primary: {
      main: '#1B5E20',
      light: '#4C8C4A',
      dark: '#003300',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F9A825',
      light: '#FFC04D',
      dark: '#C17900',
      contrastText: '#000000',
    },
    background: {
      default: '#F5F5F0',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: "'Roboto', sans-serif",
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          fontWeight: 700,
          textTransform: 'none',
          padding: '10px 24px',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
          borderRadius: 16,
        },
      },
    },
  },
});

export default bsiTheme;
