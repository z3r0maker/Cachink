---
description: Run a workspace health audit scanning code quality, test coverage, security, and dependencies.
agent: DaVinci
---

Perform a comprehensive workspace health audit for scope: $ARGUMENTS

Analyze:

1. Code quality issues (complexity, dead code, naming)
2. Test coverage gaps
3. Security concerns (exposed secrets, unsafe patterns)
4. Dependency health (outdated, vulnerable, unused)

Use the code_atelier_audit tool to record findings.
If no scope is specified, audit the entire workspace.

!git diff --stat HEAD~5
