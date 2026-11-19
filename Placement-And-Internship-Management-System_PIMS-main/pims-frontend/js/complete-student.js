/* ============================================================
   complete-student.js
   Profile creation — POST /api/student/profile
   Requires: config.js (BASE_URL), toast.js (showToast)
   All API calls are preserved exactly.
   ============================================================ */

/* BASE_URL is provided by config.js (loaded before this file) */
const token = localStorage.getItem("token");

/* ── Live avatar initials update ── */
function updateAvatar(name) {
  const el = document.getElementById("avatarInitials");
  if (!el) return;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) { el.textContent = "?"; return; }
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0][0].toUpperCase();
  el.textContent = initials;
}

/* ── Inline form error helper ── */
function showFormError(el, msg) {
  el.textContent = msg;
  el.style.display = "flex";
}

function hideFormError(el) {
  el.textContent = "";
  el.style.display = "none";
}

/* ── Save profile (same API call as original) ── */
async function saveStudentProfile() {
  const fullName       = document.getElementById("fullName").value.trim();
  const usn            = document.getElementById("usn").value.trim();
  const branch         = document.getElementById("branch").value.trim();
  const cgpaRaw        = document.getElementById("cgpa").value;
  const gradYearRaw    = document.getElementById("graduationYear").value;
  const errorEl        = document.getElementById("profileError");
  const saveBtn        = document.getElementById("saveProfileBtn");

  hideFormError(errorEl);

  /* ── Client-side validation ── */
  if (!fullName) {
    showFormError(errorEl, "Please enter your full name.");
    document.getElementById("fullName").focus();
    return;
  }
  if (!usn) {
    showFormError(errorEl, "Please enter your USN / Enrollment ID.");
    document.getElementById("usn").focus();
    return;
  }
  if (!branch) {
    showFormError(errorEl, "Please enter your branch or department.");
    document.getElementById("branch").focus();
    return;
  }
  const cgpa = parseFloat(cgpaRaw);
  if (!cgpaRaw || isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
    showFormError(errorEl, "Please enter a valid CGPA between 0 and 10.");
    document.getElementById("cgpa").focus();
    return;
  }
  const graduationYear = parseInt(gradYearRaw);
  if (!gradYearRaw || isNaN(graduationYear) || graduationYear < 2020 || graduationYear > 2035) {
    showFormError(errorEl, "Please enter a valid graduation year (2020–2035).");
    document.getElementById("graduationYear").focus();
    return;
  }

  /* ── Loading state ── */
  const origHTML = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = `
    <div class="spinner spinner-sm"
         style="border-color:rgba(255,255,255,0.3);border-top-color:#fff;"></div>
    Saving profile…
  `;

  try {
    /* ══ UNCHANGED API CALL ══ */
    const response = await fetch(`${BASE_URL}/api/student/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        fullName,
        usn,
        branch,
        cgpa,
        graduationYear
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      showFormError(errorEl, err.error || err.message || "Failed to save profile. Please try again.");
      saveBtn.disabled = false;
      saveBtn.innerHTML = origHTML;
      return;
    }

    /* ── Success ── */
    if (typeof showToast === "function") {
      showToast("Profile saved! Redirecting to your dashboard…", "success");
    }
    setTimeout(() => { window.location.href = "student.html"; }, 1000);

  } catch (err) {
    showFormError(errorEl, "Unable to reach the server. Please wait and try again.");
    saveBtn.disabled = false;
    saveBtn.innerHTML = origHTML;
  }
}
