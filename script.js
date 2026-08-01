// ============================================================
// Nanenane / 51st DITF Survey — client logic (Hardcoded Version)
// Pure vanilla JS. Works perfectly with the hardcoded index.html.
// ============================================================
(function () {
  "use strict";

  var form = document.getElementById("surveyForm");
  var steps = Array.prototype.slice.call(document.querySelectorAll(".step"));
  var formSteps = steps.filter(function (s) { return s.dataset.step !== "success"; });
  var totalSteps = formSteps.length;
  var current = 0;
  var lang = "sw";

  var STEP_LABELS = {
    0: { sw: "Karibu", en: "Welcome" },
    1: { sw: "Sehemu A · Taarifa za Msingi", en: "Section A · Basic Info" },
    2: { sw: "Sehemu B · Hali ya Biashara", en: "Section B · Business Status" },
    3: { sw: "Sehemu C · Made in Tanzania", en: "Section C · Made in Tanzania" },
    4: { sw: "Sehemu D · Masoko na Mauzo", en: "Section D · Markets & Sales" },
    5: { sw: "Sehemu E · 51st DITF", en: "Section E · 51st DITF" },
    6: { sw: "Sehemu F & G · Changamoto", en: "Section F & G · Challenges" },
    7: { sw: "Kagua na Tuma", en: "Review & Submit" }
  };

  // ---------- language ----------------------------------------------------
  window.setLang = function (l) {
    lang = l;
    document.body.classList.remove("lang-sw", "lang-en");
    document.body.classList.add("lang-" + l);
    document.getElementById("btn-lang-sw").classList.toggle("active", l === "sw");
    document.getElementById("btn-lang-en").classList.toggle("active", l === "en");
    document.documentElement.setAttribute("lang", l);
    updateStepLabel();
  };

  // ---------- progress ------------------------------------------------------
  function buildDots() {
    var wrap = document.getElementById("progressDots");
    wrap.innerHTML = "";
    for (var i = 0; i < totalSteps; i++) {
      var dot = document.createElement("i");
      wrap.appendChild(dot);
    }
  }

  function updateProgress() {
    var pct = ((current + 1) / totalSteps) * 100;
    document.getElementById("progressFill").style.width = pct + "%";
    document.getElementById("stepNow").textContent = current + 1;
    document.getElementById("stepTotal").textContent = totalSteps;
    var dots = document.querySelectorAll("#progressDots i");
    dots.forEach(function (d, i) {
      d.classList.toggle("done", i < current);
      d.classList.toggle("current", i === current);
    });
    updateStepLabel();
  }

  function updateStepLabel() {
    var lbl = STEP_LABELS[current];
    if (lbl) document.getElementById("stepLabel").textContent = lbl[lang];
  }

  // ---------- step visibility -------------------------------------------------
  function showStep(idx) {
    formSteps.forEach(function (s) {
      s.classList.toggle("active", parseInt(s.dataset.step, 10) === idx);
    });
    document.getElementById("btnBack").style.visibility = idx === 0 ? "hidden" : "visible";
    var isLast = idx === totalSteps - 1;
    document.getElementById("btnNext").style.display = isLast ? "none" : "inline-flex";
    document.getElementById("btnSubmit").style.display = isLast ? "inline-flex" : "none";
    
    // Show "Start Over" button ONLY on the review step
    var btnReset = document.getElementById("btnReset");
    if (btnReset) {
      btnReset.style.display = isLast ? "inline-flex" : "none";
    }

    if (isLast) renderReview();
    updateProgress();
    hideBanner();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.goStep = function (dir) {
    if (dir > 0 && !validateStep(current)) {
      showBanner();
      return;
    }
    var next = current + dir;
    if (next < 0 || next > totalSteps - 1) return;
    current = next;
    showStep(current);
  };

  window.jumpToStep = function (idx) {
    current = idx;
    showStep(current);
  };

  function showBanner() { document.getElementById("errorBanner").classList.add("show"); }
  function hideBanner() { document.getElementById("errorBanner").classList.remove("show"); }

  // ---------- validation -----------------------------------------------------
  function validateStep(idx) {
    var stepEl = formSteps[idx];
    var ok = true;
    var fields = stepEl.querySelectorAll(".field");
    fields.forEach(function (fieldEl) {
      fieldEl.classList.remove("has-error");
      var requiredInputs = fieldEl.querySelectorAll("[required]");
      if (!requiredInputs.length) return;
      var type = requiredInputs[0].type;
      var satisfied = true;
      if (type === "radio" || type === "checkbox") {
        var name = requiredInputs[0].name;
        satisfied = !!stepEl.querySelector('input[name="' + cssEscape(name) + '"]:checked');
      } else {
        satisfied = Array.prototype.every.call(requiredInputs, function (inp) {
          return inp.value.trim().length > 0 && (inp.type !== "email" || /^\S+@\S+\.\S+$/.test(inp.value));
        });
      }
      if (!satisfied) { ok = false; fieldEl.classList.add("has-error"); }
    });
    return ok;
  }

  function cssEscape(s) { return s.replace(/([^\w-])/g, "\\$1"); }

  // ---------- "other, specify" toggles ----------------------------------------
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

  // ---------- review screen -----------------------------------------------------
  var REVIEW_GROUPS = [
    { titleSw: "Taarifa za Kampuni na Mwitikio", titleEn: "Company & Respondent Details", step: 0, fields: ["jina_la_kampuni", "tin_number", "anwani_kampuni", "respondent_name", "respondent_email", "respondent_phone", "location"] },
    { titleSw: "Sehemu A", titleEn: "Section A", step: 1, fields: ["wewe_ni", "jinsia", "mkoa", "wilaya", "sekta", "muda_shughuli"] },
    { titleSw: "Sehemu B", titleEn: "Section B", step: 2, fields: ["hali_biashara", "uzalishaji_umeongezeka", "mauzo", "sababu_zinazoathiri[]"] },
    { titleSw: "Sehemu C", titleEn: "Section C", step: 3, fields: ["bidhaa_zinazozalishwa_tz", "bidhaa_zimesajiliwa", "kama_hapana_sababu[]", "msaada_mit[]"] },
    { titleSw: "Sehemu D", titleEn: "Section D", step: 4, fields: ["maeneo_mauzo[]", "njia_kupata_wateja[]", "amewahi_kushiriki_maonesho", "maonesho_yamesaidia[]"] },
    { titleSw: "Sehemu E", titleEn: "Section E", step: 5, fields: ["mpango_kushiriki_51st", "lengo_kushiriki", "msaada_kabla_kushiriki[]", "changamoto_kuzuia[]"] },
    { titleSw: "Sehemu F & G", titleEn: "Section F & G", step: 6, fields: ["changamoto_kukuza_biashara[]", "aina_msaada_unaohitaji[]", "mapendekezo"] }
  ];

  function fieldLabelText(name) {
    var baseName = name.replace("[]", "");
    var labelEl = form.querySelector('[data-field="' + baseName + '"] .field-label') ||
                  form.querySelector('[data-field="' + baseName.replace("_other", "") + '"] .field-label');
    if (!labelEl) return name;
    var span = labelEl.querySelector(".lang-" + lang);
    return span ? span.textContent.replace(/^\d+\.\s*/, "") : labelEl.textContent.trim();
  }

  function fieldValueText(name) {
    if (name.indexOf("[]") > -1) {
      var boxes = form.querySelectorAll('input[name="' + cssEscape(name) + '"]:checked');
      var vals = Array.prototype.map.call(boxes, function (b) { return b.value; });
      var otherName = name.replace("[]", "_other");
      var otherInput = form.querySelector('[name="' + cssEscape(otherName) + '"]');
      if (otherInput && otherInput.value.trim() && (vals.indexOf("Nyingine") > -1 || vals.indexOf("Other") > -1 || vals.indexOf("Mwingine") > -1)) {
        vals = vals.filter(function (v) { return v !== "Nyingine" && v !== "Other" && v !== "Mwingine"; });
        vals.push(otherInput.value.trim());
      }
      return vals.length ? vals.join(", ") : (lang === "sw" ? "— Hakuna —" : "— None —");
    }
    var radio = form.querySelector('input[name="' + cssEscape(name) + '"]:checked');
    if (radio) {
      if (radio.value === "Nyingine" || radio.value === "Mwingine" || radio.value === "Other") {
        var oi = form.querySelector('[name="' + cssEscape(name) + '_other"]');
        if (oi && oi.value.trim()) return oi.value.trim();
      }
      return radio.value;
    }
    var textEl = form.querySelector('[name="' + cssEscape(name) + '"]');
    if (textEl && (textEl.tagName === "INPUT" || textEl.tagName === "TEXTAREA")) {
      return textEl.value.trim() || (lang === "sw" ? "— Hakujazwa —" : "— Not filled —");
    }
    return "—";
  }

  function renderReview() {
    var out = document.getElementById("reviewOutput");
    out.innerHTML = "";
    REVIEW_GROUPS.forEach(function (group) {
      var wrap = document.createElement("div");
      wrap.className = "review-group";
      var h3 = document.createElement("h3");
      h3.style.display = "flex";
      h3.style.justifyContent = "space-between";
      h3.style.alignItems = "center";
      var titleSpan = document.createElement("span");
      titleSpan.textContent = lang === "sw" ? group.titleSw : group.titleEn;
      var editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "edit-link";
      editBtn.textContent = lang === "sw" ? "Rekebisha" : "Edit";
      editBtn.onclick = function () { jumpToStep(group.step); };
      h3.appendChild(titleSpan);
      h3.appendChild(editBtn);
      wrap.appendChild(h3);
      group.fields.forEach(function (name) {
        var row = document.createElement("div");
        row.className = "review-row";
        var rq = document.createElement("span");
        rq.className = "rq";
        rq.textContent = fieldLabelText(name);
        var ra = document.createElement("span");
        ra.className = "ra";
        ra.textContent = fieldValueText(name);
        row.appendChild(rq);
        row.appendChild(ra);
        wrap.appendChild(row);
      });
      out.appendChild(wrap);
    });
  }

  // ---------- submission (Supabase pattern) --------------------------------
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!validateStep(current)) { 
      showBanner(); 
      return; 
    }

    var submitBtn = document.getElementById("btnSubmit");
    var originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = lang === "sw" ? "Inatuma..." : "Submitting...";

    var fd = new FormData(form);
    var payload = {};
    
    fd.forEach(function (value, key) {
      if (key === "bot-field" || key === "form-name") return; 
      
      if (payload.hasOwnProperty(key)) {
        if (Array.isArray(payload[key])) {
          payload[key].push(value);
        } else {
          payload[key] = [payload[key], value];
        }
      } else {
        payload[key] = value;
      }
    });

    payload.submitted_at = new Date().toISOString();

    try {
      if (typeof supabaseClient === 'undefined') {
        throw new Error("Supabase client not initialized. Check index.html");
      }

      const { error } = await supabaseClient
        .from('nanenane_responses')
        .insert([{ form_data: payload }]);

      if (error) throw error;

      // Success: Hide form, show success screen
      document.getElementById("stepNav").style.display = "none";
      formSteps.forEach(function (s) { s.classList.remove("active"); });
      document.getElementById("successStep").classList.add("active");
      document.querySelector(".progress-wrap").style.display = "none";
      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (err) {
      console.error("Submission error:", err);
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      alert(lang === "sw" 
        ? "Imeshindikana kutuma. Tafadhali hakikisha una mtandao kisha jaribu tena." 
        : "Submission failed. Please check your connection and try again.");
    }
  });

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

  // ---------- init ----------------------------------------------------------------
  buildDots();
  setupOtherToggles();
  showStep(0);
  setLang("sw");
})();
