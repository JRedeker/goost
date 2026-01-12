# Tasks: Add Loop Anomaly Detection

## 1. Core Detection Module

- [x] 1.1 Create `plugin/anomaly.ts` with detection logic
  - [x] Size threshold check (default: 20K chars)
  - [x] Substring repetition check (80+ chars, 3+ times)
  - [x] Sampling strategy (check every ~2K chars growth)
- [x] 1.2 Add anomaly state to `plugin/types.ts`
  - [x] `AnomalyState` interface (detected: boolean, lastCheckLength: number, abortedAt: number | null)
  - [x] Environment variable constants

## 2. Plugin Integration

- [x] 2.1 Update plugin to capture `client` from PluginInput
  - Verify: Check that PluginInput interface includes client property
  - Verify: Log warning if client is undefined at initialization
- [x] 2.2 Track current `sessionID` from events
- [x] 2.3 Integrate detection into `message.updated` handler
  - [x] Call detection only when size increases by 2K+ chars
  - [x] Skip during tool execution
- [x] 2.4 Call `client.session.abort()` on detection
  - [x] Check return value (boolean) to confirm success
  - [x] Log warning if abort returns false or throws
- [x] 2.5 Update state to `doom_loop` status (reuse existing)

## 3. Abort Safety

- [x] 3.1 Add state-based throttle (prevent rapid aborts)
- [x] 3.2 Reset throttle on session status change
- [x] 3.3 Track tool execution to prevent mid-tool abort

## 4. Optional Bell Notification

- [x] 4.1 Emit BEL character if GOOST_ANOMALY_BELL=1
- [x] 4.2 Add rate limiting (max 1 bell per detection)

## 5. Documentation

- [x] 5.1 Update goost_instructions.md with anomaly detection
- [x] 5.2 Document environment variables in README.md

## 6. Testing

- [x] 6.1 Manual test with simulated repetitive content
- [x] 6.2 Verify SDK abort terminates response
- [x] 6.3 Verify throttle prevents rapid aborts
- [x] 6.4 Performance validation
  - Verify: Detection loop completes in <10ms for 50K char responses
  - Verify: No visible UI lag during streaming detection
