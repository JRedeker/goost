## ADDED Requirements

### Requirement: Goost Search Command

The `/goost-search` command SHALL search curated prompt libraries for prompts matching the user's query and present relevant results with AI-powered ranking and interactive selection.

#### Scenario: Basic search with single result
- **GIVEN** user has a specific prompt need
- **WHEN** user invokes `/goost-search code review`
- **AND** exactly one prompt strongly matches the query
- **THEN** the command SHALL display the full prompt content in review mode
- **AND** include the prompt source (library and path)

#### Scenario: Search with multiple results
- **GIVEN** a query matches multiple prompts
- **WHEN** user invokes `/goost-search debugging`
- **THEN** the command SHALL rank results by semantic relevance
- **AND** present top 3-5 matches via interactive selection
- **AND** each option SHALL include title and brief description
- **AND** user SHALL be able to select one to view full content

#### Scenario: No matching prompts
- **GIVEN** no prompts match the query
- **WHEN** user invokes `/goost-search extremely obscure topic xyz123`
- **THEN** the command SHALL display: "No matching prompts found for '<query>'"
- **AND** suggest refining the search terms
- **AND** list categories available in the libraries

#### Scenario: No arguments provided
- **GIVEN** user invokes `/goost-search` without arguments
- **WHEN** the command executes
- **THEN** the command SHALL display usage information
- **AND** show example queries
- **AND** list the prompt libraries being searched

### Requirement: Prompt Library Sources

The goost-search command SHALL query two curated prompt libraries as default sources.

#### Scenario: Awesome ChatGPT Prompts library
- **GIVEN** the search includes general-purpose prompts
- **WHEN** fetching from `f/awesome-chatgpt-prompts`
- **THEN** the command SHALL fetch the prompt index from `prompts.csv` or `PROMPTS.md`
- **AND** parse prompt titles and descriptions for matching
- **AND** fetch full prompt content from the appropriate source file

#### Scenario: System Prompts library
- **GIVEN** the search includes AI coding tool prompts
- **WHEN** fetching from `x1xhlol/system-prompts-and-models-of-ai-tools`
- **THEN** the command SHALL enumerate tool directories (Cursor, Windsurf, Claude, etc.)
- **AND** match against directory names and README descriptions
- **AND** fetch full system prompt content from matched tool directories

#### Scenario: Library fetch failure
- **GIVEN** a library is temporarily unavailable (network error, rate limit)
- **WHEN** the command attempts to fetch
- **THEN** the command SHALL continue with available libraries
- **AND** note which library was unreachable
- **AND** still return results from successful fetches

#### Scenario: Both libraries unavailable
- **GIVEN** all configured libraries fail to respond
- **WHEN** the command attempts to fetch
- **THEN** the command SHALL display: "Unable to reach prompt libraries"
- **AND** suggest checking network connectivity
- **AND** provide direct links to browse libraries manually

### Requirement: Search Result Ranking

The goost-search command SHALL use AI-powered semantic ranking to order results by relevance to the user's query.

#### Scenario: Semantic matching over keyword matching
- **GIVEN** user searches for "fix bugs"
- **WHEN** ranking results
- **THEN** prompts titled "Debugging Assistant" or "Bug Fixer" SHALL rank highly
- **AND** ranking SHALL consider semantic similarity, not just keyword presence

#### Scenario: Query context consideration
- **GIVEN** user provides a multi-word query like "typescript api error handling"
- **WHEN** ranking results
- **THEN** prompts that address multiple aspects of the query SHALL rank higher
- **AND** results SHALL be ordered by combined relevance score

#### Scenario: Tie-breaking with popularity
- **GIVEN** multiple prompts have similar relevance scores
- **WHEN** determining final ranking
- **THEN** prompts from more established sources (higher stars, official tools) SHALL be preferred

### Requirement: Interactive Selection Interface

The goost-search command SHALL provide an interactive selection interface when multiple results match.

#### Scenario: Present selection options
- **GIVEN** 3 or more prompts match the query with similar relevance
- **WHEN** presenting results to user
- **THEN** the command SHALL use the question tool to present options
- **AND** each option SHALL show: prompt name, source library, one-line description
- **AND** options SHALL be limited to top 5 most relevant

#### Scenario: User selects a prompt
- **GIVEN** user is presented with multiple options
- **WHEN** user selects one option
- **THEN** the command SHALL fetch the full prompt content
- **AND** display it in secure review mode with untrusted content warnings
- **AND** indicate how to use or adapt the prompt after review

