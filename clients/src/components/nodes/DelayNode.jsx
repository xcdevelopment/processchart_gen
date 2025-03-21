// src/components/nodes/DelayNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Typography } from '@mui/material';

/**
 * 停滞（Delay）ノードコンポーネント
 * JMA方式の工程分析において「停滞」を表す三角形ノード
 * 
 * @param {Object} props - コンポーネントプロパティ
 * @param {Object} props.data - ノードデータ
 * @param {boolean} props.selected - 選択状態
 * @param {function} props.onClick - クリックハンドラ
 */
const DelayNode = ({ data, selected, onClick }) => {
  // コンテナスタイル
  const containerStyle = {
    width: '120px',
    height: '104px',
    position: 'relative',
    cursor: 'pointer'
  };

  // 三角形スタイル（外側のボーダー）
  const triangleBorderStyle = {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeft: '60px solid transparent',
    borderRight: '60px solid transparent',
    borderBottom: selected ? '104px solid rgba(25, 118, 210, 0.1)' : '104px solid white',
    zIndex: 1
  };

  // 三角形の枠線
  const triangleOutlineStyle = {
    position: 'absolute',
    width: '120px',
    height: '104px',
    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
    border: selected ? '2px solid #1976d2' : '2px solid #333',
    backgroundColor: 'transparent',
    boxSizing: 'border-box',
    boxShadow: selected ? '0 0 10px rgba(25, 118, 210, 0.5)' : 'none',
    zIndex: 2
  };

  // コンテンツスタイル
  const contentStyle = {
    position: 'absolute',
    top: '30px',
    left: 0,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3
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
    <div className="delay-node" onClick={onClick} style={containerStyle}>
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      
      <div className="triangle-background" style={triangleBorderStyle}></div>
      <div className="triangle-outline" style={triangleOutlineStyle}></div>
      
      <div className="node-content" style={contentStyle}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 'bold', 
            fontSize: '14px', 
            textAlign: 'center',
            mb: 0.5,
            lineHeight: 1.2,
            maxWidth: '90px',
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

export default DelayNode;