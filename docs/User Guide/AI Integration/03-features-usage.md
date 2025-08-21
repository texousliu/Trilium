# AI Features and Usage

This guide explains how to use AI features in Trilium Notes effectively, with practical examples and best practices.

## Chat with Notes

### Accessing the Chat Interface

1. **Via Launcher Button**
   - Look for "Chat with Notes" button in the left sidebar
   - If not visible, configure in Launcher settings
   - Click to open chat panel

2. **Via Keyboard Shortcut**
   - Default: `Ctrl+Shift+C` (customizable in settings)

3. **Via Command Palette**
   - Press `Ctrl+P` to open command palette
   - Type "chat" and select "Open AI Chat"

### Basic Chat Operations

#### Starting a Conversation

```
User: What meetings did I have last week?

AI: Based on your notes, you had 3 meetings last week:
- Monday: "Project Planning Meeting" - Discussed Q2 roadmap
- Wednesday: "Client Review" - Presented prototype to ABC Corp
- Friday: "Team Retrospective" - Reviewed sprint outcomes
```

#### Asking Questions About Your Notes

```
User: Summarize my research on machine learning algorithms

AI: From your notes titled "ML Research" and "Algorithm Comparison":
- You've focused on supervised learning methods
- Random Forests show best performance for your dataset
- Neural networks require more training data
- Decision trees are most interpretable
```

### Context-Aware Conversations

The AI maintains context throughout your conversation:

```
User: What are my main project goals?
AI: According to "Project Charter" note, your main goals are...

User: How do these relate to the timeline?
AI: Based on the goals mentioned and your "Project Timeline" note...
```

## Tool-Enabled Actions

### Available Tools

Trilium's AI can execute these actions:

#### 1. Search Notes (`search_notes`)
Semantic search across your knowledge base:
```
User: Find all notes about Python programming

AI: [Executing search_notes tool...]
Found 15 notes related to Python programming:
- "Python Best Practices"
- "Django Tutorial"
- "Data Analysis with Pandas"
...
```

#### 2. Keyword Search (`keyword_search`)
Exact keyword matching:
```
User: Search for notes containing "API documentation"

AI: [Executing keyword_search tool...]
Found 8 notes with exact match for "API documentation"...
```

#### 3. Read Note (`read_note`)
Access full content of specific notes:
```
User: Show me the content of my "Meeting Minutes - Jan 15" note

AI: [Executing read_note tool...]
Here's the content of "Meeting Minutes - Jan 15":
...
```

#### 4. Create Note (`create_note`)
Generate new notes from conversation:
```
User: Create a note summarizing our discussion about project risks

AI: [Executing create_note tool...]
Created note titled "Project Risk Summary" with the discussed points...
```

#### 5. Update Note (`update_note`)
Modify existing note content:
```
User: Add the action items we discussed to my todo list

AI: [Executing update_note tool...]
Updated "Todo List" note with 3 new action items...
```

#### 6. Manage Attributes (`manage_attributes`)
Handle note metadata:
```
User: Add a #important label to my budget proposal

AI: [Executing manage_attributes tool...]
Added #important label to "Budget Proposal Q2" note...
```

#### 7. Calendar Integration (`calendar_integration`)
Work with date-based notes:
```
User: What's on my calendar for tomorrow?

AI: [Executing calendar_integration tool...]
Tomorrow (March 15, 2024):
- 9:00 AM - Team standup
- 2:00 PM - Client call
...
```

### Tool Execution Examples

#### Research Assistant
```
User: Help me research quantum computing for my presentation

AI: I'll help you research quantum computing. Let me search your notes first.

[Executing search_notes: "quantum computing"]
Found 3 existing notes on quantum topics.

[Executing read_note: "Quantum Basics"]
You have foundational notes covering superposition and entanglement.

[Executing create_note: "Quantum Computing Presentation Outline"]
Created a presentation outline based on your existing research and added:
1. Introduction to quantum concepts
2. Current applications
3. Future possibilities
4. Key challenges

Would you like me to expand on any section?
```

#### Meeting Preparation
```
User: Prepare me for tomorrow's project review meeting

AI: I'll help you prepare for the project review. Let me gather relevant information.

[Executing calendar_integration: "tomorrow"]
Meeting scheduled for 10:00 AM with stakeholders.

[Executing search_notes: "project status"]
Found recent status updates and milestone reports.

[Executing create_note: "Project Review Prep - March 15"]
Created preparation note with:
- Current status summary
- Completed milestones
- Pending items
- Risk factors
- Talking points

The note is ready for your review.
```

