// button_loading_utils.js
// Universal Button Loading State Management System

/**
 * Set button to loading state
 * @param {HTMLElement|string} button - Button element or ID
 * @param {string} loadingText - Text to display while loading (default: "Loading...")
 * @returns {Object} Object with originalHTML and reset function
 */
window.setButtonLoading = function(button, loadingText = "Loading...") {
  const btn = typeof button === 'string' ? document.getElementById(button) : button;
  if (!btn) return null;

  // Store original content
  const originalHTML = btn.innerHTML;
  const originalDisabled = btn.disabled;

  // Set loading state
  btn.disabled = true;
  btn.style.position = 'relative';
  btn.style.cursor = 'not-allowed';
  btn.style.opacity = '0.7';

  // Create spinner HTML
  const spinner = `
    <span class="btn-spinner-wrapper" style="display: inline-flex; align-items: center; gap: 8px;">
      <svg class="btn-spinner" style="animation: spin 1s linear infinite; width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" stroke-width="3" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-width="3" stroke-linecap="round"></path>
      </svg>
      <span>${loadingText}</span>
    </span>
  `;

  btn.innerHTML = spinner;

  // Return reset function
  return {
    originalHTML,
    reset: () => {
      btn.innerHTML = originalHTML;
      btn.disabled = originalDisabled;
      btn.style.cursor = '';
      btn.style.opacity = '';

      // Re-create Lucide icons if they exist
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  };
};

/**
 * Reset button from loading state
 * @param {HTMLElement|string} button - Button element or ID
 * @param {string} originalHTML - Original button HTML
 */
window.resetButtonLoading = function(button, originalHTML) {
  const btn = typeof button === 'string' ? document.getElementById(button) : button;
  if (!btn) return;

  btn.innerHTML = originalHTML;
  btn.disabled = false;
  btn.style.cursor = '';
  btn.style.opacity = '';

  // Re-create Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
};

/**
 * Wrap async function with button loading state
 * @param {Function} asyncFunc - Async function to execute
 * @param {HTMLElement|string} button - Button element or ID
 * @param {string} loadingText - Loading text
 * @returns {Promise} Result of the async function
 */
window.withButtonLoading = async function(asyncFunc, button, loadingText = "Loading...") {
  const loadingState = window.setButtonLoading(button, loadingText);
  if (!loadingState) return;

  try {
    const result = await asyncFunc();
    return result;
  } finally {
    loadingState.reset();
  }
};

// Add spin animation to document if not exists
if (!document.getElementById('btn-spinner-styles')) {
  const style = document.createElement('style');
  style.id = 'btn-spinner-styles';
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .btn-spinner {
      display: inline-block;
      vertical-align: middle;
    }

    .btn-spinner-wrapper {
      pointer-events: none;
    }

    /* Button loading state enhancement */
    button:disabled {
      pointer-events: none;
    }

    /* Skeleton loading for tables */
    .skeleton-row {
      animation: skeleton-pulse 1.5s ease-in-out infinite;
      background: linear-gradient(
        90deg,
        rgba(229, 231, 235, 0.1) 25%,
        rgba(229, 231, 235, 0.3) 50%,
        rgba(229, 231, 235, 0.1) 75%
      );
      background-size: 200% 100%;
      border-radius: 4px;
      height: 20px;
    }

    @keyframes skeleton-pulse {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Loading overlay for sections */
    .section-loading-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      border-radius: inherit;
    }

    .section-loading-overlay.dark {
      background: rgba(31, 41, 55, 0.8);
    }

    .section-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(16, 185, 129, 0.2);
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    /* Inline mini spinner */
    .inline-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(16, 185, 129, 0.2);
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      vertical-align: middle;
      margin-right: 6px;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Show loading overlay on a section
 * @param {HTMLElement|string} container - Container element or ID
 * @param {string} theme - 'light' or 'dark'
 * @returns {Function} Function to remove overlay
 */
window.showSectionLoading = function(container, theme = 'light') {
  const element = typeof container === 'string' ? document.getElementById(container) : container;
  if (!element) return () => {};

  // Make container position relative if not already
  const originalPosition = element.style.position;
  if (!originalPosition || originalPosition === 'static') {
    element.style.position = 'relative';
  }

  const overlay = document.createElement('div');
  overlay.className = `section-loading-overlay ${theme === 'dark' ? 'dark' : ''}`;
  overlay.innerHTML = '<div class="section-spinner"></div>';
  element.appendChild(overlay);

  // Return function to remove overlay
  return () => {
    overlay.remove();
    if (!originalPosition || originalPosition === 'static') {
      element.style.position = originalPosition;
    }
  };
};

/**
 * Show inline spinner next to element
 * @param {HTMLElement|string} element - Element to show spinner next to
 * @returns {Function} Function to remove spinner
 */
window.showInlineSpinner = function(element) {
  const el = typeof element === 'string' ? document.getElementById(element) : element;
  if (!el) return () => {};

  const spinner = document.createElement('span');
  spinner.className = 'inline-spinner';
  el.parentNode.insertBefore(spinner, el.nextSibling);

  return () => spinner.remove();
};

console.log('✅ Button Loading Utilities loaded successfully');
