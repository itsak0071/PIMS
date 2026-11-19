/* ============================================================
   Admin Panel — admin.js  v2.0
   ALL fetch() calls and API endpoints preserved exactly.
   alert() and location.reload() replaced with modern UX.
   Requires: config.js  toast.js  confirm.js  (loaded before)
   ============================================================ */

/* ── Auth guard ── */
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "index.html";
}

/* ── State ── */
let allCompanies  = [];
let activeTab     = "all";
let searchQuery   = "";

/* ════════════════════════════════════
   BOOTSTRAP: Load companies on start
   ════════════════════════════════════ */

window.addEventListener("DOMContentLoaded", function () {
  loadCompanies();
});

/* ════════════════════════════════════
   SIDEBAR MOBILE
   ════════════════════════════════════ */

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const isOpen  = sidebar.classList.contains("open");
  sidebar.classList.toggle("open", !isOpen);
  overlay.classList.toggle("active", !isOpen);
  document.body.classList.toggle("sidebar-open", !isOpen);
}

function closeSidebar() {
  document.getElementById("sidebar")?.classList.remove("open");
  document.getElementById("sidebarOverlay")?.classList.remove("active");
  document.body.classList.remove("sidebar-open");
}

/* ════════════════════════════════════
   LOAD COMPANIES  (same API call)
   ════════════════════════════════════ */

