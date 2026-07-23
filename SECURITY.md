# Security Policy

## English

Please do not report security vulnerabilities through public GitHub issues.

If you discover a security issue, please report it privately by email: security@decodekas.nl

When reporting a vulnerability, please include as much information as possible, such as:

- A clear description of the issue
- Steps to reproduce the issue
- The potential impact
- The affected environment, version, branch, or component
- Relevant screenshots, logs, or example requests, if applicable

We will review your report as soon as possible and take appropriate action.

Please do not disclose the vulnerability publicly until it has been investigated and, where necessary, resolved.

## Dutch
Meld beveiligingsproblemen niet via openbare GitHub issues.

Stuur beveiligingsmeldingen naar: security@decodekas.nl

Vermeld indien mogelijk:
- beschrijving van het probleem
- stappen om het te reproduceren
- impact
- betrokken omgeving

## Security conventions

All code and configuration changes must follow secure-by-default principles and must be reviewed against the OWASP Top 10.

Security is not optional. A task is not complete if the implementation introduces avoidable security weaknesses, insecure defaults, missing authorization checks, unsafe input handling, sensitive data exposure, or insufficient error handling.

### General security principles

- Always design and implement features with security in mind.
- Prefer secure defaults over configurable insecure behavior.
- Deny access by default and explicitly allow only what is required.
- Apply the principle of least privilege.
- Validate all external input before use, storage, rendering, querying, execution, logging, or forwarding to other systems.
- Never trust data from users, browsers, clients, APIs, webhooks, files, databases, queues, environment variables, or third-party systems without validation.
- Prefer well-maintained framework features and standard libraries over custom security implementations.
- Do not implement custom cryptography, authentication, authorization, session handling, or password hashing unless explicitly required and reviewed.
- Do not expose implementation details, stack traces, secrets, tokens, internal paths, SQL queries, infrastructure details, or sensitive configuration values to end users.
- Never store secrets, passwords, API keys, private certificates, access tokens, refresh tokens, or credentials in source code.
- Do not add new dependencies unless they are necessary, justified, and reviewed.

### OWASP Top 10 review

For every change, review whether the implementation is affected by any of the following risk categories:

- Broken Access Control
- Cryptographic Failures
- Injection
- Insecure Design
- Security Misconfiguration
- Vulnerable and Outdated Components
- Identification and Authentication Failures
- Software and Data Integrity Failures
- Security Logging and Monitoring Failures
- Server-Side Request Forgery

If a change touches authentication, authorization, user data, personal data, payments, files, external integrations, admin functionality, APIs, logging, sessions, redirects, or configuration, the security review is mandatory.

### Access control

- Every protected action must have an explicit authorization check.
- Authentication alone is not sufficient. Always verify whether the authenticated user is allowed to perform the requested action.
- Authorization must be enforced on the server side.
- Never rely only on frontend checks, hidden fields, disabled buttons, route visibility, or client-side state.
- Prevent insecure direct object references by verifying access to every requested object, record, tenant, file, or resource.
- Users must not be able to access or modify data from another user, organization, tenant, workspace, project, account, or context unless explicitly allowed.
- Administrative functionality must require explicit administrative permissions.
- Bulk actions, exports, imports, status changes, role changes, impersonation, and destructive actions require extra authorization checks.
- Do not accept role, permission, tenant, organization, ownership, or identity claims from client-controlled input unless verified server-side.
- Default behavior must be deny-by-default.

### Input validation

- Validate all input from external sources.
- Use allowlists where possible instead of blocklists.
- Validate type, format, length, range, required fields, enum values, identifiers, and business rules.
- Reject unexpected fields where appropriate.
- Normalize input before validation when needed.
- Never assume that client-side validation is sufficient.
- Validate data again on the server side before processing, storing, querying, rendering, executing, logging, or forwarding it.
- Treat uploaded files as untrusted input.
- Treat webhook payloads and third-party API responses as untrusted input.

### Injection prevention

- Never concatenate untrusted input into SQL, NoSQL queries, shell commands, LDAP queries, XPath expressions, HTML, JavaScript, CSS, templates, URLs, system commands, or log output.
- Use parameterized queries, prepared statements, safe query builders, or ORM mechanisms.
- Avoid raw queries unless necessary.
- If raw queries are required, bind all parameters safely.
- Never pass untrusted input directly to command execution functions.
- Avoid dynamic code execution.
- Do not use `eval` or equivalent functionality with untrusted input.
- Do not deserialize untrusted data using unsafe deserialization mechanisms.
- Escape output according to the target context: HTML, attribute, JavaScript, CSS, URL, JSON, XML, SQL, shell, or log output.

### Authentication

