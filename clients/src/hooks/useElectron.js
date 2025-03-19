// src/hooks/useElectron.js
import { useState, useEffect, useCallback } from 'react';

/**
 * Electron APIとの連携を管理するカスタムフック
 * @returns {Object} - Electron関連のユーティリティとステート
 */
export function useElectron() {
  // Electron APIが利用可能かどうか
  const [isElectron, setIsElectron] = useState(false);
  
  // 初期化時にElectron APIが利用可能かどうかを確認
  useEffect(() => {
    setIsElectron(!!window.electron);
  }, []);

  /**
   * プロジェクトを保存する
   * @param {Object} projectData - 保存するプロジェクトデータ
   * @param {string|null} filePath - 保存先ファイルパス（nullの場合は保存ダイアログを表示）
   * @returns {Promise<Object>} - 保存結果
   */
  const saveProject = useCallback(async (projectData, filePath = null) => {
    if (!isElectron) {
      console.warn('Electron APIが利用できません。ローカルストレージを使用します。');
      
      // プロジェクト名をキーとして保存
      const key = `project_${projectData.name.replace(/\s+/g, '_')}`;
      localStorage.setItem(key, JSON.stringify(projectData));
      
      return { 
        success: true, 
        filePath: null, 
        localStorageKey: key 
      };
    }
    
    try {
      return await window.electron.saveProject({ filePath, projectData });
    } catch (error) {
      console.error('プロジェクト保存エラー:', error);
      return { success: false, message: error.message };
    }
  }, [isElectron]);

  /**
   * プロジェクトを開く
   * @param {string|null} filePath - 開くファイルパス（nullの場合はファイル選択ダイアログを表示）
   * @returns {Promise<Object>} - 読み込み結果
   */
  const openProject = useCallback(async (filePath = null) => {
    if (!isElectron) {
      console.warn('Electron APIが利用できません。ローカルストレージを使用します。');
      
      // ローカルストレージからプロジェクト一覧を取得
      const projectKeys = Object.keys(localStorage).filter(key => key.startsWith('project_'));
      
      if (projectKeys.length === 0) {
        return { success: false, message: 'ローカルストレージにプロジェクトがありません' };
      }
      
      // 特定のキーが指定されている場合はそのプロジェクトを取得
      if (filePath) {
        const projectData = JSON.parse(localStorage.getItem(filePath));
        return { success: true, projectData, filePath };
      }
      
      // ダイアログの代わりにプロンプトでプロジェクトを選択
      const projectNames = projectKeys.map(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          return { key, name: data.name };
        } catch (e) {
          return { key, name: key };
        }
      });
      
      const projectsList = projectNames.map((p, i) => `${i + 1}: ${p.name}`).join('\n');
      const selected = prompt(
        `開くプロジェクトを選択してください（1-${projectNames.length}):\n${projectsList}`,
        '1'
      );
      
      if (!selected || isNaN(parseInt(selected))) {
        return { success: false, message: 'キャンセルされました' };
      }
      
      const index = parseInt(selected) - 1;
      if (index < 0 || index >= projectNames.length) {
        return { success: false, message: '無効な選択です' };
      }
      
      const selectedKey = projectNames[index].key;
      try {
        const projectData = JSON.parse(localStorage.getItem(selectedKey));
        return { success: true, projectData, filePath: selectedKey };
      } catch (error) {
        return { success: false, message: 'プロジェクトデータの解析に失敗しました' };
      }
    }
    
    try {
      return await window.electron.openProject({ filePath });
    } catch (error) {
      console.error('プロジェクト読み込みエラー:', error);
      return { success: false, message: error.message };
    }
  }, [isElectron]);

  /**
   * CSVをエクスポートする
   * @param {string} data - CSVデータ
   * @param {string} defaultFilename - デフォルトのファイル名
   * @returns {Promise<Object>} - エクスポート結果
   */
  const exportCsv = useCallback(async (data, defaultFilename = 'export.csv') => {
    if (!isElectron) {
      console.warn('Electron APIが利用できません。ブラウザのダウンロード機能を使用します。');
      
      // ブラウザ環境でのCSVダウンロード
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', defaultFilename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { 
        success: true, 
        filePath: null 
      };
    }
    
    try {
      return await window.electron.exportCsv({ data, defaultFilename });
    } catch (error) {
      console.error('CSVエクスポートエラー:', error);
      return { success: false, message: error.message };
    }
  }, [isElectron]);

  /**
   * CSVをインポートする
   * @returns {Promise<Object>} - インポート結果
   */
  const importCsv = useCallback(async () => {
    if (!isElectron) {
      console.warn('Electron APIが利用できません。ブラウザのファイル選択を使用します。');
      
      // ファイル選択ダイアログを表示
      return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        
        input.onchange = (event) => {
          const file = event.target.files[0];
          if (!file) {
            resolve({ success: false, message: 'ファイルが選択されていません' });
            return;
          }
          
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({ 
              success: true, 
              data: e.target.result,
              filePath: file.name 
            });
          };
          reader.onerror = (e) => {
            reject(new Error('ファイルの読み込みに失敗しました'));
          };
          
          reader.readAsText(file);
        };
        
        input.click();
      });
    }
    
    try {
      return await window.electron.importCsv();
    } catch (error) {
      console.error('CSVインポートエラー:', error);
      return { success: false, message: error.message };
    }
  }, [isElectron]);

  /**
   * イメージ（SVG/PNG）をエクスポートする
   * @param {string} svgData - SVGデータまたはBase64エンコードされたPNGデータ
   * @param {string} type - エクスポート形式（'svg'または'png'）
   * @returns {Promise<Object>} - エクスポート結果
   */
  const exportImage = useCallback(async (svgData, type = 'svg') => {
    if (!isElectron) {
      console.warn('Electron APIが利用できません。ブラウザのダウンロード機能を使用します。');
      
      const extension = type === 'svg' ? 'svg' : 'png';
      const mimeType = type === 'svg' ? 'image/svg+xml' : 'image/png';
      
      // ブラウザでのダウンロード処理
      const blob = new Blob([svgData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `process_chart.${extension}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { 
        success: true, 
        filePath: null 
      };
    }
    
    try {
      return await window.electron.exportImage({ svgData, type });
    } catch (error) {
      console.error('イメージエクスポートエラー:', error);
      return { success: false, message: error.message };
    }
  }, [isElectron]);

  /**
   * 改善施策を検索する
   * @param {Object} query - 検索クエリ
   * @returns {Promise<Array>} - 検索結果
   */
  const findImprovements = useCallback(async (query = {}) => {
    if (!isElectron) {
      console.warn('Electron APIが利用できません。ローカルストレージを使用します。');
      
      try {
        // ローカルストレージからデータを取得
        const storedDataStr = localStorage.getItem('improvements');
        let storedData = storedDataStr ? JSON.parse(storedDataStr) : [];
        
        // 配列でなければ初期化
        if (!Array.isArray(storedData)) {
          storedData = [];
        }
        
        // クエリが空の場合は全件返す
        if (!query || Object.keys(query).length === 0) {
          return storedData;
        }
        
        // 簡易的なクエリ処理
        return storedData.filter(item => {
          return Object.entries(query).every(([key, value]) => {
            return item[key] === value;
          });
        });
      } catch (error) {
        console.error('ローカルストレージからの読み込みに失敗しました:', error);
        return [];
      }
    }
    
    try {
      return await window.electron.findImprovements(query);
    } catch (error) {
      console.error('改善施策の検索エラー:', error);
      return [];
    }
  }, [isElectron]);

  /**
   * 改善施策を保存する
   * @param {Object} improvement - 保存する改善施策
   * @returns {Promise<Object>} - 保存結果
   */
  const saveImprovement = useCallback(async (improvement) => {
    if (!isElectron) {
      console.warn('Electron APIが利用できません。ローカルストレージを使用します。');
      
      try {
        // 既存データの取得
        const storedDataStr = localStorage.getItem('improvements');
        let storedData = storedDataStr ? JSON.parse(storedDataStr) : [];
        
        // 配列でなければ初期化
        if (!Array.isArray(storedData)) {
          storedData = [];
        }
        
        let result;
        
        // IDがある場合は更新、なければ新規追加
        if (improvement._id) {
          const index = storedData.findIndex(item => item._id === improvement._id);
          
          if (index >= 0) {
            // 更新
            storedData[index] = {
              ...improvement,
              updatedAt: new Date().toISOString()
            };
            result = { success: true, numReplaced: 1, doc: storedData[index] };
          } else {
            // 見つからなかった場合は追加
            const newDoc = {
              ...improvement,
              updatedAt: new Date().toISOString()
            };
            storedData.push(newDoc);
            result = { success: true, numReplaced: 0, doc: newDoc };
          }
        } else {
          // 新規追加
          const newDoc = {
            ...improvement,
            _id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          storedData.push(newDoc);
          result = { success: true, doc: newDoc };
        }
        
        // 保存
        localStorage.setItem('improvements', JSON.stringify(storedData));
        
        return result;
      } catch (error) {
        console.error('ローカルストレージへの保存に失敗しました:', error);
        return { success: false, error: error.message };
      }
    }
    
    try {
      return await window.electron.saveImprovement(improvement);
    } catch (error) {
      console.error('改善施策の保存エラー:', error);
      return { success: false, error: error.message };
    }
  }, [isElectron]);

  /**
   * アプリケーション設定を取得する
   * @param {string} key - 設定キー（指定しない場合は全ての設定を取得）
   * @param {*} defaultValue - デフォルト値
   * @returns {Promise<*>} - 設定値
   */
  const getSetting = useCallback(async (key, defaultValue = null) => {
    if (!isElectron) {
      console.warn('Electron APIが利用できません。ローカルストレージを使用します。');
      
      try {
        const settingsKey = 'app_settings';
        const settingsStr = localStorage.getItem(settingsKey);
        const settings = settingsStr ? JSON.parse(settingsStr) : {};
        
        if (key) {
          return key in settings ? settings[key] : defaultValue;
        } else {
          return settings;
        }
      } catch (error) {
        console.error('設定の取得に失敗しました:', error);
        return defaultValue;
      }
    }
    
    try {
      return await window.electron.getSetting(key, defaultValue);
    } catch (error) {
      console.error('設定の取得エラー:', error);
      return defaultValue;
    }
  }, [isElectron]);

  /**
   * アプリケーション設定を保存する
   * @param {string} key - 設定キー
   * @param {*} value - 設定値
   * @returns {Promise<Object>} - 保存結果
   */
  const setSetting = useCallback(async (key, value) => {
    if (!isElectron) {
      console.warn('Electron APIが利用できません。ローカルストレージを使用します。');
      
      try {
        const settingsKey = 'app_settings';
        const settingsStr = localStorage.getItem(settingsKey);
        const settings = settingsStr ? JSON.parse(settingsStr) : {};
        
        settings[key] = value;
        localStorage.setItem(settingsKey, JSON.stringify(settings));
        
        return { success: true };
      } catch (error) {
        console.error('設定の保存に失敗しました:', error);
        return { success: false, error: error.message };
      }
    }
    
    try {
      return await window.electron.setSetting(key, value);
    } catch (error) {
      console.error('設定の保存エラー:', error);
      return { success: false, error: error.message };
    }
  }, [isElectron]);

  // 公開するAPIとステート
  return {
    isElectron,
    saveProject,
    openProject,
    exportCsv,
    importCsv,
    exportImage,
    findImprovements,
    saveImprovement,
    getSetting,
    setSetting,
    addMenuListener: (eventName, callback) => {
      if (!isElectron || !window.electron.onMenuEvent) {
        return undefined;
      }
      
      return window.electron.onMenuEvent(eventName, callback);
    }
  };
}