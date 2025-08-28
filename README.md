# BPMN Modeller

A modern, web-based BPMN (Business Process Model and Notation) editor built with React and React Flow.

## Features

### 🎨 Dark & Light Theme Support
The BPMN modeller now features complete dark and light theme support with:

- **Theme Toggle Button**: Located at the top of the toolbar for easy switching
- **Persistent Theme**: Your theme preference is automatically saved to localStorage
- **Smooth Transitions**: All UI elements smoothly transition between themes
- **Comprehensive Coverage**: All components support both themes including:
  - Main editor interface
  - Toolbar and icons
  - Node elements and connections
  - Control panels and dialogs
  - Export and import interfaces

### 🛠️ BPMN Elements
- **Events**: Start, End, and Intermediate Events
- **Tasks**: User Task, Service Task, Script Task, Manual Task, etc.
- **Gateways**: Exclusive, Inclusive, Parallel, and Event-based Gateways
- **Data Objects**: Data Objects and Data Stores
- **Structural Elements**: Participants, Lanes, Groups, Text Annotations
- **Advanced**: Sub-processes and Call Activities

### 📁 Import/Export
- Export BPMN diagrams as XML
- Import existing BPMN XML files
- Visual XML viewer with syntax highlighting

### 🏊‍♀️ Participant & Lane Management
- Interactive participant panel
- Create and manage participants
- Add lanes to participants
- Template-based quick setup

## Usage

### Theme Switching
1. Look for the theme toggle button at the top of the left toolbar
2. Click the button to switch between light and dark themes
3. The sun icon indicates light mode, the moon icon indicates dark mode
4. Your preference will be remembered for future sessions

### Creating BPMN Diagrams
1. Drag elements from the toolbar to the canvas
2. Connect elements by dragging from connection points
3. Double-click elements to edit properties
4. Use the participant panel to add organizational structure

### Keyboard Shortcuts
- `Delete`: Remove selected elements
- `Ctrl+Z`: Undo (if implemented)
- `Ctrl+Y`: Redo (if implemented)

## Technical Implementation

### Theme System
The theme system is built using CSS custom properties (variables) with:

```css
:root {
  /* Light theme variables */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #212529;
  --accent-color: #1976d2;
  /* ... more variables */
}

[data-theme="dark"] {
  /* Dark theme overrides */
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #e0e0e0;
  --accent-color: #4a9eff;
  /* ... more variables */
}
```

### Browser Compatibility
- Uses modern CSS features like `color-mix()` with fallbacks
- Graceful degradation for older browsers
- Tested on Chrome, Firefox, Safari, and Edge

## Development

### Prerequisites
- Node.js 16 or higher
- npm or yarn

### Getting Started
```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Project Structure
```
src/
├── components/
│   ├── BPMNEditor.jsx       # Main editor component
│   ├── Toolbar.jsx          # Element toolbar with theme toggle
│   ├── ParticipationPanel.jsx # Participant management
│   ├── BPMNExporter.jsx     # Export/import functionality
│   └── nodes/               # Individual BPMN node components
├── App.jsx                  # Root component with theme state
├── App.css                  # Global theme variables
└── index.css                # Base styles
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Changelog

### v1.1.0 - Theme Support
- ✨ Added complete dark and light theme support
- 🎨 Implemented theme toggle button in toolbar
- 💾 Added persistent theme preferences with localStorage
- 🔄 Added smooth transitions between themes
- 🖼️ Updated all components and icons for theme compatibility
- 📚 Enhanced documentation with theme usage instructions

### v1.0.0 - Initial Release
- 🎯 Basic BPMN modeling capabilities
- 📊 Element library with events, tasks, gateways
- 🏗️ Participant and lane management
- 📤 XML export and import functionality
