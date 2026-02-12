/**
 * Dashboard — stats cards + seed button
 */
const DashboardPage = (() => {
  async function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1>Dashboard</h1>
        <button class="btn btn-primary" id="seed-btn">Seed Default Content</button>
      </div>
      <div class="stats-grid" id="stats-grid">
        <div class="loading-center"><span class="spinner"></span> Loading stats...</div>
      </div>
    `;

    // Seed button
    document.getElementById('seed-btn').addEventListener('click', async () => {
      const btn = document.getElementById('seed-btn');
      btn.disabled = true;
      btn.textContent = 'Seeding...';
      try {
        const result = await Api.post('/admin/seed-content');
        btn.textContent = `Seeded ${result.created} items`;
        setTimeout(() => loadStats(), 500);
      } catch (err) {
        alert('Seed failed: ' + err.message);
      } finally {
        btn.disabled = false;
        setTimeout(() => { btn.textContent = 'Seed Default Content'; }, 2000);
      }
    });

    loadStats();
  }

  async function loadStats() {
    const grid = document.getElementById('stats-grid');
    try {
      const stats = await Api.get('/admin/stats');
      grid.innerHTML = `
        ${statCard('Users', stats.total_users)}
        ${statCard('Conversations', stats.total_conversations)}
        ${statCard('Messages', stats.total_messages)}
        ${statCard('Goals', stats.total_goals)}
        ${statCard('Content Items', stats.total_content_items)}
      `;
    } catch (err) {
      grid.innerHTML = `<div class="empty-state"><p>Failed to load stats: ${esc(err.message)}</p></div>`;
    }
  }

  function statCard(label, value) {
    return `
      <div class="stat-card">
        <div class="stat-label">${esc(label)}</div>
        <div class="stat-value">${value}</div>
      </div>
    `;
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  return { render };
})();
