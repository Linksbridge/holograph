# Releasing the Dashboard Viewer Package

## What is a Git Tag?

A tag is a named pointer to a specific commit — a snapshot in time. Unlike branches, tags don't move. They're used to mark release points (e.g. `viewer-v1.1.4`).

When you push a tag that matches `viewer-v*`, the GitHub Action automatically builds and publishes `@linksbridge/dashboard-viewer` to GitHub Packages. No manual publish step needed.

---

## How Tags Work Here

| Action | What Happens |
|--------|-------------|
| Push code to `main` | Nothing published — code change only |
| Push a `viewer-v*` tag | GitHub Action builds + publishes to GitHub Packages |
| Consumer runs `npm install` | Gets the latest published version |

---

## Releasing a New Version

### Step 1 — Make your changes

Make and commit your changes to the viewer package as normal:
```bash
git add .
git commit -m "your change description"
git push origin main
```

### Step 2 — Bump the version

Update the version in `packages/viewer/package.json`:
```json
"version": "1.1.5"
```

Follow semantic versioning:

| Change type | Example | Version bump |
|-------------|---------|-------------|
| Bug fix, small tweak | Fix a chart render issue | `1.1.4` → `1.1.5` (patch) |
| New feature, backwards compatible | Add new prop | `1.1.4` → `1.2.0` (minor) |
| Breaking change | Rename a required prop | `1.1.4` → `2.0.0` (major) |

Commit the version bump:
```bash
git add packages/viewer/package.json
git commit -m "bump viewer to 1.1.5"
git push origin main
```

### Step 3 — Create and push the tag

The tag name must match the version:
```bash
git tag viewer-v1.1.5
git push origin viewer-v1.1.5
```

### Step 4 — Confirm the Action ran

Go to the **Actions** tab in the holograph GitHub repo. You should see "Publish dashboard-viewer" running. Wait for the green checkmark.

### Step 5 — Update consumer projects

In any project using the package (e.g. Workspace), run:
```bash
npm install
```

Since Workspace uses `"latest"`, it will automatically pull the newest published version.

---

## Viewing Existing Tags

List all tags locally:
```bash
git tag
```

List tags with their commit messages:
```bash
git tag -n
```

View on GitHub: repo → **Releases** (tags appear there automatically).

---

## Deleting a Bad Tag

If you tagged the wrong commit:

```bash
# Delete locally
git tag -d viewer-v1.1.5

# Delete on remote
git push origin --delete viewer-v1.1.5
```

Then re-tag the correct commit and push again.

> **Note:** You cannot publish the same version number twice to GitHub Packages. If the Action ran and published before you deleted the tag, bump to the next patch version instead.

---

## Quick Reference

```bash
# Full release flow
git add packages/viewer/package.json
git commit -m "bump viewer to x.x.x"
git push origin main
git tag viewer-vx.x.x
git push origin viewer-vx.x.x
```
