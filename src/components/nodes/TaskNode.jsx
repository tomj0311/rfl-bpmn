import React from 'react';
import { Handle, Position } from 'reactflow';
import './BPMNNodes.css';

const TaskNode = ({ data }) => {
  return (
    <div className="task-node">
      <Handle
        type="target"
        position={Position.Left}
        id="task-input"
        className="handle"
      />
      <div className="task-content">
        <span className="node-label">{data.label}</span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="task-output"
        className="handle"
      />
    </div>
  );
};

export default TaskNode;
