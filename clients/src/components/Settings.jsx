// src/components/Settings.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Divider,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Card,
  CardContent,
  CardHeader,
  FormGroup,
  Tooltip,
  IconButton,
  Alert
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon,
  Brightness4 as Brightness4Icon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  Brush as BrushIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { useProject } from '../contexts/ProjectContext';

/**
 * 設定コンポーネント
 * @param {Object} props - コンポーネントのプロパティ
 */
const Settings = (props) => {
  const { currentProject, onProjectChange } = props;
  const { 
    isElectron, 
    getSetting, 
    setSetting, 
    showNotification 
  } = useProject();

  // プロジェクト関連の設定
  const [projectSettings, setProjectSettings] = useState({
    name: currentProject.name || '',
    description: currentProject.description || '',
    metadata: {
      author: currentProject.metadata?.author || '',
      company: currentProject.metadata?.company || '',
      department: currentProject.metadata?.department || '',
      version: currentProject.metadata?.version || '1.0.0',
      tags: (currentProject.metadata?.tags || []).join(', ')
    }
  });

  // アプリケーション設定のステート
  const [appSettings, setAppSettings] = useState({
    theme: 'light',
    defaultProjectLocation: '',
    processChartSettings: {
      snapToGrid: true,
      gridSize: 20,
      zoomOnScroll: true,
      panOnScroll: false
    },
    calculationSettings: {
      businessDaysPerYear: 250,
      hoursPerDay: 8
    },
    improvementSettings: {
      timeThreshold: 30,
      waitThreshold: 60,
      frequencyThreshold: 50
    },
    exportSettings: {
      defaultCsvDelimiter: ',',
      includeBom: true,
      defaultImageFormat: 'png'
    }
  });

  // 設定データの読み込み
  useEffect(() => {
    const loadSettings = async () => {
      if (isElectron) {
        try {
          const settings = await getSetting();
          if (settings) {
            setAppSettings(prevSettings => ({
              ...prevSettings,
              ...settings
            }));
          }
        } catch (error) {
          console.error('設定の読み込みエラー:', error);
        }
      } else {
        // Electron以外の環境ではローカルストレージから設定を読み込む
        try {
          const storedSettings = localStorage.getItem('app_settings');
          if (storedSettings) {
            setAppSettings(prevSettings => ({
              ...prevSettings,
              ...JSON.parse(storedSettings)
            }));
          }
        } catch (error) {
          console.error('設定の読み込みエラー:', error);
        }
      }
    };

    loadSettings();
  }, [isElectron, getSetting]);

  // プロジェクト設定が変更されたときの処理
  useEffect(() => {
    setProjectSettings({
      name: currentProject.name || '',
      description: currentProject.description || '',
      metadata: {
        author: currentProject.metadata?.author || '',
        company: currentProject.metadata?.company || '',
        department: currentProject.metadata?.department || '',
        version: currentProject.metadata?.version || '1.0.0',
        tags: (currentProject.metadata?.tags || []).join(', ')
      }
    });
  }, [currentProject]);

  /**
   * プロジェクト設定の変更ハンドラ
   * @param {Event} event - 入力イベント
   */
  const handleProjectSettingChange = (event) => {
    const { name, value } = event.target;
    
    // ネストされたフィールドの処理（metadata内のフィールド）
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProjectSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProjectSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  /**
   * アプリケーション設定の変更ハンドラ
   * @param {string} section - 設定セクション
   * @param {string} name - 設定名
   * @param {*} value - 設定値
   */
  const handleAppSettingChange = (section, name, value) => {
    setAppSettings(prev => {
      // ネストされた設定の処理
      if (section) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [name]: value
          }
        };
      } else {
        return {
          ...prev,
          [name]: value
        };
      }
    });
  };

  /**
   * スイッチ設定の変更ハンドラ
   * @param {string} section - 設定セクション
   * @param {string} name - 設定名
   * @param {Event} event - イベント
   */
  const handleSwitchChange = (section, name) => (event) => {
    handleAppSettingChange(section, name, event.target.checked);
  };

  /**
   * 数値設定の変更ハンドラ
   * @param {string} section - 設定セクション
   * @param {string} name - 設定名
   * @param {Event} event - イベント
   */
  const handleNumberChange = (section, name) => (event) => {
    const value = parseFloat(event.target.value);
    if (!isNaN(value)) {
      handleAppSettingChange(section, name, value);
    }
  };

  /**
   * プロジェクト設定の保存
   */
  const saveProjectSettings = () => {
    if (!projectSettings.name.trim()) {
      showNotification('プロジェクト名を入力してください', 'error');
      return;
    }

    // タグを配列に変換
    const tags = projectSettings.metadata.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);

    // 親コンポーネントに変更を通知
    onProjectChange({
      ...currentProject,
      name: projectSettings.name,
      description: projectSettings.description,
      metadata: {
        ...currentProject.metadata,
        ...projectSettings.metadata,
        tags
      }
    });

    showNotification('プロジェクト設定を保存しました', 'success');
  };

  /**
   * アプリケーション設定の保存
   */
  const saveAppSettings = async () => {
    try {
      if (isElectron) {
        // 設定を一つずつ保存
        for (const [key, value] of Object.entries(appSettings)) {
          await setSetting(key, value);
        }
      } else {
        // Electron以外の環境ではローカルストレージに保存
        localStorage.setItem('app_settings', JSON.stringify(appSettings));
      }

      showNotification('アプリケーション設定を保存しました', 'success');
    } catch (error) {
      console.error('設定の保存エラー:', error);
      showNotification('設定の保存に失敗しました: ' + error.message, 'error');
    }
  };

  /**
   * アプリケーション設定のリセット
   */
  const resetAppSettings = () => {
    if (window.confirm('アプリケーション設定をデフォルトに戻しますか？')) {
      setAppSettings({
        theme: 'light',
        defaultProjectLocation: '',
        processChartSettings: {
          snapToGrid: true,
          gridSize: 20,
          zoomOnScroll: true,
          panOnScroll: false
        },
        calculationSettings: {
          businessDaysPerYear: 250,
          hoursPerDay: 8
        },
        improvementSettings: {
          timeThreshold: 30,
          waitThreshold: 60,
          frequencyThreshold: 50
        },
        exportSettings: {
          defaultCsvDelimiter: ',',
          includeBom: true,
          defaultImageFormat: 'png'
        }
      });
      
      showNotification('アプリケーション設定をリセットしました', 'info');
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        設定
      </Typography>
      
      <Grid container spacing={3}>
        {/* プロジェクト設定 */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="プロジェクト設定"
              action={
                <IconButton onClick={saveProjectSettings}>
                  <SaveIcon />
                </IconButton>
              }
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="プロジェクト名"
                    name="name"
                    value={projectSettings.name}
                    onChange={handleProjectSettingChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="バージョン"
                    name="metadata.version"
                    value={projectSettings.metadata.version}
                    onChange={handleProjectSettingChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="説明"
                    name="description"
                    value={projectSettings.description}
                    onChange={handleProjectSettingChange}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="作成者"
                    name="metadata.author"
                    value={projectSettings.metadata.author}
                    onChange={handleProjectSettingChange}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="会社名"
                    name="metadata.company"
                    value={projectSettings.metadata.company}
                    onChange={handleProjectSettingChange}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="部署名"
                    name="metadata.department"
                    value={projectSettings.metadata.department}
                    onChange={handleProjectSettingChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="タグ（カンマ区切り）"
                    name="metadata.tags"
                    value={projectSettings.metadata.tags}
                    onChange={handleProjectSettingChange}
                    placeholder="例: 営業部, 顧客対応, 見積もり"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* アプリケーション設定 */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="アプリケーション設定"
              action={
                <Box>
                  <Tooltip title="設定をリセット">
                    <IconButton onClick={resetAppSettings} sx={{ mr: 1 }}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="設定を保存">
                    <IconButton onClick={saveAppSettings}>
                      <SaveIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            />
            <Divider />
            <CardContent>
              <Grid container spacing={3}>
                {/* 外観設定 */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <BrushIcon sx={{ mr: 1 }} />
                      <Typography variant="h6">外観設定</Typography>
                    </Box>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>テーマ</InputLabel>
                      <Select
                        value={appSettings.theme}
                        label="テーマ"
                        onChange={(e) => handleAppSettingChange('', 'theme', e.target.value)}
                      >
                        <MenuItem value="light">ライト</MenuItem>
                        <MenuItem value="dark">ダーク</MenuItem>
                        <MenuItem value="system">システム設定に合わせる</MenuItem>
                      </Select>
                    </FormControl>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      テーマの変更は次回起動時に反映されます。
                    </Alert>
                  </Paper>
                </Grid>
                
                {/* プロセスチャート設定 */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SettingsIcon sx={{ mr: 1 }} />
                      <Typography variant="h6">プロセスチャート設定</Typography>
                    </Box>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={appSettings.processChartSettings.snapToGrid}
                            onChange={handleSwitchChange('processChartSettings', 'snapToGrid')}
                          />
                        }
                        label="グリッドにスナップ"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={appSettings.processChartSettings.zoomOnScroll}
                            onChange={handleSwitchChange('processChartSettings', 'zoomOnScroll')}
                          />
                        }
                        label="スクロールでズーム"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={appSettings.processChartSettings.panOnScroll}
                            onChange={handleSwitchChange('processChartSettings', 'panOnScroll')}
                          />
                        }
                        label="スクロールでパン"
                      />
                    </FormGroup>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel>グリッドサイズ</InputLabel>
                      <Select
                        value={appSettings.processChartSettings.gridSize}
                        label="グリッドサイズ"
                        onChange={(e) => handleAppSettingChange('processChartSettings', 'gridSize', e.target.value)}
                      >
                        <MenuItem value={10}>10px</MenuItem>
                        <MenuItem value={15}>15px</MenuItem>
                        <MenuItem value={20}>20px</MenuItem>
                        <MenuItem value={25}>25px</MenuItem>
                        <MenuItem value={50}>50px</MenuItem>
                      </Select>
                    </FormControl>
                  </Paper>
                </Grid>
                
                {/* 計算設定 */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TimerIcon sx={{ mr: 1 }} />
                      <Typography variant="h6">計算設定</Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="年間営業日数"
                          type="number"
                          InputProps={{ inputProps: { min: 1, max: 365 } }}
                          value={appSettings.calculationSettings.businessDaysPerYear}
                          onChange={handleNumberChange('calculationSettings', 'businessDaysPerYear')}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="1日の労働時間"
                          type="number"
                          InputProps={{ inputProps: { min: 1, max: 24 } }}
                          value={appSettings.calculationSettings.hoursPerDay}
                          onChange={handleNumberChange('calculationSettings', 'hoursPerDay')}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                
                {/* 改善設定 */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <StorageIcon sx={{ mr: 1 }} />
                      <Typography variant="h6">改善分析設定</Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="時間のしきい値 (分)"
                          type="number"
                          InputProps={{ inputProps: { min: 0 } }}
                          value={appSettings.improvementSettings.timeThreshold}
                          onChange={handleNumberChange('improvementSettings', 'timeThreshold')}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="待ち時間のしきい値 (分)"
                          type="number"
                          InputProps={{ inputProps: { min: 0 } }}
                          value={appSettings.improvementSettings.waitThreshold}
                          onChange={handleNumberChange('improvementSettings', 'waitThreshold')}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="頻度のしきい値 (年間回数)"
                          type="number"
                          InputProps={{ inputProps: { min: 0 } }}
                          value={appSettings.improvementSettings.frequencyThreshold}
                          onChange={handleNumberChange('improvementSettings', 'frequencyThreshold')}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                
                {/* エクスポート設定 */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <StorageIcon sx={{ mr: 1 }} />
                      <Typography variant="h6">エクスポート設定</Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                          <InputLabel>CSV区切り文字</InputLabel>
                          <Select
                            value={appSettings.exportSettings.defaultCsvDelimiter}
                            label="CSV区切り文字"
                            onChange={(e) => handleAppSettingChange('exportSettings', 'defaultCsvDelimiter', e.target.value)}
                          >
                            <MenuItem value=",">カンマ (,)</MenuItem>
                            <MenuItem value="\t">タブ</MenuItem>
                            <MenuItem value=";">セミコロン (;)</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth>
                          <InputLabel>デフォルト画像形式</InputLabel>
                          <Select
                            value={appSettings.exportSettings.defaultImageFormat}
                            label="デフォルト画像形式"
                            onChange={(e) => handleAppSettingChange('exportSettings', 'defaultImageFormat', e.target.value)}
                          >
                            <MenuItem value="png">PNG</MenuItem>
                            <MenuItem value="svg">SVG</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={appSettings.exportSettings.includeBom}
                              onChange={handleSwitchChange('exportSettings', 'includeBom')}
                            />
                          }
                          label="CSV出力時にBOMを含める"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                
                {/* その他設定（Electron環境のみ） */}
                {isElectron && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <SettingsIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">その他設定</Typography>
                      </Box>
                      <TextField
                        fullWidth
                        label="デフォルトプロジェクト保存場所"
                        value={appSettings.defaultProjectLocation}
                        onChange={(e) => handleAppSettingChange('', 'defaultProjectLocation', e.target.value)}
                        disabled
                        helperText="この設定はファイル選択時に自動的に更新されます"
                      />
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* アプリケーション情報 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              アプリケーション情報
            </Typography>
            <Typography variant="body2">
              業務プロセス可視化・改善ツール v1.0.0
            </Typography>
            <Typography variant="body2" color="textSecondary">
              JMA方式の工程分析記号を使用したプロセスチャートを作成し、業務時間の年換算と業務改善策の提示を行います。
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {isElectron ? 'デスクトップアプリケーション版' : 'ウェブアプリケーション版'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;