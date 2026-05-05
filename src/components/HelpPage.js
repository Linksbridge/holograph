import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Section = ({ id, icon, title, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="help-section" id={id}>
      <button className="help-section-toggle" onClick={() => setOpen(o => !o)}>
        <span className="help-section-icon">{icon}</span>
        <span className="help-section-title">{title}</span>
        <span className="help-section-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="help-section-body">{children}</div>}
    </div>
  );
};

const Step = ({ number, children }) => (
  <div className="help-step">
    <div className="help-step-number">{number}</div>
    <div className="help-step-content">{children}</div>
  </div>
);

const Tip = ({ children }) => (
  <div className="help-tip">
    <span className="help-tip-icon">💡</span>
    <span>{children}</span>
  </div>
);

const HelpPage = () => {
  const navigate = useNavigate();

  const toc = [
    { id: 'overview', label: 'What is Holograph?' },
    { id: 'create', label: 'Creating a Dashboard' },
    { id: 'add-content', label: 'Adding Charts & Content' },
    { id: 'connect-data', label: 'Connecting Your Data' },
    { id: 'filters', label: 'Using Filters' },
    { id: 'save-publish', label: 'Saving & Publishing' },
    { id: 'share', label: 'Sharing a Dashboard' },
  ];

  return (
    <div className="help-page">
      <div className="help-header">
        <button className="top-bar-back" onClick={() => navigate('/')}>
          ← Back to Dashboards
        </button>
        <h1 className="help-header-title">Help & How-Tos</h1>
        <p className="help-header-subtitle">
          Everything you need to build and share dashboards — no technical experience required.
        </p>
      </div>

      <div className="help-layout">
        <nav className="help-toc">
          <div className="help-toc-title">On this page</div>
          <ul className="help-toc-list">
            {toc.map(item => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="help-toc-link">{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="help-content">

          <Section id="overview" icon="📊" title="What is Holograph?">
            <p>
              Holograph is a dashboard builder. You create visual reports — charts, tables, and text —
              by dragging and dropping pieces onto a canvas. Once you're happy with how it looks,
              you publish it so others can view it.
            </p>
            <p>
              Dashboards pull their data from a source your team connects. Once connected, the charts
              update automatically whenever the data changes — you don't need to do anything.
            </p>
          </Section>

          <Section id="create" icon="➕" title="Creating a Dashboard">
            <Step number="1">
              From the home screen, click <strong>Create New Dashboard</strong>.
            </Step>
            <Step number="2">
              Give your dashboard a name and an optional description, then click <strong>Create</strong>.
            </Step>
            <Step number="3">
              The editor opens. You'll see a blank canvas in the middle, a toolbar at the top,
              and a panel of chart types on the left side.
            </Step>
            <Tip>
              Your dashboard is saved as a draft automatically as you work. Nothing is visible to others
              until you hit Publish.
            </Tip>
          </Section>

          <Section id="add-content" icon="🧩" title="Adding Charts & Content">
            <p>
              The left sidebar contains all the types of content you can add.
              To add something to your dashboard:
            </p>
            <Step number="1">
              Find the chart or content type you want in the left panel — bar chart, line chart,
              table, image, text, and more.
            </Step>
            <Step number="2">
              Drag it onto the canvas and drop it where you want it to appear.
            </Step>
            <Step number="3">
              Click the piece you just added to select it. A settings panel opens on the right
              where you can set a title, choose colors, pick which data to show, and more.
            </Step>
            <Step number="4">
              To move a piece, drag it by its title bar. To resize it, drag the handle in the
              bottom-right corner.
            </Step>
            <Tip>
              You can add as many pieces as you like. They stack and resize to fill the page.
            </Tip>
            <div className="help-content-types">
              <div className="help-content-type">
                <strong>Bar / Line / Pie charts</strong>
                <span>Compare values and show trends over time</span>
              </div>
              <div className="help-content-type">
                <strong>Table</strong>
                <span>Display rows of data in a grid with sortable columns</span>
              </div>
              <div className="help-content-type">
                <strong>Rich Text</strong>
                <span>Add headings, notes, or explanations using formatted text</span>
              </div>
              <div className="help-content-type">
                <strong>Image</strong>
                <span>Insert a logo, photo, or diagram by URL</span>
              </div>
            </div>
          </Section>

          <Section id="connect-data" icon="🔌" title="Connecting Your Data">
            <p>
              Each chart on your dashboard gets its data from a <strong>data source</strong> —
              usually a web address (URL) that your team sets up. This is how live data flows
              into your charts automatically.
            </p>
            <p><strong>To set up data connections for your whole account:</strong></p>
            <Step number="1">
              Click <strong>⚙️ Settings</strong> on the home screen (or in the top bar when editing).
            </Step>
            <Step number="2">
              Under <strong>Save Locations</strong>, paste in the URLs your technical team provided
              for saving, publishing, and loading dashboards.
            </Step>
            <Step number="3">
              Click <strong>Save Settings</strong>. These settings apply to all dashboards.
            </Step>
            <p style={{ marginTop: '16px' }}><strong>To connect data to a specific chart:</strong></p>
            <Step number="1">
              Click the chart on your canvas to select it.
            </Step>
            <Step number="2">
              In the settings panel on the right, find the <strong>Data</strong> section and
              paste in the URL or data source your team gave you for that chart.
            </Step>
            <Step number="3">
              The chart will refresh and show your data automatically.
            </Step>
            <Tip>
              Not sure what URL to use? Ask whoever manages your data or IT team.
              They can provide the right address for each data set you want to display.
            </Tip>
          </Section>

          <Section id="filters" icon="🔍" title="Using Filters">
            <p>
              Filters let viewers narrow down what the dashboard shows — for example,
              viewing only one region, time period, or product.
            </p>
            <p><strong>Adding a filter to your dashboard:</strong></p>
            <Step number="1">
              When editing a dashboard, look for the <strong>Filters</strong> area above the canvas.
            </Step>
            <Step number="2">
              Click <strong>Add Filter</strong> and choose which column in your data to filter by
              (for example, "Region" or "Month").
            </Step>
            <Step number="3">
              Viewers of your published dashboard will see a dropdown or list they can use to
              filter the data themselves.
            </Step>
            <Tip>
              Filters are optional. If your dashboard doesn't need them, you can skip this step entirely.
            </Tip>
          </Section>

          <Section id="save-publish" icon="🚀" title="Saving & Publishing">
            <p>
              There are two states for a dashboard: <strong>Draft</strong> and <strong>Published</strong>.
            </p>
            <div className="help-status-table">
              <div className="help-status-row">
                <span className="dashboard-card-badge draft">Draft</span>
                <span>Work in progress. Only visible to you in the editor. Not shared.</span>
              </div>
              <div className="help-status-row">
                <span className="dashboard-card-badge published">Published</span>
                <span>Live. Can be shared and embedded for others to view.</span>
              </div>
            </div>
            <p style={{ marginTop: '16px' }}><strong>To save your work as a draft:</strong></p>
            <Step number="1">Click <strong>💾 Save Draft</strong> in the top bar at any time.</Step>
            <p><strong>To publish your dashboard:</strong></p>
            <Step number="1">
              When you're ready to share, click <strong>🚀 Publish</strong> in the top bar.
            </Step>
            <Step number="2">
              The badge on your dashboard changes from "Draft" to "Published".
            </Step>
            <Tip>
              You can keep editing after publishing. Just save a draft of your changes,
              then republish when you're ready to update what viewers see.
            </Tip>
          </Section>

          <Section id="share" icon="↗" title="Sharing a Dashboard">
            <p>
              Once published, your dashboard can be previewed or shared in two ways:
            </p>
            <div className="help-share-options">
              <div className="help-share-option">
                <div className="help-share-option-title">👁️ Preview</div>
                <p>
                  Click <strong>Preview</strong> in the top bar to see exactly how your dashboard
                  looks to viewers, without leaving the editor.
                </p>
              </div>
              <div className="help-share-option">
                <div className="help-share-option-title">↗ Open in Viewer</div>
                <p>
                  Click <strong>Open in Viewer</strong> to open the dashboard in a full-screen
                  view. You can share this link with colleagues or embed it in another page.
                </p>
              </div>
            </div>
            <Tip>
              Need to embed the dashboard inside another website or application?
              Ask your technical team — they can use the Holograph Viewer package to embed
              any published dashboard with just a few lines of code.
            </Tip>
          </Section>

        </div>
      </div>
    </div>
  );
};

export default HelpPage;
