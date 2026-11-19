/* ============================================================
   Student Dashboard — student.js  v2.2  (Final Polish Pass)
   CHANGES:
   - Profile Status moved to compact horizontal bar below Welcome Banner
   - Recent Applications now uses full-width layout
   - Recommended Jobs still shows at bottom
   - All API calls unchanged, all DOM IDs unchanged
   ============================================================ */

/* ── Auth guard ── */
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "index.html";
}

/* ── Globals ── */
let cachedJobs         = [];
let currentRoute       = null;
let pendingMessage     = null;
let studentProfile     = null;

/* ════════════════════════════════════════════
   ON PAGE LOAD
   ════════════════════════════════════════════ */

window.onload = async function () {
  await checkProfileStatus();
  handleRoute();
};

/* ════════════════════════════════════════════
   PROFILE STATUS CHECK
   ════════════════════════════════════════════ */

async function checkProfileStatus() {
  try {
    const res = await fetch(`${BASE_URL}/api/student/profile`, {
      headers: { Authorization: "Bearer " + token }
    });
    if (!res.ok) return;
    const data    = await res.json();
    studentProfile = data;
    updateSidebarUser(data);
    if (!data.branch || !data.fullName) {
      window.location.href = "complete-student-profile.html";
    }
  } catch (err) {
    console.log("Profile check failed:", err.message);
  }
}

function updateSidebarUser(profile) {
  const nameEl   = document.getElementById("sidebarUserName");
  const avatarEl = document.getElementById("sidebarAvatar");
  if (nameEl && profile.fullName) nameEl.textContent = profile.fullName;
  if (avatarEl && profile.fullName) {
    const parts = profile.fullName.trim().split(/\s+/).filter(Boolean);
    avatarEl.textContent = parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }
}

/* ════════════════════════════════════════════
   ROUTING
   ════════════════════════════════════════════ */

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
  else if (section === "jobs")         loadJobs();
  else if (section === "applications") loadApplications();
  else if (section === "profile")      loadProfile();
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
    dashboard: "Dashboard", jobs: "Browse Jobs",
    applications: "My Applications", profile: "My Profile"
  };
  const titleEl = document.getElementById("pageTitle");
  if (titleEl) titleEl.textContent = titles[section] || "Dashboard";
}

/* ════════════════════════════════════════════
   SIDEBAR MOBILE
   ════════════════════════════════════════════ */

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

/* ════════════════════════════════════════════
   UTILITIES
   ════════════════════════════════════════════ */

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

function showLoader() {
  document.getElementById("loader").classList.add("active");
}
function hideLoader() {
  document.getElementById("loader").classList.remove("active");
}

function showMessage(text, type) {
  if (typeof showToast === "function") showToast(text, type || "info");
}

function clearMainSections() {
  document.getElementById("content").innerHTML = "";
  document.getElementById("profile-section").classList.add("hidden");
  document.getElementById("jobControls").classList.add("hidden");
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
}

/* ════════════════════════════════════════════
   DASHBOARD  — Profile Status as horizontal bar
   below Welcome Banner (all real API data)
   ════════════════════════════════════════════ */