## Content Generation and Enhancement

### Note Summarization

#### Single Note Summary
```
User: Summarize my "Research Paper Draft" note

AI: Summary of "Research Paper Draft":
- Main thesis: Impact of remote work on productivity
- Key findings: 23% increase in output, 15% better work-life balance
- Methodology: Survey of 500 employees over 6 months
- Conclusion: Hybrid model shows best results
```

#### Multi-Note Synthesis
```
User: Create a summary of all my marketing strategy notes

AI: Synthesizing 8 marketing strategy notes:

**Overall Strategy**:
- Target audience: SMB owners aged 30-50
- Primary channels: LinkedIn, email marketing
- Budget allocation: 60% digital, 40% events

**Key Campaigns**:
1. Q1: Product launch campaign
2. Q2: Customer success stories
3. Q3: Industry thought leadership
```

### Content Expansion

```
User: Expand on the bullet points in my "Product Ideas" note

AI: Expanding your product ideas:

Original: "AI-powered scheduling"
Expanded: An intelligent scheduling system that learns user preferences,
automatically suggests optimal meeting times based on productivity patterns,
integrates with multiple calendars, and uses ML to predict meeting duration
and required preparation time.

Original: "Mobile-first design"
Expanded: A responsive design approach prioritizing mobile users with
touch-optimized interfaces, offline functionality, progressive web app
features, and native app integration for iOS and Android platforms.
```

### Writing Assistance

#### Improving Clarity
```
User: Help me rewrite my project proposal introduction for clarity

AI: Here's a clearer version of your introduction:

Original: "The implementation of said technological solutions will 
facilitate enhanced operational efficiency..."

Revised: "This technology will help our team work more efficiently by 
automating repetitive tasks and improving communication."
```

#### Structure Suggestions
```
User: How should I organize my research notes on climate change?

AI: Based on your 15 climate change notes, I suggest this structure:

1. **Scientific Basis**
   - Temperature data
   - CO2 measurements
   - Climate models

2. **Impacts**
   - Environmental effects
   - Economic consequences
   - Social implications

3. **Solutions**
   - Mitigation strategies
   - Adaptation measures
   - Policy recommendations

Would you like me to create this folder structure and organize your notes?
```

## Search and Discovery

### Semantic Search

Finding conceptually related content:

```
User: Find notes about improving productivity

AI: Searching for productivity-related content...

Found relevant notes:
1. "Time Management Tips" - Discusses Pomodoro technique
2. "GTD Implementation" - Getting Things Done methodology  
3. "Focus Strategies" - Deep work and flow states
4. "Morning Routines" - Habits for productive days
5. "Tool Stack" - Software for efficiency

These notes cover different aspects of productivity enhancement.
```

### Connection Discovery

```
User: What connections exist between my psychology notes and my marketing notes?

AI: Analyzing connections between psychology and marketing notes:

**Direct Connections**:
- "Consumer Behavior" references psychological triggers
- "Brand Psychology" links to cognitive bias notes
- "Persuasion Techniques" cites psychology research

**Conceptual Overlaps**:
- Both discuss decision-making processes
- Emotional responses appear in both domains
- Social proof concept bridges both areas

**Suggested Links**:
- Connect "Cognitive Biases" to "Marketing Strategies"
- Link "Color Psychology" to "Brand Design"
```

### Knowledge Gaps

```
User: What topics in my project plan lack detailed notes?

AI: Analyzing your project plan against existing notes:

**Well-documented areas**:
- Technical requirements (5 detailed notes)
- Timeline and milestones (3 notes)

**Gaps identified**:
- Risk mitigation strategies (no dedicated notes)
- Stakeholder communication plan (brief mentions only)
- Budget contingencies (missing)
- Success metrics (undefined)

Would you like me to create template notes for these gaps?
```

## Workflow Integration

### Daily Review

```
User: Give me my daily review for today

AI: Daily Review for March 14, 2024:

**Completed Tasks** (from your todo note):
✓ Review design mockups
✓ Send project update email
✓ Prepare meeting agenda

**Notes Created Today**:
- "Client Feedback Session"
- "API Integration Research"
- "Team 1-on-1 Notes"

**Upcoming (from calendar)**:
- Tomorrow: Project review at 10 AM
- Friday: Sprint planning

**Insights**: You've focused on design and communication today.
Consider allocating time tomorrow for the pending code review.
```