#### Scenario: User requests more options
- **GIVEN** user selects "Other" or requests alternatives
- **WHEN** processing the selection
- **THEN** the command SHALL display the next 5 results if available
- **OR** refine the search based on user feedback

### Requirement: Untrusted Content Security

The goost-search command SHALL treat ALL fetched prompt content as untrusted and implement security controls to prevent prompt injection attacks.

#### Scenario: Display-only mode enforcement
- **GIVEN** a prompt has been fetched from an external library
- **WHEN** displaying the prompt to the user
- **THEN** the command SHALL NEVER auto-execute, auto-apply, or inject the prompt into the session
- **AND** the prompt SHALL be displayed in a visually isolated block
- **AND** the user MUST manually copy/paste to use the prompt

#### Scenario: Security warning banner
- **GIVEN** a fetched prompt is being displayed
- **WHEN** rendering the output
- **THEN** the command SHALL display a warning banner:
```
============================================================
    EXTERNAL CONTENT - REVIEW BEFORE USING
============================================================
Source: <library>/<path>
============================================================
```
- **AND** the warning SHALL appear before the prompt content

#### Scenario: Content sanitization
- **GIVEN** raw prompt content has been fetched
- **WHEN** preparing for display
- **THEN** the command SHALL sanitize the content by:
  - Stripping all invisible/control characters except newline and tab
  - Stripping ANSI escape sequences (colors, cursor movement, terminal commands)
  - Normalizing line endings (convert \r\n and \r to \n)
  - Truncating extremely long lines (>1000 chars) with "[TRUNCATED]" marker
- **AND** note if any characters were stripped



### Requirement: Secure Prompt Display Format

The goost-search command SHALL display retrieved prompts in a secure, visually isolated format.

#### Scenario: Visual isolation of prompt content
- **GIVEN** a prompt has been selected and sanitized
- **WHEN** displaying the prompt content
- **THEN** the output SHALL use clear visual boundaries:
```
============================================================
    UNTRUSTED EXTERNAL CONTENT - REVIEW BEFORE USE
============================================================
Source: f/awesome-chatgpt-prompts/prompts.csv
Title: Code Review Assistant

--- BEGIN PROMPT CONTENT ---

[Sanitized prompt content here]

--- END PROMPT CONTENT ---

============================================================
To use this prompt:
1. Review the content above carefully
2. Copy the relevant portions manually
3. Adapt to your specific needs
============================================================
```

#### Scenario: Display full prompt with metadata
- **GIVEN** a prompt has been selected or uniquely matched
- **WHEN** displaying the prompt
- **THEN** the output SHALL include:
  - Security warning banner
  - Source (library name and path)
  - Prompt title
  - Sanitization notes (if any content was modified)
  - Suspicious pattern warnings (if any detected)
  - Full prompt text within visual boundaries
  - Usage instructions emphasizing manual review

#### Scenario: Format long prompts
- **GIVEN** a prompt exceeds 100 lines
- **WHEN** displaying the prompt
- **THEN** the command SHALL display the full content
- **AND** use clear section delimiters
- **AND** preserve original formatting (code blocks, lists, etc.)
- **AND** maintain the security wrapper around all content

#### Scenario: Handle system prompts with tools
- **GIVEN** a system prompt from AI coding tools includes tool definitions
- **WHEN** displaying the prompt
- **THEN** tool definitions SHALL be clearly separated from the main prompt text
- **AND** the command SHALL note "This prompt includes tool definitions"
- **AND** warn that tool definitions may grant capabilities if used

### Requirement: Search Performance

The goost-search command SHALL complete searches within reasonable time limits.

#### Scenario: Index fetch timeout
- **GIVEN** fetching a library index takes longer than 30 seconds
- **WHEN** the timeout is reached
- **THEN** the command SHALL abort that fetch
- **AND** continue with any successfully fetched indexes
- **AND** note the timeout in output

#### Scenario: Progress indication
- **GIVEN** a search is in progress
- **WHEN** fetching from multiple sources
- **THEN** the command SHALL indicate which libraries are being searched
- **AND** show progress as each library completes

#### Scenario: Efficient content fetch
- **GIVEN** a prompt has been selected
- **WHEN** fetching full content
- **THEN** the command SHALL fetch only the specific file needed
- **AND** NOT fetch the entire repository or unrelated files
