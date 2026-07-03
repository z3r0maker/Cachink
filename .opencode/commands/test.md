---
description: Run tests and analyze results, fixing failures if found.
agent: DaVinci
---

Run and analyze tests for: $ARGUMENTS

1. Run the relevant test suite
2. Analyze any failures
3. If tests fail, diagnose the root cause
4. Suggest or implement fixes

!npm test -- $ARGUMENTS 2>&1 | head -100
