// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

/**
 * メインプロセスとの安全なIPC通信をレンダラープロセスに公開
 */
contextBridge.exposeInMainWorld('electron', {
  // ファイル操作
  saveProject: (data) => ipcRenderer.invoke('save-project', data),
  openProject: (data) => ipcRenderer.invoke('open-project', data),
  exportCsv: (data) => ipcRenderer.invoke('export-csv', data),
  importCsv: () => ipcRenderer.invoke('import-csv'),
  exportImage: (data) => ipcRenderer.invoke('export-image', data),
  
  // データベース操作
  findImprovements: (query) => ipcRenderer.invoke('db-find-improvements', query),
  saveImprovement: (improvement) => ipcRenderer.invoke('db-save-improvement', improvement),
  saveProjectMeta: (meta) => ipcRenderer.invoke('db-save-project-meta', meta),
  findProjects: (query) => ipcRenderer.invoke('db-find-projects', query),
  
  // 設定関連
  getSetting: (key, defaultValue) => ipcRenderer.invoke('get-settings', key, defaultValue),
  setSetting: (key, value) => ipcRenderer.invoke('set-settings', key, value),
  getRecentProjects: () => ipcRenderer.invoke('get-recent-projects'),
  
  // メニュー関連のイベントリスナー
  onMenuEvent: (channel, callback) => {
    const validChannels = [
      'menu-new-project',
      'menu-save-project',
      'menu-save-project-as',
      'menu-export-csv',
      'menu-export-excel',
      'menu-export-svg',
      'menu-export-png',
      'menu-import-csv',
      'menu-import-excel',
      'menu-view-process-chart',
      'menu-view-workload',
      'menu-view-improvement',
      'menu-zoom-in',
      'menu-zoom-out',
      'menu-zoom-reset',
      'menu-open-help',
      'project-opened'
    ];
    
    if (validChannels.includes(channel)) {
      // イベントとデータのみを渡す
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      
      // クリーンアップのための登録解除関数を返す
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
  }
});

// コンソールで問題を識別しやすくするためのメッセージ
console.log('Preload script has been loaded');