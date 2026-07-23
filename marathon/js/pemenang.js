/* =========================================================
   PEMENANG — winners lookup
   Generates deterministic demo winners, then powers
   search + distance/category filtering.
   ========================================================= */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- shared header behaviour ---------- */
  var header = $("#siteHeader");
  function updateHeader() { header.setAttribute("data-state", window.scrollY > 24 ? "scrolled" : "top"); }
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  var navToggle = $("#navToggle");
  function setNav(open) {
    document.body.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
  }
  navToggle.addEventListener("click", function () { setNav(!document.body.classList.contains("nav-open")); });
  $$(".nav__link").forEach(function (l) { l.addEventListener("click", function () { setNav(false); }); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) { setNav(false); navToggle.focus(); }
  });

  /* ---------- scroll reveal (interactive on scroll) ---------- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var reveals = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); obs.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
    reveals.forEach(function (el) { revObs.observe(el); });
  }

  /* ---------- data config ---------- */
  var CONFIG = [
    { dist: "10k", label: "10K", bibBase: 10000, cats: [
      { key: "nat-putra", label: "National · Putra", count: 100, gender: "m", base: 1880, step: 6.5 },
      { key: "nat-putri", label: "National · Putri", count: 100, gender: "f", base: 2040, step: 7 },
      { key: "mas-putra", label: "Master · Putra", count: 50, gender: "m", base: 2180, step: 8.5 },
      { key: "mas-putri", label: "Master · Putri", count: 50, gender: "f", base: 2360, step: 9 },
      { key: "bundling", label: "Bundling", count: 100, gender: "x", base: 2450, step: 7.5 }
    ]},
    { dist: "hm", label: "Half Marathon", bibBase: 30000, cats: [
      { key: "nat-putra", label: "National · Putra", count: 200, gender: "m", base: 4380, step: 9 },
      { key: "nat-putri", label: "National · Putri", count: 200, gender: "f", base: 4760, step: 10 },
      { key: "mas-putra", label: "Master · Putra", count: 150, gender: "m", base: 5080, step: 11 },
      { key: "mas-putri", label: "Master · Putri", count: 150, gender: "f", base: 5480, step: 12 }
    ]},
    { dist: "fm", label: "Full Marathon", bibBase: 50000, cats: [
      { key: "nat-putra", label: "National · Putra", count: 150, gender: "m", base: 9300, step: 14 },
      { key: "nat-putri", label: "National · Putri", count: 150, gender: "f", base: 10080, step: 16 },
      { key: "mas-putra", label: "Master · Putra", count: 150, gender: "m", base: 10680, step: 18 },
      { key: "mas-putri", label: "Master · Putri", count: 150, gender: "f", base: 11520, step: 20 }
    ]}
  ];

  var MALE = ["Budi","Agus","Rizky","Dimas","Fajar","Andi","Bayu","Eko","Hendra","Yoga","Rendi","Aditya","Bagus","Wahyu","Teguh","Galih","Rama","Iqbal","Doni","Ferry","Arif","Reza","Panji","Satria","Gilang","Yusuf","Hafiz","Dani","Krisna","Bima"];
  var FEMALE = ["Siti","Dewi","Rina","Putri","Ayu","Sari","Intan","Maya","Nurul","Fitri","Lestari","Wulan","Ratna","Indah","Anisa","Dinda","Kartika","Melati","Cahya","Tania","Sinta","Rani","Vania","Bunga","Salsa","Tiara","Aulia","Nadia","Gita","Kirana"];
  var LAST = ["Santoso","Wijaya","Nugroho","Pratama","Kusuma","Halim","Saputra","Hidayat","Ramadhan","Setiawan","Gunawan","Permana","Utomo","Firmansyah","Maulana","Purnomo","Sinaga","Sitorus","Lubis","Simanjuntak","Siregar","Wibowo","Prasetyo","Hartono","Suryanto","Anggara","Mahendra","Kurniawan","Handoko","Susanto"];
  var CITIES = ["Jakarta","Bandung","Surabaya","Yogyakarta","Semarang","Magelang","Solo","Malang","Medan","Makassar","Denpasar","Bogor","Tangerang","Bekasi","Salatiga","Cirebon","Purwokerto","Klaten","Sleman","Kudus"];
  var CLUBS = ["Indorunners","Pace Hunters","Borobudur RC","Merapi Runners","Senayan Pace","Lari Pagi Club","Runhood Squad","Prambanan Runners","Elevate Run","Tugu Muda Run"];

  /* deterministic PRNG so results are stable across reloads */
  function hash(str) { var h = 2166136261 >>> 0; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function makeRng(seed) { var a = seed >>> 0; return function () { a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
  function fmtTime(sec) {
    sec = Math.round(sec);
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    var ss = String(s).padStart(2, "0");
    if (h > 0) return h + ":" + String(m).padStart(2, "0") + ":" + ss;
    return m + ":" + ss;
  }

  /* build the flat winners list once */
  var DATA = [];
  CONFIG.forEach(function (d) {
    var bib = d.bibBase;
    d.cats.forEach(function (c) {
      var rng = makeRng(hash(d.dist + c.key));
      var t = c.base;
      for (var r = 1; r <= c.count; r++) {
        bib++;
        t += c.step * (0.5 + rng()); // strictly increasing → rank matches time
        var g = c.gender === "x" ? (rng() < 0.5 ? "m" : "f") : c.gender;
        var first = pick(rng, g === "f" ? FEMALE : MALE);
        var name = first + " " + pick(rng, LAST);
        var city = pick(rng, CITIES);
        var club = rng() < 0.55 ? pick(rng, CLUBS) : "";
        var isMaster = c.key.indexOf("mas") === 0;
        var birthYear = isMaster ? 1972 + Math.floor(rng() * 18) : 1990 + Math.floor(rng() * 16);
        var subDate = (22 + Math.floor(rng() * 5)) + " Agu";
        DATA.push({
          dist: d.dist, distLabel: d.label,
          catKey: c.key, catLabel: c.label,
          rank: r, name: name, city: city, club: club,
          gender: g === "f" ? "P" : "L", birthYear: birthYear, subDate: subDate,
          time: fmtTime(t), bib: bib
        });
      }
    });
  });

  /* ---------- DOM refs ---------- */
  var elRows = $("#rows");
  var elTitle = $("#resultTitle");
  var elCount = $("#resultCount");
  var elEmpty = $("#empty");
  var elHint = $("#searchHint");
  var elChips = $("#catChips");
  var elSearch = $("#search");
  var elClear = $("#searchClear");
  var tabs = $("#distTabs");
  var tableWrap = $(".table-wrap");

  var state = { dist: "10k", cat: "nat-putra", q: "" };
  var MAX_SEARCH = 400;

  function distConfig(dist) { return CONFIG.filter(function (d) { return d.dist === dist; })[0]; }
  function catConfig(dist, cat) { return distConfig(dist).cats.filter(function (c) { return c.key === cat; })[0]; }
  function esc(s) { return s.replace(/[&<>"]/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]; }); }
  function idNum(n) { return n.toLocaleString("id-ID"); }
  function highlight(text, q) {
    if (!q) return esc(text);
    var i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length));
  }

  /* ---------- render ---------- */
  function rowHtml(w, opts) {
    opts = opts || {};
    var q = opts.q || "";
    var rc = w.rank <= 3 ? " r" + w.rank : "";
    var loc = w.club ? w.city + " · " + w.club : w.city;
    var fastest = w.rank === 1 ? '<span class="tag-fastest">Tercepat</span>' : "";
    var catBadge = opts.showCat ? '<span class="pcat">' + w.distLabel + " · " + w.catLabel + "</span>" : "";
    var bibText = opts.q ? highlight(String(w.bib), q) : String(w.bib);
    return (
      '<tr class="' + (w.rank === 1 ? "is-top-1" : "") + '">' +
        '<td data-label="Peringkat" class="c-rank"><span class="ranknum' + rc + '">' + w.rank + "</span></td>" +
        '<td data-label="Peserta" class="c-name">' +
          '<span class="pname">' + highlight(w.name, q) + fastest + "</span>" +
          '<span class="ploc">' + esc(loc) + "</span>" +
          '<span class="pmeta">' + esc(w.subDate + " · " + w.birthYear + " · " + w.gender) + "</span>" +
          catBadge +
        "</td>" +
        '<td data-label="Catatan Waktu" class="c-time">' + w.time + "</td>" +
        '<td data-label="BIB" class="c-bib">#' + bibText + "</td>" +
      "</tr>"
    );
  }

  function paint(list, opts) {
    if (!list.length) {
      elRows.innerHTML = "";
      tableWrap.hidden = true;
      elEmpty.hidden = false;
      return;
    }
    tableWrap.hidden = false;
    elEmpty.hidden = true;
    var html = "";
    for (var i = 0; i < list.length; i++) html += rowHtml(list[i], opts);
    elRows.innerHTML = html;
  }

  function render() {
    var q = state.q.trim();

    if (q.length >= 2) {
      // SEARCH across everything
      var ql = q.toLowerCase();
      var matches = DATA.filter(function (w) {
        return w.name.toLowerCase().indexOf(ql) >= 0 || String(w.bib).indexOf(q) >= 0;
      });
      elHint.hidden = false;
      elTitle.textContent = "Hasil pencarian";
      var shown = matches.slice(0, MAX_SEARCH);
      elCount.textContent = matches.length > MAX_SEARCH
        ? "menampilkan " + MAX_SEARCH + " dari " + idNum(matches.length)
        : idNum(matches.length) + (matches.length === 1 ? " ditemukan" : " ditemukan");
      paint(shown, { showCat: true, q: q });
      return;
    }

    // FILTER by distance + category
    elHint.hidden = true;
    var dc = distConfig(state.dist);
    var cc = catConfig(state.dist, state.cat);
    var list = DATA.filter(function (w) { return w.dist === state.dist && w.catKey === state.cat; });
    elTitle.textContent = dc.label + " — " + cc.label;
    elCount.textContent = idNum(list.length) + " pemenang";
    paint(list, { showCat: false, q: "" });
  }

  /* ---------- chips (rebuilt per distance) ---------- */
  function buildChips() {
    var dc = distConfig(state.dist);
    elChips.innerHTML = dc.cats.map(function (c) {
      var active = c.key === state.cat ? " is-active" : "";
      var pressed = c.key === state.cat ? "true" : "false";
      return '<button class="chip' + active + '" type="button" data-cat="' + c.key + '" aria-pressed="' + pressed + '">' +
        c.label + "</button>";
    }).join("");
  }

  elChips.addEventListener("click", function (e) {
    var btn = e.target.closest(".chip");
    if (!btn) return;
    state.cat = btn.getAttribute("data-cat");
    $$(".chip", elChips).forEach(function (c) {
      var on = c === btn;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-pressed", String(on));
    });
    // clear any active search so the filter takes effect
    if (state.q) { state.q = ""; elSearch.value = ""; elClear.hidden = true; }
    render();
  });

  /* ---------- distance tabs ---------- */
  function selectDist(btn, focus) {
    state.dist = btn.getAttribute("data-dist");
    state.cat = distConfig(state.dist).cats[0].key; // reset to first category
    $$(".tab", tabs).forEach(function (b) {
      var on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
    });
    if (state.q) { state.q = ""; elSearch.value = ""; elClear.hidden = true; }
    buildChips();
    render();
    if (focus) btn.focus();
  }
  tabs.addEventListener("click", function (e) {
    var btn = e.target.closest(".tab");
    if (btn) selectDist(btn, false);
  });
  tabs.addEventListener("keydown", function (e) {
    var list = $$(".tab", tabs);
    var i = list.indexOf(document.activeElement);
    if (i < 0) return;
    var ni = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") ni = (i + 1) % list.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") ni = (i - 1 + list.length) % list.length;
    else if (e.key === "Home") ni = 0;
    else if (e.key === "End") ni = list.length - 1;
    if (ni !== null) { e.preventDefault(); selectDist(list[ni], true); }
  });

  /* ---------- search ---------- */
  var searchToggle = $("#searchToggle");
  function closeSearchOverlay(focusToggle) {
    document.body.classList.remove("search-open");
    if (searchToggle) searchToggle.setAttribute("aria-expanded", "false");
    elClear.hidden = !state.q;
    if (focusToggle && searchToggle) searchToggle.focus();
  }
  function debounce(fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; }
  elSearch.addEventListener("input", debounce(function () {
    state.q = elSearch.value;
    // while the mobile overlay is open, the clear button doubles as its close
    // control and must stay visible even with an empty query
    if (!document.body.classList.contains("search-open")) elClear.hidden = !state.q;
    render();
  }, 160));
  elClear.addEventListener("click", function () {
    state.q = "";
    elSearch.value = "";
    render();
    if (document.body.classList.contains("search-open")) {
      closeSearchOverlay(true);
    } else {
      elClear.hidden = true;
      elSearch.focus();
    }
  });

  /* ---------- mobile search toggle (header) ---------- */
  var scrollYAtOpen = 0;
  if (searchToggle) {
    searchToggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("search-open");
      searchToggle.setAttribute("aria-expanded", String(open));
      if (open) {
        elClear.hidden = false;
        scrollYAtOpen = window.scrollY;
        setTimeout(function () { elSearch.focus(); }, 60);
      } else {
        elClear.hidden = !state.q;
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("search-open")) {
        closeSearchOverlay(true);
      }
    });
    // forgetting to close it is fine — scrolling the page dismisses it too
    window.addEventListener("scroll", function () {
      if (!document.body.classList.contains("search-open")) return;
      if (Math.abs(window.scrollY - scrollYAtOpen) > 4) closeSearchOverlay(false);
    }, { passive: true });
  }

  /* ---------- init ---------- */
  buildChips();
  render();
})();
