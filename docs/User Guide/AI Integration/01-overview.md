# AI Integration Overview

## Introduction

Trilium Notes integrates advanced AI and Large Language Model (LLM) capabilities to enhance your note-taking and knowledge management experience. These features enable intelligent search, content generation, and interactive assistance while maintaining control over your data.

## What AI Features Are Available

### Core Capabilities

#### 1. **Chat with Notes**
An interactive AI assistant that can:
- Answer questions based on your note content
- Provide summaries of complex topics across multiple notes
- Help you discover connections between ideas
- Assist with research and analysis

#### 2. **Semantic Search**
Advanced search capabilities using embeddings:
- Find conceptually related notes even when exact keywords don't match
- Discover hidden connections between notes
- Retrieve relevant context automatically during conversations

#### 3. **Tool-Enabled Actions**
AI can perform actions within your knowledge base:
- Create new notes based on conversations
- Update existing note content
- Search and retrieve specific information
- Manage note attributes and relationships
- Work with calendar and date-based notes

#### 4. **Content Generation and Enhancement**
- Generate summaries of long notes
- Expand on ideas and concepts
- Help with writing and editing
- Create structured content from unstructured information

## Supported AI Providers and Models

### Cloud Providers

#### OpenAI
- **Models**: GPT-4, GPT-4 Turbo, GPT-3.5-turbo
- **Embedding Models**: text-embedding-3-small, text-embedding-3-large, text-embedding-ada-002
- **Advantages**: 
  - Most widely tested and stable
  - Excellent general knowledge
  - Strong reasoning capabilities
- **Considerations**: 
  - Requires API key and internet connection
  - Usage-based pricing

#### Anthropic
- **Models**: Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku
- **Advantages**:
  - Strong analytical capabilities
  - Excellent for complex reasoning tasks
  - Good context handling for long documents
- **Considerations**:
  - Requires API key and internet connection
  - Usage-based pricing

### Local/Self-Hosted Options

#### Ollama
- **Models**: Various open-source models (Llama 3, Mistral, Phi, etc.)
- **Embedding Models**: mxbai-embed-large, nomic-embed-text, all-minilm
- **Advantages**:
  - Complete privacy - runs entirely on your machine
  - No API costs
  - Full control over model selection
  - Works offline
- **Considerations**:
  - Requires local compute resources
  - May be slower than cloud providers
  - Model quality varies

## Use Cases for AI in Note-Taking

### Research and Learning
- **Literature Review**: Summarize and synthesize information from multiple research notes
- **Concept Exploration**: Ask questions to understand complex topics from different angles
- **Study Assistant**: Create practice questions, summaries, and explanations from study notes

### Knowledge Management
- **Information Retrieval**: Quickly find specific information across thousands of notes
- **Connection Discovery**: Identify relationships between seemingly unrelated notes
- **Content Organization**: Get suggestions for better organizing and structuring your notes

### Writing and Content Creation
- **Idea Development**: Expand on initial thoughts and brainstorm new directions
- **Draft Generation**: Create first drafts based on outline notes
- **Editing Assistance**: Improve clarity, structure, and flow of existing content

### Personal Productivity
- **Meeting Summaries**: Generate concise summaries from meeting notes
- **Task Extraction**: Identify action items from project notes
- **Daily Reviews**: Get AI-generated summaries of daily activities and progress

### Creative Projects
- **Story Development**: Explore plot ideas and character development
- **World Building**: Maintain consistency in creative universes
- **Idea Synthesis**: Combine concepts from different notes to generate new ideas

## Privacy and Security Considerations

### Data Control
- **Local Processing Options**: Use Ollama for complete privacy with no data leaving your machine
- **Note Exclusion**: Mark sensitive notes with `#excludeFromAI` label to prevent AI access
- **Provider Selection**: Choose between cloud and local providers based on your privacy needs

### Security Features
- **API Key Protection**: Encrypted storage of API keys
- **Session Isolation**: Each chat session is isolated and temporary
- **No Automatic Uploads**: Notes are only sent to AI providers when explicitly requested

### Best Practices
1. **Review Provider Policies**: Understand how each provider handles your data
2. **Use Local Models for Sensitive Data**: Consider Ollama for confidential information
3. **Label Sensitive Notes**: Use the exclusion label for notes that should never be processed by AI
4. **Regular Audits**: Periodically review which notes are being accessed by AI features

## Getting Started

To begin using AI features in Trilium:

1. **Enable AI Features**: Navigate to Options → AI/LLM and enable the feature
2. **Choose a Provider**: Select between OpenAI, Anthropic, or Ollama based on your needs
3. **Configure Embeddings**: Set up embedding generation for semantic search
4. **Start Chatting**: Use the "Chat with Notes" button to begin interacting with your knowledge base

## Architecture Overview

The AI integration in Trilium follows a modular architecture:

### Three-Layer System
1. **Provider Layer**: Interfaces with different AI providers (OpenAI, Anthropic, Ollama)
2. **Service Layer**: Manages conversations, context, and tool execution
3. **Integration Layer**: Connects AI capabilities with Trilium's core features

### Key Components
- **Chat Service**: Manages conversations and message history
- **Context Service**: Extracts and formats relevant note content
- **Tool Registry**: Enables AI to perform actions within Trilium
- **Embedding Service**: Generates and manages semantic embeddings
- **Model Capabilities**: Tracks and manages different model features

This architecture ensures flexibility, allowing you to switch providers or models while maintaining consistent functionality across the application.