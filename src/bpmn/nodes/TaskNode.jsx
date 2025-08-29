import React from 'react';
import { Handle, Position } from 'reactflow';
import './BPMNNodes.css';

const TaskNode = ({ data }) => {
  // Debug: log the data to verify taskType is being passed
  console.log('TaskNode data:', data);
  
  // Function to get the appropriate icon based on task type
  const getTaskIcon = (taskType) => {
    switch (taskType) {
      case 'userTask':
        return '👤'; // User icon
      case 'serviceTask':
        return '⚙️'; // Gear icon
      case 'scriptTask':
        return '📜'; // Script icon
      case 'businessRuleTask':
        return '📋'; // Business rules icon
      case 'sendTask':
        return '📤'; // Send icon
      case 'receiveTask':
        return '📥'; // Receive icon
      case 'manualTask':
        return '✋'; // Manual/hand icon
      case 'callActivity':
        return '📞'; // Call icon
      case 'task':
        return '📝'; // Generic task icon
      default:
        return '📝'; // Default task icon
    }
  };

  const taskIcon = getTaskIcon(data.taskType);

  return (
    <div className="task-node">
      <Handle
        type="target"
        position={Position.Left}
        id="task-input"
        className="handle"
      />
      <div className="task-content">
        <div className="task-type-icon">
          {taskIcon}
        </div>
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
