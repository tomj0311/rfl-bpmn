import React from 'react';
import BPMN from './bpmn/BPMN';
import './App.css';

function App() {
  const handleThemeChange = (theme) => {
    // Optional: Handle theme changes at the app level
    console.log('BPMN theme changed to:', theme);
  };

  return (
    <div className="App">
      <BPMN 
        initialTheme="auto" 
        onThemeChange={handleThemeChange}
      />
    </div>
  );
}

export default App;
