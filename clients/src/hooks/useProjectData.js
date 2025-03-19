// src/hooks/useProjectData.js
import { useState, useEffect, useCallback } from 'react';
import { useElectron } from './useElectron';
import ProjectModel from '../models/ProjectModel';

/**
 * プロジェクトデータの管理を行うカスタムフック
 * @param {Object} initialProject - 初期プロジェクトデータ
 * @returns {Object} - プロジェクト関連の状態と操作メソッド
 */
export function useProjectData(initialProject = null) {
  const [project, setProject] = useState(initialProject || ProjectModel.create());
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const { saveProject, openProject, exportCsv, importCsv } = useElectron();

  // 初期プロジェクトの変更を検知
  useEffect(() => {
    if (initialProject) {
      setProject(initialProject);
      setIsModified(false);
    }
  }, [initialProject]);

  /**
   * プロジェクト情報を更新する
   * @param {Object} updates - 更新内容
   */
  const updateProject = useCallback((updates) => {
    setProject(prevProject => {
      const updatedProject = ProjectModel.update(prevProject, updates);
      setIsModified(true);
      return updatedProject;
    });
  }, []);

  /**
   * プロセスステップを更新する
   * @param {Array} steps - 更新後のプロセスステップ配列
   */
  const updateProcessSteps = useCallback((steps) => {
    setProject(prevProject => {
      const updatedProject = ProjectModel.update(prevProject, { processSteps: steps });
      setIsModified(true);
      return updatedProject;
    });
  }, []);

  /**
   * ワークロードデータを更新する
   * @param {Object} workloadData - 更新後のワークロードデータ
   */
  const updateWorkloadData = useCallback((workloadData) => {
    setProject(prevProject => {
      const updatedProject = ProjectModel.update(prevProject, { workloadData });
      setIsModified(true);
      return updatedProject;
    });
  }, []);

  /**
   * 改善結果を更新する
   * @param {Object} improvementResults - 更新後の改善結果
   */
  const updateImprovementResults = useCallback((improvementResults) => {
    setProject(prevProject => {
      const updatedProject = ProjectModel.update(prevProject, { improvementResults });
      setIsModified(true);
      return updatedProject;
    });
  }, []);

  /**
   * プロジェクトを保存する
   * @param {boolean} saveAs - 名前を付けて保存するかどうか
   * @returns {Promise<Object>} - 保存結果
   */
  const saveCurrentProject = useCallback(async (saveAs = false) => {
    setIsSaving(true);
    setError(null);
    
    try {
      // プロジェクトデータの検証
      const validation = ProjectModel.validate(project);
      if (!validation.valid) {
        const errorMessage = Object.values(validation.errors).join(', ');
        setError(errorMessage);
        return { success: false, message: errorMessage };
      }
      
      // 保存処理
      const filePath = !saveAs && project.filePath ? project.filePath : null;
      const projectData = ProjectModel.serialize(project);
      const result = await saveProject(projectData, filePath);
      
      if (result.success) {
        // プロジェクト情報の更新
        setProject(prevProject => ({
          ...prevProject,
          filePath: result.filePath || prevProject.filePath,
          modified: new Date().toISOString()
        }));
        
        setIsModified(false);
        return result;
      } else {
        setError(result.message);
        return result;
      }
    } catch (error) {
      const errorMessage = `プロジェクト保存エラー: ${error.message}`;
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsSaving(false);
    }
  }, [project, saveProject]);

  /**
   * プロジェクトを開く
   * @param {string|null} filePath - 開くファイルパス（nullの場合はファイル選択ダイアログを表示）
   * @returns {Promise<Object>} - 読み込み結果
   */
  const openProjectFile = useCallback(async (filePath = null) => {
    setError(null);
    
    try {
      const result = await openProject(filePath);
      
      if (result.success) {
        const projectData = ProjectModel.deserialize(result.projectData);
        // ファイルパスを設定
        projectData.filePath = result.filePath;
        
        setProject(projectData);
        setIsModified(false);
        return { success: true, project: projectData };
      } else {
        setError(result.message);
        return result;
      }
    } catch (error) {
      const errorMessage = `プロジェクト読み込みエラー: ${error.message}`;
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [openProject]);

  /**
   * 新規プロジェクトを作成する
   * @param {Object} projectData - プロジェクトデータ
   * @returns {Object} - 作成されたプロジェクト
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
    
    const newProject = ProjectModel.create(projectData);
    setProject(newProject);
    setIsModified(false);
    setError(null);
    
    return { success: true, project: newProject };
  }, [isModified]);

  /**
   * プロジェクトをCSVとしてエクスポートする
   * @returns {Promise<Object>} - エクスポート結果
   */
  const exportProjectAsCsv = useCallback(async () => {
    if (!project.processSteps || project.processSteps.length === 0) {
      setError('エクスポートするプロセスステップがありません');
      return { success: false, message: 'エクスポートするプロセスステップがありません' };
    }
    
    try {
      const csvData = ProjectModel.toCSV(project);
      const defaultFilename = `${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      
      return await exportCsv(csvData, defaultFilename);
    } catch (error) {
      const errorMessage = `CSVエクスポートエラー: ${error.message}`;
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [project, exportCsv]);

  /**
   * CSVからプロセスステップをインポートする
   * @param {Object} mappings - フィールドのマッピング
   * @returns {Promise<Object>} - インポート結果
   */
  const importProcessStepsFromCsv = useCallback(async (mappings) => {
    try {
      const result = await importCsv();
      
      if (result.success && result.data) {
        const steps = ProjectModel.stepsFromCSV(result.data, mappings);
        
        if (steps.length > 0) {
          updateProcessSteps(steps);
          return { success: true, steps };
        } else {
          setError('インポートされたCSVからプロセスステップを生成できませんでした');
          return { success: false, message: 'インポートされたCSVからプロセスステップを生成できませんでした' };
        }
      } else {
        return result;
      }
    } catch (error) {
      const errorMessage = `CSVインポートエラー: ${error.message}`;
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [importCsv, updateProcessSteps]);

  /**
   * プロジェクトのステータスを取得する
   * @returns {Object} - プロジェクトのステータス情報
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

  return {
    project,
    isModified,
    isSaving,
    error,
    updateProject,
    updateProcessSteps,
    updateWorkloadData,
    updateImprovementResults,
    saveCurrentProject,
    openProjectFile,
    createNewProject,
    exportProjectAsCsv,
    importProcessStepsFromCsv,
    getProjectStatus
  };
}

export default useProjectData;