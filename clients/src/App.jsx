// src/App.jsx - デスクトップアプリ用に更新
import React, { useState, useEffect, useCallback } from 'react';
import { 
  CssBaseline, 
  ThemeProvider, 
  createTheme,
  Container, 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Tabs, 
  Tab,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Save as SaveIcon,
  AccountTree as AccountTreeIcon,
  Timeline as TimelineIcon,
  Lightbulb as LightbulbIcon,
  Settings as SettingsIcon,
  HelpOutline as HelpOutlineIcon
} from '@mui/icons-material';

// コンポーネントのインポート
import ProcessChart from './components/ProcessChart';
import Dashboard from './components/Dashboard';
import ImprovementManager from './components/ImprovementManager';
import CSVImportExport from './components/CSVImportExport';
import Settings from './components/Settings';

// サービスのインポート
import { TimeCalculationService } from './services/timeCalculation';
import DatabaseService from './services/databaseService';
import ElectronMenuService from './services/electronMenuService';

// ダークモード対応テーマ
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

// アプリケーションコンポーネント
const App = () => {
  // ステート
  const [tabIndex, setTabIndex] = useState(0);
  const [processSteps, setProcessSteps] = useState([]);
  const [workloadData, setWorkloadData] = useState(null);
  const [improvementResults, setImprovementResults] = useState(null);
  const [currentProject, setCurrentProject] = useState({
    id: 'new',
    name: '新規プロジェクト',
    description: '',
    filePath: null,
    created: new Date().toISOString(),
    modified: new Date().toISOString()
  });
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [isModified, setIsModified] = useState(false);

  // プロセスステップが更新されたら工数を計算
  useEffect(() => {
    if (processSteps.length > 0) {
      const calculatedWorkload = TimeCalculationService.calculateAnnualWorkload(processSteps);
      setWorkloadData(calculatedWorkload);
      setIsModified(true);
    }
  }, [processSteps]);
  
  // タブの切り替え
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };
  
  // プロセスステップの更新
  const handleProcessStepsChange = (updatedSteps) => {
    setProcessSteps(updatedSteps);
    setIsModified(true);
  };
  
  // 改善施策の適用
  const handleApplyImprovements = (improvements) => {
    // 効果計算
    const effect = TimeCalculationService.calculateImprovementEffect(workloadData, improvements);
    setImprovementResults(effect);
    setIsModified(true);
    
    // 改善後のダッシュボードに切り替え
    setTabIndex(1);
  };
  
  // スナックバー表示
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  // スナックバーを閉じる
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // プロジェクトの保存
  const saveProject = async (saveAs = false) => {
    try {
      // プロジェクトデータの作成
      const projectData = {
        name: currentProject.name,
        description: currentProject.description,
        processSteps,
        workloadData,
        improvementResults,
        created: currentProject.created,
        modified: new Date().toISOString()
      };
      
      // 保存処理
      const filePath = !saveAs && currentProject.filePath ? currentProject.filePath : null;
      const result = await DatabaseService.saveProject({ filePath, projectData });
      
      if (result.success) {
        // プロジェクト情報の更新
        setCurrentProject({
          ...currentProject,
          filePath: result.filePath || currentProject.filePath,
          modified: new Date().toISOString()
        });
        
        setIsModified(false);
        showSnackbar('プロジェクトを保存しました', 'success');
      } else {
        showSnackbar(`保存に失敗しました: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('プロジェクト保存エラー:', error);
      showSnackbar(`保存エラー: ${error.message}`, 'error');
    }
  };
  
  // 新規プロジェクト作成ダイアログを開く
  const openNewProjectDialog = () => {
    setNewProjectName('');
    setNewProjectDescription('');
    setNewProjectDialogOpen(true);
  };
  
  // 新規プロジェクト作成
  const createNewProject = () => {
    // 入力検証
    if (!newProjectName.trim()) {
      showSnackbar('プロジェクト名を入力してください', 'warning');
      return;
    }
    
    // 変更があるか確認して警告
    if (isModified) {
      if (!window.confirm('保存されていない変更があります。新規プロジェクトを作成すると失われます。続行しますか？')) {
        return;
      }
    }
    
    // 新規プロジェクト作成
    setCurrentProject({
      id: 'new',
      name: newProjectName.trim(),
      description: newProjectDescription.trim(),
      filePath: null,
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    });
    
    // データリセット
    setProcessSteps([]);
    setWorkloadData(null);
    setImprovementResults(null);
    setIsModified(false);
    
    // ダイアログを閉じる
    setNewProjectDialogOpen(false);
    
    // プロセスチャートタブに切り替え
    setTabIndex(0);
    
    showSnackbar('新規プロジェクトを作成しました', 'success');
  };
  
  // 既存プロジェクトを開く処理
  const handleProjectOpened = (data) => {
    try {
      const { filePath, projectData } = data;
      
      // 変更があるか確認して警告
      if (isModified) {
        if (!window.confirm('保存されていない変更があります。他のプロジェクトを開くと失われます。続行しますか？')) {
          return;
        }
      }
      
      // プロジェクトデータを設定
      setCurrentProject({
        id: projectData.id || 'loaded',
        name: projectData.name || 'Loaded Project',
        description: projectData.description || '',
        filePath: filePath,
        created: projectData.created || new Date().toISOString(),
        modified: projectData.modified || new Date().toISOString()
      });
      
      // プロセスデータを設定
      setProcessSteps(projectData.processSteps || []);
      setWorkloadData(projectData.workloadData || null);
      setImprovementResults(projectData.improvementResults || null);
      setIsModified(false);
      
      showSnackbar(`プロジェクト「${projectData.name}」を開きました`, 'success');
    } catch (error) {
      console.error('プロジェクトの読み込みエラー:', error);
      showSnackbar(`プロジェクトの読み込みに失敗しました: ${error.message}`, 'error');
    }
  };
  
  // CSVインポート処理
  const handleImportCsv = async () => {
    try {
      const result = await DatabaseService.importCsv();
      
      if (result.success && result.data) {
        // CSVImportExportコンポーネントに処理を委譲するため、
        // 一時的にタブを切り替える
        setTabIndex(3); // 設定タブ
        
        // 少し遅延させてインポートイベントを発火
        setTimeout(() => {
          // カスタムイベントでCSVデータを渡す
          const importEvent = new CustomEvent('csv-imported', { 
            detail: { csvData: result.data }
          });
          window.dispatchEvent(importEvent);
          
          showSnackbar('CSVファイルを読み込みました。マッピングを確認してインポートしてください。', 'info');
        }, 100);
      } else if (!result.success) {
        showSnackbar(`インポートに失敗しました: ${result.message}`, 'warning');
      }
    } catch (error) {
      console.error('CSVインポートエラー:', error);
      showSnackbar(`CSVインポートエラー: ${error.message}`, 'error');
    }
  };
  
  // CSVエクスポート処理
  const handleExportCsv = async () => {
    if (!processSteps || processSteps.length === 0) {
      showSnackbar('エクスポートするデータがありません', 'warning');
      return;
    }
    
    try {
      // ヘッダー行
      const headers = [
        'ステップ名', 'タイプ', '所要時間', '時間単位', '頻度', '頻度単位', '担当者', '使用ツール'
      ];
      
      // データ行
      const rows = processSteps.map(step => {
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
          step.data.label,
          typeText,
          step.data.time,
          step.data.timeUnit,
          step.data.frequency,
          step.data.frequencyUnit,
          step.data.responsible,
          step.data.tools
        ].map(value => {
          // カンマを含む場合はダブルクォートで囲む
          const str = String(value || '');
          return str.includes(',') ? `"${str}"` : str;
        }).join(',');
      });
      
      // CSVデータ作成
      const csvData = [headers.join(','), ...rows].join('\n');
      
      // エクスポート実行
      const filename = `${currentProject.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      const result = await DatabaseService.exportCsv({ 
        data: csvData, 
        defaultFilename: filename
      });
      
      if (result.success) {
        showSnackbar('CSVファイルをエクスポートしました', 'success');
      } else {
        showSnackbar(`エクスポートに失敗しました: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('CSVエクスポートエラー:', error);
      showSnackbar(`CSVエクスポートエラー: ${error.message}`, 'error');
    }
  };
  
  // SVGエクスポート処理
  const handleExportSvg = async () => {
    if (!processSteps || processSteps.length === 0) {
      showSnackbar('エクスポートするプロセスチャートがありません', 'warning');
      return;
    }
    
    try {
      // カスタムイベントでエクスポート要求
      window.dispatchEvent(new Event('export-svg-requested'));
      
      // ProcessChartコンポーネントがSVGを生成して返すのを待つ
      const handleSvgGenerated = async (event) => {
        const svgData = event.detail.svgData;
        
        // エクスポート実行
        const result = await DatabaseService.exportImage({ 
          svgData, 
          type: 'svg'
        });
        
        if (result.success) {
          showSnackbar('プロセスチャートをSVGとしてエクスポートしました', 'success');
        } else {
          showSnackbar(`エクスポートに失敗しました: ${result.message}`, 'error');
        }
        
        // イベントリスナーを削除
        window.removeEventListener('svg-generated', handleSvgGenerated);
      };
      
      // SVG生成完了イベントをリッスン
      window.addEventListener('svg-generated', handleSvgGenerated);
    } catch (error) {
      console.error('SVGエクスポートエラー:', error);
      showSnackbar(`SVGエクスポートエラー: ${error.message}`, 'error');
    }
  };
  
  // PNGエクスポート処理
  const handleExportPng = async () => {
    if (!processSteps || processSteps.length === 0) {
      showSnackbar('エクスポートするプロセスチャートがありません', 'warning');
      return;
    }
    
    try {
      // カスタムイベントでエクスポート要求
      window.dispatchEvent(new Event('export-png-requested'));
      
      // ProcessChartコンポーネントがPNGを生成して返すのを待つ
      const handlePngGenerated = async (event) => {
        const pngData = event.detail.pngData;
        
        // エクスポート実行
        const result = await DatabaseService.exportImage({ 
          svgData: pngData, 
          type: 'png'
        });
        
        if (result.success) {
          showSnackbar('プロセスチャートをPNGとしてエクスポートしました', 'success');
        } else {
          showSnackbar(`エクスポートに失敗しました: ${result.message}`, 'error');
        }
        
        // イベントリスナーを削除
        window.removeEventListener('png-generated', handlePngGenerated);
      };
      
      // PNG生成完了イベントをリッスン
      window.addEventListener('png-generated', handlePngGenerated);
    } catch (error) {
      console.error('PNGエクスポートエラー:', error);
      showSnackbar(`PNGエクスポートエラー: ${error.message}`, 'error');
    }
  };

  // Electronメニューイベントのハンドラー
  const menuHandlers = {
    onNewProject: openNewProjectDialog,
    onSaveProject: () => saveProject(false),
    onSaveProjectAs: () => saveProject(true),
    onExportCsv: handleExportCsv,
    onExportSvg: handleExportSvg,
    onExportPng: handleExportPng,
    onImportCsv: handleImportCsv,
    onViewProcessChart: () => setTabIndex(0),
    onViewWorkload: () => setTabIndex(1),
    onViewImprovement: () => setTabIndex(2),
    onProjectOpened: handleProjectOpened
  };
  
  // Electronメニューイベントリスナーの設定
  ElectronMenuService.useMenuListeners(menuHandlers);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* アプリバー */}
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            業務プロセス分析・改善ツール
          </Typography>
          
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            {currentProject.name} {isModified && '*'}
          </Typography>
          
          <Button
            color="inherit"
            startIcon={<SaveIcon />}
            onClick={() => saveProject(false)}
          >
            保存
          </Button>
        </Toolbar>
        
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ backgroundColor: '#f5f5f5', color: 'text.primary' }}
        >
          <Tab icon={<AccountTreeIcon />} label="プロセスチャート" />
          <Tab icon={<TimelineIcon />} label="工数分析" />
          <Tab icon={<LightbulbIcon />} label="改善提案" />
          <Tab icon={<SettingsIcon />} label="設定" />
        </Tabs>
      </AppBar>
      
      {/* メインコンテンツ */}
      <Container maxWidth="xl" sx={{ mt: 10, mb: 4 }}>
        <Box sx={{ pt: 4 }}>
          {/* タブコンテンツ */}
          {tabIndex === 0 && (
            <ProcessChart 
              initialNodes={processSteps}
              onChange={handleProcessStepsChange}
            />
          )}
          
          {tabIndex === 1 && (
            <Dashboard 
              workloadData={improvementResults?.after || workloadData}
              originalWorkload={workloadData}
              improvementResults={improvementResults}
            />
          )}
          
          {tabIndex === 2 && (
            <ImprovementManager 
              processSteps={processSteps}
              currentWorkload={workloadData}
              onApplyImprovements={handleApplyImprovements}
            />
          )}
          
          {tabIndex === 3 && (
            <Box>
              <Typography variant="h4" gutterBottom>
                設定
              </Typography>
              
              <CSVImportExport 
                processSteps={processSteps}
                onImport={handleProcessStepsChange}
              />
              
              <Settings 
                currentProject={currentProject}
                onProjectChange={(project) => {
                  setCurrentProject(project);
                  setIsModified(true);
                }}
              />
            </Box>
          )}
        </Box>
      </Container>
      
      {/* 新規プロジェクトダイアログ */}
      <Dialog open={newProjectDialogOpen} onClose={() => setNewProjectDialogOpen(false)}>
        <DialogTitle>新規プロジェクト</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="プロジェクト名"
            type="text"
            fullWidth
            variant="outlined"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="説明（オプション）"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewProjectDialogOpen(false)}>キャンセル</Button>
          <Button onClick={createNewProject} variant="contained">作成</Button>
        </DialogActions>
      </Dialog>
      
      {/* スナックバー通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default App;