# Change: Add Goost Search Command

## Why

Users need a way to discover and apply high-quality prompts from curated community libraries when tackling unfamiliar problems. Currently, finding the right prompt requires manually browsing multiple GitHub repositories. A search command that queries these libraries and intelligently ranks results would accelerate prompt discovery and improve task outcomes.

**Security Imperative**: External prompts represent an injection attack vector. Any prompt fetched from the internet could contain malicious instructions designed to manipulate AI behavior. This command must implement a secure "review-before-use" model that treats all external content as untrusted.

## What Changes

- Add `/goost-search` slash command that searches curated prompt libraries
- Implement live GitHub fetching for prompt content from:
  - `f/awesome-chatgpt-prompts` (142k stars, general-purpose prompts)
  - `x1xhlol/system-prompts-and-models-of-ai-tools` (108k stars, AI coding tool system prompts)
- AI-powered relevance ranking of search results
- Interactive selection when multiple prompts match the query
- **Security controls**:
  - Display-only mode (never auto-execute fetched prompts)
  - Warning banner before content
  - Content sanitization (strip invisible chars, escape ANSI sequences)
  - Visual isolation of prompt content

## Impact

- Affected specs: `slash-commands`
- Affected code: New `.opencode/command/goost-search.md` file
- Dependencies: Requires web fetch capability (already available via webfetch tool)
- No breaking changes
- **Security model**: Conservative by design - adds friction (manual copy/paste) to prevent accidental injection

## Research Validation (January 2026)

| Decision | Status | Action |
|----------|--------|--------|
| GitHub raw content fetching | ✅ Validated | No changes |
| AI semantic ranking | ✅ Accepted | Minor biases acceptable; users can pick from options |
| Display-only security model | ✅ Accepted | Primary defense against automated attacks |
| Unicode sanitization | ✅ Simplified | Two regexes cover all invisible/control chars |
| Injection pattern detection | ❌ Removed | Easily bypassed; display-only is sufficient |
| OpenCode slash command structure | ✅ Validated | Added subtask:true |