### Research Workflow

```
User: Help me research competitor analysis for our new feature

AI: Starting competitor analysis research:

[Searching existing notes...]
Found 3 previous competitor analyses.

[Reading notes...]
Your last analysis was 6 months ago. Key competitors: A, B, C.

[Creating structure...]
Created "Competitor Analysis - Feature X" with sections:
- Feature comparison matrix
- Pricing strategies  
- User reviews summary
- Differentiation opportunities

I've populated initial data from your previous research. 
What specific aspects should we focus on?
```

### Content Planning

```
User: Plan my blog content for next month

AI: Creating blog content plan for April 2024:

[Analyzing your content notes...]
Recent topics: productivity, remote work, AI tools

[Checking calendar...]
Important dates: April 15 (product launch), April 22 (conference)

**Suggested Content Calendar**:
Week 1: "Spring Productivity Reset" - ties to seasonal theme
Week 2: "Product Launch: Behind the Scenes" - supports launch
Week 3: "Key Takeaways from [Conference]" - timely content
Week 4: "Monthly Roundup: Tools and Resources"

[Creating note: "Blog Calendar - April 2024"]
Created with full outlines for each post.
```

## Best Practices

### Effective Prompting

#### Be Specific
❌ "Tell me about my notes"
✅ "Summarize my notes about the Q2 marketing campaign"

#### Provide Context
❌ "What should I do next?"
✅ "Based on my project timeline, what tasks should I prioritize this week?"

#### Request Format
❌ "Give me information"
✅ "Create a bullet-point summary of my research notes on renewable energy"

### Managing Conversations

1. **Start New Chats for New Topics**
   - Keeps context focused
   - Improves response relevance

2. **Reference Specific Notes**
   - "In my 'Budget 2024' note..."
   - "According to yesterday's meeting notes..."

3. **Use Follow-up Questions**
   - Build on previous responses
   - Refine and drill down into details

### Performance Optimization

1. **For Faster Responses**:
   - Use specific note titles when possible
   - Limit scope of searches
   - Choose appropriate models (Haiku for simple tasks)

2. **For Better Quality**:
   - Provide examples of desired output
   - Use step-by-step instructions
   - Allow AI to use tools when needed

3. **For Cost Efficiency**:
   - Batch similar questions
   - Use embeddings for initial search
   - Clear conversation history when switching topics

## Advanced Usage Patterns

### Creating Knowledge Graphs

```
User: Create a knowledge graph of my machine learning notes

AI: I'll analyze your ML notes and create a relationship structure:

[Analyzing 25 ML-related notes...]

Created "ML Knowledge Graph" note with:
- Core Concepts (10 notes)
  └── Algorithms (5)
  └── Theory (3)
  └── Mathematics (2)
- Applications (8 notes)
  └── Computer Vision (3)
  └── NLP (3)
  └── Predictive Analytics (2)
- Resources (7 notes)
  └── Tutorials (4)
  └── Papers (3)

Added relationship attributes showing connections between concepts.
```

### Automated Workflows

```
User: Every Monday, summarize last week's meeting notes and create action items

AI: I'll set this up for you:

1. Created template: "Weekly Meeting Summary Template"
2. Added script note: "Monday Meeting Automation"
3. Configured to:
   - Find all meeting notes from previous week
   - Extract action items
   - Create summary note
   - Add to your Monday note

The automation will run every Monday at 9 AM.
```

### Custom Analysis

```
User: Analyze the sentiment of my journal entries over the past month

AI: Analyzing 30 journal entries from the past month:

**Sentiment Trends**:
- Week 1: Generally positive (score: 0.7)
- Week 2: Mixed, some stress noted (score: 0.4)
- Week 3: Improvement, optimistic tone (score: 0.6)
- Week 4: Very positive, achievement-focused (score: 0.8)

**Common Themes**:
- Positive: project progress, team collaboration, learning
- Challenges: time management, work-life balance

**Insights**: Your mood correlates with project milestones. 
Consider scheduling breaks after intensive work periods.
```

## Tips for Success

1. **Build Context Gradually**: Start with simple questions, then build complexity
2. **Leverage Your Unique Data**: AI is most valuable when working with your specific notes
3. **Iterate and Refine**: Use AI responses as starting points, not final outputs
4. **Maintain Note Quality**: Better organized notes lead to better AI assistance
5. **Experiment with Tools**: Try different combinations of tools for complex tasks