- Use proven framework or platform authentication mechanisms where possible.
- Passwords must be hashed using a modern password hashing algorithm.
- Never store plaintext passwords.
- Never log passwords, password reset tokens, access tokens, refresh tokens, session IDs, API keys, authentication headers, or private credentials.
- Login, registration, password reset, and account recovery flows must avoid account enumeration.
- Authentication tokens must be random, unguessable, time-limited, and revocable where appropriate.
- Password reset tokens, invitation tokens, verification tokens, and magic links must expire.
- Apply rate limiting, throttling, or abuse protection to authentication-sensitive endpoints.
- Sessions and cookies must use secure settings appropriate for the deployment environment.
- Multi-factor authentication should be supported or preserved where applicable.

### Authorization

- Authorization must be enforced consistently on the server side.
- Do not assume that because a user can view a page, they can perform every action on that page.
- Verify permissions for read, create, update, delete, export, import, approve, reject, assign, and administrative actions separately where needed.
- Check object-level permissions, not only route-level permissions.
- Check tenant, organization, workspace, project, account, or ownership boundaries explicitly.
- Privilege escalation paths must be prevented.

### Cryptography and sensitive data

- Do not create custom cryptographic algorithms.
- Use established libraries and platform features for encryption, hashing, signing, and token generation.
- Use cryptographically secure random values for tokens, secrets, reset links, verification codes, and session identifiers.
- Protect sensitive data in transit using TLS.
- Protect sensitive data at rest when required.
- Store only the data that is necessary.
- Avoid exposing personal data, credentials, tokens, internal identifiers, or confidential business data unnecessarily.
- Mask or redact sensitive values in logs, errors, analytics, monitoring, and audit trails.
- Do not send sensitive data through URLs when avoidable.
- Do not include secrets in client-side code, public bundles, static files, or publicly accessible configuration.

### Error handling

- Do not expose stack traces, internal exception messages, SQL errors, framework errors, paths, environment variables, or infrastructure details to users.
- Show generic error messages to users.
- Log technical details server-side.
- Do not silently swallow exceptions.
- Handle expected errors explicitly.
- Avoid broad catch blocks unless they log the error and return a safe response.
- Failed security checks must fail closed, not open.
- Do not continue processing after failed validation, failed authorization, failed authentication, or failed integrity checks.

### Logging and monitoring

- Log security-relevant events, including:
    - login failures;
    - login successes where appropriate;
    - logout events where appropriate;
    - password reset requests;
    - password changes;
    - permission denials;
    - role or permission changes;
    - administrative actions;
    - data exports;
    - bulk updates;
    - failed validation for suspicious input;
    - webhook verification failures;
    - file upload rejections;
    - rate limit violations;
    - integrity check failures.
- Logs must contain enough context to investigate security events.
- Logs should include relevant identifiers such as user ID, tenant ID, organization ID, request ID, IP address, user agent, route, action, resource ID, and timestamp where appropriate.
- Do not log sensitive values.
- Do not log full tokens, passwords, private keys, payment details, authentication headers, or unnecessary personal data.
- Security logs should be structured where possible.
- Important security failures should be visible to monitoring or alerting systems where applicable.

### Security configuration

- Development settings must not be enabled in production.
- Debug mode must not be enabled in production.
- Test credentials, mock authentication, seed accounts, local-only bypasses, or development shortcuts must not be available in production.
- CORS must be restrictive and intentional.
- Security headers should be configured where applicable.
- Default credentials must never be used.
- Publicly accessible endpoints, files, directories, storage buckets, dashboards, admin panels, metrics, and documentation must be reviewed before exposure.
- Configuration should be environment-specific and should not require code changes for secrets or deployment-specific values.

### Dependency and supply chain security

- Do not add new dependencies unless necessary.
- Prefer actively maintained, widely used, and reputable packages.
- Avoid packages with unclear ownership, poor maintenance, suspicious install scripts, or unnecessary permissions.
- Lock dependency versions where appropriate.
- Do not ignore known critical or high vulnerabilities without documented justification.
- Do not execute remote scripts, installers, or generated code without review.
- Review dependency changes before committing lock files.
- Remove unused dependencies.

### File uploads and downloads

- Treat all uploaded files as untrusted.
- Validate file type, size, extension, content, and business rules.
- Do not trust MIME type or file extension alone.
- Store uploaded files outside executable paths where possible.
- Prevent path traversal.
- Generate safe server-side filenames.
- Do not allow users to control storage paths directly.
- Scan or inspect files where appropriate.
- Apply authorization checks before file download or preview.
- Avoid exposing private files through public URLs unless intentionally designed and time-limited.

### External requests, webhooks, and integrations

- Validate and sanitize all data received from external systems.
- Verify webhook signatures, secrets, tokens, or other authenticity mechanisms where available.
- Do not trust client-provided callback URLs without validation.
- Prevent server-side request forgery when making outbound requests based on user input.
- Restrict outbound requests to allowed hosts where possible.
- Use timeouts for external requests.
- Handle failed external requests safely.
- Do not leak internal service URLs, credentials, headers, or tokens to third parties.
- Do not forward authentication headers or cookies unless explicitly intended.

