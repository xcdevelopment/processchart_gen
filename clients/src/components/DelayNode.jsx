import React from 'react';
import { Handle, Position } from 'reactflow';

const DelayNode = ({ data }) => {
  return (
    <div style={{ 
      width: '150px',
      height: '80px',
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <Handle type="target" position={Position.Left} />
      <div style={{
        width: '0',
        height: '0',
        borderLeft: '40px solid transparent',
        borderRight: '40px solid transparent',
        borderBottom: '60px solid #ffd700',
        position: 'absolute',
        top: '10px'
      }} />
      <div style={{
        position: 'absolute',
        width: '100%',
        textAlign: 'center',
        top: '50%',
        transform: 'translateY(-50%)',
        padding: '0 5px',
        zIndex: 1
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{data.label}</div>
        <div style={{ fontSize: '10px' }}>{data.time}{data.timeUnit}</div>
        <div style={{ fontSize: '10px' }}>{data.responsible}</div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default DelayNode; 