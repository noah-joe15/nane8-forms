// =====================================================
// TANTRADE 2026 - UNIFIED ADMIN DASHBOARD (FULL MERGED)
// =====================================================

// 1. SUPABASE INITIALIZATION
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
  } catch (err) { console.error("[ERROR] Failed to create Supabase client:", err); }
})();

// 2. GLOBAL VARIABLES & CORE LOGIC
(function () {
  "use strict";
  let activeForm = 'nanenane'; // 'nanenane' or 'wadau-malighafi'
  var allSubmissions = [];
  var allQuestions = [];
  var chartsInitialized = false;
  var regionsChart, sectorsChart, genderChart, businessChart;

  var SVG_EDIT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>';
  var SVG_TRASH = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

  window.onerror = function (msg, url, line, col, error) {
    console.error("[GLOBAL ERROR]", msg, "at", url + ":" + line + ":" + col);
    return false;
  };

  const COLOR_PALETTE = [
    '#0B6E4F','#128A64','#063C2C','#1A7A5C','#0D5A3F','#148B6A','#0A4F38','#1B9A75','#074028','#1DAB80',
    '#0E6B50','#1FBC8B','#0B7855','#22CD96','#0C8560','#25DEA1','#0D926B','#28EFAC','#0EA076','#2BFFB7',
    '#164C82','#1E6BB8','#0E2A4A','#2585D6','#124070','#2CA0F4','#1A5A9E','#33BBFF','#163F6F','#3AD6FF',
    '#1D6FAD','#41F1FF','#184E7B','#48FFD1','#1F7EC9','#4FFFA3','#165EA7','#56FFD5','#1C8ED5','#5DFFA7',
    '#D4A017','#E9C766','#B8860B','#F5D87A','#9E720A','#FFE98E','#C49612','#FFFB9C','#B0850F','#FFF7AA',
    '#DCAC1A','#FFED8E','#C89D15','#FFE372','#B48E12','#B3261E','#E85D4A','#8B1A14','#FF7F6B','#9F2319',
    '#FFA58E','#C73E34','#FFC9B2','#AF2A21','#FFEDD6','#D75248','#FFB399','#BF3930','#FFD7BF','#A7251D',
    '#6B46C1','#9F7AEA','#553C9A','#B794F4','#4C3586','#D6BCFA','#7C52D4','#E9D8FD','#6842A8','#F3E8FF',
    '#8461E0','#C4B5FD','#7050B4','#DDD6FE','#5C3F98','#EC4899','#F9A8D4','#DB2777','#FBCFE8','#BE185D',
    '#FDF2F8','#F472B6','#FCE7F3','#FFF1F2','#14B8A6','#5EEAD4','#0F766E','#99F6E4','#115E59','#CCFBF1',
    '#2DD4BF','#A7F3D0','#0D9488','#D1FAE5','#92400E','#D97706','#78350F','#F59E0B','#FCD34D','#B45309',
    '#FDE68A','#A16207','#FEF3C7','#374151','#6B7280','#4B5563','#9CA3AF'
  ];
  function getChartColors(count) {
    var colors = [];
    for (var i = 0; i < count; i++) colors.push(COLOR_PALETTE[i % COLOR_PALETTE.length]);
    return colors;
  }

  // 3. LANGUAGE SWITCHING
  window.setLang = function (l) {
    try {
      document.body.classList.remove("lang-sw", "lang-en");
      document.body.classList.add("lang-" + l);
      document.getElementById("btn-lang-sw").classList.toggle("active", l === "sw");
      document.getElementById("btn-lang-en").classList.toggle("active", l === "en");
    } catch (err) { console.error("[ERROR] setLang:", err); }
  };

  // 4. AUTHENTICATION
  async function checkAuth() {
    try {
      if (typeof supabaseClient === "undefined") throw new Error("supabaseClient is undefined");
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (error) throw error;
      if (session) { showDashboard(); } else { showLogin(); }
    } catch (err) { console.error("[ERROR] Auth check failed:", err); showLogin(); }
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
        loginError.style.display = "block";
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span class="lang-sw">Ingia</span><span class="lang-en">Sign In</span>';
      } else { showDashboard(); }
    } catch (err) {
      alert("Login failed: " + err.message);
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<span class="lang-sw">Ingia</span><span class="lang-en">Sign In</span>';
    }
    return false;
  };

  window.handleLogout = async function () {
    try { await supabaseClient.auth.signOut(); } catch (err) {}
    showLogin();
  };

  function showLogin() {
    document.getElementById("loginView").style.display = "block";
    document.getElementById("dashboardView").style.display = "none";
    document.getElementById("logoutBtn").style.display = "none";
    document.getElementById("loginForm").reset();
    document.getElementById("loginBtn").disabled = false;
    document.getElementById("loginBtn").innerHTML = '<span class="lang-sw">Ingia</span><span class="lang-en">Sign In</span>';
  }

  function showDashboard() {
    document.getElementById("loginView").style.display = "none";
    document.getElementById("dashboardView").style.display = "block";
    document.getElementById("logoutBtn").style.display = "inline-block";
    loadSubmissions();
    loadQuestions();
  }

  // 5. FORM SWITCHING & TABS
  window.switchForm = function(formType) {
    activeForm = formType;
    var dynLabel = document.getElementById("statDynamicLabel");
    var kpiDynLabel = document.getElementById("kpiDynamicLabel");
    var reportBtn = document.getElementById("generateReportBtn");
    
    if (activeForm === 'nanenane') {
      if(dynLabel) dynLabel.innerHTML = '<span class="lang-sw">Hawajasajiliwa (MIT)</span><span class="lang-en">Unregistered (MIT)</span>';
      if(kpiDynLabel) kpiDynLabel.innerHTML = '<span class="lang-sw">Hawajasajiliwa</span><span class="lang-en">Unregistered</span>';
      if(reportBtn) reportBtn.style.display = 'none';
    } else {
      if(dynLabel) dynLabel.innerHTML = '<span class="lang-sw">Wanaouza Ghafi (0%)</span><span class="lang-en">Selling Raw (0%)</span>';
      if(kpiDynLabel) kpiDynLabel.innerHTML = '<span class="lang-sw">Wanaouza Ghafi</span><span class="lang-en">Selling Raw</span>';
      if(reportBtn) reportBtn.style.display = 'inline-flex';
    }
    loadSubmissions();
    loadQuestions();
  };

  window.switchTab = function (tab, btn) {
    try {
      document.getElementById("responsesTab").style.display = tab === "responses" ? "block" : "none";
      document.getElementById("kpiTab").style.display = tab === "kpi" ? "block" : "none";
      document.getElementById("questionsTab").style.display = tab === "questions" ? "block" : "none";
      document.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("active"); });
      if (btn) btn.classList.add("active");
      if (tab === "questions") loadQuestions();
      if (tab === "kpi") renderKPICharts();
    } catch (err) { console.error("[ERROR] switchTab:", err); }
  };

  // 6. DATA LOADING & RENDERING
  window.loadSubmissions = async function () {
    var holder = document.getElementById("tableHolder");
    holder.innerHTML = '<div class="state-msg"><span class="lang-sw">Inapakia majibu…</span><span class="lang-en">Loading responses…</span></div>';
    try {
      const tableName = activeForm === 'nanenane' ? 'nanenane_responses' : 'wadau_malighafi_responses';
      console.log("[INFO] Active form:", activeForm, "| Table:", tableName);
      const { data, error } = await supabaseClient.from(tableName).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      allSubmissions = (data || []).map(function (sub) {
        var fields = sub.form_data || {};
        if (!fields.submitted_at && sub.created_at) fields.submitted_at = sub.created_at;
        return fields;
      }).filter(function (sub) {
        var keys = Object.keys(sub).filter(function (k) { return k !== "submitted_at" && k !== "created_at"; });
        return keys.length > 0;
      });
      updateStats();
      renderTable();
      renderPercentageBreakdowns(allSubmissions);
      renderKPICharts();
    } catch (err) {
      holder.innerHTML = '<div class="state-msg" style="color:var(--danger)">Hitilafu: ' + err.message + '</div>';
    }
  };

  function updateStats() {
    try {
      var t = document.getElementById("statTotal"), r = document.getElementById("statRegions"),
          d = document.getElementById("statDistricts"), dyn = document.getElementById("statDynamic");
      if (t) t.textContent = allSubmissions.length;
      var regions = new Set(), districts = new Set();
      var dynamicCount = 0;
      
      allSubmissions.forEach(function (sub) {
        if (sub.mkoa) regions.add(String(sub.mkoa).trim().toLowerCase());
        if (sub.wilaya) districts.add(String(sub.wilaya).trim().toLowerCase());
        
        if (activeForm === 'nanenane') {
          var v = String(sub.bidhaa_zimesajiliwa || "").trim().toLowerCase();
          if (v.indexOf("hapana") !== -1 || v.indexOf("sijui") !== -1) dynamicCount++;
        } else {
          if (String(sub.asilimia_thamani || "").includes("0%")) dynamicCount++;
        }
      });
      
      if (r) r.textContent = regions.size;
      if (d) d.textContent = districts.size;
      if (dyn) dyn.textContent = dynamicCount;
    } catch (err) { console.error("[ERROR] updateStats:", err); }
  }

  window.renderTable = function () {
    try {
      var query = (document.getElementById("searchInput").value || "").toLowerCase();
      var rows = allSubmissions.filter(function (sub) {
        if (!query) return true;
        return Object.values(sub).some(function (v) { return String(v).toLowerCase().includes(query); });
      });
      document.getElementById("countPill").innerHTML = rows.length + ' <span class="lang-sw">majibu</span><span class="lang-en">responses</span>';
      renderGenericTable(rows, "tableHolder");
    } catch (err) { console.error("[ERROR] renderTable:", err); }
  };

  function renderGenericTable(rows, holderId) {
    var holder = document.getElementById(holderId);
    if (!rows.length) {
      holder.innerHTML = '<div class="state-msg"><span class="lang-sw">Hakuna majibu.</span><span class="lang-en">No responses.</span></div>';
      return;
    }
    var allKeys = new Set();
    rows.forEach(function (sub) { Object.keys(sub).forEach(function (k) { if (k !== "form-name" && k !== "bot-field") allKeys.add(k); }); });
    
    var priorityCols = activeForm === 'nanenane'
      ? ["jina_la_kampuni","tin_number","anwani_kampuni","submitted_at","respondent_name","respondent_phone","respondent_email","mkoa","wilaya"]
      : ["mkoa","wilaya","jina_mhojiwa","taasisi","tin_number","bidhaa[]","asilimia_thamani","submitted_at"];
      
    var cols = Array.from(allKeys).sort(function (a, b) {
      var ia = priorityCols.indexOf(a), ib = priorityCols.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
    
    var html = '<table><thead><tr>' + cols.map(function (c) { return '<th>' + c.replace(/_/g, " ").replace(/\[\]/g, "") + '</th>'; }).join("") + '</tr></thead><tbody>';
    rows.forEach(function (sub) {
      html += '<tr>' + cols.map(function (c) {
        var val = sub[c];
        return '<td>' + (Array.isArray(val) ? val.join(", ") : (val || "")) + '</td>';
      }).join("") + '</tr>';
    });
    holder.innerHTML = '<div class="table-wrap">' + html + '</tbody></table></div>';
  }

  window.exportCsv = function () {
    var rows = allSubmissions;
    if (!rows.length) { alert("Hakuna majibu"); return; }
    var allKeys = new Set();
    rows.forEach(function (sub) { Object.keys(sub).forEach(function (k) { if (k !== "form-name" && k !== "bot-field") allKeys.add(k); }); });
    
    var priorityCols = activeForm === 'nanenane'
      ? ["jina_la_kampuni","tin_number","anwani_kampuni","submitted_at","respondent_name","respondent_phone","respondent_email","mkoa","wilaya"]
      : ["mkoa","wilaya","jina_mhojiwa","taasisi","tin_number","bidhaa[]","asilimia_thamani","submitted_at"];
      
    var cols = Array.from(allKeys).sort(function (a, b) {
      var ia = priorityCols.indexOf(a), ib = priorityCols.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
    
    var lines = [cols.join(",")].concat(rows.map(function (sub) {
      return cols.map(function (c) {
        var val = sub[c];
        return '"' + String(Array.isArray(val) ? val.join(", ") : (val || "")).replace(/"/g, '""') + '"';
      }).join(",");
    }));
    var blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    var a = document.createElement("a"); 
    a.href = URL.createObjectURL(blob); 
    a.download = "majibu-" + activeForm + "-" + new Date().toISOString().split('T')[0] + ".csv"; 
    a.click();
  };

  // 7. QUESTIONS MANAGEMENT
  window.loadQuestions = async function () {
    var holder = document.getElementById("questionsHolder");
    try {
      const { data, error } = await supabaseClient.from('survey_questions')
        .select('*')
        .eq('form_type', activeForm)
        .order('step_number', { ascending: true })
        .order('sort_order', { ascending: true });
      if (error) throw error;
      allQuestions = data || [];
      renderQuestions();
    } catch (err) {
      holder.innerHTML = '<div class="state-msg" style="color:var(--danger)">Hitilafu: ' + err.message + '</div>';
    }
  };

  window.renderQuestions = function () {
    var holder = document.getElementById("questionsHolder");
    var pill = document.getElementById("qCountPill");
    if (pill) pill.textContent = allQuestions.length;
    if (!allQuestions.length) {
      holder.innerHTML = '<div class="state-msg"><span class="lang-sw">Hakuna maswali bado.</span><span class="lang-en">No questions yet.</span></div>';
      return;
    }
    var typeMap = { text: 'Text', textarea: 'Textarea', radio: 'Radio', checkbox: 'Checkbox' };
    var html = '';
    allQuestions.forEach(function (q) {
      html += '<div class="q-card">' +
        '<div class="q-card-body">' +
          '<div class="q-badges">' +
            '<span class="q-badge step">Step ' + q.step_number + '</span>' +
            '<span class="q-badge type">' + (typeMap[q.input_type] || q.input_type) + '</span>' +
            (q.is_required ? '<span class="q-badge req">Required</span>' : '<span class="q-badge opt">Optional</span>') +
          '</div>' +
          '<div class="q-title">' + q.label_sw + ' <span class="en">/ ' + q.label_en + '</span></div>' +
          '<div class="q-meta"><code>' + q.field_name + '</code> · Sort ' + q.sort_order + (q.options && q.options.length ? ' · ' + q.options.length + ' options' : '') + '</div>' +
        '</div>' +
        '<div class="q-card-actions">' +
          '<button class="q-icon-btn" title="Edit" onclick=\'editQuestion(' + JSON.stringify(q).replace(/'/g, "&#39;") + ')\'>' + SVG_EDIT + '</button>' +
          '<button class="q-icon-btn del" title="Delete" onclick="deleteQuestion(\'' + q.id + '\')">' + SVG_TRASH + '</button>' +
        '</div>' +
      '</div>';
    });
    holder.innerHTML = html;
  };

  window.toggleOptions = function () {
    document.getElementById("optionsField").style.display = (document.getElementById("q_type").value === "radio" || document.getElementById("q_type").value === "checkbox") ? "block" : "none";
  };

  window.saveQuestion = async function (e) {
    e.preventDefault();
    var id = document.getElementById("q_id").value;
    var payload = {
      form_type: activeForm,
      step_number: parseInt(document.getElementById("q_step").value),
      field_name: document.getElementById("q_field").value.trim(),
      label_sw: document.getElementById("q_label_sw").value.trim(),
      label_en: document.getElementById("q_label_en").value.trim(),
      input_type: document.getElementById("q_type").value,
      is_required: document.getElementById("q_required").checked,
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
    } catch (err) { alert("Hitilafu: " + err.message); }
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
    document.getElementById("q_required").checked = !!q.is_required;
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
    document.getElementById("q_required").checked = true;
    toggleOptions();
  };

  // 8. KPI & CHARTS
  function kpiTabVisible() { var el = document.getElementById("kpiTab"); return !!el && el.style.display !== "none"; }
  function resizeAllCharts() { [regionsChart, sectorsChart, genderChart, businessChart].forEach(function (c) { if (c) c.resize(); }); }

  function renderKPICharts() {
    try {
      var kt = document.getElementById("kpiTotal"), ku = document.getElementById("kpiDynamic"), kc = document.getElementById("kpiCompletion");
      if (kt) kt.textContent = allSubmissions.length;
      
      var dynamicCount = 0;
      allSubmissions.forEach(function (sub) {
        if (activeForm === 'nanenane') {
          var v = String(sub.bidhaa_zimesajiliwa || "").trim().toLowerCase();
          if (v.indexOf("hapana") !== -1 || v.indexOf("sijui") !== -1) dynamicCount++;
        } else {
          if (String(sub.asilimia_thamani || "").includes("0%")) dynamicCount++;
        }
      });
      if (ku) ku.textContent = dynamicCount;
      
      var complete = allSubmissions.filter(function (s) { return (s.respondent_name || s.jina_mhojiwa) && s.mkoa; }).length;
      var rate = allSubmissions.length > 0 ? Math.round((complete / allSubmissions.length) * 100) : 0;
      if (kc) kc.textContent = rate + "%";
      
      if (kpiTabVisible() && typeof Chart !== "undefined") {
        if (!chartsInitialized) { initCharts(); chartsInitialized = true; } else { updateCharts(); }
        setTimeout(resizeAllCharts, 60);
      }
    } catch (err) { console.error("[ERROR] renderKPICharts:", err); }
  }

  function initCharts() {
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    Chart.defaults.color = '#4B5B54';
    regionsChart = new Chart(document.getElementById('regionsChart').getContext('2d'), { type: 'pie', data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] }, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } } });
    sectorsChart = new Chart(document.getElementById('sectorsChart').getContext('2d'), { type: 'pie', data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] }, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } } });
    genderChart = new Chart(document.getElementById('genderChart').getContext('2d'), { type: 'bar', data: { labels: [], datasets: [{ label: '', data: [], backgroundColor: [] }] }, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } } } });
    businessChart = new Chart(document.getElementById('businessChart').getContext('2d'), { type: 'bar', data: { labels: [], datasets: [{ label: '', data: [], backgroundColor: [] }] }, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } } } });
    updateCharts();
  }

  function updateCharts() {
    var regions = {}, sectors = {}, gender = {}, business = {};
    allSubmissions.forEach(function (sub) {
      if (sub.mkoa) regions[sub.mkoa] = (regions[sub.mkoa] || 0) + 1;
      var sectorVal = sub.sekta || (Array.isArray(sub['bidhaa[]']) ? sub['bidhaa[]'].join(', ') : sub['bidhaa[]']);
      if (sectorVal) sectors[sectorVal] = (sectors[sectorVal] || 0) + 1;
      
      if (sub.jinsia) gender[sub.jinsia] = (gender[sub.jinsia] || 0) + 1;
      if (sub.hali_biashara) business[sub.hali_biashara] = (business[sub.hali_biashara] || 0) + 1;
    });
    
    regionsChart.data.labels = Object.keys(regions);
    regionsChart.data.datasets[0].data = Object.values(regions);
    regionsChart.data.datasets[0].backgroundColor = getChartColors(Object.keys(regions).length);
    regionsChart.update();
    
    sectorsChart.data.labels = Object.keys(sectors);
    sectorsChart.data.datasets[0].data = Object.values(sectors);
    sectorsChart.data.datasets[0].backgroundColor = getChartColors(Object.keys(sectors).length);
    sectorsChart.update();
    
    genderChart.data.labels = Object.keys(gender).map(function (g) { return g === 'Me' ? 'Me (Male)' : g === 'Ke' ? 'Ke (Female)' : g; });
    genderChart.data.datasets[0].data = Object.values(gender);
    genderChart.data.datasets[0].backgroundColor = getChartColors(Object.keys(gender).length);
    genderChart.update();
    
    businessChart.data.labels = Object.keys(business);
    businessChart.data.datasets[0].data = Object.values(business);
    businessChart.data.datasets[0].backgroundColor = getChartColors(Object.keys(business).length);
    businessChart.update();
  }

  function renderPercentageBreakdowns(submissions) {
    var total = submissions.length;
    if (total === 0) return;
    function buildBreakdown(data, field, limit) {
      var counts = {};
      data.forEach(function (s) { 
        var v = s[field]; 
        if (Array.isArray(v)) v = v.join(', ');
        v = v || 'Haijatajwa'; 
        counts[v] = (counts[v] || 0) + 1; 
      });
      var entries = Object.entries(counts).sort(function (a, b) { return b[1] - a[1]; });
      if (limit) entries = entries.slice(0, limit);
      return entries.map(function (en) {
        var label = en[0], count = en[1];
        var pct = ((count / total) * 100).toFixed(1);
        var barColor = parseFloat(pct) > 50 ? 'var(--green-700)' : parseFloat(pct) > 20 ? 'var(--gold-500)' : 'var(--danger)';
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
    document.getElementById('sectorsBreakdown').innerHTML = buildBreakdown(submissions, activeForm === 'nanenane' ? 'sekta' : 'bidhaa[]', 5);
  }

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
      var canvas = await html2canvas(document.getElementById('dashboardExportArea'), { scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: true });
      exportHeader.style.display = 'none';
      canvas.toBlob(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'TanTrade_Dashboard_' + activeForm + '_' + new Date().toISOString().split('T')[0] + '.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png', 0.95);
    } catch (error) {
      alert('Export failed. Please try again.');
    } finally {
      exportBtn.innerHTML = originalText;
      exportBtn.disabled = false;
    }
  };

// =====================================================
// 9. MODERN PDF REPORT GENERATION (WADAU MALIGHAFI)
// =====================================================

// --- Brand Colors ---
var BRAND = {
  blue: [11, 61, 145],        // #0B3D91 - Primary Blue
  blueDark: [6, 40, 100],     // #062864 - Dark Blue
  blueLight: [230, 240, 255], // #E6F0FF - Light Blue
  green: [0, 104, 71],        // #006847 - Primary Green
  greenDark: [0, 60, 40],     // #003C28 - Dark Green
  greenLight: [220, 245, 235],// #DCF5EB - Light Green
  gold: [212, 160, 23],       // #D4A017 - Accent Gold
  goldLight: [255, 248, 220], // #FFF8DC
  white: [255, 255, 255],
  black: [31, 41, 55],        // #1F2937 - Text
  gray: [107, 114, 128],      // #6B7280 - Muted
  grayLight: [243, 244, 246], // #F3F4F6
  red: [220, 38, 38],         // #DC2626 - Critical
  redLight: [254, 226, 226],  // #FEE2E2
  amber: [217, 119, 6],       // #D97706 - Warning
  amberLight: [254, 243, 199] // #FEF3C7
};

// --- Helper: Draw gradient rectangle ---
function drawGradientRect(doc, x, y, w, h, colorTop, colorBottom) {
  var steps = 20;
  var stepH = h / steps;
  for (var i = 0; i < steps; i++) {
    var t = i / (steps - 1);
    var r = Math.round(colorTop[0] + (colorBottom[0] - colorTop[0]) * t);
    var g = Math.round(colorTop[1] + (colorBottom[1] - colorTop[1]) * t);
    var b = Math.round(colorTop[2] + (colorBottom[2] - colorTop[2]) * t);
    doc.setFillColor(r, g, b);
    doc.rect(x, y + i * stepH, w, stepH + 1, 'F');
  }
}

// --- Helper: Draw KPI Card ---
function drawKpiCard(doc, x, y, w, h, value, label, icon, color) {
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, h, 3, 3, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 3, 3, 'S');
  
  // Accent bar on top
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(x, y, w, 2, 'F');
  
  // Icon circle
  doc.setFillColor(color[0], color[1], color[2]);
  doc.circle(x + 10, y + 14, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(icon, x + 10, y + 16, { align: 'center' });
  
  // Value
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(String(value), x + w / 2, y + 22, { align: 'center' });
  
  // Label
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  var labelLines = doc.splitTextToSize(label, w - 6);
  doc.text(labelLines, x + w / 2, y + 30, { align: 'center' });
}

// --- Helper: Draw Insight Box ---
function drawInsightBox(doc, x, y, w, type, category, text) {
  var colors = {
    critical: { bg: BRAND.redLight, accent: BRAND.red, text: BRAND.red },
    warning: { bg: BRAND.amberLight, accent: BRAND.amber, text: BRAND.amber },
    success: { bg: BRAND.greenLight, accent: BRAND.green, text: BRAND.green },
    info: { bg: BRAND.blueLight, accent: BRAND.blue, text: BRAND.blue }
  };
  var c = colors[type] || colors.info;
  var boxH = 18;
  
  doc.setFillColor(c.bg[0], c.bg[1], c.bg[2]);
  doc.roundedRect(x, y, w, boxH, 2, 2, 'F');
  
  doc.setFillColor(c.accent[0], c.accent[1], c.accent[2]);
  doc.rect(x, y, 1.5, boxH, 'F');
  
  doc.setTextColor(c.text[0], c.text[1], c.text[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(category.toUpperCase(), x + 5, y + 5);
  
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  var lines = doc.splitTextToSize(text, w - 10);
  doc.text(lines, x + 5, y + 11);
  
  return boxH + 3;
}

// --- Helper: Draw Section Header ---
function drawSectionHeader(doc, y, number, title, subtitle) {
  var margin = 15;
  var pageWidth = doc.internal.pageSize.getWidth();
  
  // Accent line
  doc.setFillColor(BRAND.green[0], BRAND.green[1], BRAND.green[2]);
  doc.rect(margin, y, 4, 12, 'F');
  
  // Number
  doc.setTextColor(BRAND.green[0], BRAND.green[1], BRAND.green[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text(number, margin + 8, y + 9);
  
  // Title
  doc.setTextColor(BRAND.blueDark[0], BRAND.blueDark[1], BRAND.blueDark[2]);
  doc.setFontSize(16);
  doc.text(title, margin + 22, y + 8);
  
  // Subtitle
  if (subtitle) {
    doc.setTextColor(BRAND.gray[0], BRAND.gray[1], BRAND.gray[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(subtitle, margin + 22, y + 14);
  }
  
  // Divider line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 18, pageWidth - margin, y + 18);
  
  return y + 24;
}

// --- Helper: Draw Recommendation Card (FIXED & NO EMOJIS) ---
function drawRecommendationCard(doc, x, y, w, idx, category, action, impact, timeline) {
  var impactColors = {
    'High': BRAND.red,
    'Medium': BRAND.amber,
    'Low': BRAND.green
  };
  var impactColor = impactColors[impact] || BRAND.gray;
  
  // Increased card height for better spacing
  var cardH = 42;
  
  // Card background with subtle shadow effect
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, cardH, 3, 3, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, w, cardH, 3, 3, 'S');
  
  // Left accent bar
  doc.setFillColor(BRAND.blue[0], BRAND.blue[1], BRAND.blue[2]);
  doc.rect(x, y, 3, cardH, 'F');
  
  // Number badge - properly positioned
  doc.setFillColor(BRAND.blue[0], BRAND.blue[1], BRAND.blue[2]);
  doc.circle(x + 14, y + 12, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(String(idx), x + 14, y + 14, { align: 'center' });
  
  // Category - moved right to avoid overlap
  doc.setTextColor(BRAND.blue[0], BRAND.blue[1], BRAND.blue[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(category.toUpperCase(), x + 26, y + 9);
  
  // Impact badge - properly positioned on the right
  var badgeW = 24;
  var badgeH = 9;
  var badgeX = x + w - badgeW - 5;
  doc.setFillColor(impactColor[0], impactColor[1], impactColor[2]);
  doc.roundedRect(badgeX, y + 5, badgeW, badgeH, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(impact.toUpperCase(), badgeX + badgeW / 2, y + 11, { align: 'center' });
  
  // Action text - with proper spacing and multi-line support
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  var actionLines = doc.splitTextToSize(action, w - 70);
  doc.text(actionLines, x + 26, y + 18);
  
  // Timeline - positioned at bottom with a clean VECTOR clock icon (NO EMOJIS)
  doc.setTextColor(BRAND.gray[0], BRAND.gray[1], BRAND.gray[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  // Draw simple vector clock icon
  var clockCx = x + 32;
  var clockCy = y + cardH - 8;
  var clockR = 3.5;
  doc.setDrawColor(BRAND.gray[0], BRAND.gray[1], BRAND.gray[2]);
  doc.setLineWidth(0.4);
  doc.circle(clockCx, clockCy, clockR, 'S');       // Clock face
  doc.line(clockCx, clockCy, clockCx, clockCy - 1.8); // Hour hand (pointing up)
  doc.line(clockCx, clockCy, clockCx + 1.8, clockCy); // Minute hand (pointing right)
  
  // Timeline text
  doc.text('Timeline: ' + timeline, x + 40, y + cardH - 6);
  
  return cardH + 5;
}

// --- Smart Recommendations Engine ---
function generateSmartRecommendations(data) {
  var recommendations = [];
  var insights = [];
  var sellingRaw = data.filter(function(r) { return r.asilimia_thamani && r.asilimia_thamani.includes('0%'); }).length;
  var totalResponses = data.length;
  var sellingRawPercentage = totalResponses > 0 ? (sellingRaw / totalResponses * 100).toFixed(1) : 0;
  
  if (parseFloat(sellingRawPercentage) > 60) {
    insights.push({ type: 'critical', category: 'Raw Export Alert', text: sellingRawPercentage + '% of stakeholders sell raw materials without value addition. This is critically high and indicates systemic underdevelopment of local processing capacity.' });
    recommendations.push({ category: 'Policy & Regulation', action: 'Implement mandatory local processing requirements before export permits are issued for priority commodities.', impact: 'High', timeline: '6-12 months' });
    recommendations.push({ category: 'Industrial Development', action: 'Establish processing zones in producing regions with tax incentives and infrastructure support.', impact: 'High', timeline: '1-3 years' });
  } else if (parseFloat(sellingRawPercentage) > 30) {
    insights.push({ type: 'warning', category: 'Processing Gap', text: sellingRawPercentage + '% of products are still sold raw. Significant room exists to improve domestic processing capacity.' });
  } else {
    insights.push({ type: 'success', category: 'Processing Performance', text: 'Only ' + sellingRawPercentage + '% of products are sold raw. Domestic processing industries are performing well.' });
  }
  
  var underutilized = data.filter(function(r) { return r.sababu_kutotumia_ukomo && r.sababu_kutotumia_ukomo.length > 0; }).length;
  if (underutilized > totalResponses * 0.4) {
    insights.push({ type: 'critical', category: 'Factory Utilization', text: 'Over ' + underutilized + ' factories are underutilizing their production capacity, indicating supply chain bottlenecks.' });
    recommendations.push({ category: 'Investment', action: 'Improve raw material supply chains to existing factories through contract farming and aggregation centers.', impact: 'High', timeline: '3-6 months' });
  }
  
  var infraIssues = data.filter(function(r) { return r.hali_miundombinu && (r.hali_miundombinu === 'Mbaya' || r.hali_miundombinu === 'Mbaya sana'); }).length;
  if (infraIssues > totalResponses * 0.3) {
    insights.push({ type: 'warning', category: 'Infrastructure Deficit', text: infraIssues + ' stakeholders report poor infrastructure, hindering efficient value chain operations.' });
    recommendations.push({ category: 'Infrastructure', action: 'Prioritize road networks, reliable electricity, and modern storage facilities in key production corridors.', impact: 'Medium', timeline: '2-5 years' });
  }
  
  var financeIssues = data.filter(function(r) { return r.vikwazo_fedha && r.vikwazo_fedha.includes('Riba kubwa'); }).length;
  if (financeIssues > totalResponses * 0.5) {
    insights.push({ type: 'critical', category: 'Financing Constraints', text: 'Over ' + financeIssues + ' stakeholders cite high interest rates as a major barrier to expansion and processing investment.' });
    recommendations.push({ category: 'Financial Services', action: 'Establish a dedicated value-addition fund offering subsidized loans (8-10% interest) for processors and manufacturers.', impact: 'High', timeline: '6-12 months' });
  }
  
  var regions = {};
  data.forEach(function(r) { if (r.mkoa) regions[r.mkoa] = (regions[r.mkoa] || 0) + 1; });
  var regionCount = Object.keys(regions).length;
  if (regionCount < 5) {
    insights.push({ type: 'warning', category: 'Geographic Coverage', text: 'Data collected from only ' + regionCount + ' region(s). Broader geographic coverage needed for comprehensive analysis.' });
  } else {
    insights.push({ type: 'success', category: 'Geographic Reach', text: 'Data collected from ' + regionCount + ' regions, providing solid geographic representation.' });
  }
  
  var commodities = {};
  data.forEach(function(r) {
    if (r['bidhaa[]']) {
      var bids = Array.isArray(r['bidhaa[]']) ? r['bidhaa[]'] : [r['bidhaa[]']];
      bids.forEach(function(b) { commodities[b] = (commodities[b] || 0) + 1; });
    }
  });
  var topCommodity = Object.keys(commodities).reduce(function(a, b) { return commodities[a] > commodities[b] ? a : b; }, '');
  if (topCommodity && commodities[topCommodity] > totalResponses * 0.4) {
    insights.push({ type: 'info', category: 'Commodity Focus', text: topCommodity + ' is the dominant commodity (' + commodities[topCommodity] + ' responses), suggesting targeted interventions may yield highest impact.' });
  }
  
  recommendations.push({ category: 'Research & Development', action: 'Conduct comprehensive value chain analysis for each priority commodity to identify specific intervention points.', impact: 'Medium', timeline: '12-18 months' });
  recommendations.push({ category: 'Capacity Building', action: 'Launch training programs on processing technology, quality standards, and business management for stakeholders.', impact: 'Medium', timeline: '3-6 months' });
  
  return {
    insights: insights,
    recommendations: recommendations,
    statistics: {
      totalResponses: totalResponses,
      sellingRawPercentage: sellingRawPercentage,
      topCommodity: topCommodity,
      regionCount: regionCount,
      underutilizedFactories: underutilized,
      commodities: commodities
    }
  };
}

function categorizeResponses(data) {
  var categories = { byRegion: {}, byCommodity: {}, byStakeholderType: {}, byBusinessScale: {}, byExportInvolvement: {}, byProcessingLevel: {} };
  data.forEach(function(r) {
    if (r.mkoa) categories.byRegion[r.mkoa] = (categories.byRegion[r.mkoa] || 0) + 1;
    if (r['bidhaa[]']) {
      var bids = Array.isArray(r['bidhaa[]']) ? r['bidhaa[]'] : [r['bidhaa[]']];
      bids.forEach(function(b) { categories.byCommodity[b] = (categories.byCommodity[b] || 0) + 1; });
    }
    if (r['aina_mdau[]']) {
      var types = Array.isArray(r['aina_mdau[]']) ? r['aina_mdau[]'] : [r['aina_mdau[]']];
      types.forEach(function(t) { categories.byStakeholderType[t] = (categories.byStakeholderType[t] || 0) + 1; });
    }
    if (r.kiwango_shughuli) categories.byBusinessScale[r.kiwango_shughuli] = (categories.byBusinessScale[r.kiwango_shughuli] || 0) + 1;
    if (r.husika_mojakwamoja_nje) categories.byExportInvolvement[r.husika_mojakwamoja_nje] = (categories.byExportInvolvement[r.husika_mojakwamoja_nje] || 0) + 1;
    if (r.asilimia_thamani) categories.byProcessingLevel[r.asilimia_thamani] = (categories.byProcessingLevel[r.asilimia_thamani] || 0) + 1;
  });
  return categories;
}

// --- Main Report Generator ---
window.generateWadauMalighafiReport = async function() {
  if (!window.jspdf || !window.jspdf.jsPDF) { alert('PDF library not loaded. Please try again.'); return; }
  if (allSubmissions.length === 0) { alert('No responses to generate report.'); return; }
  
  var { jsPDF } = window.jspdf;
  var doc = new jsPDF('p', 'mm', 'a4');
  var pageWidth = doc.internal.pageSize.getWidth();
  var pageHeight = doc.internal.pageSize.getHeight();
  var margin = 15;
  var contentWidth = pageWidth - 2 * margin;
  
  var analysis = generateSmartRecommendations(allSubmissions);
  var categories = categorizeResponses(allSubmissions);
  
  // ========================================
  // COVER PAGE
  // ========================================
  // Full gradient background
  drawGradientRect(doc, 0, 0, pageWidth, pageHeight, BRAND.blueDark, BRAND.blue);
  
  // Decorative circles
  doc.setFillColor(0, 104, 71);
  doc.circle(pageWidth - 30, 40, 50, 'F');
  doc.setFillColor(212, 160, 23);
  doc.circle(20, pageHeight - 50, 35, 'F');
  
  // Top branding bar
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 8, 'F');
  doc.setFillColor(0, 104, 71);
  doc.rect(0, 8, pageWidth, 2, 'F');
  
  // Organization name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TANTRADE', margin, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Tanzania Trade Development Authority', margin, 26);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('United Republic of Tanzania', pageWidth - margin, 20, { align: 'right' });
  doc.text('Ministry of Industry and Trade', pageWidth - margin, 26, { align: 'right' });
  
  // Main title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('MARKET ASSESSMENT', margin, 80);
  doc.text('REPORT 2026', margin, 92);
  
  // Accent line
  doc.setFillColor(212, 160, 23);
  doc.rect(margin, 98, 60, 2, 'F');
  
  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text('Top 10 Commodities Exported as Raw Materials', margin, 110);
  doc.setFontSize(10);
  doc.text('Stakeholder Survey Analysis & Strategic Recommendations', margin, 118);
  
  // Metadata cards at bottom
  var cardY = 180;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, cardY, contentWidth, 50, 3, 3, 'F');
  
  doc.setTextColor(BRAND.blue[0], BRAND.blue[1], BRAND.blue[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('REPORT DETAILS', margin + 5, cardY + 10);
  
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Date: ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), margin + 5, cardY + 20);
  doc.text('Total Responses: ' + analysis.statistics.totalResponses, margin + 5, cardY + 28);
  doc.text('Regions Covered: ' + analysis.statistics.regionCount, margin + 5, cardY + 36);
  doc.text('Prepared by: TanTrade Research Division', margin + 5, cardY + 44);
  
  // Confidentiality notice
  doc.setTextColor(212, 160, 23);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('CONFIDENTIAL - For Internal Use Only', pageWidth / 2, pageHeight - 15, { align: 'center' });
  
  // ========================================
  // TABLE OF CONTENTS
  // ========================================
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  var tocY = drawSectionHeader(doc, 20, '01', 'TABLE OF CONTENTS', 'Report Navigation');
  
  var tocItems = [
    { num: '02', title: 'Executive Summary', desc: 'Key findings and strategic overview' },
    { num: '03', title: 'Key Insights', desc: 'Critical observations from data analysis' },
    { num: '04', title: 'Regional Distribution', desc: 'Geographic breakdown of responses' },
    { num: '05', title: 'Commodity Analysis', desc: 'Product-level stakeholder distribution' },
    { num: '06', title: 'Stakeholder Profile', desc: 'Types of respondents and their roles' },
    { num: '07', title: 'Processing Capacity', desc: 'Value addition levels analysis' },
    { num: '08', title: 'Strategic Recommendations', desc: 'AI-generated action plan' },
    { num: '09', title: 'Conclusion & Next Steps', desc: 'Final remarks and implementation roadmap' }
  ];
  
  tocItems.forEach(function(item) {
    doc.setTextColor(BRAND.blue[0], BRAND.blue[1], BRAND.blue[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(item.num, margin, tocY + 8);
    
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(item.title, margin + 15, tocY + 8);
    
    doc.setTextColor(BRAND.gray[0], BRAND.gray[1], BRAND.gray[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(item.desc, margin + 15, tocY + 14);
    
    // Dotted line
    doc.setDrawColor(229, 231, 235);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin + 80, tocY + 10, pageWidth - margin - 10, tocY + 10);
    doc.setLineDashPattern([], 0);
    
    tocY += 22;
  });
  
  // ========================================
  // EXECUTIVE SUMMARY
  // ========================================
  doc.addPage();
  var y = drawSectionHeader(doc, 20, '02', 'EXECUTIVE SUMMARY', 'Strategic Overview');
  
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  var summaryText = 'This report presents a comprehensive market assessment of Tanzania\'s top 10 agricultural and mineral commodities exported as raw materials. The assessment collected ' + analysis.statistics.totalResponses + ' responses from diverse stakeholders across ' + analysis.statistics.regionCount + ' region(s) of Tanzania.';
  summaryText += ' The primary objective was to identify factors contributing to raw material exports without value addition and recommend strategic interventions to enhance the value chain.';
  var summaryLines = doc.splitTextToSize(summaryText, contentWidth);
  doc.text(summaryLines, margin, y + 5);
  y += (summaryLines.length * 5) + 10;
  
  // KPI Cards Row
  var kpiW = (contentWidth - 12) / 3;
  var kpiH = 38;
  drawKpiCard(doc, margin, y, kpiW, kpiH, analysis.statistics.totalResponses, 'Total Responses', 'R', BRAND.blue);
  drawKpiCard(doc, margin + kpiW + 6, y, kpiW, kpiH, analysis.statistics.sellingRawPercentage + '%', 'Selling Raw', '%', BRAND.red);
  drawKpiCard(doc, margin + 2 * (kpiW + 6), y, kpiW, kpiH, analysis.statistics.regionCount, 'Regions', 'G', BRAND.green);
  y += kpiH + 10;
  
  // Key metrics highlight box
  doc.setFillColor(BRAND.blueLight[0], BRAND.blueLight[1], BRAND.blueLight[2]);
  doc.roundedRect(margin, y, contentWidth, 25, 2, 2, 'F');
  doc.setFillColor(BRAND.blue[0], BRAND.blue[1], BRAND.blue[2]);
  doc.rect(margin, y, 2, 25, 'F');
  
  doc.setTextColor(BRAND.blue[0], BRAND.blue[1], BRAND.blue[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('KEY METRICS AT A GLANCE', margin + 6, y + 6);
  
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Top Commodity: ' + (analysis.statistics.topCommodity || 'N/A') + ' | Underutilized Factories: ' + analysis.statistics.underutilizedFactories + ' | Data Collection Period: Sept 2026', margin + 6, y + 14);
  doc.text('Assessment Scope: Production, Markets, Processing, Finance, Infrastructure, Policy', margin + 6, y + 20);
  
  // ========================================
  // KEY INSIGHTS
  // ========================================
  doc.addPage();
  y = drawSectionHeader(doc, 20, '03', 'KEY INSIGHTS', 'Critical Observations from Data Analysis');
  
  analysis.insights.forEach(function(insight) {
    if (y > pageHeight - 35) { doc.addPage(); y = 20; }
    y += drawInsightBox(doc, margin, y, contentWidth, insight.type, insight.category, insight.text);
  });
  
  // ========================================
  // REGIONAL DISTRIBUTION
  // ========================================
  doc.addPage();
  y = drawSectionHeader(doc, 20, '04', 'REGIONAL DISTRIBUTION', 'Geographic Breakdown of Responses');
  
  var regionData = Object.keys(categories.byRegion).map(function(r) {
    return [r, categories.byRegion[r], ((categories.byRegion[r] / analysis.statistics.totalResponses) * 100).toFixed(1) + '%'];
  }).sort(function(a, b) { return parseInt(b[1]) - parseInt(a[1]); });
  
  doc.autoTable({
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Region', 'Responses', 'Share']],
    body: regionData.slice(0, 10),
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: BRAND.blue, textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 40, halign: 'center' }, 2: { cellWidth: 40, halign: 'right' } },
    alternateRowStyles: { fillColor: BRAND.grayLight },
    theme: 'grid'
  });
  
  // ========================================
  // COMMODITY ANALYSIS
  // ========================================
  doc.addPage();
  y = drawSectionHeader(doc, 20, '05', 'COMMODITY ANALYSIS', 'Product-Level Stakeholder Distribution');
  
  var commodityData = Object.keys(categories.byCommodity).map(function(c) {
    return [c, categories.byCommodity[c], ((categories.byCommodity[c] / analysis.statistics.totalResponses) * 100).toFixed(1) + '%'];
  }).sort(function(a, b) { return parseInt(b[1]) - parseInt(a[1]); });
  
  doc.autoTable({
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Commodity', 'Stakeholders', 'Share']],
    body: commodityData,
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: BRAND.green, textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 40, halign: 'center' }, 2: { cellWidth: 40, halign: 'right' } },
    alternateRowStyles: { fillColor: BRAND.greenLight },
    theme: 'grid'
  });
  
  // ========================================
  // STAKEHOLDER PROFILE
  // ========================================
  doc.addPage();
  y = drawSectionHeader(doc, 20, '06', 'STAKEHOLDER PROFILE', 'Types of Respondents and Their Roles');
  
  var stakeholderData = Object.keys(categories.byStakeholderType).map(function(s) {
    return [s, categories.byStakeholderType[s], ((categories.byStakeholderType[s] / analysis.statistics.totalResponses) * 100).toFixed(1) + '%'];
  }).sort(function(a, b) { return parseInt(b[1]) - parseInt(a[1]); });
  
  doc.autoTable({
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Stakeholder Type', 'Count', 'Share']],
    body: stakeholderData,
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: BRAND.blue, textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 35, halign: 'center' }, 2: { cellWidth: 35, halign: 'right' } },
    alternateRowStyles: { fillColor: BRAND.blueLight },
    theme: 'grid'
  });
  
  // ========================================
  // PROCESSING CAPACITY
  // ========================================
  doc.addPage();
  y = drawSectionHeader(doc, 20, '07', 'PROCESSING CAPACITY', 'Value Addition Levels Analysis');
  
  var processingData = Object.keys(categories.byProcessingLevel).map(function(p) {
    return [p, categories.byProcessingLevel[p], ((categories.byProcessingLevel[p] / analysis.statistics.totalResponses) * 100).toFixed(1) + '%'];
  });
  
  doc.autoTable({
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Processing Level', 'Count', 'Share']],
    body: processingData,
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: BRAND.green, textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 35, halign: 'center' }, 2: { cellWidth: 35, halign: 'right' } },
    alternateRowStyles: { fillColor: BRAND.greenLight },
    theme: 'grid'
  });
  
  // ========================================
  // STRATEGIC RECOMMENDATIONS
  // ========================================
  doc.addPage();
  y = drawSectionHeader(doc, 20, '08', 'STRATEGIC RECOMMENDATIONS', 'AI-Generated Action Plan Based on Data Analysis');
  
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  var recIntro = 'The following recommendations are automatically generated based on patterns identified in the survey data. Each recommendation includes impact assessment and suggested implementation timeline.';
  var recIntroLines = doc.splitTextToSize(recIntro, contentWidth);
  doc.text(recIntroLines, margin, y + 3);
  y += (recIntroLines.length * 5) + 8;
  
  analysis.recommendations.forEach(function(rec, idx) {
    if (y > pageHeight - 45) { doc.addPage(); y = 20; }
    y += drawRecommendationCard(doc, margin, y, contentWidth, idx + 1, rec.category, rec.action, rec.impact, rec.timeline);
  });
  
  // ========================================
  // CONCLUSION & NEXT STEPS
  // ========================================
  doc.addPage();
  y = drawSectionHeader(doc, 20, '09', 'CONCLUSION & NEXT STEPS', 'Final Remarks and Implementation Roadmap');
  
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  var conclusionText = 'Based on the data analysis, this assessment has identified the key challenges contributing to raw material exports without value addition. The system-generated recommendations aim to address these challenges through systemic and sustainable interventions.';
  conclusionText += ' It is recommended that TanTrade and other stakeholders implement these recommendations with careful attention and close monitoring.';
  var conclusionLines = doc.splitTextToSize(conclusionText, contentWidth);
  doc.text(conclusionLines, margin, y + 5);
  y += (conclusionLines.length * 5) + 12;
  
  // Action items box
  doc.setFillColor(BRAND.greenLight[0], BRAND.greenLight[1], BRAND.greenLight[2]);
  doc.roundedRect(margin, y, contentWidth, 55, 2, 2, 'F');
  doc.setFillColor(BRAND.green[0], BRAND.green[1], BRAND.green[2]);
  doc.rect(margin, y, 2, 55, 'F');
  
  doc.setTextColor(BRAND.green[0], BRAND.green[1], BRAND.green[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('IMMEDIATE ACTION ITEMS', margin + 8, y + 8);
  
  var quickActions = [
    'Establish mandatory local processing requirements for priority commodities',
    'Improve transport infrastructure and storage facilities in production corridors',
    'Provide subsidized loans (8-10% interest) for processors and manufacturers',
    'Launch training programs on processing technology and quality standards',
    'Strengthen collaboration between producers and processing industries'
  ];
  
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  var actionY = y + 16;
  quickActions.forEach(function(action, idx) {
    doc.setFillColor(BRAND.green[0], BRAND.green[1], BRAND.green[2]);
    doc.circle(margin + 12, actionY - 1, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(String(idx + 1), margin + 12, actionY, { align: 'center' });
    
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    var actionLines = doc.splitTextToSize(action, contentWidth - 20);
    doc.text(actionLines, margin + 18, actionY);
    actionY += (actionLines.length * 4) + 4;
  });
  
  // Signature block
  y = pageHeight - 50;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + 60, y);
  doc.line(pageWidth - margin - 60, y, pageWidth - margin, y);
  
  doc.setTextColor(BRAND.gray[0], BRAND.gray[1], BRAND.gray[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Prepared by: TanTrade Research Division', margin, y + 5);
  doc.text('Approved by: Director General', pageWidth - margin - 60, y + 5);
  doc.text('Date: ' + new Date().toLocaleDateString('en-GB'), margin, y + 10);
  doc.text('Signature: ___________________', pageWidth - margin - 60, y + 10);
  
  // ========================================
  // MODERN FOOTER (All Pages)
  // ========================================
  var pageCount = doc.getNumberOfPages();
  for (var i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Skip cover page
    if (i === 1) continue;
    
    // Footer bar
    doc.setFillColor(BRAND.blueDark[0], BRAND.blueDark[1], BRAND.blueDark[2]);
    doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
    
    // Green accent
    doc.setFillColor(BRAND.green[0], BRAND.green[1], BRAND.green[2]);
    doc.rect(0, pageHeight - 12, pageWidth, 1.5, 'F');
    
    // Footer text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('TanTrade Market Assessment Report 2026', margin, pageHeight - 5);
    doc.text('CONFIDENTIAL', pageWidth / 2, pageHeight - 5, { align: 'center' });
    doc.text('Page ' + i + ' of ' + pageCount, pageWidth - margin, pageHeight - 5, { align: 'right' });
    
    // Header line on non-cover pages
    if (i > 1) {
      doc.setFillColor(BRAND.green[0], BRAND.green[1], BRAND.green[2]);
      doc.rect(0, 0, pageWidth, 3, 'F');
      doc.setFillColor(BRAND.blue[0], BRAND.blue[1], BRAND.blue[2]);
      doc.rect(0, 3, pageWidth, 1, 'F');
    }
  }
  
  doc.save('TanTrade-Market-Assessment-Report-' + new Date().toISOString().slice(0, 10) + '.pdf');
};

  // 10. INITIALIZATION
  console.log("[INIT] Admin app starting...");
  setLang("sw");
  checkAuth();
})();
