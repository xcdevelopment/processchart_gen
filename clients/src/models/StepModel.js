// src/models/StepModel.js
import { v4 as uuidv4 } from 'uuid';

/**
 * プロセスステップを管理するモデルクラス
 */
class StepModel {
  /**
   * 新しいプロセスステップを作成する
   * @param {string} type - ステップタイプ（process, inspection, transport, delay, storage）
   * @param {Object} data - ステップデータ
   * @param {Object} position - 位置情報
   * @returns {Object} - 新しいプロセスステップ
   */
  static create(type, data = {}, position = { x: 0, y: 0 }) {
    // ステップタイプのバリデーション
    const validType = this.validateType(type);
    
    // デフォルトデータの設定
    const defaultData = this.getDefaultData(validType);
    
    // データをマージ
    const mergedData = {
      ...defaultData,
      ...data,
      // 必須フィールドがnullまたはundefinedの場合はデフォルト値を使用
      label: data.label || defaultData.label,
      time: data.time !== undefined && data.time !== null ? data.time : defaultData.time,
      timeUnit: data.timeUnit || defaultData.timeUnit,
      frequency: data.frequency !== undefined && data.frequency !== null ? data.frequency : defaultData.frequency,
      frequencyUnit: data.frequencyUnit || defaultData.frequencyUnit
    };
    
    return {
      id: data.id || `step-${uuidv4()}`,
      type: validType,
      position,
      data: mergedData
    };
  }

  /**
   * ステップタイプを検証する
   * @param {string} type - ステップタイプ
   * @returns {string} - 検証済みのステップタイプ
   */
  static validateType(type) {
    const validTypes = ['process', 'inspection', 'transport', 'delay', 'storage'];
    
    if (!validTypes.includes(type)) {
      console.warn(`無効なステップタイプ: ${type}。デフォルトの 'process' を使用します。`);
      return 'process';
    }
    
    return type;
  }

  /**
   * タイプに応じたデフォルトデータを取得する
   * @param {string} type - ステップタイプ
   * @returns {Object} - デフォルトデータ
   */
  static getDefaultData(type) {
    const commonDefaults = {
      time: 10,
      timeUnit: '分',
      frequency: 1,
      frequencyUnit: '日',
      responsible: '',
      tools: '',
      notes: ''
    };
    
    switch (type) {
      case 'process':
        return {
          ...commonDefaults,
          label: '加工・作業',
          category: 'value-added' // 付加価値作業
        };
      
      case 'inspection':
        return {
          ...commonDefaults,
          label: '検査',
          category: 'non-value-added', // 非付加価値作業
          checkType: 'quality', // 品質検査
          checkItems: []
        };
      
      case 'transport':
        return {
          ...commonDefaults,
          label: '搬送・転送',
          category: 'non-value-added', // 非付加価値作業
          distance: 0,
          distanceUnit: 'm'
        };
      
      case 'delay':
        return {
          ...commonDefaults,
          label: '停滞・待ち',
          category: 'waste', // ムダ
          reason: '',
          priority: 'medium' // 優先度
        };
      
      case 'storage':
        return {
          ...commonDefaults,
          label: '保管',
          category: 'non-value-added', // 非付加価値作業
          storageType: 'temporary', // 一時保管
          location: ''
        };
      
      default:
        return {
          ...commonDefaults,
          label: 'ステップ'
        };
    }
  }

  /**
   * プロセスステップを更新する
   * @param {Object} step - 更新するステップ
   * @param {Object} updates - 更新内容
   * @returns {Object} - 更新されたステップ
   */
  static update(step, updates) {
    // 位置の更新
    const position = updates.position ? { ...step.position, ...updates.position } : step.position;
    
    // データの更新
    const data = updates.data ? { ...step.data, ...updates.data } : step.data;
    
    // タイプの更新（タイプが変更される場合は、タイプ固有のデフォルトデータをマージ）
    let type = updates.type !== undefined ? updates.type : step.type;
    let updatedData = data;
    
    if (updates.type && updates.type !== step.type) {
      type = this.validateType(updates.type);
      const typeDefaults = this.getDefaultData(type);
      
      // 共通フィールドは現在の値を保持し、タイプ固有フィールドはデフォルト値を使用
      updatedData = {
        ...typeDefaults,
        label: data.label,
        time: data.time,
        timeUnit: data.timeUnit,
        frequency: data.frequency,
        frequencyUnit: data.frequencyUnit,
        responsible: data.responsible,
        tools: data.tools,
        notes: data.notes
      };
    }
    
    return {
      ...step,
      type,
      position,
      data: updatedData,
      // その他の更新可能なフィールド
      ...(updates.id ? { id: updates.id } : {}),
      ...(updates.selected !== undefined ? { selected: updates.selected } : {}),
      ...(updates.dragging !== undefined ? { dragging: updates.dragging } : {})
    };
  }

