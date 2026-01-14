# Change: Refactor Negative Instructions to Positive Framing

## Why

Research shows negative instructions are less effective for LLMs because negation tokens have limited impact on the statistical representations learned during training. Positive framing provides clearer activation patterns and improves instruction-following reliability.

Goost's commands and instructions contain 54+ instances of negative framing. Refactoring these to positive framing should improve instruction-following reliability.

**Evidence sources:**
- Anthropic's prompt engineering docs recommend positive framing for output format control
- VILA-Lab "26 Principles" research (arXiv:2312.16171): "Employ affirmative directives such as 'do' while steering clear of negative language"
- Academic research on LLM negation handling (Vrabcová et al., 2025; Singh et al., 2024)
- Empirical reports of negative instructions failing in production

**Important nuances (from research validation):**
- Negative framing IS appropriate for safety constraints and absolute boundaries
- Topic-suppression negatives ("don't mention X") are more problematic than procedural negatives ("don't skip steps")
- Pairing negatives with positive alternatives improves compliance

## What Changes

- **goost_instructions.md**: Reframe ~15 negative instructions to positive equivalents
- **Slash commands**: Update anti-loop protocols, sub-agent context blocks, and behavioral restrictions
- **rules.yaml**: Review and update rule descriptions where applicable

**Simplified 2-rule approach (per research validation):**
1. **Default**: Convert negative instructions to positive equivalents
2. **Exception**: Preserve negative framing for safety constraints (MUST NOT, CONSTRAINTS sections)

## Impact

- Affected specs: `slash-commands` (instruction wording in command definitions)
- Affected code: No code changes—documentation/prompt-only refactoring
- Risk: Low—this is a prompt engineering improvement with no functional changes

### Affected Files (by instance count)

| File | Instances | Notes |
|------|-----------|-------|
| `goost_instructions.md` | 14 | Core instructions |
| `openspec-harden.md` | 5 | Anti-loop, sub-agent context |
| `openspec-prep.md` | 5 | Anti-loop, sub-agent context |
| `contract.md` | 4 | Completion gates |
| `openspec-review.md` | 3 | Sub-agent context |
| `openspec-status.md` | 3 | Behavioral restrictions |
| `openspec-coordinate.md` | 2 | Behavioral restrictions |
| `goost-slop-scan.md` | 2 | Sub-agent context |
| `openspec-audit.md` | 2 | Sub-agent context |
| `goost-search.md` | 2 | Sub-agent context |
| Other commands | 1 each | Various |

### Cross-Spec Alignment

> **Note**: The `tdd-enforcement` spec contains "SHALL NOT be marked `[x]` until..." which is a procedural constraint, not a safety boundary. This change does not modify deployed specs—it only affects slash command implementations. If the deployed spec language needs updating, a separate change proposal should be created.

## Acceptance Criteria

- [ ] All "Do NOT" / "NEVER" / "CANNOT" / "avoid" instructions reviewed
- [ ] High-impact negative instructions reframed to positive equivalents
- [ ] Safety-critical negative instructions (MUST NOT constraints) preserved where appropriate
- [ ] No functional behavior changes to commands
- [ ] All modified files pass linting/validation

## Research Validation

Research validation completed on 2026-01-14. Key findings:

| Decision | Status | Notes |
|----------|--------|-------|
| Positive framing improves compliance | ✅ Validated | Supported by Anthropic, Google, VILA-Lab research |
| Preserve negatives for safety constraints | ✅ Validated | Anthropic's Constitutional AI uses this pattern |
| 5-category approach | ⚠️ Simplified | Reduced to 2-rule system (default + exception) |
| Psychological justification | ❌ Revised | Replaced with mechanical explanation |

**Sources:**
- Anthropic Claude 4 Best Practices: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices
- VILA-Lab "26 Principles" (arXiv:2312.16171): https://arxiv.org/html/2312.16171v2
- Vrabcová et al. (2025) "Negation: A Pink Elephant in LLMs' Room": arXiv:2503.22395
