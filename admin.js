(function () {
  "use strict";
  var ADMIN_PASSWORD = "1234";
  var loggedIn = false;
  var allSubmissions = [];
  var allQuestions = [];

  // --- LANGUAGE TOGGLE LOGIC ---
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
    document.getElementById("questionsTab").style.display = tab === "questions" ? "block" : "none";
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  };

  // --- RESPONSES LOGIC ---
  window.loadSubmissions = async function () {
    var holder = document.getElementById("tableHolder");
    holder.innerHTML = '<div class="state-msg"><span class="lang-sw">Inapakia majibu…</span><span class="lang-en">Loading responses…</span></div>';
    try {
      const { data, error } = await supabaseClient.from('nanenane_responses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      allSubmissions = (data || []).map(sub => {
        var fields = sub.form_data || {};
        if (!fields.submitted_at && sub.created_at) fields.submitted_at = sub.created_at;
        return fields;
      });
      renderTable();
    } catch (err) {
      holder.innerHTML = '<div class="state-msg" style="color:var(--danger)">Hitilafu / Error: ' + err.message + '</div>';
    }
  };

  window.renderTable = function () {
    var query = (document.getElementById("searchInput").value || "").toLowerCase();
    var rows = allSubmissions.filter(sub => !query || Object.values(sub).some(v => String(v).toLowerCase().includes(query)));
    document.getElementById("countPill").innerHTML = rows.length + ' <span class="lang-sw">majibu</span><span class="lang-en">responses</span>';
    
    if (!rows.length) { 
      document.getElementById("tableHolder").innerHTML = '<div class="state-msg"><span class="lang-sw">Hakuna majibu bado.</span><span class="lang-en">No responses yet.</span></div>'; 
      return; 
    }
    
    // Collect ALL unique keys from ALL rows to ensure we don't miss columns
    var allKeys = new Set();
    rows.forEach(sub => {
      Object.keys(sub).forEach(k => {
        if (k !== "form-name" && k !== "bot-field") allKeys.add(k);
      });
    });
    var cols = Array.from(allKeys);

    var html = '<table><thead><tr>' + cols.map(c => '<th>' + c.replace(/_/g, " ") + '</th>').join("") + '</tr></thead><tbody>';
    rows.forEach(sub => {
      html += '<tr>' + cols.map(c => '<td>' + (Array.isArray(sub[c]) ? sub[c].join(", ") : (sub[c] || "")) + '</td>').join("") + '</tr>';
    });
    document.getElementById("tableHolder").innerHTML = '<div class="table-wrap">' + html + '</tbody></table></div>';
  };

  window.exportCsv = function () {
    if (!allSubmissions.length) return;
    var allKeys = new Set();
    allSubmissions.forEach(sub => Object.keys(sub).forEach(k => { if (k !== "form-name" && k !== "bot-field") allKeys.add(k); }));
    var cols = Array.from(allKeys);
    var lines = [cols.join(",")].concat(allSubmissions.map(sub => cols.map(c => '"' + String(Array.isArray(sub[c]) ? sub[c].join(", ") : (sub[c] || "")).replace(/"/g, '""') + '"').join(",")));
    var blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "majibu.csv"; a.click();
  };

  // --- QUESTIONS LOGIC ---
  window.loadQuestions = async function () {
    var holder = document.getElementById("questionsHolder");
    try {
      const { data, error } = await supabaseClient.from('survey_questions').select('*').order('step_number', { ascending: true }).order('sort_order', { ascending: true });
      if (error) throw error;
      allQuestions = data || [];
      renderQuestions();
    } catch (err) {
      holder.innerHTML = '<div class="state-msg" style="color:var(--danger)">Hitilafu / Error: ' + err.message + '</div>';
    }
  };

  window.renderQuestions = function () {
    if (!allQuestions.length) { document.getElementById("questionsHolder").innerHTML = '<div class="state-msg"><span class="lang-sw">Hakuna maswali bado. Ongeza swali la kwanza hapa juu!</span><span class="lang-en">No questions yet. Add your first question above!</span></div>'; return; }
    var html = '<table><thead><tr><th>Step</th><th>Field</th><th>Label (SW)</th><th>Type</th><th>Actions</th></tr></thead><tbody>';
    allQuestions.forEach(q => {
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
    var type = document.getElementById("q_type").value;
    document.getElementById("optionsField").style.display = (type === "radio" || type === "checkbox") ? "block" : "none";
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
      payload.options = opts.split(",").map(o => o.trim()).filter(o => o);
    }
    try {
      if (id) { await supabaseClient.from('survey_questions').update(payload).eq('id', id); } 
      else { await supabaseClient.from('survey_questions').insert([payload]); }
      resetQForm(); loadQuestions(); alert("Swali limehifadhiwa! / Question saved!");
    } catch (err) { alert("Hitilafu / Error: " + err.message); }
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
    if (!confirm("Una uhakika? / Are you sure?")) return;
    await supabaseClient.from('survey_questions').delete().eq('id', id);
    loadQuestions();
  };

  window.resetQForm = function () {
    document.getElementById("questionForm").reset();
    document.getElementById("q_id").value = "";
    toggleOptions();
  };

  // Initialize language on load
  setLang("sw");
})();
