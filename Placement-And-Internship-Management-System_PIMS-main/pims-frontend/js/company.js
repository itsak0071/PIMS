/* ============================================================
   Company Dashboard — company.js  v2.1
   Layout-optimised: dashboard fetches jobs + apps for preview.
   ALL fetch() calls and API endpoints preserved exactly.
   alert() → showToast().  confirm() → showConfirm().
   Requires: config.js  toast.js  confirm.js  (loaded before)
   ============================================================ */

/* ── Auth guard ── */
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "index.html";
}

/* ── Globals ── */
let currentRoute    = null;
let companyProfile  = null;

/* ════════════════════════════════════
   ON PAGE LOAD
   ════════════════════════════════════ */

window.onload = async function () {
  try {
    /* ══ UNCHANGED API CALL ══ */
    const response = await fetch(`${BASE_URL}/api/company/profile`, {
      headers: { Authorization: "Bearer " + token }
    });
    const data = await response.json();

    if (!data.profileCompleted) {
      window.location.href = "complete-company-profile.html";
      return;
    }

    companyProfile = data;
    updateSidebarCompany(data);
    handleRoute();

  } catch (error) {
    console.log("Error checking company profile:", error);
    handleRoute();
  }
};

function updateSidebarCompany(profile) {
  const nameEl   = document.getElementById("sidebarCompanyName");
  const avatarEl = document.getElementById("sidebarAvatar");
  if (nameEl && profile.companyName) nameEl.textContent = profile.companyName;
  if (avatarEl && profile.companyName) avatarEl.textContent = profile.companyName[0].toUpperCase();
}

/* ════════════════════════════════════
   ROUTING
   ════════════════════════════════════ */

function navigate(section) {
  closeSidebar();
  if (currentRoute === section) return;
  window.location.hash = section;
}

function handleRoute() {
  const section = window.location.hash.replace("#", "") || "dashboard";
  if (currentRoute === section) return;
  currentRoute = section;
  setActiveNav(section);
  if      (section === "dashboard")    loadDashboard();
  else if (section === "create")       showCreateJob();
  else if (section === "jobs")         loadMyJobs();
  else if (section === "applications") loadApplications();
}

window.addEventListener("hashchange", () => {
  currentRoute = null;
  handleRoute();
});

function setActiveNav(section) {
  document.querySelectorAll(".sidebar-item").forEach(el => el.classList.remove("active"));
  const navEl = document.getElementById("nav-" + section);
  if (navEl) navEl.classList.add("active");
  const titles = {
    dashboard: "Dashboard", create: "Post a Job",
    jobs: "My Jobs", applications: "Applications"
  };
  const titleEl = document.getElementById("pageTitle");
  if (titleEl) titleEl.textContent = titles[section] || "Dashboard";
}

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
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarOverlay").classList.remove("active");
  document.body.classList.remove("sidebar-open");
}

/* ════════════════════════════════════
   UTILITIES
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

function showLoader() { document.getElementById("loader").classList.add("active"); }
function hideLoader() { document.getElementById("loader").classList.remove("active"); }
function showMessage(text, type) {
  if (typeof showToast === "function") showToast(text, type || "info");
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
}

/* ════════════════════════════════════
   DASHBOARD  — 3 parallel API calls,
   compact one-screen layout
   ════════════════════════════════════ */

