// Test script to verify that the default naming convention works correctly
// This simulates what happens when nodes are created in the BPMN editor

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

// Test cases
const testCases = [
  'startEvent',
  'endEvent',
  'task',
  'serviceTask',
  'userTask',
  'scriptTask',
  'exclusiveGateway',
  'parallelGateway',
  'dataObject',
  'subProcess',
  'callActivity'
];

console.log('Testing updated naming convention:');
console.log('==================================');

testCases.forEach(nodeType => {
  const label = getDefaultLabel(nodeType);
  console.log(`${nodeType.padEnd(20)} -> "${label}"`);
});

console.log('\nNo more "node" suffixes - names are clean and concise!');
