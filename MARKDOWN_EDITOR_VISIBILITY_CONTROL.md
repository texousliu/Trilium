# Markdown Editor Visibility Control

## Overview
This document describes the implementation of CSS-based visibility control for the Toast UI Editor container, allowing smooth transitions between hidden and visible states.

## Problem Solved
Previously, the editor container was manually positioned off-screen using inline styles, which made it difficult to manage visibility states and could cause layout issues.

## Solution: CSS Class-Based Visibility Control

### CSS Classes Added

```css
/* 编辑器容器显示/隐藏控制 */
.markdown-editor-hidden {
    position: absolute !important;
    left: -9999px !important;
    top: -9999px !important;
    width: 100px !important;
    height: 100px !important;
    visibility: hidden !important;
    opacity: 0 !important;
}

.markdown-editor-visible {
    position: relative !important;
    left: auto !important;
    top: auto !important;
    width: 100% !important;
    height: 100% !important;
    visibility: visible !important;
    opacity: 1 !important;
}
```

### Implementation Changes

#### 1. Container Creation (Hidden State)
```typescript
// 创建容器时使用隐藏类
this.editorContainer = document.createElement('div');
this.editorContainer.id = 'toast-md-editor';
this.editorContainer.className = 'markdown-editor-hidden';
document.body.appendChild(this.editorContainer);
```

#### 2. Attach to Container (Show)
```typescript
// 附加到目标容器时切换到显示状态
editorElement.className = 'markdown-editor-visible';
container.appendChild(editorElement);
```

#### 3. Detach from Container (Hide)
```typescript
// 分离时切换到隐藏状态并移回 body
this.editorContainer.className = 'markdown-editor-hidden';
this.currentContainer.removeChild(this.editorContainer);
document.body.appendChild(this.editorContainer);
```

## Benefits

### 1. Clean State Management
- **Clear Visibility States**: Explicit hidden/visible classes
- **Consistent Behavior**: Predictable visibility transitions
- **Easy Debugging**: CSS classes are visible in DevTools

### 2. Better Performance
- **No Inline Style Manipulation**: Avoids repeated style calculations
- **CSS Optimization**: Browser can optimize class-based styling
- **Smooth Transitions**: Potential for CSS animations in the future

### 3. Maintainability
- **Centralized Styling**: All visibility logic in CSS
- **Easy Modifications**: Change visibility behavior by updating CSS
- **Consistent Approach**: Same pattern can be used for other components

### 4. Layout Stability
- **Proper Positioning**: Uses CSS best practices for off-screen positioning
- **No Layout Shifts**: Hidden elements don't affect page layout
- **Responsive Design**: Visible state adapts to container dimensions

## Workflow

### Initialization
1. Create editor container with `markdown-editor-hidden` class
2. Append to document.body (hidden off-screen)
3. Initialize Toast UI Editor in hidden container
4. Container remains in body but invisible

### Note Switching
1. **Attach**: Change class to `markdown-editor-visible`, move to target container
2. **Update Content**: Set new note content
3. **Detach**: Change class to `markdown-editor-hidden`, move back to body

### Cleanup
1. Destroy editor instance
2. Remove container from DOM
3. Clear all references

## CSS Properties Explained

### Hidden State
- `position: absolute`: Remove from normal document flow
- `left: -9999px`: Position far off-screen (left)
- `top: -9999px`: Position far off-screen (top)
- `width/height: 100px`: Minimal dimensions for editor functionality
- `visibility: hidden`: Hide from screen readers and interactions
- `opacity: 0`: Make completely transparent

### Visible State
- `position: relative`: Normal positioning within container
- `left/top: auto`: Reset positioning to natural flow
- `width/height: 100%`: Fill entire container
- `visibility: visible`: Make accessible to screen readers
- `opacity: 1`: Make fully opaque

## Future Enhancements

### Possible Improvements
1. **CSS Transitions**: Smooth fade in/out animations
2. **Loading States**: Visual feedback during editor initialization
3. **Responsive Breakpoints**: Different visibility rules for mobile
4. **Theme Integration**: Visibility states that adapt to themes

### Example CSS Transitions
```css
.markdown-editor-visible {
    transition: opacity 0.3s ease-in-out;
}

.markdown-editor-hidden {
    transition: opacity 0.3s ease-in-out;
}
```

This CSS-based approach provides a robust, maintainable solution for managing editor visibility while maintaining optimal performance and user experience.