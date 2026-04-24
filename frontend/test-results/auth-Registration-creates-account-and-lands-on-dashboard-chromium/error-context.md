# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Registration >> creates account and lands on dashboard
- Location: e2e/auth.spec.ts:9:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/dashboard/
Received string:  "http://localhost:4201/register"
Timeout: 8000ms

Call log:
  - Expect "toHaveURL" with timeout 8000ms
    5 × unexpected value "http://localhost:4201/register"

```

```
Tearing down "context" exceeded the test timeout of 15000ms.
```