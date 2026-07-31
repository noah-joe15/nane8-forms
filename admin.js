// ============================================================
// Admin dashboard logic - Supabase Version
// ============================================================
(function () {
  "use strict";

  var ADMIN_PASSWORD = "1234";
  var loggedIn = false;
  var allSubmissions = [];
  var lang = "sw";

  // Define EXACT column order - name, phone, email FIRST
  var COLUMN_ORDER = [
    "submitted_at",
    "respondent_name",
    "respondent_phone",
    "respondent_email",
    "location",
    "wewe_ni",
    "jinsia",
    "mkoa",
    "wilaya",
    "sekta",
    "muda_shughuli",
    "hali_biashara",
    "uzalishaji_umeongezeka",
    "mauzo",
    "sababu_zinazoathiri",
    "bidhaa_zinazozalishwa_tz",
    "bidhaa_zimesajiliwa",
    "kama_hapana_sababu",
    "msaada_mit",
    "maeneo_mauzo",
    "njia_kupata_wateja",
    "amewahi_kushiriki_maonesho",
    "maonesho_yamesaidia",
    "mpango_kushiriki_51st",
    "lengo_kushiriki",
    "msaada_kabla_kushiriki",
    "changamoto_kuzuia",
    "changamoto_kukuza_biashara",
    "aina_msaada_unaohitaji",
    "mapendekezo"
  ];

  var HIDE_FIELDS = ["form-name", "bot-field"];

  // Language toggle
  window.setLang = function (l) {
    lang = l;
    document.body.classList.remove("lang-sw", "lang-en");
    document.body.classList.add("lang-" + l);
    document.getElementById("btn-lang-sw").classList.toggle("active", l === "sw");
    document.getElementById("btn-lang-en").classList.toggle("active", l === "en");
  };

  // Login handler
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

  // Logout handler
  window.logout = function () {
    loggedIn = false;
    document.getElementById("adminPass").value = "";
    document.getElementById("loginError").style.display = "none";
    document.getElementById("dashboardView").style.display = "none";
    document.getElementById("logoutBtn").style.display = "none";
    document.getElementById("loginView").style.display = "block";
  };

  // Tab switching
  window.switchTab = function (tab, btn) {
    document.getElementById("responsesTab").style.display = tab === "responses" ? "block" : "none";
    document.getElementById("questionsTab").style.display = tab === "questions" ? "block" : "none";
    document.querySelectorAll(".tab-btn").forEach(function(b) { b.classList.remove("active"); });
    btn.classList.add("active");
  };

  // Load submissions from Supabase
  window.loadSubmissions = async function () {
    var holder = document.getElementById("tableHolder");
    holder.innerHTML = '<div class="state-msg"><span class="lang-' + lang + '">' +
      (lang === "sw" ? "Inapakia majibu…" : "Loading responses…") + "</span></div>";

    try {
      if (typeof supabaseClient === 'undefined') {
        throw new Error("Supabase client not initialized");
      }

      const { data, error } = await supabaseClient
        .from('nanenane_responses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      allSubmissions = (data || []).map(function(sub) {
        var fields = sub.form_data || {};
        if (!fields.submitted_at && sub.created_at) {
          fields.submitted_at = sub.created_at;
        }
        return fields;
      });

      renderTable();
    } catch (err) {
      console.error("Fetch error:", err);
      holder.innerHTML = '<div class="state-msg err">Error: ' + err.message + '</div>';
    }
  };

  // Render the table with proper column order
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

    // Get all unique column names from data
    var allColumns = new Set();
    rows.forEach(function(sub) {
      Object.keys(sub).forEach(function(key) {
        if (HIDE_FIELDS.indexOf(key) === -1) {
          allColumns.add(key);
        }
      });
    });

    // Sort columns: first by COLUMN_ORDER, then alphabetically for rest
    var columns = Array.from(allColumns).sort(function(a, b) {
      var idxA = COLUMN_ORDER.indexOf(a);
      var idxB = COLUMN_ORDER.indexOf(b);
      
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    // Build table HTML
    var tableHtml = '<table><thead><tr>';
    columns.forEach(function(col) {
      tableHtml += '<th>' + prettify(col) + '</th>';
    });
    tableHtml += '</tr></thead><tbody>';

    rows.forEach(function(sub) {
      tableHtml += '<tr>';
      columns.forEach(function(col) {
        var val = sub[col];
        if (Array.isArray(val)) {
          val = val.join(", ");
        } else if (!val) {
          val = "";
        }
        tableHtml += '<td>' + val + '</td>';
      });
      tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table>';
    holder.innerHTML = '<div class="table-wrap">' + tableHtml + '</div>';
  };

  // Prettify column names
  function prettify(key) {
    return key
      .replace(/\[\]$/, "")
      .replace(/_/g, " ")
      .replace(/^\w/, function (c) { return c.toUpperCase(); });
  }

  // Export to CSV
  window.exportCsv = function () {
    var query = (document.getElementById("searchInput").value || "").toLowerCase();
    var rows = allSubmissions.filter(function (sub) {
      if (!query) return true;
      return Object.keys(sub).some(function (k) { 
        return String(sub[k]).toLowerCase().indexOf(query) > -1; 
      });
    });

    if (!rows.length) {
      alert(lang === "sw" ? "Hakuna majibu ya kupakua" : "No responses to export");
      return;
    }

    // Get columns in order
    var allColumns = new Set();
    rows.forEach(function(sub) {
      Object.keys(sub).forEach(function(key) {
        if (HIDE_FIELDS.indexOf(key) === -1) allColumns.add(key);
      });
    });

    var columns = Array.from(allColumns).sort(function(a, b) {
      var idxA = COLUMN_ORDER.indexOf(a);
      var idxB = COLUMN_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    // Build CSV
    var lines = [columns.map(csvCell).join(",")];
    rows.forEach(function (sub) {
      lines.push(columns.map(function (c) {
        var val = sub[c];
        if (Array.isArray(val)) val = val.join(", ");
        return csvCell(val || "");
      }).join(","));
    });

    var blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
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

  // Initialize
  setLang("sw");
})();
