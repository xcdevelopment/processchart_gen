// src/models/ImprovementModel.js
import { v4 as uuidv4 } from 'uuid';

/**
 * 改善施策を管理するモデルクラス
 */
class ImprovementModel {
  /**
   * 新しい改善施策を作成する
   * @param {Object} data - 初期データ
   * @returns {Object} - 新しい改善施策オブジェクト
   */
  static create(data = {}) {
    const now = new Date().toISOString();
    
    return {
      id: data.id || uuidv4(),
      title: data.title || '',
      description: data.description || '',
      targetStepType: data.targetStepType || '',
      targetStepId: data.targetStepId || null,
      targetStepLabel: data.targetStepLabel || '',
      keywords: data.keywords || [],
      timeReductionPercent: data.timeReductionPercent !== undefined ? data.timeReductionPercent : 30,
      implementationDifficulty: data.implementationDifficulty || 'medium',
      estimatedCost: data.estimatedCost || 'medium',
      implementationPeriod: data.implementationPeriod || '1-3months',
      responsible: data.responsible || '',
      requiredResources: data.requiredResources || [],
      implementationSteps: data.implementationSteps || [],
      risks: data.risks || [],
      attachments: data.attachments || [],
      status: data.status || 'proposed',
      isTemplate: data.isTemplate || false,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now
    };
  }