async function loadDashboard() {
  clearMainSections();
  showLoader();

  try {
    /* ══ UNCHANGED API CALLS ══ */
    const [appsRes, jobsRes] = await Promise.all([
      fetch(`${BASE_URL}/api/student/applications`, { headers: { Authorization: "Bearer " + token } }),
      fetch(`${BASE_URL}/api/student/jobs`,         { headers: { Authorization: "Bearer " + token } })
    ]);

    const applications = await appsRes.json();
    const jobs         = await jobsRes.json();
    cachedJobs         = jobs;

    const shortlisted = applications.filter(a => a.status === "SHORTLISTED").length;
    const rejected    = applications.filter(a => a.status === "REJECTED").length;
    const name        = studentProfile?.fullName || "Student";
    const recent4     = applications.slice(0, 4);
    const recommend3  = jobs.filter(j => !j.alreadyApplied).slice(0, 3);

    /* Profile completeness */
    const p           = studentProfile || {};
    const hasResume   = !!p.resumeUrl;
    const fields      = [p.fullName, p.usn, p.branch, p.cgpa, p.graduationYear, p.location];
    const filled      = fields.filter(Boolean).length;
    const completion  = Math.round((filled / fields.length) * 100);

    document.getElementById("content").innerHTML = `

      <!-- Welcome Banner -->
      <div class="dashboard-welcome">
        <div class="welcome-text">
          <h2>Welcome back, ${name} 👋</h2>
          <p>Here is your placement activity at a glance.</p>
        </div>
        <div class="welcome-actions">
          <button class="btn btn-outline btn-sm" onclick="navigate('profile')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            My Profile
          </button>
          <button class="btn btn-primary btn-sm" onclick="navigate('jobs')">Browse Jobs →</button>
        </div>
      </div>

      <!-- Profile Status Bar — horizontal, compact, directly below banner -->
      <div class="profile-status-bar">
        <div class="psb-item ${completion === 100 ? "psb-success" : "psb-warning"}">
          <span class="psb-icon">${completion === 100 ? "✅" : "⚠️"}</span>
          <div class="psb-text">
            <span class="psb-label">Profile ${completion}% complete</span>
            ${completion < 100
              ? `<button class="psb-action" onclick="navigate('profile')">Complete →</button>`
              : `<span class="psb-ok">All fields filled</span>`}
          </div>
        </div>
        <div class="psb-divider"></div>
        <div class="psb-item ${hasResume ? "psb-success" : "psb-warning"}">
          <span class="psb-icon">${hasResume ? "📄" : "📭"}</span>
          <div class="psb-text">
            <span class="psb-label">Resume</span>
            ${hasResume
              ? `<span class="psb-ok">Uploaded</span>`
              : `<button class="psb-action" onclick="navigate('profile')">Upload →</button>`}
          </div>
        </div>
        <div class="psb-divider"></div>
        <div class="psb-item psb-info">
          <span class="psb-icon">📊</span>
          <div class="psb-text">
            <span class="psb-label">Applications</span>
            <span class="psb-ok">${applications.length} sent · ${shortlisted} shortlisted</span>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid" style="margin-bottom:var(--sp-4);">
        <div class="stat-card">
          <div class="stat-card-icon stat-card-icon-blue">📋</div>
          <div class="stat-card-value">${applications.length}</div>
          <div class="stat-card-label">Applications</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon stat-card-icon-green">⭐</div>
          <div class="stat-card-value">${shortlisted}</div>
          <div class="stat-card-label">Shortlisted</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon stat-card-icon-amber">💼</div>
          <div class="stat-card-value">${jobs.length}</div>
          <div class="stat-card-label">Jobs Available</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon ${hasResume ? "stat-card-icon-green" : "stat-card-icon-red"}">
            ${hasResume ? "📄" : "📭"}
          </div>
          <div class="stat-card-value" style="font-size:var(--text-lg);">${hasResume ? "Yes" : "No"}</div>
          <div class="stat-card-label">Resume</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions-grid" style="margin-bottom:var(--sp-4);">
        <button class="quick-action-card" onclick="navigate('jobs')">
          <span class="qa-icon">🔍</span><span class="qa-label">Browse Jobs</span>
        </button>
        <button class="quick-action-card" onclick="navigate('applications')">
          <span class="qa-icon">📄</span><span class="qa-label">My Applications</span>
        </button>
        <button class="quick-action-card" onclick="navigate('profile')">
          <span class="qa-icon">👤</span><span class="qa-label">Update Profile</span>
        </button>
        <button class="quick-action-card" onclick="navigate('profile')">
          <span class="qa-icon">📤</span><span class="qa-label">Upload Resume</span>
        </button>
      </div>

      <!-- Recent Applications (full width) -->
      <div>
        <div class="section-header">
          <h3>Recent Applications</h3>
          ${recent4.length > 0
            ? `<button class="btn btn-ghost btn-sm" onclick="navigate('applications')">View all →</button>`
            : ""}
        </div>
        ${recent4.length > 0
          ? `<div class="applications-list">
               ${recent4.map(app => `
                 <div class="application-card">
                   <div class="app-card-logo">${(app.companyName || "C")[0].toUpperCase()}</div>
                   <div class="app-card-info">
                     <span class="app-card-title">${app.jobTitle}</span>
                     <span class="app-card-company">${app.companyName}</span>
                     <span class="app-card-date">Applied ${fmtDate(app.appliedDate)}</span>
                   </div>
                   <div class="app-card-status">
                     <span class="badge ${app.status}">${app.status}</span>
                   </div>
                 </div>`).join("")}
             </div>`
          : `<div class="empty-state" style="padding:28px 16px;">
               <div class="empty-state-icon" style="font-size:32px;">📭</div>
               <h3>No applications yet</h3>
               <p>Browse jobs and start applying to track your progress here.</p>
               <button class="btn btn-primary btn-sm" style="margin-top:12px;"
                       onclick="navigate('jobs')">Browse Jobs</button>
             </div>`}
      </div>

      <!-- Recommended Jobs -->
      ${recommend3.length > 0 ? `
        <div style="margin-top:var(--sp-5);">
          <div class="section-header">
            <h3>Jobs You Haven't Applied To</h3>
            <button class="btn btn-ghost btn-sm" onclick="navigate('jobs')">View all →</button>
          </div>
          <div class="recommended-grid">
            ${recommend3.map(job => buildJobCard(job)).join("")}
          </div>
        </div>
      ` : ""}

    `;

  } catch {
    showMessage("Failed to load dashboard.", "error");
  }

  hideLoader();
}

