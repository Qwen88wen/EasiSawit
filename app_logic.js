// --- GLOBAL SESSION EXPIRED HANDLER ---
// Prevents multiple simultaneous redirects
let isRedirecting = false;

function handleSessionExpired() {
    // Prevent duplicate calls
    if (isRedirecting) {
        console.log("[AUTH] Already redirecting, skipping duplicate call");
        return;
    }

    isRedirecting = true;
    console.log("[AUTH] Session expired, clearing storage and redirecting to login...");

    // Clear all session-related storage BEFORE redirect
    try {
        sessionStorage.clear();
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("username");
        localStorage.removeItem("fullName");
    } catch (e) {
        console.error("[AUTH] Error clearing storage:", e);
    }

    // CRITICAL FIX: Redirect IMMEDIATELY without setTimeout
    // Using setTimeout was causing issues because:
    // 1. Previous code cleared ALL timeouts (including the redirect timeout)
    // 2. This caused the redirect to never execute
    // 3. Result: infinite loop
    //
    // Direct redirect is safe because:
    // - Storage is already cleared
    // - isRedirecting flag prevents duplicate calls
    // - replace() handles history correctly
    console.log("[AUTH] Redirecting NOW to login.html...");
    window.location.replace("login.html?expired=true");

    // Note: Code after this line won't execute because redirect is immediate
}


const { useState, useEffect, useMemo, useCallback, memo, useRef } = React;

