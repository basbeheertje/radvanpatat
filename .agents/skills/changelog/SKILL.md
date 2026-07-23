# Changelog Maintenance Skill

## Purpose

Keep `CHANGELOG.md` and `src/frontend/changelog.html` accurate, readable, and up to date whenever an AI agent changes the project.

This skill applies to all code changes, configuration changes, UI changes, bug fixes, performance improvements, security changes, integrations, migrations, and user-visible behavior changes.

The changelog is part of the deliverable. A task is not complete until the markdown source has been reviewed and, when applicable, updated, and `src/frontend/changelog.html` has been regenerated from it.

---

## Mandatory behavior

After completing a task, always determine whether the changes should be recorded in `CHANGELOG.md` and surfaced in `src/frontend/changelog.html`.

Update the changelog when the work includes one or more of the following:

- a new feature;
- a user-visible improvement;
- a bug fix;
- a change in behavior;
- a security improvement;
- a performance improvement;
- a new integration;
- a changed integration;
- a database or migration change;
- a configuration change that affects users, administrators, deployment, or operations;
- a notable accessibility improvement;
- a removed or deprecated feature;
- a breaking change;
- a notable internal technical improvement that maintainers should know about.

Do not update the changelog for changes that have no practical value for users or maintainers, such as:

- spelling-only changes in comments;
- formatting-only changes;
- code movement without behavioral impact;
- temporary debugging changes;
- generated files that do not represent a meaningful project change;
- test-only changes, unless they fix or document an important regression;
- dependency lockfile changes without a relevant functional, security, or compatibility impact.

When in doubt, prefer adding a concise changelog entry rather than omitting a meaningful change.

Treat `CHANGELOG.md` as the source of truth. Never hand-maintain release content in `src/frontend/changelog.html` without also updating `CHANGELOG.md`.

---

## Required workflow

For every task, follow this sequence:

1. Inspect the existing structure and styling of `src/frontend/changelog.html` and the current format of `CHANGELOG.md`.
2. Determine which completed changes are changelog-worthy.
3. Add the new entry to `CHANGELOG.md` in the correct chronological location.
4. Use the current git tag as the version section when that tag already exists in `CHANGELOG.md`.
5. If there is no current git tag or no matching version heading yet, update the existing `[Onuitgebracht]` section instead of inventing a release.
6. Prevent duplicate entries.
7. Regenerate `src/frontend/changelog.html` by running `node scripts/generate-changelog-html.mjs`.
8. Validate that the resulting HTML remains valid and readable.
9. Mention the changelog update in the final task summary.

Do not replace the entire changelog unless the task explicitly requires a redesign.

Do not invent changes that were not implemented.

Do not add planned, incomplete, speculative, or failed work to the changelog.

---

## Source of truth

Base changelog entries only on actual changes made during the current task.

Use these sources to determine what changed:

- the files modified during the task;
- the final diff;
- tests added or changed;
- migrations added;
- configuration changes;
- routes, endpoints, components, pages, jobs, or integrations changed;
- confirmed bug fixes and implemented behavior.

Before writing the changelog, review the final diff whenever possible.

Never rely only on the original user request, because the implementation may differ from the requested scope.

---

## Entry quality rules

Every changelog entry in `CHANGELOG.md` must be:

- concise;
- specific;
- understandable to a non-developer;
- written in the same language as the existing changelog;
- focused on the result rather than the implementation details;
- free of internal ticket numbers unless the existing changelog consistently includes them;
- free of unnecessary technical jargon;
- written in the past tense or completed form, matching the existing style.

Prefer describing what changed and why it matters.

Good examples:

- Added a guided introduction for first-time visitors.
- Fixed an issue where the roulette wheel could stop on the wrong result.
- Improved the mobile layout of the result screen.
- Added an option to restart the product tour from the help page.
- Improved keyboard navigation and screen-reader feedback.

Avoid vague entries such as:

- Updated code.
- Fixed bugs.
- Improved styling.
- Made several changes.
- Refactored things.

---

## Recommended categories

Use the categories already present in `CHANGELOG.md`.

If the changelog has no established categories, use only the categories that are relevant:

- Added
- Changed
- Improved
- Fixed
- Security
- Deprecated
- Removed
- Breaking changes

Do not create empty categories.

Do not create a new category when an existing one fits.

---

## Date and version rules

Follow the existing changelog convention.

If entries are grouped by date:

- use the current local date;
- reuse an existing section for the current date when present;
- do not create multiple sections for the same date.

If entries are grouped by version:

