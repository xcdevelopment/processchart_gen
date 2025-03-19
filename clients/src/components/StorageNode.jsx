import React from 'react';
import { Handle, Position } from 'reactflow';

const StorageNode = ({ data }) => {
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
        width: '120px',
        height: '60px',
        backgroundColor: '#87CEEB',
        border: '2px solid #4682B4',
        borderRadius: '10px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '5px'
      }}>
        {/* 保管を表す記号（左側の縦線） */}
        <div style={{
          position: 'absolute',
          left: '10px',
          top: '10px',
          bottom: '10px',
          width: '2px',
          backgroundColor: '#4682B4'
        }} />
        <div style={{ 
          marginLeft: '15px',
          width: 'calc(100% - 20px)',
          textAlign: 'center'
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{data.label}</div>
          <div style={{ fontSize: '10px' }}>{data.time}{data.timeUnit}</div>
          <div style={{ fontSize: '10px' }}>{data.responsible}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default StorageNode; 