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
        case '日': annualFrequency = frequency * 250; break; // 営業日換算
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
      // 長時間の保管
      else if (type === 'storage' && time >= timeThreshold * 5) {
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
      (improvement.keywords && improvement.keywords.some(keyword => 
        data.label.toLowerCase().includes(keyword.toLowerCase())
      ))
    );
    
    // データベースから類似施策があれば追加
    if (similarImprovements.length > 0) {
      similarImprovements.forEach(improvement => {
        // 複製して対象ステップ情報を追加
        suggestions.push({
          ...improvement,
          targetStepId: step.id,
          targetStepLabel: data.label,
          targetStepType: type
        });
      });
    }
    
    // デフォルトの改善施策を追加
    const defaultSuggestions = this.generateDefaultSuggestions(step);
    defaultSuggestions.forEach(suggestion => {
      suggestions.push({
        ...suggestion,
        targetStepId: step.id,
        targetStepLabel: data.label,
        targetStepType: type
      });
    });
    
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
    const updatedDatabase = [...database];
    
    if (existingIndex >= 0) {
      updatedDatabase[existingIndex] = {
        ...updatedDatabase[existingIndex],
        ...improvement,
        updatedAt: new Date().toISOString()
      };
    } else {
      // 新規施策の場合は追加
      updatedDatabase.push({
        ...improvement,
        id: improvement.id || this.generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return updatedDatabase;
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
      case '日': annualFrequency = data.frequency * 250; break; // 営業日数
      case '週': annualFrequency = data.frequency * 52; break;
      case '月': annualFrequency = data.frequency * 12; break;
      case '年': annualFrequency = data.frequency; break;
      default: annualFrequency = 0;
    }
    
    const annualMinutesSaved = minutesReduction * annualFrequency;
    const annualHoursSaved = annualMinutesSaved / 60;
    const annualDaysSaved = annualHoursSaved / 8; // 1日8時間想定
    
    return {
      minutesPerOccurrence: minutesReduction,
      annualMinutes: annualMinutesSaved,
      annualHours: annualHoursSaved,
      annualDays: annualDaysSaved,
      percentReduction: timeReductionPercent
    };
  },
  
  /**
   * 複数の改善施策を適用した効果を計算する
   * @param {Object} currentWorkload - 現在の業務負荷
   * @param {Array} improvements - 適用する改善施策の配列
   * @returns {Object} 改善効果
   */
  calculateImprovementEffect: (currentWorkload, improvements) => {
    if (!currentWorkload || !improvements || improvements.length === 0) {
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
    
    // 深いコピーを作成（改変防止）
    const improvedWorkload = JSON.parse(JSON.stringify(currentWorkload));
    
    // 各改善施策を適用
    improvements.forEach(improvement => {
      const { targetStep, timeReductionPercent } = improvement;
      
      // 対象ステップを検索
      const targetStepIndex = improvedWorkload.stepDetails.findIndex(
        step => step.id === improvement.targetStepId
      );
      
      if (targetStepIndex >= 0) {
        const targetStepDetail = improvedWorkload.stepDetails[targetStepIndex];
        const originalMinutes = targetStepDetail.annualMinutes;
        
        // 削減時間を計算
        const reductionRate = timeReductionPercent / 100;
        const reducedMinutes = originalMinutes * reductionRate;
        
        // 値を更新
        targetStepDetail.annualMinutes -= reducedMinutes;
        targetStepDetail.annualHours = Math.round(targetStepDetail.annualMinutes / 60 * 10) / 10;
        
        // 合計時間の更新
        improvedWorkload.totalMinutes -= reducedMinutes;
        
        // カテゴリ別集計の更新
        improvedWorkload.categorySummary[targetStepDetail.type] -= Math.round(reducedMinutes / 60 * 10) / 10;
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
   * ステップの種類に基づいてデフォルトの改善施策を生成
   * @param {Object} step - プロセスステップ
   * @returns {Array} デフォルト改善施策のリスト
   */
  generateDefaultSuggestions: (step) => {
    const { type, data } = step;
    const suggestions = [];
    
    // 共通の改善施策
    suggestions.push({
      id: `default-automation-${ImprovementService.generateId()}`,
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
          id: `default-standardize-${ImprovementService.generateId()}`,
          title: '作業の標準化',
          description: `「${data.label}」ステップのマニュアル作成と標準化により、作業時間のばらつきを低減できます。`,
          targetStepType: type,
          keywords: ['標準化', 'マニュアル'],
          timeReductionPercent: 30,
          implementationDifficulty: 'low',
          estimatedCost: 'low'
        });
        
        suggestions.push({
          id: `default-training-${ImprovementService.generateId()}`,
          title: 'スキルアップ研修の実施',
          description: `「${data.label}」を担当するスタッフのスキルアップ研修を行い、効率と品質を向上させます。`,
          targetStepType: type,
          keywords: ['研修', 'スキルアップ'],
          timeReductionPercent: 20,
          implementationDifficulty: 'medium',
          estimatedCost: 'medium'
        });
        break;
        
      case 'inspection':
        suggestions.push({
          id: `default-criteria-${ImprovementService.generateId()}`,
          title: '検査基準の明確化',
          description: `「${data.label}」の検査基準を明確化し、チェックリストを導入することで検査時間を短縮できます。`,
          targetStepType: type,
          keywords: ['検査', 'チェックリスト', '基準'],
          timeReductionPercent: 40,
          implementationDifficulty: 'low',
          estimatedCost: 'low'
        });
        
        suggestions.push({
          id: `default-auto-inspection-${ImprovementService.generateId()}`,
          title: '自動検査システムの導入',
          description: `「${data.label}」を自動化する検査システムやセンサーを導入し、品質と効率を向上させます。`,
          targetStepType: type,
          keywords: ['自動検査', 'センサー', '品質管理'],
          timeReductionPercent: 80,
          implementationDifficulty: 'high',
          estimatedCost: 'high'
        });
        break;
        
      case 'transport':
        suggestions.push({
          id: `default-reduce-transport-${ImprovementService.generateId()}`,
          title: '搬送回数の削減',
          description: `「${data.label}」の頻度を減らすか、バッチ処理にすることで効率化できます。`,
          targetStepType: type,
          keywords: ['搬送', '転送', 'バッチ処理'],
          timeReductionPercent: 50,
          implementationDifficulty: 'medium',
          estimatedCost: 'low'
        });
        
        suggestions.push({
          id: `default-layout-${ImprovementService.generateId()}`,
          title: 'レイアウト変更による搬送距離短縮',
          description: `作業場のレイアウトを見直し、「${data.label}」の距離や時間を短縮します。`,
          targetStepType: type,
          keywords: ['レイアウト', '動線', '5S'],
          timeReductionPercent: 40,
          implementationDifficulty: 'medium',
          estimatedCost: 'medium'
        });
        break;
        
      case 'delay':
        suggestions.push({
          id: `default-approval-${ImprovementService.generateId()}`,
          title: '承認プロセスの効率化',
          description: `「${data.label}」を削減するため、承認プロセスの並行化や決裁権限の委譲を行います。`,
          targetStepType: type,
          keywords: ['承認', '待ち時間', '権限委譲'],
          timeReductionPercent: 60,
          implementationDifficulty: 'medium',
          estimatedCost: 'low'
        });
        
        suggestions.push({
          id: `default-notification-${ImprovementService.generateId()}`,
          title: 'リアルタイム通知システムの導入',
          description: `「${data.label}」で停滞している案件に関するリアルタイム通知システムを導入し、待ち時間を短縮します。`,
          targetStepType: type,
          keywords: ['通知', 'アラート', 'リアルタイム'],
          timeReductionPercent: 70,
          implementationDifficulty: 'medium',
          estimatedCost: 'medium'
        });
        break;
        
      case 'storage':
        suggestions.push({
          id: `default-digital-${ImprovementService.generateId()}`,
          title: '保管方法のデジタル化',
          description: `「${data.label}」をデジタル化し、検索性を向上させることで後続の作業時間も短縮できます。`,
          targetStepType: type,
          keywords: ['デジタル化', '電子化', 'ペーパーレス'],
          timeReductionPercent: 50,
          implementationDifficulty: 'medium',
          estimatedCost: 'medium'
        });
        
        suggestions.push({
          id: `default-inventory-${ImprovementService.generateId()}`,
          title: '在庫最適化による保管コスト削減',
          description: `「${data.label}」の在庫量を適正化し、保管コストと管理工数を削減します。`,
          targetStepType: type,
          keywords: ['在庫最適化', 'JIT', '在庫削減'],
          timeReductionPercent: 30,
          implementationDifficulty: 'medium',
          estimatedCost: 'low'
        });
        break;
    }
    
    return suggestions;
  },
  
  /**
   * ユニークIDを生成する
   * @returns {string} ユニークID
   */
  generateId: () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  },
  
  /**
   * 難易度の表示テキストとスタイルを取得する
   * @param {string} difficulty - 難易度（low, medium, high）
   * @returns {Object} - テキストとスタイル情報
   */
  getDifficultyInfo: (difficulty) => {
    switch (difficulty) {
      case 'low':
        return {
          text: '低',
          color: 'success',
          label: '低（1週間程度）',
          description: '既存のシステムや業務フローを大きく変更せず、短期間で実施可能'
        };
      
      case 'medium':
        return {
          text: '中',
          color: 'warning',
          label: '中（1〜2ヶ月程度）',
          description: '一部のシステム変更や業務フロー見直しが必要で、関係者との調整が必要'
        };
      
      case 'high':
        return {
          text: '高',
          color: 'error',
          label: '高（3ヶ月以上）',
          description: '大規模なシステム変更や業務フローの抜本的な見直しが必要で、外部リソースが必要になる可能性あり'
        };
      
      default:
        return {
          text: '中',
          color: 'warning',
          label: '中（1〜2ヶ月程度）',
          description: '一部のシステム変更や業務フロー見直しが必要で、関係者との調整が必要'
        };
    }
  },
  
  /**
   * コストの表示テキストとスタイルを取得する
   * @param {string} cost - コスト（low, medium, high）
   * @returns {Object} - テキストとスタイル情報
   */
  getCostInfo: (cost) => {
    switch (cost) {
      case 'low':
        return {
          text: '低',
          color: 'success',
          label: '低（〜50万円程度）',
          description: '特別な投資を必要とせず、既存リソースで対応可能'
        };
      
      case 'medium':
        return {
          text: '中',
          color: 'warning',
          label: '中（50〜300万円程度）',
          description: '一定の投資が必要で、システム改修や追加ツールの導入などが含まれる'
        };
      
      case 'high':
        return {
          text: '高',
          color: 'error',
          label: '高（300万円以上）',
          description: '大規模な投資が必要で、新規システム導入や大幅な業務変更などを伴う'
        };
      
      default:
        return {
          text: '中',
          color: 'warning',
          label: '中（50〜300万円程度）',
          description: '一定の投資が必要で、システム改修や追加ツールの導入などが含まれる'
        };
    }
  }
};

export default ImprovementService;