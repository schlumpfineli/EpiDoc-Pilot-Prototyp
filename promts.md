// 1. ull Repository Audit (Recurring Global Check):
Perform a full repository audit for a healthcare application.
Security and privacy are highest priority.

Scope:
PHP, TypeScript/TSX, JavaScript, CSS, Blade templates, Markdown/MDX, HTML, Shell, SQLite/SQL, XML, TOML, JSON.

Instructions:
- Do NOT modify code.
- Identify risks and improvement areas.
- Prioritize findings as:
  P0 = Critical
  P1 = High
  P2 = Medium
  P3 = Low

For each finding include:
- File/path and location (if possible)
- Risk explanation
- Concrete fix suggestion
- Effort estimate (S/M/L)

Review Categories:
1. Data & Privacy (PII/PHI handling, minimization, storage, deletion)
2. Authentication & Authorization (roles, privilege escalation, session/token handling)
3. Input Validation & Output Encoding (SQL injection, XSS, command injection, file uploads)
4. Cryptography & Secrets (password hashing, key management, ENV usage)
5. Logging & Error Handling (no sensitive data exposure)
6. Database Safety (constraints, transactions, prepared statements)
7. API Security (CSRF, CORS, rate limiting)
8. Frontend Security (unsafe rendering, DOM injection, MDX risks)
9. Supply Chain & Configuration
10. Code Quality & Structural Issues

Output Format:
A) Executive Summary (max 12 bullet points)
B) Prioritized findings list (P0–P3)
C) 3-Phase Refactor Roadmap
D) Open questions (if needed)


// 2. Minimal-Invasive Refactoring Prompt:
Refactor the last code with minimal invasiveness.

Goals:
- No functional changes (except obvious bug fixes, clearly explained)
- Improve readability and structure
- Reduce duplication
- Clarify responsibilities
- Maintain or improve security posture

Strict Rules:
- No new dependencies
- No business logic changes
- No removal of validation
- No hidden side effects
- Prefer early returns
- Use explicit types where possible
- No sensitive data in logs

Output:
1. Summary of improvements (max 8 bullet points)
2. Refactored full code
3. Potential risks or assumptions


//3. Security Review for a PR / Diff
Perform a focused security review of these changes.

Check specifically:
- Authentication & authorization logic
- Input validation
- Output encoding (XSS risks)
- SQL injection risks
- CSRF exposure
- Secrets handling
- Logging of sensitive data
- File uploads
- Rate limiting

Output:
- Risk
- Why it matters
- Concrete fix
- Priority (P0–P3)


//4.Backend (PHP) Security Check
Review backend PHP code for:

- Request validation completeness
- Prepared statements (SQL injection prevention)
- Transaction handling
- File upload safety
- Path traversal
- Command execution
- Deserialization risks
- Error exposure

Do not suggest new dependencies unless absolutely necessary.
Provide concrete, framework-neutral fixes.


// 5. Frontend (TS/TSX + Blade) XSS Review
Review frontend and Blade templates for XSS risks.

Check:
- Raw HTML rendering
- dangerouslySetInnerHTML
- Unescaped Blade output
- MDX/Markdown rendering
- Redirect and URL handling
- Client-side auth guards
- localStorage usage for sensitive data

Provide safe rendering patterns and concrete improvement suggestions.


6. Logging & Privacy Review
Scan for possible exposure of PII/PHI in:

- Logs
- Error messages
- Debug output
- Monitoring/analytics
- API responses

Suggest a redaction strategy.
List specific fields that should never be logged.


// 7. Secrets & Configuration Hygiene
Review repository for:

- Hardcoded secrets
- API keys
- Tokens
- Insecure defaults
- ENV misconfiguration
- Missing secret rotation strategy

Provide remediation steps.
Mark urgent rotation cases clearly.

Suggest a redaction strategy.
List specific fields that should never be logged.


//8. SQLite / SQL Integrity Review
Review SQLite schema and queries for:

- Missing constraints (NOT NULL, UNIQUE, FK)
- Transaction boundaries
- Index usage
- Data consistency risks
- Race conditions
- Unsafe raw queries

Provide safe migration-friendly fixes.

// 9. Structural & Architecture Review
Evaluate folder structure and separation of concerns.

Goal:
- Clear boundaries
- Easy refactoring
- Maintainable modules
- Testable components

Provide:
- Target structure proposal
- Incremental migration plan (small safe steps)


//10. Test Gap Analysis
Identify critical missing tests.

Focus on:
- Authorization checks
- Input validation
- Data integrity
- Security regressions
- Error handling

Provide a prioritized test list with:
- What to test
- Why it matters
- Suggested test type (unit/integration)



