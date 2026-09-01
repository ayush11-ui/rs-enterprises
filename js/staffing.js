// ==== RS Enterprises Staffing Request (companies / organisations) ====
// Like js/form.js, this posts to the same Google Apps Script Web App, but it
// sends requestType: "staffing_request" so the data lands in its own
// "Staffing Requests" sheet instead of the job applications sheet.
// Everything below is wrapped so this file adds no global names that could
// clash with the job application script above.
(function () {
  "use strict";

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxptpQ_2XVfT7InNUSKK_ZelPiA9CNAZS9_-HR-cR-FNBKnp0T0nNHHqCT6EME98DidDw/exec";

  const modal = document.getElementById("staffingModal");
  const form = document.getElementById("rsStaffingForm");
  const status = document.getElementById("rsStaffingStatus");
  if (!modal || !form || !status) return;

  const messages = {
    sending:  { en: "Sending your request, please wait...", hi: "आपका अनुरोध भेजा जा रहा है, कृपया प्रतीक्षा करें..." },
    success:  { en: "Thank you! Your staffing request has been received. We will call you back soon.", hi: "धन्यवाद! आपका स्टाफिंग अनुरोध प्राप्त हो गया है। हम आपको जल्द ही वापस कॉल करेंगे।" },
    error:    { en: "Something went wrong. Please try again or contact us directly.", hi: "कुछ गलत हो गया। कृपया दोबारा कोशिश करें या हमसे सीधे संपर्क करें।" },
    required: { en: "Please fill this field.", hi: "कृपया यह फ़ील्ड भरें।" },
    service:  { en: "Please choose at least one service.", hi: "कृपया कम से कम एक सेवा चुनें।" },
    phone:    { en: "Please enter a valid 10-digit phone number.", hi: "कृपया सही 10 अंकों का फ़ोन नंबर दर्ज करें।" },
    email:    { en: "Please enter a valid email address.", hi: "कृपया सही ईमेल पता दर्ज करें।" },
    number:   { en: "Please enter a valid number of staff.", hi: "कृपया स्टाफ की सही संख्या दर्ज करें।" }
  };

  function currentLang() {
    return document.documentElement.getAttribute("lang") === "hi" ? "hi" : "en";
  }

  const servicesEl = document.getElementById("rsStaffingServices");

  function val(name) {
    const control = form.elements[name];
    return control ? control.value.trim() : "";
  }

  function clearAllFieldErrors() {
    form.querySelectorAll(".rs-field-error").forEach(function (err) {
      err.remove();
    });
    form.querySelectorAll(".rs-field.rs-has-error").forEach(function (field) {
      field.classList.remove("rs-has-error");
    });
  }

  function showFieldError(item) {
    const field = item.control.closest(".rs-field");
    if (!field) return;
    let error = field.querySelector(".rs-field-error");
    if (!error) {
      error = document.createElement("span");
      error.className = "rs-field-error";
      field.appendChild(error);
    }
    error.setAttribute("data-kind", item.kind);
    error.textContent = messages[item.kind][currentLang()];
    field.classList.add("rs-has-error");
  }

  form.addEventListener("input", clearErrorOnChange);
  form.addEventListener("change", clearErrorOnChange);
  function clearErrorOnChange(e) {
    const field = e.target.closest ? e.target.closest(".rs-field") : null;
    if (field) {
      field.classList.remove("rs-has-error");
      const error = field.querySelector(".rs-field-error");
      if (error) error.remove();
    }
  }

  // A phone box accepts 10 digits, with an optional +91 / 0 prefix.
  function validPhone(value) {
    let digits = value.replace(/[^\d+]/g, "");
    if (digits.indexOf("+91") === 0) {
      digits = digits.slice(3);
    } else if (digits.length === 12 && digits.indexOf("91") === 0) {
      digits = digits.slice(2);
    } else if (digits.length === 11 && digits.charAt(0) === "0") {
      digits = digits.slice(1);
    }
    return /^[0-9]{10}$/.test(digits);
  }

  function validateAll() {
    const problems = [];

    // 1. Every field marked required must have an answer.
    form.querySelectorAll("input, select, textarea").forEach(function (control) {
      if (!control.required) return;
      const ok = control.type === "checkbox"
        ? control.checked
        : control.value.trim() !== "";
      if (!ok) {
        problems.push({ control: control, kind: "required" });
      }
    });

    // 2. At least one service must be ticked.
    if (servicesEl && servicesEl.querySelectorAll('input[name="serviceRequired"]:checked').length === 0) {
      problems.push({ control: servicesEl.querySelector('input[name="serviceRequired"]'), kind: "service" });
    }

    // 3. Format checks (done after the required checks above).
    const phone = val("phone");
    if (phone && !validPhone(phone)) {
      problems.push({ control: form.elements.phone, kind: "phone" });
    }

    const email = val("email");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      problems.push({ control: form.elements.email, kind: "email" });
    }

    const staff = val("numberOfStaff");
    if (staff !== "") {
      const n = Number(staff);
      if (!Number.isInteger(n) || n < 1 || n > 999) {
        problems.push({ control: form.elements.numberOfStaff, kind: "number" });
      }
    }

    return problems;
  }

  let submitting = false;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (submitting) return; // never send twice

    clearAllFieldErrors();

    const problems = validateAll();
    if (problems.length > 0) {
      problems.forEach(showFieldError);
      problems[0].control.focus();
      return;
    }

    const submitBtn = form.querySelector(".rs-submit-btn");
    submitting = true;
    if (submitBtn) submitBtn.disabled = true;
    status.setAttribute("data-state", "sending");
    status.textContent = messages.sending[currentLang()];

    const payload = {
      requestType: "staffing_request",
      companyName: val("companyName"),
      contactPerson: val("contactPerson"),
      phone: val("phone"),
      email: val("email"),
      businessType: val("businessType"),
      serviceRequired: servicesEl
        ? Array.prototype.map.call(
            servicesEl.querySelectorAll('input[name="serviceRequired"]:checked'),
            function (c) { return c.value; }
          ).join(", ")
        : "",
      numberOfStaff: val("numberOfStaff"),
      shiftType: val("shiftType"),
      workingHours: val("workingHours"),
      location: val("location"),
      address: val("address"),
      startDate: val("startDate"),
      duration: val("duration"),
      additionalRequirements: val("additionalRequirements")
    };

    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload)
        // No custom headers on purpose - this avoids a browser CORS pre-check
        // that Google Apps Script does not support.
      });
      if (!response.ok) {
        throw new Error("The form server answered with status " + response.status);
      }

      status.setAttribute("data-state", "success");
      status.textContent = messages.success[currentLang()];
      form.reset();
      clearAllFieldErrors();

    } catch (err) {
      console.error(err);
      status.setAttribute("data-state", "error");
      status.textContent = messages.error[currentLang()];
    } finally {
      submitting = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // When the site-wide language button is pressed, translate what is already
  // on the screen (the status line + any small "please fill" notes).
  document.addEventListener("rs-langchange", function () {
    const state = status.getAttribute("data-state");
    if (state && messages[state]) {
      status.textContent = messages[state][currentLang()];
    }
    form.querySelectorAll(".rs-field-error").forEach(function (err) {
      const kind = err.getAttribute("data-kind");
      if (kind && messages[kind]) {
        err.textContent = messages[kind][currentLang()];
      }
    });
  });

  // ----- Modal open / close -----
  let lastFocused = null;

  function clearFormState() {
    status.setAttribute("data-state", "");
    status.textContent = "";
    clearAllFieldErrors();
  }

  function openModal() {
    if (modal.classList.contains("open")) return;
    lastFocused = document.activeElement;
    clearFormState();
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    const first = modal.querySelector("input, select, textarea");
    if (first) first.focus();
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  document.querySelectorAll("[data-open-staffing]").forEach(function (button) {
    button.addEventListener("click", openModal);
  });

  modal.querySelectorAll("[data-close-staffing]").forEach(function (el) {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", function (e) {
    if (!modal.classList.contains("open")) return;
    if (e.key === "Escape") {
      closeModal();
      return;
    }
    // Keep Tab moving inside the dialog while it is open.
    if (e.key === "Tab") {
      const focusables = modal.querySelectorAll(
        "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])"
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
})();