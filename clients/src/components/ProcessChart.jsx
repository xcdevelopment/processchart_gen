import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';

// カスタムノードコンポーネント
import ProcessNode from './nodes/ProcessNode';
import InspectionNode from './nodes/InspectionNode';
import TransportNode from './nodes/TransportNode';
import DelayNode from './nodes/DelayNode';
import StorageNode from './nodes/StorageNode';

// ノードタイプの登録
const nodeTypes = {
  process: ProcessNode,       // 加工（円形）
  inspection: InspectionNode, // 検査（四角形）
  transport: TransportNode,   // 搬送（ひし形）
  delay: DelayNode,           // 停滞（三角形）
  storage: StorageNode,       // 保管（特殊四角形）
};

// 初期ノードとエッジ
const initialNodes = [
  {
    id: '1',
    type: 'process',
    position: { x: 50, y: 100 },
    data: { 
      label: 'データ入力',
      time: 10,
      timeUnit: '分',
      frequency: 1,
      frequencyUnit: '日',
      responsible: '担当者A',
      tools: 'Excel'
    }
  },
  {
    id: '2',
    type: 'transport',
    position: { x: 250, y: 100 },
    data: { 
      label: '転送',
      time: 2,
      timeUnit: '分',
      frequency: 1,
      frequencyUnit: '日',
      responsible: 'システム',
      tools: 'メール'
    }
  },
  {
    id: '3',
    type: 'inspection',
    position: { x: 450, y: 100 },
    data: { 
      label: '検証',
      time: 15,
      timeUnit: '分',
      frequency: 1,
      frequencyUnit: '日',
      responsible: '担当者B',
      tools: 'チェックリスト'
    }
  },
  {
    id: '4',
    type: 'delay',
    position: { x: 650, y: 100 },
    data: { 
      label: '承認待ち',
      time: 120,
      timeUnit: '分',
      frequency: 1,
      frequencyUnit: '日',
      responsible: '管理者',
      tools: '-'
    }
  },
  {
    id: '5',
    type: 'process',
    position: { x: 850, y: 100 },
    data: { 
      label: '修正',
      time: 30,
      timeUnit: '分',
      frequency: 1,
      frequencyUnit: '日',
      responsible: '担当者A',
      tools: 'Excel'
    }
  },
  {
    id: '6',
    type: 'storage',
    position: { x: 1050, y: 100 },
    data: { 
      label: '保存',
      time: 5,
      timeUnit: '分',
      frequency: 1,
      frequencyUnit: '日',
      responsible: 'システム',
      tools: 'データベース'
    }
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
  { id: 'e4-5', source: '4', target: '5' },
  { id: 'e5-6', source: '5', target: '6' },
];

const ProcessChart = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [showHighlights, setShowHighlights] = useState(false);
  const [timeThreshold, setTimeThreshold] = useState(30); // 分単位

  // ノードの変更を処理
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  // エッジの変更を処理
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  // 新しい接続を処理
  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

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

  // 年間工数計算
  const calculateAnnualWorkload = () => {
    let totalMinutes = 0;
    
    nodes.forEach(node => {
      let minutesPerOccurrence = node.data.time;
      let occurrencesPerYear = 0;
      
      switch (node.data.frequencyUnit) {
        case '日':
          occurrencesPerYear = node.data.frequency * 250; // 営業日換算
          break;
        case '週':
          occurrencesPerYear = node.data.frequency * 52;
          break;
        case '月':
          occurrencesPerYear = node.data.frequency * 12;
          break;
        case '年':
          occurrencesPerYear = node.data.frequency;
          break;
        default:
          occurrencesPerYear = 0;
      }
      
      totalMinutes += minutesPerOccurrence * occurrencesPerYear;
    });
    
    // 時間と日数に換算（1日=8時間想定）
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
    const totalDays = Math.round(totalHours / 8 * 10) / 10;
    
    return {
      minutes: totalMinutes,
      hours: totalHours,
      days: totalDays
    };
  };

  const workload = calculateAnnualWorkload();

  return (
    <div style={{ height: '800px', width: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3>年間工数</h3>
        <div>合計時間: {workload.hours.toLocaleString()} 時間（{workload.days.toLocaleString()} 人日）</div>
        
        <div style={{ marginTop: '10px' }}>
          <label>
            <input
              type="checkbox"
              checked={showHighlights}
              onChange={() => setShowHighlights(!showHighlights)}
            />
            改善ポイントをハイライト（{timeThreshold}分以上の工程）
          </label>
          
          {showHighlights && (
            <input
              type="range"
              min="5"
              max="120"
              value={timeThreshold}
              onChange={(e) => setTimeThreshold(parseInt(e.target.value))}
              style={{ marginLeft: '10px' }}
            />
          )}
        </div>
      </div>
      
      <ReactFlow
        nodes={getHighlightedNodes()}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

export default ProcessChart;