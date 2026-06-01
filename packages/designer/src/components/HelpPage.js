import React, { useState } from 'react';

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

const HelpPage = ({ onBack }) => {
  const toc = [
    { id: 'overview',      label: 'What is Holograph?' },
    { id: 'create',        label: 'Creating a Dashboard' },
    { id: 'add-content',   label: 'Adding Charts & Content' },
    { id: 'connect-data',  label: 'Connecting Your Data' },
    { id: 'file-sources',  label: 'Uploading Files as Data Sources' },
    { id: 'join-sources',  label: 'Joining Multiple Tables' },
    { id: 'filters',       label: 'Using Filters' },
    { id: 'save-publish',  label: 'Saving & Publishing' },
    { id: 'share',         label: 'Sharing a Dashboard' },
    { id: 'security',      label: 'Security Rules & Roles' },
  ];

  return (
    <div className="help-page">
      <div className="help-header">
        <button className="top-bar-back" onClick={onBack}>
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
            <Step number="1">Click the chart on your canvas to select it.</Step>
            <Step number="2">
              In the settings panel on the right, find the <strong>Data</strong> section and
              paste in the URL or data source your team gave you for that chart.
            </Step>
            <Step number="3">The chart will refresh and show your data automatically.</Step>
            <Tip>
              Not sure what URL to use? Ask whoever manages your data or IT team.
              They can provide the right address for each data set you want to display.
            </Tip>
          </Section>

          <Section id="file-sources" icon="📂" title="Uploading Files as Data Sources">
            <p>
              You can upload CSV or Excel files directly into Holograph and use them as data sources
              for your charts and tables — just like a database table.
              This is useful for one-off reports, data you receive by email, or anything you want
              to visualize without connecting a full database.
            </p>

            <p style={{ marginTop: '16px' }}><strong>Setting up file uploads (first time only):</strong></p>
            <Step number="1">
              Click <strong>⚙️ Settings</strong> and open the <strong>📂 Files</strong> tab.
            </Step>
            <Step number="2">
              Your technical team will provide three URLs — paste them into <strong>Upload File URL</strong>,
              <strong>File Data URL</strong>, and <strong>List Files URL</strong>.
            </Step>
            <Step number="3">
              Click <strong>Save Settings</strong> to store the URLs.
            </Step>

            <p style={{ marginTop: '16px' }}><strong>Uploading a file:</strong></p>
            <Step number="1">
              Go to <strong>⚙️ Settings → 📂 Files</strong>.
            </Step>
            <Step number="2">
              Click <strong>Choose File</strong> and select a CSV or Excel file from your computer.
            </Step>
            <Step number="3">
              The file is parsed in your browser and uploaded automatically.
              You'll see a confirmation with the file name and row count.
            </Step>
            <Step number="4">
              Click <strong>Save Settings</strong>. The file is now available as a table in all your dashboards.
            </Step>

            <p style={{ marginTop: '16px' }}><strong>Using an uploaded file in a chart:</strong></p>
            <Step number="1">Click any chart or table on the canvas to select it.</Step>
            <Step number="2">
              In the properties panel on the right, open the <strong>Table</strong> dropdown.
              Your uploaded file appears by name alongside any database tables.
            </Step>
            <Step number="3">Select it, then choose your label and value columns as usual.</Step>

            <div className="help-content-types" style={{ marginTop: '16px' }}>
              <div className="help-content-type">
                <strong>CSV (.csv)</strong>
                <span>Comma-separated values. First row must be column headers.</span>
              </div>
              <div className="help-content-type">
                <strong>Excel (.xlsx, .xls)</strong>
                <span>Excel workbooks. First sheet is used; first row must be headers.</span>
              </div>
            </div>

            <Tip>
              Uploaded files are stored on the server — they stay available across sessions
              and can be used in any dashboard, not just the one you're currently editing.
            </Tip>
            <Tip>
              To stop using a file, go to Settings → Files and click <strong>Remove</strong> next to it.
              This removes it from your settings; it does not delete the file from the server.
            </Tip>
          </Section>

          <Section id="join-sources" icon="🔗" title="Joining Multiple Tables">
            <p>
              Sometimes the data you need for a chart lives across more than one table.
              For example, order totals might be in an <em>orders</em> table while customer
              names are in a <em>customers</em> table. <strong>Data Sources</strong> let you
              combine tables with a join, then use the result just like any other table
              when building charts.
            </p>

            <p style={{ marginTop: '16px' }}><strong>Creating a joined data source:</strong></p>
            <Step number="1">
              Click <strong>🔗 Data Sources</strong> in the editor toolbar to open the Data Sources panel.
            </Step>
            <Step number="2">
              Click <strong>＋ Add Data Source</strong> and give it a descriptive name —
              for example, <em>Orders with Customers</em>.
            </Step>
            <Step number="3">
              Choose your <strong>base table</strong>. This is the starting table — all other
              tables will be joined onto it.
            </Step>
            <Step number="4">
              Click <strong>＋ Add Join</strong> to attach another table. For each join, choose:
              the table to join, how to join it (see join types below), and which column in each
              table links them together.
            </Step>
            <Step number="5">
              Repeat step 4 for each additional table you need.
              Click <strong>Save</strong> when done.
            </Step>

            <p style={{ marginTop: '16px' }}><strong>Using a joined data source in a chart:</strong></p>
            <Step number="1">
              Click a chart on the canvas to select it and open the properties panel.
            </Step>
            <Step number="2">
              In the <strong>Table</strong> dropdown, your named data source appears alongside
              all regular tables. Select it.
            </Step>
            <Step number="3">
              Choose your label and value columns from the combined column list — columns from
              all joined tables are available.
            </Step>
            <Tip>
              One joined data source can power as many charts as you like — define it once,
              reuse it everywhere on the dashboard.
            </Tip>

            <p style={{ marginTop: '16px' }}><strong>Join types:</strong></p>
            <div className="help-content-types">
              <div className="help-content-type">
                <strong>Inner Join</strong>
                <span>Only rows that have a match in both tables. Unmatched rows are dropped.</span>
              </div>
              <div className="help-content-type">
                <strong>Left Join</strong>
                <span>All rows from the base table, with matching data from the joined table where available. Unmatched joined rows are blank.</span>
              </div>
              <div className="help-content-type">
                <strong>Right Join</strong>
                <span>All rows from the joined table, with matching data from the base table where available.</span>
              </div>
              <div className="help-content-type">
                <strong>Full Join</strong>
                <span>All rows from both tables. Where there is no match, the missing side is blank.</span>
              </div>
            </div>

            <Tip>
              If two tables have a column with the same name (like <em>id</em>), Holograph
              prefixes them automatically — e.g. <em>orders.id</em> and <em>customers.id</em> —
              so they stay distinct in the column picker.
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
            <Step number="1">When you're ready to share, click <strong>🚀 Publish</strong> in the top bar.</Step>
            <Step number="2">The badge on your dashboard changes from "Draft" to "Published".</Step>
            <Tip>
              You can keep editing after publishing. Just save a draft of your changes,
              then republish when you're ready to update what viewers see.
            </Tip>
          </Section>

          <Section id="share" icon="↗" title="Sharing a Dashboard">
            <p>Once published, your dashboard can be previewed or shared:</p>
            <div className="help-share-options">
              <div className="help-share-option">
                <div className="help-share-option-title">👁️ Preview</div>
                <p>
                  Click <strong>Preview</strong> in the top bar to see exactly how your dashboard
                  looks to viewers, without leaving the editor.
                </p>
              </div>
            </div>
            <Tip>
              Need to embed the dashboard inside another website or application?
              Ask your technical team — they can use the Holograph Viewer package to embed
              any published dashboard with just a few lines of code.
            </Tip>
          </Section>

          <Section id="security" icon="🔒" title="Security Rules & Roles">
            <p>
              Dashboards often contain information that shouldn't be visible to everyone.
              A sales dashboard might have revenue figures that only managers should see,
              or HR data that only certain teams should access — even though the dashboard
              itself is shared broadly.
            </p>
            <p>
              Holograph handles this through <strong>security rules</strong>. A rule says:
              "this data can only be seen by people with this role." When someone views
              the dashboard, the system checks their role and hides any charts they're
              not allowed to see — replacing them with a locked placeholder.
            </p>
            <p>
              A <strong>role</strong> is just a label that represents a group of people —
              for example <em>admin</em>, <em>sales-manager</em>, or <em>finance</em>.
              Your technical team assigns roles to users in whatever authentication system
              you use. Holograph's job is simply to enforce them on the dashboard side.
            </p>
            <p>
              Rules are tied to <strong>data</strong>, not to individual charts. You write a rule
              against a datasource, a table, or even a specific column — and it automatically
              applies to every chart on every dashboard that pulls from that data.
              This means you define access once and it's enforced everywhere, without
              having to configure each chart individually.
            </p>
            <p>
              Rules are additive: a chart is visible if <em>any</em> matching rule includes
              the viewer's role. If no rules match a chart's data at all, the chart is
              visible to everyone.
            </p>

            <p style={{ marginTop: '16px' }}><strong>Opening Security Rules:</strong></p>
            <Step number="1">
              Click <strong>🔒 Security</strong> on the home screen or in the top bar while editing a dashboard.
            </Step>
            <Step number="2">
              The Security Rules panel slides in from the right.
            </Step>

            <p style={{ marginTop: '16px' }}><strong>Adding a rule:</strong></p>
            <Step number="1">
              Click <strong>＋ Add Rule</strong> at the bottom of the rules list.
            </Step>
            <Step number="2">
              Fill in the <strong>Datasource</strong> field — this must match the database name
              configured in your settings. Optionally narrow the rule to a specific
              table or column.
            </Step>
            <Step number="3">
              In the <strong>Roles</strong> field, type a role name and press Enter to add it.
              You can add as many roles as needed. Only users with one of these roles will see
              the matched charts.
            </Step>
            <Step number="4">
              Click <strong>💾 Save Rules</strong> to persist your changes.
            </Step>

            <p style={{ marginTop: '16px' }}><strong>Rule scope:</strong></p>
            <div className="help-content-types">
              <div className="help-content-type">
                <strong>Datasource only</strong>
                <span>Restricts all charts connected to that entire database</span>
              </div>
              <div className="help-content-type">
                <strong>Datasource + Table</strong>
                <span>Restricts only charts pulling from that specific table</span>
              </div>
              <div className="help-content-type">
                <strong>Datasource + Table + Column</strong>
                <span>Restricts only charts using that specific column</span>
              </div>
            </div>

            <p style={{ marginTop: '16px' }}><strong>Previewing as a role:</strong></p>
            <Step number="1">
              Open the <strong>👁️ Preview</strong> for any dashboard.
            </Step>
            <Step number="2">
              If security rules exist, a <strong>View as</strong> dropdown appears at the top.
              Select a role to simulate what that role sees — restricted charts show a locked placeholder.
            </Step>

            <Tip>
              Available roles are loaded from your security config and appear as suggestions
              when adding roles to a rule. You can manage the list of available roles directly
              in the Security Rules panel under <strong>Available Roles</strong>.
            </Tip>
            <Tip>
              Rules are stored centrally and apply across all dashboards that share the same datasource.
            </Tip>
          </Section>

        </div>
      </div>
    </div>
  );
};

export default HelpPage;
