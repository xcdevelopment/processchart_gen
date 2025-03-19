// src/components/CSVImportExport.jsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Alert,
  AlertTitle,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  Check as CheckIcon
} from '@mui/icons-material';

// CSVインポート/エクスポートコンポーネント
const CSVImportExport = ({ processSteps, onImport }) => {
  const [importedData, setImportedData] = useState([]);
  const [previewData, setPreviewData] = useState([]);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [mappings, setMappings] = useState({});
  
  // ステップタイプのオプション
  const stepTypeOptions = [
    { value: 'process', label: '加工（作業）' },
    { value: 'inspection', label: '検査' },
    { value: 'transport', label: '搬送（転送）' },
    { value: 'delay', label: '停滞（待ち）' },
    { value: 'storage', label: '保管' }
  ];
  
  // 時間単位のオプション
  const timeUnitOptions = [
    { value: '分', label: '分' },
    { value: '時間', label: '時間' },
    { value: '日', label: '日' }
  ];
  
  // 頻度単位のオプション
  const frequencyUnitOptions = [
    { value: '日', label: '日' },
    { value: '週', label: '週' },
    { value: '月', label: '月' },
    { value: '年', label: '年' }
  ];

  // CSVファイルのインポート
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    
    if (!file) {
      return;
    }
    
    // フォーマットチェック
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setImportError('CSVファイル形式でアップロードしてください');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        // CSVパース処理
        const content = e.target.result;
        const rows = content.split('\n');
        
        // ヘッダー行を取得
        const headers = rows[0].split(',').map(header => header.trim());
        
        // データを解析
        const data = [];
        for (let i = 1; i < rows.length; i++) {
          if (rows[i].trim() === '') continue;
          
          const values = parseCSVLine(rows[i]);
          if (values.length !== headers.length) {
            console.warn(`行 ${i+1} のカラム数がヘッダーと一致しません`);
            continue;
          }
          
          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index];
          });
          
          data.push(rowData);
        }
        
        // 自動マッピングの推定
        const suggestedMappings = suggestMappings(headers);
        setMappings(suggestedMappings);
        
        // インポートデータを設定
        setImportedData(data);
        setPreviewData(data.slice(0, 5)); // 先頭5件をプレビュー表示
        setImportError(null);
        setImportSuccess(false);
        
      } catch (error) {
        console.error('CSV解析エラー:', error);
        setImportError('CSVファイルの解析に失敗しました。ファイル形式を確認してください。');
        setImportedData([]);
        setPreviewData([]);
      }
    };
    
    reader.onerror = () => {
      setImportError('ファイルの読み込みに失敗しました');
      setImportedData([]);
      setPreviewData([]);
    };
    
    reader.readAsText(file);
  };
  
  // CSV行の解析（引用符で囲まれたカンマを考慮）
  const parseCSVLine = (line) => {
    const result = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // 最後の値を追加
    result.push(currentValue.trim());
    
    return result;
  };
  
  // マッピングの推定（ヘッダー名から自動推定）
  const suggestMappings = (headers) => {
    const mappings = {};
    
    // ヘッダー名のパターンでマッピング
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      
      if (lowerHeader.includes('名') || lowerHeader.includes('ステップ') || lowerHeader.includes('工程') || lowerHeader.includes('作業')) {
        mappings.label = header;
      }
      else if (lowerHeader.includes('タイプ') || lowerHeader.includes('種類') || lowerHeader.includes('記号')) {
        mappings.type = header;
      }
      else if (lowerHeader.includes('時間') && !lowerHeader.includes('単位')) {
        mappings.time = header;
      }
      else if (lowerHeader.includes('時間単位') || lowerHeader.includes('単位') && lowerHeader.includes('時間')) {
        mappings.timeUnit = header;
      }
      else if (lowerHeader.includes('頻度') && !lowerHeader.includes('単位')) {
        mappings.frequency = header;
      }
      else if (lowerHeader.includes('頻度単位') || lowerHeader.includes('単位') && lowerHeader.includes('頻度')) {
        mappings.frequencyUnit = header;
      }
      else if (lowerHeader.includes('担当') || lowerHeader.includes('責任者')) {
        mappings.responsible = header;
      }
      else if (lowerHeader.includes('ツール') || lowerHeader.includes('道具') || lowerHeader.includes('システム')) {
        mappings.tools = header;
      }
    });
    
    return mappings;
  };
  
  // マッピングの更新
  const handleMappingChange = (field, value) => {
    setMappings({
      ...mappings,
      [field]: value
    });
  };
  
  // データのインポート実行
  const executeImport = () => {
    try {
      // マッピング検証
      if (!mappings.label || !mappings.type || !mappings.time) {
        setImportError('ステップ名、タイプ、時間は必須項目です。マッピングを確認してください。');
        return;
      }
      
      // プロセスステップの変換
      const convertedSteps = importedData.map((row, index) => {
        // タイプの変換
        let stepType = 'process'; // デフォルト値
        const typeValue = row[mappings.type]?.toLowerCase() || '';
        
        if (typeValue.includes('検査') || typeValue.includes('確認') || typeValue.includes('チェック')) {
          stepType = 'inspection';
        } else if (typeValue.includes('搬送') || typeValue.includes('転送') || typeValue.includes('移動')) {
          stepType = 'transport';
        } else if (typeValue.includes('停滞') || typeValue.includes('待ち') || typeValue.includes('待機')) {
          stepType = 'delay';
        } else if (typeValue.includes('保管') || typeValue.includes('保存')) {
          stepType = 'storage';
        } else if (typeValue.includes('加工') || typeValue.includes('作業') || typeValue.includes('処理')) {
          stepType = 'process';
        }
        
        // 他のフィールド取得
        const timeValue = parseFloat(row[mappings.time]) || 0;
        const timeUnitValue = row[mappings.timeUnit] || '分';
        const frequencyValue = parseFloat(row[mappings.frequency]) || 1;
        const frequencyUnitValue = row[mappings.frequencyUnit] || '日';
        
        // Position の計算（ステップ間で適切な間隔を設ける）
        const position = {
          x: 150 + (index * 200),
          y: 100 + (Math.floor(index / 5) * 150) // 5ステップごとに行を変える
        };
        
        // ステップオブジェクトの作成
        return {
          id: `step-${index + 1}`,
          type: stepType,
          position: position,
          data: {
            label: row[mappings.label] || `ステップ ${index + 1}`,
            time: timeValue,
            timeUnit: timeUnitValue,
            frequency: frequencyValue,
            frequencyUnit: frequencyUnitValue,
            responsible: row[mappings.responsible] || '',
            tools: row[mappings.tools] || ''
          }
        };
      });
      
      // エッジの作成（連続するステップを接続）
      const convertedEdges = [];
      for (let i = 0; i < convertedSteps.length - 1; i++) {
        convertedEdges.push({
          id: `edge-${i + 1}-${i + 2}`,
          source: convertedSteps[i].id,
          target: convertedSteps[i + 1].id
        });
      }
      
      // ステップとエッジを結合
      const importedProcessData = {
        nodes: convertedSteps,
        edges: convertedEdges
      };
      
      // 親コンポーネントに通知
      onImport(convertedSteps);
      
      // 成功メッセージ
      setImportSuccess(true);
      setImportError(null);
      
    } catch (error) {
      console.error('データ変換エラー:', error);
      setImportError('データのインポート中にエラーが発生しました');
      setImportSuccess(false);
    }
  };
  
  // CSVへのエクスポート
  const handleExport = () => {
    // データがない場合
    if (!processSteps || processSteps.length === 0) {
      alert('エクスポートするデータがありません');
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
      const csvContent = [headers.join(','), ...rows].join('\n');
      
      // ダウンロード用リンク作成
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // ファイル名に日時を含める
      const date = new Date().toISOString().split('T')[0];
      link.download = `process_chart_${date}.csv`;
      
      // ダウンロード実行
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('エクスポートエラー:', error);
      alert('CSVエクスポート中にエラーが発生しました');
    }
  };
  
  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        CSVインポート/エクスポート
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            プロセスデータのインポート
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <input
              accept=".csv"
              id="csv-file-input"
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <label htmlFor="csv-file-input">
              <Button
                variant="contained"
                component="span"
                startIcon={<UploadIcon />}
                fullWidth
              >
                CSVファイルを選択
              </Button>
            </label>
          </Box>
          
          {importError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>エラー</AlertTitle>
              {importError}
            </Alert>
          )}
          
          {importSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <AlertTitle>成功</AlertTitle>
              データのインポートが完了しました
            </Alert>
          )}
          
          {previewData.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                プレビュー（先頭5件）
              </Typography>
              
              <TableContainer sx={{ maxHeight: 300, mb: 2 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {Object.keys(previewData[0]).map((header, index) => (
                        <TableCell key={index}>{header}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewData.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {Object.values(row).map((value, cellIndex) => (
                          <TableCell key={cellIndex}>{value}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Typography variant="subtitle1" gutterBottom>
                カラムマッピング
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>ステップ名</InputLabel>
                    <Select
                      value={mappings.label || ''}
                      label="ステップ名"
                      onChange={(e) => handleMappingChange('label', e.target.value)}
                    >
                      <MenuItem value="">選択してください</MenuItem>
                      {previewData.length > 0 && 
                        Object.keys(previewData[0]).map((header, index) => (
                          <MenuItem key={index} value={header}>{header}</MenuItem>
                        ))
                      }
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>タイプ</InputLabel>
                    <Select
                      value={mappings.type || ''}
                      label="タイプ"
                      onChange={(e) => handleMappingChange('type', e.target.value)}
                    >
                      <MenuItem value="">選択してください</MenuItem>
                      {previewData.length > 0 && 
                        Object.keys(previewData[0]).map((header, index) => (
                          <MenuItem key={index} value={header}>{header}</MenuItem>
                        ))
                      }
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>所要時間</InputLabel>
                    <Select
                      value={mappings.time || ''}
                      label="所要時間"
                      onChange={(e) => handleMappingChange('time', e.target.value)}
                    >
                      <MenuItem value="">選択してください</MenuItem>
                      {previewData.length > 0 && 
                        Object.keys(previewData[0]).map((header, index) => (
                          <MenuItem key={index} value={header}>{header}</MenuItem>
                        ))
                      }
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>時間単位</InputLabel>
                    <Select
                      value={mappings.timeUnit || ''}
                      label="時間単位"
                      onChange={(e) => handleMappingChange('timeUnit', e.target.value)}
                    >
                      <MenuItem value="">選択してください</MenuItem>
                      {previewData.length > 0 && 
                        Object.keys(previewData[0]).map((header, index) => (
                          <MenuItem key={index} value={header}>{header}</MenuItem>
                        ))
                      }
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>頻度</InputLabel>
                    <Select
                      value={mappings.frequency || ''}
                      label="頻度"
                      onChange={(e) => handleMappingChange('frequency', e.target.value)}
                    >
                      <MenuItem value="">選択してください</MenuItem>
                      {previewData.length > 0 && 
                        Object.keys(previewData[0]).map((header, index) => (
                          <MenuItem key={index} value={header}>{header}</MenuItem>
                        ))
                      }
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>頻度単位</InputLabel>
                    <Select
                      value={mappings.frequencyUnit || ''}
                      label="頻度単位"
                      onChange={(e) => handleMappingChange('frequencyUnit', e.target.value)}
                    >
                      <MenuItem value="">選択してください</MenuItem>
                      {previewData.length > 0 && 
                        Object.keys(previewData[0]).map((header, index) => (
                          <MenuItem key={index} value={header}>{header}</MenuItem>
                        ))
                      }
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>担当者</InputLabel>
                    <Select
                      value={mappings.responsible || ''}
                      label="担当者"
                      onChange={(e) => handleMappingChange('responsible', e.target.value)}
                    >
                      <MenuItem value="">選択してください</MenuItem>
                      {previewData.length > 0 && 
                        Object.keys(previewData[0]).map((header, index) => (
                          <MenuItem key={index} value={header}>{header}</MenuItem>
                        ))
                      }
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>使用ツール</InputLabel>
                    <Select
                      value={mappings.tools || ''}
                      label="使用ツール"
                      onChange={(e) => handleMappingChange('tools', e.target.value)}
                    >
                      <MenuItem value="">選択してください</MenuItem>
                      {previewData.length > 0 && 
                        Object.keys(previewData[0]).map((header, index) => (
                          <MenuItem key={index} value={header}>{header}</MenuItem>
                        ))
                      }
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<CheckIcon />}
                onClick={executeImport}
                fullWidth
              >
                インポートを実行
              </Button>
            </>
          )}
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            プロセスデータのエクスポート
          </Typography>
          
          <Typography variant="body2" paragraph>
            現在のプロセスチャートをCSVファイルとしてエクスポートします。
            エクスポートされたCSVファイルは他のツールで利用したり、後でインポートすることができます。
          </Typography>
          
          <Button
            variant="contained"
            color="secondary"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={!processSteps || processSteps.length === 0}
            fullWidth
          >
            CSVエクスポート
          </Button>
          
          {processSteps && processSteps.length > 0 && (
            <TableContainer sx={{ mt: 2, maxHeight: 300 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ステップ名</TableCell>
                    <TableCell>タイプ</TableCell>
                    <TableCell align="right">所要時間</TableCell>
                    <TableCell align="right">頻度</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {processSteps.map((step, index) => (
                    <TableRow key={index}>
                      <TableCell>{step.data.label}</TableCell>
                      <TableCell>
                        {(() => {
                          switch (step.type) {
                            case 'process': return '加工';
                            case 'inspection': return '検査';
                            case 'transport': return '搬送';
                            case 'delay': return '停滞';
                            case 'storage': return '保管';
                            default: return step.type;
                          }
                        })()}
                      </TableCell>
                      <TableCell align="right">
                        {step.data.time} {step.data.timeUnit}
                      </TableCell>
                      <TableCell align="right">
                        {step.data.frequency}回/{step.data.frequencyUnit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default CSVImportExport;