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

// Define the exact order of columns to display
var PRIORITY_FIELDS = [
  "respondent_name",
  "respondent_phone", 
  "respondent_email",
  "location",
  "submitted_at",
  "wewe_ni",
  "wewe_ni_other",
  "jinsia",
  "mkoa",
  "wilaya",
  "sekta",
  "sekta_other",
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

window.loadSubmissions = async function () {
  var holder = document.getElementById("tableHolder");
  holder.innerHTML = '<div class="state-msg"><span class="lang-' + lang + '">' +
    (lang === "sw" ? "Inapakia majibu…" : "Loading responses…") + "</span></div>";

  try {
    if (typeof supabaseClient === 'undefined') {
      throw new Error("Supabase client not initialized. Check admin.html script tags.");
    }

    const { data, error } = await supabaseClient
      .from('nanenane_responses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error);
      renderSetupNotice(error.message);
      return;
    }

    if (!data || data.length === 0) {
      allSubmissions = [];
      renderTable();
      return;
    }

    allSubmissions = data.map(function (sub) {
      var fields = sub.form_data || {};
      if (!fields.submitted_at && sub.created_at) {
        fields.submitted_at = sub.created_at;
      }
      return fields;
    });

    renderTable();
  } catch (err) {
    console.error("Fetch error:", err);
    renderSetupNotice(err.message);
  }
};

function renderSetupNotice(errMessage) {
  var holder = document.getElementById("tableHolder");
  holder.innerHTML =
    '<div class="state-msg err">' +
    '<p><span class="lang-sw">Haikuweza kupata majibu kutoka kwenye hifadhidata.</span>' +
    '<span class="lang-en">Could not load responses from the database.</span></p>' +
    '<div class="badge-setup">' +
    '<span class="lang-sw">Hakikisha: 1) Umeweka URL na API Key sahihi za Supabase kwenye faili za HTML. 2) Jedwali la "nanenane_responses" lipo kwenye Supabase. 3) Angalau jibu moja limewasilishwa kupitia fomu kuu.</span>' +
    '<span class="lang-en">Make sure: 1) Supabase URL and API Key are correctly set in the HTML files. 2) The "nanenane_responses" table exists in Supabase. 3) At least one response has been submitted through the main form.</span>' +
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
      var val = sub[col];
      td.textContent = Array.isArray(val) ? val.join(", ") : (val || "");
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
  
  // Sort keys based on PRIORITY_FIELDS order
  keys.sort(function (a, b) {
    var pa = PRIORITY_FIELDS.indexOf(a);
    var pb = PRIORITY_FIELDS.indexOf(b);
    
    // If both are in priority list, sort by their position
    if (pa !== -1 && pb !== -1) return pa - pb;
    
    // If only one is in priority list, it comes first
    if (pa !== -1) return -1;
    if (pb !== -1) return 1;
    
    // If neither is in priority list, sort alphabetically
    return a.localeCompare(b);
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
    lines.push(columns.map(function (c) { 
      var val = sub[c];
      return csvCell(Array.isArray(val) ? val.join(", ") : (val || "")); 
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

setLang("sw");
})();
