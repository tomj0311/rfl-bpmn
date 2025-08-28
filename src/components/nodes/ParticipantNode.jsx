import React from 'react';
import { Handle, Position } from 'reactflow';
import './BPMNNodes.css';

const ParticipantNode = ({ data, style }) => {
  // Use dynamic width and height from style if available, with reasonable defaults
  const width = style?.width || data?.participantBounds?.width || 910;
  const height = style?.height || data?.participantBounds?.height || 250;
  const lanes = data.lanes || [];
  
  return (
    <div 
      className="participant-node" 
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        minWidth: `${Math.min(width, 300)}px`,
        minHeight: `${Math.min(height, 150)}px`
      }}
    >
      <div className="participant-header">
        <span className="participant-label">{data.label}</span>
      </div>
      <div className="participant-body" style={{ 
        width: `${width - 40}px`, 
        height: `${height - 20}px` 
      }}>
        {/* Render lane divisions */}
        {lanes.length > 0 && lanes.map((lane, index) => {
          const laneTop = lane.position.y - (data.participantBounds?.y || 0);
          const laneHeight = lane.position.height;
          
          return (
            <div 
              key={lane.id}
              className="lane-division"
              style={{
                position: 'absolute',
                left: '0px',
                top: `${laneTop}px`,
                width: '30px',
                height: `${laneHeight}px`,
                borderBottom: index < lanes.length - 1 ? '1px solid #757575' : 'none',
                background: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '500',
                color: '#424242'
              }}
            >
              <span style={{ 
                transform: 'rotate(-90deg)', 
                transformOrigin: 'center',
                whiteSpace: 'nowrap'
              }}>
                {lane.name}
              </span>
            </div>
          );
        })}
        {/* Horizontal lane separator lines */}
        {lanes.length > 0 && lanes.map((lane, index) => {
          if (index >= lanes.length - 1) return null;
          
          const separatorTop = lane.position.y - (data.participantBounds?.y || 0) + lane.position.height;
          
          return (
            <div 
              key={`separator-${lane.id}`}
              className="lane-separator"
              style={{
                position: 'absolute',
                left: '30px',
                top: `${separatorTop}px`,
                width: `${width - 60}px`,
                height: '1px',
                background: '#757575'
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ParticipantNode;