function loadCompanies() {
  /* ══ UNCHANGED API CALL ══ */
  fetch(`${BASE_URL}/api/admin/companies`, {
    headers: { "Authorization": "Bearer " + token }
  })
  .then(res => res.json())
  .then(data => {
    allCompanies = data;
    updateTabCounts();
    renderCompanyCards();
  })
  .catch(() => {
    showToast("Failed to load companies.", "error");
    document.getElementById("companyCards").innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Failed to load</h3>
        <p>Could not connect to the server. Please refresh and try again.</p>
      </div>`;
  });
}

/* ════════════════════════════════════
   TAB SWITCHING
   ════════════════════════════════════ */

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".admin-tab").forEach(el => {
    el.classList.remove("active");
    el.setAttribute("aria-selected", "false");
  });
  const tabEl = document.getElementById("tab-" + tab);
  if (tabEl) { tabEl.classList.add("active"); tabEl.setAttribute("aria-selected", "true"); }
  renderCompanyCards();
}

/* ════════════════════════════════════
   SEARCH FILTER
   ════════════════════════════════════ */

function filterCompanies(query) {
  searchQuery = query.toLowerCase();
  renderCompanyCards();
}

/* ════════════════════════════════════
   COUNT BADGES
   ════════════════════════════════════ */

function updateTabCounts() {
  const pending  = allCompanies.filter(c => !c.approved).length;
  const approved = allCompanies.filter(c =>  c.approved).length;

  const allEl  = document.getElementById("count-all");
  const penEl  = document.getElementById("count-pending");
  const appEl  = document.getElementById("count-approved");

  if (allEl)  allEl.textContent  = allCompanies.length;
  if (penEl)  penEl.textContent  = pending;
  if (appEl)  appEl.textContent  = approved;
}

/* ════════════════════════════════════
   RENDER CARDS
   ════════════════════════════════════ */

function renderCompanyCards() {
  const container = document.getElementById("companyCards");

  /* Filter by tab */
  let visible = allCompanies.filter(c => {
    if (activeTab === "pending")  return !c.approved;
    if (activeTab === "approved") return  c.approved;
    return true;
  });

  /* Filter by search query */
  if (searchQuery) {
    visible = visible.filter(c =>
      (c.companyName || "").toLowerCase().includes(searchQuery)
    );
  }

  if (!visible.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${activeTab === "pending" ? "⏳" : "🏢"}</div>
        <h3>${searchQuery
          ? "No companies match your search"
          : activeTab === "pending"
            ? "No pending approvals"
            : activeTab === "approved"
              ? "No approved companies yet"
              : "No companies registered yet"
        }</h3>
        <p>${searchQuery
          ? "Try a different search term."
          : "Companies appear here after they register on the platform."
        }</p>
      </div>`;
    return;
  }

  container.innerHTML = visible.map(company => {
    const initial    = (company.companyName || "C")[0].toUpperCase();
    const isApproved = company.approved;
    const cardClass  = isApproved ? "is-approved" : "is-pending";

    return `
      <div class="company-approval-card ${cardClass}"
           role="listitem" id="company-card-${company.id}">

        <div class="company-card-logo">${initial}</div>

        <div class="company-card-info">
          <div class="company-card-name">${company.companyName || "—"}</div>
          <div class="company-card-id">ID #${company.id}</div>
        </div>

        <div class="company-card-status">
          ${isApproved
            ? `<span class="badge badge-green">Approved</span>`
            : `<span class="badge badge-amber">Pending</span>`}
        </div>

        <div class="company-card-actions">
          ${isApproved
            ? `<button class="btn btn-sm"
                       style="opacity:0.5;cursor:not-allowed;background:var(--success-50);
                              color:var(--success-700);border:1px solid var(--success-200);"
                       disabled>
                 ✓ Approved
               </button>`
            : `<button class="btn btn-success btn-sm"
                       onclick="approve(${company.id})"
                       aria-label="Approve ${company.companyName}">
                 Approve
               </button>
               <button class="btn btn-danger btn-sm"
                       onclick="reject(${company.id})"
                       aria-label="Reject ${company.companyName}">
                 Reject
               </button>`}
        </div>
      </div>`;
  }).join("");
}

/* ════════════════════════════════════
   APPROVE  (same API call)
   ════════════════════════════════════ */

function approve(id) {
  const company = allCompanies.find(c => c.id === id);
  const name    = company?.companyName || "this company";

  if (typeof showConfirm === "function") {
    showConfirm({
      title:       "Approve company?",
      message:     `${name} will be able to post jobs and view student applications.`,
      confirmText: "Approve",
      type:        "success",
      onConfirm:   () => _doApprove(id)
    });
  } else {
    _doApprove(id);
  }
}

function _doApprove(id) {
  /* ══ UNCHANGED API CALL ══ */
  fetch(`${BASE_URL}/api/admin/company/${id}/approve`, {
    method:  "PUT",
    headers: { "Authorization": "Bearer " + token }
  })
  .then(res => res.text())
  .then(() => {
    if (typeof showToast === "function") {
      showToast("Company approved successfully ✅", "success");
    }
    /* Update local state without full page reload */
    const idx = allCompanies.findIndex(c => c.id === id);
    if (idx !== -1) allCompanies[idx].approved = true;
    updateTabCounts();
    renderCompanyCards();
  })
  .catch(() => {
    if (typeof showToast === "function") showToast("Failed to approve company.", "error");
  });
}

/* ════════════════════════════════════
   REJECT  (same API call)
   ════════════════════════════════════ */

function reject(id) {
  const company = allCompanies.find(c => c.id === id);
  const name    = company?.companyName || "this company";

  if (typeof showConfirm === "function") {
    showConfirm({
      title:       "Reject company?",
      message:     `${name} will not be able to access the platform.`,
      confirmText: "Reject",
      type:        "danger",
      onConfirm:   () => _doReject(id)
    });
  } else {
    _doReject(id);
  }
}

function _doReject(id) {
  /* ══ UNCHANGED API CALL ══ */
  fetch(`${BASE_URL}/api/admin/company/${id}/reject`, {
    method:  "PUT",
    headers: { "Authorization": "Bearer " + token }
  })
  .then(() => {
    if (typeof showToast === "function") {
      showToast("Company rejected.", "info");
    }
    /* Remove from local state without page reload */
    allCompanies = allCompanies.filter(c => c.id !== id);
    updateTabCounts();
    renderCompanyCards();
  })
  .catch(() => {
    if (typeof showToast === "function") showToast("Failed to reject company.", "error");
  });
}

/* ════════════════════════════════════
   LOGOUT
   ════════════════════════════════════ */

function logout() {
  if (typeof showConfirm === "function") {
    showConfirm({
      title: "Sign out?", message: "You'll be returned to the login page.",
      confirmText: "Sign Out", cancelText: "Stay", type: "warning",
      onConfirm: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.location.href = "index.html";
      }
    });
  } else {
    localStorage.removeItem("token");
    window.location.href = "index.html";
  }
}