// --- safeFetch: Universal fetch wrapper with error handling ---
async function safeFetch(url, options = {}) {
  try {
    console.log("[FETCH] Calling:", url);
    const response = await fetch(url, options);

    // Handle 401 Unauthorized - session expired
    if (response.status === 401) {
      console.log("[FETCH] 401 Unauthorized - calling handleSessionExpired");
      handleSessionExpired();
      // CRITICAL FIX: Return immediately after handleSessionExpired()
      // Don't throw - let the redirect happen cleanly
      // Return a promise that never resolves to prevent further execution
      return new Promise(() => {}); // Pending promise that never resolves
    }

    // Handle other HTTP errors
    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {
        // Response is not JSON, try to get text
        const text = await response.text();
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // Check if response has content
    const text = await response.text();

    // If empty response, return empty object
    if (!text || text.trim().length === 0) {
      return {};
    }

    // Try to parse JSON
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Response is not valid JSON:", text.substring(0, 200));
      throw new Error("Invalid JSON response from server");
    }
  } catch (error) {
    console.error("[FETCH] Error:", error);
    throw error;
  }
}

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

      // FIXED: Don't set default hash if it's empty
      // Only update hash if there's already a hash present
      if (!window.location.hash) {
        console.log("[PAGINATION] No hash present, skipping page update");
        setCurrentPageInternal(pageToSet);
        return;
      }

      const hashParts = window.location.hash.split("/");
      const currentTab = hashParts[0] || "#dashboard";
      const tabPart = currentTab.startsWith("#")
        ? currentTab
        : `#${currentTab}`;
      const newHash = `${tabPart}/${pageToSet}`;

      setCurrentPageInternal(pageToSet);

      if (window.location.hash !== newHash) {
        console.log("[PAGINATION] Updating hash to:", newHash);
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

    // FIXED: Only set current page if hash already exists
    // Don't try to set page if there's no hash yet (waiting for auth)
    if (window.location.hash && !window.location.hash.includes("/")) {
      console.log("[PAGINATION] Hash exists but no page number, setting page");
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

// --- Loading Component: Shown during authentication check ---
const LoadingScreen = memo(({ theme }) => (
  <div
    className={`min-h-screen flex items-center justify-center ${
      theme === "light" ? "bg-gray-100" : "bg-gray-900"
    }`}
  >
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-600"></div>
      <p className={`mt-4 text-lg ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>
        Verifying session...
      </p>
    </div>
  </div>
));

// --- Header Component: Unified navigation with logo and controls ---
const Header = memo(
  ({ t, theme, language, setLang, toggleTheme, handleLogout, setSidebarOpen }) => (
    <header
      className={`${
        theme === "light" ? "bg-emerald-700" : "bg-gray-800"
      } text-white shadow-lg fixed top-0 left-0 right-0 z-50`}
      style={{ height: "64px" }}
    >
      <div className="h-full px-6 flex justify-between items-center gap-4">
        {/* Left: Logo Section */}
        <div className="flex items-center space-x-3">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden h-9 w-9 flex items-center justify-center rounded hover:bg-emerald-600 transition"
            title="Open Menu"
          >
            <i data-lucide="menu" style={{ width: 20, height: 20 }}></i>
          </button>

          {/* Logo */}
          <svg
            className="w-9 h-9 flex-shrink-0"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="50" r="45" fill="#10b981" />
            <g transform="translate(50, 50)">
              <ellipse cx="0" cy="-15" rx="8" ry="20" fill="#059669" />
              <ellipse cx="-12" cy="-8" rx="8" ry="20" fill="#059669" transform="rotate(-60)" />
              <ellipse cx="12" cy="-8" rx="8" ry="20" fill="#059669" transform="rotate(60)" />
              <ellipse cx="-15" cy="5" rx="8" ry="20" fill="#047857" transform="rotate(-120)" />
              <ellipse cx="15" cy="5" rx="8" ry="20" fill="#047857" transform="rotate(120)" />
              <ellipse cx="-8" cy="15" rx="8" ry="18" fill="#047857" transform="rotate(-180)" />
              <ellipse cx="8" cy="15" rx="8" ry="18" fill="#047857" transform="rotate(180)" />
              <circle cx="0" cy="0" r="12" fill="#065f46" />
              <rect x="-3" y="0" width="6" height="30" fill="#92400e" rx="2" />
            </g>
          </svg>

          {/* App Title */}
          <div>
            <h1 className="text-xl font-bold">{t.appName}</h1>
            <p className="text-xs text-emerald-200 hidden sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Right: Navigation Controls */}
        <div className="flex items-center space-x-3">
          {/* Language Selector */}
          <select
            onChange={(e) => setLang(e.target.value)}
            value={language}
            className="h-9 px-3 rounded bg-emerald-600 text-white hover:bg-emerald-800 transition text-sm"
          >
            <option value="en">EN</option>
            <option value="ms">BM</option>
            <option value="zh">中文</option>
          </select>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="h-9 w-9 flex items-center justify-center rounded bg-emerald-600 hover:bg-emerald-800 transition"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            <i
              data-lucide={theme === "light" ? "moon" : "sun"}
              style={{ width: 16, height: 16 }}
            ></i>
          </button>

          {/* Admin User Label */}
          <span className="text-sm hidden md:inline">
            {t.adminUser}
          </span>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="h-9 px-3 flex items-center space-x-1 rounded bg-emerald-600 hover:bg-emerald-800 transition"
          >
            <i data-lucide="log-out" style={{ width: 16, height: 16 }}></i>
            <span className="text-sm hidden sm:inline">{t.logout}</span>
          </button>
        </div>
      </div>
    </header>
  )
);


// --- Sidebar Component: Below header, fixed left side ---
const Sidebar = memo(
  ({ t, theme, sidebarOpen, setSidebarOpen, activeTab, setActiveTab }) => {
    useEffect(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, [activeTab, theme]);

    return (
      <aside
        className={`fixed left-0 bottom-0 transition-all duration-300 z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 md:translate-x-0 ${sidebarOpen ? "md:w-64" : "md:w-20"} ${
          theme === "light" ? "bg-white" : "bg-gray-800"
        } shadow-lg`}
        style={{ top: '64px' }}
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
  // CRITICAL FIX: Add authentication state management
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // FIXED: Don't initialize activeTab from hash immediately
  // Let the useEffect handle it after session verification
  const [activeTab, setActiveTab] = useState("dashboard");
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
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });
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
      const newActivity = {
        id: Date.now(),
        key,
        args,
        icon,
        time: new Date(),
      };
      // Add to start of array and cap at 5
      setRecentActivity((prev) => [newActivity, ...prev.slice(0, 4)]);
    },
    []
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
  const setLang = useCallback((lang) => {
    setLanguage(lang);
    // Save to localStorage for management dashboard
    localStorage.setItem('language', lang);
    // Notify iframe (management dashboard) about language change
    const iframe = document.querySelector('iframe[src="management_dashboard.html"]');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'languageChange',
        language: lang
      }, '*');
    }
  }, []);

  // --- NEW: Handle logout ---
  const handleLogout = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api_logout.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        sessionStorage.clear();
        localStorage.clear();
        // CRITICAL FIX: Use .replace() to prevent back button issues
        window.location.replace("login.html");
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

 
const fetchWorkers = useCallback(() => {
  console.log("Fetching workers...");
  return safeFetch(`${API_URL}/api_worker.php?_=${Date.now()}`)
    .then((data) => {
      console.log("Workers fetched:", data);
      setWorkers(data || []);
    });
}, [API_URL]);

const fetchCustomers = useCallback(() => {
  console.log("Fetching customers...");
  return safeFetch(`${API_URL}/api_get_customer.php?_=${Date.now()}`)
    .then((data) => {
      console.log("Customers fetched:", data);
      setCustomers(data || []);
    })
    .catch((error) => {
      console.error("Error fetching customers:", error);
      setCustomers([]);
    });
}, [API_URL]);

const fetchArchivedCustomers = useCallback(() => {
  console.log("Fetching archived customers...");
  return safeFetch(`${API_URL}/api_get_archived_customers.php?_=${Date.now()}`)
    .then((data) => {
      console.log("Archived customers fetched:", data);
      setArchivedCustomers(data || []);
    })
    .catch((error) => {
      console.error("Error fetching archived customers:", error);
      setArchivedCustomers([]);
    });
}, [API_URL]);

const fetchWorkLogs = useCallback(() => {
  console.log("Fetching work logs...");
  return safeFetch(`${API_URL}/api_get_worklogs.php?_=${Date.now()}`)
    .then((data) => {
      console.log("Work logs fetched:", data);
      setWorkLogs(data || []);
    })
    .catch((error) => {
      console.error("Error fetching work logs:", error);
      setWorkLogs([]);
    });
}, [API_URL]);

const handleAddNewWorker = useCallback(
  (e) => {
    e.preventDefault();
    if (!newWorker.name) return alert("Worker name is required.");

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const loadingState =
      window.setButtonLoading && submitBtn
        ? window.setButtonLoading(submitBtn, "Saving...")
        : null;

    safeFetch(`${API_URL}/api_add_worker.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newWorker),
    }).then((data) => {
      console.log("Add Worker Success:", data);

      setIsAddWorkerModalOpen(false);
      addActivity("addWorker", "user-plus", newWorker.name);

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

      if (loadingState) loadingState.reset();
    });
  },
  [newWorker, API_URL, fetchWorkers, addActivity]
);

 const handleEditWorkerClick = useCallback((worker) => {
  setOriginalEditingWorker(worker);
  setEditingWorker({ ...worker });
  setIsEditWorkerModalOpen(true);
}, []);

