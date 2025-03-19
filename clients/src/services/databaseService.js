// src/services/databaseService.js
/**
 * Electron環境におけるNeDBデータベースとの通信を担当するサービス
 */
const DatabaseService = {
    /**
     * 改善施策を検索する
     * @param {Object} query - 検索クエリ（空の場合は全件取得）
     * @returns {Promise<Array>} 改善施策の配列
     */
    findImprovements: async (query = {}) => {
      try {
        // Electronのexpose済みAPIを使用
        if (window.electron) {
          return await window.electron.findImprovements(query);
        } else {
          // 開発環境など、Electron以外での動作時はローカルストレージを使用
          console.warn('Electron APIが利用できません。ローカルストレージを使用します。');
          return findInLocalStorage('improvements', query);
        }
      } catch (error) {
        console.error('改善施策の検索に失敗しました:', error);
        throw error;
      }
    },
  
    /**
     * 改善施策を保存する
     * @param {Object} improvement - 保存する改善施策オブジェクト
     * @returns {Promise<Object>} 保存結果
     */
    saveImprovement: async (improvement) => {
      try {
        if (window.electron) {
          return await window.electron.saveImprovement(improvement);
        } else {
          console.warn('Electron APIが利用できません。ローカルストレージを使用します。');
          return saveToLocalStorageFallback('improvements', improvement);
        }
      } catch (error) {
        console.error('改善施策の保存に失敗しました:', error);
        throw error;
      }
    },
  
    /**
     * プロジェクトを保存する
     * @param {Object} data - 保存するプロジェクトデータ
     * @returns {Promise<Object>} 保存結果
     */
    saveProject: async (data) => {
      try {
        if (window.electron) {
          return await window.electron.saveProject(data);
        } else {
          console.warn('Electron APIが利用できません。ローカルストレージを使用します。');
          
          // プロジェクト名をキーとして保存
          const key = `project_${data.projectData.name.replace(/\s+/g, '_')}`;
          localStorage.setItem(key, JSON.stringify(data.projectData));
          
          return { 
            success: true, 
            filePath: null, 
            localStorageKey: key 
          };
        }
      } catch (error) {
        console.error('プロジェクトの保存に失敗しました:', error);
        throw error;
      }
    },
  
    /**
     * CSVデータをエクスポートする
     * @param {Object} data - エクスポートするCSVデータとファイル名
     * @returns {Promise<Object>} エクスポート結果
     */
    exportCsv: async (data) => {
      try {
        if (window.electron) {
          return await window.electron.exportCsv(data);
        } else {
          console.warn('Electron APIが利用できません。ブラウザのダウンロード機能を使用します。');
          
          // ブラウザ環境でのCSVダウンロード
          const blob = new Blob([data.data], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', data.defaultFilename || 'export.csv');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          return { 
            success: true, 
            filePath: null 
          };
        }
      } catch (error) {
        console.error('CSVエクスポートに失敗しました:', error);
        throw error;
      }
    },
  
    /**
     * CSVファイルをインポートする
     * @returns {Promise<Object>} インポートしたCSVデータ
     */
    importCsv: async () => {
      try {
        if (window.electron) {
          return await window.electron.importCsv();
        } else {
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
      } catch (error) {
        console.error('CSVインポートに失敗しました:', error);
        throw error;
      }
    },
  
    /**
     * グラフィックをSVGまたはPNGとしてエクスポートする
     * @param {Object} data - エクスポートするSVGデータと形式
     * @returns {Promise<Object>} エクスポート結果
     */
    exportImage: async (data) => {
      try {
        if (window.electron) {
          return await window.electron.exportImage(data);
        } else {
          console.warn('Electron APIが利用できません。ブラウザのダウンロード機能を使用します。');
          
          const { svgData, type } = data;
          let downloadData, filename, mimeType;
          
          if (type === 'svg') {
            // SVGデータ
            downloadData = svgData;
            filename = 'process_chart.svg';
            mimeType = 'image/svg+xml';
          } else {
            // PNGデータ (Base64形式)
            downloadData = svgData; // すでにBase64形式と想定
            filename = 'process_chart.png';
            mimeType = 'image/png';
          }
          
          // ブラウザでのダウンロード処理
          const blob = new Blob([downloadData], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          return { 
            success: true, 
            filePath: null 
          };
        }
      } catch (error) {
        console.error('イメージエクスポートに失敗しました:', error);
        throw error;
      }
    }
  };
  
  /**
   * Electron非対応環境でのローカルストレージフォールバック（検索用）
   * @param {string} storeName - ストア名
   * @param {Object} query - 検索クエリ
   * @returns {Array} 検索結果
   */
  function findInLocalStorage(storeName, query) {
    try {
      // ローカルストレージからデータを取得
      const storedDataStr = localStorage.getItem(storeName);
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
  
  /**
   * Electron非対応環境でのローカルストレージフォールバック（保存用）
   * @param {string} storeName - ストア名
   * @param {Object} data - 保存するデータ
   * @returns {Object} 保存結果
   */
  function saveToLocalStorageFallback(storeName, data) {
    try {
      // 既存データの取得
      const storedDataStr = localStorage.getItem(storeName);
      let storedData = storedDataStr ? JSON.parse(storedDataStr) : [];
      
      // 配列でなければ初期化
      if (!Array.isArray(storedData)) {
        storedData = [];
      }
      
      let result;
      
      // IDがある場合は更新、なければ新規追加
      if (data._id) {
        const index = storedData.findIndex(item => item._id === data._id);
        
        if (index >= 0) {
          // 更新
          storedData[index] = {
            ...data,
            updatedAt: new Date().toISOString()
          };
          result = { success: true, numReplaced: 1, doc: storedData[index] };
        } else {
          // 見つからなかった場合は追加
          const newDoc = {
            ...data,
            updatedAt: new Date().toISOString()
          };
          storedData.push(newDoc);
          result = { success: true, numReplaced: 0, doc: newDoc };
        }
      } else {
        // 新規追加
        const newDoc = {
          ...data,
          _id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        storedData.push(newDoc);
        result = { success: true, doc: newDoc };
      }
      
      // 保存
      localStorage.setItem(storeName, JSON.stringify(storedData));
      
      return result;
    } catch (error) {
      console.error('ローカルストレージへの保存に失敗しました:', error);
      return { success: false, error: error.message };
    }
  }
  
  export default DatabaseService;