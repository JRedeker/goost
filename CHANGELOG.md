# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Add /openspec-coordinate command for multi-agent synchronization and conflict detection (8af10f9)
- Add /goost-slop-scan command for AI code quality analysis with two-phase detection (5d71362)
- Add slop-smells.yaml with 50+ documented AI code smell patterns (5d71362)
- Add /openspec-status command for fast project state overview (cbaae13)
- Add /openspec-prep command (renamed from /openspec-review) for pre-implementation validation (64d0759)
- Add new /openspec-review command for post-implementation code review with sub-agent orchestration (64d0759)
- Add /openspec-audit command for project-wide spec/implementation drift detection (a380f26)
- Enhance openspec-roadmap spec with edge cases, verification steps, and schema (d414eb4)

### Changed
- Enhance /openspec-coordinate with full coordination implementation including configurable quotas, structured logging, blocked task detection, and result truncation (c9be1d1)
- Add contract enforcement to /openspec-prep command for active gap fixing (aaab0cc)
- Refactor plugin into modular architecture (types.ts, terminal.ts, contract.ts, index.ts) (71f604d)
- Add Zod runtime validation for SDK event properties (71f604d)
- Add event handler dispatch map pattern for cleaner event routing (71f604d)
- Add sub-agent failure tracking for doom loop detection (71f604d)
- Add GitHub Actions CI workflow with linting, type-checking, and formatting (71f604d)
- Add gap analysis phase to /openspec-review command (199af04)
- Enhance sub-agent contract propagation with security notes and conflict resolution (bd14e8b)
- Add automatic commit and changelog on contract completion (c698dd2)
- Improve approval visibility with magenta tab and auto-detection (7380dec)
- Add core rules.yaml and /openspec-review command (69f8667)
- Initialize OpenSpec and create sub-agent enhancement proposal (45152c2)

### Fixed
- Fix explicit GOOST status markers not triggering tab title updates - remove isTerminalState check that was blocking marker-based status changes (9673481)
- Fix tab title showing "OC | ---" instead of emoji and project name - use simple OSC sequence instead of DCS passthrough to correctly set tmux pane_title (c7c2651)
- Fix Windows Terminal tab title not updating in tmux - use pane TTY with DCS passthrough (d9499ae)
- Disable flaky tab coloration to rely on reliable emoji status indicators (41b8cb8)
- Fix TTY detection by walking process ancestry to find controlling terminal (1b827a1)
- Restore status emoji in terminal tab title (541ef82)
- Update contract completion protocol to commit before changelog (a0f84a3)
- Restore tab title/color on exit, show project name in title (4cfe142)
- Archive completed add-contract-completion-commit change (bf5abaf)
