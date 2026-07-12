---
description: Perform a thorough code review of a file or directory.
agent: DaVinci
subtask: true
---

Perform a thorough code review of: $ARGUMENTS

Check for:

- Correctness and edge cases
- Performance issues
- Security vulnerabilities
- Adherence to project conventions (read CLAUDE.md)
- Test coverage
- Code clarity and maintainability

Use CodeGraph tools (find_callers, find_references) to understand impact.
@$1
