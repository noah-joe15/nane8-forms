(function () {
  "use strict";
  var form = document.getElementById("surveyForm");
  var container = document.getElementById("dynamicFormContainer");
  var current = 0;
  var lang = "sw";
  var stepsData = [];
  var totalSteps = 0;

  // 1. Fetch questions and build form
  async function initForm() {
    try {
      const { data, error } = await supabaseClient.from('survey_questions').select('*').order('step_number').order('sort_order');
      if (error) throw error;
      
      var grouped = {};
      data.forEach(q => {
        if (!grouped[q.step_number]) grouped[q.step_number] = [];
        grouped[q.step_number].push(q);
      });
      
      stepsData = Object.keys(grouped).map(k => ({ step: parseInt(k), questions: grouped[k] }));
      totalSteps = stepsData.length + 1; 
      
      document.getElementById("stepTotal").textContent = totalSteps;
      buildHTML();
      document.getElementById("formLoader").style.display = "none";
      form.style.display = "block";
      showStep(0);
    } catch (err) {
      document.getElementById("formLoader").innerHTML = '<p style="color:var(--danger)">Hitilafu / Error: ' + err.message + '</p>';
    }
  }

  function buildHTML() {
    container.innerHTML = "";
    stepsData.forEach((stepObj, idx) => {
      var div = document.createElement("div");
      div.className = "step";
      div.dataset.step = idx;
      
      var card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `<span class="section-eyebrow">Sehemu ${idx}</span><h2 class="section-title">Swali la Hatua ${idx}</h2>`;
      
      stepObj.questions.forEach(q => {
        var field = document.createElement("div");
        field.className = "field";
        field.dataset.field = q.field_name;
        
        var label = document.createElement("label");
        label.className = "field-label";
        label.innerHTML = `<span class="lang-sw">${q.label_sw}</span><span class="lang-en">${q.label_en}</span>${q.is_required ? '<span class="req">*</span>' : ''}`;
        field.appendChild(label);
        
        if (q.input_type === 'text') {
          field.innerHTML += `<input class="text-input" type="text" name="${q.field_name}" ${q.is_required ? 'required' : ''}>`;
        } else if (q.input_type === 'textarea') {
          field.innerHTML += `<textarea class="text-input" name="${q.field_name}" rows="4" ${q.is_required ? 'required' : ''}></textarea>`;
        } else if (q.input_type === 'radio' || q.input_type === 'checkbox') {
          var optsDiv = document.createElement("div");
          optsDiv.className = "options" + (q.input_type === 'radio' && q.options && q.options.length <= 2 ? " grid-2" : "");
          if(q.options) {
            q.options.forEach(opt => {
              optsDiv.innerHTML += `<label class="option ${q.input_type === 'checkbox' ? 'checkbox' : ''}">
                <input type="${q.input_type}" name="${q.field_name}" value="${opt}" ${q.is_required ? 'required' : ''}>
                <span class="option-box">${opt}</span></label>`;
            });
          }
          field.appendChild(optsDiv);
        }
        field.innerHTML += `<p class="error-msg lang-sw">Tafadhali jaza sehemu hii.</p><p class="error-msg lang-en">Please fill this field.</p>`;
        card.appendChild(field);
      });
      div.appendChild(card);
      container.appendChild(div);
    });
  }

  function showStep(idx) {
    document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));
    var target = document.querySelector(`.step[data-step="${idx}"]`) || document.querySelector(`.step[data-step="review"]`);
    if(target) target.classList.add("active");
    
    var isReview = idx === stepsData.length;
    
    document.getElementById("btnBack").style.visibility = idx === 0 ? "hidden" : "visible";
    document.getElementById("btnNext").style.display = isReview ? "none" : "inline-flex";
    document.getElementById("btnSubmit").style.display = isReview ? "inline-flex" : "none";
    
    // Show "Start Over" button ONLY on the review step
    var btnReset = document.getElementById("btnReset");
    if (btnReset) {
      btnReset.style.display = isReview ? "inline-flex" : "none";
    }

    if (isReview) renderReview();
    updateProgress(idx);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.goStep = function (dir) {
    if (dir > 0 && !validateStep(current)) {
      document.getElementById("errorBanner").classList.add("show");
      return;
    }
    document.getElementById("errorBanner").classList.remove("show");
    var next = current + dir;
    if (next < 0 || next > stepsData.length) return;
    current = next;
    showStep(current);
  };

  // NEW: Reset Form Function
  window.resetForm = function () {
    var confirmMsg = lang === "sw" 
      ? "Una uhakika unataka kuanza upya? Majibu yako yote yatafutwa." 
      : "Are you sure you want to start over? All your answers will be cleared.";
      
    if (confirm(confirmMsg)) {
      form.reset(); // Clears all inputs
      current = 0;  // Resets step counter
      document.getElementById("errorBanner").classList.remove("show");
      showStep(0);  // Goes back to step 0
    }
  };

  function validateStep(idx) {
    var stepEl = document.querySelector(`.step[data-step="${idx}"]`);
    if (!stepEl) return true;
    var ok = true;
    stepEl.querySelectorAll(".field").forEach(f => {
      f.classList.remove("has-error");
      var reqs = f.querySelectorAll("[required]");
      if (!reqs.length) return;
      var type = reqs[0].type;
      var satisfied = type === "radio" || type === "checkbox" ? !!f.querySelector('input:checked') : Array.from(reqs).every(i => i.value.trim().length > 0);
      if (!satisfied) { ok = false; f.classList.add("has-error"); }
    });
    return ok;
  }

  function updateProgress(idx) {
    var pct = ((idx + 1) / totalSteps) * 100;
    document.getElementById("progressFill").style.width = pct + "%";
    document.getElementById("stepNow").textContent = idx + 1;
  }

  window.setLang = function (l) {
    lang = l;
    document.body.className = "lang-" + l;
    document.getElementById("btn-lang-sw").classList.toggle("active", l === "sw");
    document.getElementById("btn-lang-en").classList.toggle("active", l === "en");
  };

  function renderReview() {
    var out = document.getElementById("reviewOutput");
    out.innerHTML = "";
    stepsData.forEach((stepObj, idx) => {
      var wrap = document.createElement("div");
      wrap.className = "review-group";
      wrap.innerHTML = `<h3>Sehemu ${idx}</h3>`;
      stepObj.questions.forEach(q => {
        var val = "";
        if (q.input_type === 'radio') {
          var r = document.querySelector(`input[name="${q.field_name}"]:checked`);
          val = r ? r.value : "—";
        } else if (q.input_type === 'checkbox') {
          var cs = document.querySelectorAll(`input[name="${q.field_name}"]:checked`);
          val = cs.length ? Array.from(cs).map(c => c.value).join(", ") : "—";
        } else {
          var t = document.querySelector(`[name="${q.field_name}"]`);
          val = t && t.value.trim() ? t.value.trim() : "—";
        }
        wrap.innerHTML += `<div class="review-row"><span class="rq">${lang === 'sw' ? q.label_sw : q.label_en}</span><span class="ra">${val}</span></div>`;
      });
      out.appendChild(wrap);
    });
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var btn = document.getElementById("btnSubmit");
    btn.disabled = true; btn.textContent = "Inatuma...";
    
    var fd = new FormData(form);
    var payload = {};
    fd.forEach((v, k) => {
      if (payload[k]) { payload[k] = Array.isArray(payload[k]) ? [...payload[k], v] : [payload[k], v]; } 
      else { payload[k] = v; }
    });
    payload.submitted_at = new Date().toISOString();

    try {
      const { error } = await supabaseClient.from('nanenane_responses').insert([{ form_data: payload }]);
      if (error) throw error;
      document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));
      document.getElementById("successStep").classList.add("active");
      document.getElementById("stepNav").style.display = "none";
    } catch (err) {
      alert("Hitilafu / Error: " + err.message);
      btn.disabled = false; btn.textContent = "Tuma Dodoso";
    }
  });

  initForm();
  setLang("sw");
})();
