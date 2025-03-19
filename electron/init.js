// electron/init.js
const { app } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const splash = require('./splash');
const dbManager = require('./database');
const appSettings = require('./utils/app-settings');

/**
 * アプリケーションの初期化処理を行うクラス
 */
class AppInitializer {
  /**
   * 初期化処理を実行する
   * @returns {Promise<void>}
   */
  async initialize() {
    // スプラッシュスクリーンを表示
    splash.create();
    splash.updateStatus('初期化しています...');
    splash.updateProgress(10);

    try {
      // ユーザーデータディレクトリの設定
      await this.setupUserDataDirectories();
      splash.updateProgress(30);
      splash.updateStatus('データベースを準期化しています...');

      // データベースの初期化
      dbManager.initialize();
      splash.updateProgress(50);
      splash.updateStatus('設定を読み込んでいます...');

      // アプリケーション設定の初期化
      await this.setupAppSettings();
      splash.updateProgress(70);
      splash.updateStatus('テンプレートを準備しています...');

      // テンプレートの初期化
      await this.setupTemplates();
      splash.updateProgress(90);
      splash.updateStatus('起動準備完了...');

      // 開発モードの設定
      this.setupDevelopmentEnvironment();
      splash.updateProgress(100);

      return true;
    } catch (error) {
      console.error('アプリケーションの初期化中にエラーが発生しました:', error);
      splash.updateStatus(`エラー: ${error.message}`);
      return false;
    }
  }

  /**
   * ユーザーデータディレクトリを作成する
   * @returns {Promise<void>}
   */
  async setupUserDataDirectories() {
    const userDataPath = app.getPath('userData');
    
    // 必要なディレクトリを作成
    const dirs = [
      path.join(userDataPath, 'databases'),
      path.join(userDataPath, 'projects'),
      path.join(userDataPath, 'exports'),
      path.join(userDataPath, 'templates'),
      path.join(userDataPath, 'temp'),
      path.join(userDataPath, 'logs')
    ];

    // 各ディレクトリが存在しない場合は作成
    for (const dir of dirs) {
      await fs.ensureDir(dir);
    }

    // ログディレクトリにログファイルを作成
    const logFile = path.join(userDataPath, 'logs', 'app.log');
    if (!await fs.pathExists(logFile)) {
      const timestamp = new Date().toISOString();
      await fs.writeFile(logFile, `# Application Log - Started at ${timestamp}\n`);
    }

    // パスを設定に保存
    appSettings.set('paths.userData', userDataPath);
    appSettings.set('paths.databases', path.join(userDataPath, 'databases'));
    appSettings.set('paths.projects', path.join(userDataPath, 'projects'));
    appSettings.set('paths.exports', path.join(userDataPath, 'exports'));
    appSettings.set('paths.templates', path.join(userDataPath, 'templates'));
    appSettings.set('paths.temp', path.join(userDataPath, 'temp'));
    appSettings.set('paths.logs', path.join(userDataPath, 'logs'));
  }

  /**
   * アプリケーション設定を初期化する
   * @returns {Promise<void>}
   */
  async setupAppSettings() {
    // デフォルトプロジェクト保存場所が設定されていない場合は設定
    if (!appSettings.get('defaultProjectLocation')) {
      appSettings.set('defaultProjectLocation', app.getPath('documents'));
    }

    // テーマが設定されていない場合はデフォルト設定
    if (!appSettings.get('theme')) {
      // システムの設定を取得して反映
      const isDarkMode = false;
      try {
        if (process.platform === 'darwin' || process.platform === 'win32') {
          const { nativeTheme } = require('electron');
          isDarkMode = nativeTheme.shouldUseDarkColors;
        }
      } catch (e) {
        console.warn('システムテーマの取得に失敗しました:', e);
      }

      appSettings.set('theme', isDarkMode ? 'dark' : 'light');
    }

    // 計算設定のデフォルト値
    if (!appSettings.has('calculationSettings')) {
      appSettings.set('calculationSettings', {
        businessDaysPerYear: 250,
        hoursPerDay: 8
      });
    }

    // 改善設定のデフォルト値
    if (!appSettings.has('improvementSettings')) {
      appSettings.set('improvementSettings', {
        timeThreshold: 30,
        waitThreshold: 60,
        frequencyThreshold: 50
      });
    }

    // ウィンドウサイズが設定されていない場合はデフォルト設定
    if (!appSettings.has('windowSize')) {
      appSettings.set('windowSize', { width: 1200, height: 800 });
    }
  }

