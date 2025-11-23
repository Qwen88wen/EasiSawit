const { memo } = React;

// --- Navigation Component ---
const Navigation = memo(({ t, theme, language, setLang, toggleTheme }) => (
  <nav className={`${theme === 'light' ? 'bg-emerald-700' : 'bg-gray-800'} text-white shadow-lg gpu-accelerated`}>
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center space-x-3">
          <svg className="w-10 h-10" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" fill="#10b981"/>
            <g transform="translate(50, 50)">
              <ellipse cx="0" cy="-15" rx="8" ry="20" fill="#059669"/>
              <ellipse cx="-12" cy="-8" rx="8" ry="20" fill="#059669" transform="rotate(-60)"/>
              <ellipse cx="12" cy="-8" rx="8" ry="20" fill="#059669" transform="rotate(60)"/>
              <ellipse cx="-15" cy="5" rx="8" ry="20" fill="#047857" transform="rotate(-120)"/>
              <ellipse cx="15" cy="5" rx="8" ry="20" fill="#047857" transform="rotate(120)"/>
              <ellipse cx="-8" cy="15" rx="8" ry="18" fill="#047857" transform="rotate(-180)"/>
              <ellipse cx="8" cy="15" rx="8" ry="18" fill="#047857" transform="rotate(180)"/>
              <circle cx="0" cy="0" r="12" fill="#065f46"/>
              <rect x="-3" y="0" width="6" height="30" fill="#92400e" rx="2"/>
            </g>
          </svg>
          <div>
            <h1 className="text-xl font-bold">{t.appName}</h1>
            <p className="text-xs text-emerald-200">{t.appSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select onChange={(e) => setLang(e.target.value)} value={language} className="bg-emerald-600 text-white px-3 py-2 rounded hover:bg-emerald-800 transition appearance-none">
            <option value="en">English</option>
            <option value="ms">Bahasa Melayu</option>
            <option value="zh">中文</option>
          </select>
          <button onClick={toggleTheme} className="flex items-center space-x-1 bg-emerald-600 px-3 py-2 rounded hover:bg-emerald-800 transition">
            <i data-lucide={theme === 'light' ? 'moon' : 'sun'} style={{width: 16, height: 16}}></i>
          </button>
          <span className="text-sm">{t.adminUser}</span>
          <button className="flex items-center space-x-1 bg-emerald-600 px-3 py-2 rounded hover:bg-emerald-800 transition">
            <i data-lucide="log-out" style={{width: 16, height: 16}}></i>
            <span className="text-sm">{t.logout}</span>
          </button>
        </div>
      </div>
    </div>
  </nav>
));

// --- Sidebar Component ---
const Sidebar = memo(({ t, theme, activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) => (
  <aside className={`transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} ${theme === 'light' ? 'bg-white' : 'bg-gray-800'} shadow-lg gpu-accelerated`}>
    <div className="p-4">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="mb-6 p-2 hover:bg-gray-100 rounded"
        title={sidebarOpen ? t.sidebarClose : t.sidebarOpen}
      >
        {sidebarOpen ? <i data-lucide="x" style={{width: 24, height: 24}}></i> : <i data-lucide="menu" style={{width: 24, height: 24}}></i>}
      </button>

      <div className="space-y-2">
        <SidebarItem t={t} theme={theme} activeTab={activeTab} setActiveTab={setActiveTab} icon="trending-up" tab="dashboard" sidebarOpen={sidebarOpen} />
        <SidebarItem t={t} theme={theme} activeTab={activeTab} setActiveTab={setActiveTab} icon="users" tab="workers" sidebarOpen={sidebarOpen} />
        <SidebarItem t={t} theme={theme} activeTab={activeTab} setActiveTab={setActiveTab} icon="file-text" tab="worklogs" sidebarOpen={sidebarOpen} />
        <SidebarItem t={t} theme={theme} activeTab={activeTab} setActiveTab={setActiveTab} icon="dollar-sign" tab="customers" sidebarOpen={sidebarOpen} />
        <SidebarItem t={t} theme={theme} activeTab={activeTab} setActiveTab={setActiveTab} icon="calendar" tab="payroll" sidebarOpen={sidebarOpen} />
        <SidebarItem t={t} theme={theme} activeTab={activeTab} setActiveTab={setActiveTab} icon="bar-chart-2" tab="reports" sidebarOpen={sidebarOpen} />
        <SidebarItem t={t} theme={theme} activeTab={activeTab} setActiveTab={setActiveTab} icon="settings" tab="settings" sidebarOpen={sidebarOpen} />
      </div>
    </div>
  </aside>
));

// --- Sidebar Item Component ---
const SidebarItem = memo(({ t, theme, activeTab, setActiveTab, icon, tab, sidebarOpen }) => (
  <button
    onClick={() => setActiveTab(tab)}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
      activeTab === tab
        ? theme === 'light' ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-800 text-white'
        : theme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 hover:bg-gray-700'
    }`}
  >
    <i data-lucide={icon}></i>
    {sidebarOpen && <span className="font-medium">{t[tab]}</span>}
  </button>
));

// --- Add Worker Modal Component ---
const AddWorkerModal = ({ t, theme, isModalOpen, setIsModalOpen, newWorker, setNewWorker, handleAddNewWorker }) => {
  if (!isModalOpen) return null;

  const t_view = t.workersView;

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewWorker(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-clear other field when type changes
    if (name === 'type') {
      if (value === 'Local') {
        setNewWorker(prev => ({ ...prev, permit: '' }));
      } else if (value === 'Foreign') {
        setNewWorker(prev => ({ ...prev, epf: '' }));
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-lg shadow-xl p-6 w-full max-w-lg`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{t_view.addNewWorker}</h3>
          <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
            <i data-lucide="x" style={{width: 24, height: 24}}></i>
          </button>
        </div>

        <form onSubmit={handleAddNewWorker} className="space-y-4">
          <div>
            <label htmlFor="name" className={`block text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_view.thName}</label>
            <input
              type="text"
              name="name"
              id="name"
              value={newWorker.name}
              onChange={handleChange}
              className={`mt-1 w-full border rounded-lg px-3 py-2 ${theme === 'light' ? 'bg-white' : 'bg-gray-700 text-white'}`}
            />
          </div>

          <div>
            <label htmlFor="type" className={`block text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_view.thType}</label>
            <select
              name="type"
              id="type"
              value={newWorker.type}
              onChange={handleChange}
              className={`mt-1 w-full border rounded-lg px-3 py-2 ${theme === 'light' ? 'bg-white' : 'bg-gray-700 text-white'}`}
            >
              <option value="Local">{t.local}</option>
              <option value="Foreign">{t.foreign}</option>
            </select>
          </div>

          {/* Conditional fields based on type */}
          {newWorker.type === 'Local' ? (
            <div>
              <label htmlFor="epf" className={`block text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>EPF</label>
              <input
                type="text"
                name="epf"
                id="epf"
                value={newWorker.epf}
                onChange={handleChange}
                className={`mt-1 w-full border rounded-lg px-3 py-2 ${theme === 'light' ? 'bg-white' : 'bg-gray-700 text-white'}`}
              />
            </div>
          ) : (
            <div>
              <label htmlFor="permit" className={`block text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>Permit No.</label>
              <input
                type="text"
                name="permit"
                id="permit"
                value={newWorker.permit}
                onChange={handleChange}
                className={`mt-1 w-full border rounded-lg px-3 py-2 ${theme === 'light' ? 'bg-white' : 'bg-gray-700 text-white'}`}
              />
            </div>
          )}

          <div>
            <label htmlFor="status" className={`block text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_view.thStatus}</label>
            <select
              name="status"
              id="status"
              value={newWorker.status}
              onChange={handleChange}
              className={`mt-1 w-full border rounded-lg px-3 py-2 ${theme === 'light' ? 'bg-white' : 'bg-gray-700 text-white'}`}
            >
              <option value="Active">{t_view.statusActive}</option>
              <option value="Inactive">{t_view.statusInactive}</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className={`px-4 py-2 rounded-lg ${theme === 'light' ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'} transition`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
            >
              {t_view.addNewWorker}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Assign components to window object ---
// Only assign Navigation and Sidebar components, not the view components
// View components are already exported from view_components.js
window.Navigation = Navigation;
window.Sidebar = Sidebar;
window.SidebarItem = SidebarItem;
window.AddWorkerModal = AddWorkerModal;