/* ════════════════════════════════════════════
   JOBS
   ════════════════════════════════════════════ */

async function loadJobs() {
  clearMainSections();
  showLoader();
  document.getElementById("jobControls").classList.remove("hidden");
  try {
    const res  = await fetch(`${BASE_URL}/api/student/jobs`, { headers: { Authorization: "Bearer " + token } });
    cachedJobs = await res.json();
    renderJobs(cachedJobs);
  } catch {
    showMessage("Failed to load jobs.", "error");
  }
  hideLoader();
}

function renderJobs(jobs) {
  const content = document.getElementById("content");
  if (!jobs.length) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>No jobs found</h3>
        <p>Try adjusting your filters or check back later for new opportunities.</p>
        <button class="btn btn-secondary" style="margin-top:12px;" onclick="clearFilters()">
          Clear Filters
        </button>
      </div>`;
    return;
  }
  content.innerHTML = `
    <div class="section-header" style="margin-bottom:var(--sp-4);">
      <h3>${jobs.length} Job${jobs.length !== 1 ? "s" : ""} Available</h3>
    </div>
    <div class="jobs-list">${jobs.map(job => buildJobCard(job)).join("")}</div>`;
}

function buildJobCard(job) {
  const initial   = (job.companyName || "C")[0].toUpperCase();
  const deadline  = fmtDate(job.deadline);
  const isExpired = job.deadline && new Date(job.deadline) < new Date();
  return `
    <div class="job-card">
      <div class="job-card-top">
        <div class="company-logo-badge">${initial}</div>
        <div class="job-titles">
          <div class="job-title-text">${job.title}</div>
          <div class="job-company-text">${job.companyName}</div>
        </div>
        ${isExpired
          ? `<span class="badge badge-slate">Closed</span>`
          : `<span class="badge badge-green">Open</span>`}
      </div>
      <div class="job-card-meta">
        ${job.location   ? `<span class="job-meta-pill"><span>📍</span>${job.location}</span>` : ""}
        ${job.ctcOffered ? `<span class="job-meta-pill"><span>💰</span>${job.ctcOffered} LPA</span>` : ""}
        ${job.minCgpa    ? `<span class="job-meta-pill"><span>🎯</span>Min ${job.minCgpa}</span>` : ""}
        <span class="job-meta-pill"><span>⏰</span>${deadline}</span>
      </div>
      <div class="job-card-footer">
        <button class="btn btn-secondary btn-sm" onclick="viewJob(${job.id})">View Details</button>
        ${job.alreadyApplied
          ? `<span class="btn-applied">✓ Applied</span>`
          : `<button class="btn btn-primary btn-sm" onclick="applyJob(${job.id})">Apply Now</button>`}
      </div>
    </div>`;
}

function viewJob(id) {
  const job = cachedJobs.find(j => j.id === id);
  if (!job) return;
  const modal   = document.getElementById("jobModal");
  const body    = document.getElementById("modalBody");
  const titleEl = document.getElementById("jobModalTitle");
  if (titleEl) titleEl.textContent = job.title;
  body.innerHTML = `
    <div class="job-detail-hero">
      <div class="company-logo-badge company-logo-badge-lg">${(job.companyName || "C")[0].toUpperCase()}</div>
      <div>
        <h3>${job.title}</h3>
        <p>${job.companyName}</p>
      </div>
    </div>
    <div class="job-detail-grid">
      <div class="job-detail-cell">
        <span class="cell-label">Location</span>
        <span class="cell-value">${job.location || "Not specified"}</span>
      </div>
      <div class="job-detail-cell">
        <span class="cell-label">CTC Offered</span>
        <span class="cell-value">${job.ctcOffered ? job.ctcOffered + " LPA" : "Not disclosed"}</span>
      </div>
      <div class="job-detail-cell">
        <span class="cell-label">Minimum CGPA</span>
        <span class="cell-value">${job.minCgpa || "No requirement"}</span>
      </div>
      <div class="job-detail-cell">
        <span class="cell-label">Deadline</span>
        <span class="cell-value">${fmtDate(job.deadline)}</span>
      </div>
      ${job.eligibleBranches ? `
        <div class="job-detail-cell" style="grid-column:1/-1;">
          <span class="cell-label">Eligible Branches</span>
          <span class="cell-value">${job.eligibleBranches}</span>
        </div>` : ""}
    </div>
    ${job.description ? `
      <p class="cell-label" style="margin-bottom:8px;">Job Description</p>
      <p class="job-detail-description">${job.description}</p>` : ""}
    <div class="job-detail-actions">
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
      ${job.alreadyApplied
        ? `<span class="btn-applied" style="padding:9px 16px;">✓ Already Applied</span>`
        : `<button class="btn btn-primary" onclick="applyJob(${job.id}); closeModal();">Apply Now</button>`}
    </div>`;
  modal.classList.add("active");
  document.body.classList.add("modal-open");
}

function closeModal() {
  document.getElementById("jobModal").classList.remove("active");
  document.body.classList.remove("modal-open");
}

async function applyJob(jobId) {
  try {
    const res = await fetch(`${BASE_URL}/api/student/apply/${jobId}`, {
      method: "POST", headers: { Authorization: "Bearer " + token }
    });
    if (!res.ok) throw new Error();
    showMessage("Applied successfully! 🎉", "success");
    loadJobs();
  } catch {
    showMessage("Application failed. Please try again.", "error");
  }
}

/* ════════════════════════════════════════════
   FILTERS
   ════════════════════════════════════════════ */

function applyFilters() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const branch = document.getElementById("branchFilter").value;
  const cgpa   = document.getElementById("cgpaFilter").value;
  const filtered = cachedJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(search);
    const matchesBranch = branch ? job.eligibleBranches?.includes(branch) : true;
    const matchesCgpa   = cgpa   ? job.minimumCgpa <= parseFloat(cgpa)    : true;
    return matchesSearch && matchesBranch && matchesCgpa;
  });
  renderJobs(filtered);
}

function clearFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("branchFilter").value = "";
  document.getElementById("cgpaFilter").value   = "";
  renderJobs(cachedJobs);
}

/* ════════════════════════════════════════════
   APPLICATIONS
   ════════════════════════════════════════════ */

async function loadApplications() {
  clearMainSections();
  showLoader();
  try {
    const res          = await fetch(`${BASE_URL}/api/student/applications`, { headers: { Authorization: "Bearer " + token } });
    const applications = await res.json();
    const content      = document.getElementById("content");
    if (!applications.length) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <h3>No applications yet</h3>
          <p>You haven't applied to any positions yet. Start exploring available opportunities!</p>
          <button class="btn btn-primary" style="margin-top:16px;"
                  onclick="navigate('jobs')">Browse Available Jobs</button>
        </div>`;
    } else {
      content.innerHTML = `
        <div class="section-header" style="margin-bottom:var(--sp-4);">
          <h3>${applications.length} Application${applications.length !== 1 ? "s" : ""}</h3>
        </div>
        <div class="applications-list">
          ${applications.map(app => `
            <div class="application-card">
              <div class="app-card-logo">${(app.companyName || "C")[0].toUpperCase()}</div>
              <div class="app-card-info">
                <span class="app-card-title">${app.jobTitle}</span>
                <span class="app-card-company">${app.companyName}</span>
                <span class="app-card-date">Applied ${fmtDate(app.appliedDate)}</span>
              </div>
              <div class="app-card-status">
                <span class="badge ${app.status}">${app.status}</span>
              </div>
            </div>`).join("")}
        </div>`;
    }
  } catch {
    showMessage("Failed to load applications.", "error");
  }
  hideLoader();
}

