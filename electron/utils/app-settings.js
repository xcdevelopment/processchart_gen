// electron/utils/app-settings.js
const { app } = require('electron');
const Store = require('electron-store');
const path = require('path');

/**
 * アプリケーション設定を管理するクラス
 */
class AppSettings {
  constructor() {
    // デフォルト設定
    const defaults = {
      // ウィンドウサイズと位置
      windowSize: { width: 1200, height: 800 },
      windowPosition: null,
      isMaximized: false,
      
      // 最近使用したプロジェクト
      recentProjects: [],
      
      // デフォルトの保存場所
      defaultProjectLocation: app.getPath('documents'),
      
      // テーマ設定
      theme: 'light', // 'light' または 'dark'
      
      // プロセスチャート設定
      processChartSettings: {
        snapToGrid: true,
        gridSize: 20,
        defaultNodeWidth: 150,
        defaultNodeHeight: 40,
        zoomOnScroll: true,
        zoomOnPinch: true,
        panOnScroll: false,
        panOnScrollMode: undefined,
        panOnScrollSpeed: 0.5,
        panOnScrollModifier: null,
        autoPanOnConnect: true,
        zoomOnDoubleClick: true
      },
      
      // 業務時間計算設定
      calculationSettings: {
        businessDaysPerYear: 250,
        businessWeeksPerYear: 52,
        businessMonthsPerYear: 12,
        hoursPerDay: 8
      },
      
      // 改善分析設定
      improvementSettings: {
        timeThreshold: 30,
        waitThreshold: 60,
        frequencyThreshold: 50
      },
      
      // エクスポート設定
      exportSettings: {
        defaultCsvDelimiter: ',',
        includeBom: true,
        defaultImageFormat: 'png',
        defaultImageDpi: 300
      },
      
      // インポート設定
      importSettings: {
        defaultCsvDelimiter: ',',
        detectCsvDelimiter: true,
        skipEmptyLines: true,
        headers: true
      }
    };

    // 設定ストアの初期化
    this.store = new Store({
      name: 'app-settings',
      defaults,
      // 設定の型を定義（バリデーション用）
      schema: {
        windowSize: {
          type: 'object',
          properties: {
            width: { type: 'number', minimum: 400 },
            height: { type: 'number', minimum: 300 }
          }
        },
        windowPosition: {
          type: ['object', 'null'],
          properties: {
            x: { type: 'number' },
            y: { type: 'number' }
          }
        },
        isMaximized: { type: 'boolean' },
        recentProjects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              lastOpened: { type: 'string', format: 'date-time' }
            }
          }
        },
        defaultProjectLocation: { type: 'string' },
        theme: { type: 'string', enum: ['light', 'dark'] }
      },
      migrations: {
        // 以前のバージョンからの移行用マイグレーション
        '1.0.0': store => {
          // 例: 古い設定の形式を新しい形式に変換
          if (store.has('oldSetting')) {
            store.set('newSetting', store.get('oldSetting'));
            store.delete('oldSetting');
          }
        }
      }
    });
  }

  /**
   * 設定値を取得する
   * @param {string} key - 設定キー
   * @param {*} [defaultValue=null] - デフォルト値
   * @returns {*} 設定値
   */
  get(key, defaultValue = null) {
    return this.store.has(key) ? this.store.get(key) : defaultValue;
  }

  /**
   * 設定キーが存在するかどうかを確認する
   * @param {string} key - 設定キー
   * @returns {boolean} 設定が存在するかどうか
   */
  has(key) {
    return this.store.has(key);
  }

  /**
   * 全ての設定を取得する
   * @returns {Object} 全設定
   */
  getAll() {
    return this.store.store;
  }

  /**
   * 設定値を設定する
   * @param {string} key - 設定キー
   * @param {*} value - 設定値
   */
  set(key, value) {
    this.store.set(key, value);
  }

  /**
   * 設定値を複数同時に設定する
   * @param {Object} settings - 設定キーと値のオブジェクト
   */
  setMultiple(settings) {
    for (const [key, value] of Object.entries(settings)) {
      this.set(key, value);
    }
  }

  /**
   * 設定を削除する
   * @param {string} key - 削除する設定キー
   */
  delete(key) {
    this.store.delete(key);
  }

  /**
   * 設定をリセットする
   */
  reset() {
    this.store.clear();
  }

  /**
   * 最近使用したプロジェクトリストを更新する
   * @param {Object} project - プロジェクト情報
   * @param {string} project.name - プロジェクト名
   * @param {string} project.path - プロジェクトファイルパス
   */
  addRecentProject(project) {
    const { name, path } = project;
    let recentProjects = this.get('recentProjects', []);
    
    // 既に存在する場合は削除（重複防止）
    recentProjects = recentProjects.filter(p => p.path !== path);
    
    // リストの先頭に追加
    recentProjects.unshift({
      name,
      path,
      lastOpened: new Date().toISOString()
    });
    
    // 最大10件に制限
    if (recentProjects.length > 10) {
      recentProjects = recentProjects.slice(0, 10);
    }
    
    this.set('recentProjects', recentProjects);
  }

  /**
   * 最近使用したプロジェクトを削除する
   * @param {string} path - 削除するプロジェクトのパス
   */
  removeRecentProject(path) {
    const recentProjects = this.get('recentProjects', []).filter(p => p.path !== path);
    this.set('recentProjects', recentProjects);
  }

  /**
   * ウィンドウサイズを保存する
   * @param {Object} size - ウィンドウサイズ
   * @param {number} size.width - 幅
   * @param {number} size.height - 高さ
   */
  saveWindowSize(size) {
    this.set('windowSize', size);
  }

  /**
   * ウィンドウ位置を保存する
   * @param {Object} position - ウィンドウ位置
   * @param {number} position.x - X座標
   * @param {number} position.y - Y座標
   */
  saveWindowPosition(position) {
    this.set('windowPosition', position);
  }

  /**
   * ウィンドウの最大化状態を保存する
   * @param {boolean} isMaximized - 最大化状態
   */
  saveWindowMaximized(isMaximized) {
    this.set('isMaximized', isMaximized);
  }
}

// シングルトンインスタンスを作成
const appSettings = new AppSettings();

module.exports = appSettings;