(function () {
  "use strict";
  var allSubmissions = [];
  var allQuestions = [];

  window.setLang = function (l) {
    document.body.classList.remove("lang-sw", "lang-en");
    document.body.classList.add("lang-" + l);
    document.getElementById("btn-lang-sw").classList.toggle("active", l === "sw");
    document.getElementById("btn-lang-en").classList.toggle("active", l === "en");
  };

  // --- AUTHENTICATION ---
  async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      showDashboard();
    } else {
      showLogin();
    }
  }

  window.handleLogin = async function (e) {
    e.preventDefault();
    var email = document.getElementById("adminEmail").value;
    var password = document.getElementById("adminPass").value;
    var loginBtn = document.getElementById("loginBtn");
    
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="lang-sw">Inaingia...</span><span class="lang-en">Signing in...</span>';
    document.getElementById("loginError").style.display = "none";

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      document.getElementById("loginError").style.display = "block";
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<span class="lang-sw">Ingia</span><span class="lang-en">Sign In</span>';
    } else {
      showDashboard();
    }
    return false;
  };

  window.handleLogout = async function () {
    await supabaseClient.auth.signOut();
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

  // --- TAB SWITCHING ---
  window.switchTab = function (tab, btn) {
    document.getElementById("responsesTab").style.display = tab === "responses" ? "block" : "none";
    document.getElementById("unregisteredTab").style.display = tab === "unregistered" ? "block" : "none";
    document.getElementById("questionsTab").style.display = tab === "questions" ? "block" : "none";
    document.querySelectorAll(".tab-btn").forEach(function(b) { b.classList.remove("active"); });
    btn.classList.add("active");
    if (tab === "unregistered") renderUnregisteredTable();
  };

  // --- DATA LOADING & STATS ---
  window.loadSubmissions = async function () {
    var holder = document.getElementById("tableHolder");
    holder.innerHTML = '<div class="state-msg"><span class="lang-sw">Inapakia majibu…</span><span class="lang-en">Loading responses…</span></div>';
    try {
      const { data, error } = await supabaseClient.from('nanenane_responses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      allSubmissions = (data || []).map(function(sub) {
        var fields = sub.form_data || {};
        if (!fields.submitted_at && sub.created_at) fields.submitted_at = sub.created_at;
        return fields;
      }).filter(function(sub) {
        var keys = Object.keys(sub).filter(function(k) { return k !== "submitted_at" && k !== "created_at"; });
        return keys.length > 0;
      });

      updateStats();
      renderTable();
    } catch (err) {
      holder.innerHTML = '<div class="state-msg" style="color:var(--danger)">Hitilafu: ' + err.message + '</div>';
    }
  };

  function updateStats() {
    document.getElementById("statTotal").textContent = allSubmissions.length;
    var regions = new Set();
    var districts = new Set();
    var unregisteredCount = 0;

    allSubmissions.forEach(function(sub) {
      if (sub.mkoa) regions.add(sub.mkoa.trim().toLowerCase());
      if (sub.wilaya) districts.add(sub.wilaya.trim().toLowerCase());
      if (sub.bidhaa_zimesajiliwa === "Hapana" || sub.bidhaa_zimesajiliwa === "Sijui utaratibu") {
        unregisteredCount++;
      }
    });

    document.getElementById("statRegions").textContent = regions.size;
    document.getElementById("statDistricts").textContent = districts.size;
    document.getElementById("statUnregistered").textContent = unregisteredCount;
  }

  // --- ALL RESPONSES TABLE ---
  window.renderTable = function () {
    var query = (document.getElementById("searchInput").value || "").toLowerCase();
    var rows = allSubmissions.filter(function (sub) {
      if (!query) return true;
      return Object.values(sub).some(function (v) { return String(v).toLowerCase().includes(query); });
    });
    document.getElementById("countPill").innerHTML = rows.length + ' <span class="lang-sw">majibu</span><span class="lang-en">responses</span>';
    renderGenericTable(rows, "tableHolder", false);
  };

  // --- UNREGISTERED TABLE ---
  window.renderUnregisteredTable = function () {
    var query = (document.getElementById("unregSearchInput").value || "").toLowerCase();
    var rows = allSubmissions.filter(function (sub) {
      return (sub.bidhaa_zimesajiliwa === "Hapana" || sub.bidhaa_zimesajiliwa === "Sijui utaratibu");
    }).filter(function (sub) {
      if (!query) return true;
      return Object.values(sub).some(function (v) { return String(v).toLowerCase().includes(query); });
    });

    document.getElementById("unregCountPill").textContent = rows.length;
    renderGenericTable(rows, "unregisteredTableHolder", true);
  };

  function renderGenericTable(rows, holderId, isUnregisteredView) {
    var holder = document.getElementById(holderId);
    if (!rows.length) { 
      holder.innerHTML = '<div class="state-msg"><span class="lang-sw">Hakuna majibu.</span><span class="lang-en">No responses.</span></div>'; 
      return; 
    }
    
    var allKeys = new Set();
    rows.forEach(function(sub) {
      Object.keys(sub).forEach(function(k) {
        if (k !== "form-name" && k !== "bot-field") allKeys.add(k);
      });
    });
    
    var priorityCols = isUnregisteredView 
      ? ["respondent_name", "respondent_phone", "mkoa", "wilaya", "sekta", "bidhaa_zinazozalishwa_tz", "bidhaa_zimesajiliwa", "submitted_at"]
      : ["jina_la_kampuni", "tin_number", "anwani_kampuni", "submitted_at", "respondent_name", "respondent_phone", "respondent_email", "mkoa", "wilaya"];

    var cols = Array.from(allKeys).sort(function(a, b) {
      var idxA = priorityCols.indexOf(a);
      var idxB = priorityCols.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    var html = '<table><thead><tr>' + cols.map(function(c) { return '<th>' + c.replace(/_/g, " ") + '</th>'; }).join("") + '</tr></thead><tbody>';
    rows.forEach(function(sub) {
      html += '<tr>' + cols.map(function(c) { 
        var val = sub[c];
        return '<td>' + (Array.isArray(val) ? val.join(", ") : (val || "")) + '</td>'; 
      }).join("") + '</tr>';
    });
    holder.innerHTML = '<div class="table-wrap">' + html + '</tbody></table></div>';
  }

  // --- CSV EXPORTS ---
  window.exportCsv = function () { exportGenericCsv(allSubmissions, "majibu-yote", false); };
  window.exportUnregisteredCsv = function () { 
    var rows = allSubmissions.filter(function (sub) {
      return (sub.bidhaa_zimesajiliwa === "Hapana" || sub.bidhaa_zimesajiliwa === "Sijui utaratibu");
    });
    exportGenericCsv(rows, "wanaohitaji-usajili", true); 
  };

  function exportGenericCsv(rows, filename, isUnregisteredView) {
    if (!rows.length) { alert("Hakuna majibu"); return; }
    var allKeys = new Set();
    rows.forEach(function(sub) { 
      Object.keys(sub).forEach(function(k) { 
        if (k !== "form-name" && k !== "bot-field") allKeys.add(k); 
      }); 
    });
    
    var priorityCols = isUnregisteredView 
      ? ["respondent_name", "respondent_phone", "mkoa", "wilaya", "sekta", "bidhaa_zinazozalishwa_tz", "bidhaa_zimesajiliwa", "submitted_at"]
      : ["jina_la_kampuni", "tin_number", "anwani_kampuni", "submitted_at", "respondent_name", "respondent_phone", "respondent_email", "mkoa", "wilaya"];

    var cols = Array.from(allKeys).sort(function(a, b) {
      var idxA = priorityCols.indexOf(a);
      var idxB = priorityCols.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    var lines = [cols.join(",")].concat(rows.map(function(sub) { 
      return cols.map(function(c) { 
        var val = sub[c]; 
        return '"' + String(Array.isArray(val) ? val.join(", ") : (val || "")).replace(/"/g, '""') + '"'; 
      }).join(","); 
    }));
    var blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename + ".csv"; a.click();
  }

  // --- QUESTIONS MANAGEMENT ---
  window.loadQuestions = async function () {
    var holder = document.getElementById("questionsHolder");
    try {
      const { data, error } = await supabaseClient.from('survey_questions').select('*').order('step_number', { ascending: true }).order('sort_order', { ascending: true });
      if (error) throw error;
      allQuestions = data || [];
      renderQuestions();
    } catch (err) {
      holder.innerHTML = '<div class="state-msg" style="color:var(--danger)">Hitilafu: ' + err.message + '</div>';
    }
  };

  window.renderQuestions = function () {
    if (!allQuestions.length) { document.getElementById("questionsHolder").innerHTML = '<div class="state-msg"><span class="lang-sw">Hakuna maswali bado.</span><span class="lang-en">No questions yet.</span></div>'; return; }
    var html = '<table><thead><tr><th>Step</th><th>Field</th><th>Label (SW)</th><th>Type</th><th>Actions</th></tr></thead><tbody>';
    allQuestions.forEach(function(q) {
      html += `<tr>
        <td>${q.step_number}</td>
        <td><code>${q.field_name}</code></td>
        <td>${q.label_sw}</td>
        <td>${q.input_type}</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick='editQuestion(${JSON.stringify(q).replace(/'/g, "&#39;")})'><span class="lang-sw">Hariri</span><span class="lang-en">Edit</span></button>
          <button class="btn btn-sm btn-danger" onclick="deleteQuestion('${q.id}')"><span class="lang-sw">Futa</span><span class="lang-en">Delete</span></button>
        </td>
      </tr>`;
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
      payload.options = opts.split(",").map(function(o) { return o.trim(); }).filter(function(o) { return o; });
    }
    try {
      if (id) { await supabaseClient.from('survey_questions').update(payload).eq('id', id); } 
      else { await supabaseClient.from('survey_questions').insert([payload]); }
      resetQForm(); loadQuestions(); alert("Swali limehifadhiwa!");
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

  // Initialize
  setLang("sw");
  // --- KPI/CHARTS FUNCTIONS ---
var chartsInitialized = false;
var regionsChart, sectorsChart, genderChart, businessChart;

window.switchTab = function (tab, btn) {
  document.getElementById("responsesTab").style.display = tab === "responses" ? "block" : "none";
  document.getElementById("unregisteredTab").style.display = tab === "unregistered" ? "block" : "none";
  document.getElementById("kpiTab").style.display = tab === "kpi" ? "block" : "none";
  document.getElementById("questionsTab").style.display = tab === "questions" ? "block" : "none";
  document.querySelectorAll(".tab-btn").forEach(function(b) { b.classList.remove("active"); });
  btn.classList.add("active");
  
  if (tab === "unregistered") renderUnregisteredTable();
  if (tab === "kpi") renderKPICharts();
};

function renderKPICharts() {
  // Update stat cards
  document.getElementById("kpiTotal").textContent = allSubmissions.length;
  
  var unregisteredCount = allSubmissions.filter(function(sub) {
    return sub.bidhaa_zimesajiliwa === "Hapana" || sub.bidhaa_zimesajiliwa === "Sijui utaratibu";
  }).length;
  document.getElementById("kpiUnregistered").textContent = unregisteredCount;
  
  // Calculate completion rate (simple: % with all required fields)
  var completeCount = allSubmissions.filter(function(sub) {
    return sub.respondent_name && sub.respondent_email && sub.mkoa;
  }).length;
  var completionRate = allSubmissions.length > 0 ? Math.round((completeCount / allSubmissions.length) * 100) : 0;
  document.getElementById("kpiCompletion").textContent = completionRate + "%";
  
  // Initialize charts if not already done
  if (!chartsInitialized) {
    initCharts();
    chartsInitialized = true;
  } else {
    updateCharts();
  }
}

function initCharts() {
  // Chart.js default config
  Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
  Chart.defaults.color = '#4B5B54';
  
  // 1. Regions Pie Chart
  var regionsCtx = document.getElementById('regionsChart').getContext('2d');
  regionsChart = new Chart(regionsCtx, {
    type: 'pie',
    data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
  });
  
  // 2. Sectors Pie Chart
  var sectorsCtx = document.getElementById('sectorsChart').getContext('2d');
  sectorsChart = new Chart(sectorsCtx, {
    type: 'pie',
    data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
  });
  
  // 3. Gender Bar Chart
  var genderCtx = document.getElementById('genderChart').getContext('2d');
  genderChart = new Chart(genderCtx, {
    type: 'bar',
    data: { labels: [], datasets: [{ label: '', data: [], backgroundColor: [] }] },
    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } } }
  });
  
  // 4. Business Status Bar Chart
  var businessCtx = document.getElementById('businessChart').getContext('2d');
  businessChart = new Chart(businessCtx, {
    type: 'bar',
    data: { labels: [], datasets: [{ label: '', data: [], backgroundColor: [] }] },
    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } } }
  });
  
  updateCharts();
}

function updateCharts() {
  // Count data
  var regions = {}, sectors = {}, gender = {}, business = {};
  
  allSubmissions.forEach(function(sub) {
    // Regions
    if (sub.mkoa) {
      regions[sub.mkoa] = (regions[sub.mkoa] || 0) + 1;
    }
    // Sectors
    if (sub.sekta) {
      sectors[sub.sekta] = (sectors[sub.sekta] || 0) + 1;
    }
    // Gender
    if (sub.jinsia) {
      gender[sub.jinsia] = (gender[sub.jinsia] || 0) + 1;
    }
    // Business Status
    if (sub.hali_biashara) {
      business[sub.hali_biashara] = (business[sub.hali_biashara] || 0) + 1;
    }
  });
  
  // Color palettes
  var colors = {
    regions: ['#0B6E4F', '#1E6BB8', '#D4A017', '#063C2C', '#164C82', '#B8860B', '#128A64', '#4B5B54'],
    sectors: ['#0B6E4F', '#1E6BB8', '#D4A017', '#063C2C', '#164C82', '#B8860B', '#128A64'],
    gender: ['#0B6E4F', '#D4A017', '#1E6BB8'],
    business: ['#0B6E4F', '#D4A017', '#1E6BB8', '#B3261E']
  };
  
  // Update Regions Chart
  regionsChart.data.labels = Object.keys(regions);
  regionsChart.data.datasets[0].data = Object.values(regions);
  regionsChart.data.datasets[0].backgroundColor = colors.regions.slice(0, Object.keys(regions).length);
  regionsChart.update();
  
  // Update Sectors Chart
  sectorsChart.data.labels = Object.keys(sectors);
  sectorsChart.data.datasets[0].data = Object.values(sectors);
  sectorsChart.data.datasets[0].backgroundColor = colors.sectors.slice(0, Object.keys(sectors).length);
  sectorsChart.update();
  
  // Update Gender Chart
  genderChart.data.labels = Object.keys(gender).map(function(g) {
    return g === 'Me' ? 'Me (Male)' : g === 'Ke' ? 'Ke (Female)' : g;
  });
  genderChart.data.datasets[0].data = Object.values(gender);
  genderChart.data.datasets[0].backgroundColor = colors.gender.slice(0, Object.keys(gender).length);
  genderChart.update();
  
  // Update Business Chart
  businessChart.data.labels = Object.keys(business);
  businessChart.data.datasets[0].data = Object.values(business);
  businessChart.data.datasets[0].backgroundColor = colors.business.slice(0, Object.keys(business).length);
  businessChart.update();
}
  checkAuth();
})();

