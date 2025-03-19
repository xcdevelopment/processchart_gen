// electron/ipc-handlers.js
const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const dbManager = require('./database');
const fileUtils = require('./utils/file-utils');
const exportUtils = require('./utils/export-utils');
const appSettings = require('./utils/app-settings');

/**
 * IPC通信ハンドラを設定する
 * @param {Electron.BrowserWindow} mainWindow - メインウィンドウ
 */
function setupIpcHandlers(mainWindow) {
  // データベース操作ハンドラ
  setupDatabaseHandlers();
  
  // ファイル操作ハンドラ
  setupFileHandlers();
  
  // エクスポート/インポートハンドラ
  setupExportImportHandlers();
  
  // アプリケーション設定ハンドラ
  setupSettingsHandlers();

  // デバッグ関連のハンドラー
  setupDebugHandlers(mainWindow);
}

/**
 * データベース操作に関するIPC通信ハンドラを設定する
 */
function setupDatabaseHandlers() {
  // 改善施策の検索
  ipcMain.handle('db-find-improvements', async (event, query, options) => {
    try {
      return await dbManager.find('improvements', query, options);
    } catch (error) {
      console.error('改善施策の検索エラー:', error);
      throw new Error(`改善施策の検索中にエラーが発生しました: ${error.message}`);
    }
  });
  
  // 改善施策の保存
  ipcMain.handle('db-save-improvement', async (event, improvement) => {
    try {
      if (improvement._id) {
        // 既存の改善施策を更新
        const { numAffected, affectedDocuments } = await dbManager.update(
          'improvements',
          { _id: improvement._id },
          improvement,
          { returnUpdatedDocs: true }
        );
        return { success: true, numReplaced: numAffected, doc: affectedDocuments };
      } else {
        // 新規改善施策を保存
        const newDoc = await dbManager.insert('improvements', improvement);
        return { success: true, doc: newDoc };
      }
    } catch (error) {
      console.error('改善施策の保存エラー:', error);
      throw new Error(`改善施策の保存中にエラーが発生しました: ${error.message}`);
    }
  });
  
  // 改善施策の削除
  ipcMain.handle('db-remove-improvement', async (event, id) => {
    try {
      const numRemoved = await dbManager.remove('improvements', { _id: id });
      return { success: true, numRemoved };
    } catch (error) {
      console.error('改善施策の削除エラー:', error);
      throw new Error(`改善施策の削除中にエラーが発生しました: ${error.message}`);
    }
  });
  
  // プロジェクトメタデータの保存
  ipcMain.handle('db-save-project-meta', async (event, projectMeta) => {
    try {
      if (projectMeta._id) {
        // 既存のプロジェクトメタデータを更新
        const { numAffected } = await dbManager.update(
          'projects',
          { _id: projectMeta._id },
          projectMeta,
          { returnUpdatedDocs: true }
        );
        return { success: true, numReplaced: numAffected };
      } else {
        // 新規プロジェクトメタデータを保存
        const newMeta = await dbManager.insert('projects', projectMeta);
        return { success: true, meta: newMeta };
      }
    } catch (error) {
      console.error('プロジェクトメタデータの保存エラー:', error);
      throw new Error(`プロジェクトメタデータの保存中にエラーが発生しました: ${error.message}`);
    }
  });
  
  // プロジェクトメタデータの検索
  ipcMain.handle('db-find-projects', async (event, query, options) => {
    try {
      return await dbManager.find('projects', query, options);
    } catch (error) {
      console.error('プロジェクトメタデータの検索エラー:', error);
      throw new Error(`プロジェクトメタデータの検索中にエラーが発生しました: ${error.message}`);
    }
  });
}

/**
 * ファイル操作に関するIPC通信ハンドラを設定する
 */
