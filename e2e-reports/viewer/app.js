/* ═══════════════════════════════════════════════════════════════
   Cachink! E2E Report Viewer — vanilla JS, no build step.
   Loads runs-index.js (global) and per-run data.js (lazy).
   Works over file:// — no server needed.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── State ──────────────────────────────────────────────────
  let currentRunData = null;
  let runsIndex = null;
  let flakySet = new Set();
  let activeFilters = { status: null, area: null, flaky: false };
  let searchQuery = '';
  let charts = {};

  // ─── DOM refs ───────────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ─── Init ───────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    runsIndex = window.RUNS_INDEX || { runs: [], flaky: [] };
    flakySet = new Set(runsIndex.flaky || []);

    setupNav();
    setupRunSelector();
    setupSearch();
    setupLightbox();

    // Load most recent run
    if (runsIndex.runs.length > 0) {
      loadRun(runsIndex.runs[0].runId);
    } else {
      showEmptyState();
    }
  });

  // ─── Navigation ─────────────────────────────────────────────
  function setupNav() {
    $$('.nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const viewId = btn.dataset.view;
        switchView(viewId);
      });
    });

    $('#back-to-list').addEventListener('click', () => switchView('list-view'));
  }

  function switchView(viewId) {
    $$('.view').forEach((v) => v.classList.remove('active'));
    $(viewId.startsWith('#') ? viewId : `#${viewId}`).classList.add('active');

    $$('.nav-btn').forEach((b) => b.classList.remove('active'));
    const navBtn = $(`.nav-btn[data-view="${viewId}"]`);
    if (navBtn) navBtn.classList.add('active');
  }

  // ─── Run Selector ──────────────────────────────────────────
  function setupRunSelector() {
    const sel = $('#run-selector');
    sel.innerHTML = '';

    if (!runsIndex || runsIndex.runs.length === 0) {
      sel.innerHTML = '<option>No runs available</option>';
      return;
    }

    runsIndex.runs.forEach((run) => {
      const opt = document.createElement('option');
      opt.value = run.runId;
      const d = formatTimestamp(run.timestamp);
      const t = run.totals || {};
      opt.textContent = `${d} — ${run.runId} (${t.passed || 0}✓ ${t.failed || 0}✗ — ${run.passRate || 0}%)`;
      sel.appendChild(opt);
    });

    sel.addEventListener('change', () => loadRun(sel.value));
  }

  // ─── Load Run Data ─────────────────────────────────────────
  function loadRun(runId) {
    // Load data.js dynamically via script tag (works on file://)
    const existing = document.getElementById('run-data-script');
    if (existing) existing.remove();
    window.RUN_DATA = null;

    const script = document.createElement('script');
    script.id = 'run-data-script';
    script.src = `runs/${runId}/data.js`;
    script.onload = () => {
      currentRunData = window.RUN_DATA;
      if (currentRunData) {
        renderDashboard();
        renderTestList();
      }
    };
    script.onerror = () => {
      console.warn(`Could not load data for run: ${runId}`);
      showEmptyState();
    };
    document.body.appendChild(script);
  }

  // ─── Dashboard ─────────────────────────────────────────────
  function renderDashboard() {
    const d = currentRunData;
    if (!d) return;

    const t = d.totals;
    const passRate = d.passRate || 0;
    const durStr = formatDuration(t.durationMs);

    // Summary cards
    const cards = [
      { label: 'Total', value: t.total, cls: '' },
      { label: 'Passed', value: t.passed, cls: 'pass' },
      { label: 'Failed', value: t.failed, cls: 'fail' },
      { label: 'Skipped', value: t.skipped || 0, cls: 'skip' },
      { label: 'Duración', value: durStr, cls: '' },
      { label: 'Pass Rate', value: `${passRate}%`, cls: 'rate' },
    ];

    $('#summary-cards').innerHTML = cards
      .map(
        (c) => `
      <div class="summary-card">
        <div class="label">${c.label}</div>
        <div class="value ${c.cls}">${c.value}</div>
      </div>`,
      )
      .join('');

    // Donut chart
    renderDonutChart(t);

    // Feature area bar chart
    renderAreaBarChart(d.tests);

    // Trend chart
    renderTrendChart();

    // Flaky section
    renderFlakySection();
  }

  function renderDonutChart(totals) {
    if (charts.donut) charts.donut.destroy();
    const ctx = $('#donut-chart').getContext('2d');
    charts.donut = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Passed', 'Failed', 'Skipped'],
        datasets: [
          {
            data: [totals.passed, totals.failed, totals.skipped || 0],
            backgroundColor: ['#22c55e', '#ef4444', '#eab308'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 12 } } },
        },
        cutout: '65%',
      },
    });
  }

  function renderAreaBarChart(tests) {
    if (charts.areaBar) charts.areaBar.destroy();

    // Group by area
    const areas = {};
    tests.forEach((t) => {
      const area = t.featureArea || 'Sin categoría';
      if (!areas[area]) areas[area] = { passed: 0, failed: 0, skipped: 0 };
      areas[area][t.status] = (areas[area][t.status] || 0) + 1;
    });

    const labels = Object.keys(areas).sort();
    const passed = labels.map((a) => areas[a].passed);
    const failed = labels.map((a) => areas[a].failed);
    const skipped = labels.map((a) => areas[a].skipped);

    const ctx = $('#area-bar-chart').getContext('2d');
    charts.areaBar = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Passed', data: passed, backgroundColor: '#22c55e' },
          { label: 'Failed', data: failed, backgroundColor: '#ef4444' },
          { label: 'Skipped', data: skipped, backgroundColor: '#eab308' },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: { stacked: true, ticks: { color: '#64748b' }, grid: { color: '#1e293b' } },
          y: {
            stacked: true,
            ticks: { color: '#94a3b8', font: { size: 11 } },
            grid: { display: false },
          },
        },
        plugins: {
          legend: { position: 'top', labels: { color: '#94a3b8', font: { size: 11 } } },
        },
      },
    });
  }

  function renderTrendChart() {
    if (charts.trend) charts.trend.destroy();
    if (!runsIndex || runsIndex.runs.length < 2) {
      $('#trend-box').style.display = 'none';
      return;
    }
    $('#trend-box').style.display = 'block';

    const runs = [...runsIndex.runs].reverse(); // oldest to newest
    const labels = runs.map((r) => formatTimestamp(r.timestamp, true));
    const rates = runs.map((r) => r.passRate || 0);

    const ctx = $('#trend-chart').getContext('2d');
    charts.trend = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Pass Rate %',
            data: rates,
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6,182,212,0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointBackgroundColor: '#06b6d4',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { color: '#64748b', callback: (v) => v + '%' },
            grid: { color: '#1e293b' },
          },
          x: {
            ticks: { color: '#64748b', maxRotation: 45, font: { size: 10 } },
            grid: { display: false },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}%` } },
        },
      },
    });
  }

  function renderFlakySection() {
    const section = $('#flaky-section');
    const list = $('#flaky-list');
    if (flakySet.size === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = 'block';
    list.innerHTML = [...flakySet].map((f) => `<li>⚡ ${f}</li>`).join('');
  }

  // ─── Test List ─────────────────────────────────────────────
  function renderTestList() {
    if (!currentRunData) return;

    renderFilterChips();
    renderAreaSidebar();
    renderTestTable();
  }

  function renderFilterChips() {
    const container = $('#filter-chips');
    const chips = [
      { key: 'passed', label: '✅ Passed', cls: 'chip-passed', type: 'status' },
      { key: 'failed', label: '❌ Failed', cls: 'chip-failed', type: 'status' },
      { key: 'flaky', label: '⚡ Flaky', cls: 'chip-flaky', type: 'flaky' },
    ];

    container.innerHTML = chips
      .map(
        (c) =>
          `<button class="chip ${c.cls}" data-key="${c.key}" data-type="${c.type}">${c.label}</button>`,
      )
      .join('');

    container.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const key = chip.dataset.key;
        const type = chip.dataset.type;

        if (type === 'status') {
          activeFilters.status = activeFilters.status === key ? null : key;
        } else if (type === 'flaky') {
          activeFilters.flaky = !activeFilters.flaky;
        }

        // Update chip visual state
        container.querySelectorAll('.chip').forEach((c) => {
          const k = c.dataset.key;
          const t = c.dataset.type;
          if (t === 'status') c.classList.toggle('active', activeFilters.status === k);
          else if (t === 'flaky') c.classList.toggle('active', activeFilters.flaky);
        });

        renderTestTable();
      });
    });
  }

  function renderAreaSidebar() {
    const sidebar = $('#area-sidebar');
    const areas = {};
    currentRunData.tests.forEach((t) => {
      const area = t.featureArea || 'Sin categoría';
      if (!areas[area]) areas[area] = { passed: 0, failed: 0, total: 0 };
      areas[area].total++;
      if (t.status === 'passed') areas[area].passed++;
      if (t.status === 'failed') areas[area].failed++;
    });

    const allItem = `<div class="area-item ${!activeFilters.area ? 'active' : ''}" data-area="">
      <span class="area-name">Todas las áreas</span>
      <span class="area-count">${currentRunData.tests.length}</span>
    </div>`;

    const areaItems = Object.keys(areas)
      .sort()
      .map(
        (area) => `
      <div class="area-item ${activeFilters.area === area ? 'active' : ''}" data-area="${area}">
        <span class="area-name">${area}</span>
        <span class="area-counts">
          ${areas[area].passed ? `<span class="area-count pass-count">${areas[area].passed}</span>` : ''}
          ${areas[area].failed ? `<span class="area-count fail-count">${areas[area].failed}</span>` : ''}
        </span>
      </div>`,
      )
      .join('');

    sidebar.innerHTML = allItem + areaItems;

    sidebar.querySelectorAll('.area-item').forEach((item) => {
      item.addEventListener('click', () => {
        activeFilters.area = item.dataset.area || null;
        sidebar.querySelectorAll('.area-item').forEach((i) => i.classList.remove('active'));
        item.classList.add('active');
        renderTestTable();
      });
    });
  }

  function setupSearch() {
    $('#search-input').addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      renderTestTable();
    });
  }

  function getFilteredTests() {
    if (!currentRunData) return [];
    return currentRunData.tests.filter((t) => {
      if (activeFilters.status && t.status !== activeFilters.status) return false;
      if (activeFilters.area && t.featureArea !== activeFilters.area) return false;
      if (activeFilters.flaky && !flakySet.has(t.flow)) return false;
      if (searchQuery && !t.flow.toLowerCase().includes(searchQuery)) return false;
      return true;
    });
  }

  function renderTestTable() {
    const tbody = $('#test-table-body');
    const tests = getFilteredTests();

    tbody.innerHTML = tests
      .map(
        (t) => `
      <tr data-flow="${t.flow}">
        <td class="col-status">
          <span class="status-badge status-${t.status}">${statusEmoji(t.status)}</span>
        </td>
        <td class="col-name">
          ${t.flow}${flakySet.has(t.flow) ? '<span class="flaky-badge">⚡ flaky</span>' : ''}
        </td>
        <td class="col-area">${t.featureArea || '—'}</td>
        <td class="col-phase">${t.phase || '—'}</td>
        <td class="col-dur">${formatDuration(t.durationMs)}</td>
      </tr>`,
      )
      .join('');

    tbody.querySelectorAll('tr').forEach((row) => {
      row.addEventListener('click', () => {
        const flow = row.dataset.flow;
        const test = currentRunData.tests.find((t) => t.flow === flow);
        if (test) showDetail(test);
      });
    });
  }

  // ─── Detail View ───────────────────────────────────────────
  function showDetail(test) {
    switchView('detail-view');

    // Header
    const header = $('#detail-header');
    header.innerHTML = `
      <h2>
        <span class="status-badge status-${test.status}">${statusEmoji(test.status)}</span>
        ${test.flow}
        ${flakySet.has(test.flow) ? '<span class="flaky-badge">⚡ flaky</span>' : ''}
      </h2>
      <div class="detail-meta">
        <span>⏱️ ${formatDuration(test.durationMs)}</span>
        <span>📂 ${test.featureArea || '—'}</span>
        <span>🏷️ ${test.phase || '—'}</span>
        ${test.entrypoint ? `<span>🚀 Entry: ${test.entrypoint}</span>` : ''}
      </div>
    `;

    // Step trace
    renderStepTrace(test);

    // Expected vs Actual (failures only)
    renderExpectedActual(test);

    // Screenshot (failures only)
    renderScreenshot(test);

    // Hierarchy (failures only)
    renderHierarchy(test);
    renderFoldAudit(test);

    // Probable cause (failures only)
    renderCause(test);

    // Report link (failures only)
    renderReportLink(test);
  }

  function renderStepTrace(test) {
    const section = $('#detail-steps');
    const tbody = $('#steps-table-body');

    if (!test.steps || test.steps.length === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = 'block';

    tbody.innerHTML = test.steps
      .map((s, i) => {
        const status = s.s || 'UNKNOWN';
        const rowCls =
          status === 'FAILED' ? 'step-failed' : status === 'WARNED' ? 'step-warned' : '';
        const emoji = stepEmoji(status);
        const type = s.t || '?';
        let selector = '';
        if (s.id) selector += `id="${s.id}" `;
        if (s.tx) selector += `text="${s.tx}" `;
        if (s.opt) selector += '[optional]';
        const dur = typeof s.d === 'number' ? `${s.d}ms` : '—';

        return `<tr class="${rowCls}">
          <td>${i + 1}</td>
          <td>${emoji}</td>
          <td>${type}</td>
          <td>${escapeHtml(selector.trim() || '—')}</td>
          <td style="text-align:right">${dur}</td>
        </tr>`;
      })
      .join('');
  }

  function renderExpectedActual(test) {
    const section = $('#detail-expected-actual');
    if (test.status !== 'failed' || !test.failedStep) {
      section.style.display = 'none';
      return;
    }
    section.style.display = 'block';

    const fs = test.failedStep;
    const hier = test.hierarchy || { ids: [], texts: [] };

    let expectedHtml = '<div class="ea-box"><h4>Esperado</h4>';
    if (fs.id) {
      const found = hier.ids && hier.ids.includes(fs.id);
      expectedHtml += `<div class="ea-item ${found ? 'ea-found' : 'ea-missing'}">id="${escapeHtml(fs.id)}" ${found ? '✅ encontrado' : '❌ NO encontrado'}</div>`;
    }
    if (fs.text) {
      const found = hier.texts && hier.texts.some((t) => t.includes(fs.text));
      expectedHtml += `<div class="ea-item ${found ? 'ea-found' : 'ea-missing'}">text="${escapeHtml(fs.text)}" ${found ? '✅ encontrado' : '❌ NO encontrado'}</div>`;
    }
    if (fs.errorMessage) {
      expectedHtml += `<div class="ea-item ea-missing" style="margin-top:8px">Error: ${escapeHtml(fs.errorMessage)}</div>`;
    }
    expectedHtml += '</div>';

    let actualHtml = '<div class="ea-box"><h4>En pantalla</h4>';
    if (hier.ids && hier.ids.length > 0) {
      actualHtml += hier.ids
        .slice(0, 20)
        .map((id) => `<div class="ea-item">id="${escapeHtml(id)}"</div>`)
        .join('');
      if (hier.ids.length > 20)
        actualHtml += `<div class="ea-item" style="color:#64748b">... y ${hier.ids.length - 20} más</div>`;
    }
    if (hier.texts && hier.texts.length > 0) {
      actualHtml += '<div style="margin-top:8px">';
      actualHtml += hier.texts
        .slice(0, 15)
        .map((t) => `<div class="ea-item">text="${escapeHtml(t)}"</div>`)
        .join('');
      if (hier.texts.length > 15)
        actualHtml += `<div class="ea-item" style="color:#64748b">... y ${hier.texts.length - 15} más</div>`;
      actualHtml += '</div>';
    }
    actualHtml += '</div>';

    $('#expected-actual-content').innerHTML = expectedHtml + actualHtml;
  }

  function renderScreenshot(test) {
    const section = $('#detail-screenshot');
    const container = $('#screenshot-container');

    if (test.status !== 'failed' || !test.artifacts || !test.artifacts.screenshot) {
      section.style.display = 'none';
      return;
    }
    section.style.display = 'block';

    const runId = currentRunData.runId;
    const imgSrc = `runs/${runId}/${test.artifacts.screenshot}`;
    container.innerHTML = `<img src="${imgSrc}" alt="Screenshot: ${test.flow}" onclick="document.getElementById('lightbox-img').src=this.src; document.getElementById('lightbox').style.display='flex';">`;
  }

  function renderHierarchy(test) {
    const section = $('#detail-hierarchy');
    if (test.status !== 'failed' || !test.hierarchy) {
      section.style.display = 'none';
      return;
    }
    section.style.display = 'block';

    const hier = test.hierarchy;
    let content = '';
    if (hier.ids && hier.ids.length > 0) {
      content += '═══ IDs on screen ═══\n';
      content += hier.ids.map((id) => `  ${id}`).join('\n');
      content += '\n\n';
    }
    if (hier.texts && hier.texts.length > 0) {
      content += '═══ Texts on screen ═══\n';
      content += hier.texts.map((t) => `  "${t}"`).join('\n');
    }
    $('#hierarchy-content').textContent = content || '(no hierarchy data)';
  }

  // Fold audit — "false bottom" findings from the scroll-delta probe.
  // A screen can overflow with an interactive control entirely below the
  // fold and nothing clipped to hint that it scrolls; NO_CUE is that case.
  function renderFoldAudit(test) {
    const section = $('#detail-fold');
    const f = test.fold;
    if (!f || f.verdict === 'NO_OVERFLOW') {
      section.style.display = 'none';
      return;
    }
    section.style.display = 'block';

    const emoji = { NO_CUE: '❌', HIDDEN: '⚠️', CLEAN: '✅', PROBE_FAILED: '❓' };
    const c = f.counts || {};
    let html =
      '<div class="ea-box"><h4>Veredicto</h4>' +
      '<div class="ea-item ' +
      (f.verdict === 'NO_CUE' ? 'ea-missing' : 'ea-found') +
      '">' +
      (emoji[f.verdict] || '❓') +
      ' ' +
      escapeHtml(f.verdict) +
      (f.priority ? ' (' + escapeHtml(f.priority) + ')' : '') +
      '</div></div>';

    if (f.hidden && f.hidden.length) {
      html += '<div class="ea-box"><h4>Bajo el pliegue</h4>';
      html += f.hidden
        .map(function (h) {
          return (
            '<div class="ea-item ' +
            (h.interactive ? 'ea-missing' : '') +
            '">' +
            (h.interactive ? '🔘 ' : '▫️ ') +
            escapeHtml(h.key) +
            (h.accessibilityText ? ' — ' + escapeHtml(h.accessibilityText) : '') +
            ' <span style="opacity:.7">[' +
            escapeHtml(h.kind) +
            ', confianza ' +
            escapeHtml(h.confidence) +
            ']</span></div>'
          );
        })
        .join('');
      html += '</div>';
    }

    if (f.straddlers && f.straddlers.length) {
      html += '<div class="ea-box"><h4>Señal de scroll (elementos cortados)</h4>';
      html += f.straddlers
        .map(function (s) {
          return (
            '<div class="ea-item ea-found">✂️ ' +
            escapeHtml(s.key) +
            ' — ' +
            s.overhangPx +
            'px fuera</div>'
          );
        })
        .join('');
      html += '</div>';
    }

    if (c.listRowsCollapsed) {
      html +=
        '<div class="ea-item" style="opacity:.7">' +
        c.listRowsCollapsed +
        ' fila(s) de lista virtualizada omitidas</div>';
    }
    if (f.warnings && f.warnings.length) {
      html +=
        '<div class="ea-box"><h4>Advertencias</h4>' +
        f.warnings
          .map(function (w) {
            return '<div class="ea-item">⚠️ ' + escapeHtml(w) + '</div>';
          })
          .join('') +
        '</div>';
    }
    $('#fold-content').innerHTML = html;
  }

  function renderCause(test) {
    const section = $('#detail-cause');
    if (!test.probableCause) {
      section.style.display = 'none';
      return;
    }
    section.style.display = 'block';
    $('#cause-content').textContent = test.probableCause;
  }

  function renderReportLink(test) {
    const section = $('#detail-report');
    if (test.status !== 'failed' || !test.artifacts || !test.artifacts.report) {
      section.style.display = 'none';
      return;
    }
    section.style.display = 'block';
    const runId = currentRunData.runId;
    $('#report-link').href = `runs/${runId}/${test.artifacts.report}`;
  }

  // ─── Lightbox ──────────────────────────────────────────────
  function setupLightbox() {
    const lb = $('#lightbox');
    lb.addEventListener('click', (e) => {
      if (e.target === lb || e.target.classList.contains('lightbox-close')) {
        lb.style.display = 'none';
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') lb.style.display = 'none';
    });
  }

  // ─── Empty state ───────────────────────────────────────────
  function showEmptyState() {
    $('#summary-cards').innerHTML = `
      <div class="summary-card" style="grid-column: 1/-1; text-align:center; padding:40px">
        <div class="label">No hay corridas de tests</div>
        <div class="value" style="font-size:16px; color:var(--text-dim); margin-top:12px">
          Ejecuta <code style="background:var(--bg);padding:2px 8px;border-radius:4px">full-regression.sh</code>
          para generar el primer reporte.
        </div>
      </div>`;
  }

  // ─── Utilities ─────────────────────────────────────────────
  function statusEmoji(status) {
    return { passed: '✅', failed: '❌', skipped: '⏭️' }[status] || '❓';
  }

  function stepEmoji(status) {
    return { COMPLETED: '✅', FAILED: '❌', WARNED: '⚠️' }[status] || '❓';
  }

  function formatDuration(ms) {
    if (ms == null || ms === 0) return '—';
    if (ms < 1000) return `${ms}ms`;
    const secs = Math.floor(ms / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}m ${remSecs}s`;
  }

  function formatTimestamp(ts, short) {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      if (short) return `${d.getMonth() + 1}/${d.getDate()}`;
      return d.toLocaleString('es-MX', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return ts;
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
