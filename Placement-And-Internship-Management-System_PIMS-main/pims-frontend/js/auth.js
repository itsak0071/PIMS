/* ============================================================
   Auth Utilities — auth.js
   Shared authentication helpers used across all pages.
   Include AFTER config.js and toast.js.
   ============================================================ */

const Auth = {
  /* ── Token management ── */
  getToken() {
    return localStorage.getItem("token");
  },

  getRole() {
    return localStorage.getItem("role");
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  /* ── Auth guard: call at top of every protected page ── */
  guard() {
    if (!this.getToken()) {
      window.location.href = "index.html";
      return false;
    }
    return true;
  },

  /* ── Build Authorization headers ── */
  headers() {
    return {
      Authorization: "Bearer " + this.getToken(),
      "Content-Type": "application/json",
    };
  },

  headersMultipart() {
    return {
      Authorization: "Bearer " + this.getToken(),
    };
  },

  /* ── Logout with confirmation dialog ── */
  logout() {
    if (typeof showConfirm === "function") {
      showConfirm({
        title: "Sign out?",
        message: "You will be returned to the login page.",
        confirmText: "Sign Out",
        cancelText: "Stay",
        type: "warning",
        onConfirm: () => Auth._doLogout(),
      });
    } else {
      Auth._doLogout();
    }
  },

  _doLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "index.html";
  },

  /* ── Handle API responses that return 401 ── */
  async handleFetch(url, options = {}) {
    const response = await fetch(url, options);
    if (response.status === 401) {
      Auth._doLogout();
      return null;
    }
    return response;
  },
};

/* ── Global compatibility shim ── */
/* Existing JS files call logout() directly — this bridges to Auth.logout() */
function logout() {
  Auth.logout();
}