function setupFileHandlers() {
  // プロジェクトの保存
  ipcMain.handle('save-project', async (event, { filePath, projectData }) => {
    try {
      // ファイルパスが指定されていない場合は保存ダイアログを表示
      if (!filePath) {
        const { filePath: selectedPath, canceled } = await dialog.showSaveDialog({
          title: 'プロジェクトを保存',
          defaultPath: path.join(
            appSettings.get('defaultProjectLocation'),
            `${projectData.name || 'untitled'}.jproj`
          ),
          filters: [{ name: 'プロセスアナライザープロジェクト', extensions: ['jproj'] }]
        });
        
        if (canceled || !selectedPath) {
          return { success: false, message: 'キャンセルされました' };
        }
        
        filePath = selectedPath;
      }
      
      // プロジェクトデータをJSONとして保存
      await fileUtils.saveProjectFile(filePath, projectData);
      
      // 最近使用したプロジェクトリストに追加
      fileUtils.addToRecentProjects(filePath, projectData.name);
      
      // 保存先ディレクトリをデフォルトとして設定
      appSettings.set('defaultProjectLocation', path.dirname(filePath));
      
      return { success: true, filePath };
    } catch (error) {
      console.error('プロジェクト保存エラー:', error);
      return { success: false, message: error.message };
    }
  });
  
  // プロジェクトを開く
  ipcMain.handle('open-project', async (event, { filePath }) => {
    try {
      // ファイルパスが指定されていない場合はファイル選択ダイアログを表示
      if (!filePath) {
        const { filePaths, canceled } = await dialog.showOpenDialog({
          title: 'プロジェクトを開く',
          defaultPath: appSettings.get('defaultProjectLocation'),
          filters: [{ name: 'プロセスアナライザープロジェクト', extensions: ['jproj'] }],
          properties: ['openFile']
        });
        
        if (canceled || filePaths.length === 0) {
          return { success: false, message: 'キャンセルされました' };
        }
        
        filePath = filePaths[0];
      }
      
      // プロジェクトファイルを読み込み
      const projectData = await fileUtils.loadProjectFile(filePath);
      
      // 最近使用したプロジェクトリストに追加
      fileUtils.addToRecentProjects(filePath, projectData.name);
      
      return { success: true, filePath, projectData };
    } catch (error) {
      console.error('プロジェクト読み込みエラー:', error);
      return { success: false, message: error.message };
    }
  });
}

/**
 * エクスポート/インポートに関するIPC通信ハンドラを設定する
 */
