/**
 * Users page — list, detail, admin toggle
 */
const UsersPage = (() => {
  let currentOffset = 0;
  const LIMIT = 50;

  async function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1>Users</h1>
      </div>
      <div id="users-table-wrap"></div>
    `;
    loadUsers();
  }

  async function loadUsers() {
    const wrap = document.getElementById('users-table-wrap');
    wrap.innerHTML = '<div class="loading-center"><span class="spinner"></span> Loading...</div>';

    try {
      const data = await Api.get(`/admin/users?limit=${LIMIT}&offset=${currentOffset}`);

      if (data.users.length === 0) {
        wrap.innerHTML = '<div class="empty-state"><p>No users yet.</p></div>';
        return;
      }

      wrap.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>ADHD</th>
                <th>Onboarding</th>
                <th>Admin</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="users-tbody"></tbody>
          </table>
          <div class="pagination">
            <span>Showing ${currentOffset + 1}-${Math.min(currentOffset + data.users.length, data.total)} of ${data.total}</span>
            <div>
              <button class="btn btn-ghost btn-sm" id="u-prev" ${currentOffset === 0 ? 'disabled' : ''}>Prev</button>
              <button class="btn btn-ghost btn-sm" id="u-next" ${currentOffset + LIMIT >= data.total ? 'disabled' : ''}>Next</button>
            </div>
          </div>
        </div>
      `;

      const tbody = document.getElementById('users-tbody');
      data.users.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${esc(u.name || '-')}</td>
          <td class="text-muted">${esc(u.email || '-')}</td>
          <td>${u.have_adhd === true ? 'Yes' : u.have_adhd === false ? 'No' : '-'}</td>
          <td>${u.onboarding_step}/4</td>
          <td>${u.is_admin ? '<span class="badge badge-admin">Admin</span>' : '-'}</td>
          <td class="text-muted text-sm">${formatDate(u.created_at)}</td>
          <td><button class="btn btn-ghost btn-sm view-btn">View</button></td>
        `;
        tr.querySelector('.view-btn').addEventListener('click', () => showUserDetail(u.id));
        tbody.appendChild(tr);
      });

      document.getElementById('u-prev')?.addEventListener('click', () => {
        currentOffset = Math.max(0, currentOffset - LIMIT);
        loadUsers();
      });
      document.getElementById('u-next')?.addEventListener('click', () => {
        currentOffset += LIMIT;
        loadUsers();
      });
    } catch (err) {
      wrap.innerHTML = `<div class="empty-state"><p>Error: ${esc(err.message)}</p></div>`;
    }
  }

  async function showUserDetail(userId) {
    App.openModal('User Detail', '<div class="loading-center"><span class="spinner"></span></div>', '');

    try {
      const u = await Api.get(`/admin/users/${userId}`);

      const body = `
        <div class="detail-grid">
          <div class="detail-item">
            <div class="detail-label">Name</div>
            <div class="detail-value">${esc(u.name || '-')}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Email</div>
            <div class="detail-value">${esc(u.email || '-')}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Age</div>
            <div class="detail-value">${u.age ?? '-'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Has ADHD</div>
            <div class="detail-value">${u.have_adhd === true ? 'Yes' : u.have_adhd === false ? 'No' : 'Unknown'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Onboarding</div>
            <div class="detail-value">Step ${u.onboarding_step}/4</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Admin</div>
            <div class="detail-value">${u.is_admin ? 'Yes' : 'No'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Goals</div>
            <div class="detail-value">${u.goal_count}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Conversations</div>
            <div class="detail-value">${u.conversation_count}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Memories</div>
            <div class="detail-value">${u.memory_count}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Joined</div>
            <div class="detail-value">${formatDate(u.created_at)}</div>
          </div>
        </div>
        ${u.profile_data && Object.keys(u.profile_data).length > 0
          ? `<div class="mt-16"><label>Profile Data</label><pre style="background:var(--bg-input);padding:12px;border-radius:var(--radius);font-size:13px;overflow-x:auto;">${esc(JSON.stringify(u.profile_data, null, 2))}</pre></div>`
          : ''}
      `;

      const footer = `
        <button class="btn btn-ghost" onclick="App.closeModal()">Close</button>
        <button class="btn ${u.is_admin ? 'btn-danger' : 'btn-primary'}" id="toggle-admin">
          ${u.is_admin ? 'Remove Admin' : 'Make Admin'}
        </button>
      `;

      document.getElementById('modal-body').innerHTML = body;
      document.getElementById('modal-footer').innerHTML = footer;

      document.getElementById('toggle-admin').addEventListener('click', async () => {
        const btn = document.getElementById('toggle-admin');
        btn.disabled = true;
        try {
          await Api.post(`/admin/users/${userId}/set-admin`, { is_admin: !u.is_admin });
          App.closeModal();
          loadUsers();
        } catch (err) {
          alert('Failed: ' + err.message);
          btn.disabled = false;
        }
      });
    } catch (err) {
      document.getElementById('modal-body').innerHTML = `<p class="error-text">${esc(err.message)}</p>`;
    }
  }

  function formatDate(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  return { render };
})();
