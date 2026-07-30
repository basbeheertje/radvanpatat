# Contributing

## Pull Request Requirements
Every pull request must meet the following requirements:

* The branch name follows the agreed naming convention
* The pull request clearly describes the change
* Related issues or tickets are linked where applicable
* Automated checks pass
* The code has been reviewed
* No secrets, credentials or environment-specific files are committed
* Database changes are documented
* Breaking changes are explicitly mentioned

Pull requests should be small enough to review effectively.

## Security

- Wijzigingen in code en configuratie moeten altijd voldoen aan de OWASP Top 10.
- Externe input moet altijd worden gevalideerd en gesanitized voordat deze wordt gebruikt, opgeslagen, gerenderd of doorgestuurd naar andere systemen.

## Coding conventions
### Language
All code must be written in English. This includes newly added function names,
variable names, type names, class names, file-local helpers, comments, and other
developer-facing identifiers.

All functions that are added must have English names.

### Comments
Some comments are categorized with a prefix – a tag, codetag or token.

Usable tags:
BUG, DEBUG — identifies a known bug, perhaps implying it should be fixed
FIXME — implies that there is work to do to fix a bug
HACK, BODGE, KLUDGE — marks a solution that might be considered low quality
TODO — describes some work to do
NOTE — relatively general information
UNDONE — a reversal or "roll back" of previous code

## Naming conventions
### Branch
The branch name should indicate the context of the branch. We use feature for features and fix for a fix. Below are the options:
feat/
fix/
build/
develop
docs/
main
style/
refactor/
release/
performance/
test/

### Commits
On [this](https://www.conventionalcommits.org/en/v1.0.0/) website you can find what has been agreed upon regarding commits.

A commit always begins with its content. It immediately indicates the structural content of the commit. Below are the possible descriptions:
fix:
feat:
BREAKING CHANGE:
build:
chore:
ci:
docs:
style:
refactor:
perf:
test:

### Changelog
When creating an new release we follow the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) convention.

Guiding Principles
- Changelogs are for humans, not machines.
- There should be an entry for every single version.
- The same types of changes should be grouped.
- Versions and sections should be linkable.
- The latest version comes first.
- The release date of each version is displayed.
- Mention whether you follow Semantic Versioning.

Types of changes
- Added: for new features.
- Changed: for changes in existing functionality.
- Deprecated: for soon-to-be removed features.
- Removed: for now removed features.
- Fixed: for any bug fixes.
- Security: in case of vulnerabilities.