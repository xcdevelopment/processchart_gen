// src/contexts/ProjectContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// デフォルト値を持つコンテキスト
const defaultContextValue = {
  project: {
    id: 'new',
    name: '新規プロジェクト',
    description: '',
    processSteps: [],
    workloadData: null,
    improvementResults: null,
    filePath: null,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    metadata: {
      author: '',
      company: '',
      department: '',
      tags: [],
      version: '1.0.0'
    }
  },
  isModified: false,
  isSaving: false,
  error: null,
  notification: null,
  isLoading: false,
  
  // 必須メソッド (スタブ実装)
  updateProject: () => {},
  updateProcessSteps: () => {},
  updateWorkloadData: () => {},
  updateImprovementResults: () => {},
  saveCurrentProject: async () => ({ success: false }),
  openProjectFile: async () => ({ success: false }),
  createNewProject: () => ({ success: false }),
  exportProjectAsCsv: async () => ({ success: false }),
  importProcessStepsFromCsv: async () => ({ success: false }),
  getProjectStatus: () => ({}),
  isElectron: false,
  getSetting: async () => null,
  setSetting: async () => ({}),
  showNotification: () => {},
  closeNotification: () => {},
  handleNewProject: () => {},
  handleSaveProject: () => {},
  handleExportCsv: () => {},
  handleImportCsv: () => {},
  handleProjectOpened: () => {}
};

// コンテキスト作成
const ProjectContext = createContext(defaultContextValue);

/**
 * プロジェクトプロバイダーコンポーネント
 */
