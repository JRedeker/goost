RESEARCH QUESTION: Is the approach of clearing failure counters on criterion success appropriate for preventing spurious doom loop warnings?

FINDINGS:

1. **Counter Reset Pattern is Standard Practice in Distributed Systems**
   - The Circuit Breaker pattern explicitly resets failure counters on success (Half-Open → Closed transition)
   - Source: Microsoft Azure Architecture Center - Circuit Breaker pattern states "If these requests are successful, the circuit breaker assumes that the fault that caused the failure is fixed, and the circuit breaker switches to the Closed state. The failure counter is reset"
   - This validates that the proposed pattern follows established architectural patterns

2. **Reset on Success Prevents False Positives**
   - In the Circuit Breaker pattern, failure counters are time-based in Closed state but reset entirely on success to prevent spurious circuit opening
   - The Goost design aligns with this by resetting counters when a criterion is marked complete (`[x]`)
   - This prevents doom loop warnings for criteria that have been successfully addressed

3. **Counter Reset vs Exponential Backoff Serve Different Purposes**
   - Exponential backoff is for retry timing (spacing out retries to avoid overwhelming systems)
   - Counter reset is for state transition (acknowledging recovery/success)
   - These patterns are complementary, not alternatives - the Goost design uses counter reset, not backoff
   - AWS Builders' Library: "Retries are selfish... can make overload worse... backoff increases time between tries"
   - For AI agent loop detection, backoff isn't applicable since agents don't retry at machine speed

4. **The 2-Failure Threshold for Analysis Commands is Appropriate**
   - Azure documentation: "Retry policy should be tuned to match business requirements... For some noncritical operations, it's better to fail fast"
   - Analysis commands (openspec-audit, openspec-review) are exploratory by nature
   - Lower threshold (2 vs 3) triggers fallback strategy earlier, appropriate for analysis work where getting stuck is more costly than trying alternatives
   - AWS best practice: "Find the right trade-off for each service" - domain-specific thresholds are recommended

5. **Failure Counters Should Reset on Multiple Conditions**
   - Current spec correctly identifies 3 reset conditions:
     - Criterion marked complete (`[x]`)
     - Contract fulfilled
     - Contract voided
   - This matches the Circuit Breaker pattern's handling of success and explicit resets

6. **Concern: Counter Reset Can Mask Underlying Problems**
   - Azure Circuit Breaker documentation notes: "The failure counter for the Closed state is time based. It automatically resets at periodic intervals. This design helps prevent the circuit breaker from entering the Open state if it experiences occasional failures"
   - However, this is a feature, not a bug for AI agent loops - occasional failures in sub-agents are expected
   - The concern is mitigated by tracking failures per criterion, not globally

7. **Concern: Requires Command Cooperation**
   - Design document notes: "Requires command cooperation - must call clear function when marking criterion complete"
   - This is a valid architectural concern - the pattern depends on proper integration
   - However, this is manageable through proper implementation in processStatusBlock

VALIDATION RESULT: ⚠️ CONCERNS

The validation result is "CONCERNS" rather than "VALIDATED" because:

1. The implementation is not yet complete - processStatusBlock doesn't clear failures when criteria are marked complete
2. The reset pattern relies on proper coordination between command prompts and plugin state management
3. There needs to be clear documentation that the doom loop threshold applies to consecutive failures for the same criterion approach

RECOMMENDATION:

1. **Implement Counter Reset in processStatusBlock**: Modify the status block processing to clear failure counters when detecting a criterion changed from incomplete to complete (`[ ]` -> `[x]`)

2. **Add Explicit State Transition Documentation**: Document that failure counters are per-criterion, consecutive failures to prevent confusion about global vs local counting

3. **Consider Adding Time-Based Reset**: As an enhancement, consider adding a time-based decay or window for failures (e.g., failures older than N minutes don't count) to prevent very old failures from triggering warnings

4. **Monitor for Spurious Warnings**: After implementation, monitor for cases where doom loop warnings still trigger incorrectly, which might indicate the reset pattern needs refinement

5. **Validate 2-Failure Threshold**: The 2-failure threshold for analysis commands should be validated through testing with actual analysis scenarios to ensure it doesn't trigger too early

SOURCES:

- Microsoft Learn - Circuit Breaker Pattern: https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker
- Microsoft Learn - Retry Pattern: https://learn.microsoft.com/en-us/azure/architecture/patterns/retry
- AWS Builders' Library - Timeouts, retries and backoff with jitter: https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/
- Goost OpenSpec - harden-loop-prevention design: /home/jon/dev/plugins/goost/openspec/changes/harden-loop-prevention/design.md
- Goost OpenSpec - harden-loop-prevention plugin spec: /home/jon/dev/plugins/goost/openspec/changes/harden-loop-prevention/specs/plugin/spec.md
- Goost plugin implementation: /home/jon/dev/plugins/goost/plugin/contract.ts
- Goost plugin types: /home/jon/dev/plugins/goost/plugin/types.ts
