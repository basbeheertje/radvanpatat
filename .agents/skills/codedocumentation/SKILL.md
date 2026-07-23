---
name: codedocumentation
description: Add and maintain rationale-focused comments in source code. Use whenever Codex creates, changes, fixes, refactors, or reviews code in this project, especially for business rules, state machines, asynchronous flows, lifecycle behavior, validation, fallbacks, and cross-layer contracts.
---

# Code Documentation

Document changed code so a future developer can understand why it exists without reconstructing the original ticket or debugging session.

## Core Rule

Add a rationale comment or documentation comment to every new or changed non-trivial field, method, branch, and processing block. Explain the intent, constraint, invariant, or workflow consequence. Do not limit comments to unusually complex code; document project-specific reasoning whenever it is not fully visible from the local statements.

For trivial declarations, generated code, translations, and repetitive mappings, document the owning group or invariant once instead of repeating the same comment on every line.

## Explain Why

Comments must capture one or more of these points when applicable:

- The business rule being enforced.
- The state represented by a field and which transitions set or clear it.
- Why an early return is required.
- Why operations must occur in a specific order.
- Why data must be retained temporarily instead of cleared immediately.
- Which UI action, API request, model event, database field, or external process depends on the code.
- Why a fallback exists and when it is reached.
- Why validation happens in both the client and server.
- Which race condition, lifecycle callback, retry, null response, or regression the code prevents.
- Why a constant, status value, or feature setting changes the path.

## Workflow

1. Read the surrounding implementation, callers, tests, and related API or model code before editing.
2. Identify the business and technical reason for every changed non-trivial block.
3. Add field comments for state that survives between callbacks, fragments, requests, threads, or lifecycle events.
4. Add method documentation for methods that coordinate workflows or have non-obvious preconditions and side effects.
5. Add inline comments immediately before order-sensitive decisions and state transitions.
6. Update or remove nearby comments that became stale because of the change.
7. Review the final diff specifically for undocumented intent before running tests.

## Comment Style

- Prefer comments that explain why over comments that repeat what the next statement does.
- Keep each comment close to the code it explains.
- Use complete, direct sentences.
- Match the language already used by the surrounding source file. Use English when the file has no clear convention.
- Mention concrete domain names such as `Orderhead`, collected carrier, expedition location, or `set_id` instead of vague terms such as "data" or "state".
- Describe the current contract, not the history of how the code was developed.
- Do not add ticket-only context unless the ticket identifier is already an established repository convention.
- Do not use comments to excuse avoidably confusing code. Simplify the implementation first when that can be done within scope, then document the remaining reason.

## Required Review

Before completing a code change, verify that:

- Every new state field explains its valid states and reset point.
- Every asynchronous callback or thread explains why work crosses that boundary.
- Every deliberate ordering dependency is documented before the first dependent operation.
- Every business-critical early return explains the invalid or already-completed state it protects.
- Client/server handoffs explain which side supplies and validates each important value.
- Comments still match the executed behavior after formatting, refactoring, and tests.

## Examples

Prefer:

```java
// Keep the set ID until the audit is stored because the audit uses it as its grouping key.
promptPalletAudit();
```

Avoid:

```java
// Prompt the pallet audit.
promptPalletAudit();
```
