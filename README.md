<p align="center">
  <img src="assets/goost-logo.svg" alt="Goost Logo" width="128" height="128">
</p>

<h1 align="center">Goost</h1>

<p align="center">
  <strong>Contract-Based Persistence for OpenCode</strong>
</p>

<p align="center">
  A lightweight persistence mechanism for long-running AI agent tasks.<br>
  Solves the fundamental problem of LLM task completion: agents declaring "done" before work is actually complete.
</p>

---

## The Problem

LLMs exhibit predictable failure modes in extended tasks:

| Failure Mode | Description |
|--------------|-------------|
| **Premature completion** | Declaring done at 70% because the last 30% is hard |
| **Scope reduction** | Quietly dropping difficult requirements |
| **Goal drift** | Solving adjacent problems instead of the stated objective |
| **Completion theater** | Marking todos done without verification |

Todo lists don't solve this because **the agent controls the todo list**. It can add, remove, or mark items complete without accountability.

## The Solution: Contracts

Goost introduces **immutable contracts** - success criteria that:

- Are defined upfront with user confirmation
- Cannot be modified without explicit contract voiding
- Require verifiable evidence before marking complete
- Block premature completion declarations

## Installation

### Quick Install (Recommended)

```bash
cd ~/dev/oc-plugins/goost
./install.sh
```

Then add to your `~/.config/opencode/opencode.json`:

```json
{
  "instructions": [
    "/home/YOUR_USER/dev/oc-plugins/goost/goost_instructions.md"
  ],
  "plugin": [
    "/home/YOUR_USER/dev/oc-plugins/goost/plugin"
  ]
}
```

### Manual Installation

**1. Copy slash commands:**
```bash
cp .opencode/command/*.md ~/.config/opencode/command/
```

**2. Add instructions to opencode.json:**
```json
{
  "instructions": [
    "/path/to/goost/goost_instructions.md"
  ]
}
```

**3. (Optional) Install status plugin:**
```bash
cd plugin && bun install
```

Then add to opencode.json:
```json
{
  "plugin": [
    "/path/to/goost/plugin"
  ]
}
```

### Project-Level Installation

For per-project usage, copy the `.opencode` directory:

```bash
cp -r goost/.opencode /path/to/your/project/
```

## Usage

### Starting a Contract

Invoke the slash command:

```
/contract
```

The agent will ask you:
1. What does "done" look like? (objective)
2. What must be true when complete? (success criteria)
3. Any hard boundaries? (constraints)
4. Major phases? (checkpoints, for complex tasks)

### Example Session

```
User: /contract

Agent: Let's establish a contract for this task.

1. What does "done" look like in one sentence?

User: The API endpoint handles pagination correctly.

Agent: 2. What 3-5 specific things must be true when complete?

User: 
- Endpoint accepts page and limit query params
- Returns correct subset of data
- Includes total count in response
- Works with empty results

Agent: 3. Any constraints - things that MUST or MUST NOT happen?

User: Must not break existing endpoints. Must include tests.

Agent:
============================================================
                    CONTRACT ACTIVE
============================================================

OBJECTIVE: The API endpoint handles pagination correctly.

SUCCESS CRITERIA:
- [ ] Endpoint accepts page and limit query params
- [ ] Returns correct subset of data for given page/limit
- [ ] Response includes total count metadata
- [ ] Handles empty result sets gracefully
- [ ] Unit tests cover pagination logic

CONSTRAINTS:
- MUST NOT: Break existing endpoint contracts
- MUST: Include test coverage

CHECKPOINTS:
- Single-phase task

============================================================

Contract ready. Do you accept these terms?

User: Yes

Agent: Contract locked. Beginning work...
[work proceeds]

---
CONTRACT STATUS:
- [x] Endpoint accepts page and limit query params (implemented in routes/api.ts)
- [x] Returns correct subset of data (verified with test data)
- [ ] Response includes total count metadata (in progress)
- [ ] Handles empty result sets (pending)
- [ ] Unit tests cover pagination logic (pending)
Phase: 1 of 1 | Criteria: 2/5 complete
---
```

### Contract Lifecycle

```
/contract → Define → Confirm → LOCKED → Work → Status Updates → FULFILLED
                                  ↓
                              (or VOIDED if user cancels)
```

### Voiding a Contract

If you need to abandon or modify scope:

```
User: void contract

Agent:
============================================================
                  CONTRACT VOIDED
============================================================
Completed: 2 of 5 criteria
Unmet criteria:
- Response includes total count metadata
- Handles empty result sets
- Unit tests cover pagination logic
============================================================
```

## How It Works

### 1. Slash Command (`/contract`)

Located at `.opencode/command/contract.md`, this defines the contract creation flow and format.