### Redirects and URLs

- Do not redirect users to untrusted URLs.
- Validate redirect targets using allowlists.
- Avoid accepting full redirect URLs from user input.
- Prefer relative paths for internal redirects.
- Do not include sensitive information in URLs.
- Validate and encode URL parameters correctly.

### API security

- API endpoints must enforce authentication and authorization where required.
- Do not expose more data than necessary.
- Apply pagination, limits, and filtering safeguards to list endpoints.
- Protect expensive endpoints from abuse.
- Validate request bodies, query parameters, path parameters, and headers.
- Use appropriate HTTP status codes without leaking sensitive details.
- Do not return internal models directly when this exposes sensitive or unnecessary fields.
- Use explicit response schemas, serializers, DTOs, resources, or response mappers where possible.
- Protect state-changing operations against CSRF where cookie-based authentication is used.
- Use rate limiting where appropriate.

### Data protection and privacy

- Collect and store only necessary data.
- Avoid exposing personal data unnecessarily in responses, logs, exports, analytics, or error messages.
- Apply access control to personal data.
- Provide safe handling for exports and bulk downloads.
- Ensure deleted, archived, inactive, or soft-deleted records are not accidentally exposed.
- Respect tenant, organization, user, workspace, account, and role boundaries.
- Apply retention, minimization, masking, and anonymization where appropriate.

### Frontend and client-side security

- Never store sensitive secrets in client-side code.
- Do not expose private environment variables to the client.
- Do not trust client-side state for authorization.
- Avoid rendering untrusted HTML.
- Sanitize HTML if rendering user-generated content is required.
- Prevent cross-site scripting by using safe rendering mechanisms and proper output encoding.
- Avoid placing tokens in local storage where safer alternatives are available.
- Do not expose internal API keys, service credentials, privileged configuration, or private endpoints in public bundles.

### Database security

- Use migrations or controlled schema changes.
- Do not store sensitive data unless required.
- Use appropriate indexes to avoid accidental denial-of-service through slow queries.
- Avoid exposing sequential identifiers where this creates enumeration risk, unless object-level authorization is enforced.
- Apply tenant, organization, account, ownership, or visibility filters consistently.
- Avoid destructive queries without explicit constraints.
- Backups, exports, debug dumps, and production data snapshots must not be committed to source control.

### Testing requirements

Security-sensitive changes should include tests where practical.

Add or update tests for:

- authorization rules;
- access to another user's, tenant's, organization's, workspace's, project’s, or account's data;
- invalid input;
- injection attempts;
- authentication failures;
- expired or invalid tokens;
- file upload validation;
- webhook verification;
- permission checks;
- error handling;
- data exposure in API responses;
- rate limiting or abuse protection where applicable.

A task is not complete when security-relevant behavior is changed without appropriate test coverage or documented justification.

### Required security review before completion

Before completing a task, verify:

- Does this change introduce or modify external input?
- Is all input validated server-side?
- Is output encoded for the correct context?
- Are database queries protected against injection?
- Are shell commands, dynamic code execution, and unsafe deserialization avoided?
- Is authentication required where needed?
- Is authorization enforced for the specific action and object?
- Are tenant, organization, account, workspace, project, ownership, or visibility boundaries protected?
- Are secrets kept out of source code and logs?
- Are errors handled without exposing internals?
- Are security-relevant events logged safely?
- Are new dependencies necessary and reviewed?
- Are files handled safely?
- Are external requests and webhooks verified?
- Are redirects safe?
- Are sensitive fields excluded from responses?
- Are tests added or updated where appropriate?

If any applicable check fails, the implementation must be fixed before the task is considered complete.

### Prohibited patterns

The following patterns are not allowed unless there is explicit justification and a safe implementation:

- Concatenating untrusted input into queries.
- Concatenating untrusted input into shell commands.
- Rendering untrusted HTML without sanitization.
- Returning internal error details to users.
- Logging passwords, tokens, secrets, authentication headers, or private credentials.
- Trusting client-side authorization checks.
- Accepting user-controlled roles, permissions, tenant IDs, organization IDs, ownership claims, or identity claims without server-side verification.
- Using weak hashing algorithms for passwords.
- Using predictable tokens.
- Using unsafe deserialization on untrusted data.
- Disabling TLS verification.
- Enabling debug mode in production.
- Adding dependencies without review.
- Creating public file access without authorization review.
- Silently swallowing exceptions.
- Failing open after a security check fails.

### Completion rule

If the implementation has known security limitations, they must be explicitly documented before completion.

The documentation must include:

- the risk;
- the affected code or feature;
- why it exists;
- the potential impact;
- the recommended mitigation;
- whether the issue blocks release.

Do not mark security-sensitive work as complete while known high-risk issues remain unresolved.