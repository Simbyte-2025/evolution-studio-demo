# Evolution Studio Sites Publish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validate the current Evolution Studio landing locally and publish the same mobile-first demo through GPT Sites.

**Architecture:** Keep `index.html` as the product source and add only a dependency-free build adapter that emits a Cloudflare Worker-compatible `dist/server/index.js`. The generated worker serves the current HTML and confirmed logo asset directly, while Sites metadata remains isolated in `.openai/hosting.json`.

**Tech Stack:** HTML/CSS, Python `unittest`, Node.js built-ins, Cloudflare Worker Fetch API, GPT Sites.

**Spec:** `AGENTS.md`

## Global Constraints

- Preserve the existing HTML/CSS/JS landing; do not migrate to a framework.
- Do not add backend, database, CMS, authentication, or npm dependencies.
- Keep the Vortexa reservation URL and `@evolution_barbercut` unchanged.
- Do not modify `reference/original-export/` or present unverified content as fact.
- Validate 375, 390, 430, and 768 px before publishing.

---

### Task 1: Remove the local browser error

**Files:**
- Modify: `index.html`
- Test: real-browser console against `http://localhost:4173/`

**Interfaces:**
- Consumes: `assets/reference/evolution-logo-instagram.jpeg`
- Produces: a valid favicon reference in the document head

- [ ] **Step 1: Reproduce the failing browser request**

Run the local server, open the page with Playwright, and record the 404 request for `/favicon.ico`.

- [ ] **Step 2: Add the smallest valid favicon declaration**

Add `<link rel="icon" type="image/jpeg" href="assets/reference/evolution-logo-instagram.jpeg">` to the document head.

- [ ] **Step 3: Verify the browser console is clean**

Reload the page in a new Playwright session and confirm zero console errors and warnings.

### Task 2: Add a dependency-free Sites build adapter

**Files:**
- Create: `tests/test_sites_build.py`
- Create: `scripts/build-sites.mjs`
- Create: `package.json`
- Generate: `dist/server/index.js`

**Interfaces:**
- Consumes: `index.html` and `assets/reference/evolution-logo-instagram.jpeg`
- Produces: `dist/server/index.js` exporting `{ fetch(request): Promise<Response> }`

- [ ] **Step 1: Write a failing integration test**

The test runs the build and imports the emitted worker, then verifies HTTP 200 for `/`, the confirmed logo path, and `/favicon.ico`; it also verifies HTTP 404 for an unknown route.

- [ ] **Step 2: Run the test and confirm the missing build fails**

Run `python3 -m unittest tests.test_sites_build -v` and confirm failure is caused by the absent build command.

- [ ] **Step 3: Implement the minimal build**

Create a Node built-in script that embeds the HTML and JPEG in a Worker-compatible ES module. Add an `npm run build` command with no packages or lockfile dependencies.

- [ ] **Step 4: Run the complete test suite**

Run `python3 -m unittest discover -s tests -v` and require all content and worker-route tests to pass.

### Task 3: Validate and publish the exact current source

**Files:**
- Create: `.openai/hosting.json`
- Generate: `dist/**`
- Generate outside the repository: a temporary deployment archive and temporary source mirror

**Interfaces:**
- Consumes: the validated workspace source and build output
- Produces: a private GPT Sites production deployment URL

- [ ] **Step 1: Validate the four required viewport widths**

Use Playwright at 375, 390, 430, and 768 px to confirm no horizontal overflow, no console errors, visible booking CTA, correct Vortexa links, and the confirmed Instagram handle.

- [ ] **Step 2: Create the Sites project and persist its opaque ID**

Call Sites creation once, then write only its returned `id` as `project_id` in `.openai/hosting.json`.

- [ ] **Step 3: Rebuild and package the validated state**

Run `npm run build`, use the Sites packaging helper, and inspect that the archive contains `dist/server/index.js` plus `dist/.openai/hosting.json`.

- [ ] **Step 4: Push an exact source mirror without altering the user's Git history**

Copy the current source to a temporary directory excluding `.git`, initialize a temporary repository, commit the copied state, and push its branch with the short-lived per-command Sites credential.

- [ ] **Step 5: Save, deploy, and verify the private version**

Save one version using the pushed commit SHA and packaged archive, deploy it with owner-only access, poll until `succeeded`, open the returned URL, and report that exact URL.
