# Security Policy

## Supported versions

This project is in active development. Only the latest commit on `main` is
considered supported.

## Reporting a vulnerability

**Please do not open a public issue for security-sensitive reports.**

To report a vulnerability:

1. Use GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
   on this repository's **Security** tab, or
2. Contact the maintainer directly through their GitHub profile.

Please include:

- A description of the issue and its impact
- Steps to reproduce, or a proof-of-concept
- Affected versions / commit SHAs
- Any suggested mitigations

We will acknowledge receipt within a few days and work on a fix as soon as
practical. Please give us reasonable time to remediate before public disclosure.

## Scope

In scope:
- The server (Express API)
- The client (React app)
- Anything in this repository

Out of scope:
- Vulnerabilities in third-party dependencies (please report those upstream)
- Issues that require physical access to the user's machine

## Operational notes

- **Never commit `.env`** or any file containing real API keys. `.env*` is
  already in `.gitignore`.
- `recipes.json`, `pantry.json`, and `shopping.json` are user data — treat them
  as such if you fork or deploy.
- The `/api/ai-recipe` endpoint is rate-limited but **not authenticated**. Do
  not expose this server to the public internet without putting auth and
  additional rate limiting in front of it.
