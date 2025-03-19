// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './styles/global.css';
import App from './App';
import theme from './styles/theme';
import { ProjectProvider } from './contexts/ProjectContext';

// アプリケーションのルート要素
const root = ReactDOM.createRoot(document.getElementById('root'));

// アプリケーションのレンダリング
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      {/* ノーマライズCSS */}
      <CssBaseline />
      {/* プロジェクトコンテキストプロバイダー */}
      <ProjectProvider>
        <App />
      </ProjectProvider>
    </ThemeProvider>
  </React.StrictMode>
);