  /**
   * テンプレートを初期化する
   * @returns {Promise<void>}
   */
  async setupTemplates() {
    const templatesPath = appSettings.get('paths.templates');
    const builtinTemplatesPath = path.join(process.resourcesPath, 'templates');

    // 組み込みテンプレートが存在するか確認
    let hasBuiltinTemplates = false;
    try {
      hasBuiltinTemplates = await fs.pathExists(builtinTemplatesPath);
    } catch (error) {
      console.warn('組み込みテンプレートの確認に失敗しました:', error);
    }

    // 開発モードでの代替パス
    const devTemplatesPath = path.join(app.getAppPath(), 'assets', 'templates');
    
    // テンプレートのコピー元パス
    const sourceTemplatesPath = hasBuiltinTemplates ? builtinTemplatesPath : devTemplatesPath;
    
    try {
      // ソースパスが存在するか確認
      const sourceExists = await fs.pathExists(sourceTemplatesPath);
      
      if (sourceExists) {
        // テンプレートディレクトリ内のファイル一覧を取得
        const files = await fs.readdir(sourceTemplatesPath);
        
        // テンプレートファイルが存在する場合
        if (files.length > 0) {
          // ユーザーディレクトリにテンプレートをコピー
          for (const file of files) {
            const sourcePath = path.join(sourceTemplatesPath, file);
            const targetPath = path.join(templatesPath, file);
            
            // 対象ファイルが存在しない場合のみコピー
            const exists = await fs.pathExists(targetPath);
            if (!exists) {
              await fs.copy(sourcePath, targetPath);
            }
          }
        } else {
          console.warn('テンプレートが見つかりませんでした');
        }
      } else {
        console.warn('テンプレートフォルダが見つかりませんでした');
        
        // デフォルトのテンプレートを作成
        await this.createDefaultTemplate();
      }
    } catch (error) {
      console.error('テンプレートの初期化に失敗しました:', error);
      
      // エラーが発生した場合もデフォルトテンプレートを作成
      await this.createDefaultTemplate();
    }
  }

  /**
   * デフォルトのテンプレートを作成する
   * @returns {Promise<void>}
   */
  async createDefaultTemplate() {
    const templatesPath = appSettings.get('paths.templates');
    const defaultTemplatePath = path.join(templatesPath, 'default_project.jproj');

    // デフォルトのテンプレート内容
    const defaultTemplate = {
      name: '新規プロジェクト',
      description: 'デフォルトテンプレート',
      processSteps: [],
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      metadata: {
        author: '',
        company: '',
        department: '',
        tags: [],
        version: '1.0.0'
      }
    };

    try {
      // テンプレートを保存
      await fs.writeFile(defaultTemplatePath, JSON.stringify(defaultTemplate, null, 2), 'utf8');
    } catch (error) {
      console.error('デフォルトテンプレートの作成に失敗しました:', error);
    }
  }

  /**
   * 開発環境のセットアップ
   */
  setupDevelopmentEnvironment() {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    console.log('開発モードで実行中...');

    try {
      // ホットリロード
      const electronReload = require('electron-reload');
      electronReload(app.getAppPath(), {
        electron: path.join(process.cwd(), 'node_modules', '.bin', 'electron'),
        awaitWriteFinish: true
      });

      // 開発者ツール拡張
      const { default: installExtension, REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = require('electron-devtools-installer');
      
      installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS])
        .then(name => console.log(`拡張機能インストール完了: ${name}`))
        .catch(err => console.log('拡張機能インストールエラー:', err));
    } catch (error) {
      console.warn('開発環境設定エラー:', error);
    }
  }
}

module.exports = new AppInitializer();