const handleUpdateWorker = useCallback(
  (e) => {
    e.preventDefault();
    if (!editingWorker || !editingWorker.name)
      return alert("Worker data is missing.");

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const loadingState =
      window.setButtonLoading && submitBtn
        ? window.setButtonLoading(submitBtn, "Updating...")
        : null;

    safeFetch(`${API_URL}/api_update_worker.php`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingWorker),
    }).then((data) => {
      console.log("Update Worker Success:", data);

      if (data.changed === true) {
        addActivity("updateWorker", "user-check", editingWorker.name);
      }

      closeEditWorkerModal();
      fetchWorkers();

      if (loadingState) loadingState.reset();
    });
  },
  [editingWorker, API_URL, fetchWorkers, addActivity, closeEditWorkerModal]
);

const handleDeleteWorker = useCallback(
  (workerId, workerName) => {
    if (!window.confirm(`Delete worker "${workerName}" (ID: ${workerId})?`))
      return;

    safeFetch(`${API_URL}/api_delete_worker.php?id=${workerId}`, {
      method: "DELETE",
    })
      .then((data) => {
        console.log("Delete Worker Success:", data);
        addActivity("deleteWorker", "user-minus", workerName);
        fetchWorkers();
      });
  },
  [API_URL, fetchWorkers, addActivity]
);

