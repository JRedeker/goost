# Status Indicator Quick Reference

When a contract is active, emit a status marker at the **start** of each response (before any other content).

## Status Markers

| Marker | Emoji | When to Use |
|--------|-------|-------------|
| `[GOOST:ROCKET]` | 🚀 | Active work / spawning agents (default) |
| `[GOOST:MOON]` | 🌕 | Waiting for sub-agent results |
| `[GOOST:EARTH]` | 🌍 | Complete or awaiting user input |
| `[GOOST:DOOM_LOOP]` | 🔄 | Stuck retrying same failed approach |

## Rules

1. **One marker per response** - always at the very start, on its own line
2. **Default to ROCKET** - use when actively working and not waiting
3. **Status block still required** - marker is IN ADDITION to the contract status block at the end

## Example

```
[GOOST:MOON]

The explore agent is searching for deprecated API usages...

---
CONTRACT STATUS:
- [ ] Find deprecated calls (sub-agent searching)
- [ ] Replace with new API (pending)
Phase: 1 of 2 | Criteria: 0/2 complete
---
```

See `goost_instructions.md` for full protocol details.
