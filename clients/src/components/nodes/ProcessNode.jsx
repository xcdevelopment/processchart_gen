// src/components/ProcessChart.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ContentCopy as DuplicateIcon,
  SwapVert as SwapIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Save as SaveIcon,
  CenterFocusStrong as CenterIcon,
  Fullscreen as FullscreenIcon,
  Palette as PaletteIcon
} from '@mui/icons-material';
import { toPng, toSvg } from 'html-to-image';

// カスタムノードコンポーネント
// 修正: 正しいインポートパスを使用
import ProcessNode from './ProcessNode';
import InspectionNode from './InspectionNode';
import TransportNode from './TransportNode';
import DelayNode from './DelayNode';
import StorageNode from './StorageNode';

// サービスとヘルパー
import { TimeCalculationService } from '../services/timeCalculation';

// ノードタイプの登録
const nodeTypes = {
  process: ProcessNode,       // 加工（円形）
  inspection: InspectionNode, // 検査（四角形）
  transport: TransportNode,   // 搬送（ひし形）
  delay: DelayNode,           // 停滞（三角形）
  storage: StorageNode,       // 保管（特殊四角形）
};

/**
 * プロセスチャートコンポーネント
 * JMA方式の工程分析記号を使用したプロセスチャートを作成・編集するコンポーネント
 */
