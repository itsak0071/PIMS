/* ============================================================
   complete-company.js  v2.0
   Profile creation — POST /api/company/profile
   Requires: config.js (BASE_URL), toast.js (showToast)
   API call is 100% identical to original.
   ============================================================ */

/* BASE_URL is provided by config.js */
const token = localStorage.getItem("token");

/* ── Live avatar update ── */
function updateAvatar(name) {
  const el = document.getElementById("avatarInitials");
  if (!el) return;
  el.textContent = name.trim() ? name.trim()[0].toUpperCase() : "C";
}

/* ── Inline error helpers ── */
function showFormError(el, msg) { el.textContent = msg; el.style.display = "flex"; }
function hideFormError(el)      { el.textContent = ""; el.style.display = "none"; }

/* ── Save company profile (same POST API call) ── */
async function saveCompanyProfile() {
  const companyName   = document.getElementById("companyName").value.trim();
  const description   = document.getElementById("description").value.trim();
  const website       = document.getElementById("website").value.trim();
  const contactPerson = document.getElementById("contactPerson").value.trim();
  const contactEmail  = document.getElementById("contactEmail").value.trim();
  const errorEl       = document.getElementById("profileError");
  const saveBtn       = document.getElementById("saveProfileBtn");

  hideFormError(errorEl);

  if (!companyName) {
    showFormError(errorEl, "Please enter your company name.");
    document.getElementById("companyName").focus();
    return;
  }

  const origHTML = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = `
    <div class="spinner spinner-sm"
         style="border-color:rgba(255,255,255,0.3);border-top-color:#fff;"></div>
    Submitting…
  `;

  try {
    /* ══ UNCHANGED API CALL ══ */
    const response = await fetch(`${BASE_URL}/api/company/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        companyName,
        description,
        website,
        contactPerson,
        contactEmail
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      showFormError(errorEl, err.error || err.message || "Failed to save profile. Please try again.");
      saveBtn.disabled = false;
      saveBtn.innerHTML = origHTML;
      return;
    }

    if (typeof showToast === "function") {
      showToast("Profile submitted! Waiting for admin approval.", "success");
    }
    setTimeout(() => { window.location.href = "company.html"; }, 1200);

  } catch (err) {
    showFormError(errorEl, "Unable to reach the server. Please try again.");
    saveBtn.disabled = false;
    saveBtn.innerHTML = origHTML;
  }
}
