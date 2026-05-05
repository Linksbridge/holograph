/**
 * Entry Point
 * 
 * React application bootstrap with routing for GitHub Pages
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import StandaloneViewer from './components/StandaloneViewer';
import HelpPage from './components/HelpPage';
import './styles/dashboard.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/viewer" element={<StandaloneViewer />} />
        <Route path="/viewer/:dashboardId" element={<StandaloneViewer />} />
        <Route path="/help" element={<HelpPage />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