const ProcessChart = ({ initialNodes = [], onChange }) => {
  // フローチャートの状態
  const [nodes, setNodes] = useState(initialNodes || []);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);

  // ノード追加メニューの状態
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // ダイアログの状態
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [nodeForm, setNodeForm] = useState({
    label: '',
    type: 'process',
    time: 10,
    timeUnit: '分',
    frequency: 1,
    frequencyUnit: '日',
    responsible: '',
    tools: '',
    notes: ''
  });

  // 履歴管理（Undo/Redo用）
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isHistoryAction = useRef(false);

  // FlowチャートのDOM参照
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // ハイライト設定
  const [showHighlights, setShowHighlights] = useState(false);
  const [timeThreshold, setTimeThreshold] = useState(30); // 分単位

  // 初期化
  useEffect(() => {
    if (initialNodes && initialNodes.length > 0) {
      setNodes(initialNodes);
      
      // 初期エッジの作成
      const initialEdges = [];
      for (let i = 0; i < initialNodes.length - 1; i++) {
        initialEdges.push({
          id: `edge-${initialNodes[i].id}-${initialNodes[i+1].id}`,
          source: initialNodes[i].id,
          target: initialNodes[i+1].id,
          type: 'smoothstep'
        });
      }
      setEdges(initialEdges);
      
      // 履歴に初期状態を追加
      setHistory([{ nodes: [...initialNodes], edges: [...initialEdges] }]);
      setHistoryIndex(0);
    }
    
    // イベントリスナーを設定
    window.addEventListener('export-svg-requested', handleExportSvg);
    window.addEventListener('export-png-requested', handleExportPng);
    
    return () => {
      // クリーンアップ
      window.removeEventListener('export-svg-requested', handleExportSvg);
      window.removeEventListener('export-png-requested', handleExportPng);
    };
  }, [initialNodes]);

  // ノードまたはエッジが変更されたときにonChangeコールバックを呼び出す
  useEffect(() => {
    if (onChange && nodes.length > 0) {
      onChange(nodes);
    }
  }, [nodes, edges, onChange]);

  // ノードの変更を処理
  const onNodesChange = useCallback(
    (changes) => {
      // 履歴アクションでない場合は履歴に追加
      if (!isHistoryAction.current) {
        const currentState = { nodes: [...nodes], edges: [...edges] };
        const newHistory = history.slice(0, historyIndex + 1);
        
        setHistory([...newHistory, currentState]);
        setHistoryIndex(historyIndex + 1);
      }
      
      setNodes((nds) => applyNodeChanges(changes, nds));
      isHistoryAction.current = false;
    },
    [nodes, edges, history, historyIndex]
  );

  // エッジの変更を処理
  const onEdgesChange = useCallback(
    (changes) => {
      // 履歴アクションでない場合は履歴に追加
      if (!isHistoryAction.current) {
        const currentState = { nodes: [...nodes], edges: [...edges] };
        const newHistory = history.slice(0, historyIndex + 1);
        
        setHistory([...newHistory, currentState]);
        setHistoryIndex(historyIndex + 1);
      }
      
      setEdges((eds) => applyEdgeChanges(changes, eds));
      isHistoryAction.current = false;
    },
    [nodes, edges, history, historyIndex]
  );

  // 新しい接続を処理
  const onConnect = useCallback(
    (connection) => {
      // 履歴に追加
      const currentState = { nodes: [...nodes], edges: [...edges] };
      const newHistory = history.slice(0, historyIndex + 1);
      
      setHistory([...newHistory, currentState]);
      setHistoryIndex(historyIndex + 1);
      
      setEdges((eds) => addEdge({...connection, type: 'smoothstep'}, eds));
    },
    [nodes, edges, history, historyIndex]
  );

  // ノードまたはエッジの選択を処理
  const onSelectionChange = useCallback(({ nodes, edges }) => {
    if (nodes && nodes.length === 1) {
      setSelectedNode(nodes[0]);
      setSelectedEdge(null);
    } else if (edges && edges.length === 1) {
      setSelectedNode(null);
      setSelectedEdge(edges[0]);
    } else {
      setSelectedNode(null);
      setSelectedEdge(null);
    }
  }, []);

  // ノード追加メニューを開く
  const handleAddNodeClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // ノード追加メニューを閉じる
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  // 新しいノードを追加
  const handleAddNode = (type) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type,
      position: { 
        x: nodes.length ? nodes[nodes.length - 1].position.x + 200 : 100, 
        y: nodes.length ? nodes[nodes.length - 1].position.y : 100
      },
      data: {
        label: `${getNodeTypeLabel(type)} ${nodes.length + 1}`,
        time: 10,
        timeUnit: '分',
        frequency: 1,
        frequencyUnit: '日',
        responsible: '',
        tools: ''
      }
    };
    
    // 履歴に追加
    const currentState = { nodes: [...nodes], edges: [...edges] };
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, currentState]);
    setHistoryIndex(historyIndex + 1);
    
    // ノードを追加
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    
    // 前のノードと接続
    if (nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      const newEdge = {
        id: `edge-${lastNode.id}-${newNode.id}`,
        source: lastNode.id,
        target: newNode.id,
        type: 'smoothstep'
      };
      
      setEdges([...edges, newEdge]);
    }
    
    handleCloseMenu();
  };

  // 選択したノードを編集
  const handleEditNode = () => {
    if (selectedNode) {
      setNodeForm({
        label: selectedNode.data.label || '',
        type: selectedNode.type || 'process',
        time: selectedNode.data.time || 10,
        timeUnit: selectedNode.data.timeUnit || '分',
        frequency: selectedNode.data.frequency || 1,
        frequencyUnit: selectedNode.data.frequencyUnit || '日',
        responsible: selectedNode.data.responsible || '',
        tools: selectedNode.data.tools || '',
        notes: selectedNode.data.notes || ''
      });
      
      setNodeDialogOpen(true);
    }
  };

  // 選択したノードを複製
  const handleDuplicateNode = () => {
    if (selectedNode) {
      const newNode = {
        id: `node-${Date.now()}`,
        type: selectedNode.type,
        position: { 
          x: selectedNode.position.x + 50, 
          y: selectedNode.position.y + 50 
        },
        data: { ...selectedNode.data }
      };
      
      // 履歴に追加
      const currentState = { nodes: [...nodes], edges: [...edges] };
      const newHistory = history.slice(0, historyIndex + 1);
      setHistory([...newHistory, currentState]);
      setHistoryIndex(historyIndex + 1);
      
      setNodes([...nodes, newNode]);
    }
  };

  // 選択したノードを削除
  const handleDeleteNode = () => {
    if (selectedNode) {
      // 履歴に追加
      const currentState = { nodes: [...nodes], edges: [...edges] };
      const newHistory = history.slice(0, historyIndex + 1);
      setHistory([...newHistory, currentState]);
      setHistoryIndex(historyIndex + 1);
      
      // 関連するエッジを削除
      const newEdges = edges.filter(
        edge => edge.source !== selectedNode.id && edge.target !== selectedNode.id
      );
      
      // ノードを削除
      const newNodes = nodes.filter(node => node.id !== selectedNode.id);
      
      setEdges(newEdges);
      setNodes(newNodes);
      setSelectedNode(null);
    }
  };

  // 選択したエッジを削除
  const handleDeleteEdge = () => {
    if (selectedEdge) {
      // 履歴に追加
      const currentState = { nodes: [...nodes], edges: [...edges] };
      const newHistory = history.slice(0, historyIndex + 1);
      setHistory([...newHistory, currentState]);
      setHistoryIndex(historyIndex + 1);
      
      // エッジを削除
      const newEdges = edges.filter(edge => edge.id !== selectedEdge.id);
      setEdges(newEdges);
      setSelectedEdge(null);
    }
  };

  // ノード編集ダイアログを保存して閉じる
  const handleSaveNodeDialog = () => {
    if (selectedNode) {
      // 履歴に追加
      const currentState = { nodes: [...nodes], edges: [...edges] };
      const newHistory = history.slice(0, historyIndex + 1);
      setHistory([...newHistory, currentState]);
      setHistoryIndex(historyIndex + 1);
      
      // ノード更新
      const updatedNodes = nodes.map(node => {
        if (node.id === selectedNode.id) {
          let newNodeType = nodeForm.type;
          
          // ノードタイプが変更された場合、位置情報のみ保持して新規ノードとして扱う
          if (node.type !== newNodeType) {
            return {
              ...node,
              type: newNodeType,
              data: {
                label: nodeForm.label,
                time: parseFloat(nodeForm.time),
                timeUnit: nodeForm.timeUnit,
                frequency: parseFloat(nodeForm.frequency),
                frequencyUnit: nodeForm.frequencyUnit,
                responsible: nodeForm.responsible,
                tools: nodeForm.tools,
                notes: nodeForm.notes
              }
            };
          }
          
          // 通常の更新
          return {
            ...node,
            data: {
              ...node.data,
              label: nodeForm.label,
              time: parseFloat(nodeForm.time),
              timeUnit: nodeForm.timeUnit,
              frequency: parseFloat(nodeForm.frequency),
              frequencyUnit: nodeForm.frequencyUnit,
              responsible: nodeForm.responsible,
              tools: nodeForm.tools,
              notes: nodeForm.notes
            }
          };
        }
        return node;
      });
      
      setNodes(updatedNodes);
    }
    
    setNodeDialogOpen(false);
  };

  // ノード編集ダイアログをキャンセルして閉じる
  const handleCancelNodeDialog = () => {
    setNodeDialogOpen(false);
  };

  // ノードフォームの変更を処理
  const handleNodeFormChange = (e) => {
    const { name, value } = e.target;
    setNodeForm({
      ...nodeForm,
      [name]: value
    });
  };

  // 元に戻す（Undo）
  const handleUndo = () => {
    if (historyIndex > 0) {
      isHistoryAction.current = true;
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(historyIndex - 1);
    }
  };

  // やり直す（Redo）
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isHistoryAction.current = true;
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // フローを中央に表示
  const handleCenter = () => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 });
    }
  };

  // SVGエクスポート
  const handleExportSvg = () => {
    if (!reactFlowWrapper.current) return;
    
    const flowElement = document.querySelector('.react-flow');
    if (!flowElement) return;
    
    toSvg(flowElement, {
      filter: (node) => {
        // コントロールパネルやミニマップを除外
        if (
          node?.classList?.contains('react-flow__minimap') ||
          node?.classList?.contains('react-flow__controls') ||
          node?.classList?.contains('react-flow__background')
        ) {
          return false;
        }
        return true;
      }
    })
      .then(dataUrl => {
        // SVGデータをイベントで親コンポーネントに通知
        const event = new CustomEvent('svg-generated', {
          detail: { svgData: dataUrl }
        });
        window.dispatchEvent(event);
      })
      .catch(error => {
        console.error('SVG生成エラー:', error);
      });
  };

  // PNGエクスポート
  const handleExportPng = () => {
    if (!reactFlowWrapper.current) return;
    
    const flowElement = document.querySelector('.react-flow');
    if (!flowElement) return;
    
    toPng(flowElement, {
      filter: (node) => {
        // コントロールパネルやミニマップを除外
        if (
          node?.classList?.contains('react-flow__minimap') ||
          node?.classList?.contains('react-flow__controls') ||
          node?.classList?.contains('react-flow__background')
        ) {
          return false;
        }
        return true;
      },
      quality: 1,
      pixelRatio: 2
    })
      .then(dataUrl => {
        // PNG画像をイベントで親コンポーネントに通知
        const event = new CustomEvent('png-generated', {
          detail: { pngData: dataUrl }
        });
        window.dispatchEvent(event);
      })
      .catch(error => {
        console.error('PNG生成エラー:', error);
      });
  };

  // ハイライト条件に基づいてノードスタイルを更新
  const getHighlightedNodes = useCallback(() => {
    if (!showHighlights) return nodes;
    
    return nodes.map(node => {
      if (node.data.time > timeThreshold) {
        return {
          ...node,
          style: { ...node.style, backgroundColor: 'rgba(255, 200, 200, 0.8)', borderColor: 'red' }
        };
      }
      return node;
    });
  }, [nodes, showHighlights, timeThreshold]);

  // ノードタイプの表示名を取得
  const getNodeTypeLabel = (type) => {
    switch (type) {
      case 'process': return '加工';
      case 'inspection': return '検査';
      case 'transport': return '搬送';
      case 'delay': return '停滞';
      case 'storage': return '保管';
      default: return type;
    }
  };

  // 年間工数計算
  const calculateAnnualWorkload = () => {
    return TimeCalculationService.calculateAnnualWorkload(nodes);
  };

  const workload = calculateAnnualWorkload();

  return (
    <div>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h5" component="h2">
              プロセスチャート
            </Typography>
            {workload.totalHours > 0 && (
              <Typography color="textSecondary">
                年間工数: {workload.totalHours.toLocaleString()} 時間（{workload.totalDays.toLocaleString()} 人日）
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddNodeClick}
              >
                追加
              </Button>
              
              <Tooltip title="元に戻す">
                <IconButton 
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                >
                  <UndoIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="やり直す">
                <IconButton 
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                >
                  <RedoIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="中央に表示">
                <IconButton onClick={handleCenter}>
                  <CenterIcon />
                </IconButton>
              </Tooltip>
              
              <Divider orientation="vertical" flexItem />
              
              {selectedNode && (
                <>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={handleEditNode}
                  >
                    編集
                  </Button>
                  
                  <Tooltip title="複製">
                    <IconButton color="primary" onClick={handleDuplicateNode}>
                      <DuplicateIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="削除">
                    <IconButton color="error" onClick={handleDeleteNode}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              
              {selectedEdge && (
                <Tooltip title="エッジを削除">
                  <IconButton color="error" onClick={handleDeleteEdge}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="改善ポイントをハイライト">
                <Button
                  variant={showHighlights ? "contained" : "outlined"}
                  color={showHighlights ? "warning" : "primary"}
                  startIcon={<PaletteIcon />}
                  onClick={() => setShowHighlights(!showHighlights)}
                  size="small"
                  sx={{ mr: 2 }}
                >
                  改善ポイント表示
                </Button>
              </Tooltip>
              
              {showHighlights && (
                <Box sx={{ display: 'flex', alignItems: 'center', width: '300px' }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    {timeThreshold}分以上
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <input
                      type="range"
                      min="5"
                      max="120"
                      value={timeThreshold}
                      onChange={(e) => setTimeThreshold(parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <div style={{ height: '700px', width: '100%' }} ref={reactFlowWrapper}>
        <ReactFlow
          nodes={getHighlightedNodes()}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode={['Control', 'Meta']}
          snapToGrid={true}
          snapGrid={[20, 20]}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          attributionPosition="bottom-right"
          onInit={setReactFlowInstance}
          fitView
        >
          <Controls />
          <Background gap={20} color="#f0f0f0" />
          <MiniMap
            nodeStrokeColor={(n) => {
              if (n.type === 'process') return '#0041d0';
              if (n.type === 'inspection') return '#0041d0';
              if (n.type === 'transport') return '#ff0072';
              if (n.type === 'delay') return '#1a192b';
              if (n.type === 'storage') return '#1a192b';
              
              return '#eee';
            }}
            nodeColor={(n) => {
              if (n.type === 'process') return '#d0e1fd';
              if (n.type === 'inspection') return '#d0e1fd';
              if (n.type === 'transport') return '#ffcce3';
              if (n.type === 'delay') return '#e6e6e9';
              if (n.type === 'storage') return '#e6e6e9';
              
              return '#fff';
            }}
            nodeBorderRadius={2}
          />
        </ReactFlow>
      </div>
      
      {/* ノード追加メニュー */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => handleAddNode('process')}>
          <Typography>加工（Process）</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleAddNode('inspection')}>
          <Typography>検査（Inspection）</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleAddNode('transport')}>
          <Typography>搬送（Transport）</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleAddNode('delay')}>
          <Typography>停滞（Delay）</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleAddNode('storage')}>
          <Typography>保管（Storage）</Typography>
        </MenuItem>
      </Menu>
      
      {/* ノード編集ダイアログ */}
      <Dialog open={nodeDialogOpen} onClose={handleCancelNodeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedNode && `${getNodeTypeLabel(selectedNode.type)}ステップの編集`}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="ステップ名"
                name="label"
                value={nodeForm.label}
                onChange={handleNodeFormChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>タイプ</InputLabel>
                <Select
                  name="type"
                  value={nodeForm.type}
                  onChange={handleNodeFormChange}
                  label="タイプ"
                >
                  <MenuItem value="process">加工（Process）</MenuItem>
                  <MenuItem value="inspection">検査（Inspection）</MenuItem>
                  <MenuItem value="transport">搬送（Transport）</MenuItem>
                  <MenuItem value="delay">停滞（Delay）</MenuItem>
                  <MenuItem value="storage">保管（Storage）</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="所要時間"
                name="time"
                type="number"
                value={nodeForm.time}
                onChange={handleNodeFormChange}
                fullWidth
                required
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>時間単位</InputLabel>
                <Select
                  name="timeUnit"
                  value={nodeForm.timeUnit}
                  onChange={handleNodeFormChange}
                  label="時間単位"
                >
                  <MenuItem value="分">分</MenuItem>
                  <MenuItem value="時間">時間</MenuItem>
                  <MenuItem value="日">日</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="頻度"
                name="frequency"
                type="number"
                value={nodeForm.frequency}
                onChange={handleNodeFormChange}
                fullWidth
                required
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>頻度単位</InputLabel>
                <Select
                  name="frequencyUnit"
                  value={nodeForm.frequencyUnit}
                  onChange={handleNodeFormChange}
                  label="頻度単位"
                >
                  <MenuItem value="日">日</MenuItem>
                  <MenuItem value="週">週</MenuItem>
                  <MenuItem value="月">月</MenuItem>
                  <MenuItem value="年">年</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="担当者"
                name="responsible"
                value={nodeForm.responsible}
                onChange={handleNodeFormChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="使用ツール"
                name="tools"
                value={nodeForm.tools}
                onChange={handleNodeFormChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="備考"
                name="notes"
                value={nodeForm.notes}
                onChange={handleNodeFormChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelNodeDialog}>キャンセル</Button>
          <Button onClick={handleSaveNodeDialog} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ProcessChart;