// Custom Date Picker Component
const { useState, useEffect, useRef } = React;

const DatePicker = ({ value, onChange, maxDate, language = 'en', theme = 'light', required = false, name = 'date' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(value || '');
  const pickerRef = useRef(null);

  // Localization
  const locale = {
    en: {
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      today: 'Today',
      clear: 'Clear',
      format: 'MM/DD/YYYY'
    },
    ms: {
      months: ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'],
      monthsShort: ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'],
      days: ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'],
      today: 'Hari Ini',
      clear: 'Kosongkan',
      format: 'DD/MM/YYYY'
    },
    zh: {
      months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
      monthsShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      days: ['日', '一', '二', '三', '四', '五', '六'],
      today: '今天',
      clear: '清除',
      format: 'YYYY年MM月DD日'
    }
  };

  const t = locale[language] || locale.en;

  // Format date for display
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    if (language === 'en') {
      return `${month}/${day}/${year}`;
    } else if (language === 'ms') {
      return `${day}/${month}/${year}`;
    } else {
      return `${year}年${month}月${day}日`;
    }
  };

  // Parse display date back to YYYY-MM-DD
  const parseDisplayDate = (displayStr) => {
    if (!displayStr) return '';
    try {
      if (language === 'en') {
        const [month, day, year] = displayStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (language === 'ms') {
        const [day, month, year] = displayStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else {
        const yearMatch = displayStr.match(/(\d{4})年/);
        const monthMatch = displayStr.match(/(\d{1,2})月/);
        const dayMatch = displayStr.match(/(\d{1,2})日/);
        if (yearMatch && monthMatch && dayMatch) {
          return `${yearMatch[1]}-${monthMatch[1].padStart(2, '0')}-${dayMatch[1].padStart(2, '0')}`;
        }
      }
    } catch (e) {
      return '';
    }
    return '';
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update selected date when value prop changes
  useEffect(() => {
    setSelectedDate(value || '');
    if (value) {
      setCurrentMonth(new Date(value));
    }
  }, [value]);

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  // Check if date is disabled (after maxDate)
  const isDateDisabled = (date) => {
    if (!maxDate || !date) return false;
    const maxDateObj = new Date(maxDate);
    return date > maxDateObj;
  };

  // Check if date is selected
  const isDateSelected = (date) => {
    if (!selectedDate || !date) return false;
    const selectedDateObj = new Date(selectedDate);
    return date.getFullYear() === selectedDateObj.getFullYear() &&
           date.getMonth() === selectedDateObj.getMonth() &&
           date.getDate() === selectedDateObj.getDate();
  };

  // Check if date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };

  // Handle date selection
  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    onChange({ target: { name, value: dateStr } });
    setIsOpen(false);
  };

  // Handle today button
  const handleToday = () => {
    const today = new Date();
    if (!isDateDisabled(today)) {
      handleDateClick(today);
    }
  };

  // Handle clear button
  const handleClear = () => {
    setSelectedDate('');
    onChange({ target: { name, value: '' } });
    setIsOpen(false);
  };

  // Navigate months
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="relative" ref={pickerRef}>
      {/* Input field */}
      <div className="relative">
        <input
          type="text"
          value={formatDisplayDate(selectedDate)}
          onChange={(e) => {
            const parsed = parseDisplayDate(e.target.value);
            if (parsed) {
              setSelectedDate(parsed);
              onChange({ target: { name, value: parsed } });
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={t.format}
          required={required}
          className={`w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            theme === 'light'
              ? 'bg-white border-gray-300 text-gray-900'
              : 'bg-gray-700 border-gray-600 text-white'
          }`}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded ${
            theme === 'light' ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <i data-lucide="calendar" className="w-5 h-5"></i>
        </button>
      </div>

      {/* Calendar popup */}
      {isOpen && (
        <div className={`absolute z-50 mt-1 p-3 rounded-lg shadow-xl border ${
          theme === 'light'
            ? 'bg-white border-gray-200'
            : 'bg-gray-800 border-gray-700'
        }`} style={{ minWidth: '280px' }}>
          {/* Month/Year navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className={`p-1 rounded hover:bg-gray-100 ${
                theme === 'dark' ? 'hover:bg-gray-700' : ''
              }`}
            >
              <i data-lucide="chevron-left" className="w-5 h-5"></i>
            </button>
            <div className={`font-semibold ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              {t.monthsShort[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className={`p-1 rounded hover:bg-gray-100 ${
                theme === 'dark' ? 'hover:bg-gray-700' : ''
              }`}
            >
              <i data-lucide="chevron-right" className="w-5 h-5"></i>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {t.days.map((day, i) => (
              <div key={i} className={`text-center text-xs font-medium py-1 ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, i) => {
              if (!date) {
                return <div key={i} className="p-2"></div>;
              }
              const disabled = isDateDisabled(date);
              const selected = isDateSelected(date);
              const today = isToday(date);

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleDateClick(date)}
                  disabled={disabled}
                  className={`p-2 text-sm rounded ${
                    disabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : selected
                        ? 'bg-emerald-500 text-white font-semibold'
                        : today
                          ? theme === 'light'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-emerald-900 text-emerald-300 hover:bg-emerald-800'
                          : theme === 'light'
                            ? 'text-gray-700 hover:bg-gray-100'
                            : 'text-gray-200 hover:bg-gray-700'
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-3 pt-3 border-t">
            <button
              type="button"
              onClick={handleClear}
              className={`flex-1 px-3 py-1.5 text-sm rounded ${
                theme === 'light'
                  ? 'text-gray-700 hover:bg-gray-100'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {t.clear}
            </button>
            <button
              type="button"
              onClick={handleToday}
              disabled={maxDate && isDateDisabled(new Date())}
              className={`flex-1 px-3 py-1.5 text-sm rounded ${
                maxDate && isDateDisabled(new Date())
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              {t.today}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
