import React, { useState, useEffect } from 'react';
import './PropertyPanel.css';

const PropertyPanel = ({ selectedNode, selectedEdge, onNodeUpdate, onEdgeUpdate, isOpen, onToggle }) => {
  const [activeSection, setActiveSection] = useState('general');
  const [nodeData, setNodeData] = useState({
    name: '',
    id: '',
    versionTag: '',
    documentation: ''
  });

  // Update local state when selected element changes
  useEffect(() => {
    if (selectedNode) {
      setNodeData({
        name: selectedNode.data.label || '',
        id: selectedNode.id || '',
        versionTag: selectedNode.data.versionTag || '',
        documentation: selectedNode.data.documentation || ''
      });
    } else if (selectedEdge) {
      setNodeData({
        name: selectedEdge.data?.label || '',
        id: selectedEdge.id || '',
        versionTag: selectedEdge.data?.versionTag || '',
        documentation: selectedEdge.data?.documentation || ''
      });
    } else {
      // Reset when nothing is selected
      setNodeData({
        name: '',
        id: '',
        versionTag: '',
        documentation: ''
      });
    }
  }, [selectedNode, selectedEdge]);

  const handleInputChange = (field, value) => {
    const updatedData = { ...nodeData, [field]: value };
    setNodeData(updatedData);

    // Update the selected element immediately
    if (selectedNode && onNodeUpdate) {
      const updatedNode = {
        ...selectedNode,
        data: {
          ...selectedNode.data,
          label: field === 'name' ? value : selectedNode.data.label,
          [field]: value
        }
      };
      onNodeUpdate(updatedNode);
    } else if (selectedEdge && onEdgeUpdate) {
      const updatedEdge = {
        ...selectedEdge,
        data: {
          ...selectedEdge.data,
          label: field === 'name' ? value : selectedEdge.data?.label,
          [field]: value
        }
      };
      onEdgeUpdate(updatedEdge);
    }
  };

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? '' : section);
  };

  const getElementType = () => {
    if (selectedNode) {
      const type = selectedNode.type;
      const typeNames = {
        startEvent: 'Start Event',
        endEvent: 'End Event',
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
        textAnnotation: 'Text Annotation',
        participant: 'Participant',
        lane: 'Lane'
      };
      return typeNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
    }
    if (selectedEdge) {
      return 'Sequence Flow';
    }
    return 'No Element Selected';
  };

  return (
    <div className={`property-panel ${isOpen ? 'open' : ''}`}>
      <div className="property-panel-header">
        <h3>Properties</h3>
        <button className="panel-toggle-btn" onClick={onToggle}>
          {isOpen ? '→' : '←'}
        </button>
      </div>

      {(selectedNode || selectedEdge) ? (
        <div className="property-panel-content">
          <div className="element-type">
            <span className="element-type-label">{getElementType()}</span>
          </div>

          {/* General Section */}
          <div className="accordion-section">
            <div 
              className={`accordion-header ${activeSection === 'general' ? 'active' : ''}`}
              onClick={() => toggleSection('general')}
            >
              <span>General</span>
              <span className="accordion-icon">
                {activeSection === 'general' ? '▼' : '▶'}
              </span>
            </div>
            {activeSection === 'general' && (
              <div className="accordion-content">
                <div className="form-group">
                  <label htmlFor="element-name">Name</label>
                  <input
                    id="element-name"
                    type="text"
                    value={nodeData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter element name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="element-id">ID</label>
                  <input
                    id="element-id"
                    type="text"
                    value={nodeData.id}
                    onChange={(e) => handleInputChange('id', e.target.value)}
                    placeholder="Element ID"
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="version-tag">Version Tag</label>
                  <input
                    id="version-tag"
                    type="text"
                    value={nodeData.versionTag}
                    onChange={(e) => handleInputChange('versionTag', e.target.value)}
                    placeholder="Enter version tag"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Documentation Section */}
          <div className="accordion-section">
            <div 
              className={`accordion-header ${activeSection === 'documentation' ? 'active' : ''}`}
              onClick={() => toggleSection('documentation')}
            >
              <span>Documentation</span>
              <span className="accordion-icon">
                {activeSection === 'documentation' ? '▼' : '▶'}
              </span>
            </div>
            {activeSection === 'documentation' && (
              <div className="accordion-content">
                <div className="form-group">
                  <label htmlFor="element-documentation">Element Documentation</label>
                  <textarea
                    id="element-documentation"
                    value={nodeData.documentation}
                    onChange={(e) => handleInputChange('documentation', e.target.value)}
                    placeholder="Enter element documentation"
                    rows={6}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="no-selection">
          <p>Select an element to view its properties</p>
        </div>
      )}
    </div>
  );
};

export default PropertyPanel;