export const ProjectProvider = ({ children }) => {
  const [project, setProject] = useState(defaultContextValue.project);
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Electron環境かどうかを検出
  const isElectron = typeof window !== 'undefined' && 
                      typeof window.electron !== 'undefined';

  /**
   * 通知を表示する
   */
  const showNotification = useCallback((message, severity = 'info', duration = 6000) => {
    setNotification({
      message,
      severity,
      duration
    });
  }, []);

  /**
   * 通知を閉じる
   */
  const closeNotification = useCallback(() => {
    setNotification(null);
  }, []);

  /**
   * プロジェクト情報を更新する
   */
  const updateProject = useCallback((updates) => {
    setProject(prevProject => ({
      ...prevProject,
      ...updates,
      modified: new Date().toISOString()
    }));
    setIsModified(true);
  }, []);

  /**
   * プロセスステップを更新する
   */
  const updateProcessSteps = useCallback((steps) => {
    setProject(prevProject => ({
      ...prevProject,
      processSteps: steps,
      modified: new Date().toISOString()
    }));
    setIsModified(true);
  }, []);

  /**
   * ワークロードデータを更新する
   */
  const updateWorkloadData = useCallback((workloadData) => {
    setProject(prevProject => ({
      ...prevProject,
      workloadData,
      modified: new Date().toISOString()
    }));
    setIsModified(true);
  }, []);

  /**
   * 改善結果を更新する
   */
  const updateImprovementResults = useCallback((improvementResults) => {
    setProject(prevProject => ({
      ...prevProject,
      improvementResults,
      modified: new Date().toISOString()
    }));
    setIsModified(true);
  }, []);

  /**
   * 現在のプロジェクトを保存する
   */
  const saveCurrentProject = useCallback(async (saveAs = false) => {
    setIsSaving(true);
    setError(null);
    
    try {
      if (!isElectron) {
        // 非Electron環境の場合はローカルストレージを使用
        const key = `project_${project.name.replace(/\s+/g, '_')}`;
        localStorage.setItem(key, JSON.stringify(project));
        
        setIsModified(false);
        setIsSaving(false);
        showNotification('プロジェクトを保存しました', 'success');
        
        return { success: true, filePath: null, localStorageKey: key };
      }
      
      // Electron環境の場合はElectron APIを使用
      const filePath = !saveAs && project.filePath ? project.filePath : null;
      const result = await window.electron.saveProject({ 
        filePath, 
        projectData: project 
      });
      
      if (result.success) {
        setProject(prevProject => ({
          ...prevProject,
          filePath: result.filePath || prevProject.filePath,
          modified: new Date().toISOString()
        }));
        
        setIsModified(false);
        showNotification('プロジェクトを保存しました', 'success');
      } else {
        setError(result.message);
        showNotification(`保存に失敗しました: ${result.message}`, 'error');
      }
      
      return result;
    } catch (error) {
      const errorMessage = `プロジェクト保存エラー: ${error.message}`;
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return { success: false, message: errorMessage };
    } finally {
      setIsSaving(false);
    }
  }, [project, isElectron, showNotification]);

  /**
   * プロジェクトを開く
   */
  const openProjectFile = useCallback(async (filePath = null) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!isElectron) {
        // 非Electron環境の場合はローカルストレージを使用
        if (!filePath) {
          return { success: false, message: '非Electron環境ではファイル選択はサポートされていません' };
        }
        
        const storedProject = localStorage.getItem(filePath);
        if (!storedProject) {
          return { success: false, message: 'プロジェクトが見つかりません' };
        }
        
        const projectData = JSON.parse(storedProject);
        setProject(projectData);
        setIsModified(false);
        
        return { success: true, project: projectData };
      }
      
      // Electron環境の場合はElectron APIを使用
      const result = await window.electron.openProject({ filePath });
      
      if (result.success) {
        const projectData = {
          ...result.projectData,
          filePath: result.filePath
        };
        
        setProject(projectData);
        setIsModified(false);
        showNotification(`プロジェクト "${projectData.name}" を開きました`, 'success');
        
        return { success: true, project: projectData };
      } else {
        setError(result.message);
        if (result.message !== 'キャンセルされました') {
          showNotification(`プロジェクトを開けませんでした: ${result.message}`, 'error');
        }
        return result;
      }
    } catch (error) {
      const errorMessage = `プロジェクト読み込みエラー: ${error.message}`;
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, showNotification]);

  /**
   * 新規プロジェクトを作成する
   */
  const createNewProject = useCallback((projectData = {}) => {
    // 変更があるか確認
    if (isModified) {
      const shouldProceed = window.confirm(
        '保存されていない変更があります。新規プロジェクトを作成すると失われます。続行しますか？'
      );
      
      if (!shouldProceed) {
        return { success: false, message: 'キャンセルされました' };
      }
    }
    
    const newProject = {
      ...defaultContextValue.project,
      ...projectData,
      id: 'new',
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };
    
    setProject(newProject);
    setIsModified(false);
    setError(null);
    
    return { success: true, project: newProject };
  }, [isModified]);

  /**
   * プロジェクトをCSVとしてエクスポートする
   */
  const exportProjectAsCsv = useCallback(async () => {
    if (!project.processSteps || project.processSteps.length === 0) {
      setError('エクスポートするプロセスステップがありません');
      showNotification('エクスポートするプロセスステップがありません', 'warning');
      return { success: false, message: 'エクスポートするプロセスステップがありません' };
    }
    
    try {
      if (!isElectron) {
        // 非Electron環境の場合のCSVエクスポート処理
        const csvContent = convertToCSV(project.processSteps);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${project.name.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return { success: true };
      }
      
      // Electron環境の場合のCSVエクスポート処理
      const csvData = convertToCSV(project.processSteps);
      const defaultFilename = `${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      
      const result = await window.electron.exportCsv({ 
        data: csvData, 
        defaultFilename 
      });
      
      if (result.success) {
        showNotification('CSVファイルをエクスポートしました', 'success');
      } else {
        setError(result.message);
        showNotification(`エクスポートに失敗しました: ${result.message}`, 'error');
      }
      
      return result;
    } catch (error) {
      const errorMessage = `CSVエクスポートエラー: ${error.message}`;
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return { success: false, message: errorMessage };
    }
  }, [project, isElectron, showNotification]);

  /**
   * プロセスステップ配列をCSV形式に変換する
   * @private
   */
  const convertToCSV = (steps) => {
    // ヘッダー行
    const headers = [
      'ステップ名', 'タイプ', '所要時間', '時間単位', '頻度', '頻度単位', '担当者', '使用ツール'
    ];
    
    // データ行
    const rows = steps.map(step => {
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
        step.data.label || '',
        typeText,
        step.data.time || 0,
        step.data.timeUnit || '分',
        step.data.frequency || 1,
        step.data.frequencyUnit || '日',
        step.data.responsible || '',
        step.data.tools || ''
      ].map(value => {
        // カンマを含む場合はダブルクォートで囲む
        const str = String(value);
        return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',');
    });
    
    // CSVデータを生成
    return [headers.join(','), ...rows].join('\n');
  };

  /**
   * CSVからプロセスステップをインポートする
   */
  const importProcessStepsFromCsv = useCallback(async (mappings) => {
    try {
      if (!isElectron) {
        // 非Electron環境でのCSVインポート
        // ファイル選択などのUI処理は呼び出し元で行う必要がある
        return { success: false, message: '非Electron環境ではこの機能はサポートされていません' };
      }
      
      const result = await window.electron.importCsv();
      
      if (result.success && result.data) {
        // TODO: CSVからプロセスステップへの変換処理
        // 本来はParseCsvToSteps関数などを実装する必要がある
        return { success: true, data: result.data };
      } else {
        return result;
      }
    } catch (error) {
      const errorMessage = `CSVインポートエラー: ${error.message}`;
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      return { success: false, message: errorMessage };
    }
  }, [isElectron, showNotification]);

  /**
   * プロジェクトのステータスを取得する
   */
  const getProjectStatus = useCallback(() => {
    const hasProcessSteps = project.processSteps && project.processSteps.length > 0;
    const hasWorkloadData = !!project.workloadData;
    const hasImprovementResults = !!project.improvementResults;
    const isEmpty = !hasProcessSteps && !hasWorkloadData && !hasImprovementResults;
    
    return {
      isEmpty,
      hasProcessSteps,
      hasWorkloadData,
      hasImprovementResults,
      isModified,
      isSaving,
      hasError: !!error,
      error
    };
  }, [project, isModified, isSaving, error]);

  /**
   * 新規プロジェクト作成ハンドラ
   */
  const handleNewProject = useCallback(async () => {
    try {
      const result = await createNewProject();
      
      if (result.success) {
        showNotification('新規プロジェクトを作成しました', 'success');
      }
      
      return result;
    } catch (error) {
      console.error('新規プロジェクト作成エラー:', error);
      showNotification(`新規プロジェクト作成エラー: ${error.message}`, 'error');
      return { success: false, message: error.message };
    }
  }, [createNewProject, showNotification]);

  /**
   * プロジェクト保存ハンドラ
   */
  const handleSaveProject = useCallback(async (saveAs = false) => {
    setIsLoading(true);
    
    try {
      const result = await saveCurrentProject(saveAs);
      return result;
    } catch (error) {
      console.error('プロジェクト保存エラー:', error);
      showNotification(`保存エラー: ${error.message}`, 'error');
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [saveCurrentProject, showNotification]);

  /**
   * CSVエクスポートハンドラ
   */
  const handleExportCsv = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const result = await exportProjectAsCsv();
      return result;
    } catch (error) {
      console.error('CSVエクスポートエラー:', error);
      showNotification(`エクスポートエラー: ${error.message}`, 'error');
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [exportProjectAsCsv, showNotification]);

  /**
   * CSVインポートハンドラ
   */
  const handleImportCsv = useCallback(async () => {
    // イベントをトリガーしてCSVImportExportコンポーネントに処理を委譲
    window.dispatchEvent(new CustomEvent('import-csv-requested'));
  }, []);

  /**
   * プロジェクトを開くハンドラ
   */
  const handleProjectOpened = useCallback(async (data) => {
    setIsLoading(true);
    
    try {
      await openProjectFile(data?.filePath);
    } catch (error) {
      console.error('プロジェクトを開くエラー:', error);
      showNotification(`プロジェクトを開くエラー: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [openProjectFile, showNotification]);

  /**
   * 設定を取得する
   */
  const getSetting = useCallback(async (key, defaultValue = null) => {
    if (!isElectron) {
      // 非Electron環境ではローカルストレージを使用
      try {
        const settingsKey = 'app_settings';
        const settingsStr = localStorage.getItem(settingsKey);
        const settings = settingsStr ? JSON.parse(settingsStr) : {};
        
        if (key) {
          return key in settings ? settings[key] : defaultValue;
        } else {
          return settings;
        }
      } catch (error) {
        console.error('設定の取得に失敗しました:', error);
        return defaultValue;
      }
    }
    
    try {
      return await window.electron.getSetting(key, defaultValue);
    } catch (error) {
      console.error('設定の取得エラー:', error);
      return defaultValue;
    }
  }, [isElectron]);

  /**
   * 設定を保存する
   */
  const setSetting = useCallback(async (key, value) => {
    if (!isElectron) {
      // 非Electron環境ではローカルストレージを使用
      try {
        const settingsKey = 'app_settings';
        const settingsStr = localStorage.getItem(settingsKey);
        const settings = settingsStr ? JSON.parse(settingsStr) : {};
        
        settings[key] = value;
        localStorage.setItem(settingsKey, JSON.stringify(settings));
        
        return { success: true };
      } catch (error) {
        console.error('設定の保存に失敗しました:', error);
        return { success: false, error: error.message };
      }
    }
    
    try {
      return await window.electron.setSetting(key, value);
    } catch (error) {
      console.error('設定の保存エラー:', error);
      return { success: false, error: error.message };
    }
  }, [isElectron]);

  // コンテキスト値
  const contextValue = {
    project,
    isModified,
    isSaving,
    error,
    notification,
    isLoading,
    isElectron,
    
    // メソッド
    updateProject,
    updateProcessSteps,
    updateWorkloadData,
    updateImprovementResults,
    saveCurrentProject,
    openProjectFile,
    createNewProject,
    exportProjectAsCsv,
    importProcessStepsFromCsv,
    getProjectStatus,
    getSetting,
    setSetting,
    showNotification,
    closeNotification,
    handleNewProject,
    handleSaveProject,
    handleExportCsv,
    handleImportCsv,
    handleProjectOpened
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};

/**
 * プロジェクトコンテキストを使用するカスタムフック
 */
export const useProject = () => {
  const context = useContext(ProjectContext);
  
  if (!context) {
    console.error('useProject must be used within a ProjectProvider');
    // エラーをスローする代わりにデフォルト値を返す
    return defaultContextValue;
  }
  
  return context;
};

export default ProjectContext;