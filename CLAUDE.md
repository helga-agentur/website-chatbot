## Project overview
- **Backend**: Node.js, Chroma vector database, TypeScript
- **Frontend**: Decoupled
- **Testing**: Jest

## Setup
- See README

## Git workflow
- Use atomic commits.
- Branch naming: `feature/...`, `fix/...`, e.g. `feat/412-short-description`
- Use conventional commits:
  - Commit naming: `feat(module): short description of the commit (#issue)`
  - Ensure that commit messages are parseable
- Before merging:
  - tests pass
  - lint/format pass

## Architecture Basics
Prefer:
- Loosely coupled architecture.
- Clear, transparent and documented contracts.
- High testability and clear boundaries.
- Do One Thing per component / module / class / function. This is crucial.
- Use small pure functions. Avoid side effects.

## Working agreements
- Do not introduce new frameworks unless explicitly required.
- Do not refactor unrelated areas (keep diffs tight).
- If you change behavior, add/adjust tests.
- Prefer incremental improvements over large rewrites.
- Never commit secrets. Never log secrets.

## Coding standards

### TypeScript
- Keep your code as short as readable.
- Prefer functional style (.map) over loops.
- Keep functions short (<60 lines), compose them.
- Only expose what must be exposed; keep internals internal (prefer private methods/props)
- One responsibility per module/function/class; one per file
- Components should be accessible (ARIA, keyboard nav where relevant)
- Constants use camelCase, not SCREAMING_SNAKE_CASE (e.g. #myConst = 17)
- Always log or display errors – never fail or handle errors silently.

### Documentation
- Do not document what something does, but why it does it the way it does.
- Update the main README.md when needed.
- If a behavior is not obvious, add an inline comment above the block or line.

## Logging & Error Reporting
- Logs contain all relevant information needed for debugging.
- Never log PII, tokens, cookies, Authorization headers.

## Security
- Treat all user input as untrusted.

## Definition of Done
- Works locally
- Tests updated/created and passing
- Lint passing
- No secrets leaked
- No unrelated refactors
- Behavior documented if non-obvious




-----------------------------



These are our general Coding Standards:
Source: [Notion](https://www.notion.so/helga-agentur/Helga-Coding-Standards-06e47a7e42ab4fa7aec6cd05467cdc99)

# Language

1. English is the language for all code, comments, commits etc.
2. Take care of ortography 🤡.

# Security

1. Know and understand the [OWASP Top 10](https://owasp.org/www-project-top-ten/).

# Guidelines

1. Follow our guidelines – strictly: Because it saves us a lot of unnecessary discussions.
    1. [Javascript](https://github.com/airbnb/javascript) (exception: indent with 4 spaces)
    2. PHP
        1. [Drupal PHP Guidelines](https://www.drupal.org/docs/develop/standards/php).
        2. [Helga PHP Guidelines](https://www.notion.so/d322f1458a284f678283b6b7e431fa76?pvs=21)

# Quality

1. Try to know what you do before you start doing it.
2. There is good code and there is bad code. Strive for the former.
3. Good code is easily understandable, precise, self-explanatory.
4. Bad code is unstructured, over-engineered, complex.
5. Don’t repeat yourself. If you do, refactor.
6. Among similar solutions, [the simplest one is the best one](https://en.wikipedia.org/wiki/Occam%27s_razor).
7. If possible and economical, test automatically.
8. Couple things loosely.
9. Keep files short.
10. Review your code before you request a code review.

# Commits

1. [Commit atomically](https://en.wikipedia.org/wiki/Atomic_commit)

# Code Reviews

Code reviews are the best way of learning – for the reviewer as well as for the reviewee. Never take them personally: they’re not about you.

1. A pull request covers a cohesive area and a working feature.
2. Keep the scope of a pull request manageable.
3. Every line of code committed is reviewed by a peer (with very few exceptions, e.g. automatically generated YAML files).
4. The function is more important than the form. But often, the form defines the function. Review both. And take your time to do so.
5. Code reviews are about architectural and code quality; focus on it.
6. If you think you have a better or more modern solution, share it.
7. Bring up topics of discussion; but lead the discussions in person (especially team meetings), not in comments.
8. Short comments are not a reason to be pissed.
9. Don’t be a dick.

# Versioning

1. We use [semver](https://semver.org/).
Exception: For whole projects that don’t expose an API, [follow the dev process](https://docs.google.com/document/u/1/d/1fEEwPDUR1BEpy3t0zGmDlw4d0NvHg2iH-u0jep0xuhA/edit).

# Variables, Naming and Scopes

1. Prefer good variable, function and class names over comments. Each name is self-explanatory and as concise as possible.

    ```jsx
    // bad
    isRoot = true;
    // good
    doesCurrentUserHaveRootRole = true;
    ```

2. Don’t use different spellings of the same thing:

    ```jsx
    // in their combination bad
    const yt = …
    const youTube = …
    const youtube = …
    // good (because YouTube is the official name, T is uppercased)
    const youTube = …
    ```

3. Use the most limited scope possible.
*E.g. if you don’t access a variable from outside a method, use a local variable. If you don’t access a property from outside of a class, use a private property. In a function, don’t mutate outside data.*
4. Think in API terms: Only expose what absolutely needs to be exposed.
5. Keep imports as small as possible; this reduces the amount of code that needs to be loaded and executed.

    ```jsx
    // bad
    import path from 'path';
    path.basepath(file);
    // good
    import { basepath } from path;
    basepath(file);
    ```


# Comments

1. Don’t comment what’s obvious: it’s a waste of time for you writing and everybody reading it.

    ```jsx
    // Name of the attribute, defaults to null
    const attributeName = null;
    ```

2. Where code is not self-explanatory, let the code's readers know what it does through a comment.s
3. Where appropriate, use structured/semantic comments: mainly because it improves readability and defines reasonable standards (and not to generate docs):
    1. [JSDoc](https://jsdoc.app/) for JavaScript
    2. PHPDoc (ggf. via PHPStan) for PHP
4. No `// TODO` or `// FIXME` goes live, ever. Same for commented-out lines.
5. At the beginning of a file (be it a class, function, object etc.), give a high level overview of what it does.
6. Write a [README.md](http://README.md) for every repo and complex module. It explains what your code does and how it is used.
7. If multiple things play together in a non-obvious manner, provide a graphical explanation (e.g. Miro).
8. Whenever you document something outside of the code (e.g. Miro), link it in a comment.
9. If the reason for a piece of code is not obvious, that reason belongs in a comment.

    ```jsx
    /* Use setTimeout to make sure that the parent component that listens
    to the event fired here event is ready: it might be initialized *after*
    this component (e.g. if its JS definition is further down in the DOM
    compared to this component's definition */
    ```

10. Well written code is the best code comment.
11. If your language is not typed, annotate parameters and return values via structured comments.

    ```jsx
    @param {{ number[], { key: type[] }[]? }} attributeName
    @return {String?} - Name of the function to be called or null if not resolved.
    ```


# Linting

1. Every single line of Code committed is linted. Exception: Rare file types, e.g. `.toml`, `.csv`.

# Logging and Errors

1. An (internal) error log should contain everything that is needed to debug the error.

    ```jsx
    // bad
    log(’Invalid value')
    // good
    log('Expected variable "parentNodeId" to be of type number, got ${parentNodeId} instead.')
    ```

2. Make sure to not leak internal information in public error messages.

    ```jsx
    // bad
    Your Token ${secretTokenId} is invalid.
    ```

3. When displaying messages to a user, make them understandable and actionable:

    ```jsx
    // bad
    alert('Image upload failed')
    // better
    alert('The image could not be uploaded because it exceeds the maximum file size of 5MB. Reduce its file size and try again.')
    // best (solve the problem instead of displaying it)
    reduceFileSize(file, '5mb').then(upload)
    ```
