---
description: Implement Code based on Specs and Architecture
argument-hint: <issue-number>
---
# Implement Issue #$ARGUMENTS

General Information
===
- Your task is to implement the requirements from the spec as a senior developer.
- You work on one iteration at a time, finish it, then move to the next one.
- Limit your code to what is necessary to meet the requirements. Don't overengineer.
- **Never** commit code before a human looked over it.**Always** wait for confirmation.

Tasks
===
1. **Context**
   - Read requirements in `specs/issue-$ARGUMENTS-spec.md`.
   - Read spec in `specs/issue-$ARGUMENTS-architecture.md`.
   - Analyze the current code.
2. **Style**
   - Read and understand our coding standards in `CLAUDE.md`.
3. **Branching**
   - Create a new branch: `git checkout -b {type}/${$ARGUMENTS}-{short-description}`.
4. **Iterate**
   - Read the *first* iteration in the architecture document.
5. **Implementation**
   - Install dependencies when needed; but only if they bring specific value.
   - Implement tests to cover all business-relevant logic.
   - Implement the code needed.
6. **Quality**
   - Review the code against our coding standards (`CLAUDE.md`)
   - Execute the linter: `cd web/themes/custom/careerplus && npx eslint .`
   - Adjust if needed.
7. **Code Review**
   - Review your own code critically as a neutral senior peer software developer.
   - Adjust if needed.
8. **Code Review**
   - Wait after *every* iteration and *before* committing.
   - Let me review your code manually and ask for changes.
   - If changes affect the spec or architecture, update the files accordingly.
   - Don’t continue until I *explicitly* confirm.
9. **Publish**
   - Commit your code (conventional commit) and push `git push origin {branch}`.
   - Add a short description of what you did.
   - Repeat from step 4 ("Iterate"), but do not take the first, but the *next* iteration.
10. **Done**
   - Check against all requirements and definition of done.
   - Adjust if needed.
   - Go again through the steps "Quality", "Code Review" and "Publish".
   - Repeat until done.
