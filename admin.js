(function () {
  "use strict";
  var ADMIN_PASSWORD = "1234";
  var loggedIn = false;
  var allSubmissions = [];
  var allQuestions = [];

  window.setLang = function (l) {
    document.body.classList.remove("lang-sw", "lang-en");
    document.body.classList.add("lang-" + l);
    document.getElementById("btn-lang-sw").classList.toggle("active", l === "sw");
    document.getElementById("btn-lang-en").classList.toggle("active", l === "en");
  };

  window.handleLogin = function (e) {
    e.preventDefault();
    if (document.getElementById("adminPass").value === ADMIN_PASSWORD) {
      loggedIn = true;
      document.getElementById("loginView").style.display = "none";
      document.getElementById("dashboardView").style.display = "block";
      document.getElementById("logoutBtn").style.display = "inline-block";
      loadSubmissions();
      loadQuestions();
    } else {
      document.getElementById("loginError").style.display = "block";
    }
    return false;
  };

  window.logout = function () {
    loggedIn = false;
    document.getElementById("adminPass").value = "";
    document.getElementById("dashboardView").style.display = "none";
    document.getElementById("logoutBtn").style.display = "none";
    document.getElementById("loginView").style.display = "block";
  };

  window.switchTab = function (tab, btn) {
    document.getElementById("responsesTab").style.display = tab === "responses" ? "block" : "none";
    document.getElementById("unregisteredTab").style.display = tab === "unregistered" ? "block" : "none";
    document.getElementById("questionsTab").style.display = tab === "questions" ? "block" : "none";
    document.querySelectorAll(".tab-btn").forEach(function(b) { b.classList.remove("active"); });
    btn.classList.add("active");
    
    // Re-render tables when switching tabs to ensure they are up to date
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
        // Filter out completely empty test submissions
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
      
      // Check if they need MIT registration (Answered "Hapana" or "Sijui utaratibu")
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
    renderGenericTable(rows, "tableHolder");
  };

  // --- UNREGISTERED TABLE ---
  window.renderUnregisteredTable = function () {
    var query = (document.getElementById("unregSearchInput").value || "").toLowerCase();
    
    // Auto-sort: Only show those who need registration
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
    
    // If it's the unregistered view, prioritize these columns
    var priorityCols = isUnregisteredView 
      ? ["respondent_name", "respondent_phone", "mkoa", "wilaya", "sekta", "bidhaa_zinazozalishwa_tz", "bidhaa_zimesajiliwa", "submitted_at"]
      : ["submitted_at", "respondent_name", "respondent_phone", "respondent_email", "mkoa", "wilaya"];

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
  window.exportCsv = function () { exportGenericCsv(allSubmissions, "majibu-yote"); };
  window.exportUnregisteredCsv = function () { 
    var rows = allSubmissions.filter(function (sub) {
      return (sub.bidhaa_zimesajiliwa === "Hapana" || sub.bidhaa_zimesajiliwa === "Sijui utaratibu");
    });
    exportGenericCsv(rows, "wanaohitaji-usajili"); 
  };

  function exportGenericCsv(rows, filename) {
    if (!rows.length) { alert("Hakuna majibu"); return; }
    var allKeys = new Set();
    rows.forEach(function(sub) { Object.keys(sub).forEach(function(k) { if (k !== "form-name" && k !== "bot-field") allKeys.add(k); }); });
    var cols = Array.from(allKeys);
    var lines = [cols.join(",")].concat(rows.map(function(sub) { 
      return cols.map(function(c) { 
        var val = sub[c]; 
        return '"' + String(Array.isArray(val) ? val.join(", ") : (val || "")).replace(/"/g, '""') + '"'; 
      }).join(","); 
    }));
    var blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename + ".csv"; a.click();
  }

  // --- QUESTIONS MANAGEMENT (Unchanged from before) ---
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

  setLang("sw");
})();
