// src/services/improvementService.js

/**
 * 業務改善策を提案・管理するサービス
 */
export const ImprovementService = {
    /**
     * プロセスステップを分析し、改善点を特定する
     * @param {Array} steps - プロセスステップの配列
     * @param {Object} settings - 分析設定（しきい値など）
     * @returns {Array} 改善対象ステップのリスト
     */
    analyzeProcessForImprovements: (steps, settings = {}) => {
      const {
        timeThreshold = 30, // 所要時間のしきい値（分）
        waitThreshold = 60, // 待ち時間のしきい値（分）
        frequencyThreshold = 50, // 頻度のしきい値（年間）
      } = settings;
  
      // 改善対象ステップを特定
      const improvementTargets = steps.filter(step => {
        const { type, data } = step;
        const { time, frequency, frequencyUnit } = data;
        
        // 年間頻度を計算
        let annualFrequency = 0;
        switch (frequencyUnit) {
          case '日': annualFrequency = frequency * 250; break;
          case '週': annualFrequency = frequency * 52; break;
          case '月': annualFrequency = frequency * 12; break;
          case '年': annualFrequency = frequency; break;
          default: annualFrequency = 0;
        }
        
        // 判定条件
        let isTarget = false;
        
        // 停滞（待ち時間）が長いステップ
        if (type === 'delay' && time >= waitThreshold) {
          isTarget = true;
        }
        // 頻度が高く時間がかかるプロセス
        else if ((type === 'process' || type === 'inspection') && 
                 time >= timeThreshold && 
                 annualFrequency >= frequencyThreshold) {
          isTarget = true;
        }
        // 搬送・移動が多い
        else if (type === 'transport' && annualFrequency >= frequencyThreshold * 2) {
          isTarget = true;
        }
        
        return isTarget;
      });
      
      return improvementTargets;
    },
    
    /**
     * 対象ステップに対する改善施策を提案する
     * @param {Object} step - 改善対象ステップ
     * @param {Array} improvementDatabase - 過去の改善施策データベース
     * @returns {Array} 提案される改善施策のリスト
     */
    suggestImprovements: (step, improvementDatabase = []) => {
      const { type, data } = step;
      const suggestions = [];
      
      // 既存の改善施策データベースから類似ステップの施策を検索
      const similarImprovements = improvementDatabase.filter(improvement => 
        improvement.targetStepType === type ||
        improvement.keywords.some(keyword => 
          data.label.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      // 既存施策があれば追加
      if (similarImprovements.length > 0) {
        suggestions.push(...similarImprovements);
      }
      
      // デフォルトの改善施策を追加
      const defaultSuggestions = generateDefaultSuggestions(step);
      suggestions.push(...defaultSuggestions);
      
      return suggestions;
    },
    
    /**
     * 改善施策をデータベースに登録する
     * @param {Object} improvement - 改善施策
     * @param {Array} database - 施策データベース
     * @returns {Array} 更新された施策データベース
     */
    saveImprovement: (improvement, database = []) => {
      // 既存の施策の場合は更新
      const existingIndex = database.findIndex(item => item.id === improvement.id);
      
      if (existingIndex >= 0) {
        database[existingIndex] = {
          ...database[existingIndex],
          ...improvement,
          updatedAt: new Date().toISOString()
        };
      } else {
        // 新規施策の場合は追加
        database.push({
          ...improvement,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      return database;
    },
    
    /**
     * 改善施策の効果を計算する
     * @param {Object} step - 対象ステップ
     * @param {Object} improvement - 改善施策
     * @returns {Object} 効果予測
     */
    predictImprovementEffect: (step, improvement) => {
      const { data } = step;
      const { timeReductionPercent = 0 } = improvement;
      
      // 時間の削減効果
      const minutesReduction = data.time * (timeReductionPercent / 100);
      
      // 年間の削減時間
      let annualFrequency = 0;
      switch (data.frequencyUnit) {
        case '日': annualFrequency = data.frequency * 250; break;
        case '週': annualFrequency = data.frequency * 52; break;
        case '月': annualFrequency = data.frequency * 12; break;
        case '年': annualFrequency = data.frequency; break;
        default: annualFrequency = 0;
      }
      
      const annualMinutesSaved = minutesReduction * annualFrequency;
      const annualHoursSaved = annualMinutesSaved / 60;
      
      return {
        minutesPerOccurrence: minutesReduction,
        annualMinutes: annualMinutesSaved,
        annualHours: annualHoursSaved,
        annualDays: annualHoursSaved / 8
      };
    }
  };
  
  /**
   * ステップの種類に基づいてデフォルトの改善施策を生成
   * @param {Object} step - プロセスステップ
   * @returns {Array} デフォルト改善施策のリスト
   */
  function generateDefaultSuggestions(step) {
    const { type, data } = step;
    const suggestions = [];
    
    // 共通の改善施策
    suggestions.push({
      id: `default-automation-${generateId()}`,
      title: '作業の自動化',
      description: `「${data.label}」ステップの自動化により、作業時間を削減できる可能性があります。`,
      targetStepType: type,
      keywords: ['自動化'],
      timeReductionPercent: 70,
      implementationDifficulty: 'medium',
      estimatedCost: 'medium'
    });
    
    // タイプ別の改善施策
    switch (type) {
      case 'process':
        suggestions.push({
          id: `default-standardize-${generateId()}`,
          title: '作業の標準化',
          description: `「${data.label}」ステップのマニュアル作成と標準化により、作業時間のばらつきを低減できます。`,
          targetStepType: type,
          keywords: ['標準化', 'マニュアル'],
          timeReductionPercent: 30,
          implementationDifficulty: 'low',
          estimatedCost: 'low'
        });
        break;
        
      case 'inspection':
        suggestions.push({
          id: `default-inspection-${generateId()}`,
          title: '検査工程の効率化',
          description: `「${data.label}」の検査基準を明確化し、チェックリストを導入することで検査時間を短縮できます。`,
          targetStepType: type,
          keywords: ['検査', 'チェック'],
          timeReductionPercent: 40,
          implementationDifficulty: 'low',
          estimatedCost: 'low'
        });
        break;
        
      case 'transport':
        suggestions.push({
          id: `default-transport-${generateId()}`,
          title: '移動・転送の効率化',
          description: `「${data.label}」の転送回数を減らすかバッチ処理にすることで効率化できます。`,
          targetStepType: type,
          keywords: ['転送', '移動'],
          timeReductionPercent: 50,
          implementationDifficulty: 'medium',
          estimatedCost: 'low'
        });
        break;
        
      case 'delay':
        suggestions.push({
          id: `default-delay-${generateId()}`,
          title: '待ち時間の短縮',
          description: `「${data.label}」での待ち時間を短縮するため、承認プロセスの並行化や決裁権限の委譲を検討します。`,
          targetStepType: type,
          keywords: ['待ち', '承認'],
          timeReductionPercent: 60,
          implementationDifficulty: 'medium',
          estimatedCost: 'low'
        });
        break;
        
      case 'storage':
        suggestions.push({
          id: `default-storage-${generateId()}`,
          title: '保管方法の最適化',
          description: `「${data.label}」の保管方式をデジタル化し、検索性を向上させることで後続の作業時間も短縮できます。`,
          targetStepType: type,
          keywords: ['保管', '保存'],
          timeReductionPercent: 50,
          implementationDifficulty: 'medium',
          estimatedCost: 'medium'
        });
        break;
    }
    
    return suggestions;
  }
  
  /**
   * ユニークIDを生成する簡易関数
   * @returns {String} ユニークID
   */
  function generateId() {
    return Math.random().toString(36).substring(2, 15);
  }
  
  export default ImprovementService;