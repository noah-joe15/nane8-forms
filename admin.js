// =====================================================
// TANTRADE 2026 - UNIFIED ADMIN DASHBOARD (admin.js)
// =====================================================
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

  window.setLang = function (l) {
    try {
      document.body.classList.remove("lang-sw", "lang-en");
      document.body.classList.add("lang-" + l);
      document.getElementById("btn-lang-sw").classList.toggle("active", l === "sw");
      document.getElementById("btn-lang-en").classList.toggle("active", l === "en");
    } catch (err) { console.error("[ERROR] setLang:", err); }
  };

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

  window.switchForm = function(formType) {
    activeForm = formType;
    // Update dynamic labels based on form
    var dynLabel = document.getElementById("statDynamicLabel");
    var kpiDynLabel = document.getElementById("kpiDynamicLabel");
    if (activeForm === 'nanenane') {
      if(dynLabel) dynLabel.innerHTML = '<span class="lang-sw">Hawajasajiliwa (MIT)</span><span class="lang-en">Unregistered (MIT)</span>';
      if(kpiDynLabel) kpiDynLabel.innerHTML = '<span class="lang-sw">Hawajasajiliwa</span><span class="lang-en">Unregistered</span>';
    } else {
      if(dynLabel) dynLabel.innerHTML = '<span class="lang-sw">Wanaouza Ghafi (0%)</span><span class="lang-en">Selling Raw (0%)</span>';
      if(kpiDynLabel) kpiDynLabel.innerHTML = '<span class="lang-sw">Wanaouza Ghafi</span><span class="lang-en">Selling Raw</span>';
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

  window.loadSubmissions = async function () {
    var holder = document.getElementById("tableHolder");
    holder.innerHTML = '<div class="state-msg"><span class="lang-sw">Inapakia majibu…</span><span class="lang-en">Loading responses…</span></div>';
    try {
      const tableName = activeForm === 'nanenane' ? 'nanenane_responses' : 'wadau_malighafi_responses';
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
      : ["mkoa","wilaya","jina_mhojiwa","taasisi","bidhaa[]","asilimia_thamani","submitted_at"];
      
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
      : ["mkoa","wilaya","jina_mhojiwa","taasisi","bidhaa[]","asilimia_thamani","submitted_at"];
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

  // --- QUESTIONS ---
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

  // --- KPI / CHARTS ---
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
      
      var complete = allSubmissions.filter(function (s) { return (s.respondent_name || s.jina_mhoji9a) && s.mkoa; }).length;
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
      // For Wadau, use 'bidhaa[]' (array), for Nanenane use 'sekta'
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

  console.log("[INIT] Admin app starting...");
  setLang("sw");
  checkAuth();
})();
