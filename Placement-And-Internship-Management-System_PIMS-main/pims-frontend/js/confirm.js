/* ============================================================
   Confirm Dialog System — confirm.js
   Replaces native browser confirm() with a modern modal.
   Requires base.css for styling.
   ============================================================ */

(function () {
  "use strict";

  const ICONS = {
    danger:  "🗑️",
    warning: "⚠️",
    info:    "ℹ️",
  };

  function ensureOverlay() {
    let overlay = document.getElementById("pims-confirm-overlay");
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = "pims-confirm-overlay";
    overlay.className = "modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML = `
      <div class="modal modal-sm">
        <div class="modal-body" style="padding: 32px 32px 24px; text-align:center;">
          <div class="confirm-icon" id="pims-confirm-icon">
            <span id="pims-confirm-icon-inner" style="font-size:26px;"></span>
          </div>
          <h3 id="pims-confirm-title" style="margin: 12px 0 8px; font-size:1.125rem;"></h3>
          <p id="pims-confirm-message" style="font-size:0.875rem; color:var(--text-muted); line-height:1.6;"></p>
        </div>
        <div class="modal-footer" style="justify-content:center; gap:12px; padding: 16px 24px;">
          <button id="pims-confirm-cancel" class="btn btn-secondary" style="min-width:90px;"></button>
          <button id="pims-confirm-ok"     class="btn btn-danger"    style="min-width:90px;"></button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  window.showConfirm = function ({
    title       = "Are you sure?",
    message     = "",
    confirmText = "Confirm",
    cancelText  = "Cancel",
    type        = "danger",
    onConfirm   = null,
    onCancel    = null,
  } = {}) {
    const overlay  = ensureOverlay();
    const icon     = document.getElementById("pims-confirm-icon");
    const iconText = document.getElementById("pims-confirm-icon-inner");
    const titleEl  = document.getElementById("pims-confirm-title");
    const msgEl    = document.getElementById("pims-confirm-message");
    const okBtn    = document.getElementById("pims-confirm-ok");
    const cancelBtn = document.getElementById("pims-confirm-cancel");

    // Set icon & button color by type
    icon.className = `confirm-icon confirm-icon-${type}`;
    iconText.textContent = ICONS[type] || ICONS.info;

    if (type === "danger") {
      okBtn.className = "btn btn-danger";
    } else if (type === "warning") {
      okBtn.className = "btn btn-primary";
    } else {
      okBtn.className = "btn btn-primary";
    }

    titleEl.textContent  = title;
    msgEl.textContent    = message;
    okBtn.textContent    = confirmText;
    cancelBtn.textContent = cancelText;

    overlay.classList.add("active");
    okBtn.focus();

    // ── Event handlers (replaced each call to avoid stacking) ──
    function close() {
      overlay.classList.remove("active");
      overlay.removeEventListener("click", backdropClose);
      document.removeEventListener("keydown", escClose);
    }

    function backdropClose(e) {
      if (e.target === overlay) {
        close();
        if (onCancel) onCancel();
      }
    }

    function escClose(e) {
      if (e.key === "Escape") {
        close();
        if (onCancel) onCancel();
      }
    }

    okBtn.onclick = () => {
      close();
      if (onConfirm) onConfirm();
    };

    cancelBtn.onclick = () => {
      close();
      if (onCancel) onCancel();
    };

    overlay.addEventListener("click", backdropClose);
    document.addEventListener("keydown", escClose);
  };
})();
