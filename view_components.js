const { memo, useEffect } = React;

const StatCard = memo(({ title, value, color, icon, theme }) => (
  <div
    className={`${
      theme === "light" ? "bg-white" : "bg-gray-800"
    } rounded-lg shadow p-6 optimized-card gpu-accelerated w-full`}
  >
    <div
      className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mb-3`}
    >
      <i data-lucide={icon} className="text-white"></i>
    </div>
    <p
      className={`${
        theme === "light" ? "text-gray-600" : "text-gray-400"
      } text-sm mb-1`}
    >
      {title}
    </p>
    <p
      className={`text-2xl font-bold ${
        theme === "light" ? "text-gray-800" : "text-white"
      }`}
    >
      {value}
    </p>
  </div>
));

// --- UPDATED ActivityItem to include icon ---
// --- UPDATED ActivityItem to include icon and dismiss button ---
const ActivityItem = memo(({ activity, time, theme, onDismiss, t_log }) => {
  // Translate activity dynamically
  let text = t_log[activity.key] || "Unknown action";

  // Replace placeholders
  if (activity.args && activity.args.length > 0) {
    activity.args.forEach((arg) => {
      text = text.replace("%s", arg);
    });
  }

  return (
    <div
      className={`flex items-start py-3 border-b last:border-0 ${
        theme === "light" ? "border-gray-200" : "border-gray-700"
      }`}
    >
      <i
        data-lucide={activity.icon || "activity"}
        className={`w-4 h-4 mr-3 mt-1 flex-shrink-0 ${
          theme === "light" ? "text-gray-500" : "text-gray-400"
        }`}
      ></i>
      <div className="flex-1 flex justify-between items-start">
        <p
          className={`${
            theme === "light" ? "text-gray-700" : "text-gray-300"
          } text-sm pr-4`}
        >
          {text}
        </p>
        <div className="flex items-center space-x-2">
          <span
            className={`text-xs ${
              theme === "light" ? "text-gray-500" : "text-gray-400"
            } whitespace-nowrap`}
          >
            {time}
          </span>
          <button
            onClick={() => onDismiss(activity.id)}
            className={`${
              theme === "light"
                ? "text-gray-400 hover:text-gray-600"
                : "text-gray-500 hover:text-gray-300"
            } transition`}
            title="Dismiss"
          >
            <i data-lucide="x" className="w-4 h-4"></i>
          </button>
        </div>
      </div>
    </div>
  );
});

// --- View Components ---

// --- UPDATED DashboardView to be dynamic ---
const DashboardView = React.memo(
  ({
    t,
    theme,
    workers,
    customers,
    workLogs,
    cpoPriceData,
    recentActivity,
    formatTimeAgo,
    removeActivity,
    clearAllActivities,
  }) => {
    const t_dash = t.dashboardView;
    const t_time = t.timeAgo;
    const t_log = t.activityLog;

    // Add state to force periodic re-renders for time updates
    const [, setTick] = React.useState(0);

    // Calculate this month's work logs count
    const thisMonthLogsCount = React.useMemo(() => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11, so add 1

      console.log('[DASHBOARD] Filtering work logs for:', currentYear, currentMonth);

      const filtered = workLogs.filter(log => {
        if (!log.log_date) return false;

        // Parse log_date which is in format 'YYYY-MM-DD'
        const [year, month] = log.log_date.split('-').map(Number);
        return year === currentYear && month === currentMonth;
      });

      console.log('[DASHBOARD] This month logs:', filtered.length, '/ Total logs:', workLogs.length);
      return filtered.length;
    }, [workLogs]);

    let cpoPriceValue = "Loading...";
    let cpoPriceTitle = t_dash.latestCpoPrice || "Latest CPO Price";

    if (cpoPriceData) {
      if (typeof cpoPriceData.latest_price === "number") {
        cpoPriceValue = `RM ${cpoPriceData.latest_price.toLocaleString(
          "en-US",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}`;

        if (cpoPriceData.unit) {
          cpoPriceTitle = `${cpoPriceTitle} (${cpoPriceData.unit})`;
        }
      } else {
        cpoPriceValue = "Error";
      }
    }

    useEffect(() => {
      const timer = setTimeout(() => {
        if (window.lucide) {
          window.lucide.createIcons();
        }
      }, 100);
      return () => clearTimeout(timer);
    }, [cpoPriceData, recentActivity]); // Re-run icons when activity list changes

    // Add periodic timer to update "time ago" displays
    useEffect(() => {
      const interval = setInterval(() => {
        setTick(tick => tick + 1); // Force re-render every 30 seconds
      }, 30000);
      return () => clearInterval(interval);
    }, []);

    return (
      <div className="w-full space-y-6">
        <h2
          className={`text-2xl font-bold ${
            theme === "light" ? "text-gray-800" : "text-white"
          }`}
        >
          {t_dash.title}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
          <StatCard
            title={t_dash.totalWorkers}
            value={workers.length.toLocaleString()}
            color="bg-blue-500"
            icon="users"
            theme={theme}
          />
          <StatCard
            title={cpoPriceTitle}
            value={cpoPriceValue}
            color="bg-teal-500"
            icon="leaf"
            theme={theme}
          />
          <StatCard
            title={t_dash.activeCustomers}
            value={customers.length.toLocaleString()}
            color="bg-green-500"
            icon="file-text"
            theme={theme}
          />
          <StatCard
            title={t_dash.thisMonthLogs}
            value={thisMonthLogsCount.toLocaleString()}
            color="bg-purple-500"
            icon="calendar"
            theme={theme}
          />
        </div>

        <div
          className={`${
            theme === "light" ? "bg-white" : "bg-gray-800"
          } rounded-lg shadow p-6 optimized-card w-full`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className={`text-lg font-semibold ${
                theme === "light" ? "text-gray-800" : "text-white"
              }`}
            >
              {t_dash.recentActivity}
            </h3>
            {recentActivity.length > 0 && (
              <button
                onClick={clearAllActivities}
                className={`${
                  theme === "light"
                    ? "text-gray-600 hover:text-gray-800"
                    : "text-gray-300 hover:text-white"
                } text-sm`}
                title="Clear all"
              >
                Clear all
              </button>
            )}
          </div>
          <div>
            {/* --- DYNAMIC ACTIVITY LIST --- */}
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  time={formatTimeAgo(activity.time, t_time)}
                  theme={theme}
                  onDismiss={removeActivity}
                  t_log={t_log}
                />
              ))
            ) : (
              <p
                className={`${
                  theme === "light" ? "text-gray-600" : "text-gray-400"
                }`}
              >
                {t_time.noActivity}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

const WorkersView = ({
  t,
  theme,
  filteredWorkers,
  searchTerm,
  setSearchTerm,
  currentData,
  currentPage,
  setCurrentPage,
  maxPage,
  setIsModalOpen,
  handleDeleteWorker,
  handleEditClick,
  workerTypeFilter,
  setWorkerTypeFilter,
}) => {
  const t_view = t.workersView;
  const pageSize = 10;

  const startIndex =
    filteredWorkers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(currentPage * pageSize, filteredWorkers.length);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [currentData]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2
          className={`text-2xl font-bold ${
            theme === "light" ? "text-gray-800" : "text-white"
          }`}
        >
          {t_view.title} ({filteredWorkers.length.toLocaleString()} {t.workers})
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-emerald-700 transition w-full sm:w-auto justify-center"
        >
          <i data-lucide="plus" style={{ width: 20, height: 20 }}></i>
          <span>{t_view.addNewWorker}</span>
        </button>
      </div>

      <div
        className={`${
          theme === "light" ? "bg-white" : "bg-gray-800"
        } rounded-lg shadow optimized-card`}
      >
        <div
          className={`p-4 border-b ${
            theme === "light" ? "border-gray-200" : "border-gray-700"
          }`}
        >
          <div className="flex flex-col space-y-3">
            <div className="relative">
              <label htmlFor="search-workers" className="sr-only">
                {t_view.searchPlaceholder}
              </label>
              <i
                data-lucide="search"
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  theme === "light" ? "text-gray-400" : "text-gray-500"
                }`}
                style={{ width: 20, height: 20 }}
              ></i>
              <input
                type="text"
                id="search-workers"
                name="search-workers"
                placeholder={t_view.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  theme === "light"
                    ? "bg-white border-gray-300"
                    : "bg-gray-700 border-gray-600 text-white"
                }`}
              />
            </div>

            <select
              value={workerTypeFilter}
              onChange={(e) => setWorkerTypeFilter(e.target.value)}
              className={`border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                theme === "light"
                  ? "bg-white border-gray-300"
                  : "bg-gray-700 border-gray-600 text-white"
              }`}
            >
              <option value="All Types">{t.allTypes}</option>
              <option value="Local">{t.local}</option>
              <option value="Foreign">{t.foreign}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead
              className={`${theme === "light" ? "bg-gray-50" : "bg-gray-700"}`}
            >
              <tr>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium ${
                    theme === "light" ? "text-gray-500" : "text-gray-300"
                  } uppercase tracking-wider`}
                >
                  {t_view.thName}
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium ${
                    theme === "light" ? "text-gray-500" : "text-gray-300"
                  } uppercase tracking-wider`}
                >
                  {t_view.thType}
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium ${
                    theme === "light" ? "text-gray-500" : "text-gray-300"
                  } uppercase tracking-wider`}
                >
                  {t_view.thEpfPermit}
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium ${
                    theme === "light" ? "text-gray-500" : "text-gray-300"
                  } uppercase tracking-wider`}
                >
                  {t_view.thStatus}
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium ${
                    theme === "light" ? "text-gray-500" : "text-gray-300"
                  } uppercase tracking-wider`}
                >
                  {t_view.thActions}
                </th>
              </tr>
            </thead>

            <tbody
              className={`divide-y ${
                theme === "light" ? "divide-gray-200" : "divide-gray-700"
              }`}
            >
              {currentData.map((worker) => (
                <tr
                  key={worker.id}
                  className={`${
                    theme === "light" ? "hover:bg-gray-50" : "hover:bg-gray-600"
                  }`}
                >
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      theme === "light" ? "text-gray-900" : "text-white"
                    }`}
                  >
                    {worker.name}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {worker.type === "Local" || worker.type === "Foreign" ? (
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          worker.type === "Local"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {worker.type === "Local" ? t.local : t.foreign}
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-200 text-gray-700">
                        N/A
                      </span>
                    )}
                  </td>

                  <td
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      theme === "light" ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {worker.epf || worker.permit || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        worker.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {worker.status === "Active"
                        ? t_view.statusActive
                        : t_view.statusInactive}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleEditClick(worker)}
                        className="text-blue-600 hover:text-blue-800"
                        title={t_view.editTitle}
                      >
                        <i
                          data-lucide="edit"
                          style={{ width: 18, height: 18 }}
                        ></i>
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteWorker(worker.id, worker.name)
                        }
                        className="text-red-600 hover:text-red-800"
                        title={t_view.deleteTitle}
                      >
                        <i
                          data-lucide="trash-2"
                          style={{ width: 18, height: 18 }}
                        ></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className={`p-4 border-t ${
            theme === "light" ? "border-gray-200" : "border-gray-700"
          } flex flex-col sm:flex-row justify-between items-center gap-3`}
        >
          <div
            className={`text-sm ${
              theme === "light" ? "text-gray-600" : "text-gray-400"
            }`}
          >
            {t.showing} {startIndex} {t.to} {endIndex} {t.of}{" "}
            {filteredWorkers.length.toLocaleString()} {t.results}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 border rounded disabled:opacity-50 ${
                theme === "light"
                  ? "border-gray-300 hover:bg-gray-100"
                  : "border-gray-600 text-gray-300 hover:bg-gray-600 disabled:text-gray-500"
              }`}
            >
              {t.previous}
            </button>
            <span
              className={`px-3 py-1 ${
                theme === "light" ? "text-gray-700" : "text-gray-300"
              }`}
            >
              {t.page} {currentPage} {t.of} {maxPage || 1}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === maxPage || maxPage === 0}
              className={`px-3 py-1 border rounded disabled:opacity-50 ${
                theme === "light"
                  ? "border-gray-300 hover:bg-gray-100"
                  : "border-gray-600 text-gray-300 hover:bg-gray-600 disabled:text-gray-500"
              }`}
            >
              {t.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomersView = React.memo(
  ({
    t,
    theme,
    customers,
    archivedCustomers,
    showArchivedCustomers,
    setShowArchivedCustomers,
    customerSearchTerm,
    setCustomerSearchTerm,
    currentData,
    currentPage,
    setCurrentPage,
    maxPage,
    setIsAddCustomerModalOpen,
    handleEditCustomerClick,
    handleDeleteCustomer,
    handleReactivateCustomer,
  }) => {
    const t_view = t.customersView;
    const pageSize = 10;

    const displayList = showArchivedCustomers ? archivedCustomers : customers;
    const startIndex =
      displayList.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
    const endIndex = Math.min(currentPage * pageSize, displayList.length);

    useEffect(() => {
      const timer = setTimeout(() => {
        if (window.lucide) {
          window.lucide.createIcons();
        }
      }, 50);
      return () => clearTimeout(timer);
    }, [currentData]);

    return (
      <div className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2
            className={`text-2xl font-bold ${
              theme === "light" ? "text-gray-800" : "text-white"
            }`}
          >
            {showArchivedCustomers ? t_view.archivedCustomers : t_view.title} ({displayList.length.toLocaleString()} {t.customers})
          </h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowArchivedCustomers(!showArchivedCustomers)}
              className={`${
                showArchivedCustomers
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-600 hover:bg-gray-700"
              } text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition flex-1 sm:flex-initial justify-center`}
            >
              <i data-lucide={showArchivedCustomers ? "users" : "archive"} style={{ width: 20, height: 20 }}></i>
              <span>{showArchivedCustomers ? t_view.showActive : t_view.showArchived}</span>
            </button>
            {!showArchivedCustomers && (
              <button
                onClick={() => setIsAddCustomerModalOpen(true)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-emerald-700 transition flex-1 sm:flex-initial justify-center"
              >
                <i data-lucide="plus" style={{ width: 20, height: 20 }}></i>
                <span>{t_view.addCustomer}</span>
              </button>
            )}
          </div>
        </div>

        <div className={`${theme === "light" ? "bg-white" : "bg-gray-800"} rounded-lg shadow p-4 optimized-card`}>
          <div className="relative">
            <input
              type="text"
              placeholder={t_view.searchPlaceholder}
              value={customerSearchTerm}
              onChange={(e) => setCustomerSearchTerm(e.target.value)}
              className={`w-full border rounded-lg px-10 py-2 ${
                theme === "light"
                  ? "bg-white border-gray-300"
                  : "bg-gray-700 border-gray-600 text-white"
              }`}
            />
            <i
              data-lucide="search"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              style={{ width: 20, height: 20 }}
            ></i>
            {customerSearchTerm && (
              <button
                onClick={() => setCustomerSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <i data-lucide="x" style={{ width: 20, height: 20 }}></i>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentData.map((customer) => (
            <div
              key={customer.id}
              className={`${
                theme === "light" ? "bg-white" : "bg-gray-800"
              } rounded-lg shadow p-6 optimized-card`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3
                    className={`font-semibold text-lg ${
                      theme === "light" ? "text-gray-800" : "text-white"
                    }`}
                  >
                    {customer.name}
                  </h3>
                  <span
                    className={`text-xs ${
                      theme === "light" ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    ID: {customer.id}
                  </span>
                </div>
                <div className="flex space-x-2">
                  {!showArchivedCustomers && (
                    <button
                      onClick={() => handleEditCustomerClick(customer)}
                      className="text-blue-600 hover:text-blue-800"
                      title={t_view.editTitle}
                    >
                      <i data-lucide="edit" style={{ width: 18, height: 18 }}></i>
                    </button>
                  )}
                  {showArchivedCustomers ? (
                    <button
                      onClick={() =>
                        handleReactivateCustomer &&
                        handleReactivateCustomer(customer.id, customer.name)
                      }
                      className="text-green-600 hover:text-green-800"
                      title={t_view.reactivateCustomer}
                    >
                      <i
                        data-lucide="rotate-ccw"
                        style={{ width: 18, height: 18 }}
                      ></i>
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        handleDeleteCustomer &&
                        handleDeleteCustomer(customer.id, customer.name)
                      }
                      className="text-red-600 hover:text-red-800"
                      title={t_view.deleteTitle}
                    >
                      <i
                        data-lucide="trash-2"
                        style={{ width: 18, height: 18 }}
                      ></i>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span
                    className={`${
                      theme === "light" ? "text-gray-600" : "text-gray-400"
                    }`}
                  >
                    {t_view.payRate}
                  </span>
                  <span className="font-bold text-emerald-600 text-lg">
                    RM{customer.rate}
                    {t.perTon}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span
                    className={`${
                      theme === "light" ? "text-gray-600" : "text-gray-400"
                    }`}
                  >
                    {t_view.contact}
                  </span>
                  <span
                    className={`${
                      theme === "light" ? "text-gray-800" : "text-white"
                    }`}
                  >
                    {customer.contact}
                  </span>
                </div>
                {customer.acres && (
                  <div className="flex justify-between">
                    <span
                      className={`${
                        theme === "light" ? "text-gray-600" : "text-gray-400"
                      }`}
                    >
                      {t_view.acres}
                    </span>
                    <span
                      className={`${
                        theme === "light" ? "text-gray-800" : "text-white"
                      } font-semibold`}
                    >
                      {parseFloat(customer.acres).toFixed(2)} {t_view.acres.toLowerCase()}
                    </span>
                  </div>
                )}
                {customer.remark && (
                  <div className="flex justify-between">
                    <span
                      className={`${
                        theme === "light" ? "text-gray-600" : "text-gray-400"
                      }`}
                    >
                      {t_view.serviceArea}
                    </span>
                    <span
                      className={`${
                        theme === "light" ? "text-gray-800" : "text-white"
                      } text-sm italic`}
                    >
                      {customer.remark}
                    </span>
                  </div>
                )}
                {customer.remark2 && (
                  <div className="flex justify-between">
                    <span
                      className={`${
                        theme === "light" ? "text-gray-600" : "text-gray-400"
                      }`}
                    >
                      {t_view.location}
                    </span>
                    <span
                      className={`${
                        theme === "light" ? "text-gray-800" : "text-white"
                      } text-sm italic`}
                    >
                      {customer.remark2}
                    </span>
                  </div>
                )}
              </div>

              {showArchivedCustomers ? (
                <button
                  onClick={() =>
                    handleReactivateCustomer &&
                    handleReactivateCustomer(customer.id, customer.name)
                  }
                  className={`mt-4 w-full ${
                    theme === "light"
                      ? "bg-green-50 text-green-700 hover:bg-green-100"
                      : "bg-green-800 text-white hover:bg-green-700"
                  } py-2 rounded transition flex items-center justify-center space-x-2`}
                >
                  <i data-lucide="rotate-ccw" style={{ width: 16, height: 16 }}></i>
                  <span>{t_view.reactivateCustomer}</span>
                </button>
              ) : (
                <button
                  onClick={() => handleEditCustomerClick(customer)}
                  className={`mt-4 w-full ${
                    theme === "light"
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "bg-emerald-800 text-white hover:bg-emerald-700"
                  } py-2 rounded transition`}
                >
                  {t_view.updateRate}
                </button>
              )}
            </div>
          ))}
        </div>

        <div
          className={`p-4 border-t ${
            theme === "light" ? "border-gray-200" : "border-gray-700"
          } flex flex-col sm:flex-row justify-between items-center gap-3`}
        >
          <div
            className={`text-sm ${
              theme === "light" ? "text-gray-600" : "text-gray-400"
            }`}
          >
            {t.showing} {startIndex} {t.to} {endIndex} {t.of}{" "}
            {displayList.length.toLocaleString()} {t.results}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 border rounded disabled:opacity-50 ${
                theme === "light"
                  ? "border-gray-300 hover:bg-gray-100"
                  : "border-gray-600 text-gray-300 hover:bg-gray-600 disabled:text-gray-500"
              }`}
            >
              {t.previous}
            </button>
            <span
              className={`px-3 py-1 ${
                theme === "light" ? "text-gray-700" : "text-gray-300"
              }`}
            >
              {t.page} {currentPage} {t.of} {maxPage || 1}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === maxPage || maxPage === 0}
              className={`px-3 py-1 border rounded disabled:opacity-50 ${
                theme === "light"
                  ? "border-gray-300 hover:bg-gray-100"
                  : "border-gray-600 text-gray-300 hover:bg-gray-600 disabled:text-gray-500"
              }`}
            >
              {t.next}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

const PayrollView = React.memo(
  ({
    t,
    theme,
    payrollMonth,
    setPayrollMonth,
    payrollYear,
    setPayrollYear,
    payrollWorkerType,
    setPayrollWorkerType,
    handleRunPayrollCalculation,
    handleGeneratePayslips,
    handleGenerateManagementReport,
    payrollSummary,
    currentRunId,
    setActiveTab,
  }) => {
    const t_view = t.payrollView;

    const months = [
      { value: 1, label: t.monthJanuary },
      { value: 2, label: t.monthFebruary },
      { value: 3, label: t.monthMarch },
      { value: 4, label: t.monthApril },
      { value: 5, label: t.monthMay },
      { value: 6, label: t.monthJune },
      { value: 7, label: t.monthJuly },
      { value: 8, label: t.monthAugust },
      { value: 9, label: t.monthSeptember },
      { value: 10, label: t.monthOctober },
      { value: 11, label: t.monthNovember },
      { value: 12, label: t.monthDecember },
    ];

    const years = Array.from(
      { length: 5 },
      (_, i) => new Date().getFullYear() - i
    );

    useEffect(() => {
      const timer = setTimeout(() => {
        if (window.lucide) {
          window.lucide.createIcons();
        }
      }, 50);
      return () => clearTimeout(timer);
    }, [payrollSummary]);

    const handleDownloadAll = () => {
      if (!currentRunId) {
        alert(
          "No payroll run selected or calculation incomplete. Please run the calculation first."
        );
        return;
      }

      const downloadUrl = `api/api_generate_report.php?run_id=${currentRunId}`;

      window.location.href = downloadUrl;
    };

    return (
      <div className="w-full space-y-6">
        <h2
          className={`text-2xl font-bold ${
            theme === "light" ? "text-gray-800" : "text-white"
          }`}
        >
          {t_view.title}
        </h2>

        <div
          className={`${
            theme === "light" ? "bg-white" : "bg-gray-800"
          } rounded-lg shadow p-6 optimized-card`}
        >
          <h3
            className={`text-lg font-semibold mb-4 ${
              theme === "light" ? "text-gray-800" : "text-white"
            }`}
          >
            {t_view.generatePayroll}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label
                htmlFor="pay-period-month"
                className={`block text-sm font-medium mb-1 ${
                  theme === "light" ? "text-gray-700" : "text-gray-300"
                }`}
              >
                {t_view.payPeriodMonth}
              </label>
              <select
                id="pay-period-month"
                name="pay-period-month"
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(parseInt(e.target.value))}
                className={`w-full border rounded-lg px-3 py-2 ${
                  theme === "light"
                    ? "bg-white border-gray-300"
                    : "bg-gray-700 border-gray-600 text-white"
                }`}
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="pay-period-year"
                className={`block text-sm font-medium mb-1 ${
                  theme === "light" ? "text-gray-700" : "text-gray-300"
                }`}
              >
                {t_view.payPeriodYear}
              </label>
              <select
                id="pay-period-year"
                name="pay-period-year"
                value={payrollYear}
                onChange={(e) => setPayrollYear(parseInt(e.target.value))}
                className={`w-full border rounded-lg px-3 py-2 ${
                  theme === "light"
                    ? "bg-white border-gray-300"
                    : "bg-gray-700 border-gray-600 text-white"
                }`}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="payroll-worker-type"
                className={`block text-sm font-medium mb-1 ${
                  theme === "light" ? "text-gray-700" : "text-gray-300"
                }`}
              >
                {t_view.workerType}
              </label>
              <select
                id="payroll-worker-type"
                name="payroll-worker-type"
                value={payrollWorkerType}
                onChange={(e) => setPayrollWorkerType(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 ${
                  theme === "light"
                    ? "bg-white border-gray-300"
                    : "bg-gray-700 border-gray-600 text-white"
                }`}
              >
                <option value="All">{t.allWorkers}</option>
                <option value="Local">
                  {t.local} {t.only}
                </option>
                <option value="Foreign">
                  {t.foreign} {t.only}
                </option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={async (e) => {
                  const loadingState = window.setButtonLoading && e.currentTarget
                    ? window.setButtonLoading(e.currentTarget, "Calculating...")
                    : null;
                  try {
                    await handleRunPayrollCalculation();
                  } finally {
                    if (loadingState) loadingState.reset();
                  }
                }}
                className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
              >
                {t_view.runCalculation}
              </button>
            </div>
          </div>
        </div>

        {payrollSummary && (
          <div
            className={`${
              theme === "light" ? "bg-white" : "bg-gray-800"
            } rounded-lg shadow optimized-card`}
          >
            <div
              className={`p-4 border-b ${
                theme === "light" ? "border-gray-200" : "border-gray-700"
              }`}
            >
              <h3
                className={`text-lg font-semibold ${
                  theme === "light" ? "text-gray-800" : "text-white"
                }`}
              >
                {t_view.payrollSummary}{" "}
                {months.find((m) => m.value === payrollMonth)?.label}{" "}
                {payrollYear}
              </h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div
                  className={`${
                    theme === "light" ? "bg-blue-50" : "bg-blue-900/50"
                  } p-4 rounded-lg`}
                >
                  <p
                    className={`text-sm ${
                      theme === "light" ? "text-gray-600" : "text-gray-400"
                    } mb-1`}
                  >
                    {t_view.totalGrossPay}
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    RM {payrollSummary.total_gross_pay.toFixed(2)}
                  </p>
                </div>

                <div
                  className={`${
                    theme === "light" ? "bg-orange-50" : "bg-orange-900/50"
                  } p-4 rounded-lg`}
                >
                  <p
                    className={`text-sm ${
                      theme === "light" ? "text-gray-600" : "text-gray-400"
                    } mb-1`}
                  >
                    {t_view.totalEpf}
                  </p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    RM{" "}
                    {(
                      payrollSummary.total_epf_employee +
                      payrollSummary.total_epf_employer
                    ).toFixed(2)}
                  </p>
                </div>

                <div
                  className={`${
                    theme === "light" ? "bg-purple-50" : "bg-purple-900/50"
                  } p-4 rounded-lg`}
                >
                  <p
                    className={`text-sm ${
                      theme === "light" ? "text-gray-600" : "text-gray-400"
                    } mb-1`}
                  >
                    {t_view.totalSocso}
                  </p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    RM{" "}
                    {(
                      payrollSummary.total_socso_employee +
                      payrollSummary.total_socso_employer
                    ).toFixed(2)}
                  </p>
                </div>

                <div
                  className={`${
                    theme === "light" ? "bg-green-50" : "bg-green-900/50"
                  } p-4 rounded-lg`}
                >
                  <p
                    className={`text-sm ${
                      theme === "light" ? "text-gray-600" : "text-gray-400"
                    } mb-1`}
                  >
                    {t_view.totalNetPay}
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    RM {payrollSummary.total_net_pay.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={(e) => {
                    const loadingState = window.setButtonLoading && e.currentTarget
                      ? window.setButtonLoading(e.currentTarget, "Downloading...")
                      : null;
                    try {
                      handleDownloadAll();
                      // Reset after a delay since it's a redirect
                      setTimeout(() => {
                        if (loadingState) loadingState.reset();
                      }, 1000);
                    } catch (error) {
                      if (loadingState) loadingState.reset();
                    }
                  }}
                  disabled={!currentRunId}
                  className={`flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition ${
                    !currentRunId ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <i
                    data-lucide="download"
                    style={{ width: 20, height: 20 }}
                  ></i>
                  <span>{t_view.downloadPayslips}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('reports');
                  }}
                  className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-all shadow-md hover:shadow-lg"
                >
                  <i
                    data-lucide="bar-chart-2"
                    style={{ width: 20, height: 20 }}
                  ></i>
                  <span>{t_view.managementReport}</span>
                  <i
                    data-lucide="arrow-right"
                    style={{ width: 16, height: 16 }}
                  ></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

const WorkLogsView = memo(
  ({
    t,
    theme,
    workLogs,
    workers,
    customers,
    currentData,
    currentPage,
    setCurrentPage,
    maxPage,
    setIsAddWorkLogModalOpen,
    handleDeleteWorkLog,
    handleEditWorkLogClick,
    workLogWorkerFilter,
    setWorkLogWorkerFilter,
    workLogCustomerFilter,
    setWorkLogCustomerFilter,
  }) => {
    const t_view = t.workLogsView;
    const pageSize = 100;

    // Use filtered work logs count from parent (workLogs here is already filtered)
    const filteredWorkLogsCount = workLogs.length;

    const startIndex =
      filteredWorkLogsCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
    const endIndex = Math.min(currentPage * pageSize, filteredWorkLogsCount);

    // Use currentData from pagination hook (already filtered and paginated)
    const displayData = currentData;

    useEffect(() => {
      const timer = setTimeout(() => {
        if (window.lucide) {
          window.lucide.createIcons();
        }
      }, 50);
      return () => clearTimeout(timer);
    }, [currentData]);

    return (
      <div className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2
            className={`text-2xl font-bold ${
              theme === "light" ? "text-gray-800" : "text-white"
            }`}
          >
            {t_view.title} ({filteredWorkLogsCount.toLocaleString()}{" "}
            {t_view.entries})
          </h2>
          <button
            onClick={() => setIsAddWorkLogModalOpen(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-emerald-700 transition w-full sm:w-auto justify-center"
          >
            <i data-lucide="plus" style={{ width: 20, height: 20 }}></i>
            <span>{t_view.logNewWork}</span>
          </button>
        </div>

        <div
          className={`${
            theme === "light" ? "bg-white" : "bg-gray-800"
          } rounded-lg shadow optimized-card`}
        >
          <div
            className={`p-4 border-b ${
              theme === "light" ? "border-gray-200" : "border-gray-700"
            }`}
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={workLogWorkerFilter}
                onChange={(e) => {
                  console.log('[FILTER] Worker filter changed to:', e.target.value);
                  setWorkLogWorkerFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={`border rounded-lg px-3 py-2 ${
                  theme === "light"
                    ? "bg-white border-gray-300"
                    : "bg-gray-700 border-gray-600 text-white"
                }`}
              >
                <option value="All">{t.allWorkers}</option>
                {workers &&
                  workers
                    .filter((worker) => {
                      // Filter out drivers and office staff
                      // Only show field workers (those without role designations in parentheses)
                      const name = worker.name || '';
                      const isDriver = /\(driver\)/i.test(name);
                      const isOfficeStaff = /\((finance|hr|operations|admin|manager|staff|office)\)/i.test(name);
                      return !isDriver && !isOfficeStaff;
                    })
                    .map((worker) => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name} ({worker.type})
                      </option>
                    ))}
              </select>
              <select
                value={workLogCustomerFilter}
                onChange={(e) => {
                  console.log('[FILTER] Customer filter changed to:', e.target.value);
                  setWorkLogCustomerFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={`border rounded-lg px-3 py-2 ${
                  theme === "light"
                    ? "bg-white border-gray-300"
                    : "bg-gray-700 border-gray-600 text-white"
                }`}
              >
                <option value="All">{t.allCustomers}</option>
                {customers &&
                  customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead
                className={`${
                  theme === "light" ? "bg-gray-50" : "bg-gray-700"
                }`}
              >
                <tr>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium ${
                      theme === "light" ? "text-gray-500" : "text-gray-300"
                    } uppercase tracking-wider`}
                  >
                    {t_view.thDate}
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium ${
                      theme === "light" ? "text-gray-500" : "text-gray-300"
                    } uppercase tracking-wider`}
                  >
                    {t_view.thWorker}
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium ${
                      theme === "light" ? "text-gray-500" : "text-gray-300"
                    } uppercase tracking-wider`}
                  >
                    {t_view.thCustomer}
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium ${
                      theme === "light" ? "text-gray-500" : "text-gray-300"
                    } uppercase tracking-wider`}
                  >
                    {t_view.thTons}
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium ${
                      theme === "light" ? "text-gray-500" : "text-gray-300"
                    } uppercase tracking-wider`}
                  >
                    {t_view.thRate}
                  </th>
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium ${
                      theme === "light" ? "text-gray-500" : "text-gray-300"
                    } uppercase tracking-wider`}
                  >
                    {t.workersView.thActions}
                  </th>
                </tr>
              </thead>

              <tbody
                className={`divide-y ${
                  theme === "light" ? "divide-gray-200" : "divide-gray-700"
                }`}
              >
                {displayData.map((log) => (
                  <tr
                    key={log.id}
                    className={`${
                      theme === "light"
                        ? "hover:bg-gray-50"
                        : "hover:bg-gray-600"
                    }`}
                  >
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        theme === "light" ? "text-gray-900" : "text-white"
                      }`}
                    >
                      {log.log_date}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        theme === "light" ? "text-gray-900" : "text-white"
                      }`}
                    >
                      <div>
                        <div>{log.worker_name}</div>
                        <div className={`text-xs ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                          ID: {log.worker_id}
                        </div>
                      </div>
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        theme === "light" ? "text-gray-600" : "text-gray-400"
                      }`}
                    >
                      <div>
                        <div>{log.customer_name}</div>
                        <div className={`text-xs ${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
                          ID: {log.customer_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {log.tons}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        theme === "light" ? "text-gray-600" : "text-gray-400"
                      }`}
                    >
                      {`RM${log.rate_per_ton}`}
                      {t.perTon}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleEditWorkLogClick(log)}
                          className="text-blue-600 hover:text-blue-800"
                          title={t_view.editTitle}
                        >
                          <i
                            data-lucide="edit"
                            style={{ width: 18, height: 18 }}
                          ></i>
                        </button>
                        <button
                          onClick={() => handleDeleteWorkLog(log.id)}
                          className="text-red-600 hover:text-red-800"
                          title={t_view.deleteTitle}
                        >
                          <i
                            data-lucide="trash-2"
                            style={{ width: 18, height: 18 }}
                          ></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            className={`p-4 border-t ${
              theme === "light" ? "border-gray-200" : "border-gray-700"
            } flex flex-col sm:flex-row justify-between items-center gap-3`}
          >
            <div
              className={`text-sm ${
                theme === "light" ? "text-gray-600" : "text-gray-400"
              }`}
            >
              {t.showing} {startIndex} {t.to} {endIndex} {t.of}{" "}
              {filteredWorkLogsCount.toLocaleString()} {t.results}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 border rounded disabled:opacity-50 ${
                  theme === "light"
                    ? "border-gray-300 hover:bg-gray-100"
                    : "border-gray-600 text-gray-300 hover:bg-gray-600 disabled:text-gray-500"
                }`}
              >
                {t.previous}
              </button>
              <span
                className={`px-3 py-1 ${
                  theme === "light" ? "text-gray-700" : "text-gray-300"
                }`}
              >
                {t.page} {currentPage} {t.of} {maxPage || 1}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= maxPage}
                className={`px-3 py-1 border rounded disabled:opacity-50 ${
                  theme === "light"
                    ? "border-gray-300 hover:bg-gray-100"
                    : "border-gray-600 text-gray-300 hover:bg-gray-600 disabled:text-gray-500"
                }`}
              >
                {t.next}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
// --- Management Report View ---
const ManagementReportView = ({ t, theme, setActiveTab }) => {
  const iframeRef = React.useRef(null);

  // Use effect to handle iframe lifecycle
  React.useEffect(() => {
    // Component mounted - iframe is ready
    console.log('Management Dashboard mounted');

    // Initialize icons
    const timer = setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 50);

    // Cleanup function when component unmounts
    return () => {
      clearTimeout(timer);
      console.log('Management Dashboard unmounting');
      // Ensure iframe loses focus when unmounting
      if (iframeRef.current) {
        iframeRef.current.blur();
      }
    };
  }, []);

  return (
    <div
      className="w-full h-full"
      style={{ height: 'calc(100vh - 120px)', position: 'relative' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Back button */}
      <div className={`mb-4 ${theme === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-lg shadow-md p-4`}>
        <button
          onClick={() => setActiveTab && setActiveTab('payroll')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
            theme === 'light'
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          <i data-lucide="arrow-left" style={{ width: 18, height: 18 }}></i>
          <span>{t.back || 'Back to Payroll'}</span>
        </button>
      </div>

      <iframe
        ref={iframeRef}
        key="management-dashboard-iframe"
        src="management_dashboard.html"
        className="w-full border-0 rounded-lg"
        style={{ height: 'calc(100vh - 200px)' }}
        title="Management Dashboard"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
};


// --- Applications View Component ---
const ApplicationsView = memo(({ t, theme, addActivity }) => {
  const [applications, setApplications] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAcres, setMinAcres] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('api/api_get_customer_applications.php?_=' + new Date().getTime());
      if (!response.ok) throw new Error(t.applicationsView.failedToFetchApplications);
      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error loading applications:', error);
      showToast(t.applicationsView.errorLoadingApplications + ' ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const statistics = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(app => app.status === 'pending').length;
    const approved = applications.filter(app => app.status === 'approved').length;
    const rejected = applications.filter(app => app.status === 'rejected').length;
    return { total, pending, approved, rejected };
  }, [applications]);

  const filteredApps = useMemo(() => {
    let filtered = applications;

    // Status filter
    if (currentFilter !== 'all') {
      filtered = filtered.filter(app => app.status === currentFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app =>
        (app.name?.toLowerCase().includes(term)) ||
        (app.email?.toLowerCase().includes(term)) ||
        (app.contact?.toLowerCase().includes(term)) ||
        (app.location?.toLowerCase().includes(term))
      );
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(app => new Date(app.submitted_at) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(app => new Date(app.submitted_at) <= new Date(dateTo + ' 23:59:59'));
    }

    // Acres filter
    if (minAcres) {
      filtered = filtered.filter(app => parseFloat(app.acres || 0) >= parseFloat(minAcres));
    }

    // Sorting
    const sorted = [...filtered];
    switch (sortBy) {
      case 'date-desc':
        sorted.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
        break;
      case 'date-asc':
        sorted.sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
        break;
      case 'name-asc':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name-desc':
        sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'acres-desc':
        sorted.sort((a, b) => (parseFloat(b.acres || 0)) - (parseFloat(a.acres || 0)));
        break;
      case 'acres-asc':
        sorted.sort((a, b) => (parseFloat(a.acres || 0)) - (parseFloat(b.acres || 0)));
        break;
    }

    return sorted;
  }, [applications, currentFilter, searchTerm, sortBy, dateFrom, dateTo, minAcres]);

  const handleUpdateStatus = useCallback(async (id, newStatus) => {
    const isApprove = newStatus === 'approved';
    if (!confirm(isApprove ? t.applicationsView.confirmApprove : t.applicationsView.confirmReject)) {
      return;
    }

    // Get application name for activity log
    const application = applications.find(app => app.id === id);
    const appName = application ? application.name : 'Unknown';

    let rejectionReason = null;
    if (!isApprove) {
      rejectionReason = prompt(t.applicationsView.enterRejectionReason);
    }

    try {
      const apiUrl = isApprove ? 'api/api_approve_application.php' : 'api/api_reject_application.php';
      const requestBody = isApprove
        ? { application_id: id }
        : { application_id: id, rejection_reason: rejectionReason };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t.applicationsView.failedToUpdateStatus);
      }

      const result = await response.json();
      showToast(result.message || t.applicationsView.statusUpdated, 'success');

      // Add activity to recent activity log
      if (addActivity) {
        if (isApprove) {
          addActivity('approveApplication', 'check-circle', appName);
        } else {
          addActivity('rejectApplication', 'x-circle', appName);
        }
      }

      setShowModal(false);
      setSelectedApp(null);
      loadApplications();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast(t.applicationsView.errorUpdatingStatus + ' ' + error.message, 'error');
    }
  }, [loadApplications, t, addActivity, applications]);

  const getStatusBadgeClass = (status) => {
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (status === 'approved') return 'bg-green-100 text-green-800';
    if (status === 'rejected') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
  const map = {
    pending: t.applicationsView.pending,
    approved: t.applicationsView.approved,
    rejected: t.applicationsView.rejected,
  };
  return map[status.toLowerCase()] || status;
};

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={`${theme === 'light' ? 'bg-gray-50' : 'bg-gray-900'}`}>
      {/* Header */}
      <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-lg shadow-md p-6 mb-6`}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              {t.applicationsView.title}
            </h2>
            <p className={`mt-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
              {t.applicationsView.subtitle}
            </p>
          </div>
          <button
            onClick={loadApplications}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
          >
            <i data-lucide="refresh-cw" style={{ width: 18, height: 18 }}></i>
            {t.applicationsView.refresh}
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-lg shadow-md p-6 mb-6`}>
        <div className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            {[
              { key: 'all', label: t.applicationsView.allApplications },
              { key: 'pending', label: t.applicationsView.pending },
              { key: 'approved', label: t.applicationsView.approved },
              { key: 'rejected', label: t.applicationsView.rejected }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setCurrentFilter(key)}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  currentFilter === key
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : theme === 'light'
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search and Sort */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px] relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.applicationsView.searchPlaceholder}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                  theme === 'light'
                    ? 'border-gray-300 bg-white text-gray-900'
                    : 'border-gray-600 bg-gray-700 text-white'
                }`}
              />
              <i data-lucide="search" style={{ width: 18, height: 18, position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}></i>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-600 bg-gray-700 text-white'
              }`}
            >
              <option value="date-desc">{t.applicationsView.sortLatestFirst}</option>
              <option value="date-asc">{t.applicationsView.sortOldestFirst}</option>
              <option value="name-asc">{t.applicationsView.sortNameAsc}</option>
              <option value="name-desc">{t.applicationsView.sortNameDesc}</option>
              <option value="acres-desc">{t.applicationsView.sortAcresDesc}</option>
              <option value="acres-asc">{t.applicationsView.sortAcresAsc}</option>
            </select>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-6 py-2 border rounded-lg transition flex items-center gap-2 ${
                theme === 'light'
                  ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <i data-lucide="filter" style={{ width: 18, height: 18 }}></i>
              {t.applicationsView.advanced}
            </button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t.applicationsView.dateFrom}</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg ${
                    theme === 'light'
                      ? 'border-gray-300 bg-white text-gray-900'
                      : 'border-gray-600 bg-gray-700 text-white'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t.applicationsView.dateTo}</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg ${
                    theme === 'light'
                      ? 'border-gray-300 bg-white text-gray-900'
                      : 'border-gray-600 bg-gray-700 text-white'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>{t.applicationsView.minAcres}</label>
                <input
                  type="number"
                  value={minAcres}
                  onChange={(e) => setMinAcres(e.target.value)}
                  placeholder="0"
                  className={`w-full px-4 py-2 border rounded-lg ${
                    theme === 'light'
                      ? 'border-gray-300 bg-white text-gray-900'
                      : 'border-gray-600 bg-gray-700 text-white'
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {[
          { label: t.applicationsView.totalApplications, value: statistics.total, color: 'blue', icon: 'users' },
          { label: t.applicationsView.pendingReview, value: statistics.pending, color: 'yellow', icon: 'clock' },
          { label: t.applicationsView.approved, value: statistics.approved, color: 'green', icon: 'check-circle' },
          { label: t.applicationsView.rejected, value: statistics.rejected, color: 'red', icon: 'x-circle' }
        ].map(({ label, value, color, icon }) => (
          <div key={label} className={`${theme === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-lg shadow-md p-6`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{label}</p>
                <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
              </div>
              <div className={`p-3 bg-${color}-100 rounded-lg`}>
                <i data-lucide={icon} style={{ width: 24, height: 24, color: `var(--${color}-600)` }}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Applications List */}
      <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-lg shadow-md p-6`}>
        <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
          <i data-lucide="inbox" style={{ width: 24, height: 24 }}></i>
          {t.applicationsView.applicationsList} ({filteredApps.length})
        </h3>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-20 rounded-lg ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'} animate-pulse`}></div>
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-12">
            <i data-lucide="inbox" style={{ width: 64, height: 64, color: '#9ca3af', margin: '0 auto 16px' }}></i>
            <p className={`text-lg ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>{t.applicationsView.noApplicationsFound}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map(app => (
              <div
                key={app.id}
                onClick={() => { setSelectedApp(app); setShowModal(true); }}
                className={`${theme === 'light' ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-700 hover:bg-gray-600'} rounded-lg p-6 cursor-pointer transition shadow hover:shadow-lg`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className={`text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{app.name}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(app.status)}`}>
                    {getStatusText(app.status)}
                  </span>
                </div>

                <div className={`space-y-2 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  <div className="flex items-center gap-2">
                    <i data-lucide="mail" style={{ width: 16, height: 16 }}></i>
                    <span>{app.email || t.applicationsView.noEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i data-lucide="phone" style={{ width: 16, height: 16 }}></i>
                    <span>{app.contact || t.applicationsView.noContact}</span>
                  </div>
                  {app.location && (
                    <div className="flex items-center gap-2">
                      <i data-lucide="map-pin" style={{ width: 16, height: 16 }}></i>
                      <span>{app.location}</span>
                    </div>
                  )}
                  {app.acres && (
                    <div className="flex items-center gap-2">
                      <i data-lucide="maximize" style={{ width: 16, height: 16 }}></i>
                      <span>{parseFloat(app.acres).toFixed(2)} {t.applicationsView.acres}</span>
                    </div>
                  )}
                </div>

                <div className={`mt-4 pt-4 border-t ${theme === 'light' ? 'border-gray-200' : 'border-gray-600'} text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                  {t.applicationsView.applied} {formatDate(app.submitted_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{t.applicationsView.applicationDetails}</h3>
                <button onClick={() => setShowModal(false)} className={`${theme === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-gray-500 hover:text-gray-300'} transition`}>
                  <i data-lucide="x" style={{ width: 24, height: 24 }}></i>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{t.applicationsView.status}</label>
                  <div className="mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(selectedApp.status)}`}>
                      {getStatusText(selectedApp.status)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{t.applicationsView.fullName}</label>
                  <p className={`mt-1 text-lg font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{selectedApp.name}</p>
                </div>

                <div>
                  <label className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{t.applicationsView.emailAddress}</label>
                  <p className={`mt-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{selectedApp.email || t.applicationsView.notProvided}</p>
                </div>

                <div>
                  <label className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{t.applicationsView.contactNumber}</label>
                  <p className={`mt-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{selectedApp.contact || t.applicationsView.notProvided}</p>
                </div>

                <div>
                  <label className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{t.applicationsView.location}</label>
                  <p className={`mt-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{selectedApp.location || t.applicationsView.notProvided}</p>
                </div>

                {selectedApp.acres && (
                  <div>
                    <label className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{t.applicationsView.acres}</label>
                    <p className={`mt-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{parseFloat(selectedApp.acres).toFixed(2)} {t.applicationsView.acres}</p>
                  </div>
                )}

                {selectedApp.company_name && (
                  <div>
                    <label className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{t.applicationsView.companyName}</label>
                    <p className={`mt-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{selectedApp.company_name}</p>
                  </div>
                )}

                {selectedApp.rate_requested && (
                  <div>
                    <label className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{t.applicationsView.requestedRate}</label>
                    <p className={`mt-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>RM {parseFloat(selectedApp.rate_requested).toFixed(2)}</p>
                  </div>
                )}

                <div>
                  <label className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{t.applicationsView.applicationDate}</label>
                  <p className={`mt-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{formatDateTime(selectedApp.submitted_at)}</p>
                </div>

                {selectedApp.reviewed_at && (
                  <div>
                    <label className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{t.applicationsView.reviewedAt}</label>
                    <p className={`mt-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{formatDateTime(selectedApp.reviewed_at)}</p>
                  </div>
                )}

                {selectedApp.reviewed_by && (
                  <div>
                    <label className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{t.applicationsView.reviewedBy}</label>
                    <p className={`mt-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{selectedApp.reviewed_by}</p>
                  </div>
                )}

                {selectedApp.rejection_reason && (
                  <div>
                    <label className={`text-sm font-semibold ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{t.applicationsView.rejectionReason}</label>
                    <p className={`mt-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{selectedApp.rejection_reason}</p>
                  </div>
                )}

                {selectedApp.status === 'pending' && (
                  <div className={`flex gap-4 pt-4 border-t ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
                    <button
                      onClick={() => handleUpdateStatus(selectedApp.id, 'approved')}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"
                    >
                      <i data-lucide="check" style={{ width: 20, height: 20 }}></i>
                      {t.applicationsView.approve}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedApp.id, 'rejected')}
                      className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition font-semibold flex items-center justify-center gap-2"
                    >
                      <i data-lucide="x" style={{ width: 20, height: 20 }}></i>
                      {t.applicationsView.reject}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 px-6 py-4 rounded-lg shadow-lg z-[100] text-white font-semibold ${
          toastMessage.type === 'success' ? 'bg-green-600' :
          toastMessage.type === 'error' ? 'bg-red-600' :
          'bg-blue-600'
        }`}>
          {toastMessage.message}
        </div>
      )}
    </div>
  );
});

// --- Assign components to window object ---
// This makes them accessible to app_logic.js
window.DashboardView = DashboardView;
window.WorkersView = WorkersView;
window.CustomersView = CustomersView;
window.PayrollView = PayrollView;
window.WorkLogsView = WorkLogsView;
window.ApplicationsView = ApplicationsView;
window.ManagementReportView = ManagementReportView;

window.StatCard = StatCard;
window.ActivityItem = ActivityItem;
