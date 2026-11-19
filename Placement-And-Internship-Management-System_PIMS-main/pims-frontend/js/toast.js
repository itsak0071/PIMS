/* ============================================================
   Toast Notification System — toast.js
   Replaces every alert() and inline message box with
   accessible, styled toast notifications.
   Requires base.css for styling.
   ============================================================ */

(function () {
  "use strict";

  /* ── Internal config ── */
  const ICONS = {
    success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  };

  const TITLES = {
    success: "Success",
    error:   "Error",
    warning: "Warning",
    info:    "Info",
  };

  const DURATIONS = {
    success: 3500,
    error:   6000,
    warning: 5000,
    info:    4000,
  };

  /* ── Get or create container ── */
  function getContainer() {
    let c = document.getElementById("pims-toast-container");
    if (!c) {
      c = document.createElement("div");
      c.id = "pims-toast-container";
      c.className = "toast-container";
      c.setAttribute("aria-live", "polite");
      c.setAttribute("aria-atomic", "false");
      document.body.appendChild(c);
    }
    return c;
  }

  /* ── Remove a toast with slide-out animation ── */
  function removeToast(toast) {
    toast.style.animation = "slideOutRight 250ms ease forwards";
    setTimeout(() => toast.remove(), 240);
  }

  /* ── Core showToast function ── */
  window.showToast = function (message, type = "info", customDuration) {
    const container = getContainer();
    const duration  = customDuration || DURATIONS[type] || 4000;
    const id        = "toast-" + Date.now();

    const toast = document.createElement("div");
    toast.id = id;
    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", "alert");
    toast.innerHTML = `
      <div class="toast-icon toast-icon-${type}">${ICONS[type]}</div>
      <div class="toast-body">
        <div class="toast-title">${TITLES[type]}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Dismiss notification">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <div class="toast-progress" style="animation-duration:${duration}ms;"></div>
    `;

    toast.querySelector(".toast-close").addEventListener("click", () => removeToast(toast));
    container.appendChild(toast);

    // Auto-dismiss
    const timer = setTimeout(() => removeToast(toast), duration);

    // Pause progress on hover
    toast.addEventListener("mouseenter", () => {
      clearTimeout(timer);
      const progress = toast.querySelector(".toast-progress");
      if (progress) progress.style.animationPlayState = "paused";
    });

    return toast;
  };

  /* ── Convenience methods ── */
  window.toast = {
    success: (msg, dur) => showToast(msg, "success", dur),
    error:   (msg, dur) => showToast(msg, "error",   dur),
    warning: (msg, dur) => showToast(msg, "warning", dur),
    info:    (msg, dur) => showToast(msg, "info",    dur),
  };

  /* ── Legacy showMessage() bridge (used by existing student/company JS) ── */
  window.showMessage = function (text, type) {
    // Map old type names to toast types
    const typeMap = { success: "success", error: "error" };
    showToast(text, typeMap[type] || "info");
  };
})();
