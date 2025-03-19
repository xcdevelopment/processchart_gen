// electron/utils/export-utils.js
const fs = require('fs');
const path = require('path');
const { dialog } = require('electron');
const XLSX = require('xlsx');
const appSettings = require('./app-settings');

/**
 * エクスポート/インポートに関するユーティリティ関数
 */
const exportUtils = {
  /**
   * CSVデータをファイルに保存する
   * @param {string} filePath - 保存先ファイルパス
   * @param {string} csvData - CSV形式のデータ
   * @param {Object} options - オプション
   * @param {boolean} options.includeBom - BOMを含めるかどうか
   * @returns {Promise<void>}
   */
  saveCsvFile: async (filePath, csvData, options = {}) => {
    try {
      const { includeBom = appSettings.get('exportSettings.includeBom', true) } = options;
      
      // BOMを追加するかどうか
      let dataToWrite = csvData;
      if (includeBom) {
        const bom = '\ufeff'; // UTF-8 BOM
        dataToWrite = bom + csvData;
      }
      
      // ファイルに書き込み
      await fs.promises.writeFile(filePath, dataToWrite, 'utf8');
    } catch (error) {
      console.error('CSVファイルの保存エラー:', error);
      throw error;
    }
  },

  /**
   * Excelファイルを保存する
   * @param {string} filePath - 保存先ファイルパス
   * @param {Object} data - エクスポートするデータ
   * @param {Array<Array>} data.sheets - シート名とデータの配列
   * @returns {Promise<void>}
   */
  saveExcelFile: async (filePath, data) => {
    try {
      // 新しいワークブックを作成
      const workbook = XLSX.utils.book_new();
      
      // 各シートを追加
      data.sheets.forEach(sheet => {
        const { name, data: sheetData } = sheet;
        
        // データをワークシートに変換
        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        
        // ワークブックにワークシートを追加
        XLSX.utils.book_append_sheet(workbook, worksheet, name);
      });
      
      // ファイルに書き込み
      XLSX.writeFile(workbook, filePath);
    } catch (error) {
      console.error('Excelファイルの保存エラー:', error);
      throw error;
    }
  },

  /**
   * Excelファイルを読み込む
   * @param {string} filePath - 読み込むファイルパス
   * @returns {Promise<Object>} - 読み込んだデータ
   */
  readExcelFile: async (filePath) => {
    try {
      // ファイルが存在するか確認
      await fs.promises.access(filePath, fs.constants.R_OK);
      
      // ファイルを読み込み
      const workbook = XLSX.readFile(filePath, {
        cellStyles: true,
        cellFormulas: true,
        cellDates: true,
        cellNF: true,
        sheetStubs: true
      });
      
      // 各シートのデータを抽出
      const result = {
        sheets: [],
        sheetNames: workbook.SheetNames
      };
      
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        
        // シートデータをJSONに変換
        const sheetData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false
        });
        
        // ヘッダー行（最初の行）を抽出
        const headers = sheetData[0] || [];
        
        // ヘッダーを使ってデータを整形
        const data = [];
        for (let i = 1; i < sheetData.length; i++) {
          const row = sheetData[i];
          if (row.length === 0) continue; // 空行をスキップ
          
          const rowData = {};
          for (let j = 0; j < headers.length; j++) {
            if (headers[j]) { // ヘッダーがある場合のみデータを追加
              rowData[headers[j]] = j < row.length ? row[j] : null;
            }
          }
          
          data.push(rowData);
        }
        
        result.sheets.push({
          name: sheetName,
          headers,
          data
        });
      });
      
      return result;
    } catch (error) {
      console.error('Excelファイルの読み込みエラー:', error);
      throw error;
    }
  },

  /**
   * CSVデータを解析する
   * @param {string} csvData - CSV形式のデータ
   * @param {Object} options - オプション
   * @param {string} options.delimiter - 区切り文字
   * @param {boolean} options.headers - 1行目をヘッダーとして扱うかどうか
   * @param {boolean} options.skipEmptyLines - 空行をスキップするかどうか
   * @returns {Object} - 解析結果
   */
  parseCsvData: (csvData, options = {}) => {
    try {
      const {
        delimiter = appSettings.get('importSettings.defaultCsvDelimiter', ','),
        headers = appSettings.get('importSettings.headers', true),
        skipEmptyLines = appSettings.get('importSettings.skipEmptyLines', true)
      } = options;
      
      // BOMを除去
      let cleanData = csvData;
      if (csvData.charCodeAt(0) === 0xFEFF) {
        cleanData = csvData.substring(1);
      }
      
      // 行に分割
      const lines = cleanData.split(/\r?\n/);
      
      // 空行を削除
      const filteredLines = skipEmptyLines
        ? lines.filter(line => line.trim().length > 0)
        : lines;
      
      if (filteredLines.length === 0) {
        return { headers: [], data: [] };
      }
      
      // 区切り文字を使って各行を分割
      const rows = filteredLines.map(line => {
        const result = [];
        let inQuotes = false;
        let currentValue = '';
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            if (i < line.length - 1 && line[i + 1] === '"') {
              // エスケープされた引用符（""）
              currentValue += '"';
              i++; // 次の引用符をスキップ
            } else {
              // 引用符の切り替え
              inQuotes = !inQuotes;
            }
          } else if (char === delimiter && !inQuotes) {
            // 区切り文字が見つかり、引用符の外にいる場合
            result.push(currentValue);
            currentValue = '';
          } else {
            // 通常の文字
            currentValue += char;
          }
        }
        
        // 最後の値を追加
        result.push(currentValue);
        
        return result;
      });
      
      // ヘッダーと行データを分離
      let headerRow = [];
      let dataRows = [];
      
      if (headers && rows.length > 0) {
        headerRow = rows[0];
        dataRows = rows.slice(1);
      } else {
        dataRows = rows;
      }
      
      // ヘッダーを使ってデータを整形
      const data = headers 
        ? dataRows.map(row => {
            const rowData = {};
            for (let i = 0; i < headerRow.length; i++) {
              if (headerRow[i]) { // ヘッダーがある場合のみデータを追加
                rowData[headerRow[i].trim()] = i < row.length ? row[i] : '';
              }
            }
            return rowData;
          })
        : dataRows;
      
      return {
        headers: headerRow,
        data
      };
    } catch (error) {
      console.error('CSVデータの解析エラー:', error);
      throw error;
    }
  },

  /**
   * データをCSV形式に変換する
   * @param {Array|Object} data - 変換するデータ
   * @param {Array} headers - ヘッダー行（指定しない場合はデータから自動生成）
   * @param {Object} options - オプション
   * @param {string} options.delimiter - 区切り文字
   * @returns {string} - CSV形式のデータ
   */
  convertToCsv: (data, headers = null, options = {}) => {
    try {
      const { delimiter = appSettings.get('exportSettings.defaultCsvDelimiter', ',') } = options;
      
      let csvData = '';
      
      // データが空の場合
      if (!data || (Array.isArray(data) && data.length === 0)) {
        return '';
      }
      
      // データを配列に正規化
      const dataArray = Array.isArray(data) ? data : [data];
      
      // ヘッダーが指定されていない場合は自動生成
      let headerFields = headers;
      if (!headerFields && dataArray.length > 0) {
        // オブジェクトの場合はキーを使用
        if (typeof dataArray[0] === 'object' && dataArray[0] !== null) {
          headerFields = Object.keys(dataArray[0]);
        }
      }
      
      // ヘッダー行を追加
      if (headerFields && headerFields.length > 0) {
        csvData += headerFields.map(field => {
          // カンマやダブルクォートを含む場合はエスケープ
          const escaped = String(field).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(delimiter) + '\n';
      }
      
      // データ行を追加
      dataArray.forEach(row => {
        if (headerFields && headerFields.length > 0 && typeof row === 'object' && row !== null) {
          // ヘッダーフィールドに従ってデータを出力
          const rowValues = headerFields.map(field => {
            const value = row[field];
            
            // nullまたはundefinedの場合は空文字に
            if (value === null || value === undefined) {
              return '';
            }
            
            // 文字列に変換し、必要に応じてエスケープ
            const strValue = String(value);
            if (strValue.includes('"') || strValue.includes(delimiter) || strValue.includes('\n')) {
              return `"${strValue.replace(/"/g, '""')}"`;
            }
            
            return strValue;
          });
          
          csvData += rowValues.join(delimiter) + '\n';
        } else if (Array.isArray(row)) {
          // 配列の場合はそのまま出力
          const rowValues = row.map(value => {
            // nullまたはundefinedの場合は空文字に
            if (value === null || value === undefined) {
              return '';
            }
            
            // 文字列に変換し、必要に応じてエスケープ
            const strValue = String(value);
            if (strValue.includes('"') || strValue.includes(delimiter) || strValue.includes('\n')) {
              return `"${strValue.replace(/"/g, '""')}"`;
            }
            
            return strValue;
          });
          
          csvData += rowValues.join(delimiter) + '\n';
        } else {
          // プリミティブ値の場合はそのまま出力
          csvData += row + '\n';
        }
      });
      
      return csvData;
    } catch (error) {
      console.error('CSVデータの変換エラー:', error);
      throw error;
    }
  }
};

module.exports = exportUtils;