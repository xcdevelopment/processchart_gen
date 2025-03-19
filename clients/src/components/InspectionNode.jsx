// src/components/nodes/InspectionNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';

// 検査（四角形）ノード
const InspectionNode = ({ data }) => {
  return (
    <div className="inspection-node">
      <Handle type="target" position={Position.Left} />
      <div className="node-content" style={{ 
        width: '120px',
        height: '120px',
        border: '2px solid #333',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '5px'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>{data.label}</div>
        <div style={{ fontSize: '12px' }}>{data.time}{data.timeUnit}</div>
        <div style={{ fontSize: '12px' }}>担当: {data.responsible}</div>
        <div style={{ fontSize: '12px' }}>ツール: {data.tools}</div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default InspectionNode;