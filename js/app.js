/**
 * Hash-based SPA router.
 */
const App = (() => {
  const pages = {
    login: LoginPage,
    dashboard: DashboardPage,
    content: ContentPage,
    users: UsersPage,
  };

  function route() {
    const hash = (location.hash || '#login').slice(1).split('/')[0];

    if (!Api.isLoggedIn() && hash !== 'login') {
      location.hash = '#login';
      return;
    }

    if (Api.isLoggedIn() && hash === 'login') {
      location.hash = '#dashboard';
      return;
    }

    // Toggle screens
    document.getElementById('login-screen').hidden = Api.isLoggedIn();
    document.getElementById('main-layout').hidden = !Api.isLoggedIn();

    // Update active nav
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === hash);
    });

    // Render page
    const page = pages[hash];
    if (page) {
      const container = document.getElementById('page-container');
      container.innerHTML = '';
      page.render(container);
    }
  }

  function init() {
    window.addEventListener('hashchange', route);

    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        // hashchange handler does the rest
      });
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
      Api.logout();
      location.hash = '#login';
    });

    // Modal close
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-backdrop').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });

    route();
  }

  function closeModal() {
    document.getElementById('modal-backdrop').hidden = true;
  }

  function openModal(title, bodyHtml, footerHtml) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal-footer').innerHTML = footerHtml || '';
    document.getElementById('modal-backdrop').hidden = false;
  }

  document.addEventListener('DOMContentLoaded', init);

  return { route, openModal, closeModal };
})();