function loadDashboard() {
  const content = document.getElementById("content");
  showLoader();

  /* ══ THREE UNCHANGED API CALLS in parallel ══ */
  Promise.all([
    fetch(`${BASE_URL}/api/company/dashboard`,     { headers: { Authorization: "Bearer " + token } }).then(r => r.json()),
    fetch(`${BASE_URL}/api/company/jobs`,           { headers: { Authorization: "Bearer " + token } }).then(r => r.json()),
    fetch(`${BASE_URL}/api/company/applications`,   { headers: { Authorization: "Bearer " + token } }).then(r => r.json())
  ])
  .then(([data, jobs, apps]) => {
    const cName   = companyProfile?.companyName || "Company";
    const recent3Jobs = jobs.slice(0, 3);
    const recent3Apps = apps.slice(0, 3);

    content.innerHTML = `

      <!-- Welcome Banner — same blue gradient as student for contrast -->
      <div class="company-welcome">
        <div class="welcome-text">
          <h2>Welcome back, ${cName} 👋</h2>
          <p>Manage your job postings and review applicants from here.</p>
        </div>
        <div class="welcome-actions">
          <button class="btn btn-outline btn-sm" onclick="navigate('jobs')">My Jobs</button>
          <button class="btn btn-primary btn-sm" onclick="navigate('create')">+ Post a Job</button>
        </div>
      </div>

      <!-- Stats row (real data from dashboard API) -->
      <div class="stats-grid" style="margin-bottom:var(--sp-4);">
        <div class="stat-card">
          <div class="stat-card-icon stat-card-icon-blue">💼</div>
          <div class="stat-card-value">${data.totalJobs ?? 0}</div>
          <div class="stat-card-label">Total Jobs</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon stat-card-icon-green">✅</div>
          <div class="stat-card-value">${data.openJobs ?? 0}</div>
          <div class="stat-card-label">Open Jobs</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon stat-card-icon-red">🔒</div>
          <div class="stat-card-value">${data.closedJobs ?? 0}</div>
          <div class="stat-card-label">Closed Jobs</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon stat-card-icon-amber">📋</div>
          <div class="stat-card-value">${data.totalApplications ?? 0}</div>
          <div class="stat-card-label">Applications</div>
        </div>
      </div>

      <!-- Quick Actions — 3 col compact -->
      <div class="quick-actions-grid" style="margin-bottom:var(--sp-4);">
        <button class="quick-action-card" onclick="navigate('create')">
          <span class="qa-icon">➕</span>
          <span class="qa-label">Post a Job</span>
        </button>
        <button class="quick-action-card" onclick="navigate('jobs')">
          <span class="qa-icon">📋</span>
          <span class="qa-label">Manage Jobs</span>
        </button>
        <button class="quick-action-card" onclick="navigate('applications')">
          <span class="qa-icon">👥</span>
          <span class="qa-label">View Applicants</span>
        </button>
      </div>

      <!-- 2-col: Recent Jobs | Recent Applications -->
      <div class="company-dash-grid">

        <!-- Recent Jobs panel -->
        <div class="dash-panel">
          <div class="dash-panel-head">
            <h3>Recent Jobs</h3>
            ${recent3Jobs.length > 0
              ? `<button class="btn btn-ghost btn-xs" onclick="navigate('jobs')">View all →</button>`
              : ""}
          </div>
          <div class="dash-panel-body">
            ${recent3Jobs.length > 0
              ? recent3Jobs.map(job => `
                  <div class="mini-job-card" style="margin-bottom:var(--sp-2);">
                    <div class="mini-job-info">
                      <div class="mini-job-title">${job.title}</div>
                      <div class="mini-job-meta">
                        ${job.location ? job.location + " · " : ""}${fmtDate(job.deadline)}
                      </div>
                    </div>
                    <span class="badge ${job.status === "OPEN" ? "badge-green" : "badge-slate"}">${job.status}</span>
                  </div>`).join("")
              : `<div class="dash-panel-empty">
                   No jobs posted yet.
                   <br><button class="btn btn-primary btn-xs" style="margin-top:8px;"
                               onclick="navigate('create')">Post a Job</button>
                 </div>`
            }
          </div>
        </div>

        <!-- Recent Applications panel -->
        <div class="dash-panel">
          <div class="dash-panel-head">
            <h3>Recent Applications</h3>
            ${recent3Apps.length > 0
              ? `<button class="btn btn-ghost btn-xs" onclick="navigate('applications')">View all →</button>`
              : ""}
          </div>
          <div class="dash-panel-body">
            ${recent3Apps.length > 0
              ? recent3Apps.map(app => `
                  <div class="mini-job-card" style="margin-bottom:var(--sp-2);">
                    <div class="applicant-avatar" style="width:32px;height:32px;font-size:var(--text-xs);">
                      ${(app.studentName || "S")[0].toUpperCase()}
                    </div>
                    <div class="mini-job-info">
                      <div class="mini-job-title">${app.studentName}</div>
                      <div class="mini-job-meta">${app.jobTitle}</div>
                    </div>
                    <span class="badge ${app.status}">${app.status}</span>
                  </div>`).join("")
              : `<div class="dash-panel-empty">
                   No applications yet.
                 </div>`
            }
          </div>
        </div>

      </div><!-- /company-dash-grid -->

    `;
    hideLoader();
  })
  .catch(() => {
    showMessage("Failed to load dashboard.", "error");
    hideLoader();
  });
}

