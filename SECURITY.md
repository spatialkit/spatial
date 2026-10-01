# Security Policy

## Supported versions

Spatial is in `0.x`. Security fixes are released for the latest published minor version of each package only.

| Package | Supported |
|---------|-----------|
| `@spatial-kit/core` | latest `0.x` minor |
| `@spatial-kit/svg` | latest `0.x` minor |
| `@spatial-kit/react` | latest `0.x` minor |

## Reporting a vulnerability

**Do not open a public issue for security problems.**

Report vulnerabilities privately through GitHub:

1. Go to the [Security tab](https://github.com/spatialkit/spatial/security) of this repository.
2. Click **Report a vulnerability**.
3. Describe the issue, the affected package and version, and how to reproduce it.

You can expect:

- an acknowledgement within **7 days**;
- an assessment and, when confirmed, a plan for a fix;
- credit in the advisory once a fix is released, unless you prefer to stay anonymous.

Please give us reasonable time to release a fix before disclosing the issue publicly.

## Scope

The published packages have no production dependencies and do not perform network requests. Relevant reports include, for example:

- code paths that let untrusted entity data inject markup or scripts into the rendered SVG;
- issues in the published package contents or in the release pipeline (for example, a compromised build or publish workflow).

Vulnerabilities in development-only tooling (test runners, bundlers) that do not affect the published packages are best reported upstream to those projects.
