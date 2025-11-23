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
const ActivityItem = memo(({ text, time, icon, theme, onDismiss, id }) => (
  <div
    className={`flex items-start py-3 border-b last:border-0 ${
      theme === "light" ? "border-gray-200" : "border-gray-700"
    }`}
  >
    <i
      data-lucide={icon || "activity"}
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
          onClick={() => onDismiss(id)}
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
));

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
            value={workLogs.length.toLocaleString()}
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
                  text={activity.text}
                  time={formatTimeAgo(activity.time, t_time)}
                  icon={activity.icon}
                  theme={theme}
                  id={activity.id}
                  onDismiss={removeActivity}
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
            {showArchivedCustomers ? "Archived Customers" : t_view.title} ({displayList.length.toLocaleString()} {t.customers})
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
              <span>{showArchivedCustomers ? "Show Active" : "Show Archived"}</span>
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
              placeholder="Search by name, contact, rate, service area, or location..."
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
                      title="Reactivate Customer"
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
                {customer.remark && (
                  <div className="flex justify-between">
                    <span
                      className={`${
                        theme === "light" ? "text-gray-600" : "text-gray-400"
                      }`}
                    >
                      Service Area
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
                      Location
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
                  <span>Reactivate Customer</span>
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
                  onClick={async (e) => {
                    const loadingState = window.setButtonLoading && e.currentTarget
                      ? window.setButtonLoading(e.currentTarget, "Generating...")
                      : null;
                    try {
                      await handleGenerateManagementReport();
                    } finally {
                      if (loadingState) loadingState.reset();
                    }
                  }}
                  className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
                >
                  <i
                    data-lucide="file-text"
                    style={{ width: 20, height: 20 }}
                  ></i>
                  <span>{t_view.managementReport}</span>
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

    // Filter work logs based on selected worker and customer
    const filteredWorkLogs = workLogs.filter((log) => {
      const workerMatch =
        workLogWorkerFilter === "All" ||
        log.worker_id === parseInt(workLogWorkerFilter);
      const customerMatch =
        workLogCustomerFilter === "All" ||
        log.customer_id === parseInt(workLogCustomerFilter);
      return workerMatch && customerMatch;
    });

    const startIndex =
      filteredWorkLogs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
    const endIndex = Math.min(currentPage * pageSize, filteredWorkLogs.length);

    // Get current page data from filtered work logs
    const displayData = filteredWorkLogs.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );

    useEffect(() => {
      const timer = setTimeout(() => {
        if (window.lucide) {
          window.lucide.createIcons();
        }
      }, 50);
      return () => clearTimeout(timer);
    }, [filteredWorkLogs]);

    return (
      <div className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2
            className={`text-2xl font-bold ${
              theme === "light" ? "text-gray-800" : "text-white"
            }`}
          >
            {t_view.title} ({filteredWorkLogs.length.toLocaleString()}{" "}
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
              {filteredWorkLogs.length.toLocaleString()} {t.results}
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
                {t.page} {currentPage} {t.of}{" "}
                {Math.ceil(filteredWorkLogs.length / pageSize) || 1}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={
                  currentPage >= Math.ceil(filteredWorkLogs.length / pageSize)
                }
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
const ManagementReportView = React.memo(({ t, theme, workers, customers, workLogs }) => {
  const t_reports = t.reportsView;
  const [dateRange, setDateRange] = React.useState('last30Days');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  // Calculate date ranges
  const getDateRange = React.useCallback(() => {
    const today = new Date();
    let start, end = today;

    switch(dateRange) {
      case 'today':
        start = new Date(today);
        break;
      case 'thisWeek':
        start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'last7Days':
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        break;
      case 'last30Days':
        start = new Date(today);
        start.setDate(today.getDate() - 30);
        break;
      case 'customRange':
        start = startDate ? new Date(startDate) : new Date(today);
        end = endDate ? new Date(endDate) : today;
        break;
      default:
        start = new Date(today);
        start.setDate(today.getDate() - 30);
    }
    return { start, end };
  }, [dateRange, startDate, endDate]);

  const { start: filterStartDate, end: filterEndDate } = getDateRange();

  // Filter work logs by date range
  const filteredLogs = React.useMemo(() => {
    return workLogs.filter(log => {
      const logDate = new Date(log.work_date);
      return logDate >= filterStartDate && logDate <= filterEndDate;
    });
  }, [workLogs, filterStartDate, filterEndDate]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalTons = filteredLogs.reduce((sum, log) => sum + parseFloat(log.tons || 0), 0);
    const totalRevenue = filteredLogs.reduce((sum, log) => sum + (parseFloat(log.tons || 0) * parseFloat(log.rate || 0)), 0);

    const activeWorkerIds = new Set(filteredLogs.map(log => log.worker_id));
    const activeWorkersCount = activeWorkerIds.size;

    // Calculate days in range
    const daysInRange = Math.max(1, Math.ceil((filterEndDate - filterStartDate) / (1000 * 60 * 60 * 24)));
    const weeksInRange = Math.max(1, daysInRange / 7);
    const monthsInRange = Math.max(1, daysInRange / 30);

    return {
      totalTons,
      totalRevenue,
      activeWorkersCount,
      avgTonsPerDay: totalTons / daysInRange,
      avgTonsPerWeek: totalTons / weeksInRange,
      avgTonsPerMonth: totalTons / monthsInRange,
      totalLogs: filteredLogs.length,
    };
  }, [filteredLogs, filterStartDate, filterEndDate]);

  // Worker performance data
  const workerPerformance = React.useMemo(() => {
    const workerMap = {};
    filteredLogs.forEach(log => {
      if (!workerMap[log.worker_id]) {
        workerMap[log.worker_id] = {
          id: log.worker_id,
          name: log.worker_name,
          totalTons: 0,
          workDays: new Set(),
        };
      }
      workerMap[log.worker_id].totalTons += parseFloat(log.tons || 0);
      workerMap[log.worker_id].workDays.add(log.work_date);
    });

    return Object.values(workerMap)
      .map(w => ({
        ...w,
        workDays: w.workDays.size,
        avgPerDay: w.totalTons / w.workDays.size,
      }))
      .sort((a, b) => b.totalTons - a.totalTons);
  }, [filteredLogs]);

  // Customer profitability data
  const customerProfitability = React.useMemo(() => {
    const customerMap = {};
    filteredLogs.forEach(log => {
      if (!customerMap[log.customer_id]) {
        customerMap[log.customer_id] = {
          id: log.customer_id,
          name: log.customer_name,
          totalVolume: 0,
          totalValue: 0,
          logCount: 0,
          rates: [],
        };
      }
      const tons = parseFloat(log.tons || 0);
      const rate = parseFloat(log.rate || 0);
      customerMap[log.customer_id].totalVolume += tons;
      customerMap[log.customer_id].totalValue += tons * rate;
      customerMap[log.customer_id].logCount += 1;
      customerMap[log.customer_id].rates.push(rate);
    });

    return Object.values(customerMap)
      .map(c => ({
        ...c,
        avgRate: c.rates.reduce((a, b) => a + b, 0) / c.rates.length,
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume);
  }, [filteredLogs]);

  // Recent activities (last 10 logs)
  const recentActivities = React.useMemo(() => {
    return [...workLogs]
      .sort((a, b) => new Date(b.work_date) - new Date(a.work_date))
      .slice(0, 10);
  }, [workLogs]);

  // New Workers - Filter workers created within the date range
  const newWorkers = React.useMemo(() => {
    return workers.filter(worker => {
      if (!worker.created_at) return false;
      const createdDate = new Date(worker.created_at);
      return createdDate >= filterStartDate && createdDate <= filterEndDate;
    });
  }, [workers, filterStartDate, filterEndDate]);

  // New Customers - Filter customers created within the date range
  const newCustomers = React.useMemo(() => {
    return customers.filter(customer => {
      if (!customer.created_at) return false;
      const createdDate = new Date(customer.created_at);
      return createdDate >= filterStartDate && createdDate <= filterEndDate;
    });
  }, [customers, filterStartDate, filterEndDate]);

  // Format report period for display
  const reportPeriod = React.useMemo(() => {
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };
    return `${formatDate(filterStartDate)} - ${formatDate(filterEndDate)}`;
  }, [filterStartDate, filterEndDate]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
            {t_reports.title}
          </h2>
          <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
            {t_reports.reportPeriod || 'Report Period'}: {reportPeriod}
          </p>
        </div>

        {/* Interactive Dashboard Button */}
        <div className="flex items-center gap-4">
          <a
            href="management_dashboard.html"
            target="_blank"
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            <i data-lucide="bar-chart-2" style={{width: 20, height: 20}}></i>
            <span className="font-semibold">Interactive Dashboard</span>
            <i data-lucide="external-link" style={{width: 16, height: 16}}></i>
          </a>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div></div>
        {/* Date Range Selector */}
        <div className="flex items-center space-x-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className={`border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              theme === 'light' ? 'bg-white' : 'bg-gray-700 text-white'
            }`}
          >
            <option value="today">{t_reports.today}</option>
            <option value="thisWeek">{t_reports.thisWeek}</option>
            <option value="thisMonth">{t_reports.thisMonth}</option>
            <option value="last7Days">{t_reports.last7Days}</option>
            <option value="last30Days">{t_reports.last30Days}</option>
            <option value="customRange">{t_reports.customRange}</option>
          </select>

          {dateRange === 'customRange' && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`border rounded-lg px-3 py-2 ${theme === 'light' ? 'bg-white' : 'bg-gray-700 text-white'}`}
              />
              <span className={theme === 'light' ? 'text-gray-600' : 'text-gray-400'}>{t_reports.to}</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`border rounded-lg px-3 py-2 ${theme === 'light' ? 'bg-white' : 'bg-gray-700 text-white'}`}
              />
            </>
          )}
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard title={t_reports.totalOutput} value={`${stats.totalTons.toFixed(2)} ${t_reports.tons}`} color="bg-emerald-500" icon="package" theme={theme} />
        <StatCard title={t_reports.activeWorkers} value={stats.activeWorkersCount.toString()} color="bg-blue-500" icon="users" theme={theme} />
        <StatCard title={t_reports.avgTonsPerDay} value={stats.avgTonsPerDay.toFixed(2)} color="bg-purple-500" icon="trending-up" theme={theme} />
        <StatCard title={t_reports.totalRevenue} value={`RM ${stats.totalRevenue.toFixed(2)}`} color="bg-orange-500" icon="dollar-sign" theme={theme} />
        <StatCard title={t_reports.newWorkers || 'New Workers'} value={newWorkers.length.toString()} color="bg-green-500" icon="user-plus" theme={theme} />
        <StatCard title={t_reports.newCustomers || 'New Customers'} value={newCustomers.length.toString()} color="bg-pink-500" icon="user-check" theme={theme} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-lg shadow p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
            {t_reports.recentActivities}
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentActivities.length === 0 ? (
              <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                {t_reports.noActivities}
              </p>
            ) : (
              recentActivities.map((log, idx) => (
                <div key={idx} className={`flex justify-between items-center py-2 border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
                  <div>
                    <p className={`text-sm font-medium ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                      {log.worker_name} → {log.customer_name}
                    </p>
                    <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                      {log.tons} {t_reports.tons} @ RM{log.rate}/{t.perTon}
                    </p>
                  </div>
                  <span className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                    {log.work_date}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Worker Efficiency */}
        <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-lg shadow p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
            {t_reports.workerEfficiency}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
              <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{t_reports.avgTonsPerDay}</p>
              <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                {stats.avgTonsPerDay.toFixed(2)}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
              <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{t_reports.avgTonsPerWeek}</p>
              <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                {stats.avgTonsPerWeek.toFixed(2)}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
              <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{t_reports.avgTonsPerMonth}</p>
              <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                {stats.avgTonsPerMonth.toFixed(2)}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
              <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{t_reports.workLogs}</p>
              <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                {stats.totalLogs}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Worker Performance Ranking */}
      <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-lg shadow p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
          {t_reports.workerPerformance}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'} uppercase`}>
                  {t_reports.rank}
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'} uppercase`}>
                  {t_reports.workerName}
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'} uppercase`}>
                  {t_reports.totalTons}
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'} uppercase`}>
                  {t_reports.workDays}
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'} uppercase`}>
                  {t_reports.avgPerDay}
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'light' ? 'divide-gray-200' : 'divide-gray-700'}`}>
              {workerPerformance.slice(0, 10).map((worker, idx) => (
                <tr key={worker.id} className={`${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-700'}`}>
                  <td className={`px-4 py-3 text-sm ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {idx + 1}
                  </td>
                  <td className={`px-4 py-3 text-sm ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {worker.name}
                  </td>
                  <td className={`px-4 py-3 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    {worker.totalTons.toFixed(2)}
                  </td>
                  <td className={`px-4 py-3 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    {worker.workDays}
                  </td>
                  <td className={`px-4 py-3 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    {worker.avgPerDay.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profitability Analysis */}
      <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-lg shadow p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
          {t_reports.customerProfitability}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'} uppercase`}>
                  {t_reports.customerName}
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'} uppercase`}>
                  {t_reports.totalVolume}
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'} uppercase`}>
                  {t_reports.workLogs}
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'} uppercase`}>
                  {t_reports.avgRate}
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'} uppercase`}>
                  {t_reports.estimatedValue}
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'light' ? 'divide-gray-200' : 'divide-gray-700'}`}>
              {customerProfitability.slice(0, 10).map((customer) => (
                <tr key={customer.id} className={`${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-700'}`}>
                  <td className={`px-4 py-3 text-sm font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {customer.name}
                  </td>
                  <td className={`px-4 py-3 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    {customer.totalVolume.toFixed(2)} {t_reports.tons}
                  </td>
                  <td className={`px-4 py-3 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    {customer.logCount}
                  </td>
                  <td className={`px-4 py-3 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    RM{customer.avgRate.toFixed(2)}{t.perTon}
                  </td>
                  <td className={`px-4 py-3 text-sm font-semibold ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>
                    RM{customer.totalValue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Members Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Workers */}
        <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-lg shadow p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
            {t_reports.newWorkers || 'New Workers'} ({newWorkers.length})
          </h3>
          {newWorkers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'} uppercase`}>
                      {t_reports.workerName}
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'} uppercase`}>
                      Type
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'} uppercase`}>
                      {t_reports.joinDate || 'Join Date'}
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'light' ? 'divide-gray-200' : 'divide-gray-700'}`}>
                  {newWorkers.map((worker) => (
                    <tr key={worker.id} className={`${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-700'}`}>
                      <td className={`px-4 py-3 text-sm ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        {worker.name}
                      </td>
                      <td className={`px-4 py-3 text-sm`}>
                        <span className={`px-2 py-1 rounded text-xs ${worker.type === 'Local' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                          {worker.type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        {worker.created_at ? new Date(worker.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={`text-center py-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
              {t_reports.noNewWorkers || 'No new workers in this period'}
            </p>
          )}
        </div>

        {/* New Customers */}
        <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-lg shadow p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
            {t_reports.newCustomers || 'New Customers'} ({newCustomers.length})
          </h3>
          {newCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${theme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'} uppercase`}>
                      {t_reports.customerName}
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'} uppercase`}>
                      Rate
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${theme === 'light' ? 'text-gray-500' : 'text-gray-300'} uppercase`}>
                      {t_reports.joinDate || 'Join Date'}
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'light' ? 'divide-gray-200' : 'divide-gray-700'}`}>
                  {newCustomers.map((customer) => (
                    <tr key={customer.id} className={`${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-700'}`}>
                      <td className={`px-4 py-3 text-sm ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        {customer.name}
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold text-emerald-600`}>
                        RM{customer.rate}
                      </td>
                      <td className={`px-4 py-3 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={`text-center py-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
              {t_reports.noNewCustomers || 'No new customers in this period'}
            </p>
          )}
        </div>
      </div>
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
window.ManagementReportView = ManagementReportView;

window.StatCard = StatCard;
window.ActivityItem = ActivityItem;
