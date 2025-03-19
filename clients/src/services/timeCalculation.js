/**
 * 業務ステップの所要時間を年間工数に換算するサービス
 */
export const TimeCalculationService = {
  
    /**
     * 各業務ステップの所要時間を年間工数に換算
     * @param {Array} steps - 業務ステップの配列
     * @returns {Object} 年間工数の合計と内訳
     */
    calculateAnnualWorkload: (steps) => {
      // 年間営業日数の設定
      const BUSINESS_DAYS_PER_YEAR = 250;
      const BUSINESS_WEEKS_PER_YEAR = 52;
      const BUSINESS_MONTHS_PER_YEAR = 12;
      
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
      
      // 各ステップの年間工数を計算
      steps.forEach(step => {
        // ステップデータの取得
        const { id, type, data } = step;
        const { label, time, timeUnit, frequency, frequencyUnit } = data;
        
        // 分単位に統一
        let minutesPerOccurrence = time;
        if (timeUnit === '時間') {
          minutesPerOccurrence *= 60;
        } else if (timeUnit === '日') {
          minutesPerOccurrence *= 8 * 60; // 1日=8時間
        }
        
        // 年間発生回数を計算
        let occurrencesPerYear = 0;
        switch (frequencyUnit) {
          case '日':
            occurrencesPerYear = frequency * BUSINESS_DAYS_PER_YEAR;
            break;
          case '週':
            occurrencesPerYear = frequency * BUSINESS_WEEKS_PER_YEAR;
            break;
          case '月':
            occurrencesPerYear = frequency * BUSINESS_MONTHS_PER_YEAR;
            break;
          case '年':
            occurrencesPerYear = frequency;
            break;
          default:
            occurrencesPerYear = 0;
        }
        
        // 年間総時間を計算（分単位）
        const annualMinutes = minutesPerOccurrence * occurrencesPerYear;
        
        // 結果を更新
        result.totalMinutes += annualMinutes;
        result.categorySummary[type] += annualMinutes;
        
        // ステップ詳細を追加
        result.stepDetails.push({
          id,
          label,
          type,
          minutesPerOccurrence,
          occurrencesPerYear,
          annualMinutes,
          annualHours: Math.round(annualMinutes / 60 * 10) / 10
        });
      });
      
      // 合計時間を時間と日数に換算
      result.totalHours = Math.round(result.totalMinutes / 60 * 10) / 10;
      result.totalDays = Math.round(result.totalHours / 8 * 10) / 10;
      
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
      const improvedWorkload = { ...currentWorkload };
      
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
          
          // カテゴリ別集計の更新
          improvedWorkload.categorySummary[targetStep.type] -= Math.round(reducedMinutes / 60 * 10) / 10;
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
    }
  };
  
  export default TimeCalculationService;