# Theme Implementation Demo

This document demonstrates the dark and light theme implementation for the BPMN modeller.

## How to Test the Theme Functionality

1. **Open the Application**: Navigate to `http://localhost:3001` (or your local development URL)

2. **Locate the Theme Toggle**: Look for the theme toggle button at the top of the left toolbar:
   - In light mode: Shows a sun icon ☀️
   - In dark mode: Shows a moon icon 🌙

3. **Switch Themes**: Click the toggle button to switch between themes

4. **Observe Changes**: Notice how all elements smoothly transition:
   - Background colors
   - Text colors
   - Border colors
   - Icon colors
   - Button styles

## Theme Features

### Automatic Persistence
- Your theme preference is automatically saved to browser localStorage
- The theme will persist across browser sessions
- The theme is applied immediately on page load

### Smooth Transitions
- All color changes use CSS transitions for smooth visual effects
- Transition duration: 0.3 seconds for optimal user experience

### Comprehensive Coverage
The theme system affects:
- ✅ Main editor background
- ✅ Toolbar and all tool icons
- ✅ BPMN node elements
- ✅ React Flow controls (zoom, minimap)
- ✅ Participant panel
- ✅ Export/import dialogs
- ✅ Form elements and inputs
- ✅ Scrollbars
- ✅ Tooltips and hover effects

### Browser Compatibility
- Uses modern CSS features with fallbacks
- `color-mix()` function for advanced color blending with hex fallbacks
- CSS custom properties (variables) for theme management
- Graceful degradation for older browsers

## Technical Details

### Theme State Management
```javascript
// App.jsx
const [isDarkMode, setIsDarkMode] = useState(false);

// Load from localStorage
useEffect(() => {
  const savedTheme = localStorage.getItem('bpmn-theme');
  if (savedTheme === 'dark') {
    setIsDarkMode(true);
  }
}, []);

// Save to localStorage and apply to DOM
useEffect(() => {
  localStorage.setItem('bpmn-theme', isDarkMode ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
}, [isDarkMode]);
```

### CSS Variable System
```css
:root {
  --bg-primary: #ffffff;    /* Light theme default */
  --text-primary: #212529;
  --accent-color: #1976d2;
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;    /* Dark theme override */
  --text-primary: #e0e0e0;
  --accent-color: #4a9eff;
}
```

### Component Integration
```jsx
// Toolbar.jsx
const Toolbar = ({ isDarkMode, onToggleTheme }) => {
  return (
    <div className="toolbar">
      <button onClick={onToggleTheme}>
        {isDarkMode ? <MoonIcon /> : <SunIcon />}
      </button>
      {/* ... rest of toolbar */}
    </div>
  );
};
```

## Testing Checklist

- [ ] Theme toggle button is visible and functional
- [ ] Theme persists after page refresh
- [ ] All toolbar icons adapt to theme
- [ ] BPMN elements are visible in both themes
- [ ] Text remains readable in both themes
- [ ] Controls and panels adapt correctly
- [ ] Export/import dialogs follow theme
- [ ] Smooth transitions work on all elements
- [ ] Browser localStorage stores preference correctly

## Accessibility

The theme implementation considers accessibility:
- High contrast ratios maintained in both themes
- Clear visual distinction between interactive elements
- Consistent color semantics across themes
- Proper focus indicators that work in both themes

## Performance

- CSS custom properties provide efficient theme switching
- No JavaScript color calculations required
- Minimal impact on rendering performance
- Smooth transitions without layout shifts
