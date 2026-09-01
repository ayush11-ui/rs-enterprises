// ==== RS Enterprises Application Form submission ====
// Paste your Google Apps Script Web App URL here (see setup steps in the README/setup doc)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxptpQ_2XVfT7InNUSKK_ZelPiA9CNAZS9_-HR-cR-FNBKnp0T0nNHHqCT6EME98DidDw/exec";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("rsApplyForm");
  const status = document.getElementById("rsFormStatus");
  if (!form || !status) return;

  // One file may not be bigger than 5 MB (Google Apps Script limit).
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  // Every message the form can show, in both languages.
  // "required"  - the friendly small note under a missing answer.
  // "filesize"  - shown when an uploaded file is too big.
  // The others are shown in the status line under the Submit button.
  const messages = {
    sending:  { en: "Sending your application, please wait...", hi: "आपका आवेदन भेजा जा रहा है, कृपया प्रतीक्षा करें..." },
    success:  { en: "Thank you! Your application has been received.", hi: "धन्यवाद! आपका आवेदन प्राप्त हो गया है।" },
    error:    { en: "Something went wrong. Please try again or contact us directly.", hi: "कुछ गलत हो गया। कृपया दोबारा कोशिश करें या हमसे सीधे संपर्क करें।" },
    required: { en: "Please fill this field.", hi: "कृपया यह फ़ील्ड भरें।" },
    filesize: { en: "This file is larger than 5MB. Please upload a smaller file.", hi: "यह फ़ाइल 5MB से बड़ी है। कृपया छोटी फ़ाइल अपलोड करें।" }
  };

  // Which language is on the page right now.
  function currentLang() {
    return document.documentElement.getAttribute("lang") === "hi" ? "hi" : "en";
  }

  // Remove every small "-please fill this" note (used before each check).
  function clearAllFieldErrors() {
    form.querySelectorAll(".rs-field-error").forEach(function (err) {
      err.remove();
    });
    form.querySelectorAll(".rs-field.rs-has-error").forEach(function (field) {
      field.classList.remove("rs-has-error");
    });
  }

  // Show one small note under a field that was forgotten.
  //   item.kind  - "required" or "filesize" (chooses the wording)
  //   item.control - the <input>/<select>/<textarea> with the problem
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

  // While someone is typing or picking an answer, remove that field's
  // "please fill this" note so they can see it going away.
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

  // Walk every required field and collect the ones that are still empty.
  function validateRequiredFields() {
    const invalid = [];
    const controls = form.querySelectorAll("input, select, textarea");
    controls.forEach(function (control) {
      if (!control.required) return;
      const ok = control.type === "checkbox"
        ? control.checked
        : control.value.trim() !== "";
      if (!ok) {
        invalid.push({ control: control, kind: "required" });
      }
    });
    return invalid;
  }

  // Look for any uploaded file that is bigger than 5 MB.
  function findBigFile() {
    const inputs = form.querySelectorAll('input[type="file"]');
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      for (let j = 0; j < input.files.length; j++) {
        if (input.files[j].size > MAX_FILE_SIZE) {
          return { control: input, kind: "filesize" };
        }
      }
    }
    return null;
  }

  let submitting = false;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (submitting) return; // never send twice

    clearAllFieldErrors();

    // 1. Friendly check: every required question must be answered.
    const invalid = validateRequiredFields();
    if (invalid.length > 0) {
      invalid.forEach(showFieldError);
      invalid[0].control.focus();
      return;
    }

    // 2. Friendly check: no uploaded file may be bigger than 5 MB.
    const bigFile = findBigFile();
    if (bigFile) {
      showFieldError(bigFile);
      status.setAttribute("data-state", "filesize");
      status.textContent = messages.filesize[currentLang()];
      return;
    }

    // 3. Lock the button and tell the person we are sending.
    const submitBtn = form.querySelector(".rs-submit-btn");
    submitting = true;
    if (submitBtn) submitBtn.disabled = true;
    status.setAttribute("data-state", "sending");
    status.textContent = messages.sending[currentLang()];

    try {
      const formData = new FormData(form);
      const payload = {};

      // Turn regular fields into plain key/value pairs
      for (const [key, value] of formData.entries()) {
        if (!(value instanceof File)) {
          payload[key] = value;
        }
      }

      // Turn each uploaded file into base64 text so it can be sent in one request
      const fileInputs = form.querySelectorAll('input[type="file"]');
      for (const input of fileInputs) {
        if (input.files.length > 0) {
          const file = input.files[0];
          const base64 = await fileToBase64(file);
          payload[input.name] = {
            fileName: file.name,
            mimeType: file.type,
            data: base64
          };
        }
      }

      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload)
        // Note: no custom headers on purpose - this avoids a browser CORS
        // pre-check that Google Apps Script does not support.
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

  // When the site-wide language button is pressed, translate the messages
  // that are already on the screen (the status line + any "please fill" notes).
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
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]); // strip the data:...;base64, prefix
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}