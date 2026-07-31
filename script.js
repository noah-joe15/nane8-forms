(function () {
  "use strict";
  var form = document.getElementById("surveyForm");
  var container = document.getElementById("dynamicFormContainer");
  var current = 0;
  var lang = "sw";
  var stepsData = [];
  var totalSteps = 0;

  // Helper to escape CSS selectors
  function cssEscape(s) { return s.replace(/([^\w-])/g, "\\$1"); }

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
      
      // SAFEGUARD: If admin hasn't added questions yet, show a clear message
      if (stepsData.length === 0) {
        document.getElementById("formLoader").innerHTML = 
          '<p style="color:var(--danger); font-weight:600;">Hakuna maswali yaliyowekwa bado.<br>No questions have been configured yet.</p>' +
          '<p style="color:var(--ink-soft); font-size:13px; margin-top:8px;">Tafadhali wasiliana na msimamizi wa mfumo.<br>Please contact the system administrator.</p>';
        return;
      }

      totalSteps = stepsData.length + 1; 
      
      document.getElementById("stepTotal").textContent = totalSteps;
      buildHTML();
      setupOtherToggles();
      
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
          
          // Add "Other" field placeholders
          if (q.options.includes("Nyingine") || q.options.includes("Other") || q.options.includes("Mwingine")) {
             field.innerHTML += `<input class="text-input other-field" type="text" name="${q.field_name}_other" data-other-for="${q.field_name}" data-other-value="Nyingine" hidden placeholder="Taja / Specify">`;
             field.innerHTML += `<input class="text-input other-field" type="text" name="${q.field_name}_other" data-other-for="${q.field_name}" data-other-value="Other" hidden placeholder="Specify">`;
             field.innerHTML += `<input class="text-input other-field" type="text" name="${q.field_name}_other" data-other-for="${q.field_name}" data-other-value="Mwingine" hidden placeholder="Taja">`;
          }
        }
        field.innerHTML += `<p class="error-msg lang-sw">Tafadhali jaza sehemu hii.</p><p class="error-msg lang-en">Please fill this field.</p>`;
        card.appendChild(field);
      });
      div.appendChild(card);
      container.appendChild(div);
    });
  }

  function setupOtherToggles() {
    document.querySelectorAll(".other-field").forEach(function (otherInput) {
      var groupName = otherInput.dataset.otherFor;
      var triggerValue = otherInput.dataset.otherValue;
      var group = form.querySelectorAll('[name="' + cssEscape(groupName) + '"]');
      function refresh() {
        var active = Array.prototype.some.call(group, function (inp) {
          return inp.checked && inp.value === triggerValue;
        });
        otherInput.hidden = !active;
        if (!active) otherInput.value = "";
      }
      group.forEach(function (inp) { inp.addEventListener("change", refresh); });
      refresh();
    });
  }

  function showStep(idx) {
    // Hide ALL steps, including the success screen
    document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));
    
    // Show the target step
    var target = document.querySelector(`.step[data-step="${idx}"]`);
    if (!target && idx === stepsData.length) {
      target = document.querySelector(`.step[data-step="review"]`);
    }
    if (target) target.classList.add("active");
    
    var isReview = (idx === stepsData.length);
    
    document.getElementById("btnBack").style.visibility = idx === 0 ? "hidden" : "visible";
    document.getElementById("btnNext").style.display = isReview ? "none" : "inline-flex";
    document.getElementById("btnSubmit").style.display = isReview ? "inline-flex" : "none";
    
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

  // --- BULLETPROOF RESET FUNCTION ---
  window.resetForm = function () {
    var confirmMsg = lang === "sw" 
      ? "Una uhakika unataka kuanza upya? Majibu yako yote yatafutwa." 
      : "Are you sure you want to start over? All your answers will be cleared.";
      
    if (confirm(confirmMsg)) {
      // 1. Clear all standard form inputs
      form.reset();
      
      // 2. Reset internal step counter
      current = 0;
      
      // 3. FORCE hide success screen and show form elements
      document.getElementById("successStep").classList.remove("active");
      document.getElementById("stepNav").style.display = "flex";
      document.querySelector(".progress-wrap").style.display = "block";
      
      // 4. Hide error banners and remove error highlights
      document.getElementById("errorBanner").classList.remove("show");
      document.querySelectorAll(".has-error").forEach(function(el) {
        el.classList.remove("has-error");
      });
      
      // 5. Force hide and clear ALL "other" specify fields
      document.querySelectorAll(".other-field").forEach(function(el) {
        el.hidden = true;
        el.value = "";
      });
      
      // 6. Re-evaluate toggles to ensure perfect clean state
      setupOtherToggles();
      
      // 7. Return to step 0
      showStep(0);
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
          var r = document.querySelector(`input[name="${cssEscape(q.field_name)}"]:checked`);
          val = r ? r.value : "—";
        } else if (q.input_type === 'checkbox') {
          var cs = document.querySelectorAll(`input[name="${cssEscape(q.field_name)}"]:checked`);
          val = cs.length ? Array.from(cs).map(c => c.value).join(", ") : "—";
        } else {
          var t = document.querySelector(`[name="${cssEscape(q.field_name)}"]`);
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
      if (k.includes("bot-field") || k.includes("form-name")) return;
      if (payload[k]) { payload[k] = Array.isArray(payload[k]) ? [...payload[k], v] : [payload[k], v]; } 
      else { payload[k] = v; }
    });
    payload.submitted_at = new Date().toISOString();

    try {
      const { error } = await supabaseClient.from('nanenane_responses').insert([{ form_data: payload }]);
      if (error) throw error;
      
      // Hide form, show success
      document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));
      document.getElementById("successStep").classList.add("active");
      document.getElementById("stepNav").style.display = "none";
      document.querySelector(".progress-wrap").style.display = "none";
      document.getElementById("errorBanner").classList.remove("show");
    } catch (err) {
      alert("Hitilafu / Error: " + err.message);
      btn.disabled = false; btn.textContent = "Tuma Dodoso";
    }
  });

  initForm();
  setLang("sw");
})();
