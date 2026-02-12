/**
 * Content management — filter by type, table, add/edit modal, delete
 */
const ContentPage = (() => {
  const TYPES = ['quote', 'try_item', 'skip_item', 'category', 'community_story'];
  let currentType = '';
  let currentOffset = 0;
  const LIMIT = 50;

  async function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1>Content</h1>
        <button class="btn btn-primary" id="add-content-btn">+ Add Item</button>
      </div>
      <div class="filter-bar">
        <select id="type-filter">
          <option value="">All Types</option>
          ${TYPES.map(t => `<option value="${t}">${formatType(t)}</option>`).join('')}
        </select>
      </div>
      <div id="content-table-wrap"></div>
    `;

    document.getElementById('type-filter').addEventListener('change', (e) => {
      currentType = e.target.value;
      currentOffset = 0;
      loadContent();
    });

    document.getElementById('add-content-btn').addEventListener('click', () => openEditor(null));

    loadContent();
  }

  async function loadContent() {
    const wrap = document.getElementById('content-table-wrap');
    wrap.innerHTML = '<div class="loading-center"><span class="spinner"></span> Loading...</div>';

    try {
      let path = `/admin/content?limit=${LIMIT}&offset=${currentOffset}`;
      if (currentType) path += `&content_type=${currentType}`;
      const data = await Api.get(path);

      if (data.items.length === 0) {
        wrap.innerHTML = '<div class="empty-state"><p>No content items found.</p></div>';
        return;
      }

      wrap.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Title / Body</th>
                <th>Status</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="content-tbody"></tbody>
          </table>
          <div class="pagination">
            <span>Showing ${currentOffset + 1}-${Math.min(currentOffset + data.items.length, data.total)} of ${data.total}</span>
            <div>
              <button class="btn btn-ghost btn-sm" id="prev-btn" ${currentOffset === 0 ? 'disabled' : ''}>Prev</button>
              <button class="btn btn-ghost btn-sm" id="next-btn" ${currentOffset + LIMIT >= data.total ? 'disabled' : ''}>Next</button>
            </div>
          </div>
        </div>
      `;

      const tbody = document.getElementById('content-tbody');
      data.items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><span class="badge badge-type">${formatType(item.content_type)}</span></td>
          <td class="truncate">${esc(item.title || item.body || '-')}</td>
          <td>${item.is_active
            ? '<span class="badge badge-active">Active</span>'
            : '<span class="badge badge-inactive">Inactive</span>'}</td>
          <td>${item.sort_order}</td>
          <td>
            <button class="btn btn-ghost btn-sm edit-btn">Edit</button>
            <button class="btn btn-danger btn-sm del-btn">Delete</button>
          </td>
        `;
        tr.querySelector('.edit-btn').addEventListener('click', () => openEditor(item));
        tr.querySelector('.del-btn').addEventListener('click', () => confirmDelete(item));
        tbody.appendChild(tr);
      });

      document.getElementById('prev-btn')?.addEventListener('click', () => {
        currentOffset = Math.max(0, currentOffset - LIMIT);
        loadContent();
      });
      document.getElementById('next-btn')?.addEventListener('click', () => {
        currentOffset += LIMIT;
        loadContent();
      });
    } catch (err) {
      wrap.innerHTML = `<div class="empty-state"><p>Error: ${esc(err.message)}</p></div>`;
    }
  }

  function openEditor(item) {
    const isNew = !item;
    const title = isNew ? 'Add Content Item' : 'Edit Content Item';

    const body = `
      <label>Type</label>
      <select id="ed-type" ${isNew ? '' : 'disabled'}>
        ${TYPES.map(t => `<option value="${t}" ${item?.content_type === t ? 'selected' : ''}>${formatType(t)}</option>`).join('')}
      </select>
      <label>Title</label>
      <input id="ed-title" value="${esc(item?.title || '')}">
      <label>Body</label>
      <textarea id="ed-body">${esc(item?.body || '')}</textarea>
      <label>Attribution</label>
      <input id="ed-attribution" value="${esc(item?.attribution || '')}">
      <label>Image URL</label>
      <input id="ed-image" value="${esc(item?.image_url || '')}">
      <label>Label</label>
      <input id="ed-label" value="${esc(item?.label || '')}">
      <label>Sort Order</label>
      <input id="ed-sort" type="number" value="${item?.sort_order ?? 0}">
      <label>
        <input id="ed-active" type="checkbox" ${item?.is_active !== false ? 'checked' : ''} style="width:auto;margin-right:6px;">
        Active
      </label>
      <p id="ed-error" class="error-text" hidden></p>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
      <button class="btn btn-primary" id="ed-save">${isNew ? 'Create' : 'Save'}</button>
    `;

    App.openModal(title, body, footer);

    document.getElementById('ed-save').addEventListener('click', async () => {
      const errEl = document.getElementById('ed-error');
      errEl.hidden = true;

      const payload = {
        content_type: document.getElementById('ed-type').value,
        title: document.getElementById('ed-title').value || null,
        body: document.getElementById('ed-body').value || null,
        attribution: document.getElementById('ed-attribution').value || null,
        image_url: document.getElementById('ed-image').value || null,
        label: document.getElementById('ed-label').value || null,
        sort_order: parseInt(document.getElementById('ed-sort').value) || 0,
        is_active: document.getElementById('ed-active').checked,
      };

      try {
        if (isNew) {
          await Api.post('/admin/content', payload);
        } else {
          delete payload.content_type;
          await Api.put(`/admin/content/${item.id}`, payload);
        }
        App.closeModal();
        loadContent();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.hidden = false;
      }
    });
  }

  function confirmDelete(item) {
    App.openModal(
      'Delete Content Item',
      `<p>Are you sure you want to delete this ${formatType(item.content_type)}?</p>
       <p class="text-muted text-sm mt-16">"${esc(item.title || item.body || item.id)}"</p>`,
      `<button class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
       <button class="btn btn-danger" id="confirm-del">Delete</button>`
    );

    document.getElementById('confirm-del').addEventListener('click', async () => {
      try {
        await Api.del(`/admin/content/${item.id}`);
        App.closeModal();
        loadContent();
      } catch (err) {
        alert('Delete failed: ' + err.message);
      }
    });
  }

  function formatType(t) {
    return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  return { render };
})();
