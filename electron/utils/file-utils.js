// electron/utils/file-utils.js
const fs = require('fs');
const path = require('path');
const appSettings = require('./app-settings');
const { app } = require('electron');

/**
 * ファイル操作に関するユーティリティ関数
 */
const fileUtils = {
  /**
   * プロジェクトファイルを保存する
   * @param {string} filePath - 保存先ファイルパス
   * @param {Object} projectData - 保存するプロジェクトデータ
   * @returns {Promise<void>}
   */
  saveProjectFile: async (filePath, projectData) => {
    try {
      // ディレクトリが存在しない場合は作成する
      const dir = path.dirname(filePath);
      await fs.promises.mkdir(dir, { recursive: true });
      
      // タイムスタンプを更新
      const dataToSave = {
        ...projectData,
        modified: new Date().toISOString()
      };
      
      // JSONとして書き込み
      await fs.promises.writeFile(
        filePath,
        JSON.stringify(dataToSave, null, 2),
        'utf8'
      );
      
      return { success: true };
    } catch (error) {
      console.error('プロジェクトファイルの保存エラー:', error);
      throw error;
    }
  },
  
  /**
   * プロジェクトファイルを読み込む
   * @param {string} filePath - 読み込むファイルパス
   * @returns {Promise<Object>} - 読み込んだプロジェクトデータ
   */
  loadProjectFile: async (filePath) => {
    try {
      // ファイルが存在するか確認
      await fs.promises.access(filePath, fs.constants.R_OK);
      
      // ファイルを読み込み
      const content = await fs.promises.readFile(filePath, 'utf8');
      
      // JSONとしてパース
      const projectData = JSON.parse(content);
      
      return projectData;
    } catch (error) {
      console.error('プロジェクトファイルの読み込みエラー:', error);
      throw new Error(`プロジェクトファイルの読み込みに失敗しました: ${error.message}`);
    }
  },
  
  /**
   * 最近使用したプロジェクトリストに追加する
   * @param {string} filePath - プロジェクトファイルパス
   * @param {string} projectName - プロジェクト名
   */
  addToRecentProjects: (filePath, projectName) => {
    try {
      const name = projectName || path.basename(filePath, '.jproj');
      appSettings.addRecentProject({ name, path: filePath });
    } catch (error) {
      console.error('最近使用したプロジェクトリストの更新エラー:', error);
    }
  },
  
  /**
   * 一時ファイルを作成する
   * @param {string} prefix - ファイル名のプレフィックス
   * @param {string} extension - ファイルの拡張子
   * @param {string} content - ファイルの内容
   * @returns {Promise<string>} - 作成した一時ファイルのパス
   */
  createTempFile: async (prefix, extension, content) => {
    try {
      // 一時ディレクトリパスを取得
      const tempDir = path.join(app.getPath('temp'), 'process-analyzer');
      
      // ディレクトリが存在しない場合は作成
      await fs.promises.mkdir(tempDir, { recursive: true });
      
      // 一意なファイル名を生成
      const timestamp = new Date().getTime();
      const random = Math.floor(Math.random() * 10000);
      const fileName = `${prefix}-${timestamp}-${random}.${extension}`;
      const filePath = path.join(tempDir, fileName);
      
      // ファイルに内容を書き込み
      await fs.promises.writeFile(filePath, content);
      
      return filePath;
    } catch (error) {
      console.error('一時ファイルの作成エラー:', error);
      throw error;
    }
  },
  
  /**
   * 一時ファイルを削除する
   * @param {string} filePath - 削除する一時ファイルのパス
   * @returns {Promise<boolean>} - 削除に成功したかどうか
   */
  deleteTempFile: async (filePath) => {
    try {
      await fs.promises.unlink(filePath);
      return true;
    } catch (error) {
      console.error('一時ファイルの削除エラー:', error);
      return false;
    }
  },
  
  /**
   * ディレクトリ内のファイル一覧を取得する
   * @param {string} dirPath - ディレクトリパス
   * @param {string} extension - フィルタする拡張子（オプション）
   * @returns {Promise<Array<string>>} - ファイルパスのリスト
   */
  listFiles: async (dirPath, extension = null) => {
    try {
      const files = await fs.promises.readdir(dirPath);
      
      if (extension) {
        return files
          .filter(file => path.extname(file).toLowerCase() === `.${extension.toLowerCase()}`)
          .map(file => path.join(dirPath, file));
      }
      
      return files.map(file => path.join(dirPath, file));
    } catch (error) {
      console.error('ファイル一覧の取得エラー:', error);
      throw error;
    }
  },
  
  /**
   * ディレクトリが存在するか確認し、存在しない場合は作成する
   * @param {string} dirPath - ディレクトリパス
   * @returns {Promise<boolean>} - 既に存在したか、新規作成したか
   */
  ensureDirectory: async (dirPath) => {
    try {
      await fs.promises.access(dirPath, fs.constants.F_OK);
      return true; // 既に存在する
    } catch (error) {
      // 存在しない場合は作成
      try {
        await fs.promises.mkdir(dirPath, { recursive: true });
        return false; // 新規作成
      } catch (err) {
        console.error('ディレクトリの作成エラー:', err);
        throw err;
      }
    }
  },
  
  /**
   * ファイルが存在するか確認する
   * @param {string} filePath - ファイルパス
   * @returns {Promise<boolean>} - ファイルが存在するかどうか
   */
  fileExists: async (filePath) => {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch (error) {
      return false;
    }
  },
  
  /**
   * ファイルを削除する
   * @param {string} filePath - 削除するファイルパス
   * @returns {Promise<boolean>} - 削除に成功したかどうか
   */
  deleteFile: async (filePath) => {
    try {
      await fs.promises.unlink(filePath);
      return true;
    } catch (error) {
      console.error('ファイルの削除エラー:', error);
      return false;
    }
  },
  
  /**
   * ファイルをコピーする
   * @param {string} sourcePath - コピー元ファイルパス
   * @param {string} destPath - コピー先ファイルパス
   * @returns {Promise<void>}
   */
  copyFile: async (sourcePath, destPath) => {
    try {
      await fs.promises.copyFile(sourcePath, destPath);
    } catch (error) {
      console.error('ファイルのコピーエラー:', error);
      throw error;
    }
  },
  
  /**
   * テンプレートプロジェクトを作成する
   * @param {string} templateName - テンプレート名
   * @param {string} filePath - 保存先ファイルパス
   * @returns {Promise<void>}
   */
  createProjectFromTemplate: async (templateName, filePath) => {
    try {
      // テンプレートファイルのパスを取得
      const templatePath = path.join(
        app.getAppPath(),
        'assets',
        'templates',
        `${templateName}.jproj`
      );
      
      // テンプレートファイルが存在するか確認
      const exists = await fileUtils.fileExists(templatePath);
      
      if (!exists) {
        throw new Error(`テンプレート "${templateName}" が見つかりません`);
      }
      
      // テンプレートファイルの内容を読み込む
      const templateData = await fileUtils.loadProjectFile(templatePath);
      
      // 新しいプロジェクトファイルとして保存
      await fileUtils.saveProjectFile(filePath, {
        ...templateData,
        name: path.basename(filePath, '.jproj'),
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      });
    } catch (error) {
      console.error('テンプレートからのプロジェクト作成エラー:', error);
      throw error;
    }
  }
};

module.exports = fileUtils;