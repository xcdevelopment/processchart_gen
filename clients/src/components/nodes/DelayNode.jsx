import React from 'react';
import { Handle, Position } from 'reactflow';

// 停滞（三角形）ノード
const DelayNode = ({ data }) => {
  return (
    <div className="delay-node">
      <Handle type="target" position={Position.Left} style={{ left: '0%' }} />
      <div className="node-content" style={{ 
        width: '120px',
        height: '104px',
        position: 'relative',
        backgroundColor: 'transparent'
      }}>
        <div style={{
          width: '0',
          height: '0',
          borderLeft: '60px solid transparent',
          borderRight: '60px solid transparent',
          borderBottom: '104px solid white',
          position: 'absolute',
          zIndex: 1
        }}></div>
        <div style={{
          width: '0',
          height: '0',
          borderLeft: '60px solid transparent',
          borderRight: '60px solid transparent',
          borderBottom: '104px solid transparent',
          borderTop: '0',
          position: 'absolute',
          boxShadow: '0 0 0 2px #333',
          zIndex: 2
        }}></div>
        <div style={{ 
          position: 'absolute',
          zIndex: 3,
          top: '30px',
          left: '0',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>{data.label}</div>
          <div style={{ fontSize: '12px' }}>{data.time}{data.timeUnit}</div>
          <div style={{ fontSize: '12px' }}>担当: {data.responsible}</div>
          <div style={{ fontSize: '12px' }}>ツール: {data.tools}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={{ right: '0%' }} />
    </div>
  );
};

export default DelayNode;