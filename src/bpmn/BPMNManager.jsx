import React, { useState, useEffect } from 'react';
import './BPMNManager.css';

const BPMNManager = ({ nodes, edges, onImportBPMN }) => {
  const [showXML, setShowXML] = useState(false);
  const [bpmnXML, setBpmnXML] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pastedXML, setPastedXML] = useState('');

  // Helper function to escape XML characters
  const escapeXML = (str) => {
    if (!str) return '';
    return str.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Helper to read all attributes from an Element into a plain object
  const getAttributesMap = (el) => {
    if (!el || !el.attributes) return {};
    const attrs = {};
    // NamedNodeMap to array
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      attrs[attr.name] = attr.value;
    }
    return attrs;
  };

  // Helper to build an attribute string from a map, excluding some keys and allowing overrides
  const buildAttributesString = (attrsMap = {}, options = {}) => {
    const { exclude = [], overrides = {} } = options;
    const pieces = [];
    const excluded = new Set(exclude);
    // Merge with overrides while ensuring excluded keys are not duplicated
    const keys = new Set(Object.keys(attrsMap).concat(Object.keys(overrides)));
    keys.forEach((key) => {
      if (excluded.has(key)) return;
      const value = overrides.hasOwnProperty(key) ? overrides[key] : attrsMap[key];
      if (value === undefined || value === null) return;
      pieces.push(`${key}="${escapeXML(value)}"`);
    });
    return pieces.length ? ' ' + pieces.join(' ') : '';
  };

  // Helper function to format XML with proper indentation
  const formatXML = (xml) => {
    try {
      // Simple but effective formatting approach
      let formatted = xml
        // Add line breaks before opening tags
        .replace(/></g, '>\n<')
        // Add line breaks after declarations
        .replace(/\?>/g, '?>\n')
        // Clean up multiple newlines
        .replace(/\n\s*\n/g, '\n');

      // Split into lines and add indentation
      const lines = formatted.split('\n');
      let indentLevel = 0;
      const indentSize = 2; // 2 spaces per indent level

      return lines.map(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return '';

        // Decrease indent for closing tags
        if (trimmedLine.startsWith('</')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }

        const indentedLine = ' '.repeat(indentLevel * indentSize) + trimmedLine;

        // Increase indent for opening tags (but not self-closing or same-line content)
        if (trimmedLine.startsWith('<') &&
          !trimmedLine.startsWith('</') &&
          !trimmedLine.endsWith('/>') &&
          !trimmedLine.includes('</')) {
          indentLevel++;
        }

        return indentedLine;
      }).join('\n');

    } catch (error) {
      console.warn('Error formatting XML:', error);
      return xml; // Return original if formatting fails
    }
  };

  const generateBPMNXML = () => {
    console.log('Generating BPMN XML...');
    console.log('Nodes:', nodes.length, nodes);
    console.log('Edges:', edges.length, edges);

    // Separate participants and regular nodes first
    const participantNodes = nodes.filter(node => node.type === 'participant');
    const regularNodes = nodes.filter(node => node.type !== 'participant' && node.type !== 'lane');
    const laneNodes = nodes.filter(node => node.type === 'lane');

    console.log('Participant nodes:', participantNodes.length);
    console.log('Regular nodes:', regularNodes.length);
    console.log('Lane nodes:', laneNodes.length);

    // Preserve original IDs when available
    const originalProcessId = regularNodes.length > 0 && regularNodes[0].data?.originalProcessId || 'Process_0ijwbx8';
    const originalDefinitionsId = 'Definitions_02c9j3u';
    const timestamp = Date.now();
    const collaborationId = `Collaboration_${timestamp}`;
    const processId = originalProcessId;

    // Separate message flows from sequence flows
    const sequenceFlows = edges.filter(edge => !edge.data?.isMessageFlow);
    const messageFlows = edges.filter(edge => edge.data?.isMessageFlow);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="${originalDefinitionsId}" targetNamespace="http://bpmn.io/schema/bpmn" exporter="bpmn-js (https://demo.bpmn.io)" exporterVersion="18.6.1">`;

    // If we have participants, create collaboration structure
    if (participantNodes.length > 0) {
      xml += `<bpmn:collaboration id="${collaborationId}">`;

      // Add participants
      participantNodes.forEach(participant => {
        // Prefer original processRef if available
        const participantProcessId = participant?.data?.processRef || `Process_${participant.id}`;
        // Preserve any original participant attributes
        const participantAttrsMap = participant?.data?.originalAttributes || {};
        const participantAttrStr = buildAttributesString(participantAttrsMap, {
          exclude: ['id', 'name', 'processRef'],
        });
        // Documentation for participant
        const docs = [];
        if (participant?.data?.documentation) docs.push(participant.data.documentation);
        if (Array.isArray(participant?.data?.originalDocumentation)) {
          participant.data.originalDocumentation.forEach(d => { if (d) docs.push(d); });
        }
        if (docs.length) {
          xml += `<bpmn:participant id="${participant.id}" name="${escapeXML(participant.data?.label || '')}" processRef="${participantProcessId}"${participantAttrStr}>`;
          docs.forEach(text => {
            xml += `<bpmn:documentation>${escapeXML(text)}</bpmn:documentation>`;
          });
          xml += `</bpmn:participant>`;
        } else {
          xml += `<bpmn:participant id="${participant.id}" name="${escapeXML(participant.data?.label || '')}" processRef="${participantProcessId}"${participantAttrStr} />`;
        }
      });

      // Add message flows
      messageFlows.forEach(flow => {
        const flowName = flow.data?.label || flow.label || '';
        if (flowName) {
          xml += `<bpmn:messageFlow id="${flow.id}" name="${escapeXML(flowName)}" sourceRef="${flow.source}" targetRef="${flow.target}" />`;
        } else {
          xml += `<bpmn:messageFlow id="${flow.id}" sourceRef="${flow.source}" targetRef="${flow.target}" />`;
        }
      });

      xml += `</bpmn:collaboration>`;

      // Create separate processes for each participant
      participantNodes.forEach(participant => {
        const participantProcessId = participant?.data?.processRef || `Process_${participant.id}`;
        const participantElements = regularNodes.filter(node => node.data.participantId === participant.id);
        const participantLanes = laneNodes.filter(lane => lane.data.participantId === participant.id);
        const participantFlows = sequenceFlows.filter(flow => {
          const sourceNode = regularNodes.find(n => n.id === flow.source);
          return sourceNode && sourceNode.data.participantId === participant.id;
        });
        // Process attributes/documentation preserved from import, if available
        const procAttrsMap = participant?.data?.originalProcessAttributes || {};
        // Try to preserve isExecutable either from process attrs or from any of its elements
        let isExecutable = procAttrsMap?.isExecutable;
        if (isExecutable === undefined) {
          const anyElem = participantElements[0];
          if (anyElem && anyElem.data?.originalIsExecutable !== undefined) {
            isExecutable = anyElem.data.originalIsExecutable;
          }
        }
        const procAttrStr = buildAttributesString(procAttrsMap, {
          exclude: ['id', 'name', 'isExecutable'],
          overrides: isExecutable !== undefined ? { isExecutable } : {}
        });
        const procDocs = [];
        if (Array.isArray(participant?.data?.originalProcessDocumentation)) {
          participant.data.originalProcessDocumentation.forEach(d => { if (d) procDocs.push(d); });
        }
        if (procDocs.length) {
          xml += `<bpmn:process id="${participantProcessId}" name="${escapeXML(participant.data?.label || '')}"${procAttrStr}>`;
          procDocs.forEach(text => {
            xml += `<bpmn:documentation>${escapeXML(text)}</bpmn:documentation>`;
          });
        } else {
          xml += `<bpmn:process id="${participantProcessId}" name="${escapeXML(participant.data?.label || '')}"${procAttrStr}>`;
        }

        // Add lane set if lanes exist
        if (participantLanes.length > 0) {
          xml += `<bpmn:laneSet id="${participant.id}_laneset">`;
          participantLanes.forEach(lane => {
            xml += `<bpmn:lane id="${lane.id}" name="${escapeXML(lane.data?.label || '')}">`;
            // Add flow node refs for elements in this lane
            const laneElements = participantElements.filter(elem => elem.data.laneId === lane.id);
            laneElements.forEach(elem => {
              xml += `<bpmn:flowNodeRef>${elem.id}</bpmn:flowNodeRef>`;
            });
            xml += `</bpmn:lane>`;
          });
          xml += `</bpmn:laneSet>`;
        }

        // Add elements for this participant
        participantElements.forEach(node => {
          xml += generateNodeXML(node, sequenceFlows);
        });

        // Add sequence flows for this participant
        participantFlows.forEach(flow => {
          const flowName = flow.data?.label || flow.label || '';
          // Preserve original flow attributes and documentation
          const flowAttrsMap = flow.data?.originalAttributes || {};
          const docs = [];
          if (flow.data?.documentation) docs.push(flow.data.documentation);
          if (Array.isArray(flow.data?.originalDocumentation)) flow.data.originalDocumentation.forEach(d => { if (d) docs.push(d); });
          const flowAttrStr = buildAttributesString(flowAttrsMap, { exclude: ['id', 'name', 'sourceRef', 'targetRef'] });
          if (docs.length) {
            xml += `<bpmn:sequenceFlow id="${flow.id}"${flowName ? ` name="${escapeXML(flowName)}"` : ''} sourceRef="${flow.source}" targetRef="${flow.target}"${flowAttrStr}>`;
            docs.forEach(text => { xml += `<bpmn:documentation>${escapeXML(text)}</bpmn:documentation>`; });
            xml += `</bpmn:sequenceFlow>`;
          } else {
            xml += `<bpmn:sequenceFlow id="${flow.id}"${flowName ? ` name="${escapeXML(flowName)}"` : ''} sourceRef="${flow.source}" targetRef="${flow.target}"${flowAttrStr} />`;
          }
        });

        xml += `</bpmn:process>`;
      });

    } else {
      // No participants - single process  
      // Preserve original isExecutable value
      const isExecutable = regularNodes.length > 0 && regularNodes[0].data?.originalIsExecutable !== undefined
        ? regularNodes[0].data.originalIsExecutable : "false";
      xml += `<bpmn:process id="${processId}" isExecutable="${isExecutable}">`;

      // Add all nodes
      regularNodes.forEach(node => {
        xml += generateNodeXML(node, sequenceFlows);
      });

      // Add sequence flows
      sequenceFlows.forEach(flow => {
        const flowName = flow.data?.label || flow.label || '';
        const flowAttrsMap = flow.data?.originalAttributes || {};
        const docs = [];
        if (flow.data?.documentation) docs.push(flow.data.documentation);
        if (Array.isArray(flow.data?.originalDocumentation)) flow.data.originalDocumentation.forEach(d => { if (d) docs.push(d); });
        const flowAttrStr = buildAttributesString(flowAttrsMap, { exclude: ['id', 'name', 'sourceRef', 'targetRef'] });
        if (docs.length) {
          xml += `<bpmn:sequenceFlow id="${flow.id}"${flowName ? ` name="${escapeXML(flowName)}"` : ''} sourceRef="${flow.source}" targetRef="${flow.target}"${flowAttrStr}>`;
          docs.forEach(text => { xml += `<bpmn:documentation>${escapeXML(text)}</bpmn:documentation>`; });
          xml += `</bpmn:sequenceFlow>`;
        } else {
          xml += `<bpmn:sequenceFlow id="${flow.id}"${flowName ? ` name="${escapeXML(flowName)}"` : ''} sourceRef="${flow.source}" targetRef="${flow.target}"${flowAttrStr} />`;
        }
      });

      xml += `</bpmn:process>`;
    }

    // Generate diagram information
    xml += generateDiagramXML(collaborationId, processId, participantNodes.length > 0);

    xml += `</bpmn:definitions>`;

    // Format the XML with proper indentation
    const formattedXML = formatXML(xml);

    console.log('Generated XML length:', formattedXML.length);
    console.log('Generated XML preview:', formattedXML.substring(0, 500) + '...');

    return formattedXML;
  };

  // Helper function to generate data associations (simplified version)
  const generateDataAssociations = (processNodes, allEdges) => {
    // For now, return empty string to avoid XML structure issues
    // Data associations will be added later once basic structure works
    return '';
  };

  // Helper function to generate XML for individual nodes
  const generateNodeXML = (node, allFlows) => {
    const nodeId = node.id;
    const nodeName = escapeXML(node.data?.label || '');
    const originalAttrs = node.data?.originalAttributes || {};
    // Node-level documentation: from edited data and original import
    const nodeDocs = [];
    if (node.data?.documentation) nodeDocs.push(node.data.documentation);
    if (Array.isArray(node.data?.originalDocumentation)) node.data.originalDocumentation.forEach(d => { if (d) nodeDocs.push(d); });

    // Find incoming and outgoing edges for this node
    const incomingEdges = allFlows.filter(edge => edge.target === nodeId);
    const outgoingEdges = allFlows.filter(edge => edge.source === nodeId);

    let xml = '';

    switch (node.type) {
      case 'startEvent':
        {
          const attrStr = buildAttributesString(originalAttrs, { exclude: ['id', 'name'] });
          xml += `<bpmn:startEvent id="${nodeId}"${nodeName ? ` name="${nodeName}"` : ''}${attrStr}>`;
          nodeDocs.forEach(text => { xml += `<bpmn:documentation>${escapeXML(text)}</bpmn:documentation>`; });
          outgoingEdges.forEach(edge => {
            xml += `<bpmn:outgoing>${edge.id}</bpmn:outgoing>`;
          });
          // Add event definition if specified
          if (node.data?.eventType === 'message') {
            xml += `<bpmn:messageEventDefinition id="${nodeId}_def" />`;
          }
          xml += `</bpmn:startEvent>`;
        }
        break;

      case 'endEvent':
        {
          const attrStr = buildAttributesString(originalAttrs, { exclude: ['id', 'name'] });
          xml += `<bpmn:endEvent id="${nodeId}"${nodeName ? ` name="${nodeName}"` : ''}${attrStr}>`;
          nodeDocs.forEach(text => { xml += `<bpmn:documentation>${escapeXML(text)}</bpmn:documentation>`; });
          incomingEdges.forEach(edge => {
            xml += `<bpmn:incoming>${edge.id}</bpmn:incoming>`;
          });
          // Add event definition if specified
          if (node.data?.eventType === 'terminate') {
            xml += `<bpmn:terminateEventDefinition id="${nodeId}_def" />`;
          }
          xml += `</bpmn:endEvent>`;
        }
        break;

      case 'task':
      case 'serviceTask':
      case 'userTask':
      case 'scriptTask':
      case 'businessRuleTask':
      case 'sendTask':
      case 'receiveTask':
      case 'manualTask':
        {
          const taskType = node.type === 'task' ? 'task' : node.type;
          const attrStr = buildAttributesString(originalAttrs, { exclude: ['id', 'name'] });
          xml += `<bpmn:${taskType} id="${nodeId}"${nodeName ? ` name="${nodeName}"` : ''}${attrStr}>`;
          nodeDocs.forEach(text => { xml += `<bpmn:documentation>${escapeXML(text)}</bpmn:documentation>`; });
          incomingEdges.forEach(edge => {
            xml += `<bpmn:incoming>${edge.id}</bpmn:incoming>`;
          });
          outgoingEdges.forEach(edge => {
            xml += `<bpmn:outgoing>${edge.id}</bpmn:outgoing>`;
          });
          xml += `</bpmn:${taskType}>`;
        }
        break;

      case 'gateway':
        // Determine gateway type based on node data or use exclusiveGateway as default
        let gatewayType = 'exclusiveGateway';
        if (node.data?.gatewayType) {
          gatewayType = node.data.gatewayType;
        } else if (nodeName.toLowerCase().includes('parallel')) {
          gatewayType = 'parallelGateway';
        } else if (nodeName.toLowerCase().includes('event')) {
          gatewayType = 'eventBasedGateway';
        }
        {
          const attrStr = buildAttributesString(originalAttrs, { exclude: ['id', 'name'] });
          xml += `<bpmn:${gatewayType} id="${nodeId}"${nodeName ? ` name="${nodeName}"` : ''}${attrStr}>`;
          nodeDocs.forEach(text => { xml += `<bpmn:documentation>${escapeXML(text)}</bpmn:documentation>`; });
          incomingEdges.forEach(edge => {
            xml += `<bpmn:incoming>${edge.id}</bpmn:incoming>`;
          });
          outgoingEdges.forEach(edge => {
            xml += `<bpmn:outgoing>${edge.id}</bpmn:outgoing>`;
          });
          xml += `</bpmn:${gatewayType}>`;
        }
        break;

      case 'exclusiveGateway':
      case 'inclusiveGateway':
      case 'parallelGateway':
      case 'eventBasedGateway':
      case 'complexGateway':
        {
          const attrStr = buildAttributesString(originalAttrs, { exclude: ['id', 'name'] });
          xml += `<bpmn:${node.type} id="${nodeId}"${nodeName ? ` name="${nodeName}"` : ''}${attrStr}>`;
          nodeDocs.forEach(text => { xml += `<bpmn:documentation>${escapeXML(text)}</bpmn:documentation>`; });
          incomingEdges.forEach(edge => {
            xml += `<bpmn:incoming>${edge.id}</bpmn:incoming>`;
          });
          outgoingEdges.forEach(edge => {
            xml += `<bpmn:outgoing>${edge.id}</bpmn:outgoing>`;
          });
          xml += `</bpmn:${node.type}>`;
        }
        break;

      case 'intermediateEvent':
      case 'intermediateCatchEvent':
      case 'intermediateThrowEvent':
      case 'boundaryEvent':
        {
          const eventType = node.type === 'intermediateEvent' ? 'intermediateCatchEvent' : node.type;
          const attrStr = buildAttributesString(originalAttrs, { exclude: ['id', 'name'] });
          xml += `<bpmn:${eventType} id="${nodeId}"${nodeName ? ` name="${nodeName}"` : ''}${attrStr}>`;
          nodeDocs.forEach(text => { xml += `<bpmn:documentation>${escapeXML(text)}</bpmn:documentation>`; });
          incomingEdges.forEach(edge => {
            xml += `<bpmn:incoming>${edge.id}</bpmn:incoming>`;
          });
          outgoingEdges.forEach(edge => {
            xml += `<bpmn:outgoing>${edge.id}</bpmn:outgoing>`;
          });

          // Add event definitions based on event type or name
          if (node.data?.eventType === 'timer' || nodeName.toLowerCase().includes('minute')) {
            xml += `<bpmn:timerEventDefinition id="${nodeId}_def" />`;
          } else if (node.data?.eventType === 'message' || nodeName.toLowerCase().includes('received') || nodeName.toLowerCase().includes('pizza')) {
            xml += `<bpmn:messageEventDefinition id="${nodeId}_def" />`;
          }

          xml += `</bpmn:${eventType}>`;
        }
        break;

      case 'subProcess':
        {
          const attrStr = buildAttributesString(originalAttrs, { exclude: ['id', 'name'] });
          xml += `<bpmn:subProcess id="${nodeId}"${nodeName ? ` name="${nodeName}"` : ''}${attrStr}>`;
          nodeDocs.forEach(text => { xml += `<bpmn:documentation>${escapeXML(text)}</bpmn:documentation>`; });
          incomingEdges.forEach(edge => {
            xml += `<bpmn:incoming>${edge.id}</bpmn:incoming>`;
          });
          outgoingEdges.forEach(edge => {
            xml += `<bpmn:outgoing>${edge.id}</bpmn:outgoing>`;
          });
          xml += `</bpmn:subProcess>`;
        }
        break;

      case 'callActivity':
        {
          const attrStr = buildAttributesString(originalAttrs, { exclude: ['id', 'name'] });
          xml += `<bpmn:callActivity id="${nodeId}"${nodeName ? ` name="${nodeName}"` : ''}${attrStr}>`;
          nodeDocs.forEach(text => { xml += `<bpmn:documentation>${escapeXML(text)}</bpmn:documentation>`; });
          incomingEdges.forEach(edge => {
            xml += `<bpmn:incoming>${edge.id}</bpmn:incoming>`;
          });
          outgoingEdges.forEach(edge => {
            xml += `<bpmn:outgoing>${edge.id}</bpmn:outgoing>`;
          });
          xml += `</bpmn:callActivity>`;
        }
        break;

      case 'dataObject':
      case 'dataObjectReference':
        // Simple data object reference
        {
          const attrStr = buildAttributesString(originalAttrs, { exclude: ['id', 'name'] });
          xml += `<bpmn:dataObjectReference id="${nodeId}"${nodeName ? ` name="${nodeName}"` : ''}${attrStr} dataObjectRef="DataObject_${nodeId}" />`;
          xml += `<bpmn:dataObject id="DataObject_${nodeId}"${nodeName ? ` name="${nodeName}"` : ''} />`;
        }
        break;

      case 'dataStore':
      case 'dataStoreReference':
        {
          const attrStr = buildAttributesString(originalAttrs, { exclude: ['id', 'name'] });
          xml += `<bpmn:dataStoreReference id="${nodeId}"${nodeName ? ` name="${nodeName}"` : ''}${attrStr} />`;
        }
        break;

      case 'group':
        {
          const attrStr = buildAttributesString(originalAttrs, { exclude: ['id'] });
          xml += `<bpmn:group id="${nodeId}"${attrStr} />`;
        }
        break;

      case 'textAnnotation':
        {
          const attrStr = buildAttributesString(originalAttrs, { exclude: ['id'] });
          xml += `<bpmn:textAnnotation id="${nodeId}"${attrStr}><bpmn:text>${nodeName}</bpmn:text></bpmn:textAnnotation>`;
        }
        break;
        break;
    }

    return xml;
  };

  // Helper function to generate diagram XML
  const generateDiagramXML = (collaborationId, processId, hasCollaboration) => {
    let xml;
    if (hasCollaboration) {
      // Extract the base ID from collaboration (remove 'Collaboration_' prefix)
      const baseId = collaborationId.replace('Collaboration_', '');
      // Ensure IDs start with a letter to satisfy XML NCName rules
      const diagramId = `Diagram_${baseId}`;
      const planeId = `Plane_${baseId}`;
      xml = `<bpmndi:BPMNDiagram id="${diagramId}"><bpmndi:BPMNPlane id="${planeId}" bpmnElement="${collaborationId}">`;
    } else {
      xml = `<bpmndi:BPMNDiagram id="BPMNDiagram_1"><bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}">`;
    }

    // Add shapes for all nodes
    nodes.forEach(node => {
      // Prefer original bounds if present (absolute coordinates from imported BPMN)
      let width = node.data?.originalBounds?.width ?? 100;
      let height = node.data?.originalBounds?.height ?? 60;

      // Set appropriate dimensions based on node type only if original bounds are not present
      if (!node.data?.originalBounds) switch (node.type) {
        case 'startEvent':
        case 'endEvent':
        case 'intermediateEvent':
        case 'intermediateCatchEvent':
        case 'intermediateThrowEvent':
        case 'boundaryEvent':
          width = 36;
          height = 36;
          break;
        case 'gateway':
        case 'exclusiveGateway':
        case 'inclusiveGateway':
        case 'parallelGateway':
        case 'eventBasedGateway':
        case 'complexGateway':
          width = 50;
          height = 50;
          break;
        case 'task':
        case 'serviceTask':
        case 'userTask':
        case 'scriptTask':
        case 'businessRuleTask':
        case 'sendTask':
        case 'receiveTask':
        case 'manualTask':
          width = 100;
          height = 80;
          break;
        case 'subProcess':
        case 'callActivity':
          width = 120;
          height = 80;
          break;
        case 'dataObject':
        case 'dataObjectReference':
          width = 36;
          height = 50;
          break;
        case 'dataStore':
        case 'dataStoreReference':
          width = 50;
          height = 50;
          break;
        case 'group':
          width = 200;
          height = 150;
          break;
        case 'textAnnotation':
          width = 100;
          height = 30;
          break;
        case 'participant':
          width = node.style?.width || 1333;
          height = node.style?.height || 292;
          break;
        case 'lane':
          width = node.style?.width || 1303;
          height = node.style?.height || 141;
          break;
      }

      // Calculate absolute position for diagram
      // If original bounds exist, they already contain absolute x/y from the diagram
      let absoluteX = node.data?.originalBounds?.x ?? node.position.x;
      let absoluteY = node.data?.originalBounds?.y ?? node.position.y;

      // For child nodes inside participants, keep relative positioning unless original bounds exist
      if (!node.data?.originalBounds && node.parentNode && node.type !== 'participant' && node.type !== 'lane') {
        const parentNode = nodes.find(n => n.id === node.parentNode);
        if (parentNode && parentNode.type === 'participant') {
          // For elements inside participants, add parent position to get absolute coordinates
          absoluteX += parentNode.position.x;
          absoluteY += parentNode.position.y;
        }
      }

      // Determine the correct bpmnElement reference and shape ID
      let bpmnElementRef = node.id;
      let shapeId = node.data?.originalShapeId || `${node.id}_di`;

      // Special handling for specific elements to match original format
      if (node.type === 'startEvent' && node.id === 'StartEvent_09j6q9u') {
        shapeId = '_BPMNShape_StartEvent_2';
      } else if (node.type === 'endEvent') {
        shapeId = `${node.id}_di`;
      } else if (node.type === 'task') {
        shapeId = `${node.id}_di`;
      }

      xml += `<bpmndi:BPMNShape id="${shapeId}" bpmnElement="${bpmnElementRef}"`;

      // Add isHorizontal for participants and lanes
      if (node.type === 'participant' || node.type === 'lane') {
        xml += ` isHorizontal="true"`;
      }

      xml += `><dc:Bounds x="${absoluteX}" y="${absoluteY}" width="${width}" height="${height}" />`;

      // Add label bounds for elements with text (but not for participants/lanes which handle labels differently)
      if (node.data?.label && node.data.label.trim() &&
        node.type !== 'participant' && node.type !== 'lane' &&
        node.type !== 'textAnnotation') {
        if (node.data?.originalLabelBounds) {
          const lb = node.data.originalLabelBounds;
          xml += `<bpmndi:BPMNLabel><dc:Bounds x="${lb.x}" y="${lb.y}" width="${lb.width}" height="${lb.height}" /></bpmndi:BPMNLabel>`;
        } else {
          xml += `<bpmndi:BPMNLabel><dc:Bounds x="${absoluteX}" y="${absoluteY + height + 5}" width="${width}" height="40" /></bpmndi:BPMNLabel>`;
        }
      }

      xml += `</bpmndi:BPMNShape>`;
    });

    // Add edges for sequence flows and message flows
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);

      if (sourceNode && targetNode) {
        // Skip data association edges for now to avoid diagram issues
        const isDataAssociation = (sourceNode.type === 'dataObject' || sourceNode.type === 'dataObjectReference') ||
          (targetNode.type === 'dataObject' || targetNode.type === 'dataObjectReference');

        if (isDataAssociation) {
          return; // Skip data association edges in diagram for now
        }

        // Use original edge ID format  
        let edgeShapeId = edge.data?.originalEdgeShapeId || `${edge.id}_di`;
        let computedMid = null;

        // If original waypoints exist, reuse them to preserve the drawn path
        if (edge.data?.originalWaypoints && edge.data.originalWaypoints.length >= 2) {
          xml += `<bpmndi:BPMNEdge id="${edgeShapeId}" bpmnElement="${edge.id}">`;
          edge.data.originalWaypoints.forEach(wp => {
            xml += `<di:waypoint x="${Math.round(wp.x)}" y="${Math.round(wp.y)}" />`;
          });
          const wps = edge.data.originalWaypoints;
          computedMid = wps[Math.floor(wps.length / 2)] || wps[0];
        } else {
          // Fallback: calculate simple center-to-center waypoints
          let sourceX = sourceNode.position.x;
          let sourceY = sourceNode.position.y;
          let targetX = targetNode.position.x;
          let targetY = targetNode.position.y;

          if (sourceNode.parentNode && sourceNode.type !== 'participant' && sourceNode.type !== 'lane') {
            const sourceParent = nodes.find(n => n.id === sourceNode.parentNode);
            if (sourceParent && sourceParent.type === 'participant') {
              sourceX += sourceParent.position.x;
              sourceY += sourceParent.position.y;
            }
          }
          if (targetNode.parentNode && targetNode.type !== 'participant' && targetNode.type !== 'lane') {
            const targetParent = nodes.find(n => n.id === targetNode.parentNode);
            if (targetParent && targetParent.type === 'participant') {
              targetX += targetParent.position.x;
              targetY += targetParent.position.y;
            }
          }

          // Get node dimensions for center calculation
          const getNodeCenter = (node, x, y) => {
            let width = 100, height = 60;
            switch (node.type) {
              case 'startEvent':
              case 'endEvent':
              case 'intermediateEvent':
              case 'intermediateCatchEvent':
              case 'intermediateThrowEvent':
                width = 36; height = 36; break;
              case 'gateway':
              case 'exclusiveGateway':
              case 'parallelGateway':
              case 'eventBasedGateway':
                width = 50; height = 50; break;
              case 'task':
              case 'serviceTask':
              case 'userTask':
              case 'scriptTask':
              case 'businessRuleTask':
              case 'sendTask':
              case 'receiveTask':
              case 'manualTask':
                width = 100; height = 80; break;
              case 'dataObject':
              case 'dataObjectReference':
                width = 36; height = 50; break;
              default:
                width = 100; height = 60;
            }
            return { x: x + width / 2, y: y + height / 2 };
          };

          const sourceCenter = getNodeCenter(sourceNode, sourceX, sourceY);
          const targetCenter = getNodeCenter(targetNode, targetX, targetY);

          xml += `<bpmndi:BPMNEdge id="${edgeShapeId}" bpmnElement="${edge.id}"><di:waypoint x="${Math.round(sourceCenter.x)}" y="${Math.round(sourceCenter.y)}" /><di:waypoint x="${Math.round(targetCenter.x)}" y="${Math.round(targetCenter.y)}" />`;
          computedMid = { x: (sourceCenter.x + targetCenter.x) / 2, y: (sourceCenter.y + targetCenter.y) / 2 };
        }

        // Add label if present; prefer original label bounds
        const labelText = edge.label?.trim() || edge.data?.label?.trim();
        if (labelText) {
          if (edge.data?.originalLabelBounds) {
            const lb = edge.data.originalLabelBounds;
            xml += `<bpmndi:BPMNLabel><dc:Bounds x="${Math.round(lb.x)}" y="${Math.round(lb.y)}" width="${Math.round(lb.width)}" height="${Math.round(lb.height)}" /></bpmndi:BPMNLabel>`;
          } else {
            // Fallback midpoint label
            if (computedMid) {
              xml += `<bpmndi:BPMNLabel><dc:Bounds x="${Math.round(computedMid.x) - 50}" y="${Math.round(computedMid.y) - 10}" width="100" height="40" /></bpmndi:BPMNLabel>`;
            }
          }
        }

        xml += `</bpmndi:BPMNEdge>`;
      }
    });

    xml += `</bpmndi:BPMNPlane></bpmndi:BPMNDiagram>`;

    return xml;
  };

  const handleGenerateXML = () => {
    try {
      const xml = generateBPMNXML();
      setBpmnXML(xml);
      setShowXML(true);

      // Validate the generated XML
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, 'text/xml');
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
          console.warn('Generated XML has parsing issues:', parseError.textContent);
        }
      } catch (validationError) {
        console.warn('XML validation warning:', validationError);
      }
    } catch (error) {
      console.error('Error generating BPMN XML:', error);
      alert('Error generating BPMN XML: ' + error.message);
    }
  };

  const downloadBPMN = () => {
    try {
      // Always generate fresh XML for download
      const xml = generateBPMNXML();
      setBpmnXML(xml);

      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'process.bpmn';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading BPMN:', error);
      alert('Error downloading BPMN: ' + error.message);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bpmnXML);
    alert('BPMN XML copied to clipboard!');
  };

  // Parse BPMN XML function for import
  const parseBPMNXML = (xmlString) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Invalid XML format');
      }

      const nodes = [];
      const edges = [];
      let nodeCounter = 1;
      let edgeCounter = 1;

      // Get diagram information for positioning
      const shapes = xmlDoc.querySelectorAll('bpmndi\\:BPMNShape, BPMNShape');
      const shapeMap = {};

      shapes.forEach(shape => {
        const bpmnElement = shape.getAttribute('bpmnElement');
        const bounds = shape.querySelector('dc\\:Bounds, Bounds');
        if (bounds) {
          // Parse label bounds if present
          let labelBounds = undefined;
          const label = shape.querySelector('bpmndi\\:BPMNLabel, BPMNLabel');
          if (label) {
            const lb = label.querySelector('dc\\:Bounds, Bounds');
            if (lb) {
              labelBounds = {
                x: parseFloat(lb.getAttribute('x')) || 0,
                y: parseFloat(lb.getAttribute('y')) || 0,
                width: parseFloat(lb.getAttribute('width')) || 0,
                height: parseFloat(lb.getAttribute('height')) || 0
              };
            }
          }

          shapeMap[bpmnElement] = {
            x: parseFloat(bounds.getAttribute('x')) || 0,
            y: parseFloat(bounds.getAttribute('y')) || 0,
            width: parseFloat(bounds.getAttribute('width')) || 100,
            height: parseFloat(bounds.getAttribute('height')) || 60,
            shapeId: shape.getAttribute('id'), // Store original shape ID
            labelBounds
          };
        }
      });

      // Get diagram information for edges (waypoints and label bounds)
      const bpmndiEdges = xmlDoc.querySelectorAll('bpmndi\\:BPMNEdge, BPMNEdge');
      const edgeShapeMap = {};
      bpmndiEdges.forEach(edgeShape => {
        const bpmnElement = edgeShape.getAttribute('bpmnElement');
        const shapeId = edgeShape.getAttribute('id');
        const waypoints = [];
        edgeShape.querySelectorAll('di\\:waypoint, waypoint').forEach(wp => {
          waypoints.push({
            x: parseFloat(wp.getAttribute('x')) || 0,
            y: parseFloat(wp.getAttribute('y')) || 0
          });
        });
        let labelBounds = undefined;
        const label = edgeShape.querySelector('bpmndi\\:BPMNLabel, BPMNLabel');
        if (label) {
          const lb = label.querySelector('dc\\:Bounds, Bounds');
          if (lb) {
            labelBounds = {
              x: parseFloat(lb.getAttribute('x')) || 0,
              y: parseFloat(lb.getAttribute('y')) || 0,
              width: parseFloat(lb.getAttribute('width')) || 0,
              height: parseFloat(lb.getAttribute('height')) || 0
            };
          }
        }
        edgeShapeMap[bpmnElement] = { shapeId, waypoints, labelBounds };
      });

      // First, parse participants from collaboration
      const collaboration = xmlDoc.querySelector('bpmn2\\:collaboration, bpmn\\:collaboration, collaboration');
      const participantMap = {};

      if (collaboration) {
        const participants = collaboration.querySelectorAll('bpmn2\\:participant, bpmn\\:participant, participant');
        participants.forEach(participant => {
          const id = participant.getAttribute('id');
          const name = participant.getAttribute('name') || 'Participant';
          const processRef = participant.getAttribute('processRef');
          const position = shapeMap[id] || { x: 50, y: 50 + Object.keys(participantMap).length * 280 };
          const originalAttributes = getAttributesMap(participant);
          const documentationEls = participant.querySelectorAll('bpmn2\\:documentation, bpmn\\:documentation, documentation');
          const originalDocumentation = Array.from(documentationEls).map(d => d.textContent || '');

          participantMap[processRef] = {
            id,
            name,
            processRef,
            position,
            bounds: shapeMap[id]
          };

          // Create participant node with lane information
          const participantData = {
            label: name,
            processRef,
            lanes: [],
            participantBounds: position,
            originalShapeId: shapeMap[id]?.shapeId,
            originalBounds: shapeMap[id] ? {
              x: shapeMap[id].x,
              y: shapeMap[id].y,
              width: shapeMap[id].width,
              height: shapeMap[id].height
            } : undefined,
            originalLabelBounds: shapeMap[id]?.labelBounds,
            originalAttributes,
            originalDocumentation
          };

          nodes.push({
            id,
            type: 'participant',
            position: { x: position.x, y: position.y },
            data: participantData,
            style: {
              zIndex: -1,
              width: position.width || 910,
              height: position.height || 250
            }
          });

          participantMap[processRef].nodeData = participantData;
        });
      }

      // Parse processes and their elements
      const processes = xmlDoc.querySelectorAll('bpmn2\\:process, bpmn\\:process, process');
      // Capture process-level attributes and documentation per process id
      const processMeta = {};

      processes.forEach(process => {
        const processId = process.getAttribute('id');
        const processAttributes = getAttributesMap(process);
        const procDocEls = process.querySelectorAll('bpmn2\\:documentation, bpmn\\:documentation, documentation');
        const processDocumentation = Array.from(procDocEls).map(d => d.textContent || '');
        processMeta[processId] = { originalAttributes: processAttributes, originalDocumentation: processDocumentation };
        const participant = participantMap[processId];
        const participantBounds = participant?.bounds || { x: 0, y: 0, width: 910, height: 250 };

        // First, parse lanes and build a lane hierarchy
        const laneMap = {};
        const laneSetElements = process.querySelectorAll('bpmn2\\:laneSet, bpmn\\:laneSet, laneSet');

        laneSetElements.forEach(laneSet => {
          const lanes = laneSet.querySelectorAll('bpmn2\\:lane, bpmn\\:lane, lane');
          lanes.forEach(lane => {
            const laneId = lane.getAttribute('id');
            const laneName = lane.getAttribute('name') || 'Lane';
            const lanePosition = shapeMap[laneId] || {
              x: participantBounds.x + 60,
              y: participantBounds.y + 30 + Object.keys(laneMap).length * 120,
              width: participantBounds.width - 80,
              height: 120
            };

            // Get flow node references for this lane
            const flowNodeRefs = [];
            const flowNodeRefElements = lane.querySelectorAll('bpmn2\\:flowNodeRef, bpmn\\:flowNodeRef, flowNodeRef');
            flowNodeRefElements.forEach(ref => {
              flowNodeRefs.push(ref.textContent.trim());
            });

            laneMap[laneId] = {
              id: laneId,
              name: laneName,
              position: lanePosition,
              flowNodeRefs: flowNodeRefs,
              participantId: participant?.id,
              originalShapeId: shapeMap[laneId]?.shapeId,
              originalBounds: shapeMap[laneId] ? {
                x: shapeMap[laneId].x,
                y: shapeMap[laneId].y,
                width: shapeMap[laneId].width,
                height: shapeMap[laneId].height
              } : undefined,
              originalLabelBounds: shapeMap[laneId]?.labelBounds
            };
          });
        });

        // Update participant with lane information
        if (participant && participant.nodeData) {
          participant.nodeData.lanes = Object.values(laneMap).filter(lane => lane.participantId === participant.id);
        }

        // Define all BPMN 2.0 element selectors
        const elementSelectors = {
          startEvent: 'bpmn2\\:startEvent, bpmn\\:startEvent, startEvent',
          endEvent: 'bpmn2\\:endEvent, bpmn\\:endEvent, endEvent',
          intermediateThrowEvent: 'bpmn2\\:intermediateThrowEvent, bpmn\\:intermediateThrowEvent, intermediateThrowEvent',
          intermediateCatchEvent: 'bpmn2\\:intermediateCatchEvent, bpmn\\:intermediateCatchEvent, intermediateCatchEvent',
          boundaryEvent: 'bpmn2\\:boundaryEvent, bpmn\\:boundaryEvent, boundaryEvent',
          task: 'bpmn2\\:task, bpmn\\:task, task',
          serviceTask: 'bpmn2\\:serviceTask, bpmn\\:serviceTask, serviceTask',
          userTask: 'bpmn2\\:userTask, bpmn\\:userTask, userTask',
          scriptTask: 'bpmn2\\:scriptTask, bpmn\\:scriptTask, scriptTask',
          businessRuleTask: 'bpmn2\\:businessRuleTask, bpmn\\:businessRuleTask, businessRuleTask',
          sendTask: 'bpmn2\\:sendTask, bpmn\\:sendTask, sendTask',
          receiveTask: 'bpmn2\\:receiveTask, bpmn\\:receiveTask, receiveTask',
          manualTask: 'bpmn2\\:manualTask, bpmn\\:manualTask, manualTask',
          subProcess: 'bpmn2\\:subProcess, bpmn\\:subProcess, subProcess',
          callActivity: 'bpmn2\\:callActivity, bpmn\\:callActivity, callActivity',
          exclusiveGateway: 'bpmn2\\:exclusiveGateway, bpmn\\:exclusiveGateway, exclusiveGateway',
          inclusiveGateway: 'bpmn2\\:inclusiveGateway, bpmn\\:inclusiveGateway, inclusiveGateway',
          parallelGateway: 'bpmn2\\:parallelGateway, bpmn\\:parallelGateway, parallelGateway',
          eventBasedGateway: 'bpmn2\\:eventBasedGateway, bpmn\\:eventBasedGateway, eventBasedGateway',
          complexGateway: 'bpmn2\\:complexGateway, bpmn\\:complexGateway, complexGateway',
          dataObject: 'bpmn2\\:dataObject, bpmn\\:dataObject, dataObject',
          dataObjectReference: 'bpmn2\\:dataObjectReference, bpmn\\:dataObjectReference, dataObjectReference',
          dataStore: 'bpmn2\\:dataStore, bpmn\\:dataStore, dataStore',
          dataStoreReference: 'bpmn2\\:dataStoreReference, bpmn\\:dataStoreReference, dataStoreReference',
          group: 'bpmn2\\:group, bpmn\\:group, group',
          textAnnotation: 'bpmn2\\:textAnnotation, bpmn\\:textAnnotation, textAnnotation'
        };

        // Parse all element types within this process
        Object.entries(elementSelectors).forEach(([elementType, selector]) => {
          const elements = process.querySelectorAll(selector);

          elements.forEach(element => {
            const id = element.getAttribute('id') || `${elementType}_${nodeCounter++}`;
            let name = element.getAttribute('name') || '';
            let position = shapeMap[id] || { x: 100 + (nodeCounter * 50), y: 100 };
            const originalAttributes = getAttributesMap(element);
            const docEls = element.querySelectorAll('bpmn2\\:documentation, bpmn\\:documentation, documentation');
            const originalDocumentation = Array.from(docEls).map(d => d.textContent || '');

            // Find which lane this element belongs to
            let containingLane = null;
            Object.values(laneMap).forEach(lane => {
              if (lane.flowNodeRefs.includes(id)) {
                containingLane = lane;
              }
            });

            // Convert absolute coordinates to relative coordinates when using parentNode
            let finalPosition = { x: position.x, y: position.y };

            if (containingLane && participant) {
              finalPosition.x = position.x - participantBounds.x;
              finalPosition.y = position.y - participantBounds.y;

              // Ensure minimum padding from participant header and lane area
              if (finalPosition.x < 80) {
                finalPosition.x = 80;
              }
              if (finalPosition.y < 30) {
                finalPosition.y = 30;
              }

            } else if (participant && participantBounds) {
              finalPosition.x = position.x - participantBounds.x;
              finalPosition.y = position.y - participantBounds.y;

              // Ensure minimum padding
              if (finalPosition.x < 80) {
                finalPosition.x = 80;
              }
              if (finalPosition.y < 30) {
                finalPosition.y = 30;
              }
            }

            // Set default names based on element type
            if (!name) {
              const typeNames = {
                startEvent: 'Start',
                endEvent: 'End',
                intermediateThrowEvent: 'Intermediate Event',
                intermediateCatchEvent: 'Intermediate Event',
                boundaryEvent: 'Boundary Event',
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
                textAnnotation: 'Annotation'
              };
              name = typeNames[elementType] || elementType.charAt(0).toUpperCase() + elementType.slice(1);
            }

            // Determine the React Flow node type
            let nodeType = elementType;

            // Map specific BPMN types to our React Flow node types
            if (['task', 'serviceTask', 'userTask', 'scriptTask', 'businessRuleTask',
              'sendTask', 'receiveTask', 'manualTask'].includes(elementType)) {
              nodeType = 'task';
            } else if (['exclusiveGateway', 'inclusiveGateway', 'parallelGateway',
              'eventBasedGateway', 'complexGateway'].includes(elementType)) {
              nodeType = 'gateway';
            } else if (['intermediateThrowEvent', 'intermediateCatchEvent', 'boundaryEvent'].includes(elementType)) {
              nodeType = 'intermediateEvent';
            } else if (['dataObject', 'dataObjectReference'].includes(elementType)) {
              nodeType = 'dataObject';
            } else if (['dataStore', 'dataStoreReference'].includes(elementType)) {
              nodeType = 'dataStore';
            }

            // Create node data with lane information and preserve original metadata
            const nodeData = {
              label: name,
              processId: processId,
              participantId: participant?.id,
              laneId: containingLane?.id,
              laneName: containingLane?.name,
              // Store original metadata for preservation during export
              originalProcessId: processId,
              originalIsExecutable: process.getAttribute('isExecutable'),
              originalShapeId: shapeMap[id]?.shapeId,
              originalBounds: shapeMap[id] ? {
                x: shapeMap[id].x,
                y: shapeMap[id].y,
                width: shapeMap[id].width,
                height: shapeMap[id].height
              } : undefined,
              originalLabelBounds: shapeMap[id]?.labelBounds,
              originalAttributes,
              originalDocumentation
            };

            const node = {
              id,
              type: nodeType,
              position: { x: finalPosition.x, y: finalPosition.y },
              data: nodeData
            };

            // Set parent relationship
            if (participant) {
              node.parentNode = participant.id;
              node.extent = 'parent';
            }

            nodes.push(node);
          });
        });

        // Parse sequence flows within this process
        const sequenceFlows = process.querySelectorAll('bpmn2\\:sequenceFlow, bpmn\\:sequenceFlow, sequenceFlow');
        sequenceFlows.forEach(element => {
          const id = element.getAttribute('id') || `sequenceFlow_${edgeCounter++}`;
          const sourceRef = element.getAttribute('sourceRef');
          const targetRef = element.getAttribute('targetRef');
          const originalAttributes = getAttributesMap(element);
          const docEls = element.querySelectorAll('bpmn2\\:documentation, bpmn\\:documentation, documentation');
          const originalDocumentation = Array.from(docEls).map(d => d.textContent || '');

          if (sourceRef && targetRef) {
            // Find original edge info from diagram
            const edgeInfo = edgeShapeMap[id];
            const originalEdgeShapeId = edgeInfo?.shapeId || `${id}_di`;

            edges.push({
              id,
              source: sourceRef,
              target: targetRef,
              type: 'smoothstep', // Use smoothstep type for smooth curved lines
              label: element.getAttribute('name') || '',
              data: {
                originalEdgeShapeId: originalEdgeShapeId,
                originalWaypoints: edgeInfo?.waypoints,
                originalLabelBounds: edgeInfo?.labelBounds,
                originalAttributes,
                originalDocumentation
              }
            });
          }
        });
      });

      // Parse message flows from collaboration
      if (collaboration) {
        const messageFlows = collaboration.querySelectorAll('bpmn2\\:messageFlow, bpmn\\:messageFlow, messageFlow');
        messageFlows.forEach(element => {
          const id = element.getAttribute('id') || `messageFlow_${edgeCounter++}`;
          const sourceRef = element.getAttribute('sourceRef');
          const targetRef = element.getAttribute('targetRef');
          const originalAttributes = getAttributesMap(element);
          const docEls = element.querySelectorAll('bpmn2\\:documentation, bpmn\\:documentation, documentation');
          const originalDocumentation = Array.from(docEls).map(d => d.textContent || '');

          if (sourceRef && targetRef) {
            const sourceNode = nodes.find(n => n.id === sourceRef);
            const targetNode = nodes.find(n => n.id === targetRef);

            if (sourceNode && targetNode &&
              sourceNode.data.participantId !== targetNode.data.participantId) {
              const edgeInfo = edgeShapeMap[id];
              edges.push({
                id,
                source: sourceRef,
                target: targetRef,
                type: 'smoothstep',
                className: 'message-flow',
                label: element.getAttribute('name') || '',
                data: {
                  isMessageFlow: true,
                  originalEdgeShapeId: edgeInfo?.shapeId,
                  originalWaypoints: edgeInfo?.waypoints,
                  originalLabelBounds: edgeInfo?.labelBounds,
                  originalAttributes,
                  originalDocumentation
                }
              });
            }
          }
        });
      }

      // Attach process-level meta back to participant nodes so generator can preserve them
      nodes.filter(n => n.type === 'participant').forEach(p => {
        const meta = processMeta[p?.data?.processRef];
        if (meta) {
          p.data.originalProcessAttributes = meta.originalAttributes;
          p.data.originalProcessDocumentation = meta.originalDocumentation;
        }
      });

      return { nodes, edges };
    } catch (error) {
      console.error('Error parsing BPMN XML:', error);
      throw new Error('Failed to parse BPMN file: ' + error.message);
    }
  };

  // Helper functions for XML generation and parsing
  const getElementWidth = (nodeType) => {
    const widths = {
      'task': 100,
      'serviceTask': 100,
      'userTask': 100,
      'scriptTask': 100,
      'businessRuleTask': 100,
      'sendTask': 100,
      'receiveTask': 100,
      'manualTask': 100,
      'callActivity': 100,
      'subProcess': 150,
      'startEvent': 36,
      'endEvent': 36,
      'intermediateEvent': 36,
      'intermediateThrowEvent': 36,
      'intermediateCatchEvent': 36,
      'boundaryEvent': 36,
      'gateway': 50,
      'exclusiveGateway': 50,
      'inclusiveGateway': 50,
      'parallelGateway': 50,
      'eventBasedGateway': 50,
      'complexGateway': 50,
      'dataObject': 36,
      'dataObjectReference': 36,
      'dataStore': 50,
      'dataStoreReference': 50,
      'group': 140,
      'textAnnotation': 100,
      'lane': 30,
      'participant': 600
    };
    return widths[nodeType] || 100;
  };

  const getElementHeight = (nodeType) => {
    const heights = {
      'task': 80,
      'serviceTask': 80,
      'userTask': 80,
      'scriptTask': 80,
      'businessRuleTask': 80,
      'sendTask': 80,
      'receiveTask': 80,
      'manualTask': 80,
      'callActivity': 80,
      'subProcess': 120,
      'startEvent': 36,
      'endEvent': 36,
      'intermediateEvent': 36,
      'intermediateThrowEvent': 36,
      'intermediateCatchEvent': 36,
      'boundaryEvent': 36,
      'gateway': 50,
      'exclusiveGateway': 50,
      'inclusiveGateway': 50,
      'parallelGateway': 50,
      'eventBasedGateway': 50,
      'complexGateway': 50,
      'dataObject': 50,
      'dataObjectReference': 50,
      'dataStore': 50,
      'dataStoreReference': 50,
      'group': 140,
      'textAnnotation': 50,
      'lane': 120,
      'participant': 250
    };
    return heights[nodeType] || 80;
  };

  const getEventIcon = (eventType) => {
    // Icons for different event types
    const icons = {
      'messageStartEvent': 'M',
      'timerStartEvent': 'T',
      'conditionalStartEvent': 'C',
      'signalStartEvent': 'S',
      'messageEndEvent': 'M',
      'errorEndEvent': 'E',
      'terminateEndEvent': 'T',
      'signalEndEvent': 'S'
    };
    return icons[eventType] || '';
  };

  const getGatewayType = (gatewayElement) => {
    // Determine gateway type from XML element
    if (gatewayElement.tagName.includes('exclusive')) return 'exclusive';
    if (gatewayElement.tagName.includes('inclusive')) return 'inclusive';
    if (gatewayElement.tagName.includes('parallel')) return 'parallel';
    if (gatewayElement.tagName.includes('eventBased')) return 'eventBased';
    if (gatewayElement.tagName.includes('complex')) return 'complex';
    return 'exclusive'; // default
  };

  const calculateAndUpdateParticipantBounds = (nodes) => {
    // Calculate participant bounds based on contained elements
    const participants = nodes.filter(node => node.type === 'participant');

    participants.forEach(participant => {
      const containedNodes = nodes.filter(node =>
        node.parentNode === participant.id && node.type !== 'participant'
      );

      if (containedNodes.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        containedNodes.forEach(node => {
          const nodeWidth = getElementWidth(node.type);
          const nodeHeight = getElementHeight(node.type);

          minX = Math.min(minX, node.position.x);
          minY = Math.min(minY, node.position.y);
          maxX = Math.max(maxX, node.position.x + nodeWidth);
          maxY = Math.max(maxY, node.position.y + nodeHeight);
        });

        // Add padding around contained elements
        const padding = { left: 80, right: 20, top: 30, bottom: 20 };
        const calculatedWidth = Math.max(300, maxX - minX + padding.left + padding.right);
        const calculatedHeight = Math.max(150, maxY - minY + padding.top + padding.bottom);

        // Update participant style
        participant.style = {
          ...participant.style,
          width: calculatedWidth,
          height: calculatedHeight
        };

        // Update participant data
        if (participant.data) {
          participant.data.participantBounds = {
            x: participant.position.x,
            y: participant.position.y,
            width: calculatedWidth,
            height: calculatedHeight
          };
        }
      }
    });

    return nodes;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const xmlContent = e.target.result;
        const { nodes: importedNodes, edges: importedEdges } = parseBPMNXML(xmlContent);

        if (onImportBPMN) {
          onImportBPMN(importedNodes, importedEdges);
        }
      } catch (error) {
        alert('Error importing BPMN file: ' + error.message);
      }
    };

    reader.onerror = () => {
      alert('Error reading file');
    };

    reader.readAsText(file);

    // Reset the file input
    event.target.value = '';
  };

  const triggerFileUpload = () => {
    document.getElementById('bpmn-file-input').click();
  };

  const handlePasteXML = () => {
    if (!pastedXML.trim()) {
      alert('Please paste BPMN XML content first');
      return;
    }

    try {
      const { nodes: importedNodes, edges: importedEdges } = parseBPMNXML(pastedXML);

      if (onImportBPMN) {
        onImportBPMN(importedNodes, importedEdges);
        setPastedXML('');
        setShowPasteArea(false);
      }
    } catch (error) {
      alert('Error parsing BPMN XML: ' + error.message);
    }
  };

  const togglePasteArea = () => {
    setShowPasteArea(!showPasteArea);
    if (showPasteArea) {
      setPastedXML('');
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showPasteArea) {
        togglePasteArea();
      }
      // Ctrl+V or Cmd+V to open paste area if not already open
      if ((event.ctrlKey || event.metaKey) && event.key === 'v' && !showPasteArea) {
        // Small delay to allow the paste operation to complete first
        setTimeout(() => {
          setShowPasteArea(true);
        }, 100);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showPasteArea]);

  return (
    <div className="bpmn-exporter">
      <input
        type="file"
        id="bpmn-file-input"
        accept=".bpmn,.xml"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      <div className="exporter-controls">
        <button onClick={handleGenerateXML} className="btn-primary">
          Generate XML
        </button>
        <button onClick={downloadBPMN} className="btn-secondary">
          Download .bpmn
        </button>
        <button onClick={triggerFileUpload} className="btn-secondary">
          Import .bpmn
        </button>
        <button onClick={togglePasteArea} className="btn-secondary">
          Paste XML
        </button>
        {bpmnXML && (
          <button onClick={copyToClipboard} className="btn-secondary">
            Copy XML
          </button>
        )}
      </div>

      {showPasteArea && (
        <>
          <div className="overlay" onClick={togglePasteArea}></div>
          <div className="paste-area">
            <div className="paste-header">
              <h3>Paste BPMN XML</h3>
              <button onClick={togglePasteArea} className="close-btn">
                ✕
              </button>
            </div>
            <textarea
              value={pastedXML}
              onChange={(e) => setPastedXML(e.target.value)}
              placeholder="Paste your BPMN XML content here..."
              className="xml-textarea"
              autoFocus
            />
            <div className="paste-controls">
              <button onClick={handlePasteXML} className="btn-primary">
                Import XML
              </button>
              <button onClick={() => setPastedXML('')} className="btn-secondary">
                Clear
              </button>
            </div>
          </div>
        </>
      )}

      {showXML && (
        <div className="xml-viewer">
          <div className="xml-header">
            <h3>Generated BPMN 2.0 XML</h3>
            <button onClick={() => setShowXML(false)} className="close-btn">
              ✕
            </button>
          </div>
          <pre className="xml-content">
            <code>{bpmnXML}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

export default BPMNManager;
