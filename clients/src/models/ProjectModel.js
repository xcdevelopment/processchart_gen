// src/models/ProjectModel.js
import { v4 as uuidv4 } from 'uuid';

/**
 * プロジェクトデータを管理するモデルクラス
 */
class ProjectModel {
  /**
   * 新しいプロジェクトを作成する
   * @param {Object} data - 初期データ
   * @returns {Object} - 新しいプロジェクトオブジェクト
   */
  static create(data = {}) {
    const now = new Date().toISOString();
    
    return {
      id: data.id || uuidv4(),
      name: data.name || '新規プロジェクト',
      description: data.description || '',
      processSteps: data.processSteps || [],
      workloadData: data.workloadData || null,
      improvementResults: data.improvementResults || null,
      filePath: data.filePath || null,
      created: data.created || now,
      modified: data.modified || now,
      metadata: {
        author: data.metadata?.author || '',
        company: data.metadata?.company || '',
        department: data.metadata?.department || '',
        tags: data.metadata?.tags || [],
        version: data.metadata?.version || '1.0.0',
        ...data.metadata
      }
    };
  }

  /**
   * プロジェクトを検証する
   * @param {Object} project - 検証するプロジェクト
   * @returns {Object} - 検証結果
   */
  static validate(project) {
    const errors = {};
    
    // 必須フィールドのチェック
    if (!project.name || project.name.trim() === '') {
      errors.name = 'プロジェクト名は必須です';
    }
    
    // 名前の長さチェック
    if (project.name && project.name.length > 100) {
      errors.name = 'プロジェクト名は100文字以内にしてください';
    }
    
    // 説明の長さチェック
    if (project.description && project.description.length > 1000) {
      errors.description = '説明は1000文字以内にしてください';
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * プロジェクトを更新する
   * @param {Object} project - 更新するプロジェクト
   * @param {Object} updates - 更新内容
   * @returns {Object} - 更新されたプロジェクト
   */
  static update(project, updates) {
    const now = new Date().toISOString();
    
    return {
      ...project,
      ...updates,
      modified: now,
      // metadataは深くマージする
      metadata: updates.metadata 
        ? { ...project.metadata, ...updates.metadata }
        : project.metadata
    };
  }

  /**
   * プロジェクトをインポート可能な形式に変換する
   * @param {Object} project - 変換するプロジェクト
   * @returns {Object} - インポート可能な形式のプロジェクト
   */
  static serialize(project) {
    // シリアライズの際に不要なフィールドを除外
    const { filePath, ...serializable } = project;
    return serializable;
  }

  /**
   * インポートされたデータからプロジェクトを復元する
   * @param {Object} data - インポートされたデータ
   * @returns {Object} - 復元されたプロジェクト
   */
  static deserialize(data) {
    // IDが存在しない場合は新規IDを割り当て
    if (!data.id) {
      data.id = uuidv4();
    }
    
    // 必須フィールドがない場合はデフォルト値を設定
    const now = new Date().toISOString();
    
    return {
      ...data,
      created: data.created || now,
      modified: data.modified || now,
      metadata: data.metadata || {}
    };
  }

  /**
   * 空のプロジェクトかどうかを判定する
   * @param {Object} project - 判定するプロジェクト
   * @returns {boolean} - 空のプロジェクトかどうか
   */
  static isEmpty(project) {
    return (
      (!project.processSteps || project.processSteps.length === 0) &&
      !project.workloadData &&
      !project.improvementResults
    );
  }

  /**
   * プロジェクトをCSV形式に変換する
   * @param {Object} project - 変換するプロジェクト
   * @returns {string} - CSV形式のデータ
   */
  static toCSV(project) {
    if (!project.processSteps || project.processSteps.length === 0) {
      return '';
    }
    
    // ヘッダー行
    const headers = [
      'ステップ名', 'タイプ', '所要時間', '時間単位', '頻度', '頻度単位', '担当者', '使用ツール'
    ];
    
    // データ行
    const rows = project.processSteps.map(step => {
      // タイプの日本語表記
      let typeText = '';
      switch (step.type) {
        case 'process': typeText = '加工'; break;
        case 'inspection': typeText = '検査'; break;
        case 'transport': typeText = '搬送'; break;
        case 'delay': typeText = '停滞'; break;
        case 'storage': typeText = '保管'; break;
        default: typeText = step.type;
      }
      
      return [
        step.data.label,
        typeText,
        step.data.time,
        step.data.timeUnit,
        step.data.frequency,
        step.data.frequencyUnit,
        step.data.responsible,
        step.data.tools
      ].map(value => {
        // カンマを含む場合はダブルクォートで囲む
        const str = String(value || '');
        return str.includes(',') ? `"${str}"` : str;
      }).join(',');
    });
    
    // CSVデータを生成
    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * CSVデータからプロセスステップを生成する
   * @param {string} csvData - CSV形式のデータ
   * @param {Object} mappings - フィールドのマッピング
   * @returns {Array} - 生成されたプロセスステップ
   */
  static stepsFromCSV(csvData, mappings) {
    // CSVをパース
    const lines = csvData.split(/\r?\n/);
    if (lines.length <= 1) {
      return [];
    }
    
    // ヘッダー行を取得
    const headers = lines[0].split(',').map(h => h.trim());
    
    // マッピングを検証
    if (!mappings.label || !mappings.type || !mappings.time) {
      throw new Error('ステップ名、タイプ、時間は必須項目です');
    }
    
    // プロセスステップを生成
    const steps = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // 空行をスキップ
      
      // 行をパース
      const values = this.parseCSVLine(lines[i]);
      if (values.length !== headers.length) {
        console.warn(`行 ${i+1} のカラム数がヘッダーと一致しません`);
        continue;
      }
      
      // 行データをオブジェクトに変換
      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header] = values[index];
      });
      
      // タイプの変換
      let stepType = 'process'; // デフォルト値
      const typeValue = rowData[mappings.type]?.toLowerCase() || '';
      
      if (typeValue.includes('検査') || typeValue.includes('確認') || typeValue.includes('チェック')) {
        stepType = 'inspection';
      } else if (typeValue.includes('搬送') || typeValue.includes('転送') || typeValue.includes('移動')) {
        stepType = 'transport';
      } else if (typeValue.includes('停滞') || typeValue.includes('待ち') || typeValue.includes('待機')) {
        stepType = 'delay';
      } else if (typeValue.includes('保管') || typeValue.includes('保存')) {
        stepType = 'storage';
      } else if (typeValue.includes('加工') || typeValue.includes('作業') || typeValue.includes('処理')) {
        stepType = 'process';
      }
      
      // 他のフィールド取得
      const timeValue = parseFloat(rowData[mappings.time]) || 0;
      const timeUnitValue = rowData[mappings.timeUnit] || '分';
      const frequencyValue = parseFloat(rowData[mappings.frequency]) || 1;
      const frequencyUnitValue = rowData[mappings.frequencyUnit] || '日';
      
      // Position の計算（ステップ間で適切な間隔を設ける）
      const position = {
        x: 150 + (steps.length * 200),
        y: 100 + (Math.floor(steps.length / 5) * 150) // 5ステップごとに行を変える
      };
      
      // ステップオブジェクトの作成
      steps.push({
        id: `step-${i}`,
        type: stepType,
        position,
        data: {
          label: rowData[mappings.label] || `ステップ ${i}`,
          time: timeValue,
          timeUnit: timeUnitValue,
          frequency: frequencyValue,
          frequencyUnit: frequencyUnitValue,
          responsible: rowData[mappings.responsible] || '',
          tools: rowData[mappings.tools] || ''
        }
      });
    }
    
    return steps;
  }

  /**
   * CSV行をパースする（引用符で囲まれたカンマを考慮）
   * @param {string} line - CSV行
   * @returns {Array} - パースされた値の配列
   */
  static parseCSVLine(line) {
    const result = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          // エスケープされた引用符 ("") は単一の引用符に変換
          currentValue += '"';
          i++; // 次の引用符をスキップ
        } else {
          // 引用符の状態を切り替え
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // カンマが見つかり、引用符の外にいる場合は値を追加
        result.push(currentValue);
        currentValue = '';
      } else {
        // その他の文字をそのまま追加
        currentValue += char;
      }
    }
    
    // 最後の値を追加
    result.push(currentValue);
    
    return result;
  }
}

export default ProjectModel;