/* ============================================================
   PIMS Configuration — config.js
   Single source of truth for all frontend configuration.
   Load this FIRST on every page — before any other script.

   Environment detection:
     • localhost / 127.0.0.1  →  http://localhost:8080
     • any other host         →  production Render URL
   ============================================================ */

const PIMS_CONFIG = (function () {
  const PROD_URL  = "https://pims-backend-xa8s.onrender.com";
  const LOCAL_URL = "http://localhost:8080";

  const host      = window.location.hostname;
  const isLocal   = host === "localhost" || host === "127.0.0.1" || host === "";

  return {
    BASE_URL:   isLocal ? LOCAL_URL : PROD_URL,
    IS_LOCAL:   isLocal,
    APP_NAME:   "PIMS Portal",
    APP_TAGLINE:"Placement & Internship Management System",
    VERSION:    "2.0.0",
  };
})();

/* ----------------------------------------------------------
   Global BASE_URL — backward-compatible with every fetch()
   call that uses it directly (student.js, company.js, etc.)
   ---------------------------------------------------------- */
const BASE_URL = PIMS_CONFIG.BASE_URL;

/* Optional: log active environment in development */
if (PIMS_CONFIG.IS_LOCAL) {
  console.info("[PIMS] Running locally → backend: " + BASE_URL);
}