/* ════════════════════════════════════════════
   PROFILE
   ════════════════════════════════════════════ */

let currentProfileData = null;

async function loadProfile() {
  clearMainSections();
  showLoader();
  try {
    const res = await fetch(`${BASE_URL}/api/student/profile`, { headers: { Authorization: "Bearer " + token } });
    if (!res.ok) throw new Error();
    const data         = await res.json();
    currentProfileData = data;
    studentProfile     = data;
    updateSidebarUser(data);
    const section  = document.getElementById("profile-section");
    section.classList.remove("hidden");
    const parts    = (data.fullName || "S").trim().split(/\s+/).filter(Boolean);
    const initials = (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0][0]).toUpperCase();
    section.innerHTML = `
      <div class="profile-hero-card">
        <div class="profile-hero-inner">
          <div class="profile-avatar-lg">${initials}</div>
          <div class="profile-hero-info">
            <h2>${data.fullName}</h2>
            <p>${[data.branch, data.graduationYear ? "Class of " + data.graduationYear : ""].filter(Boolean).join(" · ")}</p>
            <p>${data.email || ""}</p>
          </div>
          <button class="btn btn-outline" onclick="openEditProfile()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit Profile
          </button>
        </div>
      </div>
      <div class="profile-content-grid">
        <div>
          <div class="profile-info-card">
            <div class="profile-card-head"><span class="profile-card-icon">📋</span><h3>Basic Information</h3></div>
            <div class="profile-fields">
              <div class="profile-field-row"><span class="field-label">Full Name</span><span class="field-value">${data.fullName || "—"}</span></div>
              <div class="profile-field-row"><span class="field-label">Email</span><span class="field-value">${data.email || "—"}</span></div>
              <div class="profile-field-row"><span class="field-label">USN</span><span class="field-value">${data.usn || "Not added"}</span></div>
              <div class="profile-field-row"><span class="field-label">Branch</span><span class="field-value">${data.branch || "—"}</span></div>
              <div class="profile-field-row"><span class="field-label">CGPA</span><span class="field-value">${data.cgpa || "Not added"}</span></div>
              <div class="profile-field-row"><span class="field-label">Grad Year</span><span class="field-value">${data.graduationYear || "Not added"}</span></div>
              <div class="profile-field-row"><span class="field-label">Location</span><span class="field-value">${data.location || "Not added"}</span></div>
            </div>
          </div>
        </div>
        <div>
          <div class="profile-info-card">
            <div class="profile-card-head"><span class="profile-card-icon">🛠</span><h3>Skills</h3></div>
            <div style="padding:var(--sp-4) var(--sp-5);">
              ${data.skills
                ? `<div class="skills-wrap">${data.skills.split(",").map(s => `<span class="skill-tag">${s.trim()}</span>`).join("")}</div>`
                : `<p style="font-size:var(--text-sm);color:var(--text-muted);font-style:italic;">
                     No skills added. <button class="btn btn-ghost btn-sm" onclick="openEditProfile()">Add now</button></p>`}
            </div>
          </div>
          ${data.careerObjective ? `
            <div class="profile-info-card">
              <div class="profile-card-head"><span class="profile-card-icon">🎯</span><h3>Career Objective</h3></div>
              <div style="padding:var(--sp-4) var(--sp-5);">
                <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:var(--leading-relaxed);">${data.careerObjective}</p>
              </div>
            </div>` : ""}
          <div class="profile-info-card">
            <div class="profile-card-head"><span class="profile-card-icon">📄</span><h3>Resume</h3></div>
            <div style="padding:var(--sp-4) var(--sp-5);">
              ${data.resumeUrl
                ? `<div class="resume-present-card">
                     <span class="resume-file-icon">📑</span>
                     <div class="resume-info">
                       <span class="resume-file-name">resume.pdf</span>
                       <span class="resume-file-status">Uploaded &amp; ready</span>
                     </div>
                     <div style="display:flex;gap:8px;flex-wrap:wrap;">
                       <a class="btn btn-outline btn-sm" href="${BASE_URL}/${data.resumeUrl}" target="_blank" rel="noopener">View</a>
                       <button class="btn btn-danger btn-sm" onclick="deleteResume()">Delete</button>
                     </div>
                   </div>`
                : `<div class="resume-empty-state">
                     <div class="resume-empty-icon">📭</div>
                     <p style="font-size:var(--text-sm);">No resume uploaded yet.</p>
                     <p style="font-size:var(--text-xs);color:var(--text-muted);">PDF only · Max 5 MB</p>
                   </div>`}
              <div class="resume-actions-row">
                <button class="btn btn-secondary btn-sm" onclick="triggerResumeUpload()">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                  </svg>
                  ${data.resumeUrl ? "Replace Resume" : "Upload Resume"}
                </button>
              </div>
              <input type="file" id="resumeInput" accept="application/pdf" style="display:none" onchange="uploadResume()" />
            </div>
          </div>
        </div>
      </div>`;
  } catch {
    showMessage("Failed to load profile.", "error");
  }
  hideLoader();
  if (pendingMessage) { showMessage(pendingMessage.text, pendingMessage.type); pendingMessage = null; }
}

