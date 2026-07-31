// ============================================================
// Admin dashboard logic.
// Password check is client-side only (matches the simple "1234"
// gate requested) — fine for keeping casual visitors out of the
// dashboard link, but it is NOT strong security. See README for
// notes on tightening this if the data is sensitive.
//
// No localStorage/sessionStorage is used, so signing in only lasts
// for the current page load — refreshing asks for the password again.
// ============================================================
(function () {
  "use strict";

  var ADMIN_PASSWORD = "1234";
  var loggedIn = false;
  var allSubmissions = [];
  var lang = "sw";

  var PRIORITY_FIELDS = [
    "submitted_at", "respondent_name", "respondent_email", "respondent_phone", "location",
    "wewe_ni", "wewe_ni_other", "jinsia", "mkoa", "wilaya", "sekta", "sekta_other", "muda_shughuli"
  ];
  var HIDE_FIELDS = ["form-name", "bot-field"];

  window.setLang = function (l) {
    lang = l;
    document.body.classList.remove("lang-sw", "lang-en");
    document.body.classList.add("lang-" + l);
    document.getElementById("btn-lang-sw").classList.toggle("active", l === "sw");
    document.getElementById("btn-lang-en").classList.toggle("active", l === "en");
  };

  window.handleLogin = function (e) {
    e.preventDefault();
    var val = document.getElementById("adminPass").value;
    if (val === ADMIN_PASSWORD) {
      loggedIn = true;
      document.getElementById("loginView").style.display = "none";
      document.getElementById("dashboardView").style.display = "block";
      document.getElementById("logoutBtn").style.display = "inline-block";
      loadSubmissions();
    } else {
      document.getElementById("loginError").style.display = "block";
    }
    return false;
  };

  window.logout = function () {
    loggedIn = false;
    document.getElementById("adminPass").value = "";
    document.getElementById("loginError").style.display = "none";
    document.getElementById("dashboardView").style.display = "none";
    document.getElementById("logoutBtn").style.display = "none";
    document.getElementById("loginView").style.display = "block";
  };

  window.loadSubmissions = function () {
    var holder = document.getElementById("tableHolder");
    holder.innerHTML = '<div class="state-msg"><span class="lang-' + lang + '">' +
      (lang === "sw" ? "Inapakia majibu…" : "Loading responses…") + "</span></div>";

    fetch("/.netlify/functions/submissions")
      .then(function (res) {
        return res.json().then(function (data) { return { ok: res.ok, data: data }; });
      })
      .then(function (result) {
        if (!result.ok || result.data.error) {
          renderSetupNotice(result.data && result.data.error);
          return;
        }
        allSubmissions = (result.data.submissions || []).map(normalizeSubmission);
        renderTable();
      })
      .catch(function () {
        renderSetupNotice(null);
      });
  };

  function normalizeSubmission(sub) {
    // Netlify's API returns { data: {...fields}, created_at, ... }
    var fields = sub.data || sub.fields || sub;
    var out = Object.assign({}, fields);
    if (sub.created_at && !out.submitted_at) out.submitted_at = sub.created_at;
    return out;
  }

  function renderSetupNotice(errMessage) {
    var holder = document.getElementById("tableHolder");
    holder.innerHTML =
      '<div class="state-msg err">' +
      '<p><span class="lang-sw">Haikuweza kupata majibu kutoka Netlify.</span>' +
      '<span class="lang-en">Could not load responses from Netlify.</span></p>' +
      '<div class="badge-setup">' +
      '<span class="lang-sw">Hii kawaida hutokea kama tovuti bado haijapelekwa Netlify, au Kazi (Functions) hazijawekewa mazingira sahihi. Hakikisha:</span>' +
      '<span class="lang-en">This usually happens if the site is not deployed on Netlify yet, or the Function is missing its environment variables. Make sure:</span>' +
      "<ol>" +
      '<li><span class="lang-sw">Tovuti imepelekwa Netlify (si kufunguliwa kama faili la kawaida).</span><span class="lang-en">The site is deployed on Netlify (not opened as a local file).</span></li>' +
      '<li><span class="lang-sw">Umeweka </span><code>NETLIFY_API_TOKEN</code><span class="lang-sw"> na </span><code>NETLIFY_SITE_ID</code><span class="lang-sw"> kwenye Site settings → Environment variables.</span>' +
      '<span class="lang-en">You have set </span><code>NETLIFY_API_TOKEN</code><span class="lang-en"> and </span><code>NETLIFY_SITE_ID</code><span class="lang-en"> under Site settings → Environment variables.</span></li>' +
      '<li><span class="lang-sw">Angalau jibu moja limewahi kutumwa kupitia fomu kuu.</span><span class="lang-en">At least one response has been submitted through the main form.</span></li>' +
      "</ol>" +
      '<span class="lang-sw">Angalia faili la README.md kwa maelekezo kamili.</span>' +
      '<span class="lang-en">See README.md for full setup steps.</span>' +
      (errMessage ? '<p style="margin-top:10px; opacity:.75;">Debug: ' + escapeHtml(errMessage) + "</p>" : "") +
      "</div></div>";
  }

  window.renderTable = function () {
    var holder = document.getElementById("tableHolder");
    var query = (document.getElementById("searchInput").value || "").toLowerCase();

    var rows = allSubmissions.filter(function (sub) {
      if (!query) return true;
      return Object.keys(sub).some(function (k) {
        return String(sub[k]).toLowerCase().indexOf(query) > -1;
      });
    });

    document.getElementById("countPill").innerHTML =
      rows.length + ' <span class="lang-sw">majibu</span><span class="lang-en">responses</span>';

    if (!rows.length) {
      holder.innerHTML = '<div class="state-msg"><span class="lang-sw">Hakuna majibu bado.</span><span class="lang-en">No responses yet.</span></div>';
      return;
    }

    var columns = collectColumns(rows);

    var table = document.createElement("table");
    var thead = document.createElement("thead");
    var headRow = document.createElement("tr");
    columns.forEach(function (col) {
      var th = document.createElement("th");
      th.textContent = prettify(col);
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    rows.forEach(function (sub) {
      var tr = document.createElement("tr");
      columns.forEach(function (col) {
        var td = document.createElement("td");
        td.textContent = sub[col] || "";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    holder.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className = "table-wrap";
    wrap.appendChild(table);
    holder.appendChild(wrap);
  };

  function collectColumns(rows) {
    var set = {};
    rows.forEach(function (sub) {
      Object.keys(sub).forEach(function (k) {
        if (HIDE_FIELDS.indexOf(k) === -1) set[k] = true;
      });
    });
    var keys = Object.keys(set);
    keys.sort(function (a, b) {
      var pa = PRIORITY_FIELDS.indexOf(a);
      var pb = PRIORITY_FIELDS.indexOf(b);
      if (pa === -1 && pb === -1) return a.localeCompare(b);
      if (pa === -1) return 1;
      if (pb === -1) return -1;
      return pa - pb;
    });
    return keys;
  }

  function prettify(key) {
    return key.replace(/\[\]$/, "").replace(/_/g, " ").replace(/^\w/, function (c) { return c.toUpperCase(); });
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  window.exportCsv = function () {
    var query = (document.getElementById("searchInput").value || "").toLowerCase();
    var rows = allSubmissions.filter(function (sub) {
      if (!query) return true;
      return Object.keys(sub).some(function (k) { return String(sub[k]).toLowerCase().indexOf(query) > -1; });
    });
    if (!rows.length) return;

    var columns = collectColumns(rows);
    var lines = [columns.map(csvCell).join(",")];
    rows.forEach(function (sub) {
      lines.push(columns.map(function (c) { return csvCell(sub[c] || ""); }).join(","));
    });

    var blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "nanenane-majibu-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  function csvCell(val) {
    var s = String(val).replace(/"/g, '""');
    return '"' + s + '"';
  }

  setLang("sw");
})();
