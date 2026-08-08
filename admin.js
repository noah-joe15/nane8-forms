// =====================================================
// NANENANE 2026 - ADMIN DASHBOARD (admin.js)
// =====================================================

// --- Supabase client (self-contained) ---
(function () {
  try {
    if (typeof window.supabase !== "undefined" && typeof window.supabaseClient === "undefined") {
      window.supabaseClient = window.supabase.createClient(
        "https://ccddzluijwfdytfsuwza.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjZGR6bHVpandmZHl0ZnN1d3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0Nzg1MzYsImV4cCI6MjEwMTA1NDUzNn0.4N0-49NXrwUdA9F1kpW_7OXemE1iiS5NrBcih8RbWps"
      );
      console.log("[OK] Supabase client initialized");
    } else if (typeof window.supabase === "undefined") {
      console.error("[ERROR] Supabase library not loaded");
    }
  } catch (err) {
    console.error("[ERROR] Failed to create Supabase client:", err);
  }
})();

(function () {
  "use strict";
  var allSubmissions = [];
  var allQuestions = [];
  var chartsInitialized = false;
  var regionsChart, sectorsChart, genderChart, businessChart;

  window.onerror = function (msg, url, line, col, error) {
    console.error("[GLOBAL ERROR]", msg, "at", url + ":" + line + ":" + col);
    return false;
  };

  // --- LANGUAGE ---
  window.setLang = function (l) {
    try {
      document.body.classList.remove("lang-sw", "lang-en");
      document.body.classList.add("lang-" + l);
      document.getElementById("btn-lang-sw").classList.toggle("active", l === "sw");
      document.getElementById("btn-lang-en").classList.toggle("active", l === "en");
    } catch (err) {
      console.error("[ERROR] setLang:", err);
    }
  };

  // --- AUTH ---
  async function checkAuth() {
    try {
      console.log("[AUTH] Checking session...");
      if (typeof supabaseClient === "undefined") {
        throw new Error("supabaseClient is undefined - library not loaded");
      }
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (error) throw error;
      console.log("[AUTH] Session:", session ? "exists" : "none");
      if (session) { showDashboard(); } else { showLogin(); }
    } catch (err) {
      console.error("[ERROR] Auth check failed:", err);
      showLogin();
    }
  }

  window.handleLogin = async function (e) {
    e.preventDefault();
    var email = document.getElementById("adminEmail").value;
    var password = document.getElementById("adminPass").value;
    var loginBtn = document.getElementById("loginBtn");
    var loginError = document.getElementById("loginError");

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="lang-sw">Inaingia...</span><span class="lang-en">Signing in...</span>';
    loginError.style.display = "none";

    try {
      const { error } = await supabaseClient.auth.signInWithPassword({ email: email, password: password });
      if (error) {
        console.error("[ERROR] Login:", error);
        loginError.style.display = "block";
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span class="lang-sw">Ingia</span><span class="lang-en">Sign In</span>';
      } else {
        showDashboard();
      }
    } catch (err) {
      console.error("[ERROR] Login exception:", err);
      alert("Login failed: " + err.message);
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<span class="lang-sw">Ingia</span><span class="lang-en">Sign In</span>';
    }
    return false;
  };

  window.handleLogout = async function () {
    try { await supabaseClient.auth.signOut(); } catch (err) { console.error("[ERROR] Logout:", err); }
    showLogin();
  };

  function showLogin() {
    console.log("[UI] Showing login view");
    document.getElementById("loginView").style.display = "block";
    document.getElementById("dashboardView").style.display = "none";
    document.getElementById("logoutBtn").style.display = "none";
    document.getElementById("loginForm").reset();
    document.getElementById("loginBtn").disabled = false;
    document.getElementById("loginBtn").innerHTML = '<span class="lang-sw">Ingia</span><span class="lang-en">Sign In</span>';
  }

  function showDashboard() {
    console.log("[UI] Showing dashboard view");
    document.getElementById("loginView").style.display = "none";
    document.getElementById("dashboardView").style.display = "block";
    document.getElementById("logoutBtn").style.display = "inline-block";
    loadSubmissions();
    loadQuestions();
  }

  // --- TABS ---
  window.switchTab = function (tab, btn) {
    try {
      document.getElementById("responsesTab").style.display = tab === "responses" ? "block" : "none";
      document.getElementById("unregisteredTab").style.display = tab === "unregistered" ? "block" : "none";
      document.getElementById("kpiTab").style.display = tab === "kpi" ? "block" : "none";
      document.getElementById("questionsTab").style.display = tab === "questions" ? "block" : "none";
      document.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("active"); });
      if (btn) btn.classList.add("active");
      if (tab === "unregistered") renderUnregisteredTable();
      if (tab === "questions") loadQuestions();
      if (tab === "kpi") renderKPICharts();
    } catch (err) {
      console.error("[ERROR] switchTab:", err);
    }
  };

  // --- MIT REGISTRATION HELPER ---
  function isUnregistered(sub) {
    var v = String(sub.bidhaa_zimesajiliwa || "").trim().toLowerCase();
    return v.indexOf("hapana") !== -1 || v.indexOf("sijui") !== -1;
  }

  // --- DATA LOADING ---
  window.loadSubmissions = async function () {
    var holder = document.getElementById("tableHolder");
    holder.innerHTML = '<div class="state-msg"><span class="lang-sw">Inapakia majibu…</span><span class="lang-en">Loading responses…</span></div>';
    try {
      const { data, error } = await supabaseClient.from('nanenane_responses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      allSubmissions = (data || []).map(function (sub) {
        var fields = sub.form_data || {};
        if (!fields.submitted_at && sub.created_at) fields.submitted_at = sub.created_at;
        return fields;
      }).filter(function (sub) {
        var keys = Object.keys(sub).filter(function (k) { return k !== "submitted_at" && k !== "created_at"; });
        return keys.length > 0;
      });
      console.log("[OK] Loaded", allSubmissions.length, "submissions");
      updateStats();
      renderTable();
      renderPercentageBreakdowns(allSubmissions);
      renderKPICharts();
    } catch (err) {
      console.error("[ERROR] Load submissions:", err);
      holder.innerHTML = '<div class="state-msg" style="color:var(--danger)">Hitilafu: ' + err.message + '</div>';
    }
  };

  function updateStats() {
    try {
      document.getElementById("statTotal").textContent = allSubmissions.length;
      var regions = new Set();
      var districts = new Set();
      var unregisteredCount = 0;
      allSubmissions.forEach(function (sub) {
        if (sub.mkoa) regions.add(String(sub.mkoa).trim().toLowerCase());
        if (sub.wilaya) districts.add(String(sub.wilaya).trim().toLowerCase());
        if (isUnregistered(sub)) unregisteredCount++;
      });
      document.getElementById("statRegions").textContent = regions.size;
      document.getElementById("statDistricts").textContent = districts.size;
      document.getElementById("statUnregistered").textContent = unregisteredCount;
    } catch (err) {
      console.error("[ERROR] updateStats:", err);
    }
  }

  // --- TABLES ---
  window.renderTable = function () {
    try {
      var query = (document.getElementById("searchInput").value || "").toLowerCase();
      var rows = allSubmissions.filter(function (sub) {
        if (!query) return true;
        return Object.values(sub).some(function (v) { return String(v).toLowerCase().includes(query); });
      });
      document.getElementById("countPill").innerHTML = rows.length + ' <span class="lang-sw">majibu</span><span class="lang-en">responses</span>';
      renderGenericTable(rows, "tableHolder", false);
    } catch (err) {
      console.error("[ERROR] renderTable:", err);
    }
  };

  window.renderUnregisteredTable = function () {
    try {
      var query = (document.getElementById("unregSearchInput").value || "").toLowerCase();
      var rows = allSubmissions.filter(isUnregistered).filter(function (sub) {
        if (!query) return true;
        return Object.values(sub).some(function (v) { return String(v).toLowerCase().includes(query); });
      });
      document.getElementById("unregCountPill").textContent = rows.length;
      renderGenericTable(rows, "unregisteredTableHolder", true);
    } catch (err) {
      console.error("[ERROR] renderUnregisteredTable:", err);
    }
  };

  function renderGenericTable(rows, holderId, isUnregisteredView) {
    var holder = document.getElementById(holderId);
    if (!rows.length) {
      holder.innerHTML = '<div class="state-msg"><span class="lang-sw">Hakuna majibu.</span><span class="lang-en">No responses.</span></div>';
      return;
    }
    var allKeys = new Set();
    rows.forEach(function (sub) {
      Object.keys(sub).forEach(function (k) {
        if (k !== "form-name" && k !== "bot-field") allKeys.add(k);
      });
    });
    var priorityCols = isUnregisteredView
      ? ["respondent_name", "respondent_phone", "mkoa", "wilaya", "sekta", "bidhaa_zinazozalishwa_tz", "bidhaa_zimesajiliwa", "submitted_at"]
      : ["jina_la_kampuni", "tin_number", "anwani_kampuni", "submitted_at", "respondent_name", "respondent_phone", "respondent_email", "mkoa", "wilaya"];
    var cols = Array.from(allKeys).sort(function (a, b) {
      var idxA = priorityCols.indexOf(a);
      var idxB = priorityCols.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
    var html = '<table><thead><tr>' + cols.map(function (c) { return '<th>' + c.replace(/_/g, " ") + '</th>'; }).join("") + '</tr></thead><tbody>';
    rows.forEach(function (sub) {
      html += '<tr>' + cols.map(function (c) {
        var val = sub[c];
        return '<td>' + (Array.isArray(val) ? val.join(", ") : (val || "")) + '</td>';
      }).join("") + '</tr>';
    });
    holder.innerHTML = '<div class="table-wrap">' + html + '</tbody></table></div>';
  }

  // --- CSV ---
  window.exportCsv = function () { exportGenericCsv(allSubmissions, "majibu-yote", false); };
  window.exportUnregisteredCsv = function () {
    exportGenericCsv(allSubmissions.filter(isUnregistered), "wanaohitaji-usajili", true);
  };

  function exportGenericCsv(rows, filename, isUnregisteredView) {
    if (!rows.length) { alert("Hakuna majibu"); return; }
    var allKeys = new Set();
    rows.forEach(function (sub) {
      Object.keys(sub).forEach(function (k) {
        if (k !== "form-name" && k !== "bot-field") allKeys.add(k);
      });
    });
    var priorityCols = isUnregisteredView
      ? ["respondent_name", "respondent_phone", "mkoa", "wilaya", "sekta", "bidhaa_zinazozalishwa_tz", "bidhaa_zimesajiliwa", "submitted_at"]
      : ["jina_la_kampuni", "tin_number", "anwani_kampuni", "submitted_at", "respondent_name", "respondent_phone", "respondent_email", "mkoa", "wilaya"];
    var cols = Array.from(allKeys).sort(function (a, b) {
      var idxA = priorityCols.indexOf(a);
      var idxB = priorityCols.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
    var lines = [cols.join(",")].concat(rows.map(function (sub) {
      return cols.map(function (c) {
        var val = sub[c];
        return '"' + String(Array.isArray(val) ? val.join(", ") : (val || "")).replace(/"/g, '""') + '"';
      }).join(",");
    }));
    var blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename + ".csv"; a.click();
  }

  // --- QUESTIONS ---
  window.loadQuestions = async function () {
    var holder = document.getElementById("questionsHolder");
    try {
      const { data, error } = await supabaseClient.from('survey_questions').select('*').order('step_number', { ascending: true }).order('sort_order', { ascending: true });
      if (error) throw error;
      allQuestions = data || [];
      renderQuestions();
    } catch (err) {
      console.error("[ERROR] loadQuestions:", err);
      holder.innerHTML = '<div class="state-msg" style="color:var(--danger)">Hitilafu: ' + err.message + '</div>';
    }
  };

  window.renderQuestions = function () {
    if (!allQuestions.length) {
      document.getElementById("questionsHolder").innerHTML = '<div class="state-msg"><span class="lang-sw">Hakuna maswali bado.</span><span class="lang-en">No questions yet.</span></div>';
      return;
    }
    var html = '<table><thead><tr><th>Step</th><th>Field</th><th>Label (SW)</th><th>Type</th><th>Actions</th></tr></thead><tbody>';
    allQuestions.forEach(function (q) {
      html += '<tr><td>' + q.step_number + '</td><td><code>' + q.field_name + '</code></td><td>' + q.label_sw + '</td><td>' + q.input_type + '</td><td>' +
        '<button class="btn btn-ghost btn-sm" onclick=\'editQuestion(' + JSON.stringify(q).replace(/'/g, "&#39;") + ')\'><span class="lang-sw">Hariri</span><span class="lang-en">Edit</span></button> ' +
        '<button class="btn btn-sm btn-danger" onclick="deleteQuestion(\'' + q.id + '\')"><span class="lang-sw">Futa</span><span class="lang-en">Delete</span></button>' +
        '</td></tr>';
    });
    document.getElementById("questionsHolder").innerHTML = '<div class="table-wrap">' + html + '</tbody></table></div>';
  };

  window.toggleOptions = function () {
    document.getElementById("optionsField").style.display = (document.getElementById("q_type").value === "radio" || document.getElementById("q_type").value === "checkbox") ? "block" : "none";
  };

  window.saveQuestion = async function (e) {
    e.preventDefault();
    var id = document.getElementById("q_id").value;
    var payload = {
      step_number: parseInt(document.getElementById("q_step").value),
      field_name: document.getElementById("q_field").value.trim(),
      label_sw: document.getElementById("q_label_sw").value.trim(),
      label_en: document.getElementById("q_label_en").value.trim(),
      input_type: document.getElementById("q_type").value,
      is_required: document.getElementById("q_required").value === "true",
      sort_order: parseInt(document.getElementById("q_sort").value)
    };
    var opts = document.getElementById("q_options").value;
    if (payload.input_type === "radio" || payload.input_type === "checkbox") {
      payload.options = opts.split(",").map(function (o) { return o.trim(); }).filter(function (o) { return o; });
    }
    try {
      if (id) { await supabaseClient.from('survey_questions').update(payload).eq('id', id); }
      else { await supabaseClient.from('survey_questions').insert([payload]); }
      resetQForm();
      loadQuestions();
      alert("Swali limehifadhiwa!");
    } catch (err) {
      alert("Hitilafu: " + err.message);
    }
    return false;
  };

  window.editQuestion = function (q) {
    document.getElementById("q_id").value = q.id;
    document.getElementById("q_step").value = q.step_number;
    document.getElementById("q_sort").value = q.sort_order;
    document.getElementById("q_field").value = q.field_name;
    document.getElementById("q_label_sw").value = q.label_sw;
    document.getElementById("q_label_en").value = q.label_en;
    document.getElementById("q_type").value = q.input_type;
    document.getElementById("q_required").value = q.is_required ? "true" : "false";
    document.getElementById("q_options").value = q.options ? q.options.join(", ") : "";
    toggleOptions();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.deleteQuestion = async function (id) {
    if (!confirm("Una uhakika?")) return;
    await supabaseClient.from('survey_questions').delete().eq('id', id);
    loadQuestions();
  };

  window.resetQForm = function () {
    document.getElementById("questionForm").reset();
    document.getElementById("q_id").value = "";
    toggleOptions();
  };

  // --- KPI / CHARTS ---
  function kpiTabVisible() {
    var el = document.getElementById("kpiTab");
    return !!el && el.style.display !== "none";
  }

  function resizeAllCharts() {
    [regionsChart, sectorsChart, genderChart, businessChart].forEach(function (c) { if (c) c.resize(); });
  }

  function renderKPICharts() {
    try {
      document.getElementById("kpiTotal").textContent = allSubmissions.length;
      var unregisteredCount = allSubmissions.filter(isUnregistered).length;
      document.getElementById("kpiUnregistered").textContent = unregisteredCount;
      var completeCount = allSubmissions.filter(function (sub) {
        return sub.respondent_name && sub.mkoa;
      }).length;
      var completionRate = allSubmissions.length > 0 ? Math.round((completeCount / allSubmissions.length) * 100) : 0;
      document.getElementById("kpiCompletion").textContent = completionRate + "%";

      if (kpiTabVisible() && typeof Chart !== "undefined") {
        if (!chartsInitialized) { initCharts(); chartsInitialized = true; }
        else { updateCharts(); }
        setTimeout(resizeAllCharts, 60);
      }
    } catch (err) {
      console.error("[ERROR] renderKPICharts:", err);
    }
  }

  function initCharts() {
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    Chart.defaults.color = '#4B5B54';
    regionsChart = new Chart(document.getElementById('regionsChart').getContext('2d'), {
      type: 'pie',
      data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
    });
    sectorsChart = new Chart(document.getElementById('sectorsChart').getContext('2d'), {
      type: 'pie',
      data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
    });
    genderChart = new Chart(document.getElementById('genderChart').getContext('2d'), {
      type: 'bar',
      data: { labels: [], datasets: [{ label: '', data: [], backgroundColor: [] }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } } }
    });
    businessChart = new Chart(document.getElementById('businessChart').getContext('2d'), {
      type: 'bar',
      data: { labels: [], datasets: [{ label: '', data: [], backgroundColor: [] }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } } }
    });
    updateCharts();
  }

  function updateCharts() {
    var regions = {}, sectors = {}, gender = {}, business = {};
    allSubmissions.forEach(function (sub) {
      if (sub.mkoa) regions[sub.mkoa] = (regions[sub.mkoa] || 0) + 1;
      if (sub.sekta) sectors[sub.sekta] = (sectors[sub.sekta] || 0) + 1;
      if (sub.jinsia) gender[sub.jinsia] = (gender[sub.jinsia] || 0) + 1;
      if (sub.hali_biashara) business[sub.hali_biashara] = (business[sub.hali_biashara] || 0) + 1;
    });
    var colors = {
      regions: ['#0B6E4F', '#1E6BB8', '#D4A017', '#063C2C', '#164C82', '#B8860B', '#128A64', '#4B5B54'],
      sectors: ['#0B6E4F', '#1E6BB8', '#D4A017', '#063C2C', '#164C82', '#B8860B', '#128A64'],
      gender: ['#0B6E4F', '#D4A017', '#1E6BB8'],
      business: ['#0B6E4F', '#D4A017', '#1E6BB8', '#B3261E']
    };
    regionsChart.data.labels = Object.keys(regions);
    regionsChart.data.datasets[0].data = Object.values(regions);
    regionsChart.data.datasets[0].backgroundColor = colors.regions.slice(0, Object.keys(regions).length);
    regionsChart.update();
    sectorsChart.data.labels = Object.keys(sectors);
    sectorsChart.data.datasets[0].data = Object.values(sectors);
    sectorsChart.data.datasets[0].backgroundColor = colors.sectors.slice(0, Object.keys(sectors).length);
    sectorsChart.update();
    genderChart.data.labels = Object.keys(gender).map(function (g) {
      return g === 'Me' ? 'Me (Male)' : g === 'Ke' ? 'Ke (Female)' : g;
    });
    genderChart.data.datasets[0].data = Object.values(gender);
    genderChart.data.datasets[0].backgroundColor = colors.gender.slice(0, Object.keys(gender).length);
    genderChart.update();
    businessChart.data.labels = Object.keys(business);
    businessChart.data.datasets[0].data = Object.values(business);
    businessChart.data.datasets[0].backgroundColor = colors.business.slice(0, Object.keys(business).length);
    businessChart.update();
  }

  // --- PERCENTAGE BREAKDOWN ---
  function renderPercentageBreakdowns(submissions) {
    var total = submissions.length;
    if (total === 0) return;
    function buildBreakdown(data, field, limit) {
      var counts = {};
      data.forEach(function (s) {
        var value = s[field] || 'Haijatajwa';
        counts[value] = (counts[value] || 0) + 1;
      });
      var entries = Object.entries(counts).sort(function (a, b) { return b[1] - a[1]; });
      if (limit) entries = entries.slice(0, limit);
      return entries.map(function (entry) {
        var label = entry[0], count = entry[1];
        var pct = ((count / total) * 100).toFixed(1);
        var pctNum = parseFloat(pct);
        var barColor = pctNum > 50 ? 'var(--green-700)' : pctNum > 20 ? 'var(--gold-500)' : 'var(--danger)';
        return '<div style="margin-bottom:10px;">' +
          '<div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">' +
          '<span style="font-weight:600;">' + label + '</span>' +
          '<span style="color:var(--ink-soft);">' + count + ' <strong style="color:' + barColor + ';">(' + pct + '%)</strong></span></div>' +
          '<div style="background:var(--line); height:6px; border-radius:3px; overflow:hidden;">' +
          '<div style="background:' + barColor + '; height:100%; width:' + pct + '%; border-radius:3px;"></div></div></div>';
      }).join('');
    }
    document.getElementById('genderBreakdown').innerHTML = buildBreakdown(submissions, 'jinsia');
    document.getElementById('businessBreakdown').innerHTML = buildBreakdown(submissions, 'hali_biashara');
    document.getElementById('regionsBreakdown').innerHTML = buildBreakdown(submissions, 'mkoa', 5);
    document.getElementById('sectorsBreakdown').innerHTML = buildBreakdown(submissions, 'sekta', 5);
  }

  // --- EXPORT PNG ---
  window.exportDashboardImage = async function () {
    var exportBtn = document.getElementById('exportBtn');
    var originalText = exportBtn.innerHTML;
    exportBtn.innerHTML = '<span class="lang-sw">Inapakua...</span><span class="lang-en">Generating...</span>';
    exportBtn.disabled = true;
    try {
      var exportHeader = document.getElementById('exportHeader');
      document.getElementById('exportDate').textContent = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
      exportHeader.style.display = 'block';
      await new Promise(function (resolve) { setTimeout(resolve, 300); });
      var canvas = await html2canvas(document.getElementById('dashboardExportArea'), {
        scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: true
      });
      exportHeader.style.display = 'none';
      canvas.toBlob(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'Nanenane_2026_Dashboard_' + new Date().toISOString().split('T')[0] + '.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png', 0.95);
    } catch (error) {
      console.error('[ERROR] Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      exportBtn.innerHTML = originalText;
      exportBtn.disabled = false;
    }
  };

  // Initialize
  console.log("[INIT] Admin app starting...");
  setLang("sw");
  checkAuth();
})();
