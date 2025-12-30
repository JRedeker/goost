<p align="center">
  <img src="assets/goost-logo.svg" alt="Goost Logo" width="128" height="128">
</p>

<h1 align="center">Goost</h1>

<p align="center">
  <strong>Contract-Based Persistence for OpenCode</strong>
</p>

<p align="center">
  <a href="https://opencode.ai"><img src="https://img.shields.io/badge/OpenCode-Plugin-7C3AED?style=for-the-badge&logo=code&logoColor=white" alt="OpenCode Plugin"></a>
  <a href="#"><img src="https://img.shields.io/badge/Status-Stable-22c55e?style=for-the-badge" alt="Status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License"></a>
</p>

<p align="center">
  A lightweight persistence mechanism for long-running AI agent tasks.<br>
  Solves the fundamental problem of LLM task completion: <strong>agents declaring "done" before work is actually complete.</strong>
</p>

<hr>

## 💥 The Problem

LLMs exhibit predictable failure modes in extended tasks. They get tired, they get lazy, or they just lose the plot.

| Failure Mode | Description |
|--------------|-------------|
| **🏁 Premature completion** | Declaring done at 70% because the last 30% is hard |
| **📉 Scope reduction** | Quietly dropping difficult requirements |
| **⛵ Goal drift** | Solving adjacent problems instead of the stated objective |
| **🎭 Completion theater** | Marking todos done without verification |

> Todo lists don't solve this because **the agent controls the todo list**. It can add, remove, or mark items complete without accountability.

## 🛡️ The Solution: Contracts

Goost introduces **immutable contracts** - success criteria that:

- ✅ **Are defined upfront** with user confirmation
- 🔒 **Cannot be modified** without explicit contract voiding
- 🔎 **Require verifiable evidence** before marking complete
- 🛑 **Block premature completion** declarations

---

## 🚀 Quick Start

Get up and running in seconds.

```bash
# 1. Clone the repo (if you haven't)
git clone https://github.com/JRedeker/goost.git ~/dev/oc-plugins/goost

# 2. Run the installer
cd ~/dev/oc-plugins/goost
./install.sh
```

Then add this to your `~/.config/opencode/opencode.json`:

```json
{
  "instructions": ["~/dev/oc-plugins/goost/goost_instructions.md"],
  "plugins": ["~/dev/oc-plugins/goost/plugin"]
}
```

<details>
<summary><strong>Manual Installation Options</strong> (Click to expand)</summary>

### 1. Copy Files Manually

**Slash Commands:**
```bash
cp .opencode/command/*.md ~/.config/opencode/command/
```

**Instructions:**
Add to `opencode.json`:
```json
{
  "instructions": ["/path/to/goost/goost_instructions.md"]
}
```

**Status Plugin:**
```bash
cd plugin && bun install
```
Add to `opencode.json`:
```json
{
  "plugin": ["/path/to/goost/plugin"]
}
```

### 2. Project-Level Installation

For per-project usage, just copy the `.opencode` directory:

```bash
cp -r goost/.opencode /path/to/your/project/
```
</details>

---

## 🎮 Usage

### Starting a Contract

Just type `/contract`. The agent will interview you to lock down the scope.

```text
User: /contract

Agent: Let's establish a contract.
       1. What does "done" look like in one sentence?
       ...
```

### The Contract Artifact

Once confirmed, the contract becomes the **law** of the session. It appears in the context and cannot be ignored.

```markdown
============================================================
                    CONTRACT ACTIVE
============================================================

OBJECTIVE: Add dark mode toggle to settings page.

SUCCESS CRITERIA:
- [x] Toggle component renders on settings page
- [x] Clicking toggle switches between light/dark themes
- [ ] Preference persists across page refreshes (localStorage)
- [ ] All existing tests pass

CONSTRAINTS:
- MUST NOT: Break existing light theme styles

============================================================
```

### 🛑 Completion Gate

You cannot say "Done!". The agent cannot say "Task complete!".
**Not until every box is checked.**

If the agent tries to exit early:
> "I can't declare this complete yet. The 'Persistence' criterion is still unchecked. Shall I implement that now?"

---

## 📊 Terminal Status

Goost lights up your Windows Terminal tab with real-time status.

### Status Icons

| Icon | State | Visual | Meaning |
|:----:|:------|:-------|:--------|
| 🚀 | **Working** | <img src="https://placehold.co/15x15/ED4245/ED4245.png" width="15" height="15"/> Red | Active work, launching agents |
| 🌕 | **Waiting** | <img src="https://placehold.co/15x15/5865F2/5865F2.png" width="15" height="15"/> Blue | Sub-agents running, awaiting results |
| 🌍 | **Ready** | <img src="https://placehold.co/15x15/57F287/57F287.png" width="15" height="15"/> Green | Complete or awaiting user input |
| 🔄 | **Stuck** | <img src="https://placehold.co/15x15/FFA500/FFA500.png" width="15" height="15"/> Orange | Doom Loop detected (retrying failed approach) |
| 🎤 | **Approval** | <img src="https://placehold.co/15x15/FF00FF/FF00FF.png" width="15" height="15"/> Magenta | **Needs user approval** (auto-detected) |

**Dynamic Title:**  
`🚀 projectname: Working [2/5]` — *Active, 2 of 5 criteria done*  
`🌕 projectname: Agent` — *Sub-agent running*  
`🎤 projectname: >>> APPROVAL NEEDED <<<` — *Shell permission required*

### Automatic Permission Detection

The plugin automatically detects when OpenCode requests permission for shell commands or other sensitive operations. When this happens:

- **Tab turns bright magenta** (highly visible)
- **Title shows `>>> APPROVAL NEEDED <<<`**
- **Returns to normal** after you approve or deny

This works through OpenCode's `permission.updated` and `permission.replied` events - no manual markers needed.

> **Note:** Requires `set -g allow-passthrough on` in your `.tmux.conf` if using tmux.

---

## 🧠 Design Philosophy

| Feature | Todo Lists | Goost Contracts |
|:--------|:-----------|:----------------|
| **Scope Control** | Mutable (Agent) | **Immutable (User)** |
| **Trust Model** | "Trust me" | **"Verify me"** |
| **Visibility** | Buried in logs | **Front & Center** |
| **Completion** | Subjective | **Objective** |

## 💡 Tips for Success

- **Be Specific:** "No ESLint errors" is better than "Code is clean".
- **Keep it Tight:** 3-5 criteria is the sweet spot.
- **Use Checkpoints:** For tasks >30 mins, break it into phases.

## ⚖️ License

MIT © [JRedeker](https://github.com/JRedeker)

<p align="center">
  <sub><strong>Goost</strong> = <strong>Go</strong>al B<strong>oost</strong> — Because sometimes you need a boost to finish the job.</sub>
</p>
