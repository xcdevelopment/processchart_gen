// src/config/appConfig.js

/**
 * アプリケーションの設定
 */
const appConfig = {
    /**
     * アプリケーション基本情報
     */
    app: {
      name: '業務プロセス可視化・改善ツール',
      version: '1.0.0',
      description: 'JMA方式の工程分析記号を使用したプロセスチャートを作成し、業務時間の年換算と業務改善策の提示を行うアプリケーション',
      copyright: `© ${new Date().getFullYear()} Your Organization`,
      website: 'https://example.com',
      support: 'support@example.com'
    },
  
    /**
     * JMA方式の工程分析記号の定義
     */
    jmaSymbols: {
      process: {
        name: '加工',
        description: '製品・材料・書類などに手を加えて、価値を付加したり、形を変えたりする作業',
        shape: 'circle',
        valueType: 'value-added', // 付加価値作業
        icon: 'BuildCircleIcon'
      },
      inspection: {
        name: '検査',
        description: '製品・材料・書類などの品質、数量を調べる作業',
        shape: 'square',
        valueType: 'non-value-added', // 非付加価値作業
        icon: 'CheckBoxIcon'
      },
      transport: {
        name: '搬送',
        description: '製品・材料・書類などを場所から場所へ移動する作業',
        shape: 'diamond',
        valueType: 'non-value-added', // 非付加価値作業
        icon: 'CompareArrowsIcon'
      },
      delay: {
        name: '停滞',
        description: '製品・材料・書類などが次の工程に進めず、一時的に滞留している状態',
        shape: 'triangle',
        valueType: 'waste', // ムダ
        icon: 'HourglassEmptyIcon'
      },
      storage: {
        name: '保管',
        description: '製品・材料・書類などが倉庫や保管場所に保管されている状態',
        shape: 'special-rectangle',
        valueType: 'non-value-added', // 非付加価値作業
        icon: 'InventoryIcon'
      }
    },
  
    /**
     * 業務時間計算のデフォルト設定
     */
    calculationDefaults: {
      businessDaysPerYear: 250, // 年間営業日
      businessWeeksPerYear: 52, // 年間週数
      businessMonthsPerYear: 12, // 年間月数
      hoursPerDay: 8, // 1日の労働時間
      hourlyRate: 3000 // 時間単価（円）
    },
  
    /**
     * 改善分析のデフォルト設定
     */
    improvementDefaults: {
      timeThreshold: 30, // 所要時間のしきい値（分）
      waitThreshold: 60, // 待ち時間のしきい値（分）
      frequencyThreshold: 50, // 頻度のしきい値（年間回数）
      implementationPeriods: [
        { value: 'immediate', label: '即時対応可能', days: 14 },
        { value: '1-3months', label: '1〜3ヶ月', days: 90 },
        { value: '3-6months', label: '3〜6ヶ月', days: 180 },
        { value: '6-12months', label: '6〜12ヶ月', days: 365 },
        { value: 'over-12months', label: '12ヶ月以上', days: 548 }
      ]
    },
  
    /**
     * ファイル関連の設定
     */
    fileDefaults: {
      extensions: {
        project: 'jproj',
        csv: 'csv',
        excel: 'xlsx',
        svg: 'svg',
        png: 'png'
      },
      csvDelimiter: ',',
      includeBom: true,
      defaultImageFormat: 'png',
      defaultImageDpi: 300
    },
  
    /**
     * ローカルストレージのキー
     */
    storageKeys: {
      appSettings: 'app_settings',
      recentProjects: 'recent_projects',
      improvements: 'improvements',
      projectPrefix: 'project_'
    },
  
    /**
     * UI関連の設定
     */
    ui: {
      sidebar: {
        width: 240
      },
      processChart: {
        nodeWidth: 150,
        nodeHeight: 100,
        edgeType: 'smoothstep',
        snapGrid: [20, 20],
        defaultViewport: { x: 0, y: 0, zoom: 1 }
      },
      animation: {
        duration: 300,
        easing: 'ease-in-out'
      }
    },
  
    /**
     * デフォルトプロジェクトテンプレート
     */
    defaultProjectTemplate: {
      name: '新規プロジェクト',
      description: '',
      processSteps: [],
      metadata: {
        author: '',
        company: '',
        department: '',
        tags: [],
        version: '1.0.0'
      }
    },
  
    /**
     * Electron関連の設定
     */
    electron: {
      app: {
        name: 'process-analyzer',
        productName: '業務プロセス可視化・改善ツール',
        appId: 'com.yourorganization.process-analyzer'
      },
      windowDefaults: {
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600
      }
    }
  };
  
  export default appConfig;