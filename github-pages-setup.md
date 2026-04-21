# GitHub Pages Setup Guide

This guide covers how to deploy the Holograph dashboard designer and viewer to GitHub Pages.

## Prerequisites

- A GitHub account
- A GitHub repository with this project
- Git installed locally

---

## Step 1: Configure the Root package.json

Add the `homepage` field to tell React where the app will be hosted:

```json
{
  "name": "holograph",
  "version": "1.0.0",
  "homepage": "https://yourusername.github.io/repo-name",
  "private": true,
  ...
}
```

Replace `yourusername` and `repo-name` with your actual GitHub username and repository name.

---

## Step 2: Update Build Output Directory

Create or update `packages/designer/.env` (or use CI environment variable):

```
# For GitHub Pages, output to docs folder
BUILD_PATH=docs
```

Or set this in package.json scripts:

```json
"scripts": {
  "build": "BUILD_PATH=docs react-scripts build",
  ...
}
```

---

## Step 3: Configure the Viewer Package for Publishing

The viewer package needs to be built as a standalone app. Update `packages/viewer/package.json`:

```json
{
  "name": "@holograph/dashboard-viewer",
  "version": "1.0.0",
  "private": false,
  "homepage": "https://yourusername.github.io/repo-name/viewer",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build"
  },
  ...
}
```

---

## Step 4: Add GitHub Pages Deployment Script

Update the root `package.json` with deployment scripts:

```json
{
  "scripts": {
    "start": "cd packages/designer && npm start",
    "build": "npm run build:designer && npm run build:viewer",
    "build:designer": "cd packages/designer && npm run build",
    "build:viewer": "cd packages/viewer && npm run build",
    "deploy": "npm run build && gh-pages -d packages/designer/build",
    "deploy:viewer": "npm run build:viewer && gh-pages -d packages/viewer/build",
    ...
  },
  "devDependencies": {
    "gh-pages": "^6.1.0"
  }
}
```

Install gh-pages:
```bash
npm install --save-dev gh-pages
```

---

## Step 5: Create Viewer Entry Point

Create `packages/viewer/public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Dashboard Viewer - Holograph</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
```

Create `packages/viewer/src/index.js`:

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import DashboardViewer from './DashboardViewer';
import './styles/viewer.css';

// Demo dashboard for standalone viewer
const demoDashboard = {
  zones: [
    {
      id: 'zone-1',
      x: 0, y: 0, w: 6, h: 4,
      elements: [
        {
          id: 'chart-1',
          type: 'chart',
          chartType: 'bar',
          title: 'Sample Chart',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [{
              label: 'Sales',
              data: [12, 19, 3, 5, 2],
              backgroundColor: 'rgba(54, 162, 235, 0.5)'
            }]
          }
        }
      ]
    }
  ]
};

function ViewerApp() {
  // Get dashboard ID from URL query params
  const params = new URLSearchParams(window.location.search);
  const dashboardId = params.get('id');

  // In production, fetch dashboard by ID from your API
  // For now, show demo dashboard
  return (
    <div className="viewer-app">
      <DashboardViewer 
        dashboard={demoDashboard}
        editable={false}
      />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ViewerApp />);
```

---

## Step 6: Update Router for Multi-Page Setup

To have both designer and viewer accessible, update the root `src/index.js` or create a new router:

```javascript
// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import StandaloneViewer from './components/StandaloneViewer';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter basename="/repo-name">
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/viewer" element={<StandaloneViewer />} />
      <Route path="/viewer/:dashboardId" element={<StandaloneViewer />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
```

Note: You'll need to install react-router-dom:
```bash
npm install react-router-dom
```

---

## Step 7: Set Up GitHub Repository Settings

1. Go to your GitHub repository
2. Navigate to **Settings** → **Pages**
3. Under **Build and deployment**:
   - **Source**: Select "Deploy from a branch"
   - **Branch**: Select `gh-pages` / `root` (or `main` / `docs` if using that approach)
4. Click **Save**

---

## Step 8: Deploy

### Option A: Manual Deploy
```bash
npm run deploy
```

### Option B: Automatic Deploy with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          BUILD_PATH: docs
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: 'docs'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## Step 9: Access Your Deployed Apps

After deployment, your apps will be available at:

| App | URL |
|-----|-----|
| Designer | `https://yourusername.github.io/repo-name/` |
| Viewer | `https://yourusername.github.io/repo-name/viewer` |
| Viewer (with ID) | `https://yourusername.github.io/repo-name/viewer?id=dashboard-123` |

---

## Alternative: Use docs Folder Directly

Instead of gh-pages, you can use the `docs` folder approach:

1. Create a `docs` folder in the project root
2. After building, copy the build output to `docs`:
   ```bash
   npm run build
   cp -r packages/designer/build/* docs/
   ```
3. GitHub Pages will automatically serve from `docs/`
4. Update the homepage in package.json to your GitHub Pages URL

---

## Troubleshooting

### 404 Errors on Refresh
If you get 404 errors when refreshing pages, you need to configure your server to serve `index.html` for all routes. For GitHub Pages, add a `docs/404.html` or use HashRouter instead of BrowserRouter.

### Use HashRouter (Easier for GitHub Pages)
```javascript
import { HashRouter, Routes, Route } from 'react-router-dom';

<HashRouter>
  <Routes>
    <Route path="/" element={<App />} />
    <Route path="/viewer" element={<StandaloneViewer />} />
  </Routes>
</HashRouter>
```

Then access at:
- Designer: `https://yourusername.github.io/repo-name/#/`
- Viewer: `https://yourusername.github.io/repo-name/#/viewer`

### Base Path Issues
If assets don't load correctly, ensure the `homepage` field in package.json matches your actual GitHub Pages URL exactly.
