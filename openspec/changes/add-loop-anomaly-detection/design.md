# Design: Loop Anomaly Detection

## Research Findings

This design was informed by architectural research conducted on the proposal.

### N-gram vs Substring Detection

**Research**: The DeRep paper (arxiv:2504.12608) and HuggingFace docs show that:
- Industry standard `no_repeat_ngram_size` uses 2-4 word n-grams
- Full n-gram frequency maps have O(n) space overhead
- Rolling hash (Rabin-Karp) is more efficient but adds complexity

**Decision**: Use simple substring matching instead of n-grams.
- 80-character substrings capture ~10-15 words, sufficient for loop detection
- `String.indexOf` or regex matching is simpler and fast enough
- Avoids hash table memory overhead

### SDK Abort API

**Research**: OpenCode SDK documentation confirms:
- `client.session.abort({ path: { id: sessionID } })` is the correct API
- Returns `boolean` indicating success
- No documented race conditions or caveats

**Decision**: Use SDK abort as primary intervention. Check return value and log failures.

### Debounce vs Throttle

**Research**: Circuit breaker patterns and rate limiting best practices show:
- "Debounce" delays first action (wrong for abort)
- "Throttle" allows first action, prevents repeats (correct for abort)
- Time-based cooldowns (5 seconds) are fragile across LLM response timing

**Decision**: Use state-based throttle:
- Track `abortedThisResponse: boolean`
- Reset on session status change (new response or user resume)
- Simpler than time-based, more reliable

### Terminal Bell Reliability

**Research**: Terminal bell behavior varies significantly:
- Windows Terminal: Requires explicit config (added in v2.0)
- Alacritty: Visual bell disabled by default
- tmux: Requires `set -g visual-bell off` to pass through
- Many users configure `set bell-style none`

**Decision**: Keep bell as optional, not primary feedback.
- Default enabled but document terminal requirements
- Primary feedback is status change to `doom_loop`
- Consider OSC 9 notifications in future version

### Streaming Analysis Performance

**Research**: Analyzing every token update creates O(n²) worst case:
- `message.updated` fires on every token
- Full-text analysis on growing content is expensive

**Decision**: Sample-based analysis:
- Track `lastAnalyzedLength`
- Only run detection when content grows by 2000+ characters
- Always check size threshold (O(1))

### Configuration Complexity

**Research**: oh-my-opencode uses separate config files, but:
- OpenCode has no built-in plugin config system
- Config systems add overhead for rarely-changed values
- Zod schema validation is overkill for 2-3 settings

**Decision**: Environment variables only for v1:
- `GOOST_ANOMALY_SIZE` - size threshold
- `GOOST_ANOMALY_BELL` - enable/disable bell
- Add config file in v2 only if users request threshold tuning

## Algorithm

```typescript
// Simplified detection algorithm
const ANOMALY_SIZE_THRESHOLD = parseInt(process.env.GOOST_ANOMALY_SIZE || "20000")
const REPETITION_MIN_LENGTH = 80
const REPETITION_MIN_COUNT = 3
const ANALYSIS_INTERVAL = 2000

interface AnomalyState {
  lastAnalyzedLength: number
  abortedThisResponse: boolean
}

function shouldAnalyze(content: string, state: AnomalyState): boolean {
  return content.length >= ANOMALY_SIZE_THRESHOLD 
    && content.length - state.lastAnalyzedLength >= ANALYSIS_INTERVAL
}

function detectRepetition(content: string): { found: boolean; sample?: string } {
  // Stride by half the substring length to reduce iterations
  const stride = REPETITION_MIN_LENGTH / 2
  
  for (let i = 0; i <= content.length - REPETITION_MIN_LENGTH; i += stride) {
    const substr = content.substring(i, i + REPETITION_MIN_LENGTH)
    
    // Count occurrences using split (simpler than regex for special chars)
    const count = content.split(substr).length - 1
    
    if (count >= REPETITION_MIN_COUNT) {
      return { found: true, sample: substr.slice(0, 40) + "..." }
    }
  }
  
  return { found: false }
}
```

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| Substring vs n-gram | Simpler, no memory overhead | Slightly less sensitive to word variations |
| Env vars vs config file | Zero setup, immediate usability | Less discoverability |
| State throttle vs time debounce | Reliable across response timing | Must track session state |
| 80-char threshold | Catches meaningful repetition | May miss very short loops |
| 20K size threshold | Low false positives | Delays detection on genuine loops |

## Future Considerations

For v0.2, based on user feedback:

1. **Config file support** - If users request fine-grained tuning
2. **OSC 9 notifications** - Better than bell for desktop alerts
3. **Self-talk detection** - If false positive rate is acceptable
4. **Adjustable thresholds** - If defaults prove wrong for common cases
