# Tasks: Add Goost Search Command

## 1. Command Scaffold
- [x] 1.1 Create `.opencode/command/goost-search.md` with frontmatter:
  - name: goost-search
  - description: Search curated prompt libraries for AI prompts
  - agent: general
  - subtask: true (prevents context pollution from external content)
- [x] 1.2 Add argument parsing section for query extraction ($ARGUMENTS)
- [x] 1.3 Add usage display for no-argument invocation
- [x] 1.4 Add sub-agent context header to prevent Goost status marker leakage

## 2. Library Index Fetching
- [x] 2.1 Implement fetch for `f/awesome-chatgpt-prompts` prompts.csv index
- [x] 2.2 Implement fetch for `x1xhlol/system-prompts-and-models-of-ai-tools` directory structure
- [x] 2.3 Add parallel fetching with 30-second timeout per source
- [x] 2.4 Add graceful degradation when one source fails
- [x] 2.5 Add progress indication during fetch

## 3. Search and Ranking
- [x] 3.1 Implement semantic matching logic (AI evaluates query against prompt titles/descriptions)
- [x] 3.2 Add interactive selection using question tool for multiple matches
- [x] 3.3 Add pagination (next 5 results) when user selects "Other"

## 4. Security Layer
- [x] 4.1 Implement content sanitization function:
  - Strip invisible/control chars: `/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF]/g`
  - Strip ANSI escapes: `/\x1b\[[0-9;]*[A-Za-z]|\x1b\][^\x07]*\x07/g`
  - Normalize line endings to LF
  - Truncate lines >1000 chars with "[TRUNCATED]" marker
  - Note if any characters were stripped
- [x] 4.2 Create warning banner template
- [x] 4.3 Ensure NO code path auto-executes or injects fetched content
- [x] 4.4 Parse CSV using inline regex (slash commands cannot use npm libraries)

## 5. Display Formatting
- [x] 5.1 Create display template with visual isolation borders
- [x] 5.2 Add source metadata (library, path)
- [x] 5.3 Note if sanitization stripped any characters
- [x] 5.4 Handle long prompts with clear delimiters

## 6. Error Handling
- [x] 6.1 Add "No matching prompts" message with category suggestions
- [x] 6.2 Add "Unable to reach libraries" message with manual browse links
- [x] 6.3 Add timeout handling with partial results support
- [x] 6.4 Add malformed response handling for library fetches

## 7. Documentation
- [x] 7.1 Update README.md with /goost-search command description
- [x] 7.2 Add security model explanation to command help output
- [x] 7.3 Document the two default libraries and their content types

## 8. Testing
- [x] 8.1 Manual test: Basic search returns relevant results (verified CSV URL works)
- [x] 8.2 Manual test: Multiple matches triggers interactive selection (implemented via question tool)
- [x] 8.3 Manual test: No matches shows helpful message (implemented in Step 3a)
- [x] 8.4 Manual test: Network failure gracefully degrades (implemented in Step 1.3)
- [x] 8.5 Manual test: Sanitization strips invisible characters (implemented in Step 4.2)
- [x] 8.6 Manual test: Long prompt displays correctly (implemented in Step 4.4)

## Dependencies

- Tasks 4.x (Security Layer) MUST be completed before task 5.x (Display Formatting)
- Tasks 2.x (Library Fetching) can be parallelized with tasks 4.x

## Cross-Cutting Concerns

> **Observability**: N/A - This is a slash command (markdown file), not plugin code. No structured logging capability exists in slash commands. Debug output is handled by OpenCode's native command tracing.

## Notes

- All external content is untrusted regardless of source reputation
- Manual copy/paste is intentional friction - prevents automated attacks
- Display-only is the primary defense; sanitization removes invisible characters
- Using raw.githubusercontent.com avoids API rate limits
