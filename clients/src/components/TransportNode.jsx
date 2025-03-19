// src/components/nodes/TransportNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';

// 搬送（ひし形）ノード
const TransportNode = ({ data }) => {
  return (
    <div className="transport-node">
      <Handle type="target" position={Position.Left} />
      <div className="node-content" style={{ 
        width: '120px',
        height: '120px',
        transform: 'rotate(45deg)',
        border: '2px solid #333',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '5px'
      }}>
        <div style={{ 
          transform: 'rotate(-45deg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%'
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

export default TransportNode;