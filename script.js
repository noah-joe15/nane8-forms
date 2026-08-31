// ============================================================
// Unified Survey Logic (Nanenane & Wadau Malighafi)
// Pure vanilla JS. Dynamically adapts to the active form.
// ============================================================
(function () {
  "use strict";

  var form = document.getElementById("surveyForm");
  var formId = form ? (form.getAttribute("data-form-id") || "nanenane") : "nanenane";
  
  var steps = Array.prototype.slice.call(document.querySelectorAll(".step"));
  var formSteps = steps.filter(function (s) { return s.dataset.step !== "success"; });
  var totalSteps = formSteps.length;
  var current = 0;
  var lang = "sw";

  // ---------- Dynamic Step Labels based on Form ID ----------
  var STEP_LABELS = formId === "wadau-malighafi" ? {
    0: { sw: "Utangulizi & Ridhaa", en: "Intro & Consent" },
    1: { sw: "Sehemu C · Taarifa za Msingi", en: "Section C · Basic Info" },
    2: { sw: "Sehemu D · Uzalishaji", en: "Section D · Production" },
    3: { sw: "Sehemu E · Soko (Ndani)", en: "Section E · Domestic Market" },
    4: { sw: "Sehemu F · Usafirishaji Nje", en: "Section F · Export" },
    5: { sw: "Sehemu G & H · Uchakataji & Fedha", en: "Section G & H · Processing & Finance" },
    6: { sw: "Sehemu I & J · Miundombinu & Sera", en: "Section I & J · Infrastructure & Policy" },
    7: { sw: "Sehemu K, L & M · Ushirikiano & Vikwazo", en: "Section K, L & M · Collaboration & Constraints" },
    8: { sw: "Sehemu N · Maoni", en: "Section N · Opinions" },
    9: { sw: "Kagua na Tuma", en: "Review & Submit" }
  } : {
    0: { sw: "Karibu", en: "Welcome" },
    1: { sw: "Sehemu A · Taarifa za Msingi", en: "Section A · Basic Info" },
    2: { sw: "Sehemu B · Hali ya Biashara", en: "Section B · Business Status" },
    3: { sw: "Sehemu C · Made in Tanzania", en: "Section C · Made in Tanzania" },
    4: { sw: "Sehemu D · Masoko na Mauzo", en: "Section D · Markets & Sales" },
    5: { sw: "Sehemu E · 51st DITF", en: "Section E · 51st DITF" },
    6: { sw: "Sehemu F & G · Changamoto", en: "Section F & G · Challenges" },
    7: { sw: "Kagua na Tuma", en: "Review & Submit" }
  };

  // ---------- Dynamic Review Groups based on Form ID ----------
  var REVIEW_GROUPS = formId === "wadau-malighafi" ? [
    { titleSw: "Utangulizi & Ridhaa", titleEn: "Intro & Consent", step: 0, fields: ["consent_b1", "consent_b2", "mkoa", "wilaya", "researcher_name"] },
    { titleSw: "Sehemu C", titleEn: "Section C", step: 1, fields: ["bidhaa[]", "jina_mhojiwa", "cheo", "taasisi", "jinsia", "aina_mdau[]", "kiwango_shughuli"] },
    { titleSw: "Sehemu D", titleEn: "Section D", step: 2, fields: ["kiasi_2024", "kipimo_2024", "thamani_2024", "mwelekeo_uzalishaji", "sababu_mwelekeo", "kipindi_upatikanaji", "miezi_upatikanaji", "chanzo_malighafi", "inakidhi_mahitaji"] },
    { titleSw: "Sehemu E", titleEn: "Section E", step: 3, fields: ["wanunuzi_wakuu[]", "hali_bidhaa_inapouzwa", "asilimia_thamani", "bei_huamuliwaje", "mikataba_mauzo"] },
    { titleSw: "Sehemu F", titleEn: "Section F", step: 4, fields: ["husika_mojakwamoja_nje", "sababu_kuuza_ghafi[]", "faida_kuuza_ghafi", "faida_kuuza_ghafi_eleza", "changamoto_ubora_nje[]", "vifungashio_nje"] },
    { titleSw: "Sehemu G & H", titleEn: "Section G & H", step: 5, fields: ["inachakata_bidhaa", "kiwango_uchakataji", "sababu_kutotumia_ukomo[]", "vyeti_bidhaa", "chanzo_mtaji", "vikwazo_fedha[]"] },
    { titleSw: "Sehemu I & J", titleEn: "Section I & J", step: 6, fields: ["hali_miundombinu", "upotevu_bidhaa", "sera_zinaunga_mkono", "muda_urahisi_taratu", "mapendekezo_sera"] },
    { titleSw: "Sehemu K, L & M", titleEn: "Section K, L & M", step: 7, fields: ["kiwango_ushirikiano", "mfumo_ushirikiano[]", "fursa_uwekezaji", "uwezekano_kuongeza_uchakataji", "kikwazo_kikubwa"] },
    { titleSw: "Sehemu N", titleEn: "Section N", step: 8, fields: ["hatua_tatu_maramoja", "jukumu_serikali", "jukumu_sekta_binafsi", "maoni_mengine"] }
  ] : [
    { titleSw: "Taarifa za Kampuni na Mwitikio", titleEn: "Company & Respondent Details", step: 0, fields: ["jina_la_kampuni", "tin_number", "anwani_kampuni", "respondent_name", "respondent_email", "respondent_phone", "location"] },
    { titleSw: "Sehemu A", titleEn: "Section A", step: 1, fields: ["wewe_ni", "jinsia", "mkoa", "wilaya", "sekta", "muda_shughuli"] },
    { titleSw: "Sehemu B", titleEn: "Section B", step: 2, fields: ["hali_biashara", "uzalishaji_umeongezeka", "mauzo", "sababu_zinazoathiri[]"] },
    { titleSw: "Sehemu C", titleEn: "Section C", step: 3, fields: ["bidhaa_zinazozalishwa_tz", "bidhaa_zimesajiliwa", "kama_hapana_sababu[]", "msaada_mit[]"] },
    { titleSw: "Sehemu D", titleEn: "Section D", step: 4, fields: ["maeneo_mauzo[]", "njia_kupata_wateja[]", "amewahi_kushiriki_maonesho", "maonesho_yamesaidia[]"] },
    { titleSw: "Sehemu E", titleEn: "Section E", step: 5, fields: ["mpango_kushiriki_51st", "lengo_kushiriki", "msaada_kabla_kushiriki[]", "changamoto_kuzuia[]"] },
    { titleSw: "Sehemu F & G", titleEn: "Section F & G", step: 6, fields: ["changamoto_kukuza_biashara[]", "aina_msaada_unaohitaji[]", "mapendekezo"] }
  ];

  // ---------- LANGUAGE FUNCTION - EXPOSED TO WINDOW ----------
  window.setLang = function (l) {
    lang = l;
    document.body.classList.remove("lang-sw", "lang-en");
    document.body.classList.add("lang-" + l);
    var btnSw = document.getElementById("btn-lang-sw");
    var btnEn = document.getElementById("btn-lang-en");
    if (btnSw) btnSw.classList.toggle("active", l === "sw");
    if (btnEn) btnEn.classList.toggle("active", l === "en");
    document.documentElement.setAttribute("lang", l);
    updateStepLabel();
  };

  // ---------- PROGRESS BARS ----------
  function buildDots() {
    var wrap = document.getElementById("progressDots");
    if (!wrap) return;
    wrap.innerHTML = "";
    for (var i = 0; i < totalSteps; i++) {
      var dot = document.createElement("i");
      wrap.appendChild(dot);
    }
  }

  function updateProgress() {
    var pct = ((current + 1) / totalSteps) * 100;
    var fill = document.getElementById("progressFill");
    var now = document.getElementById("stepNow");
    var total = document.getElementById("stepTotal");
    if (fill) fill.style.width = pct + "%";
    if (now) now.textContent = current + 1;
    if (total) total.textContent = totalSteps;
    
    var dots = document.querySelectorAll("#progressDots i");
    dots.forEach(function (d, i) {
      d.classList.toggle("done", i < current);
      d.classList.toggle("current", i === current);
    });
    updateStepLabel();
  }

  function updateStepLabel() {
    var lbl = STEP_LABELS[current];
    var labelEl = document.getElementById("stepLabel");
    if (lbl && labelEl) labelEl.textContent = lbl[lang];
  }

  // ---------- STEP NAVIGATION ----------
  function showStep(idx) {
    formSteps.forEach(function (s) {
      s.classList.toggle("active", parseInt(s.dataset.step, 10) === idx);
    });
    
    var btnBack = document.getElementById("btnBack");
    if (btnBack) btnBack.style.visibility = idx === 0 ? "hidden" : "visible";
    
    var isLast = idx === totalSteps - 1;
    var btnNext = document.getElementById("btnNext");
    var btnSubmit = document.getElementById("btnSubmit");
    var btnReset = document.getElementById("btnReset");
    
    if (btnNext) btnNext.style.display = isLast ? "none" : "inline-flex";
    if (btnSubmit) btnSubmit.style.display = isLast ? "inline-flex" : "none";
    if (btnReset) btnReset.style.display = isLast ? "inline-flex" : "none";

    if (isLast) renderReview();
    updateProgress();
    hideBanner();
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
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

  function showBanner() { 
    var banner = document.getElementById("errorBanner");
    if (banner) banner.classList.add("show"); 
  }
  
  function hideBanner() { 
    var banner = document.getElementById("errorBanner");
    if (banner) banner.classList.remove("show"); 
  }

  // ---------- VALIDATION ----------
  function validateStep(idx) {
    var stepEl = formSteps[idx];
    if (!stepEl) return true;
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

  // ---------- "OTHER" FIELD TOGGLES ----------
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

  // ---------- REVIEW SCREEN ----------
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
    if (!out) return;
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

  // ---------- FORM SUBMISSION ----------
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!validateStep(current)) { 
        showBanner(); 
        return; 
      }

      var submitBtn = document.getElementById("btnSubmit");
      var originalBtnText = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = lang === "sw" ? "Inatuma..." : "Submitting...";
      }

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
      payload.form_type = formId;

      try {
        if (typeof supabaseClient === 'undefined') {
          throw new Error("Supabase client not initialized. Check HTML file.");
        }

        var tableName = formId === "wadau-malighafi" ? "wadau_malighafi_responses" : "nanenane_responses";

        const { error } = await supabaseClient
          .from(tableName)
          .insert([{ form_data: payload }]);

        if (error) throw error;

        var stepNav = document.getElementById("stepNav");
        if (stepNav) stepNav.style.display = "none";
        formSteps.forEach(function (s) { s.classList.remove("active"); });
        var successStep = document.getElementById("successStep");
        if (successStep) successStep.classList.add("active");
        var progressWrap = document.querySelector(".progress-wrap");
        if (progressWrap) progressWrap.style.display = "none";
        window.scrollTo({ top: 0, behavior: "smooth" });

      } catch (err) {
        console.error("Submission error:", err);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
        alert(lang === "sw" 
          ? "Imeshindikana kutuma. Tafadhali hakikisha una mtandao kisha jaribu tena." 
          : "Submission failed. Please check your connection and try again.");
      }
    });
  }

  // ---------- RESET FUNCTION ----------
  window.resetForm = function () {
    var confirmMsg = lang === "sw" 
      ? "Una uhakika unataka kuanza upya? Majibu yako yote yatafutwa." 
      : "Are you sure you want to start over? All your answers will be cleared.";
      
    if (confirm(confirmMsg)) {
      if (form) form.reset();
      current = 0;
      
      var successStep = document.getElementById("successStep");
      if (successStep) successStep.classList.remove("active");
      
      var stepNav = document.getElementById("stepNav");
      if (stepNav) stepNav.style.display = "flex";
      
      var progressWrap = document.querySelector(".progress-wrap");
      if (progressWrap) progressWrap.style.display = "block";
      
      hideBanner();
      document.querySelectorAll(".has-error").forEach(function(el) {
        el.classList.remove("has-error");
      });
      
      document.querySelectorAll(".other-field").forEach(function(el) {
        el.hidden = true;
        el.value = "";
      });
      
      setupOtherToggles();
      showStep(0);
    }
  };

  // ---------- INITIALIZATION ----------
  buildDots();
  setupOtherToggles();
  showStep(0);
  if (typeof window.setLang === 'function') {
    window.setLang("sw");
  }
})();
