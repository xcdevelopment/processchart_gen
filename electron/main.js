// electron/main.js
const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';
const Datastore = require('nedb');
const electronStore = require('electron-store');
const appInitializer = require('./init');
const menu = require('./menu');
const ipcHandlers = require('./ipc-handlers');

// アプリケーション設定用ストアの初期化
const appConfig = new electronStore({
  name: 'app-config',
  defaults: {
    windowSize: { width: 1200, height: 800 },
    recentProjects: [],
    theme: 'light',
    defaultProjectLocation: app.getPath('documents')
  }
});

// データベース初期化
let db = {
  projects: new Datastore({ 
    filename: path.join(app.getPath('userData'), 'projects.db'), 
    autoload: true 
  }),
  improvements: new Datastore({ 
    filename: path.join(app.getPath('userData'), 'improvements.db'), 
    autoload: true 
  }),
};

// インデックスの作成
db.projects.ensureIndex({ fieldName: 'name' });
db.improvements.ensureIndex({ fieldName: 'title' });

// メインウィンドウの参照を保持
let mainWindow;
let isQuitting = false;

// メインウィンドウを作成
async function createWindow() {
  const { width, height } = appConfig.get('windowSize');
  
  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false, // 準備が整うまでウィンドウを非表示
    icon: path.join(__dirname, 'icons', 'icon.png')
  });

  // ウィンドウサイズの保存
  mainWindow.on('resize', () => {
    const [width, height] = mainWindow.getSize();
    appConfig.set('windowSize', { width, height });
  });

  // 開発環境では開発サーバーを使用、本番環境ではビルドされたファイルを使用
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  await mainWindow.loadURL(startUrl);

  // 開発環境のみDevToolsを開く
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // コンテンツのロードが完了したら表示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // ウィンドウが閉じられたときの処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // ウィンドウを閉じる際の処理
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// 最近使用したプロジェクトメニューの生成
function buildRecentProjectsMenu() {
  const recentProjects = appConfig.get('recentProjects') || [];
  
  if (recentProjects.length === 0) {
    return [{ label: '最近使用したプロジェクトはありません', enabled: false }];
  }
  
  return recentProjects.map(project => ({
    label: project.name,
    click: () => {
      if (fs.existsSync(project.path)) {
        openProject(project.path);
      } else {
        dialog.showMessageBox(mainWindow, {
          type: 'error',
          title: 'ファイルが見つかりません',
          message: `${project.path} が見つかりません。`
        });
        
        // 見つからないプロジェクトを削除
        const updatedProjects = appConfig.get('recentProjects').filter(p => p.path !== project.path);
        appConfig.set('recentProjects', updatedProjects);
      }
    }
  }));
}

// プロジェクトを開くダイアログの表示
function handleOpenProject() {
  dialog.showOpenDialog(mainWindow, {
    title: 'プロジェクトを開く',
    defaultPath: appConfig.get('defaultProjectLocation'),
    filters: [{ name: 'プロセスアナライザープロジェクト', extensions: ['jproj'] }],
    properties: ['openFile']
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      openProject(filePath);
    }
  }).catch(err => {
    console.error('プロジェクトを開く際にエラーが発生しました:', err);
  });
}

// プロジェクトを開く
function openProject(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const projectData = JSON.parse(data);
    
    // 最近使用したプロジェクトに追加
    addToRecentProjects(filePath, projectData.name || path.basename(filePath, '.jproj'));
    
    // プロジェクトデータをUIに送信
    mainWindow.webContents.send('project-opened', { filePath, projectData });
  } catch (error) {
    console.error('プロジェクトファイルの読み込みエラー:', error);
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'プロジェクトを開けません',
      message: '選択されたファイルを開けませんでした。',
      detail: error.message
    });
  }
}

// 最近使用したプロジェクトリストに追加
function addToRecentProjects(filePath, projectName) {
  let recentProjects = appConfig.get('recentProjects') || [];
  
  // 同じパスのプロジェクトが既に存在する場合は削除
  recentProjects = recentProjects.filter(project => project.path !== filePath);
  
  // リストの先頭に追加
  recentProjects.unshift({
    name: projectName,
    path: filePath,
    lastOpened: new Date().toISOString()
  });
  
  // 最大10件まで保持
  if (recentProjects.length > 10) {
    recentProjects = recentProjects.slice(0, 10);
  }
  
  appConfig.set('recentProjects', recentProjects);
}

// アプリケーションが起動準備完了時に実行
app.whenReady().then(async () => {
  // アプリケーションの初期化
  const initialized = await appInitializer.initialize();
  if (!initialized) {
    app.quit();
    return;
  }

  // メインウィンドウの作成
  await createWindow();

  // メニューの設定
  menu.setup(mainWindow);

  // IPC通信ハンドラーの設定
  ipcHandlers.setup(mainWindow);

  // macOSではウィンドウが閉じられても再度開くことが可能
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow.show();
    }
  });
});

// すべてのウィンドウが閉じられたらアプリケーションを終了（Windows、Linux）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// アプリケーション終了時の処理
app.on('before-quit', () => {
  isQuitting = true;
});