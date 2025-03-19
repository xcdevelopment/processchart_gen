// src/components/nodes/StorageNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Typography } from '@mui/material';

/**
 * 保管（Storage）ノードコンポーネント
 * JMA方式の工程分析において「保管」を表す特殊四角形ノード
 * 
 * @param {Object} props - コンポーネントプロパティ
 * @param {Object} props.data - ノードデータ
 * @param {boolean} props.selected - 選択状態
 * @param {function} props.onClick - クリックハンドラ
 */
const StorageNode = ({ data, selected, onClick }) => {
  // 基本スタイル（特殊四角形）
  const baseStyle = {
    width: '120px',
    height: '120px',
    border: selected ? '2px solid #1976d2' : '2px solid #333',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: '5px',
    position: 'relative',
    boxShadow: selected ? '0 0 10px rgba(25, 118, 210, 0.5)' : 'none',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  };

  // 上部エリア（特殊な塗りつぶしエリア）
  const headerAreaStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    borderBottom: '2px solid #333',
    backgroundColor: selected ? 'rgba(25, 118, 210, 0.1)' : 'rgba(0, 0, 0, 0.05)'
  };

  // コンテンツエリア
  const contentStyle = {
    paddingTop: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%'
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
    <div className="storage-node" onClick={onClick}>
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      
      <div className="node-content" style={baseStyle}>
        <div className="header-area" style={headerAreaStyle}></div>
        
        <div className="content-area" style={contentStyle}>
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
      </div>
      
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
    </div>
  );
};

export default StorageNode;