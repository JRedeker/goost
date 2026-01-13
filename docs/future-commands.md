# Future Command Ideas

Prompts and concepts for potential future Goost slash commands. These are not yet implemented but captured here for future consideration.

---

## Testing Infrastructure Audit (`/goost-test-audit`)

**Status**: Idea  
**Added**: 2026-01-12

Perform a comprehensive audit of the testing infrastructure in a repository to identify opportunities for modernization and robustness. This goes beyond checking if tests pass—it evaluates the quality of the testing environment itself.

### Research Questions

1. **Parallelization & Speed**
   - Are tests running sequentially or in parallel?
   - What is the total execution time, and what is the stack-specific tool (e.g., `pytest-xdist`, `playwright-parallel`, `go test -parallel`) to speed this up?

2. **Safety & Timeouts**
   - Is there a global safety net for hanging tests?
   - Identify the best plugin or configuration for this stack to enforce automated timeouts at the test level.

3. **Property-Based Testing (Logic Depth)**
   - Identify modules with complex logic (parsing, regex, mathematical calculations, or state transitions).
   - Recommend a property-based testing library (e.g., Hypothesis for Python, fast-check for JS, QuickCheck for Haskell/Rust) to stress-test these specific areas beyond static unit tests.

4. **Resource Hygiene & Leaks**
   - Review the test setup/teardown (fixtures). Are there signs of resource leaks (unclosed database connections, lingering temp files, or un-mocked network calls)?
   - Look for `ResourceWarnings` or `Leaked connection` messages in the test output.

5. **Developer Experience (DX)**
   - Is there a central "Testing Guide" or documentation for new contributors?
   - Are there gaps in the dependency groups (e.g., missing coverage tools, linters, or snapshot testing)?

6. **CI/CD Alignment**
   - Compare the local test execution command with the CI pipeline configuration. Are they utilizing the full CPU capacity of the CI runners?

### Deliverable

Provide a prioritized list of:
- Specific tools to add
- Configuration changes to make
- A plan for a `docs/TESTING.md` file that captures the project's testing philosophy

---

<!-- Add more future command ideas below -->