  /**
   * 年間工数を計算する
   * @param {Object} step - プロセスステップ
   * @param {Object} options - 計算オプション
   * @returns {Object} - 計算結果
   */
  static calculateAnnualWorkload(step, options = {}) {
    const {
      businessDaysPerYear = 250,
      businessWeeksPerYear = 52,
      businessMonthsPerYear = 12,
      hoursPerDay = 8
    } = options;
    
    const { data } = step;
    const { time, timeUnit, frequency, frequencyUnit } = data;
    
    // 分単位に統一
    let minutesPerOccurrence = time;
    if (timeUnit === '時間') {
      minutesPerOccurrence *= 60;
    } else if (timeUnit === '日') {
      minutesPerOccurrence *= hoursPerDay * 60;
    }
    
    // 年間頻度を計算
    let annualFrequency = 0;
    switch (frequencyUnit) {
      case '日':
        annualFrequency = frequency * businessDaysPerYear;
        break;
      case '週':
        annualFrequency = frequency * businessWeeksPerYear;
        break;
      case '月':
        annualFrequency = frequency * businessMonthsPerYear;
        break;
      case '年':
        annualFrequency = frequency;
        break;
      default:
        annualFrequency = 0;
    }
    
    // 年間総時間を計算
    const annualMinutes = minutesPerOccurrence * annualFrequency;
    const annualHours = annualMinutes / 60;
    const annualDays = annualHours / hoursPerDay;
    
    return {
      minutesPerOccurrence,
      annualFrequency,
      annualMinutes,
      annualHours,
      annualDays
    };
  }

  /**
   * ステップの種類（付加価値/非付加価値/ムダ）を判定する
   * @param {Object} step - プロセスステップ
   * @returns {string} - 種類
   */
  static getValueType(step) {
    if (step.data.category) {
      return step.data.category;
    }
    
    // カテゴリが設定されていない場合はタイプから判定
    switch (step.type) {
      case 'process':
        return 'value-added'; // 付加価値作業
      
      case 'inspection':
      case 'transport':
      case 'storage':
        return 'non-value-added'; // 非付加価値作業
      
      case 'delay':
        return 'waste'; // ムダ
      
      default:
        return 'non-value-added';
    }
  }

  /**
   * ステップタイプの日本語名を取得する
   * @param {string} type - ステップタイプ
   * @returns {string} - 日本語名
   */
  static getTypeName(type) {
    switch (type) {
      case 'process': return '加工';
      case 'inspection': return '検査';
      case 'transport': return '搬送';
      case 'delay': return '停滞';
      case 'storage': return '保管';
      default: return type;
    }
  }

  /**
   * プロセスステップをクローンする
   * @param {Object} step - クローン元のステップ
   * @param {Object} overrides - 上書きするプロパティ
   * @returns {Object} - クローンされたステップ
   */
  static clone(step, overrides = {}) {
    const clonedStep = {
      ...step,
      id: `step-${uuidv4()}`, // 新しいIDを生成
      position: { ...step.position }, // 位置はディープコピー
      data: { ...step.data } // データはディープコピー
    };
    
    // オーバーライドを適用
    if (overrides.position) {
      clonedStep.position = { ...clonedStep.position, ...overrides.position };
    }
    
    if (overrides.data) {
      clonedStep.data = { ...clonedStep.data, ...overrides.data };
    }
    
    if (overrides.type) {
      clonedStep.type = this.validateType(overrides.type);
    }
    
    return clonedStep;
  }
}

export default StepModel;