/* ════════════════════════════════════════════
   EDIT PROFILE  (unchanged PUT API)
   ════════════════════════════════════════════ */

function openEditProfile() {
  const modal = document.getElementById("editProfileModal");
  const data  = currentProfileData;
  document.getElementById("editUsn").value       = data.usn              || "";
  document.getElementById("editFullName").value  = data.fullName         || "";
  document.getElementById("editBranch").value    = data.branch           || "";
  document.getElementById("editCgpa").value      = data.cgpa             || "";
  document.getElementById("editGradYear").value  = data.graduationYear   || "";
  document.getElementById("editLocation").value  = data.location         || "";
  document.getElementById("editObjective").value = data.careerObjective  || "";
  document.getElementById("editSkills").value    = data.skills           || "";
  modal.classList.add("active");
  document.body.classList.add("modal-open");
}

function closeEditModal() {
  document.getElementById("editProfileModal").classList.remove("active");
  document.body.classList.remove("modal-open");
}

document.getElementById("editProfileForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const saveBtn = document.getElementById("saveProfileBtn");
  const origTxt = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.innerHTML = `<div class="spinner spinner-sm" style="border-color:rgba(255,255,255,0.3);border-top-color:#fff;"></div> Saving…`;
  const updatedData = {
    usn:            document.getElementById("editUsn").value,
    fullName:       document.getElementById("editFullName").value,
    branch:         document.getElementById("editBranch").value,
    cgpa:           document.getElementById("editCgpa").value,
    graduationYear: document.getElementById("editGradYear").value,
    location:       document.getElementById("editLocation").value,
    careerObjective:document.getElementById("editObjective").value,
    skills:         document.getElementById("editSkills").value,
  };
  try {
    const res = await fetch(`${BASE_URL}/api/student/profile`, {
      method: "PUT",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify(updatedData)
    });
    if (!res.ok) throw new Error();
    showMessage("Profile updated successfully!", "success");
    closeEditModal();
    loadProfile();
  } catch {
    showMessage("Failed to update profile.", "error");
  }
  saveBtn.disabled = false;
  saveBtn.textContent = origTxt;
});