/* ════════════════════════════════════
   APPLICATIONS  (same API call)
   ════════════════════════════════════ */

function loadApplications() {
  const content = document.getElementById("content");
  showLoader();

  /* ══ UNCHANGED API CALL ══ */
  fetch(`${BASE_URL}/api/company/applications`, {
    headers: { Authorization: "Bearer " + token }
  })
  .then(res => res.json())
  .then(data => {
    if (!data.length) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <h3>No applications yet</h3>
          <p>Applications from students will appear here once you post jobs.</p>
          <button class="btn btn-primary" style="margin-top:16px;"
                  onclick="navigate('create')">Post a Job</button>
        </div>`;
      hideLoader();
      return;
    }

    content.innerHTML = `
      <div class="section-header" style="margin-bottom:var(--sp-4);">
        <h3>${data.length} Application${data.length !== 1 ? "s" : ""}</h3>
      </div>
      <div class="applicants-list">
        ${data.map(app => {
          const initial = (app.studentName || "S")[0].toUpperCase();
          return `
            <div class="applicant-card">
              <div class="applicant-avatar">${initial}</div>
              <div class="applicant-info">
                <div class="applicant-name">${app.studentName}</div>
                <div class="applicant-email">${app.studentEmail}</div>
                <div class="applicant-job">Applied for: <strong>${app.jobTitle}</strong></div>
              </div>
              <div style="flex-shrink:0;">
                <span class="badge ${app.status}">${app.status}</span>
              </div>
              <div class="applicant-actions">
                ${app.status === "APPLIED"
                  ? `<button class="btn btn-success btn-xs"
                             onclick="updateApplicationStatus(${app.applicationId}, 'SHORTLISTED')">
                       Shortlist
                     </button>
                     <button class="btn btn-danger btn-xs"
                             onclick="updateApplicationStatus(${app.applicationId}, 'REJECTED')">
                       Reject
                     </button>`
                  : ""}
              </div>
            </div>`;
        }).join("")}
      </div>`;
    hideLoader();
  })
  .catch(() => {
    showMessage("Failed to load applications.", "error");
    hideLoader();
  });
}

/* updateApplicationStatus — same API call */
function updateApplicationStatus(applicationId, status) {
  /* ══ UNCHANGED API CALL ══ */
  fetch(`${BASE_URL}/api/company/applications/${applicationId}?status=${status}`, {
    method: "PUT",
    headers: { Authorization: "Bearer " + token }
  })
  .then(res => res.text())
  .then(() => {
    showMessage(
      status === "SHORTLISTED" ? "Applicant shortlisted." : "Applicant rejected.",
      status === "SHORTLISTED" ? "success" : "info"
    );
    loadApplications();
  })
  .catch(() => showMessage("Failed to update application status.", "error"));
}

/* ════════════════════════════════════
   CREATE JOB — compact 2-col form
   (all input IDs unchanged)
   ════════════════════════════════════ */

function showCreateJob() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <div class="create-job-card">
      <h2>Post a New Job</h2>
      <p>Fields marked * are required. The form uses a two-column layout for efficiency.</p>

      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label" for="title">Job Title <span class="required">*</span></label>
          <input type="text" id="title" class="form-control"
                 placeholder="e.g. Software Engineer" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="jobType">Job Type <span class="required">*</span></label>
          <select id="jobType" class="form-control">
            <option value="INTERNSHIP">Internship</option>
            <option value="FULL_TIME">Full Time</option>
          </select>
        </div>
      </div>

      <div class="form-grid-2" style="margin-top:var(--sp-3);">
        <div class="form-group">
          <label class="form-label" for="location">Location <span class="required">*</span></label>
          <input type="text" id="location" class="form-control"
                 placeholder="e.g. Bengaluru, Remote" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="ctc">CTC Offered (LPA)</label>
          <input type="number" id="ctc" class="form-control"
                 placeholder="e.g. 12.5" step="0.1" min="0" />
        </div>
      </div>

      <div class="form-grid-2" style="margin-top:var(--sp-3);">
        <div class="form-group">
          <label class="form-label" for="positions">Positions Available</label>
          <input type="number" id="positions" class="form-control"
                 placeholder="e.g. 5" min="1" />
        </div>
        <div class="form-group">
          <label class="form-label" for="minCgpa">Minimum CGPA</label>
          <input type="number" id="minCgpa" class="form-control"
                 placeholder="e.g. 7.0" step="0.1" min="0" max="10" />
        </div>
      </div>

      <div class="form-grid-2" style="margin-top:var(--sp-3);">
        <div class="form-group">
          <label class="form-label" for="branches">Eligible Branches</label>
          <input type="text" id="branches" class="form-control"
                 placeholder="e.g. CSE,ISE,ECE (comma separated)" />
        </div>
        <div class="form-group">
          <label class="form-label" for="deadline">Deadline <span class="required">*</span></label>
          <input type="date" id="deadline" class="form-control" required />
        </div>
      </div>

      <div class="form-group" style="margin-top:var(--sp-3);">
        <label class="form-label" for="description">Job Description</label>
        <textarea id="description" class="form-control"
                  placeholder="Describe the role, responsibilities, and requirements…"
                  rows="4"></textarea>
      </div>

      <!-- Inline error -->
      <div id="createJobError" class="form-error" style="display:none;margin-top:var(--sp-3);"></div>

      <div class="create-job-actions">
        <button class="btn btn-primary" id="createJobBtn" onclick="createJob()">Post Job</button>
        <button class="btn btn-secondary" onclick="navigate('dashboard')">Cancel</button>
      </div>
    </div>`;
}

/* createJob — same API call, same body */
async function createJob() {
  const errorEl  = document.getElementById("createJobError");
  const createBtn = document.getElementById("createJobBtn");
  errorEl.style.display = "none";

  try {
    const title    = document.getElementById("title").value.trim();
    const jobType  = document.getElementById("jobType").value;
    const location = document.getElementById("location").value.trim();
    const deadline = document.getElementById("deadline").value;

    if (!title || !jobType || !location || !deadline) {
      errorEl.textContent = "Please fill all required fields (Title, Job Type, Location, Deadline).";
      errorEl.style.display = "flex";
      return;
    }

    const origTxt = createBtn.innerHTML;
    createBtn.disabled = true;
    createBtn.innerHTML = `<div class="spinner spinner-sm"
      style="border-color:rgba(255,255,255,0.3);border-top-color:#fff;"></div> Posting…`;

    /* ══ UNCHANGED API CALL ══ */
    const response = await fetch(`${BASE_URL}/api/company/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({
        title,
        description:        document.getElementById("description").value,
        jobType,
        location,
        ctcOffered:         parseFloat(document.getElementById("ctc").value)       || null,
        positionsAvailable: parseInt(document.getElementById("positions").value)    || null,
        minCgpa:            parseFloat(document.getElementById("minCgpa").value)    || null,
        eligibleBranches:   document.getElementById("branches").value,
        deadline
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    showMessage("Job posted successfully! 🎉", "success");
    navigate("jobs");

  } catch (error) {
    showMessage("Error: " + (error.message || "Failed to post job."), "error");
    const btn = document.getElementById("createJobBtn");
    if (btn) { btn.disabled = false; btn.innerHTML = "Post Job"; }
  }
}

/* ════════════════════════════════════
   MY JOBS — compact cards
   ════════════════════════════════════ */

function loadMyJobs() {
  const content = document.getElementById("content");
  showLoader();

  /* ══ UNCHANGED API CALL ══ */
  fetch(`${BASE_URL}/api/company/jobs`, {
    headers: { Authorization: "Bearer " + token }
  })
  .then(res => res.json())
  .then(data => {
    if (!data.length) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3>No jobs posted yet</h3>
          <p>Create your first job posting to start receiving applications.</p>
          <button class="btn btn-primary" style="margin-top:16px;"
                  onclick="navigate('create')">Post a Job</button>
        </div>`;
      hideLoader();
      return;
    }

    content.innerHTML = `
      <div class="section-header" style="margin-bottom:var(--sp-4);">
        <h3>${data.length} Job${data.length !== 1 ? "s" : ""} Posted</h3>
        <button class="btn btn-primary btn-sm" onclick="navigate('create')">+ Post a Job</button>
      </div>
      <div class="company-jobs-list">
        ${data.map(job => `
          <div class="company-job-card">
            <div class="job-card-body">
              <div class="job-card-header-row">
                <span class="job-card-title">${job.title}</span>
                <span class="badge ${job.status === "OPEN" ? "badge-green" : "badge-slate"}">${job.status}</span>
              </div>
              <div class="job-card-meta-row">
                ${job.location           ? `<span class="job-meta-tag">📍 ${job.location}</span>` : ""}
                ${job.ctcOffered         ? `<span class="job-meta-tag">💰 ${job.ctcOffered} LPA</span>` : ""}
                ${job.positionsAvailable ? `<span class="job-meta-tag">👥 ${job.positionsAvailable} pos.</span>` : ""}
                ${job.minCgpa            ? `<span class="job-meta-tag">🎯 Min ${job.minCgpa}</span>` : ""}
                ${job.eligibleBranches   ? `<span class="job-meta-tag">🎓 ${job.eligibleBranches}</span>` : ""}
                <span class="job-meta-tag">⏰ ${fmtDate(job.deadline)}</span>
              </div>
              <div class="job-card-actions">
                <button class="btn btn-ghost btn-xs" onclick="navigate('applications')"
                        title="View applicants for this job">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Applicants
                </button>
                ${job.status === "OPEN"
                  ? `<button class="btn btn-secondary btn-xs" onclick="closeJob(${job.id})">Close Job</button>`
                  : `<button class="btn btn-xs" disabled style="opacity:0.45;cursor:not-allowed;">Closed</button>`}
                <button class="btn btn-danger btn-xs" onclick="confirmDeleteJob(${job.id})">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          </div>`).join("")}
      </div>`;
    hideLoader();
  })
  .catch(() => {
    showMessage("Failed to load jobs.", "error");
    hideLoader();
  });
}

/* closeJob — same API call */
function closeJob(jobId) {
  if (typeof showConfirm === "function") {
    showConfirm({
      title: "Close this job?",
      message: "Students will no longer be able to apply. This cannot be undone.",
      confirmText: "Close Job", type: "warning",
      onConfirm: () => _doCloseJob(jobId)
    });
  } else {
    _doCloseJob(jobId);
  }
}

function _doCloseJob(jobId) {
  /* ══ UNCHANGED API CALL ══ */
  fetch(`${BASE_URL}/api/company/jobs/${jobId}/close`, {
    method: "PUT", headers: { Authorization: "Bearer " + token }
  })
  .then(res => res.text())
  .then(() => { showMessage("Job closed successfully.", "success"); loadMyJobs(); })
  .catch(() => showMessage("Failed to close job.", "error"));
}

/* deleteJob — same API call */
function confirmDeleteJob(jobId) {
  if (typeof showConfirm === "function") {
    showConfirm({
      title: "Delete this job?",
      message: "This will permanently remove the job posting and all associated data.",
      confirmText: "Delete", type: "danger",
      onConfirm: () => deleteJob(jobId)
    });
  } else {
    deleteJob(jobId);
  }
}

function deleteJob(jobId) {
  /* ══ UNCHANGED API CALL ══ */
  fetch(`${BASE_URL}/api/company/jobs/${jobId}`, {
    method: "DELETE", headers: { Authorization: "Bearer " + token }
  })
  .then(res => res.text())
  .then(() => { showMessage("Job deleted.", "success"); loadMyJobs(); })
  .catch(() => showMessage("Failed to delete job.", "error"));
}