const handleAddWorkLog = useCallback(
  (e) => {
    e.preventDefault();
    if (!newWorkLog.worker_id || !newWorkLog.customer_id || !newWorkLog.tons)
      return alert("Please fill in all required fields.");

    // Find submit button and set loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const loadingState = window.setButtonLoading && submitBtn
      ? window.setButtonLoading(submitBtn, "Saving...")
      : null;

    safeFetch(`${API_URL}/api_add_worklog.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newWorkLog),
    }).then((data) => {
      console.log("Add Work Log Success:", data);
      setIsAddWorkLogModalOpen(false);
      addActivity("addWorkLog", "file-plus", newWorkLog.tons);
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

      if (loadingState) loadingState.reset();
    });
  },
  [newWorkLog, API_URL, fetchWorkLogs, fetchWorkers, fetchCustomers, addActivity]
);


  const handleDeleteWorkLog = useCallback(
    (workLogId) => {
      if (!window.confirm(`Delete work log ID: ${workLogId}?`)) return;
      safeFetch(`${API_URL}/api_delete_worklog.php?id=${workLogId}`, {
        method: "DELETE",
      })
        .then((data) => {
          console.log("Delete Work Log Success:", data);
          addActivity("deleteWorkLog", "file-minus", workLogId); // --- ADD ACTIVITY ---
          fetchWorkLogs();
        });
    },
    [API_URL, fetchWorkLogs, addActivity]
  );

const handleUpdateWorkLog = useCallback(
  (e) => {
    e.preventDefault();

    // validate omitted...

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const loadingState =
      window.setButtonLoading && submitBtn
        ? window.setButtonLoading(submitBtn, "Updating...")
        : null;

    safeFetch(`${API_URL}/api_update_worklog.php`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingWorkLog),
    })
      .then((data) => {
        console.log("Update Work Log Success:", data);

        if (data.changed === true) {
          addActivity("updateWorkLog", "file-check", editingWorkLog.id);
        }

        closeEditWorkLogModal();
        fetchWorkLogs();
      })
      .finally(() => {
        if (loadingState) loadingState.reset();
      });
  },
  [editingWorkLog, API_URL, fetchWorkLogs, addActivity, closeEditWorkLogModal]
);

const handleEditWorkLogClick = useCallback((workLog) => {
  setOriginalEditingWorkLog(workLog);
  setEditingWorkLog({ ...workLog });
  setIsEditWorkLogModalOpen(true);
}, []);

const handleEditCustomerClick = useCallback((customer) => {
    setOriginalEditingCustomer(customer); // --- FIX: Store original
    setEditingCustomer({ ...customer }); // --- FIX: Store copy
    setIsEditCustomerModalOpen(true);
  }, []);

const handleAddCustomer = useCallback(
  (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.rate)
      return alert("Customer name and rate are required.");

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const loadingState =
      window.setButtonLoading && submitBtn
        ? window.setButtonLoading(submitBtn, "Saving...")
        : null;

    safeFetch(`${API_URL}/api_add_customer.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCustomer),
    }).then((data) => {
      console.log("Add Customer Success:", data);

      setIsAddCustomerModalOpen(false);
      addActivity("addCustomer", "briefcase", newCustomer.name);

      setNewCustomer({
        name: "",
        contact: "",
        rate: "",
        remark: "",
        remark2: "",
      });

      fetchCustomers();

      if (loadingState) loadingState.reset();
    });
  },
  [newCustomer, API_URL, fetchCustomers, addActivity]
);

 const handleUpdateCustomer = useCallback(
  (e) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.name || !editingCustomer.rate)
      return alert("Customer name and rate are required.");

    console.log('[UPDATE CUSTOMER] Sending data:', editingCustomer);

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const loadingState =
      window.setButtonLoading && submitBtn
        ? window.setButtonLoading(submitBtn, "Updating...")
        : null;

    safeFetch(`${API_URL}/api_update_customer.php`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingCustomer),
    })
      .then((data) => {
        console.log("Update Customer Success:", data);

        if (data.changed === true) {
          addActivity("updateCustomer", "briefcase", editingCustomer.name);
        }

        closeEditCustomerModal();
        fetchCustomers();
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

    safeFetch(`${API_URL}/api_delete_customer.php?id=${customerId}`, {
      method: "DELETE",
    })
      .then((data) => {
        console.log("Delete Customer Success:", data);
        addActivity("deleteCustomer", "briefcase", customerName);
        fetchCustomers();
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

    safeFetch(`${API_URL}/api_reactivate_customer.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId }),
    })
      .then((data) => {
        console.log("Reactivate Customer Success:", data);
        addActivity("reactivateCustomer", "briefcase", customerName);
        fetchCustomers();
        fetchArchivedCustomers();
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

//payroll
const handleRunPayrollCalculation = useCallback(async () => {
  try {
    const data = await safeFetch(`${API_URL}/api_calculate_payroll.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        month: payrollMonth,
        year: payrollYear,
        worker_type: payrollWorkerType,
      }),
    });

    console.log("Payroll Calculation Success:", data);

    addActivity("runPayroll", "calculator", payrollMonth, payrollYear);
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
    const data = await safeFetch(`${API_URL}/api_generate_payslips.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        month: payrollMonth,
        year: payrollYear,
        worker_type: payrollWorkerType,
      }),
    });

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
      // however it change to show the management report within the app ONLY, but pls QW lazy and stress so she decided to keep this exits bcs didn't cause any error, she wants to finish the extra things faster and work on the other work
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
// CPO Price Fetcher changed from fetch to safeFetch also by QIAOWEN 
  const fetchCpoPrice = useCallback(() => {
  console.log("Fetching CPO price...");

  safeFetch(`${API_URL}/api_get_price.php?_=${new Date().getTime()}`)
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


  //finally QW manage to reach here, hope everything can end today 3/12
  // gonna stop bcs CVNLP class strts soon
  // This effect verifies session and manages URL hash for tabs
  useEffect(() => {
    console.log("[INIT] Starting session verification and routing initialization...");

    // CRITICAL FIX: Prevent double execution (e.g., React strict mode, hot reload)
    let isExecuted = false;
    let cleanup = null;

    // --- CRITICAL FIX: Verify session BEFORE setting up routing and rendering components ---
    const verifySessionAndInitialize = async () => {
      // Prevent duplicate execution
      if (isExecuted) {
        console.log("[AUTH] Already executed, skipping duplicate call");
        return;
      }
      isExecuted = true;

      console.log("[AUTH] Verifying session...");
      console.log("[AUTH] Current hash:", window.location.hash);

      try {
        await safeFetch(`${API_URL}/check_auth.php`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        console.log("[AUTH] ✅ Session valid!");

        // CRITICAL: Set authentication state FIRST, before initializing routing
        setIsAuthenticated(true);
        setIsAuthChecking(false);

        console.log("[AUTH] Authentication state updated, initializing routing...");

        // Session is valid, now we can safely initialize routing
        cleanup = initializeRouting();

      } catch (error) {
        // safeFetch already handles 401 and redirects to login.html
        // So we don't need to initialize routing here
        console.error("[AUTH] ❌ Session verification failed:", error.message);
        console.log("[AUTH] User will be redirected to login.html");

        // Set checking to false (though user will be redirected anyway)
        setIsAuthChecking(false);

        // Don't initialize routing if session is invalid
        // User will be redirected by handleSessionExpired()
        return;
      }
    };

    // Initialize routing only after session is verified
    const initializeRouting = () => {
      console.log("[ROUTING] Initializing routing system...");

      const handleHashChange = () => {
        const hash = window.location.hash.substring(1);
        console.log("[ROUTING] Hash changed to:", hash);

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
        console.log("[ROUTING] Setting active tab to:", currentTab);
        setActiveTab(currentTab);

        if (!tab || !validTabs.includes(tab)) {
          console.log("[ROUTING] No valid tab in hash, setting to dashboard/1");
          window.location.hash = "dashboard/1";
        } else if (!page) {
          console.log("[ROUTING] No page in hash, setting to", currentTab + "/1");
          window.location.hash = `${currentTab}/1`;
        }
      };

      window.addEventListener("hashchange", handleHashChange);
      console.log("[ROUTING] Hash change listener added");

      // Initial load - set up the hash
      console.log("[ROUTING] Running initial hash setup...");
      handleHashChange();

      // Return cleanup function
      return () => {
        console.log("[ROUTING] Cleaning up hash change listener");
        window.removeEventListener("hashchange", handleHashChange);
      };
    };

    // Start verification and initialization
    verifySessionAndInitialize();

    // Cleanup function for useEffect
    return () => {
      if (cleanup) cleanup();
    };

}, [API_URL]);

  // This effect fetches all initial data
  // CRITICAL FIX: Only fetch data AFTER authentication is verified
useEffect(() => {
  if (!isAuthenticated) {
    console.log("[DATA] Skipping data fetch - not authenticated yet");
    return;
  }

  console.log("[DATA] Authentication verified, fetching initial data...");
  fetchWorkers();
  fetchCustomers();
  fetchArchivedCustomers();
  fetchWorkLogs();
  fetchCpoPrice();
}, [isAuthenticated, fetchWorkers, fetchCustomers, fetchArchivedCustomers, fetchWorkLogs, fetchCpoPrice]); // Execute ONLY after authentication is verified

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

  // Filter work logs based on selected worker and customer
  const filteredWorkLogs = useMemo(() => {
    console.log('[FILTER] Work Log Filters:', {
      workerFilter: workLogWorkerFilter,
      customerFilter: workLogCustomerFilter,
      totalLogs: workLogs.length
    });

    const filtered = workLogs.filter((log) => {
      // Convert both sides to numbers for comparison (PHP returns IDs as strings)
      const workerMatch =
        workLogWorkerFilter === "All" ||
        parseInt(log.worker_id) === parseInt(workLogWorkerFilter);
      const customerMatch =
        workLogCustomerFilter === "All" ||
        parseInt(log.customer_id) === parseInt(workLogCustomerFilter);
      return workerMatch && customerMatch;
    });

    console.log('[FILTER] Filtered results:', filtered.length);
    return filtered;
  }, [workLogs, workLogWorkerFilter, workLogCustomerFilter]);

  // Pagination Hooks
  const workersPagination = usePagination(filteredWorkers, 10);
  const workLogsPagination = usePagination(filteredWorkLogs, 100);
  const customersPagination = usePagination(filteredCustomers, 10);
  const archivedCustomersPagination = usePagination(filteredArchivedCustomers, 10);

  // --- CRITICAL FIX: Show loading screen during authentication check ---
  if (isAuthChecking) {
    console.log("[RENDER] Showing loading screen - authentication in progress");
    return <LoadingScreen theme={theme} />;
  }

  // --- CRITICAL FIX: Don't render anything if not authenticated ---
  // (User should have been redirected to login.html by handleSessionExpired)
  if (!isAuthenticated) {
    console.log("[RENDER] Not authenticated - waiting for redirect to login");
    return null;
  }

  // --- Render: MainLayout Structure (ONLY if authenticated) ---
  console.log("[RENDER] Rendering main application - user is authenticated");
  return (
    <div
      className={`min-h-screen ${
        theme === "light" ? "bg-gray-100" : "bg-gray-900"
      }`}
    >
      {/* Header: Unified navigation with logo and controls */}
      <Header
        t={t}
        theme={theme}
        language={language}
        setLang={setLang}
        toggleTheme={toggleTheme}
        handleLogout={handleLogout}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Layout: Sidebar + Content (below header with 64px offset) */}
      <div className="flex" style={{ paddingTop: '64px' }}>
        {/* Sidebar: Fixed left side, below header */}
        <Sidebar
          t={t}
          theme={theme}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
        />

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area: Adjusts based on sidebar state */}
        <main
          className={`flex-1 p-8 transition-all duration-300 overflow-x-hidden ${
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
              key="dashboard-view"
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
              key="workers-view"
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
              key="worklogs-view"
              t={t}
              theme={theme}
              workLogs={filteredWorkLogs}
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
              key="customers-view"
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
              key="payroll-view"
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
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === "applications" && window.ApplicationsView && (
            <window.ApplicationsView
              key="applications-view"
              t={t}
              theme={theme}
              addActivity={addActivity}
            />
          )}
          {activeTab === "reports" && window.ManagementReportView && (
            <window.ManagementReportView
              key="reports-view"
              t={t}
              theme={theme}
              setActiveTab={setActiveTab}
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

//