// src/contexts/ProjectContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useProjectData } from '../hooks/useProjectData';
import { useElectron } from '../hooks/useElectron';

// プロジェクトコンテキスト作成
const ProjectContext = createContext(null);

/**
 * プロジェクトプロバイダーコンポーネント
 * @param {Object} props - プロパティ
 * @param {React.ReactNode} props.children - 子要素
 */
export const ProjectProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Electron関連のフック
  const electron = useElectron();
  
  // プロジェクトデータ関連のフック
  const projectData = useProjectData();
  
  // メニューイベントのリスナーを設定
  electron.useMenuListener('menu-new-project', async () => {
    await handleNewProject();
  });
  
  electron.useMenuListener('menu-save-project', async () => {
    await handleSaveProject(false);
  });
  
  electron.useMenuListener('menu-save-project-as', async () => {
    await handleSaveProject(true);
  });
  
  electron.useMenuListener('menu-export-csv', async () => {
    await handleExportCsv();
  });
  
  electron.useMenuListener('menu-import-csv', async () => {
    await handleImportCsv();
  });
  
  electron.useMenuListener('project-opened', async (data) => {
    await handleProjectOpened(data);
  });
  
  /**
   * 通知を表示する
   * @param {string} message - メッセージ
   * @param {string} severity - 重要度（success, info, warning, error）
   * @param {number} duration - 表示時間（ミリ秒）
   */
  const showNotification = (message, severity = 'info', duration = 6000) => {
    setNotification({
      message,
      severity,
      duration
    });
  };
  
  /**
   * 通知を閉じる
   */
  const closeNotification = () => {
    setNotification(null);
  };
  
  /**
   * 新規プロジェクトの作成処理
   */
  const handleNewProject = async () => {
    try {
      const result = await projectData.createNewProject();
      
      if (result.success) {
        showNotification('新規プロジェクトを作成しました', 'success');
      }
    } catch (error) {
      console.error('新規プロジェクト作成エラー:', error);
      showNotification(`新規プロジェクト作成エラー: ${error.message}`, 'error');
    }
  };
  
  /**
   * プロジェクト保存処理
   * @param {boolean} saveAs - 名前を付けて保存するかどうか
   */
  const handleSaveProject = async (saveAs = false) => {
    setIsLoading(true);
    
    try {
      const result = await projectData.saveCurrentProject(saveAs);
      
      if (result.success) {
        showNotification('プロジェクトを保存しました', 'success');
      } else {
        showNotification(`保存に失敗しました: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('プロジェクト保存エラー:', error);
      showNotification(`保存エラー: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * CSV形式でのエクスポート処理
   */
  const handleExportCsv = async () => {
    setIsLoading(true);
    
    try {
      const result = await projectData.exportProjectAsCsv();
      
      if (result.success) {
        showNotification('CSVエクスポートが完了しました', 'success');
      } else {
        showNotification(`エクスポートに失敗しました: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('CSVエクスポートエラー:', error);
      showNotification(`エクスポートエラー: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * CSV形式からのインポート処理
   */
  const handleImportCsv = async () => {
    // 特殊な処理を要するため、イベントをトリガーしてCSVImportExportコンポーネントに処理を委譲
    window.dispatchEvent(new CustomEvent('import-csv-requested'));
  };
  
  /**
   * プロジェクトを開く処理
   * @param {Object} data - オープンするプロジェクト情報
   */
  const handleProjectOpened = async (data) => {
    setIsLoading(true);
    
    try {
      if (!data || !data.filePath) {
        // ファイルパスが指定されていない場合はダイアログを表示
        const result = await projectData.openProjectFile();
        
        if (result.success) {
          showNotification(`プロジェクト "${result.project.name}" を開きました`, 'success');
        } else if (result.message !== 'キャンセルされました') {
          showNotification(`プロジェクトを開けませんでした: ${result.message}`, 'error');
        }
      } else {
        // ファイルパスが指定されている場合は直接開く
        const result = await projectData.openProjectFile(data.filePath);
        
        if (result.success) {
          showNotification(`プロジェクト "${result.project.name}" を開きました`, 'success');
        } else {
          showNotification(`プロジェクトを開けませんでした: ${result.message}`, 'error');
        }
      }
    } catch (error) {
      console.error('プロジェクトを開くエラー:', error);
      showNotification(`プロジェクトを開くエラー: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // プロバイダーの値
  const value = {
    ...projectData,
    ...electron,
    notification,
    showNotification,
    closeNotification,
    isLoading,
    handleNewProject,
    handleSaveProject,
    handleExportCsv,
    handleImportCsv,
    handleProjectOpened
  };
  
  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

/**
 * プロジェクトコンテキストを使用するカスタムフック
 * @returns {Object} - プロジェクトコンテキストの値
 */
export const useProject = () => {
  const context = useContext(ProjectContext);
  
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  
  return context;
};

export default ProjectContext;