- prefer the section that matches the current git tag when one exists and the task belongs to that released version;
- otherwise add entries only to an existing unreleased section unless a release version was explicitly provided;
- do not invent or increment a version number;
- do not mark a release as published unless the task explicitly includes the release.

If neither versions nor dates are present, preserve the current ordering and add the newest change first.

Use ISO dates (`YYYY-MM-DD`) only when no existing date format is established.

---

## HTML editing rules

When editing `src/frontend/changelog.html`:

- preserve the current document structure;
- preserve indentation and formatting conventions;
- preserve existing CSS classes and semantic markup;
- escape special HTML characters;
- keep headings hierarchical and valid;
- use list items for individual changes when the existing file uses lists;
- do not insert Markdown into the HTML file;
- do not add inline CSS unless the file already uses it and the new entry requires it;
- do not add JavaScript for a changelog-only update unless the task explicitly changes the reusable changelog UI or generation flow;
- do not rewrite unrelated historical entries;
- do not alter existing dates, versions, or descriptions unless correcting an obvious error is part of the task.

If the changelog contains machine-readable metadata, structured data, filters, anchors, or data attributes, preserve and update them consistently.

---

## Duplicate prevention

Before adding an entry:

1. Search the current date, version, or unreleased section.
2. Check whether the same change is already described.
3. Merge overlapping descriptions into one clear entry.
4. Avoid repeating the same change under multiple categories.

A changed implementation does not require a second entry when the user-visible result is the same.

---

## Grouping multiple changes

Create separate entries when changes have distinct user-visible outcomes.

Combine changes when they are small parts of the same outcome.

Example of appropriate grouping:

- Added a first-time product tour with options to skip it, postpone it, or restart it later from the help page.

Avoid splitting this into four nearly identical entries.

For a large task, use multiple concise entries rather than one long paragraph.

---

## Breaking and security changes

Clearly label breaking changes.

A breaking-change entry must explain:

- what changed;
- who or what is affected;
- what action is required, if any.

Security entries must be informative without exposing exploit instructions, secrets, credentials, or sensitive implementation details.

Good security example:

- Improved validation of uploaded files to block unsupported and potentially unsafe file types.

---

## Failure handling

If `CHANGELOG.md` does not exist:

- do not silently create a new changelog unless the task or repository instructions require it;
- report that the expected markdown source is missing;
- create it only when the task explicitly requires a changelog source of truth.

If `src/frontend/changelog.html` does not exist:

- do not silently invent a one-off HTML structure;
- regenerate it from `CHANGELOG.md` using `node scripts/generate-changelog-html.mjs`;
- only hand-create the page when the task explicitly requires the initial changelog frontend to be introduced.

If the HTML structure is malformed:

- make the smallest safe correction needed to add the entry;
- do not redesign the entire file;
- report significant structural problems in the final summary.

If the agent cannot confidently determine the correct section:

- inspect repository instructions and recent entries;
- use the best matching existing convention;
- do not invent a version or release date.

---

## Completion checklist

Before finishing a task, verify all of the following:

- [ ] The final implementation was reviewed.
- [ ] Changelog-worthy changes were identified.
- [ ] `CHANGELOG.md` was updated when required.
- [ ] `src/frontend/changelog.html` was regenerated when required.
- [ ] The entry describes only completed work.
- [ ] The entry matches the language and style of the existing changelog.
- [ ] No duplicate entry was added.
- [ ] No version number or release date was invented.
- [ ] The HTML structure remains valid.
- [ ] The changelog update is mentioned in the final response.

---

## Final response requirement

In the final response, include one of these statements:

When updated:

> Updated `CHANGELOG.md` and regenerated `src/frontend/changelog.html` with the completed changes.

When no update was necessary:

> Reviewed `CHANGELOG.md` and `src/frontend/changelog.html`; no update was needed because the task had no user-visible or maintainers-relevant impact.

When blocked:

> Could not update `CHANGELOG.md` and `src/frontend/changelog.html` because [specific reason].

Never claim the changelog was updated unless the file was actually changed.

---

## Agent instruction summary

Treat changelog maintenance as part of the definition of done.

Do not wait for the user to request a changelog update separately.

Every completed task must end with an explicit changelog review.

## Repository-specific rule

For this repository, always do the following after a changelog-worthy change:

1. Update `CHANGELOG.md`.
2. Add the change under the current git tag when that section exists, otherwise under `[Onuitgebracht]`.
3. Run `node scripts/generate-changelog-html.mjs`.
4. Verify that `src/frontend/changelog.html` now contains the updated version article.
