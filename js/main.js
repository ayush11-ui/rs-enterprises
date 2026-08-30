/* ================================================================
   RS Enterprises - main.js
   This file makes the page do its small tricks. It has only 4 jobs:

   1. Language switch  - swaps ALL text between English and Hindi
                         instantly, with no page reload.
   2. Smooth scrolling - uses the Lenis library for a smooth slide
                         when you tap a menu link.
   3. Mobile menu      - opens and closes the menu on a phone.
   4. Footer year      - keeps the copyright year correct automatically.

   How the language switch works (simple explanation):
   - Every piece of text on the page has BOTH versions written on it:
        data-en="English words"
        data-hi="हिंदी शब्द"
   - When you press the "EN | हिंदी" button, this file finds every
     element with those two attributes and simply swaps the words.
   - It remembers your choice in the browser (localStorage) so the
     same language is used next time the page is opened.
   - If the browser does not allow saving (private mode, security
     add-ons), the button still works for that visit - nothing breaks.
   ================================================================ */

(function () {
  "use strict";

  /* ------------------------------------------------------------
     SAFE SAVING HELPER
     Some setups (private windows, security add-ons) do not allow
     saving. We never want that to break the site, so every save is
     wrapped in the small safe helpers below.
     ------------------------------------------------------------ */

  var storage = {
    get: function (key) {
      try {
        return window.localStorage.getItem(key);
      } catch (err) {
        return null; // saving is blocked - pretend nothing was saved
      }
    },
    set: function (key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (err) {
        // saving is blocked - the site just keeps working without it
      }
    }
  };

  /* ------------------------------------------------------------
     PART 1 - LANGUAGE SWITCH
     ------------------------------------------------------------ */

  var STORAGE_KEY = "rs-lang"; // where the chosen language is remembered
  var currentLang = "en";      // English until told otherwise

  // The button that swaps the languages (found once, used many times).
  var langToggle = document.getElementById("langToggle");

  function switchLanguage(lang) {
    var isHindi = lang === "hi";
    currentLang = isHindi ? "hi" : "en";

    // Go through every element that carries both translations...
    var items = document.querySelectorAll("[data-en][data-hi]");
    for (var i = 0; i < items.length; i++) {
      // ...and put in the correct words.
      items[i].textContent = isHindi
        ? items[i].getAttribute("data-hi")
        : items[i].getAttribute("data-en");
    }

    // Tell the browser and search engines which language the page
    // is written in right now.
    document.documentElement.setAttribute("lang", currentLang);

    // Show which language is active on the switch button.
    if (langToggle) {
      langToggle.setAttribute("aria-pressed", isHindi ? "true" : "false");
      langToggle.setAttribute(
        "aria-label",
        isHindi
          ? "Current language: Hindi (press to switch to English)"
          : "Current language: English (press to switch to Hindi)"
      );
    }
  }

  // Decide which language to open in:
  //   1. a language saved on an earlier visit, OR
  //   2. a shared link such as  index.html#lang=hi , OR
  //   3. English, the safe default.
  var startLang = storage.get(STORAGE_KEY);
  if (startLang !== "en" && startLang !== "hi") {
    var hash = window.location.hash.toLowerCase();
    if (hash === "#lang=hi" || hash === "#lang=en") {
      startLang = hash === "#lang=hi" ? "hi" : "en";
    } else {
      startLang = "en";
    }
  }

  // Open the page in the chosen language, and remember the choice.
  switchLanguage(startLang);
  storage.set(STORAGE_KEY, startLang);

  // Pressing the "EN | हिंदी" button switches to the other language.
  if (langToggle) {
    langToggle.addEventListener("click", function () {
      switchLanguage(currentLang === "en" ? "hi" : "en");
      storage.set(STORAGE_KEY, currentLang);
    });
  }

  // Tiny test helpers so the language can also be checked from the
  // browser developer console while testing. Type in the console:
  //     switchSiteLanguage("hi")
  window.switchSiteLanguage = switchLanguage;
  window.currentSiteLanguage = function () {
    return currentLang;
  };

  /* ------------------------------------------------------------
     PART 2 - SMOOTH SCROLLING (Lenis)
     ------------------------------------------------------------ */

  // Lenis is loaded from the internet with a <script> tag in index.html.
  // If it loaded, use it; if not, the page still works with normal scrolling.
  if (window.Lenis) {
    // How much space to leave above the section for the sticky menu.
    var header = document.querySelector(".site-header");
    var offset = header ? header.offsetHeight : 74;

    // autoRaf  = Lenis updates itself automatically (no extra loop needed).
    // anchors  = tapping any #link (menu, Apply buttons) scrolls smoothly.
    new Lenis({
      autoRaf: true,
      anchors: { offset: offset },
      allowNestedScroll: true
    });
  }

  /* ------------------------------------------------------------
     PART 3 - MOBILE MENU (hamburger button)
     ------------------------------------------------------------ */

  var navToggle = document.getElementById("navToggle");
  var siteHeader = document.getElementById("siteHeader");

  if (navToggle && siteHeader) {
    // Tap the hamburger button to open or close the menu.
    navToggle.addEventListener("click", function () {
      var open = siteHeader.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // Close the menu by itself after choosing any link.
    document.querySelectorAll(".site-nav a").forEach(function (link) {
      link.addEventListener("click", function () {
        siteHeader.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ------------------------------------------------------------
     PART 4 - FOOTER YEAR
     ------------------------------------------------------------ */

  // Puts the current year in the copyright line automatically,
  // so it never goes out of date.
  var year = document.getElementById("year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }
})();