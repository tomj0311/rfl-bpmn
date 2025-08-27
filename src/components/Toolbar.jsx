import React from 'react';
import './Toolbar.css';

const Toolbar = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3>Events</h3>
        <div className="toolbar-items">
          <div
            className="toolbar-item start-event"
            onDragStart={(event) => onDragStart(event, 'startEvent')}
            draggable
          >
            <div className="start-event-icon"></div>
            <span>Start Event</span>
          </div>
          <div
            className="toolbar-item end-event"
            onDragStart={(event) => onDragStart(event, 'endEvent')}
            draggable
          >
            <div className="end-event-icon"></div>
            <span>End Event</span>
          </div>
          <div
            className="toolbar-item intermediate-event"
            onDragStart={(event) => onDragStart(event, 'intermediateEvent')}
            draggable
          >
            <div className="intermediate-event-icon"></div>
            <span>Intermediate Event</span>
          </div>
        </div>
      </div>
      
      <div className="toolbar-section">
        <h3>Tasks</h3>
        <div className="toolbar-items">
          <div
            className="toolbar-item task"
            onDragStart={(event) => onDragStart(event, 'task')}
            draggable
          >
            <div className="task-icon"></div>
            <span>Task</span>
          </div>
          <div
            className="toolbar-item service-task"
            onDragStart={(event) => onDragStart(event, 'serviceTask')}
            draggable
          >
            <div className="service-task-icon"></div>
            <span>Service Task</span>
          </div>
          <div
            className="toolbar-item user-task"
            onDragStart={(event) => onDragStart(event, 'userTask')}
            draggable
          >
            <div className="user-task-icon"></div>
            <span>User Task</span>
          </div>
          <div
            className="toolbar-item script-task"
            onDragStart={(event) => onDragStart(event, 'scriptTask')}
            draggable
          >
            <div className="script-task-icon"></div>
            <span>Script Task</span>
          </div>
        </div>
      </div>
      
      <div className="toolbar-section">
        <h3>Gateways</h3>
        <div className="toolbar-items">
          <div
            className="toolbar-item gateway"
            onDragStart={(event) => onDragStart(event, 'exclusiveGateway')}
            draggable
          >
            <div className="gateway-icon"></div>
            <span>Exclusive Gateway</span>
          </div>
          <div
            className="toolbar-item parallel-gateway"
            onDragStart={(event) => onDragStart(event, 'parallelGateway')}
            draggable
          >
            <div className="parallel-gateway-icon"></div>
            <span>Parallel Gateway</span>
          </div>
          <div
            className="toolbar-item inclusive-gateway"
            onDragStart={(event) => onDragStart(event, 'inclusiveGateway')}
            draggable
          >
            <div className="inclusive-gateway-icon"></div>
            <span>Inclusive Gateway</span>
          </div>
        </div>
      </div>
      
      <div className="toolbar-section">
        <h3>Sub-processes</h3>
        <div className="toolbar-items">
          <div
            className="toolbar-item subprocess"
            onDragStart={(event) => onDragStart(event, 'subProcess')}
            draggable
          >
            <div className="subprocess-icon"></div>
            <span>Sub Process</span>
          </div>
          <div
            className="toolbar-item call-activity"
            onDragStart={(event) => onDragStart(event, 'callActivity')}
            draggable
          >
            <div className="call-activity-icon"></div>
            <span>Call Activity</span>
          </div>
        </div>
      </div>
      
      <div className="toolbar-section">
        <h3>Data</h3>
        <div className="toolbar-items">
          <div
            className="toolbar-item data-object"
            onDragStart={(event) => onDragStart(event, 'dataObject')}
            draggable
          >
            <div className="data-object-icon"></div>
            <span>Data Object</span>
          </div>
          <div
            className="toolbar-item data-store"
            onDragStart={(event) => onDragStart(event, 'dataStore')}
            draggable
          >
            <div className="data-store-icon"></div>
            <span>Data Store</span>
          </div>
        </div>
      </div>
      
      <div className="toolbar-section">
        <h3>Artifacts</h3>
        <div className="toolbar-items">
          <div
            className="toolbar-item group"
            onDragStart={(event) => onDragStart(event, 'group')}
            draggable
          >
            <div className="group-icon"></div>
            <span>Group</span>
          </div>
          <div
            className="toolbar-item text-annotation"
            onDragStart={(event) => onDragStart(event, 'textAnnotation')}
            draggable
          >
            <div className="text-annotation-icon"></div>
            <span>Text Annotation</span>
          </div>
        </div>
      </div>
      
      <div className="toolbar-section">
        <h3>Participants</h3>
        <div className="toolbar-items">
          <div
            className="toolbar-item participant"
            onDragStart={(event) => onDragStart(event, 'participant')}
            draggable
          >
            <div className="participant-icon"></div>
            <span>Participant</span>
          </div>
          <div
            className="toolbar-item lane"
            onDragStart={(event) => onDragStart(event, 'lane')}
            draggable
          >
            <div className="lane-icon"></div>
            <span>Lane</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
