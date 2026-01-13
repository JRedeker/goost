# Tasks: Add Goost Search Command

## 1. Command Scaffold
- [ ] 1.1 Create `.opencode/command/goost-search.md` with frontmatter (name, description, agent: general)
- [ ] 1.2 Add argument parsing section for query extraction
- [ ] 1.3 Add usage display for no-argument invocation

## 2. Library Index Fetching
- [ ] 2.1 Implement fetch for `f/awesome-chatgpt-prompts` prompts.csv index
- [ ] 2.2 Implement fetch for `x1xhlol/system-prompts-and-models-of-ai-tools` directory structure
- [ ] 2.3 Add parallel fetching with 30-second timeout per source
- [ ] 2.4 Add graceful degradation when one source fails
- [ ] 2.5 Add progress indication during fetch

## 3. Search and Ranking
- [ ] 3.1 Implement semantic matching logic (AI evaluates query against prompt titles/descriptions)
- [ ] 3.2 Implement ranking algorithm prioritizing:
  - Semantic relevance to query
  - Coverage of multiple query terms
  - Source reputation (established tools/high-star repos)
- [ ] 3.3 Add interactive selection using question tool for multiple matches
- [ ] 3.4 Add pagination (next 5 results) when user selects "Other"

## 4. Security Layer (CRITICAL)
- [ ] 4.1 Implement content sanitization function:
  - Strip zero-width Unicode (U+200B, U+200C, U+200D, U+FEFF, etc.)
  - Escape terminal control sequences
  - Normalize line endings to LF
  - Truncate lines >1000 chars with "[TRUNCATED]" marker
- [ ] 4.2 Implement injection pattern detection:
  - Scan for "ignore previous instructions" and variants
  - Scan for "disregard/forget/override" + "instructions/system"
  - Detect Base64 blocks >500 chars
  - Detect character repetition >100 same char
  - Flag requests to reveal system prompts
- [ ] 4.3 Create warning banner template for untrusted content
- [ ] 4.4 Create suspicious pattern warning format with line references
- [ ] 4.5 Ensure NO code path auto-executes or injects fetched content

## 5. Display Formatting
- [ ] 5.1 Create secure display template with visual isolation borders
- [ ] 5.2 Add source metadata (library, path, timestamp)
- [ ] 5.3 Add sanitization notes section (what was modified)
- [ ] 5.4 Add "clean prompt" confirmation when no issues detected
- [ ] 5.5 Add usage instructions emphasizing manual review
- [ ] 5.6 Handle long prompts (>100 lines) with clear section delimiters
- [ ] 5.7 Handle tool definitions in system prompts with capability warning

## 6. Error Handling
- [ ] 6.1 Add "No matching prompts" message with category suggestions
- [ ] 6.2 Add "Unable to reach libraries" message with manual browse links
- [ ] 6.3 Add timeout handling with partial results support
- [ ] 6.4 Add malformed response handling for library fetches

## 7. Documentation
- [ ] 7.1 Update README.md with /goost-search command description
- [ ] 7.2 Add security model explanation to command help output
- [ ] 7.3 Document the two default libraries and their content types

## 8. Testing
- [ ] 8.1 Manual test: Basic search returns relevant results
- [ ] 8.2 Manual test: Multiple matches triggers interactive selection
- [ ] 8.3 Manual test: No matches shows helpful message
- [ ] 8.4 Manual test: Network failure gracefully degrades
- [ ] 8.5 Manual test: Suspicious pattern detection flags test prompt
- [ ] 8.6 Manual test: Sanitization strips test zero-width chars
- [ ] 8.7 Manual test: Long prompt displays correctly with boundaries

## Dependencies

- Tasks 4.x (Security Layer) MUST be completed before task 5.x (Display Formatting)
- Tasks 2.x (Library Fetching) can be parallelized with tasks 4.1-4.2 (sanitization/detection functions)
- Task 4.5 is a verification checkpoint - review all code paths before proceeding to display

## Notes

- Security is non-negotiable: all external content is untrusted regardless of source reputation
- The friction of manual copy/paste is intentional - it's a security feature, not a bug
- If in doubt about a security decision, err on the side of more warnings/restrictions