  /**
   * 改善施策を検証する
   * @param {Object} improvement - 検証する改善施策
   * @returns {Object} - 検証結果
   */
  static validate(improvement) {
    const errors = {};
    
    // 必須フィールドのチェック
    if (!improvement.title || improvement.title.trim() === '') {
      errors.title = 'タイトルは必須です';
    }
    
    if (!improvement.description || improvement.description.trim() === '') {
      errors.description = '説明は必須です';
    }
    
    // 時間削減率のチェック
    if (improvement.timeReductionPercent === undefined || improvement.timeReductionPercent === null) {
      errors.timeReductionPercent = '時間削減率は必須です';
    } else if (isNaN(improvement.timeReductionPercent)) {
      errors.timeReductionPercent = '時間削減率は数値で入力してください';
    } else if (improvement.timeReductionPercent < 0 || improvement.timeReductionPercent > 100) {
      errors.timeReductionPercent = '時間削減率は0〜100%の範囲で入力してください';
    }
    
    // 難易度のチェック
    const validDifficulties = ['low', 'medium', 'high'];
    if (!validDifficulties.includes(improvement.implementationDifficulty)) {
      errors.implementationDifficulty = '実装難易度の値が無効です';
    }
    
    // コストのチェック
    const validCosts = ['low', 'medium', 'high'];
    if (!validCosts.includes(improvement.estimatedCost)) {
      errors.estimatedCost = '予想コストの値が無効です';
    }
    
    // ステータスのチェック
    const validStatuses = ['proposed', 'approved', 'in-progress', 'completed', 'rejected'];
    if (improvement.status && !validStatuses.includes(improvement.status)) {
      errors.status = 'ステータスの値が無効です';
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * 改善施策を更新する
   * @param {Object} improvement - 更新する改善施策
   * @param {Object} updates - 更新内容
   * @returns {Object} - 更新された改善施策
   */
  static update(improvement, updates) {
    const now = new Date().toISOString();
    
    // キーワードを配列に変換
    let keywords = updates.keywords;
    if (typeof keywords === 'string') {
      keywords = keywords.split(',').map(k => k.trim()).filter(k => k);
    } else if (!Array.isArray(keywords)) {
      keywords = improvement.keywords;
    }
    
    return {
      ...improvement,
      ...updates,
      keywords,
      updatedAt: now
    };
  }

  /**
   * 改善効果を計算する
   * @param {Object} improvement - 改善施策
   * @param {Object} step - 対象プロセスステップ
   * @returns {Object} - 計算結果
   */
  static calculateEffect(improvement, step) {
    // 時間の削減効果
    const minutesReduction = step.data.time * (improvement.timeReductionPercent / 100);
    
    // 年間の削減時間
    let annualFrequency = 0;
    switch (step.data.frequencyUnit) {
      case '日': annualFrequency = step.data.frequency * 250; break; // 年間営業日数
      case '週': annualFrequency = step.data.frequency * 52; break;
      case '月': annualFrequency = step.data.frequency * 12; break;
      case '年': annualFrequency = step.data.frequency; break;
      default: annualFrequency = 0;
    }
    
    const annualMinutesSaved = minutesReduction * annualFrequency;
    const annualHoursSaved = annualMinutesSaved / 60;
    const annualDaysSaved = annualHoursSaved / 8; // 1日=8時間として計算
    
    return {
      minutesPerOccurrence: minutesReduction,
      annualMinutes: annualMinutesSaved,
      annualHours: annualHoursSaved,
      annualDays: annualDaysSaved
    };
  }

  /**
   * 改善施策のROI（投資収益率）を計算する
   * @param {Object} improvement - 改善施策
   * @param {Object} effect - 計算済みの効果
   * @param {Object} costParams - コストパラメータ
   * @returns {Object} - ROI計算結果
   */
  static calculateROI(improvement, effect, costParams = {}) {
    const {
      hourlyRate = 3000, // 時間あたりコスト（円）
      implementationCost = 0, // 実装コスト（円）
      maintenanceCostPerYear = 0 // 年間メンテナンスコスト（円）
    } = costParams;
    
    // 推定実装コスト（難易度に基づく）
    let estimatedImplementationCost = implementationCost;
    if (implementationCost === 0) {
      switch (improvement.implementationDifficulty) {
        case 'low': estimatedImplementationCost = hourlyRate * 10; break; // 10時間分
        case 'medium': estimatedImplementationCost = hourlyRate * 40; break; // 40時間分
        case 'high': estimatedImplementationCost = hourlyRate * 120; break; // 120時間分
        default: estimatedImplementationCost = hourlyRate * 40;
      }
    }
    
    // 推定メンテナンスコスト
    let estimatedMaintenanceCost = maintenanceCostPerYear;
    if (maintenanceCostPerYear === 0) {
      estimatedMaintenanceCost = estimatedImplementationCost * 0.2; // 実装コストの20%
    }
    
    // 年間削減効果（金額）
    const annualSavings = effect.annualHours * hourlyRate;
    
    // 5年間のROI計算
    const totalSavings = annualSavings * 5;
    const totalCost = estimatedImplementationCost + (estimatedMaintenanceCost * 5);
    const netBenefit = totalSavings - totalCost;
    const roi = (netBenefit / totalCost) * 100;
    
    // 投資回収期間（月数）
    const paybackPeriod = (estimatedImplementationCost / (annualSavings / 12));
    
    return {
      hourlyRate,
      estimatedImplementationCost,
      estimatedMaintenanceCost,
      annualSavings,
      fiveYearSavings: totalSavings,
      fiveYearCost: totalCost,
      netBenefit,
      roi, // パーセント
      paybackPeriod // 月数
    };
  }

  /**
   * 難易度の表示テキストとスタイルを取得する
   * @param {string} difficulty - 難易度（low, medium, high）
   * @returns {Object} - テキストとスタイル情報
   */
  static getDifficultyInfo(difficulty) {
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
  }

  /**
   * コストの表示テキストとスタイルを取得する
   * @param {string} cost - コスト（low, medium, high）
   * @returns {Object} - テキストとスタイル情報
   */
  static getCostInfo(cost) {
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

  /**
   * ステータスの表示テキストとスタイルを取得する
   * @param {string} status - ステータス
   * @returns {Object} - テキストとスタイル情報
   */
  static getStatusInfo(status) {
    switch (status) {
      case 'proposed':
        return {
          text: '提案中',
          color: 'info',
          icon: 'LightbulbOutlined'
        };
      
      case 'approved':
        return {
          text: '承認済',
          color: 'success',
          icon: 'CheckCircleOutlined'
        };
      
      case 'in-progress':
        return {
          text: '実施中',
          color: 'warning',
          icon: 'HourglassEmptyOutlined'
        };
      
      case 'completed':
        return {
          text: '完了',
          color: 'success',
          icon: 'TaskAltOutlined'
        };
      
      case 'rejected':
        return {
          text: '却下',
          color: 'error',
          icon: 'CancelOutlined'
        };
      
      default:
        return {
          text: '提案中',
          color: 'info',
          icon: 'LightbulbOutlined'
        };
    }
  }

  /**
   * ステップタイプに適した改善施策テンプレートを生成する
   * @param {string} stepType - ステップタイプ
   * @param {string} stepLabel - ステップラベル
   * @returns {Array} - 改善施策テンプレートの配列
   */
  static getTemplatesForStepType(stepType, stepLabel = '') {
    const templates = [];
    
    // 共通テンプレート
    templates.push(this.create({
      title: '作業の自動化',
      description: `「${stepLabel || 'このステップ'}」を自動化することで、作業時間を削減し、ヒューマンエラーを防止できます。`,
      targetStepType: stepType,
      keywords: ['自動化', 'RPA', 'システム化'],
      timeReductionPercent: 70,
      implementationDifficulty: 'high',
      estimatedCost: 'medium',
      isTemplate: true
    }));
    
    // タイプ別テンプレート
    switch (stepType) {
      case 'process':
        templates.push(this.create({
          title: '作業の標準化',
          description: `「${stepLabel || '加工作業'}」のマニュアル作成と標準化により、作業時間のばらつきやスキル依存を低減できます。`,
          targetStepType: stepType,
          keywords: ['標準化', 'マニュアル', 'SOP'],
          timeReductionPercent: 30,
          implementationDifficulty: 'low',
          estimatedCost: 'low',
          isTemplate: true
        }));
        
        templates.push(this.create({
          title: 'スキルアップ研修の実施',
          description: `「${stepLabel || '加工作業'}」を担当するスタッフのスキルアップ研修を行い、効率と品質を向上させます。`,
          targetStepType: stepType,
          keywords: ['研修', 'スキルアップ', '人材育成'],
          timeReductionPercent: 20,
          implementationDifficulty: 'medium',
          estimatedCost: 'medium',
          isTemplate: true
        }));
        break;
      
      case 'inspection':
        templates.push(this.create({
          title: '検査基準の明確化',
          description: `「${stepLabel || '検査工程'}」の検査基準を明確化し、チェックリストを導入することで検査時間を短縮できます。`,
          targetStepType: stepType,
          keywords: ['検査', 'チェックリスト', '基準'],
          timeReductionPercent: 40,
          implementationDifficulty: 'low',
          estimatedCost: 'low',
          isTemplate: true
        }));
        
        templates.push(this.create({
          title: '自動検査システムの導入',
          description: `「${stepLabel || '検査工程'}」を自動化する検査システムやセンサーを導入し、品質と効率を向上させます。`,
          targetStepType: stepType,
          keywords: ['自動検査', 'センサー', '品質管理'],
          timeReductionPercent: 80,
          implementationDifficulty: 'high',
          estimatedCost: 'high',
          isTemplate: true
        }));
        break;
      
      case 'transport':
        templates.push(this.create({
          title: '搬送回数の削減',
          description: `「${stepLabel || '搬送工程'}」の頻度を減らすか、バッチ処理にすることで効率化できます。`,
          targetStepType: stepType,
          keywords: ['搬送', '転送', 'バッチ処理'],
          timeReductionPercent: 50,
          implementationDifficulty: 'medium',
          estimatedCost: 'low',
          isTemplate: true
        }));
        
        templates.push(this.create({
          title: 'レイアウト変更による搬送距離短縮',
          description: `作業場のレイアウトを見直し、「${stepLabel || '搬送工程'}」の距離や時間を短縮します。`,
          targetStepType: stepType,
          keywords: ['レイアウト', '動線', '5S'],
          timeReductionPercent: 40,
          implementationDifficulty: 'medium',
          estimatedCost: 'medium',
          isTemplate: true
        }));
        break;
      
      case 'delay':
        templates.push(this.create({
          title: '承認プロセスの効率化',
          description: `「${stepLabel || '待ち時間'}」を削減するため、承認プロセスの並行化や決裁権限の委譲を行います。`,
          targetStepType: stepType,
          keywords: ['承認', '待ち時間', '権限委譲'],
          timeReductionPercent: 60,
          implementationDifficulty: 'medium',
          estimatedCost: 'low',
          isTemplate: true
        }));
        
        templates.push(this.create({
          title: 'リアルタイム通知システムの導入',
          description: `「${stepLabel || '待ち工程'}」で停滞している案件に関するリアルタイム通知システムを導入し、待ち時間を短縮します。`,
          targetStepType: stepType,
          keywords: ['通知', 'アラート', 'リアルタイム'],
          timeReductionPercent: 70,
          implementationDifficulty: 'medium',
          estimatedCost: 'medium',
          isTemplate: true
        }));
        break;
      
      case 'storage':
        templates.push(this.create({
          title: '保管方法のデジタル化',
          description: `「${stepLabel || '保管工程'}」をデジタル化し、検索性を向上させることで後続の作業時間も短縮できます。`,
          targetStepType: stepType,
          keywords: ['デジタル化', '電子化', 'ペーパーレス'],
          timeReductionPercent: 50,
          implementationDifficulty: 'medium',
          estimatedCost: 'medium',
          isTemplate: true
        }));
        
        templates.push(this.create({
          title: '在庫最適化による保管コスト削減',
          description: `「${stepLabel || '保管工程'}」の在庫量を適正化し、保管コストと管理工数を削減します。`,
          targetStepType: stepType,
          keywords: ['在庫最適化', 'JIT', '在庫削減'],
          timeReductionPercent: 30,
          implementationDifficulty: 'medium',
          estimatedCost: 'low',
          isTemplate: true
        }));
        break;
    }
    
    return templates;
  }
}

export default ImprovementModel;