### 2. Instructions (`goost_instructions.md`)

The main instructions file defines the contract protocol and is loaded into the system prompt. It:

- Defines the contract format and lifecycle
- Requires status blocks on every response
- Blocks premature completion
- Handles user pressure to skip criteria
- Enforces drift prevention checks
- Detects and handles doom loops

### 3. Status Plugin (`plugin/index.ts`)

The TypeScript plugin provides:
- Terminal tab color changes based on contract state
- Window title updates with progress
- Contract preservation during context compaction
- tmux passthrough support for escape sequences

## Design Philosophy

### Immutability Over Flexibility

Todo lists fail because they're mutable. The agent can game them. Contracts are locked at confirmation - changing scope requires explicit voiding and re-contracting.

### Verification Over Trust

Criteria must be **verifiable**: "tests pass" not "code is clean". The status block requires evidence, not assertions.

### Explicit Over Implicit

Every response shows contract status. Progress is visible. Incompleteness is undeniable.

### User Authority

Only the user can void a contract. The agent cannot unilaterally declare partial completion acceptable.

## Comparison to Alternatives

| Feature | Todo Lists | OhMyOpenCode Enforcer | Goost Contracts |
|---------|------------|----------------------|-----------------|
| User-confirmed scope | No | No | Yes |
| Immutable criteria | No | No | Yes |
| Requires evidence | No | Partial | Yes |
| Visible in every response | Sometimes | Sometimes | Always |
| Blocks false completion | No | Yes | Yes |
| Handles scope changes | Implicit | Implicit | Explicit (void + re-contract) |

## Terminal Status Integration

Goost includes a status indicator system that shows contract state in your Windows Terminal tab.

### Status Icons

| Icon | State | Meaning |
|------|-------|---------|
| 🚀 Rocket | Launching/Working | Setting up sub-agents or actively working |
| 🌕 Full Moon | Waiting | Sub-agent tasks running, awaiting results |
| 🌍 Earth | Ready | Complete or awaiting user input |
| 🔄 Loop | Doom Loop | Stuck retrying failed approach |

### Tab Colors

The terminal tab color changes to match the state:
- **Red** (`#ED4245`): Active work / launching (rocket)
- **Blue** (`#5865F2`): Waiting for sub-agents (moon)
- **Green** (`#57F287`): Complete/ready for input (earth)
- **Orange** (`#FFA500`): Doom loop detected (loop)

### tmux Support

If you run OpenCode inside tmux, add this to your `~/.tmux.conf` to enable passthrough of escape sequences:

```bash
set -g allow-passthrough on
```

The plugin automatically detects tmux and wraps OSC escape sequences in DCS passthrough format.

### Installation (Plugin)

For terminal status integration, add the plugin to your `opencode.json`:

```json
{
  "plugins": [
    "./path/to/goost/plugin"
  ]
}
```

Or install globally:
```bash
cp -r goost/plugin ~/.config/opencode/plugins/goost-status
```

Then in `~/.config/opencode/opencode.json`:
```json
{
  "plugins": [
    "~/.config/opencode/plugins/goost-status"
  ]
}
```

### How It Works

The agent emits status markers like `[GOOST:MOON]` at the start of responses. The plugin detects these and updates the terminal tab accordingly.

The status also shows contract progress: `🌙 Sub-agents [2/5]`

## Configuration

### Minimal Setup

Just the slash command:
```
.opencode/command/contract.md
```

### Full Setup (Recommended)

Slash command + instructions + status plugin:
```
goost/
├── .opencode/
│   ├── command/
│   │   ├── contract.md
│   │   └── contract-quick.md
│   └── rules/
│       └── status-indicator.md
├── plugin/
│   ├── index.ts
│   └── package.json
└── goost_instructions.md
```

## Tips for Effective Contracts

### Write Verifiable Criteria

| Bad | Good |
|-----|------|
| "Code is clean" | "No ESLint errors" |
| "Works correctly" | "All test cases pass" |
| "Good performance" | "Response time < 200ms" |
| "Handles errors" | "Returns 400 for invalid input with error message" |

### Keep Criteria Count Reasonable

- 3-5 criteria for small tasks
- 5-8 for medium tasks
- 8+ means you should break into multiple contracts

### Use Checkpoints for Long Tasks

If a task takes more than ~30 minutes, define phase gates:
```
CHECKPOINTS:
- [ ] Phase 1: Data model and migrations complete
- [ ] Phase 2: API endpoints implemented
- [ ] Phase 3: Frontend integration complete
- [ ] Phase 4: Tests passing, PR ready
```

## License

MIT - Use freely, attribution appreciated.

## Name Origin

**Goost** = **Go**al B**oost** 

Because sometimes you need a boost to actually reach your goals, not just start toward them.
