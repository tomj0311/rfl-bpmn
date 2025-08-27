// Test script to verify BPMN export functionality
import { generateBPMNXML } from '../src/components/BPMNExporter.jsx';

// Test data - simulate a process with start, task, data object, and end
const testNodes = [
  {
    id: 'StartEvent_1',
    type: 'startEvent',
    position: { x: 150, y: 100 },
    data: { label: 'Start' }
  },
  {
    id: 'ServiceTask_ApiCall',
    type: 'serviceTask',
    position: { x: 250, y: 80 },
    data: { label: 'Call External API' }
  },
  {
    id: 'ApiResponse',
    type: 'dataObject',
    position: { x: 300, y: 200 },
    data: { label: 'ApiResponse' }
  },
  {
    id: 'ScriptTask_PrintResult',
    type: 'scriptTask',
    position: { x: 380, y: 80 },
    data: { label: 'Print API Result' }
  },
  {
    id: 'EndEvent_1',
    type: 'endEvent',
    position: { x: 510, y: 100 },
    data: { label: 'End' }
  }
];

const testEdges = [
  {
    id: 'Flow_1',
    source: 'StartEvent_1',
    target: 'ServiceTask_ApiCall',
    type: 'smoothstep'
  },
  {
    id: 'Flow_2',
    source: 'ServiceTask_ApiCall',
    target: 'ScriptTask_PrintResult',
    type: 'smoothstep'
  },
  {
    id: 'Flow_3',
    source: 'ScriptTask_PrintResult',
    target: 'EndEvent_1',
    type: 'smoothstep'
  },
  // Data association edges
  {
    id: 'DataFlow_1',
    source: 'ServiceTask_ApiCall',
    target: 'ApiResponse',
    type: 'smoothstep'
  },
  {
    id: 'DataFlow_2',
    source: 'ApiResponse',
    target: 'ScriptTask_PrintResult',
    type: 'smoothstep'
  }
];

console.log('Test nodes:', testNodes);
console.log('Test edges:', testEdges);
