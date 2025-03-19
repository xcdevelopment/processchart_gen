// src/styles/theme.js
import { createTheme } from '@mui/material/styles';

// デフォルトのカラーパレット
const defaultPalette = {
  primary: {
    light: '#63a4ff',
    main: '#1976d2',
    dark: '#004ba0',
    contrastText: '#ffffff'
  },
  secondary: {
    light: '#ffc947',
    main: '#ff9800',
    dark: '#c66900',
    contrastText: '#000000'
  },
  error: {
    light: '#ff6659',
    main: '#d32f2f',
    dark: '#9a0007',
    contrastText: '#ffffff'
  },
  warning: {
    light: '#ffb74d',
    main: '#f57c00',
    dark: '#e65100',
    contrastText: '#000000'
  },
  info: {
    light: '#4fc3f7',
    main: '#03a9f4',
    dark: '#0288d1',
    contrastText: '#ffffff'
  },
  success: {
    light: '#80e27e',
    main: '#4caf50',
    dark: '#087f23',
    contrastText: '#ffffff'
  }
};

// 共通のテーマ設定
const commonOptions = {
  spacing: 8,
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
      lineHeight: 1.2,
      marginBottom: '0.5em'
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      lineHeight: 1.2,
      marginBottom: '0.5em'
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      lineHeight: 1.2,
      marginBottom: '0.5em'
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.2,
      marginBottom: '0.5em'
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.2,
      marginBottom: '0.5em'
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.2,
      marginBottom: '0.5em'
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5
    },
    button: {
      textTransform: 'none' // ボタンテキストを大文字に変換しない
    }
  },
  shape: {
    borderRadius: 4
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // ボタンテキストを大文字に変換しない
          borderRadius: '4px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#1565c0'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none'
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: 8
        }
      }
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate',
          borderSpacing: 0
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#f5f5f5'
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minWidth: 'auto',
          padding: '12px 16px',
          '&.Mui-selected': {
            fontWeight: 600
          }
        }
      }
    }
  }
};

// ライトテーマ
const lightTheme = createTheme({
  ...commonOptions,
  palette: {
    ...defaultPalette,
    mode: 'light',
    background: {
      default: '#f5f7fa',
      paper: '#ffffff'
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)'
    },
    divider: 'rgba(0, 0, 0, 0.12)'
  }
});

// ダークテーマ
const darkTheme = createTheme({
  ...commonOptions,
  palette: {
    ...defaultPalette,
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e'
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.5)'
    },
    divider: 'rgba(255, 255, 255, 0.12)'
  }
});

// テーマの取得関数（将来的に動的テーマ切り替えに使用）
export const getTheme = (mode = 'light') => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

// デフォルトのテーマをエクスポート
// アプリケーション実装では、ユーザー設定からダークモードかライトモードかを読み込むことが可能
const theme = lightTheme;

export default theme;