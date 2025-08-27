import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  useReactFlow,
  applyNodeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';

import Toolbar from './Toolbar';
import BPMNExporter from './BPMNExporter';
import StartEventNode from './nodes/StartEventNode';
import EndEventNode from './nodes/EndEventNode';
import TaskNode from './nodes/TaskNode';
import GatewayNode from './nodes/GatewayNode';
import DataObjectNode from './nodes/DataObjectNode';
import IntermediateEventNode from './nodes/IntermediateEventNode';
import SubProcessNode from './nodes/SubProcessNode';
import CallActivityNode from './nodes/CallActivityNode';
import DataStoreNode from './nodes/DataStoreNode';
import GroupNode from './nodes/GroupNode';
import TextAnnotationNode from './nodes/TextAnnotationNode';
import ParticipantNode from './nodes/ParticipantNode';
import LaneNode from './nodes/LaneNode';
import ParticipationPanel from './ParticipationPanel';
import './BPMNEditor.css';

const nodeTypes = {
  startEvent: StartEventNode,
  endEvent: EndEventNode,
  task: TaskNode,
  serviceTask: TaskNode,
  userTask: TaskNode,
  scriptTask: TaskNode,
  businessRuleTask: TaskNode,
  sendTask: TaskNode,
  receiveTask: TaskNode,
  manualTask: TaskNode,
  callActivity: CallActivityNode,
  subProcess: SubProcessNode,
  gateway: GatewayNode,
  exclusiveGateway: GatewayNode,
  inclusiveGateway: GatewayNode,
  parallelGateway: GatewayNode,
  eventBasedGateway: GatewayNode,
  complexGateway: GatewayNode,
  intermediateEvent: IntermediateEventNode,
  intermediateCatchEvent: IntermediateEventNode,
  intermediateThrowEvent: IntermediateEventNode,
  boundaryEvent: IntermediateEventNode,
  dataObject: DataObjectNode,
  dataObjectReference: DataObjectNode,
  dataStore: DataStoreNode,
  dataStoreReference: DataStoreNode,
  group: GroupNode,
  textAnnotation: TextAnnotationNode,
  participant: ParticipantNode,
  lane: LaneNode,
};

const initialNodes = [
  {
    id: '1',
    type: 'startEvent',
    position: { x: 250, y: 250 },
    data: { label: 'Start' },
  },
];

const initialEdges = [];

let id = 1;
const getId = () => `dndnode_${id++}`;