function setupExportImportHandlers() {
  // CSVエクスポート
  ipcMain.handle('export-csv', async (event, { data, defaultFilename }) => {
    try {
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: 'CSVエクスポート',
        defaultPath: path.join(
          appSettings.get('defaultProjectLocation'),
          defaultFilename || 'export.csv'
        ),
        filters: [{ name: 'CSVファイル', extensions: ['csv'] }]
      });
      
      if (canceled || !filePath) {
        return { success: false, message: 'キャンセルされました' };
      }
      
      await fs.promises.writeFile(filePath, data, 'utf8');
      return { success: true, filePath };
    } catch (error) {
      console.error('CSVエクスポートエラー:', error);
      return { success: false, message: error.message };
    }
  });
  
  // CSVインポート
  ipcMain.handle('import-csv', async (event) => {
    try {
      const { filePaths, canceled } = await dialog.showOpenDialog({
        title: 'CSVインポート',
        defaultPath: appSettings.get('defaultProjectLocation'),
        filters: [{ name: 'CSVファイル', extensions: ['csv'] }],
        properties: ['openFile']
      });
      
      if (canceled || filePaths.length === 0) {
        return { success: false, message: 'キャンセルされました' };
      }
      
      const filePath = filePaths[0];
      const data = await fs.promises.readFile(filePath, 'utf8');
      
      return { success: true, data, filePath };
    } catch (error) {
      console.error('CSVインポートエラー:', error);
      return { success: false, message: error.message };
    }
  });
  
  // Excelエクスポート
  ipcMain.handle('export-excel', async (event, { data, defaultFilename }) => {
    try {
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: 'Excelエクスポート',
        defaultPath: path.join(
          appSettings.get('defaultProjectLocation'),
          defaultFilename || 'export.xlsx'
        ),
        filters: [{ name: 'Excelファイル', extensions: ['xlsx'] }]
      });
      
      if (canceled || !filePath) {
        return { success: false, message: 'キャンセルされました' };
      }
      
      await exportUtils.saveExcelFile(filePath, data);
      return { success: true, filePath };
    } catch (error) {
      console.error('Excelエクスポートエラー:', error);
      return { success: false, message: error.message };
    }
  });
  
  // Excelインポート
  ipcMain.handle('import-excel', async (event) => {
    try {
      const { filePaths, canceled } = await dialog.showOpenDialog({
        title: 'Excelインポート',
        defaultPath: appSettings.get('defaultProjectLocation'),
        filters: [{ name: 'Excelファイル', extensions: ['xlsx', 'xls'] }],
        properties: ['openFile']
      });
      
      if (canceled || filePaths.length === 0) {
        return { success: false, message: 'キャンセルされました' };
      }
      
      const filePath = filePaths[0];
      const data = await exportUtils.readExcelFile(filePath);
      
      return { success: true, data, filePath };
    } catch (error) {
      console.error('Excelインポートエラー:', error);
      return { success: false, message: error.message };
    }
  });
  
  // SVG/PNG エクスポート
  ipcMain.handle('export-image', async (event, { svgData, type }) => {
    try {
      const extension = type === 'svg' ? 'svg' : 'png';
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: `${extension.toUpperCase()}エクスポート`,
        defaultPath: path.join(
          appSettings.get('defaultProjectLocation'),
          `process_chart.${extension}`
        ),
        filters: [{ name: `${extension.toUpperCase()}ファイル`, extensions: [extension] }]
      });
      
      if (canceled || !filePath) {
        return { success: false, message: 'キャンセルされました' };
      }
      
      if (type === 'svg') {
        // SVGデータをそのまま保存
        await fs.promises.writeFile(filePath, svgData, 'utf8');
      } else if (type === 'png') {
        // SVGからPNGへの変換は、レンダラープロセスで行った結果のデータ（Base64）を受け取る想定
        const base64Data = svgData.replace(/^data:image\/png;base64,/, '');
        await fs.promises.writeFile(filePath, Buffer.from(base64Data, 'base64'));
      }
      
      return { success: true, filePath };
    } catch (error) {
      console.error('イメージエクスポートエラー:', error);
      return { success: false, message: error.message };
    }
  });
}

/**
 * アプリケーション設定に関するIPC通信ハンドラを設定する
 */
function setupSettingsHandlers() {
  // 設定の取得
  ipcMain.handle('get-settings', async (event, key) => {
    try {
      if (key) {
        return appSettings.get(key);
      } else {
        return appSettings.getAll();
      }
    } catch (error) {
      console.error('設定の取得エラー:', error);
      throw new Error(`設定の取得中にエラーが発生しました: ${error.message}`);
    }
  });
  
  // 設定の保存
  ipcMain.handle('set-settings', async (event, key, value) => {
    try {
      appSettings.set(key, value);
      return { success: true };
    } catch (error) {
      console.error('設定の保存エラー:', error);
      throw new Error(`設定の保存中にエラーが発生しました: ${error.message}`);
    }
  });
  
  // 最近使用したプロジェクトリストの取得
  ipcMain.handle('get-recent-projects', async (event) => {
    try {
      return appSettings.get('recentProjects') || [];
    } catch (error) {
      console.error('最近使用したプロジェクトの取得エラー:', error);
      throw new Error(`最近使用したプロジェクトの取得中にエラーが発生しました: ${error.message}`);
    }
  });
}

// デバッグ関連のハンドラー
function setupDebugHandlers(mainWindow) {
  ipcMain.handle('open-dev-tools', async () => {
    if (mainWindow) {
      mainWindow.webContents.openDevTools();
      return { success: true };
    }
    return { success: false, error: 'メインウィンドウが利用できません' };
  });

  ipcMain.handle('reload-app', async () => {
    if (mainWindow) {
      mainWindow.reload();
      return { success: true };
    }
    return { success: false, error: 'メインウィンドウが利用できません' };
  });

  ipcMain.handle('get-system-info', async () => {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.versions.node,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      appVersion: app.getVersion(),
      appPath: app.getAppPath(),
      userDataPath: app.getPath('userData')
    };
  });
}

module.exports = { setupIpcHandlers };