// Chart instances
let regionsChart, sectorsChart, genderChart, businessChart;

// ═══════════════════════════════════════════════════
// PERCENTAGE BREAKDOWN WITH VISUAL PROGRESS BARS
// ═══════════════════════════════════════════════════
function renderPercentageBreakdowns(submissions) {
  const total = submissions.length;
  if (total === 0) return;

  // Helper: Build HTML for a single breakdown with progress bars
  function buildBreakdown(data, field, limit = null) {
    const counts = {};
    data.forEach(s => {
      const value = s[field] || 'Haijatajwa';
      counts[value] = (counts[value] || 0) + 1;
    });

    let entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (limit) entries = entries.slice(0, limit);

    return entries.map(([label, count]) => {
      const pct = ((count / total) * 100).toFixed(1);
      const pctNum = parseFloat(pct);
      // Color logic: green >50%, gold 20-50%, red <20%
      const barColor = pctNum > 50 ? 'var(--green-700)' : 
                       pctNum > 20 ? 'var(--gold-500)' : 
                       'var(--danger)';
      
      return `
        <div style="margin-bottom:10px;">
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
            <span style="font-weight:600;">${label}</span>
            <span style="color:var(--ink-soft);">${count} <strong style="color:${barColor};">(${pct}%)</strong></span>
          </div>
          <div style="background:var(--line); height:6px; border-radius:3px; overflow:hidden;">
            <div style="background:${barColor}; height:100%; width:${pct}%; border-radius:3px; transition:width 0.6s ease;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render all 4 breakdowns
  document.getElementById('genderBreakdown').innerHTML = buildBreakdown(submissions, 'gender');
  document.getElementById('businessBreakdown').innerHTML = buildBreakdown(submissions, 'business_status');
  document.getElementById('regionsBreakdown').innerHTML = buildBreakdown(submissions, 'region', 5);
  document.getElementById('sectorsBreakdown').innerHTML = buildBreakdown(submissions, 'sector', 5);
}
  // Business status breakdown
  const businessCounts = {};
  submissions.forEach(s => {
    const status = s.business_status || 'Haijatajwa';
    businessCounts[status] = (businessCounts[status] || 0) + 1;
  });
  
  const businessHtml = Object.entries(businessCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => {
      const pct = ((count / total) * 100).toFixed(1);
      return `<div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--line);">
        <span>${label}</span>
        <strong>${count} (${pct}%)</strong>
      </div>`;
    }).join('');
  document.getElementById('businessBreakdown').innerHTML = businessHtml;

  // Top 5 regions breakdown
  const regionCounts = {};
  submissions.forEach(s => {
    const region = s.region || 'Haijatajwa';
    regionCounts[region] = (regionCounts[region] || 0) + 1;
  });
  
  const regionsHtml = Object.entries(regionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => {
      const pct = ((count / total) * 100).toFixed(1);
      return `<div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--line);">
        <span>${label}</span>
        <strong>${count} (${pct}%)</strong>
      </div>`;
    }).join('');
  document.getElementById('regionsBreakdown').innerHTML = regionsHtml;

  // Top 5 sectors breakdown
  const sectorCounts = {};
  submissions.forEach(s => {
    const sector = s.sector || 'Haijatajwa';
    sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
  });
  
  const sectorsHtml = Object.entries(sectorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => {
      const pct = ((count / total) * 100).toFixed(1);
      return `<div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--line);">
        <span>${label}</span>
        <strong>${count} (${pct}%)</strong>
      </div>`;
    }).join('');
  document.getElementById('sectorsBreakdown').innerHTML = sectorsHtml;
}

// Export dashboard as PNG image
async function exportDashboardImage() {
  const exportBtn = document.getElementById('exportBtn');
  const originalText = exportBtn.innerHTML;
  exportBtn.innerHTML = '<span class="lang-sw">Inapakua...</span><span class="lang-en">Generating...</span>';
  exportBtn.disabled = true;

  try {
    // Show export header
    const exportHeader = document.getElementById('exportHeader');
    const exportDate = document.getElementById('exportDate');
    exportDate.textContent = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
    exportHeader.style.display = 'block';

    // Wait for any animations to complete
    await new Promise(resolve => setTimeout(resolve, 300));

    // Capture the dashboard area
    const element = document.getElementById('dashboardExportArea');
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true
    });

    // Hide export header again
    exportHeader.style.display = 'none';

    // Convert to blob and download
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Nanenane_2026_Dashboard_${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png', 0.95);

  } catch (error) {
    console.error('Export failed:', error);
    alert('Export failed. Please try again.');
  } finally {
    exportBtn.innerHTML = originalText;
    exportBtn.disabled = false;
  }
}

// Update your existing chart rendering function to include percentage labels
function renderCharts(submissions) {
  const total = submissions.length;
  
  // Destroy existing charts
  if (regionsChart) regionsChart.destroy();
  if (sectorsChart) sectorsChart.destroy();
  if (genderChart) genderChart.destroy();
  if (businessChart) businessChart.destroy();

  // Count data
  const regionCounts = {};
  const sectorCounts = {};
  const genderCounts = {};
  const businessCounts = {};

  submissions.forEach(s => {
    const region = s.region || 'Haijatajwa';
    const sector = s.sector || 'Haijatajwa';
    const gender = s.gender || 'Haijatajwa';
    const business = s.business_status || 'Haijatajwa';

    regionCounts[region] = (regionCounts[region] || 0) + 1;
    sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
    genderCounts[gender] = (genderCounts[gender] || 0) + 1;
    businessCounts[business] = (businessCounts[business] || 0) + 1;
  });

  // Color palette
  const colors = [
    '#0B6E4F', '#D4A017', '#B3261E', '#128A64', '#E9C766',
    '#063C2C', '#8B4513', '#2E8B57', '#FF6347', '#4682B4'
  ];

  // Regions Pie Chart
  const regionsCtx = document.getElementById('regionsChart').getContext('2d');
  regionsChart = new Chart(regionsCtx, {
    type: 'pie',
    data: {
      labels: Object.keys(regionCounts).slice(0, 10),
      datasets: [{
        data: Object.values(regionCounts).slice(0, 10),
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'right' },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });

  // Sectors Pie Chart
  const sectorsCtx = document.getElementById('sectorsChart').getContext('2d');
  sectorsChart = new Chart(sectorsCtx, {
    type: 'pie',
    data: {
      labels: Object.keys(sectorCounts).slice(0, 10),
      datasets: [{
        data: Object.values(sectorCounts).slice(0, 10),
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'right' },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });

  // Gender Bar Chart
  const genderCtx = document.getElementById('genderChart').getContext('2d');
  genderChart = new Chart(genderCtx, {
    type: 'bar',
    data: {
      labels: Object.keys(genderCounts),
      datasets: [{
        label: 'Count',
        data: Object.values(genderCounts),
        backgroundColor: colors.slice(0, Object.keys(genderCounts).length)
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed.y;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${value} (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  // Business Status Bar Chart
  const businessCtx = document.getElementById('businessChart').getContext('2d');
  businessChart = new Chart(businessCtx, {
    type: 'bar',
    data: {
      labels: Object.keys(businessCounts),
      datasets: [{
        label: 'Count',
        data: Object.values(businessCounts),
        backgroundColor: colors.slice(0, Object.keys(businessCounts).length)
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed.y;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${value} (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}