const BPMNEditorFlow = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { project } = useReactFlow();

  // Utility function to recalculate participant bounds based on child nodes
  const updateParticipantBounds = useCallback((participantId, allNodes) => {
    const participantNodes = allNodes.filter(node => 
      node.parentNode === participantId && node.type !== 'participant'
    );
    
    if (participantNodes.length === 0) {
      return allNodes; // No changes if no child nodes
    }
    
    // Get element dimensions helper
    const getNodeDimensions = (nodeType) => {
      switch (nodeType) {
        case 'startEvent':
        case 'endEvent':
        case 'intermediateEvent':
          return { width: 40, height: 40 };
        case 'gateway':
          return { width: 50, height: 50 };
        case 'task':
        case 'serviceTask':
        case 'userTask':
        case 'scriptTask':
        case 'businessRuleTask':
        case 'sendTask':
        case 'receiveTask':
        case 'manualTask':
          return { width: 100, height: 60 };
        case 'subProcess':
        case 'callActivity':
          return { width: 120, height: 80 };
        case 'dataObject':
          return { width: 36, height: 50 };
        case 'dataStore':
          return { width: 50, height: 60 };
        case 'group':
          return { width: 200, height: 150 };
        case 'textAnnotation':
          return { width: 100, height: 30 };
        default:
          return { width: 100, height: 60 };
      }
    };
    
    // Calculate bounds of all child nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    participantNodes.forEach(node => {
      const { width, height } = getNodeDimensions(node.type);
      
      // Ensure nodes don't go into the lane label area
      const adjustedX = Math.max(node.position.x, 80);
      const adjustedY = Math.max(node.position.y, 50);
      
      minX = Math.min(minX, adjustedX);
      minY = Math.min(minY, adjustedY);
      maxX = Math.max(maxX, adjustedX + width);
      maxY = Math.max(maxY, adjustedY + height);
    });
    
    // Add padding around the elements
    const padding = 40;
    const headerHeight = 40;
    const laneAreaWidth = 60; // Extra space for lane labels on the left
    
    // Calculate new participant bounds
    const newWidth = (maxX - minX) + (padding * 2) + laneAreaWidth;
    const newHeight = (maxY - minY) + headerHeight + padding;
    
    // Ensure minimum size (including lane area)
    const minWidth = 300 + laneAreaWidth;
    const minHeight = 150;
    const finalWidth = Math.max(newWidth, minWidth);
    const finalHeight = Math.max(newHeight, minHeight);
    
    // Update participant node
    return allNodes.map(node => {
      if (node.id === participantId && node.type === 'participant') {
        return {
          ...node,
          style: {
            ...node.style,
            width: finalWidth,
            height: finalHeight
          },
          data: {
            ...node.data,
            participantBounds: {
              x: node.position.x,
              y: node.position.y,
              width: finalWidth,
              height: finalHeight
            }
          }
        };
      }
      return node;
    });
  }, []);

  // Enhanced onNodesChange to update participant bounds when child nodes move
  const onNodesChangeWithBoundsUpdate = useCallback((changes) => {
    setNodes(currentNodes => {
      let newNodes = applyNodeChanges(changes, currentNodes);
      
      // Check if any nodes were moved and update their parent participant bounds
      const movedNodes = changes.filter(change => change.type === 'position' && change.dragging === false);
      const participantsToUpdate = new Set();
      
      movedNodes.forEach(change => {
        const node = newNodes.find(n => n.id === change.id);
        if (node && node.parentNode) {
          participantsToUpdate.add(node.parentNode);
        }
      });
      
      // Update bounds for affected participants
      participantsToUpdate.forEach(participantId => {
        newNodes = updateParticipantBounds(participantId, newNodes);
      });
      
      return newNodes;
    });
  }, [updateParticipantBounds]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = project({
        x: event.clientX - reactFlowWrapper.current.getBoundingClientRect().left,
        y: event.clientY - reactFlowWrapper.current.getBoundingClientRect().top,
      });

      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => {
        const updatedNodes = nds.concat(newNode);
        
        // Check if the new node was dropped inside a participant
        const droppedInParticipant = nds.find(node => 
          node.type === 'participant' &&
          position.x >= node.position.x &&
          position.x <= node.position.x + (node.style?.width || 910) &&
          position.y >= node.position.y &&
          position.y <= node.position.y + (node.style?.height || 250)
        );
        
        if (droppedInParticipant) {
          // Set parent relationship and convert to relative position
          newNode.parentNode = droppedInParticipant.id;
          newNode.extent = 'parent';
          newNode.position.x = position.x - droppedInParticipant.position.x;
          newNode.position.y = position.y - droppedInParticipant.position.y;
          newNode.data.participantId = droppedInParticipant.id;
          
          // Ensure minimum left padding for lane area
          if (newNode.position.x < 80) {
            newNode.position.x = 80;
          }
          if (newNode.position.y < 50) {
            newNode.position.y = 50;
          }
          
          // Update participant bounds
          return updateParticipantBounds(droppedInParticipant.id, updatedNodes);
        }
        
        return updatedNodes;
      });
    },
    [reactFlowInstance, project, setNodes, updateParticipantBounds],
  );

  const onNodeDoubleClick = useCallback((event, node) => {
    const newLabel = prompt('Enter new label:', node.data.label);
    if (newLabel !== null) {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === node.id ? { ...n, data: { ...n.data, label: newLabel } } : n
        )
      );
    }
  }, [setNodes]);

  const handleImportBPMN = useCallback((importedNodes, importedEdges) => {
    setNodes(importedNodes);
    setEdges(importedEdges);
    
    // Extract participants from imported nodes
    const importedParticipants = importedNodes
      .filter(node => node.type === 'participant')
      .map(node => ({
        id: node.id,
        name: node.data.label,
        lanes: []
      }));
    
    setParticipants(importedParticipants);
    
    // Reset the ID counter to avoid conflicts
    const maxNodeId = Math.max(
      ...importedNodes.map(node => {
        const match = node.id.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      }),
      0
    );
    id = maxNodeId + 1;
  }, [setNodes, setEdges, setParticipants]);

  const handleAddParticipant = useCallback((participantName) => {
    const participantId = `participant_${Date.now()}`;
    const newParticipant = {
      id: participantId,
      name: participantName,
      lanes: []
    };
    
    setParticipants(prev => [...prev, newParticipant]);
    
    // Add participant as a visual node with dynamic initial sizing
    const defaultWidth = 400;
    const defaultHeight = 200;
    
    const newNode = {
      id: participantId,
      type: 'participant',
      position: { x: 50, y: 50 + participants.length * 220 },
      data: { 
        label: participantName,
        participantBounds: {
          x: 50,
          y: 50 + participants.length * 220,
          width: defaultWidth,
          height: defaultHeight
        }
      },
      style: { 
        zIndex: -1,
        width: defaultWidth,
        height: defaultHeight
      }
    };
    
    setNodes(nds => [...nds, newNode]);
  }, [participants.length, setNodes, setParticipants]);

  const handleAddLane = useCallback((laneName, participantId) => {
    const laneId = `lane_${Date.now()}`;
    
    setParticipants(prev => prev.map(participant => {
      if (participant.id === participantId) {
        return {
          ...participant,
          lanes: [...participant.lanes, { id: laneId, name: laneName }]
        };
      }
      return participant;
    }));
    
    // Add lane as a visual node
    const participant = participants.find(p => p.id === participantId);
    const laneCount = participant ? participant.lanes.length : 0;
    
    const newNode = {
      id: laneId,
      type: 'lane',
      position: { x: 90, y: 80 + laneCount * 130 },
      data: { label: laneName, participantId },
      parentNode: participantId,
      style: { zIndex: 0 }
    };
    
    setNodes(nds => [...nds, newNode]);
  }, [participants, setNodes, setParticipants]);

  return (
    <div className="bpmn-editor">
      <Toolbar />
      <div className="reactflow-wrapper" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeWithBoundsUpdate}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          style={{ 
            marginRight: isPanelOpen ? '25vw' : '0', 
            maxWidth: isPanelOpen ? '75vw' : '100vw',
            transition: 'margin-right 0.3s ease, max-width 0.3s ease'
          }}
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
      <BPMNExporter nodes={nodes} edges={edges} onImportBPMN={handleImportBPMN} />
      <ParticipationPanel 
        onAddParticipant={handleAddParticipant}
        onAddLane={handleAddLane}
        participants={participants}
        onPanelToggle={setIsPanelOpen}
      />
    </div>
  );
};

const BPMNEditor = () => (
  <ReactFlowProvider>
    <BPMNEditorFlow />
  </ReactFlowProvider>
);

export default BPMNEditor;
