import React from 'react';
import { Handle, Position } from 'reactflow';

// 保管（特殊四角形）ノード
const StorageNode = ({ data }) => {
  return (
    <div className="storage-node">
      <Handle type="target" position={Position.Left} />
      <div className="node-content" style={{ 
        width: '120px',
        height: '120px',
        border: '2px solid #333',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: '5px',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '30%',
          borderBottom: '2px solid #333',
          backgroundColor: 'rgba(0,0,0,0.05)'
        }}></div>
        <div style={{ 
          paddingTop: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%'
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>{data.label}</div>
          <div style={{ fontSize: '12px' }}>{data.time}{data.timeUnit}</div>
          <div style={{ fontSize: '12px' }}>担当: {data.responsible}</div>
          <div style={{ fontSize: '12px' }}>ツール: {data.tools}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default StorageNode;