/* ════════════════════════════════════════════
   RESUME  (unchanged API calls)
   ════════════════════════════════════════════ */

function triggerResumeUpload() {
  document.getElementById("resumeInput").click();
}

async function uploadResume() {
  const file = document.getElementById("resumeInput").files[0];
  if (!file) return;
  if (file.type !== "application/pdf") { showMessage("Please upload a PDF file only.", "error"); return; }
  if (file.size > 5 * 1024 * 1024)    { showMessage("File size must be under 5 MB.", "error"); return; }
  showLoader();
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await fetch(`${BASE_URL}/api/student/upload-resume`, {
      method: "POST", headers: { Authorization: "Bearer " + token }, body: formData
    });
    if (!res.ok) throw new Error();
    showMessage("Resume uploaded successfully! 🎉", "success");
    loadProfile();
  } catch {
    showMessage("Failed to upload resume.", "error");
  }
  hideLoader();
}

async function deleteResume() {
  if (typeof showConfirm === "function") {
    showConfirm({
      title: "Delete resume?", message: "Your uploaded resume will be permanently removed.",
      confirmText: "Delete", type: "danger", onConfirm: _doDeleteResume
    });
  } else {
    _doDeleteResume();
  }
}

async function _doDeleteResume() {
  showLoader();
  try {
    const res = await fetch(`${BASE_URL}/api/student/delete-resume`, {
      method: "DELETE", headers: { Authorization: "Bearer " + token }
    });
    if (!res.ok) throw new Error();
    showMessage("Resume deleted successfully!", "success");
    loadProfile();
  } catch {
    showMessage("Failed to delete resume.", "error");
  }
  hideLoader();
}
