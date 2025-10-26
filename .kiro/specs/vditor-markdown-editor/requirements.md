# Vditor Markdown Editor v1.1 - Requirements Document

## Introduction

This document defines the requirements for the Vditor-based Markdown note type implementation in Trilium Notes. The feature provides users with a rich, modern Markdown editing experience using the Vditor editor library, supporting real-time preview, syntax highlighting, and seamless integration with Trilium's note management system.

## Glossary

- **Vditor**: A modern WYSIWYG Markdown editor library that supports instant rendering mode
- **Trilium_System**: The main Trilium Notes application
- **Markdown_Editor**: The Vditor-based editing component for markdown notes
- **Note_Context**: The current note being edited and its associated metadata
- **Auto_Save**: Automatic saving mechanism that prevents data loss
- **Read_Only_Mode**: A state where the editor is disabled for viewing only

## Requirements

### Requirement 1: Core Markdown Editing

**User Story:** As a user, I want to create and edit markdown notes with a modern editor interface, so that I can write formatted content efficiently.

#### Acceptance Criteria

1. WHEN a user creates a new note of type "markdown", THE Trilium_System SHALL initialize the Vditor editor with default configuration
2. WHEN a user types markdown content, THE Markdown_Editor SHALL provide instant rendering preview
3. WHEN a user switches between edit modes, THE Markdown_Editor SHALL maintain content integrity
4. THE Markdown_Editor SHALL support standard markdown syntax including headers, lists, links, images, and code blocks
5. THE Markdown_Editor SHALL provide a toolbar with common formatting options

### Requirement 2: Note Content Management

**User Story:** As a user, I want my markdown content to be automatically saved and properly loaded, so that I don't lose my work.

#### Acceptance Criteria

1. WHEN a user modifies content in the editor, THE Auto_Save SHALL trigger after a brief delay
2. WHEN a user switches to a different markdown note, THE Markdown_Editor SHALL load the new note's content
3. WHEN a user switches to a non-markdown note, THE Markdown_Editor SHALL be hidden and cleaned up
4. THE Trilium_System SHALL store markdown content with MIME type "text/markdown"
5. WHEN content loading fails, THE Markdown_Editor SHALL handle errors gracefully and retry initialization

### Requirement 3: Editor State Management

**User Story:** As a user, I want the editor to properly handle different note states and transitions, so that the interface behaves predictably.

#### Acceptance Criteria

1. WHEN a note is in read-only mode, THE Markdown_Editor SHALL disable editing capabilities
2. WHEN switching between notes, THE Markdown_Editor SHALL properly clean up previous instances
3. WHEN the editor fails to initialize, THE Trilium_System SHALL attempt recovery or show appropriate error messages
4. THE Markdown_Editor SHALL maintain proper focus management when switching between notes
5. WHEN the application theme changes, THE Markdown_Editor SHALL update its appearance accordingly

### Requirement 4: Integration with Trilium Features

**User Story:** As a user, I want the markdown editor to work seamlessly with Trilium's existing features, so that I have a consistent experience.

#### Acceptance Criteria

1. THE Markdown_Editor SHALL integrate with Trilium's search functionality for markdown content
2. THE Markdown_Editor SHALL support Trilium's protected notes encryption
3. THE Markdown_Editor SHALL work with Trilium's note export and import features
4. THE Markdown_Editor SHALL respect Trilium's database readonly mode
5. THE Markdown_Editor SHALL support keyboard shortcuts consistent with other note types

### Requirement 5: Performance and Reliability

**User Story:** As a user, I want the markdown editor to be fast and reliable, so that I can work efficiently without interruptions.

#### Acceptance Criteria

1. THE Markdown_Editor SHALL initialize within 2 seconds under normal conditions
2. WHEN editor initialization fails, THE Trilium_System SHALL retry up to 3 times before showing an error
3. THE Markdown_Editor SHALL handle large documents (up to 1MB) without performance degradation
4. THE Auto_Save SHALL not trigger more frequently than once every 500ms to prevent performance issues
5. THE Markdown_Editor SHALL properly dispose of resources when switching away from markdown notes

### Requirement 6: User Experience

**User Story:** As a user, I want an intuitive and responsive markdown editing experience, so that I can focus on content creation.

#### Acceptance Criteria

1. THE Markdown_Editor SHALL provide visual feedback during content loading and saving
2. THE Markdown_Editor SHALL support both light and dark themes automatically
3. THE Markdown_Editor SHALL provide appropriate cursor positioning when loading content
4. THE Markdown_Editor SHALL support standard text editing shortcuts (Ctrl+Z, Ctrl+Y, etc.)
5. WHEN content is being saved, THE Markdown_Editor SHALL not interfere with user typing

## Version 1.1 Specific Features

This version (v1.1) includes the following key improvements:

- **Robust Initialization**: Enhanced Vditor initialization with proper async handling and retry mechanisms
- **Safe Content Setting**: Implementation of `safeSetValue()` method to prevent timing-related errors
- **Improved Error Handling**: Better error recovery and user feedback for initialization failures
- **Theme Integration**: Automatic theme detection and application for consistent UI experience
- **Performance Optimization**: Optimized toolbar configuration and reduced initialization overhead

## Success Criteria

The implementation is considered successful when:

1. Users can create, edit, and save markdown notes without errors
2. The editor properly handles note switching and cleanup
3. All markdown formatting features work as expected
4. The editor integrates seamlessly with Trilium's existing features
5. Performance meets the specified requirements
6. Error handling provides appropriate user feedback and recovery options