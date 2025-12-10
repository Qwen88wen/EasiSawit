// modal_components.js
// Requires React, React.memo, ReactDOM

const { useState, useEffect, useRef, useMemo } = React; // --- FIX: Added useMemo

// --- Modal Base Component ---
const Modal = ({ isOpen, onClose, children, title, theme }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center gpu-accelerated">
      <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-800'} p-8 rounded-lg shadow-xl relative w-full max-w-md m-4 optimized-card`}>
        <h3 className={`text-2xl font-bold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{title}</h3>
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <i data-lucide="x" style={{width: 24, height: 24}}></i>
        </button>
        {children}
      </div>
    </div>,
    document.getElementById('modal-root') || document.body // Render into modal-root or body
  );
};

// --- Add Worker Modal ---
const AddWorkerModal = ({ t, theme, isModalOpen, setIsModalOpen, newWorker, setNewWorker, handleAddNewWorker }) => {
  const t_modal = t.addWorkerModal;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewWorker(prev => ({ ...prev, [name]: value }));
  };

  // ICON FIX: Re-trigger icon rendering for modals/new content when state changes
  useEffect(() => {
    const timer = setTimeout(() => { lucide.createIcons(); }, 50); 
    return () => clearTimeout(timer);
  }, [isModalOpen]);

  return (
    <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t_modal.title} theme={theme}>
      <form onSubmit={handleAddNewWorker} className="space-y-4">
        <div>
          <label htmlFor="name" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.name}</label>
          <input
            type="text"
            id="name"
            name="name"
            value={newWorker.name}
            onChange={handleChange}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="identity_type" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              {t_modal.identityType}
            </label>
            <select
              id="identity_type"
              name="identity_type"
              value={newWorker.identity_type || ''}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            >
              <option value="">{t_modal.selectType}</option>
              <option value="IC">{t_modal.ic}</option>
              <option value="Passport">{t_modal.passport}</option>
              <option value="Work Permit">{t_modal.workPermit}</option>
            </select>
          </div>
          <div>
            <label htmlFor="identity_number" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              {t_modal.identityNumber}
            </label>
            <input
              type="text"
              id="identity_number"
              name="identity_number"
              value={newWorker.identity_number || ''}
              onChange={handleChange}
              placeholder="e.g., 901234-56-7890"
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.type}</label>
            <select
              id="type"
              name="type"
              value={newWorker.type}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            >
              <option value="Local">{t.local}</option>
              <option value="Foreign">{t.foreign}</option>
            </select>
          </div>
          <div>
            <label htmlFor="age" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              {t_modal.age}
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={newWorker.age || ''}
              onChange={handleChange}
              min="18"
              max="100"
              placeholder="e.g., 30"
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            />
          </div>
        </div>
        {newWorker.type === 'Local' && (
          <div>
            <label htmlFor="epf" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.epf}</label>
            <input
              type="text"
              id="epf"
              name="epf"
              value={newWorker.epf}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            />
          </div>
        )}
        {newWorker.type === 'Foreign' && (
          <div>
            <label htmlFor="permit" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.permit}</label>
            <input
              type="text"
              id="permit"
              name="permit"
              value={newWorker.permit}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="marital_status" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              {t_modal.maritalStatus}
            </label>
            <select
              id="marital_status"
              name="marital_status"
              value={newWorker.marital_status || ''}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            >
              <option value="">{t_modal.selectStatus}</option>
              <option value="Single">{t_modal.single}</option>
              <option value="Married">{t_modal.married}</option>
              <option value="Divorced">{t_modal.divorced}</option>
              <option value="Widowed">{t_modal.widowed}</option>
            </select>
          </div>
          <div>
            <label htmlFor="children_count" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              {t_modal.childrenCount}
            </label>
            <input
              type="number"
              id="children_count"
              name="children_count"
              value={newWorker.children_count || 0}
              onChange={handleChange}
              min="0"
              max="20"
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            />
          </div>
        </div>

        {newWorker.marital_status === 'Married' && (
          <div>
            <label htmlFor="spouse_working" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              {t_modal.spouseWorking}
            </label>
            <select
              id="spouse_working"
              name="spouse_working"
              value={newWorker.spouse_working || '0'}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            >
              <option value="0">{t_modal.notWorking}</option>
              <option value="1">{t_modal.working}</option>
            </select>
          </div>
        )}

        {newWorker.type === 'Local' && (
          <div>
            <label htmlFor="zakat_monthly" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              {t_modal.monthlyZakat}
            </label>
            <input
              type="number"
              id="zakat_monthly"
              name="zakat_monthly"
              value={newWorker.zakat_monthly || 0}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="0.00"
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            />
          </div>
        )}

        <div>
          <label htmlFor="status" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.status}</label>
          <select
            id="status"
            name="status"
            value={newWorker.status}
            onChange={handleChange}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
          >
            <option value="Active">{t.workersView.statusActive}</option>
            <option value="Inactive">{t.workersView.statusInactive}</option>
          </select>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className={`px-4 py-2 rounded-lg border ${theme === 'light' ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {t_modal.addWorker}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// --- Edit Worker Modal ---
const EditWorkerModal = ({ t, theme, isEditModalOpen, setIsEditModalOpen, editingWorker, setEditingWorker, handleUpdateWorker, originalWorker }) => {
  const t_modal = t.editWorkerModal;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditingWorker(prev => ({ ...prev, [name]: value }));
  };
  
  // --- FIX: Check if data is unchanged ---
  const isUnchanged = useMemo(() => {
    if (!originalWorker || !editingWorker) return true;
    return originalWorker.name === editingWorker.name &&
           (originalWorker.identity_type || '') === (editingWorker.identity_type || '') &&
           (originalWorker.identity_number || '') === (editingWorker.identity_number || '') &&
           originalWorker.type === editingWorker.type &&
           (originalWorker.age || '') === (editingWorker.age || '') &&
           (originalWorker.epf || '') === (editingWorker.epf || '') &&
           (originalWorker.permit || '') === (editingWorker.permit || '') &&
           (originalWorker.marital_status || '') === (editingWorker.marital_status || '') &&
           (originalWorker.children_count || 0) === (editingWorker.children_count || 0) &&
           (originalWorker.spouse_working || 0) === (editingWorker.spouse_working || 0) &&
           (originalWorker.zakat_monthly || 0) === (editingWorker.zakat_monthly || 0) &&
           originalWorker.status === editingWorker.status;
  }, [originalWorker, editingWorker]);

  // ICON FIX: Re-trigger icon rendering for modals/new content when state changes
  useEffect(() => {
    const timer = setTimeout(() => { lucide.createIcons(); }, 50); 
    return () => clearTimeout(timer);
  }, [isEditModalOpen]);

  if (!editingWorker) return null; // Don't render if no worker is being edited

  return (
    <Modal isOpen={isEditModalOpen} onClose={setIsEditModalOpen} title={t_modal.title} theme={theme}>
      <form onSubmit={handleUpdateWorker} className="space-y-4">
        <div>
          <label htmlFor="edit-name" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.name}</label>
          <input
            type="text"
            id="edit-name"
            name="name"
            value={editingWorker.name}
            onChange={handleChange}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-identity_type" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              {t_modal.identityType}
            </label>
            <select
              id="edit-identity_type"
              name="identity_type"
              value={editingWorker.identity_type || ''}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            >
              <option value="">{t_modal.selectType}</option>
              <option value="IC">{t_modal.ic}</option>
              <option value="Passport">{t_modal.passport}</option>
              <option value="Work Permit">{t_modal.workPermit}</option>
            </select>
          </div>
          <div>
            <label htmlFor="edit-identity_number" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              {t_modal.identityNumber}
            </label>
            <input
              type="text"
              id="edit-identity_number"
              name="identity_number"
              value={editingWorker.identity_number || ''}
              onChange={handleChange}
              placeholder="e.g., 901234-56-7890"
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-type" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.type}</label>
            <select
              id="edit-type"
              name="type"
              value={editingWorker.type}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            >
              <option value="Local">{t.local}</option>
              <option value="Foreign">{t.foreign}</option>
            </select>
          </div>
          <div>
            <label htmlFor="edit-age" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              {t_modal.age}
            </label>
            <input
              type="number"
              id="edit-age"
              name="age"
              value={editingWorker.age || ''}
              onChange={handleChange}
              min="18"
              max="100"
              placeholder="e.g., 30"
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            />
          </div>
        </div>
        {editingWorker.type === 'Local' && (
          <div>
            <label htmlFor="edit-epf" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.epf}</label>
            <input
              type="text"
              id="edit-epf"
              name="epf"
              value={editingWorker.epf || ''}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            />
          </div>
        )}
        {editingWorker.type === 'Foreign' && (
          <div>
            <label htmlFor="edit-permit" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.permit}</label>
            <input
              type="text"
              id="edit-permit"
              name="permit"
              value={editingWorker.permit || ''}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-marital_status" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              {t_modal.maritalStatus}
            </label>
            <select
              id="edit-marital_status"
              name="marital_status"
              value={editingWorker.marital_status || ''}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            >
              <option value="">{t_modal.selectStatus}</option>
              <option value="Single">{t_modal.single}</option>
              <option value="Married">{t_modal.married}</option>
              <option value="Divorced">{t_modal.divorced}</option>
              <option value="Widowed">{t_modal.widowed}</option>
            </select>
          </div>
          <div>
            <label htmlFor="edit-children_count" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              {t_modal.childrenCount}
            </label>
            <input
              type="number"
              id="edit-children_count"
              name="children_count"
              value={editingWorker.children_count || 0}
              onChange={handleChange}
              min="0"
              max="20"
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            />
          </div>
        </div>

        {editingWorker.marital_status === 'Married' && (
          <div>
            <label htmlFor="edit-spouse_working" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              {t_modal.spouseWorking}
            </label>
            <select
              id="edit-spouse_working"
              name="spouse_working"
              value={editingWorker.spouse_working || '0'}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            >
              <option value="0">{t_modal.notWorking}</option>
              <option value="1">{t_modal.working}</option>
            </select>
          </div>
        )}

        {editingWorker.type === 'Local' && (
          <div>
            <label htmlFor="edit-zakat_monthly" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              {t_modal.monthlyZakat}
            </label>
            <input
              type="number"
              id="edit-zakat_monthly"
              name="zakat_monthly"
              value={editingWorker.zakat_monthly || 0}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="0.00"
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            />
          </div>
        )}

        <div>
          <label htmlFor="edit-status" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.status}</label>
          <select
            id="edit-status"
            name="status"
            value={editingWorker.status}
            onChange={handleChange}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
          >
            <option value="Active">{t.workersView.statusActive}</option>
            <option value="Inactive">{t.workersView.statusInactive}</option>
          </select>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={setIsEditModalOpen}
            className={`px-4 py-2 rounded-lg border ${theme === 'light' ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={isUnchanged}
            className={`px-4 py-2 rounded-lg bg-emerald-600 text-white transition ${isUnchanged ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-700'}`}
          >
            {t_modal.updateWorker}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// --- Add Work Log Modal ---
const AddWorkLogModal = ({ t, theme, language, isAddWorkLogModalOpen, setIsAddWorkLogModalOpen, newWorkLog, setNewWorkLog, handleAddWorkLog, workers, customers }) => {
  const t_modal = t.addWorkLogModal;

  // Get today's date in Malaysia timezone (UTC+8)
  const getTodayInMalaysia = () => {
    const now = new Date();
    const malaysiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
    const year = malaysiaTime.getFullYear();
    const month = String(malaysiaTime.getMonth() + 1).padStart(2, '0');
    const day = String(malaysiaTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const maxDate = getTodayInMalaysia();

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setNewWorkLog(prev => ({
      ...prev,
      [name]: (name === 'worker_id' || name === 'customer_id') ? parseInt(value, 10) : (type === 'number' ? parseFloat(value) : value)
    }));
  };

  useEffect(() => {
    const timer = setTimeout(() => { lucide.createIcons(); }, 50);
    return () => clearTimeout(timer);
  }, [isAddWorkLogModalOpen]);

  return (
    <Modal isOpen={isAddWorkLogModalOpen} onClose={() => setIsAddWorkLogModalOpen(false)} title={t_modal.title} theme={theme}>
      <form onSubmit={handleAddWorkLog} className="space-y-4">
        <div>
          <label htmlFor="log_date" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.date}</label>
          <DatePicker
            name="log_date"
            value={newWorkLog.log_date}
            onChange={handleChange}
            maxDate={maxDate}
            language={language}
            theme={theme}
            required
          />
        </div>
        <div>
          <label htmlFor="worker_id" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.worker}</label>
          <select
            id="worker_id"
            name="worker_id"
            value={newWorkLog.worker_id}
            onChange={handleChange}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            required
          >
            <option value="">{t_modal.selectWorker}</option>
            {workers
              .filter(worker => {
                // Filter out drivers and office staff
                // Only show field workers (those without role designations in parentheses)
                const name = worker.name || '';
                const isDriver = /\(driver\)/i.test(name);
                const isOfficeStaff = /\((finance|hr|operations|admin|manager|staff|office)\)/i.test(name);
                return !isDriver && !isOfficeStaff;
              })
              .map(worker => (
                <option key={worker.id} value={worker.id}>{worker.name}</option>
              ))}
          </select>
        </div>
        <div>
          <label htmlFor="customer_id" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.customer}</label>
          <select
            id="customer_id"
            name="customer_id"
            value={newWorkLog.customer_id}
            onChange={handleChange}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            required
          >
            <option value="">{t_modal.selectCustomer}</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tons" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.tons}</label>
          <input
            type="number"
            id="tons"
            name="tons"
            value={newWorkLog.tons}
            onChange={handleChange}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            required
            step="0.01"
          />
        </div>
        <div>
          <label htmlFor="rate_per_ton" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.ratePerTon}</label>
          <input
            type="number"
            id="rate_per_ton"
            name="rate_per_ton"
            value={newWorkLog.rate_per_ton}
            onChange={handleChange}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            required
            step="0.01"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => setIsAddWorkLogModalOpen(false)}
            className={`px-4 py-2 rounded-lg border ${theme === 'light' ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {t_modal.addWorkLog}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// --- Edit Work Log Modal ---
const EditWorkLogModal = ({ t, theme, language, isEditWorkLogModalOpen, setIsEditWorkLogModalOpen, editingWorkLog, setEditingWorkLog, handleUpdateWorkLog, workers, customers, originalWorkLog }) => {
  const t_modal = t.editWorkLogModal;

  // Get today's date in Malaysia timezone (UTC+8)
  const getTodayInMalaysia = () => {
    const now = new Date();
    const malaysiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
    const year = malaysiaTime.getFullYear();
    const month = String(malaysiaTime.getMonth() + 1).padStart(2, '0');
    const day = String(malaysiaTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const maxDate = getTodayInMalaysia();

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setEditingWorkLog(prev => ({
      ...prev,
      [name]: (name === 'worker_id' || name === 'customer_id') ? parseInt(value, 10) : (type === 'number' ? parseFloat(value) : value)
    }));
  };

  // --- FIX: Check if data is unchanged ---
  const isUnchanged = useMemo(() => {
    if (!originalWorkLog || !editingWorkLog) return true;
    // Compare all fields, ensuring type consistency
    return originalWorkLog.log_date === editingWorkLog.log_date &&
           Number(originalWorkLog.worker_id) === Number(editingWorkLog.worker_id) &&
           Number(originalWorkLog.customer_id) === Number(editingWorkLog.customer_id) &&
           String(originalWorkLog.tons) === String(editingWorkLog.tons) &&
           String(originalWorkLog.rate_per_ton) === String(editingWorkLog.rate_per_ton);
  }, [originalWorkLog, editingWorkLog]);

  useEffect(() => {
    const timer = setTimeout(() => { lucide.createIcons(); }, 50);
    return () => clearTimeout(timer);
  }, [isEditWorkLogModalOpen]);

  if (!editingWorkLog) return null;

  return (
    <Modal isOpen={isEditWorkLogModalOpen} onClose={setIsEditWorkLogModalOpen} title={t_modal.title} theme={theme}>
      <form onSubmit={handleUpdateWorkLog} className="space-y-4">
        <div>
          <label htmlFor="edit_log_date" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.date}</label>
          <DatePicker
            name="log_date"
            value={editingWorkLog.log_date}
            onChange={handleChange}
            maxDate={maxDate}
            language={language}
            theme={theme}
            required
          />
        </div>
        <div>
          <label htmlFor="edit_worker_id" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.worker}</label>
          <select
            id="edit_worker_id"
            name="worker_id"
            value={editingWorkLog.worker_id}
            onChange={handleChange}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            required
          >
            <option value="">{t_modal.selectWorker}</option>
            {workers
              .filter(worker => {
                // Filter out drivers and office staff
                // Only show field workers (those without role designations in parentheses)
                const name = worker.name || '';
                const isDriver = /\(driver\)/i.test(name);
                const isOfficeStaff = /\((finance|hr|operations|admin|manager|staff|office)\)/i.test(name);
                return !isDriver && !isOfficeStaff;
              })
              .map(worker => (
                <option key={worker.id} value={worker.id}>{worker.name}</option>
              ))}
          </select>
        </div>
        <div>
          <label htmlFor="edit_customer_id" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.customer}</label>
          <select
            id="edit_customer_id"
            name="customer_id"
            value={editingWorkLog.customer_id}
            onChange={handleChange}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            required
          >
            <option value="">{t_modal.selectCustomer}</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="edit_tons" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.tons}</label>
          <input
            type="number"
            id="edit_tons"
            name="tons"
            value={editingWorkLog.tons}
            onChange={handleChange}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            required
            step="0.01"
          />
        </div>
        <div>
          <label htmlFor="edit_rate_per_ton" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.ratePerTon}</label>
          <input
            type="number"
            id="edit_rate_per_ton"
            name="rate_per_ton"
            value={editingWorkLog.rate_per_ton}
            onChange={handleChange}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            required
            step="0.01"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={setIsEditWorkLogModalOpen}
            className={`px-4 py-2 rounded-lg border ${theme === 'light' ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={isUnchanged}
            className={`px-4 py-2 rounded-lg bg-emerald-600 text-white transition ${isUnchanged ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-700'}`}
          >
            {t_modal.updateWorkLog}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// --- Add Customer Modal ---
const AddCustomerModal = ({ t, theme, isAddCustomerModalOpen, setIsAddCustomerModalOpen, newCustomer, setNewCustomer, handleAddCustomer }) => {
  const t_modal = t.addCustomerModal;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const timer = setTimeout(() => { lucide.createIcons(); }, 50);
    return () => clearTimeout(timer);
  }, [isAddCustomerModalOpen]);

  return (
    <Modal isOpen={isAddCustomerModalOpen} onClose={() => setIsAddCustomerModalOpen(false)} title={t_modal.title} theme={theme}>
      <form onSubmit={handleAddCustomer} className="space-y-4">
        <div>
          <label htmlFor="customer_name" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.name}</label>
          <input
            type="text"
            id="customer_name"
            name="name"
            value={newCustomer.name}
            onChange={handleChange}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            required
          />
        </div>
        <div>
          <label htmlFor="customer_contact" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.contact}</label>
          <input
            type="text"
            id="customer_contact"
            name="contact"
            value={newCustomer.contact}
            onChange={handleChange}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
          />
        </div>
        <div>
          <label htmlFor="customer_acres" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
            {t_modal.acres}
          </label>
          <input
            type="number"
            id="customer_acres"
            name="acres"
            value={newCustomer.acres || ''}
            onChange={handleChange}
            placeholder="e.g., 100.50"
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            step="0.01"
            min="0"
          />
        </div>
        <div>
          <label htmlFor="customer_rate" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.rate}</label>
          <input
            type="number"
            id="customer_rate"
            name="rate"
            value={newCustomer.rate}
            onChange={handleChange}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            required
            step="0.01"
          />
        </div>
        <div>
          <label htmlFor="customer_remark" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
            {t_modal.serviceArea} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="customer_remark"
            name="remark"
            value={newCustomer.remark}
            onChange={handleChange}
            placeholder="e.g., North Region, Sabah, Johor"
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            required
          />
        </div>
        <div>
          <label htmlFor="customer_remark2" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
            {t_modal.location}
          </label>
          <input
            type="text"
            id="customer_remark2"
            name="remark2"
            value={newCustomer.remark2}
            onChange={handleChange}
            placeholder="e.g., Factory A, Warehouse B"
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => setIsAddCustomerModalOpen(false)}
            className={`px-4 py-2 rounded-lg border ${theme === 'light' ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {t_modal.addCustomer}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// --- Edit Customer Modal ---
const EditCustomerModal = ({ t, theme, isEditCustomerModalOpen, setIsEditCustomerModalOpen, editingCustomer, setEditingCustomer, handleUpdateCustomer, originalCustomer }) => {
  const t_modal = t.editCustomerModal;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    // For number inputs, convert empty string to null
    const processedValue = type === 'number' && value === '' ? null : value;
    console.log('[EDIT CUSTOMER] Field changed:', name, '=', processedValue, '(type:', type, ')');
    setEditingCustomer(prev => ({ ...prev, [name]: processedValue }));
  };

  // --- FIX: Check if data is unchanged ---
  const isUnchanged = useMemo(() => {
    if (!originalCustomer || !editingCustomer) return true;
    return originalCustomer.name === editingCustomer.name &&
           (originalCustomer.contact || '') === (editingCustomer.contact || '') &&
           String(originalCustomer.acres || '') === String(editingCustomer.acres || '') &&
           String(originalCustomer.rate) === String(editingCustomer.rate) &&
           (originalCustomer.remark || '') === (editingCustomer.remark || '') &&
           (originalCustomer.remark2 || '') === (editingCustomer.remark2 || '');
  }, [originalCustomer, editingCustomer]);

  useEffect(() => {
    const timer = setTimeout(() => { lucide.createIcons(); }, 50);
    return () => clearTimeout(timer);
  }, [isEditCustomerModalOpen]);

  if (!editingCustomer) return null;

  return (
    <Modal isOpen={isEditCustomerModalOpen} onClose={setIsEditCustomerModalOpen} title={t_modal.title} theme={theme}>
      <form onSubmit={handleUpdateCustomer} className="space-y-4">
        <div>
          <label htmlFor="edit_customer_name" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.name}</label>
          <input
            type="text"
            id="edit_customer_name"
            name="name"
            value={editingCustomer.name}
            onChange={handleChange}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            required
          />
        </div>
        <div>
          <label htmlFor="edit_customer_contact" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.contact}</label>
          <input
            type="text"
            id="edit_customer_contact"
            name="contact"
            value={editingCustomer.contact || ''}
            onChange={handleChange}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
          />
        </div>
        <div>
          <label htmlFor="edit_customer_acres" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
            {t_modal.acres}
          </label>
          <input
            type="number"
            id="edit_customer_acres"
            name="acres"
            value={editingCustomer.acres || ''}
            onChange={handleChange}
            placeholder="e.g., 100.50"
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            step="0.01"
            min="0"
          />
        </div>
        <div>
          <label htmlFor="edit_customer_rate" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t_modal.rate}</label>
          <input
            type="number"
            id="edit_customer_rate"
            name="rate"
            value={editingCustomer.rate}
            onChange={handleChange}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            required
            step="0.01"
          />
        </div>
        <div>
          <label htmlFor="edit_customer_remark" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
            {t_modal.serviceArea} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="edit_customer_remark"
            name="remark"
            value={editingCustomer.remark || ''}
            onChange={handleChange}
            placeholder="e.g., North Region, Sabah, Johor"
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
            required
          />
        </div>
        <div>
          <label htmlFor="edit_customer_remark2" className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
            {t_modal.location}
          </label>
          <input
            type="text"
            id="edit_customer_remark2"
            name="remark2"
            value={editingCustomer.remark2 || ''}
            onChange={handleChange}
            placeholder="e.g., Factory A, Warehouse B"
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'light' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={setIsEditCustomerModalOpen}
            className={`px-4 py-2 rounded-lg border ${theme === 'light' ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}`}
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={isUnchanged}
            className={`px-4 py-2 rounded-lg bg-emerald-600 text-white transition ${isUnchanged ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-700'}`}
          >
            {t_modal.updateCustomer}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// --- Assign components to window object ---
// This makes them accessible to app_logic.js
window.AddWorkerModal = AddWorkerModal;
window.EditWorkerModal = EditWorkerModal;
window.AddWorkLogModal = AddWorkLogModal;
window.EditWorkLogModal = EditWorkLogModal;
window.AddCustomerModal = AddCustomerModal;
window.EditCustomerModal = EditCustomerModal;
