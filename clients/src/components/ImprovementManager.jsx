// src/components/ImprovementManager.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Tab,
  Tabs
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  History as HistoryIcon,
  Save as SaveIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';

import { ImprovementService } from '../services/improvementService';

// 難易度のオプション
const difficultyOptions = [
  { value: 'low', label: '低', color: 'success' },
  { value: 'medium', label: '中', color: 'warning' },
  { value: 'high', label: '高', color: 'error' }
];

// コストのオプション
const costOptions = [
  { value: 'low', label: '低', color: 'success' },
  { value: 'medium', label: '中', color: 'warning' },
  { value: 'high', label: '高', color: 'error' }
];

// 改善施策管理コンポーネント
const ImprovementManager = ({ processSteps, currentWorkload, onApplyImprovements }) => {
  // ステート
  const [improvementTargets, setImprovementTargets] = useState([]);
  const [suggestedImprovements, setSuggestedImprovements] = useState([]);
  const [selectedImprovements, setSelectedImprovements] = useState([]);
  const [improvementDatabase, setImprovementDatabase] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentImprovement, setCurrentImprovement] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // 分析設定
  const [analysisSettings, setAnalysisSettings] = useState({
    timeThreshold: 30,
    waitThreshold: 60,
    frequencyThreshold: 50
  });
  
  // 初期化 - プロセスステップが変更されたら分析を実行
  useEffect(() => {
    if (processSteps && processSteps.length > 0) {
      analyzeProcess();
    }
  }, [processSteps, analysisSettings]);
  
  // 改善施策データベースの読み込み
  useEffect(() => {
    const loadSavedImprovements = () => {
      const savedData = localStorage.getItem('improvementDatabase');
      if (savedData) {
        setImprovementDatabase(JSON.parse(savedData));
      }
    };
    
    loadSavedImprovements();
  }, []);
  
  // プロセスの分析を実行
  const analyzeProcess = () => {
    // 改善対象ステップの特定
    const targets = ImprovementService.analyzeProcessForImprovements(
      processSteps,
      analysisSettings
    );
    setImprovementTargets(targets);
    
    // 改善施策の提案をリセット
    setSuggestedImprovements([]);
    
    // 対象ステップごとに改善施策を提案
    if (targets.length > 0) {
      let allSuggestions = [];
      
      targets.forEach(target => {
        const suggestions = ImprovementService.suggestImprovements(
          target, 
          improvementDatabase
        );
        
        // ステップ情報を施策に紐付け
        suggestions.forEach(suggestion => {
          allSuggestions.push({
            ...suggestion,
            targetStepId: target.id,
            targetStepLabel: target.data.label,
            targetStepType: target.type
          });
        });
      });
      
      // 重複除去
      const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) =>
        index === self.findIndex(s => s.title === suggestion.title && s.targetStepId === suggestion.targetStepId)
      );
      
      setSuggestedImprovements(uniqueSuggestions);
    }
  };
  
  // 改善施策を選択
  const selectImprovement = (improvement) => {
    // 既に選択されている場合は削除
    const existingIndex = selectedImprovements.findIndex(
      item => item.id === improvement.id && item.targetStepId === improvement.targetStepId
    );
    
    if (existingIndex >= 0) {
      const updated = [...selectedImprovements];
      updated.splice(existingIndex, 1);
      setSelectedImprovements(updated);
    } else {
      // 新規追加
      setSelectedImprovements([...selectedImprovements, improvement]);
    }
  };
  
  // 改善施策ダイアログを開く
  const openImprovementDialog = (improvement = null) => {
    setCurrentImprovement(improvement || {
      title: '',
      description: '',
      targetStepType: '',
      keywords: [],
      timeReductionPercent: 30,
      implementationDifficulty: 'medium',
      estimatedCost: 'medium'
    });
    setDialogOpen(true);
  };
  
  // 改善施策を保存
  const saveImprovement = () => {
    // バリデーション
    if (!currentImprovement.title || !currentImprovement.description) {
      alert('タイトルと説明は必須です');
      return;
    }
    
    // キーワードを配列に変換
    let keywords = currentImprovement.keywords;
    if (typeof keywords === 'string') {
      keywords = keywords.split(',').map(k => k.trim()).filter(k => k);
    }
    
    // 改善施策を更新
    const updatedImprovement = {
      ...currentImprovement,
      keywords
    };
    
    // データベースに保存
    const updatedDatabase = ImprovementService.saveImprovement(
      updatedImprovement,
      improvementDatabase
    );
    
    // ステートとローカルストレージを更新
    setImprovementDatabase(updatedDatabase);
    localStorage.setItem('improvementDatabase', JSON.stringify(updatedDatabase));
    
    // 提案内容を更新
    analyzeProcess();
    
    // ダイアログを閉じる
    setDialogOpen(false);
  };
  
  // 改善施策を適用
  const applyImprovements = () => {
    if (selectedImprovements.length === 0) {
      alert('改善施策が選択されていません');
      return;
    }
    
    // 効果計算用に選択ステップを改善施策に紐付け
    const improvementsWithSteps = selectedImprovements.map(improvement => {
      const targetStep = processSteps.find(step => step.id === improvement.targetStepId);
      return {
        ...improvement,
        targetStep
      };
    });
    
    // 親コンポーネントに選択した改善施策を渡す
    onApplyImprovements(improvementsWithSteps);
  };
  
  // タブの切り替え
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // 難易度やコストのラベルと色を取得
  const getLabelAndColor = (value, options) => {
    const option = options.find(opt => opt.value === value) || options[1]; // デフォルトは'medium'
    return { label: option.label, color: option.color };
  };
  
  return (
    <div>
      <Typography variant="h4" gutterBottom>
        業務改善ポイント分析
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="改善ポイント" />
          <Tab label="提案された改善施策" />
          <Tab label="選択済み改善施策" />
          <Tab label="改善施策データベース" />
        </Tabs>
      </Box>
      
      {/* 改善ポイントタブ */}
      {tabValue === 0 && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    分析設定
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography gutterBottom>
                      時間のしきい値: {analysisSettings.timeThreshold}分
                    </Typography>
                    <Slider
                      value={analysisSettings.timeThreshold}
                      onChange={(e, newValue) => setAnalysisSettings({
                        ...analysisSettings,
                        timeThreshold: newValue
                      })}
                      min={5}
                      max={120}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography gutterBottom>
                      待ち時間のしきい値: {analysisSettings.waitThreshold}分
                    </Typography>
                    <Slider
                      value={analysisSettings.waitThreshold}
                      onChange={(e, newValue) => setAnalysisSettings({
                        ...analysisSettings,
                        waitThreshold: newValue
                      })}
                      min={10}
                      max={240}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography gutterBottom>
                      頻度のしきい値: 年{analysisSettings.frequencyThreshold}回
                    </Typography>
                    <Slider
                      value={analysisSettings.frequencyThreshold}
                      onChange={(e, newValue) => setAnalysisSettings({
                        ...analysisSettings,
                        frequencyThreshold: newValue
                      })}
                      min={10}
                      max={250}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={analyzeProcess}
                    startIcon={<AutoAwesomeIcon />}
                    fullWidth
                  >
                    再分析
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    特定された改善ポイント
                    <Chip 
                      label={`${improvementTargets.length}件`} 
                      color="primary" 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  
                  {improvementTargets.length === 0 ? (
                    <Alert severity="info">
                      現在の設定では改善ポイントが見つかりませんでした。しきい値を調整してみてください。
                    </Alert>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>ステップ名</TableCell>
                            <TableCell>タイプ</TableCell>
                            <TableCell align="right">所要時間</TableCell>
                            <TableCell align="right">頻度</TableCell>
                            <TableCell align="right">年間工数(時間)</TableCell>
                            <TableCell>対応</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {improvementTargets.map((step) => {
                            // 年間工数を計算
                            let annualFrequency = 0;
                            switch (step.data.frequencyUnit) {
                              case '日': annualFrequency = step.data.frequency * 250; break;
                              case '週': annualFrequency = step.data.frequency * 52; break;
                              case '月': annualFrequency = step.data.frequency * 12; break;
                              case '年': annualFrequency = step.data.frequency; break;
                              default: annualFrequency = 0;
                            }
                            
                            const annualHours = (step.data.time * annualFrequency) / 60;
                            
                            // ステップタイプの日本語表記
                            const typeLabels = {
                              'process': '加工',
                              'inspection': '検査',
                              'transport': '搬送',
                              'delay': '停滞',
                              'storage': '保管'
                            };
                            
                            return (
                              <TableRow key={step.id}>
                                <TableCell>{step.data.label}</TableCell>
                                <TableCell>{typeLabels[step.type] || step.type}</TableCell>
                                <TableCell align="right">{step.data.time}{step.data.timeUnit}</TableCell>
                                <TableCell align="right">
                                  {step.data.frequency}回/{step.data.frequencyUnit}
                                  <Typography variant="caption" display="block">
                                    (年間 {annualFrequency.toLocaleString()}回)
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  {annualHours.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                </TableCell>
                                <TableCell>
                                  <Button 
                                    variant="outlined" 
                                    size="small"
                                    onClick={() => setTabValue(1)} // 提案タブに切り替え
                                  >
                                    施策を見る
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
      
      {/* 提案された改善施策タブ */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          {suggestedImprovements.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">
                提案された改善施策がありません。改善ポイントタブで分析を実行してください。
              </Alert>
            </Grid>
          ) : (
            suggestedImprovements.map((improvement, index) => {
              // 対象ステップを検索
              const targetStep = processSteps.find(step => step.id === improvement.targetStepId);
              
              // 改善効果の計算
              const effect = targetStep 
                ? ImprovementService.predictImprovementEffect(targetStep, improvement)
                : { annualHours: 0 };
              
              // 難易度とコストのラベルと色
              const difficulty = getLabelAndColor(improvement.implementationDifficulty, difficultyOptions);
              const cost = getLabelAndColor(improvement.estimatedCost, costOptions);
              
              // 既に選択されているかチェック
              const isSelected = selectedImprovements.some(
                item => item.id === improvement.id && item.targetStepId === improvement.targetStepId
              );
              
              return (
                <Grid item xs={12} md={6} lg={4} key={`${improvement.id}-${index}`}>
                  <Card 
                    variant={isSelected ? "elevation" : "outlined"}
                    sx={{ 
                      border: isSelected ? '2px solid #4caf50' : undefined,
                      bgcolor: isSelected ? 'rgba(76, 175, 80, 0.08)' : undefined
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom>
                        {improvement.title}
                        {isSelected && (
                          <CheckCircleIcon color="success" sx={{ ml: 1, verticalAlign: 'middle' }} />
                        )}
                      </Typography>
                      
                      <Chip 
                        label={`対象: ${improvement.targetStepLabel}`}
                        size="small"
                        color="secondary"
                        sx={{ mb: 1 }}
                      />
                      
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {improvement.description}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">
                          期待される効果:
                        </Typography>
                        <Typography>
                          削減率: {improvement.timeReductionPercent}%
                        </Typography>
                        <Typography>
                          年間削減時間: {effect.annualHours.toLocaleString(undefined, { maximumFractionDigits: 1 })}時間
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip 
                          label={`難易度: ${difficulty.label}`}
                          color={difficulty.color}
                          size="small"
                        />
                        <Chip 
                          label={`コスト: ${cost.label}`}
                          color={cost.color}
                          size="small"
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                          variant={isSelected ? "contained" : "outlined"}
                          color={isSelected ? "success" : "primary"}
                          onClick={() => selectImprovement(improvement)}
                          startIcon={isSelected ? <CheckCircleIcon /> : null}
                        >
                          {isSelected ? '選択中' : '選択する'}
                        </Button>
                        
                        <IconButton 
                          color="info"
                          onClick={() => openImprovementDialog(improvement)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          )}
          
          {suggestedImprovements.length > 0 && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => openImprovementDialog()}
                >
                  新規改善施策を追加
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setTabValue(2)}
                  disabled={selectedImprovements.length === 0}
                >
                  選択済み施策を確認 ({selectedImprovements.length})
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
      
      {/* 選択済み改善施策タブ */}
      {tabValue === 2 && (
        <>
          {selectedImprovements.length === 0 ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              改善施策が選択されていません。提案タブから施策を選択してください。
            </Alert>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                選択された改善施策の効果
              </Typography>
              
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="overline">
                        施策数
                      </Typography>
                      <Typography variant="h3" color="primary">
                        {selectedImprovements.length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="overline">
                        改善対象ステップ数
                      </Typography>
                      <Typography variant="h3" color="primary">
                        {new Set(selectedImprovements.map(i => i.targetStepId)).size}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="overline">
                        予想削減時間（年間）
                      </Typography>
                      <Typography variant="h3" color="primary">
                        {(() => {
                          // 削減時間の計算
                          let totalHoursSaved = 0;
                          
                          selectedImprovements.forEach(improvement => {
                            const targetStep = processSteps.find(step => step.id === improvement.targetStepId);
                            if (targetStep) {
                              const effect = ImprovementService.predictImprovementEffect(targetStep, improvement);
                              totalHoursSaved += effect.annualHours;
                            }
                          });
                          
                          return totalHoursSaved.toLocaleString(undefined, { maximumFractionDigits: 1 });
                        })()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        時間
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>改善施策</TableCell>
                      <TableCell>対象ステップ</TableCell>
                      <TableCell align="right">削減率</TableCell>
                      <TableCell align="right">年間削減時間</TableCell>
                      <TableCell>難易度</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedImprovements.map((improvement, index) => {
                      const targetStep = processSteps.find(step => step.id === improvement.targetStepId);
                      const effect = targetStep 
                        ? ImprovementService.predictImprovementEffect(targetStep, improvement)
                        : { annualHours: 0 };
                        
                      const difficulty = getLabelAndColor(improvement.implementationDifficulty, difficultyOptions);
                        
                      return (
                        <TableRow key={`selected-${improvement.id}-${index}`}>
                          <TableCell>{improvement.title}</TableCell>
                          <TableCell>{improvement.targetStepLabel}</TableCell>
                          <TableCell align="right">{improvement.timeReductionPercent}%</TableCell>
                          <TableCell align="right">
                            {effect.annualHours.toLocaleString(undefined, { maximumFractionDigits: 1 })}時間
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={difficulty.label}
                              color={difficulty.color}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton 
                              color="error"
                              onClick={() => selectImprovement(improvement)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={applyImprovements}
                  size="large"
                >
                  改善施策を適用
                </Button>
              </Box>
            </>
          )}
        </>
      )}
      
      {/* 改善施策データベースタブ */}
      {tabValue === 3 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">
              改善施策データベース
              <Chip 
                label={`${improvementDatabase.length}件`} 
                color="primary" 
                size="small" 
                sx={{ ml: 1 }}
              />
            </Typography>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => openImprovementDialog()}
            >
              新規改善施策を登録
            </Button>
          </Box>
          
          {improvementDatabase.length === 0 ? (
            <Alert severity="info">
              登録されている改善施策がありません。新規改善施策を登録してください。
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>タイトル</TableCell>
                    <TableCell>説明</TableCell>
                    <TableCell>対象タイプ</TableCell>
                    <TableCell>キーワード</TableCell>
                    <TableCell align="right">削減率</TableCell>
                    <TableCell>難易度/コスト</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {improvementDatabase.map((improvement) => {
                    const difficulty = getLabelAndColor(improvement.implementationDifficulty, difficultyOptions);
                    const cost = getLabelAndColor(improvement.estimatedCost, costOptions);
                    
                    // ステップタイプの日本語表記
                    const typeLabels = {
                      'process': '加工',
                      'inspection': '検査',
                      'transport': '搬送',
                      'delay': '停滞',
                      'storage': '保管'
                    };
                    
                    return (
                      <TableRow key={improvement.id}>
                        <TableCell>{improvement.title}</TableCell>
                        <TableCell>
                          {improvement.description.length > 50 
                            ? `${improvement.description.substring(0, 50)}...` 
                            : improvement.description}
                        </TableCell>
                        <TableCell>
                          {typeLabels[improvement.targetStepType] || improvement.targetStepType || '任意'}
                        </TableCell>
                        <TableCell>
                          {improvement.keywords && improvement.keywords.map((keyword, idx) => (
                            <Chip 
                              key={idx}
                              label={keyword}
                              size="small"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </TableCell>
                        <TableCell align="right">{improvement.timeReductionPercent}%</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Chip 
                              label={`難:${difficulty.label}`}
                              color={difficulty.color}
                              size="small"
                            />
                            <Chip 
                              label={`コ:${cost.label}`}
                              color={cost.color}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            color="primary"
                            onClick={() => openImprovementDialog(improvement)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
      
      {/* 改善施策登録・編集ダイアログ */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentImprovement?.id ? '改善施策の編集' : '新規改善施策の登録'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="タイトル"
                fullWidth
                value={currentImprovement?.title || ''}
                onChange={(e) => setCurrentImprovement({
                  ...currentImprovement,
                  title: e.target.value
                })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="説明"
                fullWidth
                multiline
                rows={3}
                value={currentImprovement?.description || ''}
                onChange={(e) => setCurrentImprovement({
                  ...currentImprovement,
                  description: e.target.value
                })}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>対象ステップタイプ</InputLabel>
                <Select
                  value={currentImprovement?.targetStepType || ''}
                  label="対象ステップタイプ"
                  onChange={(e) => setCurrentImprovement({
                    ...currentImprovement,
                    targetStepType: e.target.value
                  })}
                >
                  <MenuItem value="">任意</MenuItem>
                  <MenuItem value="process">加工</MenuItem>
                  <MenuItem value="inspection">検査</MenuItem>
                  <MenuItem value="transport">搬送</MenuItem>
                  <MenuItem value="delay">停滞</MenuItem>
                  <MenuItem value="storage">保管</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="キーワード (カンマ区切り)"
                fullWidth
                value={Array.isArray(currentImprovement?.keywords) 
                  ? currentImprovement.keywords.join(', ')
                  : currentImprovement?.keywords || ''}
                onChange={(e) => setCurrentImprovement({
                  ...currentImprovement,
                  keywords: e.target.value
                })}
                placeholder="例: 自動化, 標準化, 承認"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom>
                時間削減率: {currentImprovement?.timeReductionPercent || 0}%
              </Typography>
              <Slider
                value={currentImprovement?.timeReductionPercent || 0}
                onChange={(e, newValue) => setCurrentImprovement({
                  ...currentImprovement,
                  timeReductionPercent: newValue
                })}
                min={0}
                max={100}
                valueLabelDisplay="auto"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>実装難易度</InputLabel>
                <Select
                  value={currentImprovement?.implementationDifficulty || 'medium'}
                  label="実装難易度"
                  onChange={(e) => setCurrentImprovement({
                    ...currentImprovement,
                    implementationDifficulty: e.target.value
                  })}
                >
                  <MenuItem value="low">低</MenuItem>
                  <MenuItem value="medium">中</MenuItem>
                  <MenuItem value="high">高</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>予想コスト</InputLabel>
                <Select
                  value={currentImprovement?.estimatedCost || 'medium'}
                  label="予想コスト"
                  onChange={(e) => setCurrentImprovement({
                    ...currentImprovement,
                    estimatedCost: e.target.value
                  })}
                >
                  <MenuItem value="low">低</MenuItem>
                  <MenuItem value="medium">中</MenuItem>
                  <MenuItem value="high">高</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            キャンセル
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={saveImprovement}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ImprovementManager;