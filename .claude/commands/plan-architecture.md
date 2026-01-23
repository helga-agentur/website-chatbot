---
description: Plan Implementation Based on Spec
argument-hint: <issue-number>
---
# Plan Issue #$ARGUMENTS

General Information
===
- Read `CLAUDE.md` to understand the project's architecture.
- Read the spec and understand the requirements.
- Don't go into the implementation yet – keep it high level.
- Limit yourself to 200 lines max
- Use examples instead of verbous details.

Tasks
===
1. Get our architectural standards from `CLAUDE.md`
2. Read requirements from `specs/issue-$ARGUMENTS-spec.md`
3. Analyze the current code.
4. **Technical Specification**
   - Components and modules to modify/create
     - Describe them in one sentence
     - Define their public APIs (no internals; add a short description)
   - Existing code that needs to be outsourced / abstracted
   - Database schema changes
   - External dependencies
   - Tests to write (including the test cases' names)
5. **Definition of Done**
   - Functionality checklist, test coverage requirements
   - Documentation updates, performance benchmarks
6. **Iterations**
   - Define the iterations / commits and their scope
   - Make sure to create independent code first, integrations later
   - Iterations are self-contained and have a small scope and a clear goal
7. Create `specs/issue-$ARGUMENTS-architecture.md` with complete analysis.
8. From the perspective of an experienced software developer
   - read the spec
   - clarify whatever is missing or unclear.
