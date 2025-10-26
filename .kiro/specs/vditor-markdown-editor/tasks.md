# Implementation Plan

- [ ] 1. Set up project dependencies and type definitions
  - Add vditor dependency to client package.json
  - Create TypeScript type definitions for vditor integration
  - Configure build system to handle vditor assets
  - _Requirements: 1.1, 1.4_

- [ ] 2. Implement server-side note type registration
  - [ ] 2.1 Register markdown note type in server note_types.ts
    - Add "markdown" type with "text/markdown" MIME type
    - Update server-side note type validation
    - _Requirements: 2.4_

  - [ ] 2.2 Update server-side note entity icons
    - Add markdown icon mapping in bnote.ts
    - Ensure consistent icon representation across server components
    - _Requirements: 1.1_

  - [ ] 2.3 Integrate markdown content with search functionality
    - Update search expressions to handle markdown content
    - Implement proper content preprocessing for search indexing
    - _Requirements: 4.1_

- [ ] 3. Implement client-side note type configuration
  - [ ] 3.1 Update client note type definitions
    - Add "markdown" to NoteType union in fnote.ts
    - Update client-side note type icons mapping
    - _Requirements: 1.1_

  - [ ] 3.2 Configure note type selection interface
    - Add markdown option to note type chooser
    - Include appropriate icon and description
    - _Requirements: 1.1_

  - [ ] 3.3 Update note detail widget type mapping
    - Register MarkdownTypeWidget in typeWidgetClasses
    - Ensure proper widget type resolution for markdown notes
    - Handle read-only mode mapping correctly
    - _Requirements: 3.1, 3.2_

- [ ] 4. Create core MarkdownTypeWidget implementation
  - [ ] 4.1 Implement base TypeWidget structure
    - Create MarkdownTypeWidget class extending TypeWidget
    - Implement required abstract methods (getType, doRender, doRefresh)
    - Set up basic HTML template and styling
    - _Requirements: 1.1, 6.2_

  - [ ] 4.2 Implement Vditor editor integration
    - Create async initVditor method with proper error handling
    - Configure Vditor with appropriate options for Trilium integration
    - Implement theme detection and application
    - _Requirements: 1.1, 1.2, 6.2_

  - [ ] 4.3 Implement content management system
    - Create safeSetValue method with retry logic for robust content setting
    - Implement getData method for content retrieval
    - Handle content loading and saving with proper error recovery
    - _Requirements: 2.1, 2.2, 2.3, 5.2_

  - [ ] 4.4 Implement editor state management
    - Create updateReadOnlyMode method for permission handling
    - Implement proper cleanup and resource disposal
    - Handle note switching and editor lifecycle management
    - _Requirements: 3.1, 3.2, 3.3, 5.5_

- [ ] 5. Integrate auto-save functionality
  - [ ] 5.1 Configure SpacedUpdate integration
    - Set up debounced auto-save with appropriate timing
    - Integrate with Trilium's protected session handling
    - Respect database readonly mode settings
    - _Requirements: 2.1, 4.4, 5.4_

  - [ ] 5.2 Implement save state management
    - Track editor ready state to prevent premature saves
    - Handle save conflicts and error recovery
    - Provide user feedback during save operations
    - _Requirements: 2.1, 6.1, 6.5_

- [ ] 6. Add advanced editor features
  - [ ] 6.1 Implement theme integration
    - Create themeChangedEvent handler for dynamic theme switching
    - Ensure consistent styling with Trilium's theme system
    - Handle theme transitions without content loss
    - _Requirements: 6.2_

  - [ ] 6.2 Add export functionality
    - Implement exportMarkdown method for .md file export
    - Implement exportHtml method for HTML export
    - Integrate with Trilium's existing export system
    - _Requirements: 4.3_

  - [ ] 6.3 Implement keyboard shortcuts and accessibility
    - Configure standard editing shortcuts (Ctrl+Z, Ctrl+Y, etc.)
    - Ensure proper focus management and navigation
    - Implement accessibility features for screen readers
    - _Requirements: 4.4, 6.4_

- [ ] 7. Add internationalization support
  - [ ] 7.1 Update translation files
    - Add markdown note type translations to en/translation.json
    - Ensure consistent terminology across UI elements
    - _Requirements: 1.1_

  - [ ] 7.2 Implement localized error messages
    - Add error message translations for editor failures
    - Provide user-friendly feedback for common issues
    - _Requirements: 5.2, 6.1_

- [ ] 8. Create comprehensive test suite
  - [ ] 8.1 Implement unit tests for core functionality
    - Test MarkdownTypeWidget lifecycle methods
    - Mock Vditor for isolated component testing
    - Test error handling and recovery scenarios
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 8.2 Create integration tests
    - Test note switching and content persistence
    - Test auto-save functionality and timing
    - Test theme switching and UI consistency
    - _Requirements: 2.2, 2.3, 3.2, 6.2_

  - [ ]* 8.3 Add performance tests
    - Test initialization time under various conditions
    - Test large document handling capabilities
    - Test memory usage and cleanup verification
    - _Requirements: 5.1, 5.3_

- [ ] 9. Implement import/export support
  - [ ] 9.1 Create markdown import handler
    - Implement MarkdownImporter for .md file imports
    - Handle file extension recognition and MIME type detection
    - Integrate with Trilium's import system
    - _Requirements: 4.3_

  - [ ] 9.2 Create markdown export handler
    - Implement MarkdownExporter for note export functionality
    - Support batch export operations
    - Maintain formatting and metadata during export
    - _Requirements: 4.3_

- [ ] 10. Finalize integration and documentation
  - [ ] 10.1 Complete Trilium integration
    - Ensure all Trilium features work with markdown notes
    - Test protected notes encryption compatibility
    - Verify search functionality integration
    - _Requirements: 4.1, 4.2, 4.4_

  - [ ] 10.2 Performance optimization and cleanup
    - Optimize bundle size and loading performance
    - Implement lazy loading for Vditor assets
    - Clean up unused code and dependencies
    - _Requirements: 5.1, 5.3, 5.4_

  - [ ]* 10.3 Create user documentation
    - Document markdown editor features and shortcuts
    - Create troubleshooting guide for common issues
    - Add examples of advanced markdown usage
    - _Requirements: 6.1, 6.4_