// electron/menu.js
const { app, Menu, dialog, shell } = require('electron');
const path = require('path');
const appConfig = require('./utils/app-settings');

/**
 * アプリケーションメニューを生成する
 * @param {BrowserWindow} mainWindow - メインウィンドウ
 * @returns {Menu} - アプリケーションメニュー
 */
function createApplicationMenu(mainWindow) {
  const isMac = process.platform === 'darwin';
  const isDev = process.env.NODE_ENV === 'development';
  
  // 最近使用したプロジェクトメニューの作成
  const recentProjectsSubmenu = buildRecentProjectsMenu(mainWindow);

  const template = [
    // macOS専用のアプリメニュー
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about', label: `${app.name}について` },
        { type: 'separator' },
        { role: 'services', label: 'サービス' },
        { type: 'separator' },
        { role: 'hide', label: `${app.name}を隠す` },
        { role: 'hideOthers', label: '他を隠す' },
        { role: 'unhide', label: 'すべて表示' },
        { type: 'separator' },
        { role: 'quit', label: `${app.name}を終了` }
      ]
    }] : []),
    
    // ファイルメニュー
    {
      label: 'ファイル',
      submenu: [
        {
          label: '新規プロジェクト',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu-new-project')
        },
        {
          label: 'プロジェクトを開く',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            dialog.showOpenDialog(mainWindow, {
              title: 'プロジェクトを開く',
              defaultPath: appConfig.get('defaultProjectLocation'),
              filters: [{ name: 'プロセスアナライザープロジェクト', extensions: ['jproj'] }],
              properties: ['openFile']
            }).then(result => {
              if (!result.canceled && result.filePaths.length > 0) {
                const filePath = result.filePaths[0];
                mainWindow.webContents.send('open-project-requested', { filePath });
              }
            }).catch(err => {
              console.error('プロジェクトを開く際にエラーが発生しました:', err);
            });
          }
        },
        {
          label: '最近開いたプロジェクト',
          submenu: recentProjectsSubmenu
        },
        { type: 'separator' },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('menu-save-project')
        },
        {
          label: '名前を付けて保存',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow.webContents.send('menu-save-project-as')
        },
        { type: 'separator' },
        {
          label: 'エクスポート',
          submenu: [
            {
              label: 'CSVエクスポート',
              click: () => mainWindow.webContents.send('menu-export-csv')
            },
            {
              label: 'Excelエクスポート',
              click: () => mainWindow.webContents.send('menu-export-excel')
            },
            {
              label: 'プロセスチャートをSVGエクスポート',
              click: () => mainWindow.webContents.send('menu-export-svg')
            },
            {
              label: 'プロセスチャートをPNGエクスポート',
              click: () => mainWindow.webContents.send('menu-export-png')
            }
          ]
        },
        {
          label: 'インポート',
          submenu: [
            {
              label: 'CSVインポート',
              click: () => mainWindow.webContents.send('menu-import-csv')
            },
            {
              label: 'Excelインポート',
              click: () => mainWindow.webContents.send('menu-import-excel')
            }
          ]
        },
        ...(!isMac ? [{ type: 'separator' }] : []),
        ...(!isMac ? [{ role: 'quit', label: '終了' }] : [])
      ]
    },
    
    // 編集メニュー
    {
      label: '編集',
      submenu: [
        { role: 'undo', label: '元に戻す' },
        { role: 'redo', label: 'やり直し' },
        { type: 'separator' },
        { role: 'cut', label: '切り取り' },
        { role: 'copy', label: 'コピー' },
        { role: 'paste', label: '貼り付け' },
        { role: 'delete', label: '削除' },
        { type: 'separator' },
        { role: 'selectAll', label: 'すべて選択' }
      ]
    },
    
    // 表示メニュー
    {
      label: '表示',
      submenu: [
        {
          label: 'プロセスチャート',
          click: () => mainWindow.webContents.send('menu-view-process-chart')
        },
        {
          label: '工数分析',
          click: () => mainWindow.webContents.send('menu-view-workload')
        },
        {
          label: '改善提案',
          click: () => mainWindow.webContents.send('menu-view-improvement')
        },
        { type: 'separator' },
        {
          label: 'ズームイン',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => mainWindow.webContents.send('menu-zoom-in')
        },
        {
          label: 'ズームアウト',
          accelerator: 'CmdOrCtrl+-',
          click: () => mainWindow.webContents.send('menu-zoom-out')
        },
        {
          label: 'ズームリセット',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow.webContents.send('menu-zoom-reset')
        },
        { type: 'separator' },
        { role: 'reload', label: '再読込' },
        { role: 'forceReload', label: '強制再読込' },
        { role: isDev ? 'toggleDevTools' : null, label: '開発者ツール' },
        { type: 'separator' },
        { role: 'resetZoom', label: '実際のサイズ' },
        { role: 'zoomIn', label: '拡大' },
        { role: 'zoomOut', label: '縮小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'フルスクリーン' }
      ]
    },
    
    // ウィンドウメニュー
    {
      label: 'ウィンドウ',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'zoom', label: 'ズーム' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front', label: '全てを前面に表示' },
          { type: 'separator' },
          { role: 'window', label: 'ウィンドウ' }
        ] : [
          { role: 'close', label: '閉じる' }
        ])
      ]
    },
    
    // ヘルプメニュー
    {
      role: 'help',
      label: 'ヘルプ',
      submenu: [
        {
          label: 'ヘルプドキュメント',
          click: () => mainWindow.webContents.send('menu-open-help')
        },
        {
          label: 'オンラインドキュメント',
          click: async () => {
            await shell.openExternal('https://github.com/yourorganization/process-analyzer');
          }
        },
        { type: 'separator' },
        {
          label: 'バージョン情報',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              title: app.name,
              message: app.name,
              detail: `バージョン: ${app.getVersion()}\n© ${new Date().getFullYear()} Your Organization`,
              buttons: ['OK'],
              icon: path.join(__dirname, 'icons', 'icon.png')
            });
          }
        }
      ]
    }
  ];

  return Menu.buildFromTemplate(template.filter(Boolean));
}

/**
 * 最近使用したプロジェクトメニューを生成する
 * @param {BrowserWindow} mainWindow - メインウィンドウ
 * @returns {Array} - 最近使用したプロジェクトのメニュー項目
 */
function buildRecentProjectsMenu(mainWindow) {
  const recentProjects = appConfig.get('recentProjects') || [];
  
  if (recentProjects.length === 0) {
    return [{ label: '最近使用したプロジェクトはありません', enabled: false }];
  }
  
  // 最新の10件を表示
  return recentProjects.slice(0, 10).map(project => ({
    label: `${project.name} (${project.path})`,
    click: () => {
      mainWindow.webContents.send('project-opened', { 
        filePath: project.path, 
        projectData: { name: project.name }
      });
    }
  }));
}

module.exports = { createApplicationMenu };