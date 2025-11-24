const { useState, useEffect, useMemo, useCallback, memo, useRef } = React;

// --- Utility Hooks ---
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// --- Updated usePagination Hook ---
const usePagination = (data, pageSize) => {
  const getPageFromHash = useCallback(() => {
    const hash = window.location.hash;
    const pageMatch = hash.match(/\/(\d+)$/);
    const page = pageMatch ? parseInt(pageMatch[1], 10) : 1;
    return Math.max(1, page);
  }, []);

  const [currentPage, setCurrentPageInternal] = useState(getPageFromHash);
  const maxPage = Math.ceil(data.length / pageSize);

  const setCurrentPage = useCallback(
    (page) => {
      const pageToSet = Math.max(1, Math.min(page, maxPage || page));

      const hashParts = (window.location.hash || "#dashboard/1").split("/");
      const currentTab = hashParts[0] || "#dashboard";
      const tabPart = currentTab.startsWith("#")
        ? currentTab
        : `#${currentTab}`;
      const newHash = `${tabPart}/${pageToSet}`;

      setCurrentPageInternal(pageToSet);

      if (window.location.hash !== newHash) {
        window.history.replaceState(null, "", newHash);
      }
    },
    [maxPage]
  );

  useEffect(() => {
    const handleHashChange = () => {
      const newPage = getPageFromHash();
      if (newPage !== currentPage) {
        setCurrentPageInternal(newPage);
      }
    };

    if (!window.location.hash.includes("/")) {
      setCurrentPage(currentPage);
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [currentPage, getPageFromHash, setCurrentPage]);

  useEffect(() => {
    if (maxPage > 0 && currentPage > maxPage) {
      setCurrentPage(maxPage);
    } else if (
      data.length > 0 &&
      currentPage === 1 &&
      getPageFromHash() > 1 &&
      maxPage >= getPageFromHash()
    ) {
      setCurrentPage(getPageFromHash());
    }
  }, [data.length, maxPage, currentPage, setCurrentPage, getPageFromHash]);

  const currentData = useMemo(() => {
    const pageToUse = Math.min(currentPage, maxPage || 1);
    const start = (pageToUse - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [currentPage, data, pageSize, maxPage]);

  return { currentData, currentPage, setCurrentPage, maxPage };
};

// --- NEW: Time Formatting Utility ---
const formatTimeAgo = (date, t_time) => {
  const now = new Date();
  const seconds = Math.floor((now - new Date(date)) / 1000);

  let interval = seconds / 31536000; // years
  if (interval > 1) {
    return new Date(date).toLocaleDateString(); // Just show date if over a year
  }
  interval = seconds / 2592000; // months
  if (interval > 1) {
    return new Date(date).toLocaleDateString();
  }
  interval = seconds / 86400; // days
  if (interval > 1) {
    return t_time.daysAgo.replace("%s", Math.floor(interval));
  }
  interval = seconds / 3600; // hours
  if (interval > 1) {
    return t_time.hoursAgo.replace("%s", Math.floor(interval));
  }
  interval = seconds / 60; // minutes
  if (interval > 1) {
    return t_time.minutesAgo.replace("%s", Math.floor(interval));
  }
  if (seconds < 10) {
    return t_time.justNow;
  }
  return t_time.minuteAgo;
};

// --- Helper Components ---
const Navigation = memo(
  ({ t, theme, language, setLang, toggleTheme, handleLogout, setSidebarOpen }) => (
    // --- LAYOUT FIX: Added fixed positioning and z-index ---
    <nav
      className={`${
        theme === "light" ? "bg-emerald-700" : "bg-gray-800"
      } text-white shadow-lg gpu-accelerated fixed top-0 left-0 right-0 z-50`}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded hover:bg-emerald-600 transition"
              title="Open Menu"
            >
              <i data-lucide="menu" style={{ width: 20, height: 20 }}></i>
            </button>
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="50" cy="50" r="45" fill="#10b981" />
              <g transform="translate(50, 50)">
                <ellipse cx="0" cy="-15" rx="8" ry="20" fill="#059669" />
                <ellipse
                  cx="-12"
                  cy="-8"
                  rx="8"
                  ry="20"
                  fill="#059669"
                  transform="rotate(-60)"
                />
                <ellipse
                  cx="12"
                  cy="-8"
                  rx="8"
                  ry="20"
                  fill="#059669"
                  transform="rotate(60)"
                />
                <ellipse
                  cx="-15"
                  cy="5"
                  rx="8"
                  ry="20"
                  fill="#047857"
                  transform="rotate(-120)"
                />
                <ellipse
                  cx="15"
                  cy="5"
                  rx="8"
                  ry="20"
                  fill="#047857"
                  transform="rotate(120)"
                />
                <ellipse
                  cx="-8"
                  cy="15"
                  rx="8"
                  ry="18"
                  fill="#047857"
                  transform="rotate(-180)"
                />
                <ellipse
                  cx="8"
                  cy="15"
                  rx="8"
                  ry="18"
                  fill="#047857"
                  transform="rotate(180)"
                />
                <circle cx="0" cy="0" r="12" fill="#065f46" />
                <rect
                  x="-3"
                  y="0"
                  width="6"
                  height="30"
                  fill="#92400e"
                  rx="2"
                />
              </g>
            </svg>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold truncate">
                {t.appName}
              </h1>
              <p className="text-xs text-emerald-200 hidden sm:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
            <select
              onChange={(e) => setLang(e.target.value)}
              value={language}
              className="bg-emerald-600 text-white px-2 py-2 text-xs sm:text-sm rounded hover:bg-emerald-800 transition appearance-none"
            >
              <option value="en">EN</option>
              <option value="ms">BM</option>
              <option value="zh">中文</option>
            </select>
            <button
              onClick={toggleTheme}
              className="flex items-center bg-emerald-600 p-2 rounded hover:bg-emerald-800 transition"
            >
              <i
                data-lucide={theme === "light" ? "moon" : "sun"}
                style={{ width: 16, height: 16 }}
              ></i>
            </button>
            <span className="text-xs sm:text-sm hidden md:inline">
              {t.adminUser}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 bg-emerald-600 px-2 sm:px-3 py-2 rounded hover:bg-emerald-800 transition"
            >
              <i data-lucide="log-out" style={{ width: 16, height: 16 }}></i>
              <span className="text-xs sm:text-sm hidden sm:inline">
                {t.logout}
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
);

const Sidebar = memo(
  ({ t, theme, sidebarOpen, setSidebarOpen, activeTab, setActiveTab }) => {
    useEffect(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, [activeTab, theme]);

    return (
      <aside
        className={`fixed left-0 top-16 bottom-0 transition-all duration-300 z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 md:translate-x-0 ${sidebarOpen ? "md:w-64" : "md:w-20"} ${
          theme === "light" ? "bg-white" : "bg-gray-800"
        } shadow-lg gpu-accelerated`}
      >
        <div className="p-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`mb-6 p-2 rounded transition ${
              theme === "light"
                ? "hover:bg-gray-100 text-gray-700"
                : "hover:bg-gray-700 text-gray-300"
            }`}
            title={sidebarOpen ? t.sidebarClose : t.sidebarOpen}
          >
            <i data-lucide="menu" style={{ width: 24, height: 24 }}></i>
          </button>

          {/* --- SIDEBAR ITEMS --- */}
          <div className="space-y-2">
            <SidebarItem
              t={t}
              theme={theme}
              icon="trending-up"
              tab="dashboard"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
            <SidebarItem
              t={t}
              theme={theme}
              icon="users"
              tab="workers"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
            <SidebarItem
              t={t}
              theme={theme}
              icon="file-text"
              tab="worklogs"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
            <SidebarItem
              t={t}
              theme={theme}
              icon="dollar-sign"
              tab="customers"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
            <SidebarItem
              t={t}
              theme={theme}
              icon="calendar"
              tab="payroll"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
            <SidebarItem
              t={t}
              theme={theme}
              icon="inbox"
              tab="applications"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
          </div>
        </div>
      </aside>
    );
  }
);

const SidebarItem = memo(
  ({ t, theme, icon, tab, activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) => {
    const handleClick = () => {
      setActiveTab(tab);
      // Close sidebar on mobile after clicking an item
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    return (
      <button
        onClick={handleClick}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
          activeTab === tab
            ? theme === "light"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-emerald-800 text-white"
            : theme === "light"
            ? "text-gray-700 hover:bg-gray-100"
            : "text-gray-300 hover:bg-gray-700"
        }`}
      >
        <i data-lucide={icon}></i>
        {sidebarOpen && <span className="font-medium">{t[tab]}</span>}
      </button>
    );
  }
);

// --- Main Application Component ---
const EasiSawit = ({ translations }) => {
  const AddWorkerModalRef = useRef(null);
  const EditWorkerModalRef = useRef(null);
  const AddWorkLogModalRef = useRef(null);
  const EditWorkLogModalRef = useRef(null);
  const AddCustomerModalRef = useRef(null);
  const EditCustomerModalRef = useRef(null);

  useEffect(() => {
    if (window.AddWorkerModal)
      AddWorkerModalRef.current = window.AddWorkerModal;
    if (window.EditWorkerModal)
      EditWorkerModalRef.current = window.EditWorkerModal;
    if (window.AddWorkLogModal)
      AddWorkLogModalRef.current = window.AddWorkLogModal;
    if (window.EditWorkLogModal)
      EditWorkLogModalRef.current = window.EditWorkLogModal;
    if (window.AddCustomerModal)
      AddCustomerModalRef.current = window.AddCustomerModal;
    if (window.EditCustomerModal)
      EditCustomerModalRef.current = window.EditCustomerModal;
  }, []);

  // --- State ---
  const [activeTab, setActiveTab] = useState(
    window.location.hash.split("/")[0].substring(1) || "dashboard"
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch (e) {
      /* ignore */
    }
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });
  const [language, setLanguage] = useState("en");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [workerTypeFilter, setWorkerTypeFilter] = useState("All Types");

  // Update document language when language changes (for date pickers)
  useEffect(() => {
    const htmlElement = document.documentElement;
    const langMap = { 'en': 'en-US', 'ms': 'ms-MY', 'zh': 'zh-CN' };
    htmlElement.setAttribute('lang', langMap[language] || 'en-US');
  }, [language]);

  // Work Log Filters
  const [workLogWorkerFilter, setWorkLogWorkerFilter] = useState("All");
  const [workLogCustomerFilter, setWorkLogCustomerFilter] = useState("All");

  // Customer Search
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const debouncedCustomerSearch = useDebounce(customerSearchTerm, 300);

  // --- NEW: Dynamic Activity State ---
  const [recentActivity, setRecentActivity] = useState([]);

  // Worker Modals
  const [isAddWorkerModalOpen, setIsAddWorkerModalOpen] = useState(false);
  const [newWorker, setNewWorker] = useState({
    name: "",
    type: "Local",
    epf: "",
    permit: "",
    status: "Active",
    identity_number: "",
    identity_type: "",
    age: "",
    marital_status: "",
    children_count: 0,
    spouse_working: 0,
    zakat_monthly: 0,
  });
  const [isEditWorkerModalOpen, setIsEditWorkerModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [originalEditingWorker, setOriginalEditingWorker] = useState(null); // --- FIX: Store original state
  const [workers, setWorkers] = useState([]);

  // Work Log Modals
  const [isAddWorkLogModalOpen, setIsAddWorkLogModalOpen] = useState(false);
  const [newWorkLog, setNewWorkLog] = useState({
    log_date: "",
    worker_id: "",
    customer_id: "",
    tons: "",
    rate_per_ton: "",
  });
  const [isEditWorkLogModalOpen, setIsEditWorkLogModalOpen] = useState(false);
  const [editingWorkLog, setEditingWorkLog] = useState(null);
  const [originalEditingWorkLog, setOriginalEditingWorkLog] = useState(null); // --- FIX: Store original state
  const [workLogs, setWorkLogs] = useState([]);

  // Customer Modals
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    contact: "",
    rate: "",
    remark: "",
    remark2: "",
  });
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [originalEditingCustomer, setOriginalEditingCustomer] = useState(null); // --- FIX: Store original state
  const [customers, setCustomers] = useState([]);
  const [archivedCustomers, setArchivedCustomers] = useState([]);
  const [showArchivedCustomers, setShowArchivedCustomers] = useState(false);

  // Payroll State
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [payrollMonth, setPayrollMonth] = useState(currentMonth);
  const [payrollYear, setPayrollYear] = useState(currentYear);
  const [payrollWorkerType, setPayrollWorkerType] = useState("All");
  const [payrollSummary, setPayrollSummary] = useState(null);
  const [currentRunId, setCurrentRunId] = useState(null);

  // CPO Price State
  const [cpoPriceData, setCpoPriceData] = useState(null);

  // Use a relative API base so it works whether the site is served at /
  // or under a subpath like /easisawit/
  const API_URL = "api";

  // --- Memoized Translation ---
  const t = useMemo(() => translations[language], [language, translations]);

  // --- NEW: Activity Logger ---
  const addActivity = useCallback(
    (key, icon, ...args) => {
      const t_log = translations[language].activityLog;
      let text = t_log[key] || "Unknown action";

      // Replace placeholders
      if (args.length > 0) {
        args.forEach((arg) => {
          text = text.replace("%s", arg);
        });
      }

      const newActivity = {
        id: Date.now(),
        text,
        icon,
        time: new Date(),
      };
      // Add to start of array and cap at 5
      setRecentActivity((prev) => [newActivity, ...prev.slice(0, 4)]);
    },
    [language, translations]
  );

  const removeActivity = useCallback((activityId) => {
    setRecentActivity((prev) =>
      prev.filter((activity) => activity.id !== activityId)
    );
  }, []);

  const clearAllActivities = useCallback(() => {
    setRecentActivity([]);
  }, []);

  // --- Callbacks ---
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem("theme", next);
      } catch (e) {
        /* ignore */
      }
      return next;
    });
  }, []);
  const setLang = useCallback((lang) => setLanguage(lang), []);

  // --- NEW: Handle logout ---
  const handleLogout = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api_logout.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        sessionStorage.clear();
        window.location.href = "login.html";
      } else {
        alert("Failed to logout. Please try again.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert(`Error logging out: ${error.message}`);
    }
  }, [API_URL]);

  const handleTabChange = useCallback(
    (tab) => {
      if (activeTab !== tab) {
        // setActiveTab(tab); // This is now handled by the hash listener
        window.location.hash = `#${tab}/1`;
      }
    },
    [activeTab]
  );

  // --- FIX: Modal Close Handlers ---
  const closeEditWorkerModal = useCallback(() => {
    setIsEditWorkerModalOpen(false);
    setEditingWorker(null);
    setOriginalEditingWorker(null);
  }, []);

  const closeEditCustomerModal = useCallback(() => {
    setIsEditCustomerModalOpen(false);
    setEditingCustomer(null);
    setOriginalEditingCustomer(null);
  }, []);

  const closeEditWorkLogModal = useCallback(() => {
    setIsEditWorkLogModalOpen(false);
    setEditingWorkLog(null);
    setOriginalEditingWorkLog(null);
  }, []);

  // --- CRUD Callbacks ---
  // Workers
  const fetchWorkers = useCallback(() => {
    console.log("Fetching workers...");
    return fetch(`${API_URL}/api_worker.php?_=${new Date().getTime()}`)
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject("Network error fetching workers")
      )
      .then((data) => {
        console.log("Workers fetched:", data);
        setWorkers(data || []);
      })
      .catch((error) => {
        console.error("Error in fetchWorkers:", error);
        alert(`Failed to refresh worker list: ${error.message || error}`);
      });
  }, [API_URL]);

  const handleAddNewWorker = useCallback(
    (e) => {
      e.preventDefault();
      if (!newWorker.name) return alert("Worker name is required.");

      // Find submit button and set loading state
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const loadingState = window.setButtonLoading && submitBtn
        ? window.setButtonLoading(submitBtn, "Saving...")
        : null;

      fetch(`${API_URL}/api_add_worker.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWorker),
      })
        .then((response) =>
          response.ok
            ? response.json()
            : response
                .json()
                .then((err) =>
                  Promise.reject(err.message || "Add worker failed")
                )
        )
        .then((data) => {
          console.log("Add Worker Success:", data);
          setIsAddWorkerModalOpen(false);
          addActivity("addWorker", "user-plus", newWorker.name); // --- ADD ACTIVITY ---
          setNewWorker({
            name: "",
            type: "Local",
            epf: "",
            permit: "",
            status: "Active",
            identity_number: "",
            identity_type: "",
            age: "",
            marital_status: "",
            children_count: 0,
            spouse_working: 0,
            zakat_monthly: 0,
          });
          fetchWorkers();
        })
        .catch((error) => {
          console.error("Add Worker Error:", error);
          alert(`Error adding worker: ${error}`);
        })
        .finally(() => {
          if (loadingState) loadingState.reset();
        });
    },
    [newWorker, API_URL, fetchWorkers, addActivity]
  );

  const handleDeleteWorker = useCallback(
    (workerId, workerName) => {
      if (!window.confirm(`Delete "${workerName}" (ID: ${workerId})?`)) return;
      fetch(`${API_URL}/api_delete_worker.php?id=${workerId}`, {
        method: "DELETE",
      })
        .then((response) =>
          response.ok
            ? response.json()
            : response
                .json()
                .then((err) =>
                  Promise.reject(err.message || "Delete worker failed")
                )
        )
        .then((data) => {
          console.log("Delete Worker Success:", data);
          addActivity("deleteWorker", "user-minus", workerName); // --- ADD ACTIVITY ---
          fetchWorkers();
        })
        .catch((error) => {
          console.error("Delete Worker Error:", error);
          alert(`Error deleting worker: ${error}`);
        });
    },
    [API_URL, fetchWorkers, addActivity]
  );

  const handleEditWorkerClick = useCallback((worker) => {
    setOriginalEditingWorker(worker); // --- FIX: Store original
    setEditingWorker({ ...worker }); // --- FIX: Store copy
    setIsEditWorkerModalOpen(true);
  }, []);

  const handleUpdateWorker = useCallback(
    (e) => {
      e.preventDefault();
      if (!editingWorker || !editingWorker.name)
        return alert("Worker data is missing.");

      // Find submit button and set loading state
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const loadingState = window.setButtonLoading && submitBtn
        ? window.setButtonLoading(submitBtn, "Updating...")
        : null;

      fetch(`${API_URL}/api_update_worker.php`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingWorker),
      })
        .then((response) =>
          response.ok
            ? response.json()
            : response
                .json()
                .then((err) =>
                  Promise.reject(err.message || "Update worker failed")
                )
        )
        .then((data) => {
          console.log("Update Worker Success:", data);
          // --- FIX: Only add activity if rows actually changed ---
          if (data.changed === true) {
            addActivity("updateWorker", "user-check", editingWorker.name);
          }
          closeEditWorkerModal(); // --- FIX: Use close handler
          fetchWorkers();
        })
        .catch((error) => {
          console.error("Update Worker Error:", error);
          alert(`Error updating worker: ${error}`);
        })
        .finally(() => {
          if (loadingState) loadingState.reset();
        });
    },
    [editingWorker, API_URL, fetchWorkers, addActivity, closeEditWorkerModal]
  );

  // Work Logs
  const fetchWorkLogs = useCallback(() => {
    console.log("Fetching work logs...");
    return fetch(`${API_URL}/api_get_worklogs.php?_=${new Date().getTime()}`)
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject("Network error fetching work logs")
      )
      .then((data) => {
        console.log("Work logs fetched:", data);
        const parsedLogs = (data || []).map((log) => ({
          id: log.id,
          log_date: log.log_date,
          worker_id: parseInt(log.worker_id, 10), // --- FIX: Ensure IDs are numbers for comparison
          worker_name: log.worker_name,
          customer_id: parseInt(log.customer_id, 10), // --- FIX: Ensure IDs are numbers for comparison
          customer_name: log.customer_name,
          tons: log.tons,
          rate_per_ton: log.rate_per_ton,
        }));
        setWorkLogs(parsedLogs);
      })
      .catch((error) => {
        console.error("Error fetching work logs:", error);
        setWorkLogs([]);
      });
  }, [API_URL]);

  const handleAddWorkLog = useCallback(
    (e) => {
      e.preventDefault();
      console.log("Attempting to add work log with data:", newWorkLog);

      // Validate required fields
      if (
        !newWorkLog.log_date ||
        !newWorkLog.worker_id ||
        !newWorkLog.customer_id ||
        !newWorkLog.tons ||
        !newWorkLog.rate_per_ton
      )
        return alert("All work log fields are required.");

      // Validate date is not in the future (Malaysia timezone)
      const now = new Date();
      const malaysiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
      const today = new Date(malaysiaTime.getFullYear(), malaysiaTime.getMonth(), malaysiaTime.getDate());
      const selectedDate = new Date(newWorkLog.log_date + 'T00:00:00');

      if (selectedDate > today) {
        return alert("操作失败：工作日志日期不能晚于当前日期。\nOperation failed: Work log date cannot be later than current date.");
      }

      // Find submit button and set loading state
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const loadingState = window.setButtonLoading && submitBtn
        ? window.setButtonLoading(submitBtn, "Saving...")
        : null;

      fetch(`${API_URL}/api_add_worklog.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWorkLog),
      })
        .then((response) =>
          response.ok
            ? response.json()
            : response
                .json()
                .then((err) =>
                  Promise.reject(err.message || "Add work log failed")
                )
        )
        .then((data) => {
          console.log("Add Work Log Success:", data);
          setIsAddWorkLogModalOpen(false);
          addActivity("addWorkLog", "file-plus", newWorkLog.tons); // --- ADD ACTIVITY ---
          setNewWorkLog({
            log_date: "",
            worker_id: "",
            customer_id: "",
            tons: "",
            rate_per_ton: "",
          });
          // Reset filters to show all work logs including the new one
          setWorkLogWorkerFilter("All");
          setWorkLogCustomerFilter("All");
          // Refresh all related data
          fetchWorkLogs();
          fetchWorkers();
          fetchCustomers();
        })
        .catch((error) => {
          console.error("Add Work Log Error:", error);
          alert(`Error adding work log: ${error}`);
        })
        .finally(() => {
          if (loadingState) loadingState.reset();
        });
    },
    [newWorkLog, API_URL, fetchWorkLogs, fetchWorkers, fetchCustomers, addActivity, setWorkLogWorkerFilter, setWorkLogCustomerFilter]
  );

  const handleDeleteWorkLog = useCallback(
    (workLogId) => {
      if (!window.confirm(`Delete work log ID: ${workLogId}?`)) return;
      fetch(`${API_URL}/api_delete_worklog.php?id=${workLogId}`, {
        method: "DELETE",
      })
        .then((response) =>
          response.ok
            ? response.json()
            : response
                .json()
                .then((err) =>
                  Promise.reject(err.message || "Delete work log failed")
                )
        )
        .then((data) => {
          console.log("Delete Work Log Success:", data);
          addActivity("deleteWorkLog", "file-minus", workLogId); // --- ADD ACTIVITY ---
          fetchWorkLogs();
        })
        .catch((error) => {
          console.error("Delete Work Log Error:", error);
          alert(`Error deleting work log: ${error}`);
        });
    },
    [API_URL, fetchWorkLogs, addActivity]
  );

  const handleEditWorkLogClick = useCallback((workLog) => {
    setOriginalEditingWorkLog(workLog); // --- FIX: Store original
    setEditingWorkLog({ ...workLog }); // --- FIX: Store copy
    setIsEditWorkLogModalOpen(true);
  }, []);

  const handleUpdateWorkLog = useCallback(
    (e) => {
      e.preventDefault();

      // Validate required fields
      if (
        !editingWorkLog ||
        !editingWorkLog.log_date ||
        !editingWorkLog.worker_id ||
        !editingWorkLog.customer_id ||
        !editingWorkLog.tons ||
        !editingWorkLog.rate_per_ton
      )
        return alert("All work log fields are required.");

      // Validate date is not in the future (Malaysia timezone)
      const now = new Date();
      const malaysiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
      const today = new Date(malaysiaTime.getFullYear(), malaysiaTime.getMonth(), malaysiaTime.getDate());
      const selectedDate = new Date(editingWorkLog.log_date + 'T00:00:00');

      if (selectedDate > today) {
        return alert("操作失败：工作日志日期不能晚于当前日期。\nOperation failed: Work log date cannot be later than current date.");
      }

      // Find submit button and set loading state
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const loadingState = window.setButtonLoading && submitBtn
        ? window.setButtonLoading(submitBtn, "Updating...")
        : null;

      fetch(`${API_URL}/api_update_worklog.php`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingWorkLog),
      })
        .then((response) =>
          response.ok
            ? response.json()
            : response
                .json()
                .then((err) =>
                  Promise.reject(err.message || "Update work log failed")
                )
        )
        .then((data) => {
          console.log("Update Work Log Success:", data);
          // --- FIX: Only add activity if rows actually changed ---
          if (data.changed === true) {
            addActivity("updateWorkLog", "file-check", editingWorkLog.id);
          }
          closeEditWorkLogModal(); // --- FIX: Use close handler
          fetchWorkLogs();
        })
        .catch((error) => {
          console.error("Update Work Log Error:", error);
          alert(`Error updating work log: ${error}`);
        })
        .finally(() => {
          if (loadingState) loadingState.reset();
        });
    },
    [editingWorkLog, API_URL, fetchWorkLogs, addActivity, closeEditWorkLogModal]
  );

  // Customers
  const fetchCustomers = useCallback(() => {
    console.log("Fetching customers...");
    return fetch(`${API_URL}/api_get_customer.php?_=${new Date().getTime()}`)
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject("Network error fetching customers")
      )
      .then((data) => {
        console.log("Customers fetched:", data);
        setCustomers(data || []);
      })
      .catch((error) => {
        console.error("Error fetching customers:", error);
      });
  }, [API_URL]);

  const fetchArchivedCustomers = useCallback(() => {
    console.log("Fetching archived customers...");
    return fetch(`${API_URL}/api_get_archived_customers.php?_=${new Date().getTime()}`)
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject("Network error fetching archived customers")
      )
      .then((data) => {
        console.log("Archived customers fetched:", data);
        setArchivedCustomers(data || []);
      })
      .catch((error) => {
        console.error("Error fetching archived customers:", error);
      });
  }, [API_URL]);

  const handleAddCustomer = useCallback(
    (e) => {
      e.preventDefault();
      if (!newCustomer.name || !newCustomer.rate)
        return alert("Customer name and rate are required.");

      // Find submit button and set loading state
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const loadingState = window.setButtonLoading && submitBtn
        ? window.setButtonLoading(submitBtn, "Saving...")
        : null;

      fetch(`${API_URL}/api_add_customer.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      })
        .then((response) =>
          response.ok
            ? response.json()
            : response
                .json()
                .then((err) =>
                  Promise.reject(err.message || "Add customer failed")
                )
        )
        .then((data) => {
          console.log("Add Customer Success:", data);
          setIsAddCustomerModalOpen(false);
          addActivity("addCustomer", "briefcase", newCustomer.name); // --- ADD ACTIVITY ---
          setNewCustomer({ name: "", contact: "", rate: "", remark: "", remark2: "" });
          fetchCustomers();
        })
        .catch((error) => {
          console.error("Add Customer Error:", error);
          alert(`Error adding customer: ${error}`);
        })
        .finally(() => {
          if (loadingState) loadingState.reset();
        });
    },
    [newCustomer, API_URL, fetchCustomers, addActivity]
  );

  const handleEditCustomerClick = useCallback((customer) => {
    setOriginalEditingCustomer(customer); // --- FIX: Store original
    setEditingCustomer({ ...customer }); // --- FIX: Store copy
    setIsEditCustomerModalOpen(true);
  }, []);

  const handleUpdateCustomer = useCallback(
    (e) => {
      e.preventDefault();
      if (!editingCustomer || !editingCustomer.name || !editingCustomer.rate)
        return alert("Customer name and rate are required.");

      // Find submit button and set loading state
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const loadingState = window.setButtonLoading && submitBtn
        ? window.setButtonLoading(submitBtn, "Updating...")
        : null;

      fetch(`${API_URL}/api_update_customer.php`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCustomer),
      })
        .then((response) =>
          response.ok
            ? response.json()
            : response
                .json()
                .then((err) =>
                  Promise.reject(err.message || "Update customer failed")
                )
        )
        .then((data) => {
          console.log("Update Customer Success:", data);
          // --- FIX: Only add activity if rows actually changed ---
          if (data.changed === true) {
            addActivity("updateCustomer", "briefcase", editingCustomer.name);
          }
          closeEditCustomerModal(); // --- FIX: Use close handler
          fetchCustomers();
        })
        .catch((error) => {
          console.error("Update Customer Error:", error);
          alert(`Error updating customer: ${error}`);
        })
        .finally(() => {
          if (loadingState) loadingState.reset();
        });
    },
    [
      editingCustomer,
      API_URL,
      fetchCustomers,
      addActivity,
      closeEditCustomerModal,
    ]
  );

  const handleDeleteCustomer = useCallback(
    (customerId, customerName) => {
      if (
        !window.confirm(
          `Delete customer "${customerName}" (ID: ${customerId})?`
        )
      )
        return;
      fetch(`${API_URL}/api_delete_customer.php?id=${customerId}`, {
        method: "DELETE",
      })
        .then((response) =>
          response.ok
            ? response.json()
            : response
                .json()
                .then((err) =>
                  Promise.reject(err.message || "Delete customer failed")
                )
        )
        .then((data) => {
          console.log("Delete Customer Success:", data);
          addActivity("deleteCustomer", "briefcase", customerName); // --- ADD ACTIVITY ---
          fetchCustomers();
        })
        .catch((error) => {
          console.error("Delete Customer Error:", error);
          alert(`Error deleting customer: ${error}`);
        });
    },
    [API_URL, fetchCustomers, addActivity]
  );

  const handleReactivateCustomer = useCallback(
    (customerId, customerName) => {
      if (
        !window.confirm(
          `Reactivate customer "${customerName}"? This will set their last purchase date to today.`
        )
      )
        return;
      fetch(`${API_URL}/api_reactivate_customer.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId }),
      })
        .then((response) =>
          response.ok
            ? response.json()
            : response
                .json()
                .then((err) =>
                  Promise.reject(err.message || "Reactivate customer failed")
                )
        )
        .then((data) => {
          console.log("Reactivate Customer Success:", data);
          addActivity("reactivateCustomer", "briefcase", customerName);
          fetchCustomers();
          fetchArchivedCustomers();
        })
        .catch((error) => {
          console.error("Reactivate Customer Error:", error);
          alert(`Error reactivating customer: ${error}`);
        });
    },
    [API_URL, fetchCustomers, fetchArchivedCustomers, addActivity]
  );

  useEffect(() => {
    window.handleDeleteCustomer = handleDeleteCustomer;
    return () => {
      try {
        delete window.handleDeleteCustomer;
      } catch (e) {}
    };
  }, [handleDeleteCustomer]);

  // Payroll
  const handleRunPayrollCalculation = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api_calculate_payroll.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: payrollMonth,
          year: payrollYear,
          worker_type: payrollWorkerType,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Network error calculating payroll"
        );
      }
      const data = await response.json();
      console.log("Payroll Calculation Success:", data);
      addActivity("runPayroll", "calculator", payrollMonth, payrollYear); // --- ADD ACTIVITY ---
      setPayrollSummary(data.payroll_summary);
      setCurrentRunId(data.run_id);
    } catch (error) {
      console.error("Payroll Calculation Error:", error);
      alert(`Error calculating payroll: ${error.message || error}`);
      setPayrollSummary(null);
      setCurrentRunId(null);
    }
  }, [API_URL, payrollMonth, payrollYear, payrollWorkerType, addActivity]);

  const handleGeneratePayslips = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api_generate_payslips.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: payrollMonth,
          year: payrollYear,
          worker_type: payrollWorkerType,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Network error generating payslips"
        );
      }
      const data = await response.json();
      console.log("Generate Payslips Success:", data);
      alert(data.message);
    } catch (error) {
      console.error("Generate Payslips Error:", error);
      alert(`Error generating payslips: ${error.message || error}`);
    }
  }, [API_URL, payrollMonth, payrollYear, payrollWorkerType]);

  const handleGenerateManagementReport = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/api_generate_management_report.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            month: payrollMonth,
            year: payrollYear,
            worker_type: payrollWorkerType,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Network error generating management report"
        );
      }
      // Download PDF directly
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Management_Report_${payrollMonth}_${payrollYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      alert("Management report downloaded successfully!");
    } catch (error) {
      console.error("Generate Management Report Error:", error);
      alert(`Error generating management report: ${error.message || error}`);
    }
  }, [API_URL, payrollMonth, payrollYear, payrollWorkerType]);

  const fetchCpoPrice = useCallback(() => {
    console.log("Fetching CPO price...");
    fetch(`${API_URL}/api_get_price.php?_=${new Date().getTime()}`)
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject("Network error fetching CPO price")
      )
      .then((data) => {
        console.log("CPO Price fetched:", data);
        setCpoPriceData(data);
      })
      .catch((error) => {
        console.error("Error fetching CPO price:", error);
        setCpoPriceData({ latest_price: "Error", error: error.message });
      });
  }, [API_URL]);

  // --- Effects ---
  // This effect updates icons when the app changes
  useEffect(() => {
    document.title = `${translations[language].appName} - ${translations[language].appSubtitle}`;
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      /* ignore */
    }

    const timer = setTimeout(() => {
      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [
    activeTab,
    theme,
    language,
    isAddWorkerModalOpen,
    isEditWorkerModalOpen,
    isAddWorkLogModalOpen,
    isEditWorkLogModalOpen,
    isAddCustomerModalOpen,
    isEditCustomerModalOpen,
    payrollSummary,
    translations,
    recentActivity,
  ]);

  // This effect verifies session and manages URL hash for tabs
  useEffect(() => {
    // --- NEW: Check if user is logged in ---
    const verifySession = async () => {
      try {
        const response = await fetch(`${API_URL}/check_auth.php`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok && response.status === 401) {
          console.warn(
            "Session expired or not authenticated, redirecting to login"
          );
          sessionStorage.clear();
          window.location.href = "login.html";
          return;
        }
      } catch (error) {
        console.error("Session verification error:", error);
        // Continue anyway - APIs will enforce auth
      }
    };

    // Only verify if not already logged in via sessionStorage
    if (!sessionStorage.getItem("isLoggedIn")) {
      verifySession();
    }

    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      const [tab, page] = hash.split("/");
      const validTabs = [
        "dashboard",
        "workers",
        "worklogs",
        "customers",
        "payroll",
        "applications",
      ];
      const currentTab = tab && validTabs.includes(tab) ? tab : "dashboard";

      setActiveTab(currentTab);

      if (!tab || !validTabs.includes(tab)) {
        window.location.hash = "dashboard/1";
      } else if (!page) {
        window.location.hash = `${currentTab}/1`;
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // Run on initial load
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [API_URL]); // Only run once on mount

  // This effect fetches all initial data
  useEffect(() => {
    fetchWorkers();
    fetchCustomers();
    fetchArchivedCustomers();
    fetchWorkLogs();
    fetchCpoPrice();
  }, [fetchWorkers, fetchCustomers, fetchArchivedCustomers, fetchWorkLogs, fetchCpoPrice]); // Dependencies are stable callbacks

  // --- Memoized Derived Data ---
  // t is already memoized above

  const filteredWorkers = useMemo(() => {
    let list = workers;
    if (workerTypeFilter !== "All Types") {
      list = list.filter((w) => w.type === workerTypeFilter);
    }
    if (debouncedSearch) {
      list = list.filter(
        (w) =>
          w.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          w.epf?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          w.permit?.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }
    return list;
  }, [workers, debouncedSearch, workerTypeFilter]);

  const filteredCustomers = useMemo(() => {
    let list = customers;
    if (debouncedCustomerSearch) {
      const searchLower = debouncedCustomerSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchLower) ||
          c.contact?.toLowerCase().includes(searchLower) ||
          c.acres?.toString().includes(searchLower) ||
          c.rate?.toString().includes(searchLower) ||
          c.remark?.toLowerCase().includes(searchLower) ||
          c.remark2?.toLowerCase().includes(searchLower)
      );
    }
    return list;
  }, [customers, debouncedCustomerSearch]);

  const filteredArchivedCustomers = useMemo(() => {
    let list = archivedCustomers;
    if (debouncedCustomerSearch) {
      const searchLower = debouncedCustomerSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchLower) ||
          c.contact?.toLowerCase().includes(searchLower) ||
          c.acres?.toString().includes(searchLower) ||
          c.rate?.toString().includes(searchLower) ||
          c.remark?.toLowerCase().includes(searchLower) ||
          c.remark2?.toLowerCase().includes(searchLower)
      );
    }
    return list;
  }, [archivedCustomers, debouncedCustomerSearch]);

  // Pagination Hooks
  const workersPagination = usePagination(filteredWorkers, 10);
  const workLogsPagination = usePagination(workLogs, 100);
  const customersPagination = usePagination(filteredCustomers, 10);
  const archivedCustomersPagination = usePagination(filteredArchivedCustomers, 10);

  // --- Render ---
  return (
    <div
      className={`min-h-screen ${
        theme === "light" ? "bg-gray-100" : "bg-gray-900"
      }`}
    >
      {/* --- LAYOUT FIX: Navigation is now fixed --- */}
      <Navigation
        t={t}
        theme={theme}
        language={language}
        setLang={setLang}
        toggleTheme={toggleTheme}
        handleLogout={handleLogout}
        setSidebarOpen={setSidebarOpen}
      />
      {/* --- LAYOUT FIX: Added 'pt-16' to this div to offset for fixed navbar --- */}
      <div className="flex pt-16">
        {/* --- LAYOUT FIX: Sidebar is correctly positioned --- */}
        <Sidebar
          t={t}
          theme={theme}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
        />
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* --- LAYOUT FIX: Main content has margin-left (ml-...) --- */}
        <main
          className={`flex-1 p-4 sm:p-6 md:p-8 transition-all duration-300 ml-0 w-full overflow-x-hidden ${
            sidebarOpen ? "md:ml-64" : "md:ml-20"
          }`}
        >
          {/* Access Modals via window object */}
          {window.AddWorkerModal && (
            <window.AddWorkerModal
              t={t}
              theme={theme}
              isModalOpen={isAddWorkerModalOpen}
              setIsModalOpen={setIsAddWorkerModalOpen}
              newWorker={newWorker}
              setNewWorker={setNewWorker}
              handleAddNewWorker={handleAddNewWorker}
            />
          )}
          {window.EditWorkerModal && (
            <window.EditWorkerModal
              t={t}
              theme={theme}
              isEditModalOpen={isEditWorkerModalOpen}
              setIsEditModalOpen={closeEditWorkerModal} // --- FIX: Use close handler
              editingWorker={editingWorker}
              setEditingWorker={setEditingWorker}
              handleUpdateWorker={handleUpdateWorker}
              originalWorker={originalEditingWorker} // --- FIX: Pass original
            />
          )}

          {window.AddWorkLogModal && (
            <window.AddWorkLogModal
              t={t}
              theme={theme}
              language={language}
              isAddWorkLogModalOpen={isAddWorkLogModalOpen}
              setIsAddWorkLogModalOpen={setIsAddWorkLogModalOpen}
              newWorkLog={newWorkLog}
              setNewWorkLog={setNewWorkLog}
              handleAddWorkLog={handleAddWorkLog}
              workers={workers}
              customers={customers}
            />
          )}
          {window.EditWorkLogModal && (
            <window.EditWorkLogModal
              t={t}
              theme={theme}
              language={language}
              isEditWorkLogModalOpen={isEditWorkLogModalOpen}
              setIsEditWorkLogModalOpen={closeEditWorkLogModal} // --- FIX: Use close handler
              editingWorkLog={editingWorkLog}
              setEditingWorkLog={setEditingWorkLog}
              handleUpdateWorkLog={handleUpdateWorkLog}
              workers={workers}
              customers={customers}
              originalWorkLog={originalEditingWorkLog} // --- FIX: Pass original
            />
          )}

          {window.AddCustomerModal && (
            <window.AddCustomerModal
              t={t}
              theme={theme}
              isAddCustomerModalOpen={isAddCustomerModalOpen}
              setIsAddCustomerModalOpen={setIsAddCustomerModalOpen}
              newCustomer={newCustomer}
              setNewCustomer={setNewCustomer}
              handleAddCustomer={handleAddCustomer}
            />
          )}
          {window.EditCustomerModal && (
            <window.EditCustomerModal
              t={t}
              theme={theme}
              isEditCustomerModalOpen={isEditCustomerModalOpen}
              setIsEditCustomerModalOpen={closeEditCustomerModal} // --- FIX: Use close handler
              editingCustomer={editingCustomer}
              setEditingCustomer={setEditingCustomer}
              handleUpdateCustomer={handleUpdateCustomer}
              originalCustomer={originalEditingCustomer} // --- FIX: Pass original
            />
          )}

          {/* Access View Components via window object */}
          {activeTab === "dashboard" && window.DashboardView && (
            <window.DashboardView
              t={t}
              theme={theme}
              workers={workers}
              customers={customers}
              workLogs={workLogs}
              cpoPriceData={cpoPriceData}
              recentActivity={recentActivity} // --- PASS DYNAMIC DATA ---
              formatTimeAgo={formatTimeAgo} // --- PASS FORMATTER ---
              removeActivity={removeActivity} // --- PASS REMOVE FUNCTION ---
              clearAllActivities={clearAllActivities} // --- PASS CLEAR ALL FUNCTION ---
            />
          )}
          {activeTab === "workers" && window.WorkersView && (
            <window.WorkersView
              t={t}
              theme={theme}
              filteredWorkers={filteredWorkers}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              currentData={workersPagination.currentData}
              currentPage={workersPagination.currentPage}
              setCurrentPage={workersPagination.setCurrentPage}
              maxPage={workersPagination.maxPage}
              setIsModalOpen={setIsAddWorkerModalOpen}
              handleDeleteWorker={handleDeleteWorker}
              handleEditClick={handleEditWorkerClick}
              workerTypeFilter={workerTypeFilter}
              setWorkerTypeFilter={setWorkerTypeFilter}
            />
          )}
          {activeTab === "worklogs" && window.WorkLogsView && (
            <window.WorkLogsView
              t={t}
              theme={theme}
              workLogs={workLogs}
              workers={workers}
              customers={customers}
              currentData={workLogsPagination.currentData}
              currentPage={workLogsPagination.currentPage}
              setCurrentPage={workLogsPagination.setCurrentPage}
              maxPage={workLogsPagination.maxPage}
              setIsAddWorkLogModalOpen={setIsAddWorkLogModalOpen}
              handleDeleteWorkLog={handleDeleteWorkLog}
              handleEditWorkLogClick={handleEditWorkLogClick}
              workLogWorkerFilter={workLogWorkerFilter}
              setWorkLogWorkerFilter={setWorkLogWorkerFilter}
              workLogCustomerFilter={workLogCustomerFilter}
              setWorkLogCustomerFilter={setWorkLogCustomerFilter}
            />
          )}
          {activeTab === "customers" && window.CustomersView && (
            <window.CustomersView
              t={t}
              theme={theme}
              customers={filteredCustomers}
              archivedCustomers={filteredArchivedCustomers}
              showArchivedCustomers={showArchivedCustomers}
              setShowArchivedCustomers={setShowArchivedCustomers}
              customerSearchTerm={customerSearchTerm}
              setCustomerSearchTerm={setCustomerSearchTerm}
              currentData={showArchivedCustomers ? archivedCustomersPagination.currentData : customersPagination.currentData}
              currentPage={showArchivedCustomers ? archivedCustomersPagination.currentPage : customersPagination.currentPage}
              setCurrentPage={showArchivedCustomers ? archivedCustomersPagination.setCurrentPage : customersPagination.setCurrentPage}
              maxPage={showArchivedCustomers ? archivedCustomersPagination.maxPage : customersPagination.maxPage}
              setIsAddCustomerModalOpen={setIsAddCustomerModalOpen}
              handleEditCustomerClick={handleEditCustomerClick}
              handleDeleteCustomer={handleDeleteCustomer}
              handleReactivateCustomer={handleReactivateCustomer}
            />
          )}
          {activeTab === "payroll" && window.PayrollView && (
            <window.PayrollView
              t={t}
              theme={theme}
              payrollMonth={payrollMonth}
              setPayrollMonth={setPayrollMonth}
              payrollYear={payrollYear}
              setPayrollYear={setPayrollYear}
              payrollWorkerType={payrollWorkerType}
              setPayrollWorkerType={setPayrollWorkerType}
              handleRunPayrollCalculation={handleRunPayrollCalculation}
              handleGeneratePayslips={handleGeneratePayslips}
              handleGenerateManagementReport={handleGenerateManagementReport}
              payrollSummary={payrollSummary}
              currentRunId={currentRunId}
            />
          )}
          {activeTab === "applications" && window.ApplicationsView && (
            <window.ApplicationsView
              t={t}
              theme={theme}
            />
          )}
          {activeTab === "reports" && window.ManagementReportView && (
            <window.ManagementReportView
              t={t}
              theme={theme}
              workers={workers}
              customers={customers}
              workLogs={workLogs}
            />
          )}
        </main>
      </div>
    </div>
  );
};

// --- Render the App ---
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<EasiSawit translations={translations} />);
