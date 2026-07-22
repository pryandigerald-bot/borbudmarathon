/* =========================================================
   URBANA QUALIFIER — interaksi landing page
   Vanilla JS, tanpa dependency.
   ========================================================= */
(function () {
  "use strict";

  /* -------- CONFIG (mudah diedit) -------- */
  // Tanggal pembukaan Pre-Order Koran Urbana (bulan 0-indeks: 7 = Agustus)
  var PREORDER_OPEN = new Date(2026, 7, 10, 0, 0, 0);

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* =======================================================
     1. HEADER — solid saat scroll
     ======================================================= */
  var header = $("#siteHeader");
  function updateHeader() {
    header.setAttribute("data-state", window.scrollY > 24 ? "scrolled" : "top");
  }
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  /* =======================================================
     2. MOBILE NAV
     ======================================================= */
  var navToggle = $("#navToggle");
  var nav = $("#primaryNav");

  function setNav(open) {
    document.body.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
  }
  navToggle.addEventListener("click", function () {
    setNav(!document.body.classList.contains("nav-open"));
  });
  // tutup saat klik link nav
  $$(".nav__link", nav).forEach(function (link) {
    link.addEventListener("click", function () { setNav(false); });
  });
  // Escape untuk menutup
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
      setNav(false);
      navToggle.focus();
    }
  });

  /* =======================================================
     3. SCROLL-SPY — tandai menu aktif
     ======================================================= */
  var sections = $$("main section[id]");
  var navLinks = {};
  $$(".nav__link").forEach(function (l) {
    var id = l.getAttribute("href").slice(1);
    navLinks[id] = l;
  });

  function setActive(id) {
    Object.keys(navLinks).forEach(function (key) {
      var isOn = key === id;
      navLinks[key].toggleAttribute("aria-current", isOn);
      if (isOn) navLinks[key].setAttribute("aria-current", "true");
      else navLinks[key].removeAttribute("aria-current");
    });
  }

  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && navLinks[entry.target.id]) {
          setActive(entry.target.id);
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* =======================================================
     4. REVEAL ON SCROLL
     ======================================================= */
  var reveals = $$(".reveal, .tl");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });

    // stagger elemen bersaudara dalam kontainer yang sama
    reveals.forEach(function (el) {
      revObs.observe(el);
    });
    // beri jeda kecil antar kartu yang berdekatan
    $$(".benefits, .cats, .steps, .flow, .stat-row, .timeline, .faq, .win-meta").forEach(function (group) {
      $$(".reveal", group).forEach(function (el, i) {
        el.style.transitionDelay = Math.min(i * 70, 350) + "ms";
      });
    });
  }

  /* =======================================================
     PARALLAX — subtle scroll-linked depth on photo sections
     ======================================================= */
  if (!reduceMotion) {
    var parallaxEls = [
      { el: $(".section--cats"), varName: "--cats-par", strength: 0.08 },
      { el: $(".cta"), varName: "--cta-par", strength: 0.08 }
    ].filter(function (p) { return p.el; });

    if (parallaxEls.length) {
      var parallaxTicking = false;
      var updateParallax = function () {
        var vh = window.innerHeight;
        parallaxEls.forEach(function (p) {
          var r = p.el.getBoundingClientRect();
          if (r.bottom < -80 || r.top > vh + 80) return; // skip offscreen
          var offset = (r.top + r.height / 2 - vh / 2) * -p.strength;
          p.el.style.setProperty(p.varName, offset.toFixed(1) + "px");
        });
      };
      window.addEventListener("scroll", function () {
        if (!parallaxTicking) {
          requestAnimationFrame(function () { updateParallax(); parallaxTicking = false; });
          parallaxTicking = true;
        }
      }, { passive: true });
      window.addEventListener("resize", updateParallax, { passive: true });
      updateParallax();
    }
  }

  /* =======================================================
     5. COUNTDOWN
     ======================================================= */
  var cd = {
    days: $('[data-cd="days"]'),
    hours: $('[data-cd="hours"]'),
    mins: $('[data-cd="mins"]'),
    secs: $('[data-cd="secs"]'),
    done: $('[data-cd="done"]'),
    grid: $(".countdown__grid"),
    label: $(".countdown__label")
  };
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function tickCountdown() {
    var diff = PREORDER_OPEN.getTime() - Date.now();
    if (diff <= 0) {
      if (cd.grid) cd.grid.hidden = true;
      if (cd.label) cd.label.hidden = true;
      if (cd.done) cd.done.hidden = false;
      return false;
    }
    var s = Math.floor(diff / 1000);
    var d = Math.floor(s / 86400);
    var h = Math.floor((s % 86400) / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    if (cd.days) cd.days.textContent = pad(d);
    if (cd.hours) cd.hours.textContent = pad(h);
    if (cd.mins) cd.mins.textContent = pad(m);
    if (cd.secs) cd.secs.textContent = pad(sec);
    return true;
  }
  if (cd.days) {
    if (tickCountdown()) {
      var cdTimer = setInterval(function () {
        if (!tickCountdown()) clearInterval(cdTimer);
      }, 1000);
    }
  }

  /* =======================================================
     6. COUNT-UP ANGKA
     ======================================================= */
  function formatNum(n) { return n.toLocaleString("id-ID"); }

  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = formatNum(target) + suffix; return; }
    var dur = 1400;
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = formatNum(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = formatNum(target) + suffix;
    }
    requestAnimationFrame(frame);
  }

  var counters = $$("[data-count]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    counters.forEach(animateCount);
  } else {
    var countObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { countObs.observe(c); });
  }

  /* =======================================================
     7. PANEL TOGGLE (kategori + FAQ)
     ======================================================= */
  function openPanel(panel) {
    panel.hidden = false;
    if (reduceMotion) { panel.style.maxHeight = "none"; return; }
    panel.style.maxHeight = "0px";
    void panel.offsetHeight; // commit collapsed state agar transisi mulai dari 0
    panel.style.maxHeight = panel.scrollHeight + "px";
    var onEnd = function (e) {
      if (e.propertyName !== "max-height") return;
      panel.style.maxHeight = "none";
      panel.removeEventListener("transitionend", onEnd);
    };
    panel.addEventListener("transitionend", onEnd);
  }
  function closePanel(panel) {
    if (reduceMotion) { panel.style.maxHeight = "0px"; panel.hidden = true; return; }
    panel.style.maxHeight = panel.scrollHeight + "px";
    // force reflow lalu animasikan ke 0
    void panel.offsetHeight;
    requestAnimationFrame(function () { panel.style.maxHeight = "0px"; });
    var onEnd = function (e) {
      if (e.propertyName !== "max-height") return;
      panel.hidden = true;
      panel.removeEventListener("transitionend", onEnd);
    };
    panel.addEventListener("transitionend", onEnd);
  }

  function wireAccordion(triggerSel, opts) {
    opts = opts || {};
    $$(triggerSel).forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) return;
      var wrap = btn.closest(opts.itemSel);
      btn.addEventListener("click", function () {
        var isOpen = btn.getAttribute("aria-expanded") === "true";
        if (opts.exclusive && !isOpen) {
          // tutup yang lain dalam grup
          $$(triggerSel).forEach(function (other) {
            if (other !== btn && other.getAttribute("aria-expanded") === "true") {
              other.setAttribute("aria-expanded", "false");
              var op = document.getElementById(other.getAttribute("aria-controls"));
              var ow = other.closest(opts.itemSel);
              if (ow) ow.setAttribute("data-open", "false");
              if (op) closePanel(op);
            }
          });
        }
        btn.setAttribute("aria-expanded", String(!isOpen));
        if (wrap) wrap.setAttribute("data-open", String(!isOpen));
        if (isOpen) closePanel(panel);
        else openPanel(panel);
      });
    });
  }

  wireAccordion(".cat__head", { itemSel: ".cat", exclusive: false });
  wireAccordion(".faq__q", { itemSel: ".faq__item", exclusive: true });

  // buka kartu kategori pertama sebagai default agar terlihat interaktif
  var firstCat = $(".cat__head");
  if (firstCat) firstCat.click();

  /* recalc tinggi panel yang terbuka saat resize */
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      $$(".cat__panel, .faq__a").forEach(function (p) {
        if (!p.hidden && p.style.maxHeight !== "0px") p.style.maxHeight = "none";
      });
    }, 150);
  });
})();
