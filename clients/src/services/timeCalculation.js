// src/services/timeCalculation.js

/**
 * 業務ステップの所要時間を年間工数に換算するサービス
 */
export const TimeCalculationService = {
  /**
   * 各業務ステップの所要時間を年間工数に換算
   * @param {Array} steps - 業務ステップの配列
   * @param {Object} options - 計算オプション
   * @returns {Object} 年間工数の合計と内訳
   */
  calculateAnnualWorkload: (steps, options = {}) => {
    // デフォルト値の設定
    const {
      businessDaysPerYear = 250,    // 年間営業日数
      businessWeeksPerYear = 52,    // 年間週数
      businessMonthsPerYear = 12,   // 年間月数
      hoursPerDay = 8               // 1日の労働時間
    } = options;
    
    // 作業カテゴリ（JMA方式の工程タイプ）
    const CATEGORIES = {
      PROCESS: 'process',      // 加工
      INSPECTION: 'inspection', // 検査
      TRANSPORT: 'transport',   // 搬送
      DELAY: 'delay',           // 停滞
      STORAGE: 'storage'        // 保管
    };
    
    // 結果保存用
    let result = {
      totalMinutes: 0,
      totalHours: 0,
      totalDays: 0,
      categorySummary: {
        [CATEGORIES.PROCESS]: 0,
        [CATEGORIES.INSPECTION]: 0,
        [CATEGORIES.TRANSPORT]: 0,
        [CATEGORIES.DELAY]: 0,
        [CATEGORIES.STORAGE]: 0
      },
      stepDetails: []
    };
    
    // ステップがない場合は空の結果を返す
    if (!steps || steps.length === 0) {
      return result;
    }
    
    // 各ステップの年間工数を計算
    steps.forEach(step => {
      // ステップデータの取得
      const { id, type, data } = step;
      const { label, time, timeUnit, frequency, frequencyUnit } = data;
      
      // 値が不正な場合はスキップ
      if (!time || time <= 0 || !frequency || frequency <= 0) {
        return;
      }
      
      // 分単位に統一
      let minutesPerOccurrence = time;
      if (timeUnit === '時間') {
        minutesPerOccurrence *= 60;
      } else if (timeUnit === '日') {
        minutesPerOccurrence *= hoursPerDay * 60; // 1日=8時間
      }
      
      // 年間発生回数を計算
      let occurrencesPerYear = 0;
      switch (frequencyUnit) {
        case '日':
          occurrencesPerYear = frequency * businessDaysPerYear;
          break;
        case '週':
          occurrencesPerYear = frequency * businessWeeksPerYear;
          break;
        case '月':
          occurrencesPerYear = frequency * businessMonthsPerYear;
          break;
        case '年':
          occurrencesPerYear = frequency;
          break;
        default:
          occurrencesPerYear = 0;
      }
      
      // 年間総時間を計算（分単位）
      const annualMinutes = minutesPerOccurrence * occurrencesPerYear;
      const annualHours = annualMinutes / 60;
      
      // 結果を更新
      result.totalMinutes += annualMinutes;
      
      // カテゴリが有効なら集計に追加
      if (type && CATEGORIES[type.toUpperCase()]) {
        result.categorySummary[type] += annualMinutes;
      }
      
      // ステップ詳細を追加
      result.stepDetails.push({
        id,
        label,
        type,
        minutesPerOccurrence,
        occurrencesPerYear,
        annualMinutes,
        annualHours: Math.round(annualHours * 10) / 10
      });
    });
    
    // 合計時間を時間と日数に換算
    result.totalHours = Math.round(result.totalMinutes / 60 * 10) / 10;
    result.totalDays = Math.round(result.totalHours / hoursPerDay * 10) / 10;
    
    // カテゴリごとの時間を時間単位に変換
    Object.keys(result.categorySummary).forEach(category => {
      result.categorySummary[category] = Math.round(result.categorySummary[category] / 60 * 10) / 10;
    });
    
    return result;
  },
  
  /**
   * 業務改善効果の計算
   * @param {Object} currentWorkload - 現状の年間工数
   * @param {Array} improvements - 改善施策の配列
   * @returns {Object} 改善後の年間工数と削減効果
   */
  calculateImprovementEffect: (currentWorkload, improvements) => {
    // 現在の工数がない場合は計算不能
    if (!currentWorkload) {
      return {
        before: null,
        after: null,
        savings: {
          hours: 0,
          days: 0,
          percent: 0
        }
      };
    }
    
    // 改善施策がない場合は効果なし
    if (!improvements || improvements.length === 0) {
      return {
        before: currentWorkload,
        after: currentWorkload,
        savings: {
          hours: 0,
          days: 0,
          percent: 0
        }
      };
    }
    
    // 深いコピーを作成して変更可能な状態にする
    const improvedWorkload = JSON.parse(JSON.stringify(currentWorkload));
    
    // 各改善施策を適用
    improvements.forEach(improvement => {
      const { targetStepId, timeReductionPercent } = improvement;
      
      // 対象ステップを検索
      const targetStepIndex = improvedWorkload.stepDetails.findIndex(step => step.id === targetStepId);
      
      if (targetStepIndex >= 0) {
        const targetStep = improvedWorkload.stepDetails[targetStepIndex];
        const originalMinutes = targetStep.annualMinutes;
        
        // 削減時間を計算
        const reductionRate = timeReductionPercent / 100;
        const reducedMinutes = originalMinutes * reductionRate;
        
        // 値を更新
        targetStep.annualMinutes -= reducedMinutes;
        targetStep.annualHours = Math.round(targetStep.annualMinutes / 60 * 10) / 10;
        
        // 合計時間の更新
        improvedWorkload.totalMinutes -= reducedMinutes;
        
        // カテゴリ別集計の更新（対応するステップタイプがある場合）
        if (targetStep.type && improvedWorkload.categorySummary[targetStep.type] !== undefined) {
          improvedWorkload.categorySummary[targetStep.type] -= Math.round(reducedMinutes / 60 * 10) / 10;
        }
      }
    });
    
    // 合計時間を再計算
    improvedWorkload.totalHours = Math.round(improvedWorkload.totalMinutes / 60 * 10) / 10;
    improvedWorkload.totalDays = Math.round(improvedWorkload.totalHours / 8 * 10) / 10;
    
    // 削減効果の計算
    const savingsHours = currentWorkload.totalHours - improvedWorkload.totalHours;
    const savingsPercent = (savingsHours / currentWorkload.totalHours) * 100;
    
    return {
      before: currentWorkload,
      after: improvedWorkload,
      savings: {
        hours: Math.round(savingsHours * 10) / 10,
        days: Math.round(savingsHours / 8 * 10) / 10,
        percent: Math.round(savingsPercent * 10) / 10
      }
    };
  },
  
  /**
   * 特定ステップの所要時間を年間工数に換算
   * @param {Object} step - 業務ステップ
   * @param {Object} options - 計算オプション
   * @returns {Object} 年間工数
   */
  calculateStepWorkload: (step, options = {}) => {
    // デフォルト値の設定
    const {
      businessDaysPerYear = 250,    // 年間営業日数
      businessWeeksPerYear = 52,    // 年間週数
      businessMonthsPerYear = 12,   // 年間月数
      hoursPerDay = 8               // 1日の労働時間
    } = options;
    
    const { data } = step;
    const { time, timeUnit, frequency, frequencyUnit } = data;
    
    // 値が不正な場合は0を返す
    if (!time || time <= 0 || !frequency || frequency <= 0) {
      return {
        minutesPerOccurrence: 0,
        occurrencesPerYear: 0,
        annualMinutes: 0,
        annualHours: 0,
        annualDays: 0
      };
    }
    
    // 分単位に統一
    let minutesPerOccurrence = time;
    if (timeUnit === '時間') {
      minutesPerOccurrence *= 60;
    } else if (timeUnit === '日') {
      minutesPerOccurrence *= hoursPerDay * 60; // 1日=8時間
    }
    
    // 年間発生回数を計算
    let occurrencesPerYear = 0;
    switch (frequencyUnit) {
      case '日':
        occurrencesPerYear = frequency * businessDaysPerYear;
        break;
      case '週':
        occurrencesPerYear = frequency * businessWeeksPerYear;
        break;
      case '月':
        occurrencesPerYear = frequency * businessMonthsPerYear;
        break;
      case '年':
        occurrencesPerYear = frequency;
        break;
      default:
        occurrencesPerYear = 0;
    }
    
    // 年間総時間を計算
    const annualMinutes = minutesPerOccurrence * occurrencesPerYear;
    const annualHours = annualMinutes / 60;
    const annualDays = annualHours / hoursPerDay;
    
    return {
      minutesPerOccurrence,
      occurrencesPerYear,
      annualMinutes,
      annualHours: Math.round(annualHours * 10) / 10,
      annualDays: Math.round(annualDays * 10) / 10
    };
  },
  
  /**
   * 時間単位を分に変換
   * @param {number} value - 時間値
   * @param {string} unit - 単位（分、時間、日）
   * @param {number} hoursPerDay - 1日あたりの時間数
   * @returns {number} 分単位の値
   */
  convertToMinutes: (value, unit, hoursPerDay = 8) => {
    if (!value || value <= 0) return 0;
    
    switch (unit) {
      case '分':
        return value;
      case '時間':
        return value * 60;
      case '日':
        return value * hoursPerDay * 60;
      default:
        return value;
    }
  },
  
  /**
   * 頻度を年間回数に変換
   * @param {number} value - 頻度値
   * @param {string} unit - 単位（日、週、月、年）
   * @param {Object} options - 変換オプション
   * @returns {number} 年間回数
   */
  convertToAnnualFrequency: (value, unit, options = {}) => {
    const {
      businessDaysPerYear = 250,
      businessWeeksPerYear = 52,
      businessMonthsPerYear = 12
    } = options;
    
    if (!value || value <= 0) return 0;
    
    switch (unit) {
      case '日':
        return value * businessDaysPerYear;
      case '週':
        return value * businessWeeksPerYear;
      case '月':
        return value * businessMonthsPerYear;
      case '年':
        return value;
      default:
        return value;
    }
  },
  
  /**
   * 分を読みやすい形式に変換（例: 90分 → 1時間30分）
   * @param {number} minutes - 分数
   * @returns {string} 読みやすい形式
   */
  formatMinutes: (minutes) => {
    if (minutes < 60) {
      return `${minutes}分`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}時間`;
    }
    
    return `${hours}時間${remainingMinutes}分`;
  },
  
  /**
   * 時間を日数に変換
   * @param {number} hours - 時間数
   * @param {number} hoursPerDay - 1日あたりの時間数
   * @returns {number} 日数
   */
  convertHoursToDays: (hours, hoursPerDay = 8) => {
    return hours / hoursPerDay;
  },
  
  /**
   * 工数をフォーマットして表示
   * @param {number} hours - 時間数
   * @param {Object} options - 表示オプション
   * @returns {string} フォーマットされた工数表示
   */
  formatWorkload: (hours, options = {}) => {
    const {
      hoursPerDay = 8,
      showDays = true,
      decimalPlaces = 1,
      includeUnit = true
    } = options;
    
    const roundedHours = Math.round(hours * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
    
    if (showDays && hours >= hoursPerDay) {
      const days = hours / hoursPerDay;
      const roundedDays = Math.round(days * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
      
      if (includeUnit) {
        return `${roundedDays.toLocaleString()} 人日 (${roundedHours.toLocaleString()} 時間)`;
      } else {
        return `${roundedDays.toLocaleString()} (${roundedHours.toLocaleString()})`;
      }
    }
    
    if (includeUnit) {
      return `${roundedHours.toLocaleString()} 時間`;
    } else {
      return roundedHours.toLocaleString();
    }
  }
};

export default TimeCalculationService;