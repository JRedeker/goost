# Change: Add Loop Anomaly Detection

## Why

AI agents frequently get stuck in loops that waste tokens, time, and user patience. These manifest as:

1. **Text repetition loops** - The model outputs the same phrase/sentence repeatedly in a single response (like "Let me look at the code more carefully." repeated 50+ times). This is a generation-level failure common with certain models (especially Gemini).

2. **Runaway generation** - Responses that grow excessively large with repetitive content, consuming context window.

Currently, Goost detects **behavioral doom loops** (same approach tried 3+ times across responses), but NOT text repetition within a single response.

## Research Validation

This proposal has been validated through architectural research. Key findings:

### Validated Decisions ✅

1. **SDK Abort API** - `client.session.abort({ path: { id: sessionID } })` is the correct documented approach (https://opencode.ai/docs/sdk/)
2. **Config File Pattern** - Separate `goost.json` matches ecosystem pattern (oh-my-opencode uses same approach)
3. **Terminal Bell** - BEL character (0x07) is universally recognized, though behavior varies by terminal

### Simplification Opportunities 🎯

Research identified significant over-engineering in the original proposal:

| Original | Simplified |
|----------|-----------|
| 4 detection types | 1 combined detection (size + repetition) |
| N-gram frequency tracking | Simple substring matching |
| 10 configurable thresholds | 3 env var overrides |
| 28 implementation tasks | ~10 tasks |
| Full Zod config system | Hardcoded defaults |
| Self-talk detection | Deferred (high false positive risk) |
| Semantic error hashing | Deferred (existing doom loop covers this) |

### Concerns Addressed ⚠️

1. **N-gram threshold** - 10 words is too long, 4-6 words recommended. But simpler substring matching catches the same loops.
2. **Debounce pattern** - Use state-based throttle (not debounce) that resets on user resume
3. **Terminal bell reliability** - Varies by terminal; keep as optional, don't rely on it as primary feedback
4. **Streaming analysis** - Sample at intervals (every 2K chars) rather than every token

## What Changes (Simplified)

- **ADDED**: Combined size + repetition detection (simple substring matching)
- **ADDED**: Auto-abort via `client.session.abort()` SDK method
- **ADDED**: Reuse existing `doom_loop` status (no new status needed)
- **ADDED**: Optional terminal bell notification
- **ADDED**: Environment variable overrides for thresholds

## Impact

- Affected code: `plugin/index.ts`, `plugin/types.ts`
- New module: `plugin/anomaly.ts` (lightweight, ~50 lines)
- No new dependencies

## Technical Approach (Simplified)

### Detection Strategy

**Single combined check**: When response exceeds size threshold, check for any 80+ character substring appearing 3+ times.

```typescript
// Pseudocode - actual implementation in anomaly.ts
function detectAnomaly(content: string): boolean {
  if (content.length < ANOMALY_SIZE_THRESHOLD) return false
  
  // Check for repetition: any 80+ char substring appearing 3+ times
  for (let i = 0; i < content.length - 80; i += 40) {
    const substr = content.substring(i, i + 80)
    const count = (content.match(new RegExp(escapeRegex(substr), 'g')) || []).length
    if (count >= 3) return true
  }
  return false
}
```

This catches both:
- Text repetition loops (same phrase repeated)
- Runaway generation with patterns (large size + repetitive content)

### Intervention

1. **SDK Abort** (primary): Call `client.session.abort()` immediately on detection
2. **Terminal Bell** (optional): Emit BEL if configured
3. **Existing doom_loop status**: Reuse for visual feedback

### Configuration (Minimal)

Environment variables only (no config file needed for v1):

```bash
GOOST_ANOMALY_SIZE=20000      # Size threshold (default: 20000 chars)
GOOST_ANOMALY_BELL=1          # Enable bell (default: 1)
```

### Streaming Analysis Strategy

- **Cheap checks every update**: Response length tracking
- **Heavy analysis on threshold**: Only run substring matching when size > threshold
- **Sample at intervals**: Check every ~2K chars to avoid O(n²) behavior

### Abort Safety

- Use state-based throttle: Allow first abort, prevent rapid repeats
- Reset throttle on session status change (user resumed)
- Don't abort during tool execution
- Log all abort decisions

## Deferred to v0.2

Only add if v0.1 proves insufficient:

- Self-talk detection (high false positive risk with "thinking" tokens)
- Semantic error hashing (existing doom loop detection covers this)
- Full config file system (only if users request threshold tuning)
- N-gram frequency tracking (only if substring check insufficient)

## Research Sources

- OpenCode SDK Docs: https://opencode.ai/docs/sdk/
- DeRep Paper (repetition detection): https://arxiv.org/html/2504.12608v1
- HuggingFace text generation docs (repetition penalty)
- Muxup blog on terminal bells
- oh-my-opencode config patterns
