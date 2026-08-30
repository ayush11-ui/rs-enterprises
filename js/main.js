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
   ================================================================ */

(function () {
  "use strict";

  /* ------------------------------------------------------------
     PART 1 - LANGUAGE SWITCH
     ------------------------------------------------------------ */

  // Which language to start with. English is the default.
  var savedLang = localStorage.getItem("rs-lang") || "en";

  function switchLanguage(lang) {
    var isHindi = lang === "hi";

    // Go through every element that carries both translations...
    document.querySelectorAll("[data-en][data-hi]").forEach(function (el) {
      // ...and put in the correct words.
      el.textContent = isHindi ? el.getAttribute("data-hi") : el.getAttribute("data-en");
    });

    // Tell search engines which language the page is in now.
    document.documentElement.setAttribute("lang", isHindi ? "hi" : "en");

    // Save the choice so it is remembered next visit.
    localStorage.setItem("rs-lang", lang);
  }

  // Switch to the saved language when the page first opens.
  switchLanguage(savedLang);

  // Pressing the "EN | हिंदी" button toggles between the two languages.
  var langToggle = document.getElementById("langToggle");
  if (langToggle) {
    langToggle.addEventListener("click", function () {
      var current = localStorage.getItem("rs-lang") || "en";
      switchLanguage(current === "en" ? "hi" : "en");
    });
  }

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