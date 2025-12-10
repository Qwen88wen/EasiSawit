const { memo } = React;

// --- NOTE: Header and Sidebar components are now defined in app_logic.js ---
// --- This file only contains modal components ---

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
// Navigation, Sidebar, and SidebarItem are now in app_logic.js
// Only modal components are exported here
window.AddWorkerModal = AddWorkerModal;
