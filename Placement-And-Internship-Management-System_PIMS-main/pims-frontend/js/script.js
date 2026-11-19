/* ============================================================
   PIMS Auth Script — script.js
   Handles login, register, section toggle, and password toggle.
   Depends on: config.js, toast.js (loaded before this file)
   ============================================================ */

/* ════════════════════════════════════
   LOGIN
   ════════════════════════════════════ */

async function login() {
  const email      = document.getElementById("loginEmail").value.trim();
  const password   = document.getElementById("loginPassword").value;
  const errorEl    = document.getElementById("loginError");
  const loginBtn   = document.getElementById("loginBtn");
  const coldBanner = document.getElementById("loginColdBanner");

  // Clear previous state
  hideError(errorEl);
  coldBanner.style.display = "none";

  // Client-side validation
  if (!email) {
    showError(errorEl, "Please enter your email address.");
    document.getElementById("loginEmail").focus();
    return;
  }
  if (!password) {
    showError(errorEl, "Please enter your password.");
    document.getElementById("loginPassword").focus();
    return;
  }

  // Loading state
  setButtonLoading(loginBtn, "Signing in...");

  // Show cold-start warning after 5 seconds
  const coldTimer = setTimeout(() => {
    coldBanner.style.display = "flex";
  }, 5000);

  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    clearTimeout(coldTimer);
    coldBanner.style.display = "none";

    const data = await response.json();

    if (!response.ok) {
      showError(errorEl, data.error || "Incorrect email or password. Please try again.");
      setButtonNormal(loginBtn, "Sign In");
      return;
    }

    // Store credentials
    localStorage.setItem("token", data.token);
    localStorage.setItem("role",  data.role);

    toast.success("Signed in successfully! Redirecting...");

    // Redirect by role
    setTimeout(() => {
      if      (data.role === "STUDENT") window.location.href = "student.html";
      else if (data.role === "ADMIN")   window.location.href = "admin.html";
      else if (data.role === "COMPANY") window.location.href = "company.html";
    }, 700);

  } catch (err) {
    clearTimeout(coldTimer);
    coldBanner.style.display = "flex";
    showError(errorEl, "Unable to connect to the server. Please wait and try again.");
    setButtonNormal(loginBtn, "Sign In");
  }
}

/* ════════════════════════════════════
   REGISTER
   ════════════════════════════════════ */

async function register() {
  const email     = document.getElementById("registerEmail").value.trim();
  const password  = document.getElementById("registerPassword").value;
  const role      = document.getElementById("registerRole").value;
  const errorEl   = document.getElementById("registerError");
  const regBtn    = document.getElementById("registerBtn");

  hideError(errorEl);

  // Client-side validation
  if (!email) {
    showError(errorEl, "Please enter your email address.");
    document.getElementById("registerEmail").focus();
    return;
  }
  if (!password) {
    showError(errorEl, "Please enter a password.");
    document.getElementById("registerPassword").focus();
    return;
  }
  if (password.length < 6) {
    showError(errorEl, "Password must be at least 6 characters long.");
    document.getElementById("registerPassword").focus();
    return;
  }

  // Loading state
  setButtonLoading(regBtn, "Creating account...");

  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showError(errorEl, data.error || "Registration failed. Please try again.");
      setButtonNormal(regBtn, "Create Account");
      return;
    }

    toast.success("Account created! Please sign in with your credentials.");
    showLogin();

  } catch (err) {
    showError(errorEl, "Server is starting up. Please wait a moment and try again.");
  }

  setButtonNormal(regBtn, "Create Account");
}

/* ════════════════════════════════════
   SECTION TOGGLE
   ════════════════════════════════════ */

function showRegister() {
  const loginEl = document.getElementById("loginSection");
  const regEl   = document.getElementById("registerSection");
  loginEl.classList.add("hidden");
  regEl.classList.remove("hidden");
  // Focus first field for accessibility
  setTimeout(() => document.getElementById("registerEmail").focus(), 50);
}

function showLogin() {
  const regEl   = document.getElementById("registerSection");
  const loginEl = document.getElementById("loginSection");
  regEl.classList.add("hidden");
  loginEl.classList.remove("hidden");
  setTimeout(() => document.getElementById("loginEmail").focus(), 50);
}

/* ════════════════════════════════════
   PASSWORD TOGGLE
   ════════════════════════════════════ */

function togglePassword(inputId, btn) {
  const input    = document.getElementById(inputId);
  const eyeShow  = btn.querySelector(".eye-show");
  const eyeHide  = btn.querySelector(".eye-hide");

  if (input.type === "password") {
    input.type = "text";
    eyeShow.style.display = "none";
    eyeHide.style.display = "block";
    btn.setAttribute("aria-label", "Hide password");
  } else {
    input.type = "password";
    eyeShow.style.display = "block";
    eyeHide.style.display = "none";
    btn.setAttribute("aria-label", "Show password");
  }
}

/* ════════════════════════════════════
   HELPERS
   ════════════════════════════════════ */

function showError(el, message) {
  el.textContent = message;
  el.style.display = "flex";
}

function hideError(el) {
  el.textContent = "";
  el.style.display = "none";
}

function setButtonLoading(btn, label) {
  btn.disabled = true;
  btn.innerHTML = `
    <div class="spinner spinner-sm spinner-white" style="width:18px;height:18px;border-width:2px;border-color:rgba(255,255,255,0.3);border-top-color:#fff;"></div>
    ${label}
  `;
}

function setButtonNormal(btn, label) {
  btn.disabled = false;
  btn.textContent = label;
}
