// src/components/nodes/InspectionNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Typography } from '@mui/material';

/**
 * 検査（Inspection）ノードコンポーネント
 * JMA方式の工程分析において「検査」を表す四角形ノード
 * 
 * @param {Object} props - コンポーネントプロパティ
 * @param {Object} props.data - ノードデータ
 * @param {boolean} props.selected - 選択状態
 * @param {function} props.onClick - クリックハンドラ
 */
const InspectionNode = ({ data, selected, onClick }) => {
  // 基本スタイル
  const baseStyle = {
    width: '120px',
    height: '120px',
    border: selected ? '2px solid #1976d2' : '2px solid #333',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '10px',
    boxShadow: selected ? '0 0 10px rgba(25, 118, 210, 0.5)' : 'none',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative'
  };

  // 時間と頻度の表示
  const getTimeInfo = () => {
    if (!data.time) return '';
    
    let timeDisplay = `${data.time}${data.timeUnit || '分'}`;
    if (data.frequency && data.frequencyUnit) {
      timeDisplay += ` (${data.frequency}回/${data.frequencyUnit})`;
    }
    
    return timeDisplay;
  };
  
  return (
    <div className="inspection-node" onClick={onClick}>
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      
      <div className="node-content" style={baseStyle}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 'bold', 
            fontSize: '14px', 
            textAlign: 'center',
            mb: 0.5,
            lineHeight: 1.2,
            maxWidth: '110px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {data.label}
        </Typography>
        
        <Typography variant="body2" sx={{ fontSize: '12px', mb: 0.5 }}>
          {getTimeInfo()}
        </Typography>
        
        {data.responsible && (
          <Typography variant="caption" sx={{ fontSize: '10px', display: 'block' }}>
            担当: {data.responsible}
          </Typography>
        )}
        
        {data.tools && (
          <Typography variant="caption" sx={{ fontSize: '10px', display: 'block' }}>
            ツール: {data.tools}
          </Typography>
        )}
      </div>
      
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
    </div>
  );
};

export default InspectionNode;