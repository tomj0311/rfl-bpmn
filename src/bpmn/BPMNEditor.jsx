import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  MarkerType,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import Toolbar from './Toolbar';
import BPMNExporter from './BPMNManager';
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
import PropertyPanel from './PropertyPanel';
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

const BPMNEditorFlow = ({ isDarkMode, onToggleTheme }) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [shouldFitView, setShouldFitView] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [isPropertyPanelOpen, setIsPropertyPanelOpen] = useState(false);
  const [userManuallyClosed, setUserManuallyClosed] = useState(false);
  const { project, fitView } = useReactFlow();

  // Function to update all edges with arrows
  const updateEdgesWithArrows = useCallback((edgesToUpdate) => {
    return edgesToUpdate.map(edge => {
      // Handle message flows with special styling
      if (edge.data?.isMessageFlow || edge.type === 'messageFlow') {
        return {
          ...edge,
          type: edge.type || 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 12,
            height: 12,
            color: '#666',
          },
          style: {
            stroke: '#666',
            strokeWidth: 2,
            strokeDasharray: '5,5', // Dashed line for message flows
            ...edge.style,
          },
        };
      }
      
      return {
        ...edge,
        type: edge.type || 'smoothstep', // Use smoothstep type for curved lines with smooth bends
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: '#555',
        },
        style: {
          stroke: '#555',
          strokeWidth: 2,
          ...edge.style,
        },
      };
    });
  }, []);

  // Update existing edges when component mounts
  useEffect(() => {
    setEdges((eds) => updateEdgesWithArrows(eds));
  }, [updateEdgesWithArrows]); // Added dependency

  // Utility function to update participant bounds data (without automatic resizing)
  const updateParticipantBoundsData = useCallback((participantId, allNodes) => {
    // Only update the bounds data to reflect current position and size, don't auto-resize
    return allNodes.map(node => {
      if (node.id === participantId && node.type === 'participant') {
        return {
          ...node,
          data: {
            ...node.data,
            participantBounds: {
              x: node.position.x,
              y: node.position.y,
              width: node.style?.width || node.data?.participantBounds?.width || 400,
              height: node.style?.height || node.data?.participantBounds?.height || 200
            }
          }
        };
      }
      return node;
    });
  }, []);

  // Enhanced onNodesChange to handle participant movement and child node movement
  const onNodesChangeWithBoundsUpdate = useCallback((changes) => {
    setNodes(currentNodes => {
      let newNodes = applyNodeChanges(changes, currentNodes);
      
      // Check if any nodes were moved and update their parent participant bounds
      const movedNodes = changes.filter(change => change.type === 'position' && change.dragging === false);
      const participantsToUpdate = new Set();
      const movedParticipants = new Set();
      
      // Track participant movements and child movements during dragging
      const draggedNodes = changes.filter(change => change.type === 'position' && change.dragging === true);
      
      // Track resized participants
      const resizedParticipants = changes.filter(change => change.type === 'dimensions');
      
      // Handle participant movement - ensure child nodes move with participant
      const participantMovements = new Map();
      
      movedNodes.forEach(change => {
        const node = newNodes.find(n => n.id === change.id);
        if (node) {
          if (node.type === 'participant') {
            // Track moved participants to update their bounds data
            movedParticipants.add(node.id);
            
            // Calculate the delta movement for this participant
            const oldNode = currentNodes.find(n => n.id === change.id);
            if (oldNode && (oldNode.position.x !== node.position.x || oldNode.position.y !== node.position.y)) {
              const deltaX = node.position.x - oldNode.position.x;
              const deltaY = node.position.y - oldNode.position.y;
              participantMovements.set(node.id, { deltaX, deltaY });
            }
          }
          // Remove automatic bounds updating for child nodes
        }
      });
      
      // Handle participant resizing
      resizedParticipants.forEach(change => {
        const node = newNodes.find(n => n.id === change.id);
        if (node && node.type === 'participant') {
          // Update the node's style and data when resized
          newNodes = newNodes.map(n => {
            if (n.id === change.id && n.type === 'participant') {
              return {
                ...n,
                style: {
                  ...n.style,
                  width: change.dimensions?.width ?? n.style?.width,
                  height: change.dimensions?.height ?? n.style?.height
                },
                data: {
                  ...n.data,
                  participantBounds: {
                    x: n.position.x,
                    y: n.position.y,
                    width: change.dimensions?.width ?? n.style?.width ?? 400,
                    height: change.dimensions?.height ?? n.style?.height ?? 200
                  }
                }
              };
            }
            return n;
          });
        }
      });
      
      // Apply movement delta to child nodes if their participant moved
      if (participantMovements.size > 0) {
        newNodes = newNodes.map(node => {
          if (node.parentNode && participantMovements.has(node.parentNode)) {
            const { deltaX, deltaY } = participantMovements.get(node.parentNode);
            return {
              ...node,
              position: {
                x: node.position.x + deltaX,
                y: node.position.y + deltaY
              }
            };
          }
          return node;
        });
      }
      
      // Handle real-time participant movement (during dragging)
      draggedNodes.forEach(change => {
        const node = newNodes.find(n => n.id === change.id);
        if (node && node.type === 'participant') {
          // Update participant bounds data during dragging for real-time feedback
          newNodes = newNodes.map(n => {
            if (n.id === change.id && n.type === 'participant') {
              return {
                ...n,
                data: {
                  ...n.data,
                  participantBounds: {
                    x: change.position?.x ?? n.position.x,
                    y: change.position?.y ?? n.position.y,
                    width: n.style?.width || n.data?.participantBounds?.width || 400,
                    height: n.style?.height || n.data?.participantBounds?.height || 200
                  }
                }
              };
            }
            return n;
          });
        }
      });
      
      // Update bounds data for moved participants (position only, not size)
      movedParticipants.forEach(participantId => {
        newNodes = updateParticipantBoundsData(participantId, newNodes);
      });
      
      return newNodes;
    });
  }, [updateParticipantBoundsData]);

  const onConnect = useCallback(
    (params) => {
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      // Determine if this should be a message flow based on nodes being in different participants
      let isMessageFlow = false;
      if (sourceNode && targetNode) {
        const sourceParticipant = sourceNode.parentNode || sourceNode.data?.participantId;
        const targetParticipant = targetNode.parentNode || targetNode.data?.participantId;
        
        // If nodes are in different participants or one has a participant and the other doesn't
        if ((sourceParticipant && targetParticipant && sourceParticipant !== targetParticipant) ||
            (sourceParticipant && !targetParticipant) ||
            (!sourceParticipant && targetParticipant)) {
          isMessageFlow = true;
        }
      }

      const newEdge = {
        ...params,
        type: 'smoothstep',
        data: isMessageFlow ? { isMessageFlow: true } : {},
      };
      
      setEdges((eds) => {
        const updatedEdges = addEdge(newEdge, eds);
        return updateEdgesWithArrows(updatedEdges);
      });
    },
    [setEdges, nodes, updateEdgesWithArrows],
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

      // Set appropriate default names without "node" suffix
      const getDefaultLabel = (nodeType) => {
        const typeNames = {
          startEvent: 'Start',
          endEvent: 'End',
          intermediateEvent: 'Intermediate',
          intermediateCatchEvent: 'Intermediate',
          intermediateThrowEvent: 'Intermediate',
          boundaryEvent: 'Boundary',
          task: 'Task',
          serviceTask: 'Service Task',
          userTask: 'User Task',
          scriptTask: 'Script Task',
          businessRuleTask: 'Business Rule Task',
          sendTask: 'Send Task',
          receiveTask: 'Receive Task',
          manualTask: 'Manual Task',
          subProcess: 'Sub Process',
          callActivity: 'Call Activity',
          exclusiveGateway: 'Exclusive Gateway',
          inclusiveGateway: 'Inclusive Gateway',
          parallelGateway: 'Parallel Gateway',
          eventBasedGateway: 'Event Gateway',
          complexGateway: 'Complex Gateway',
          dataObject: 'Data Object',
          dataObjectReference: 'Data Object',
          dataStore: 'Data Store',
          dataStoreReference: 'Data Store',
          group: 'Group',
          textAnnotation: 'Annotation',
          participant: 'Participant',
          lane: 'Lane'
        };
        return typeNames[nodeType] || nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
      };

      const newNode = {
        id: getId(),
        type,
        position,
        data: { 
          label: getDefaultLabel(type),
          taskType: type 
        },
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
          
          // No automatic bounds updating - let user resize manually
        }
        
        return updatedNodes;
      });
    },
    [reactFlowInstance, project, setNodes],
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

  // Selection handlers
  const onSelectionChange = useCallback(({ nodes, edges }) => {
    const selectedNode = nodes.find(node => node.selected);
    const selectedEdge = edges.find(edge => edge.selected);
    
    setSelectedNode(selectedNode || null);
    setSelectedEdge(selectedEdge || null);
    
    // Auto-open property panel when something is selected, but only if user hasn't manually closed it
    if ((selectedNode || selectedEdge) && !isPropertyPanelOpen && !userManuallyClosed) {
      setIsPropertyPanelOpen(true);
    }
    
    // Reset the manual close flag when nothing is selected
    if (!selectedNode && !selectedEdge) {
      setUserManuallyClosed(false);
    }
  }, [isPropertyPanelOpen, userManuallyClosed]);

  // Node click handler
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    // Always open property panel when user explicitly clicks a node
    if (!isPropertyPanelOpen) {
      setIsPropertyPanelOpen(true);
      setUserManuallyClosed(false); // Reset manual close flag since user is interacting
    }
  }, [isPropertyPanelOpen]);

  // Edge click handler
  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    // Always open property panel when user explicitly clicks an edge
    if (!isPropertyPanelOpen) {
      setIsPropertyPanelOpen(true);
      setUserManuallyClosed(false); // Reset manual close flag since user is interacting
    }
  }, [isPropertyPanelOpen]);

  // Pane click handler (deselect all)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  // Custom property panel toggle handler
  const handlePropertyPanelToggle = useCallback(() => {
    setIsPropertyPanelOpen(prev => {
      const newState = !prev;
      // If closing the panel, mark that user manually closed it
      if (!newState) {
        setUserManuallyClosed(true);
      } else {
        // If opening the panel, reset the manual close flag
        setUserManuallyClosed(false);
      }
      return newState;
    });
  }, []);

  // Update node data from property panel
  const handleNodeUpdate = useCallback((updatedNode) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === updatedNode.id ? updatedNode : node
      )
    );
    setSelectedNode(updatedNode);
  }, [setNodes]);

  // Update edge data from property panel
  const handleEdgeUpdate = useCallback((updatedEdge) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === updatedEdge.id ? updatedEdge : edge
      )
    );
    setSelectedEdge(updatedEdge);
  }, [setEdges]);

  // Delete functionality - handle Delete key press
  const onKeyDown = useCallback((event) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      setNodes((nds) => nds.filter((node) => !node.selected));
      setEdges((eds) => eds.filter((edge) => !edge.selected));
    }
  }, [setNodes, setEdges]);

  // Add keyboard event listener
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle delete if the focus is on the ReactFlow container or its children
      if (event.target.closest('.reactflow-wrapper') || event.target.closest('.react-flow')) {
        onKeyDown(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onKeyDown]);

  // Effect to trigger fitView after BPMN import
  useEffect(() => {
    if (shouldFitView && nodes.length > 0) {
      const timer = setTimeout(() => {
        if (fitView) {
          fitView({ 
            padding: 0.1, 
            duration: 800,
            includeHiddenNodes: true 
          });
        }
        if (reactFlowInstance) {
          reactFlowInstance.fitView({ 
            padding: 0.1, 
            duration: 800,
            includeHiddenNodes: true 
          });
        }
        setShouldFitView(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [shouldFitView, nodes, fitView, reactFlowInstance]);

  const handleImportBPMN = useCallback((importedNodes, importedEdges) => {
    setNodes(importedNodes);
    
    // Apply arrows to imported edges
    const edgesWithArrows = updateEdgesWithArrows(importedEdges);
    setEdges(edgesWithArrows);
    
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
    
    // Trigger fit view after nodes are set
    setShouldFitView(true);
  }, [setNodes, setEdges, setParticipants, updateEdgesWithArrows]);

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
      <Toolbar 
        isDarkMode={isDarkMode} 
        onToggleTheme={onToggleTheme}
        isPropertyPanelOpen={isPropertyPanelOpen}
        onTogglePropertyPanel={handlePropertyPanelToggle}
      />
      <div className="editor-content">
        <div className="reactflow-wrapper" ref={reactFlowWrapper} tabIndex={0}>
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
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onSelectionChange={onSelectionChange}
            nodeTypes={nodeTypes}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            elevateNodesOnSelect={false}
            nodeOrigin={[0, 0]}
            deleteKeyCode={null}
            connectionLineType={ConnectionLineType.SmoothStep}
            connectionMode="loose"
            style={{ 
              marginRight: (isPanelOpen ? '25vw' : '0') + (isPropertyPanelOpen ? '320px' : '0'), 
              maxWidth: `calc(100vw - ${isPanelOpen ? '25vw' : '0'} - ${isPropertyPanelOpen ? '320px' : '0'})`,
              transition: 'margin-right 0.3s ease, max-width 0.3s ease'
            }}
          >
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
        <BPMNExporter nodes={nodes} edges={edges} onImportBPMN={handleImportBPMN} />
        <ParticipationPanel 
          onAddParticipant={handleAddParticipant}
          onAddLane={handleAddLane}
          participants={participants}
          onPanelToggle={setIsPanelOpen}
        />
        <PropertyPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onNodeUpdate={handleNodeUpdate}
          onEdgeUpdate={handleEdgeUpdate}
          isOpen={isPropertyPanelOpen}
          onToggle={handlePropertyPanelToggle}
        />
      </div>
    </div>
  );
};

const BPMNEditor = ({ isDarkMode, onToggleTheme }) => (
  <ReactFlowProvider>
    <BPMNEditorFlow isDarkMode={isDarkMode} onToggleTheme={onToggleTheme} />
  </ReactFlowProvider>
);

export default BPMNEditor;
