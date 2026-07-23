# Project instructions for AI coding agents

## Git workflow conventions

- New features must use branch names starting with `feat/`.
- Fixes must use branch names starting with `fix/`.
- Refactoring must use branch names starting with `refactor/`.

## Commit message conventions

- Fixes must start with `fix:`.
- Features must start with `feat:`.
- Documentation changes must start with `docs:`.
- Refactoring must start with `refactor:`.
- Tests added must start with `test:`.

## i18n conventions

- When adding a new text, ensure translations are added for English, Spanish, Polish, German, and Dutch.
- Do not hardcode user-facing text when the project provides an internationalization mechanism.
- Keep translation keys clear, stable, and descriptive.

## Language conventions

- English is the default language for code, identifiers, comments, commit messages, documentation, and other technical artifacts unless a task explicitly requires another language.
- User-facing text must follow the language and localization conventions of the project.
- Comments should explain why something exists, not merely repeat what the code does.

## Security conventions

For security conventions see [SECURITY.md](SECURITY.md).

## Contributing

For contributing guidelines see [CONTRIBUTING.md](CONTRIBUTING.md).

## Quality conventions

- Keep code simple, explicit, and maintainable.
- Prefer readable code over clever code.
- Avoid unnecessary abstraction.
- Follow the existing architecture, naming conventions, formatting, and patterns of the project.
- Do not introduce unrelated changes.
- Do not remove existing validation, authorization, logging, tests, translations, or error handling unless explicitly required and safely replaced.
- Update documentation when behavior, configuration, commands, public APIs, or developer workflows change.
- Add or update tests when behavior changes.