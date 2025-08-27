import React from 'react';
import { Handle, Position } from 'reactflow';
import './BPMNNodes.css';

const GatewayNode = ({ data }) => {
  return (
    <div className="gateway-node">
      <Handle
        type="target"
        position={Position.Left}
        id="gateway-input"
        className="handle"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="gateway-input-top"
        className="handle"
      />
      <div className="gateway-diamond">
        <span className="node-label">{data.label}</span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="gateway-output"
        className="handle"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="gateway-output-bottom"
        className="handle"
      />
    </div>
  );
};

export default GatewayNode;
