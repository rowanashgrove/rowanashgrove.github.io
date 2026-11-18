/* Rowan Ashgrove site v2: lantern hero, atlas, spellbook, bestiary, people, books. No libraries. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;

  /* ---------------- top bar + menu ---------------- */
  const bar = $("#bar"), nav = $("#nav"), menu = $("#menuBtn");
  const onScroll = () => bar.classList.toggle("solid", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  menu.addEventListener("click", () => { const o = nav.classList.toggle("open"); menu.setAttribute("aria-expanded", o); });
  nav.addEventListener("click", e => { if (e.target.tagName === "A") { nav.classList.remove("open"); menu.setAttribute("aria-expanded", false); } });
  const secs = [...nav.querySelectorAll("a")].map(a => [a, $(a.getAttribute("href"))]);
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) secs.forEach(([a, s]) => a.setAttribute("aria-current", s === e.target));
  }), { rootMargin: "-45% 0px -50% 0px" });
  secs.forEach(([, s]) => s && spy.observe(s));

  /* ---------------- reveal on scroll ---------------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
  const watch = () => document.querySelectorAll(".rise:not(.in)").forEach(el => io.observe(el));

  /* ---------------- hero: the lantern you carry, and embers ---------------- */
  const hero = $(".hero"), root = document.documentElement;
  let tx = innerWidth * .62, ty = innerHeight * .42, lx = tx, ly = ty;
  if (fine && !reduce) {
    hero.addEventListener("pointermove", e => { tx = e.clientX; ty = e.clientY; });
  } else { $("#lanternHint").hidden = true; }
  const vid = $("#heroVideo");
  if (!reduce && innerWidth > 700 && !navigator.connection?.saveData) {
    vid.preload = "auto"; vid.play().then(() => { $(".hero .poster").style.opacity = 0; }).catch(() => {});
  }
  const cv = $("#embers"), cx = cv.getContext("2d");
  let W = 0, H = 0, DPR = Math.min(devicePixelRatio || 1, 2), parts = [], heroOn = true;
  const size = () => { W = hero.clientWidth; H = hero.clientHeight; cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + "px"; cv.style.height = H + "px"; };
  const spawn = (y) => ({ x: Math.random() * W, y: y ?? H + 10, r: .6 + Math.random() * 1.8, vy: .25 + Math.random() * .7, vx: (Math.random() - .5) * .3, a: .3 + Math.random() * .6, t: Math.random() * 6.28, hue: Math.random() < .12 ? 260 : 32 });
  const init = () => { size(); parts = Array.from({ length: Math.round(Math.min(110, W / 12)) }, () => spawn(Math.random() * H)); };
  new IntersectionObserver(es => heroOn = es[0].isIntersecting).observe(hero);
  const tick = () => {
    if (heroOn) {
      lx += (tx - lx) * .08; ly += (ty - ly) * .08;
      root.style.setProperty("--mx", lx + "px"); root.style.setProperty("--my", ly + "px");
      if (!reduce) {
        cx.setTransform(DPR, 0, 0, DPR, 0, 0); cx.clearRect(0, 0, W, H);
        for (const p of parts) {
          p.t += .02; p.y -= p.vy; p.x += p.vx + Math.sin(p.t) * .25;
          const d = Math.hypot(p.x - lx, p.y - ly), near = Math.max(0, 1 - d / 260);
          if (near > 0) { p.x += (p.x - lx) / (d + 1) * near * .8; }
          if (p.y < -10) Object.assign(p, spawn());
          const al = p.a * (.55 + near * .9) * Math.min(1, p.y / (H * .25));
          cx.beginPath(); cx.fillStyle = `hsla(${p.hue},90%,${65 + near * 20}%,${al})`;
          cx.shadowBlur = 8 + near * 10; cx.shadowColor = `hsla(${p.hue},95%,60%,${al})`;
          cx.arc(p.x, p.y, p.r * (1 + near * .6), 0, 6.283); cx.fill();
        }
      }
    }
    requestAnimationFrame(tick);
  };
  addEventListener("resize", () => { DPR = Math.min(devicePixelRatio || 1, 2); size(); });
  init(); tick();

  /* ---------------- sound of the Reach (off until asked) ---------------- */
  const amb = $("#amb"), snd = $("#sound");
  snd.addEventListener("click", () => {
    const on = snd.getAttribute("aria-pressed") !== "true";
    snd.setAttribute("aria-pressed", on); $("#waves").setAttribute("opacity", on ? "1" : ".3");
    snd.setAttribute("aria-label", on ? "Silence the Reach" : "Play the sound of the Reach");
    if (on) { amb.volume = 0; amb.play().catch(() => {}); let v = 0; const f = setInterval(() => { v = Math.min(.5, v + .05); amb.volume = v; if (v >= .5) clearInterval(f); }, 80); }
    else amb.pause();
  });

  /* ---------------- lightbox for the pictures ---------------- */
  const lb = $("#lb"), lbImg = $("#lbImg"), lbCap = $("#lbCap");
  let lastFocus = null;
  document.querySelectorAll(".tile").forEach(t => t.addEventListener("click", () => {
    lastFocus = t; lbImg.src = t.dataset.full; lbImg.alt = t.querySelector("img").alt;
    lbCap.textContent = t.querySelector(".cap b").textContent + " · " + t.querySelector(".cap span").textContent;
    lb.classList.add("open"); $("#lbClose").focus();
  }));
  const closeLb = () => { lb.classList.remove("open"); lastFocus && lastFocus.focus(); };
  $("#lbClose").addEventListener("click", closeLb);
  lb.addEventListener("click", e => { if (e.target === lb) closeLb(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && lb.classList.contains("open")) closeLb(); });

  /* ---------------- the atlas ---------------- */
  // world metres -> map: u = x / 480 + .5, v = z / 480 + .5 (the game's own world_to_uv)
  const PLACES = [
    { id: "house", x: 0, z: -40, name: "Hollowmere House", kind: "The house on the hill", img: "media/r13-manor.webp",
      text: "Rowan Ashgrove's house, where the notice said a cataloguer was wanted. The study hearth is the first place of power you stand in, the Ledger is kept by the fire, and a shelf in the east wing fills with what you earn.",
      meta: ["Rowan Ashgrove", "The study", "Thread-walk point"] },
    { id: "hatch", x: -24, z: -26, name: "The undercroft", kind: "New in 1.2", img: "media/v13-undercroft.webp", hour: true,
      text: "A chained hatch in the grass beside the house. Below it, torch-lit rooms, a cellar ledger in Rowan's hand, and a working that was begun and never given a Term. It opens once the Hollow Hour has had its say.",
      meta: ["Opens in Act II", "The Hollowed", "Undercroft Seal"] },
    { id: "hamlet", x: -30, z: 30, name: "Hollowmere", kind: "The hamlet", img: "media/v13-companion.webp",
      text: "A ring of cottages round a green, a well and a cart. Agnes Tolley sells herbs and buys fish, Abel Marsh keeps the chandlery, Ines Varga sells charms, and Mr Crane deals in curios behind a white mask.",
      meta: ["Shops", "Bonds and gifts", "Companions"] },
    { id: "pasture", x: -38, z: -12, name: "The pasture", kind: "Farm and fold", img: "media/v13-pasture.webp",
      text: "Sheep, cows, horses and pigs behind a split-rail fence, with a bench where the light comes low across the grass in the evening.",
      meta: ["Animals", "A bench"] },
    { id: "ashford", x: -105, z: -95, name: "Ashford", kind: "The second village", img: "media/v13-ashford.webp",
      text: "Up the cart track from the house. Odo the miller, Wren, Sister Ysolde and Bram the smith, and a well with a bench beside it. Ashford has its own thread to learn and its own troubles.",
      meta: ["Odo · Wren · Ysolde · Bram", "Thread-walk point"] },
    { id: "mere", x: 80, z: -16, name: "Stillwater Mere", kind: "Water and quiet", img: "media/v13-fishing.webp",
      text: "Reeds, lilies and a jetty with a boat tied up. Cast from the side of the jetty and watch the red float: roach and perch by day, eels after dark, and a silverside that rises only under a full moon.",
      meta: ["Fishing", "Six kinds of fish", "Bench on the west bank"] },
    { id: "wood", x: 112, z: 98, name: "The Whisperwood", kind: "The old forest", img: "media/v13-whisperwood.webp", hour: true,
      text: "Light shafts, mist and old trees that remember. The Whisperwood repeats whatever you tell it, and at its heart stands the Listening Tree, where the Echo keeps a woodcutter's last day on a loop.",
      meta: ["The Listening Tree", "The Echo", "Wisps"] },
  ];
  const chart = $("#chart"), ZOOM = 1.5; // the map is shown zoomed in on the lived-in middle of the Reach
  const chips = document.createElement("div"); chips.className = "places"; chips.setAttribute("aria-label", "Places");
  const holder = document.createElement("div"); chart.before(holder); holder.append(chart, chips);
  const showPlace = (p, btn) => {
    chart.querySelectorAll(".pin").forEach(b => b.setAttribute("aria-pressed", b.dataset.id === p.id));
    chips.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.id === p.id));
    const img = $("#loreImg"); img.src = p.img; img.alt = p.name;
    $("#loreKind").textContent = p.kind; $("#loreName").textContent = p.name; $("#loreText").textContent = p.text;
    $("#loreMeta").innerHTML = p.meta.map(m => `<li>${m}</li>`).join("");
  };
  PLACES.forEach((p, i) => {
    const b = document.createElement("button");
    b.className = "pin" + (p.hour ? " hour" : ""); b.type = "button";
    b.style.left = (p.x / 480 * ZOOM + .5) * 100 + "%"; b.style.top = (p.z / 480 * ZOOM + .5) * 100 + "%"; b.dataset.id = p.id;
    b.innerHTML = `<i></i><b>${p.name}</b>`; b.setAttribute("aria-label", p.name);
    b.addEventListener("click", () => showPlace(p, b));
    chart.appendChild(b);
    const c = document.createElement("button"); c.type = "button"; c.textContent = p.name; c.dataset.id = p.id;
    c.addEventListener("click", () => showPlace(p, b)); chips.appendChild(c);
    if (i === 0) showPlace(p, b);
  });

  /* ---------------- spellbook ---------------- */
  const SPELLS = [
    { g: "ᚲ", n: "Kenaz bolt", img: "media/v13-spell_bolts.webp", what: "The first working: a bolt of light from the hand. Quick, cheap on Attention, and the thread every other spell is pulled through.", fear: "The Hollowed take it deep" },
    { g: "ᛊ", n: "Ember Hand", img: "media/v13-spell_ember.webp", what: "A cone of fire that lights what it touches and keeps it burning. The Frayed fear it; Cinders barely notice.", fear: "Frayed · Kiln · Flare" },
    { g: "ᚦ", n: "Thurisaz", img: "media/v13-spell_thurisaz.webp", what: "The thorn: a hammer of force round you that throws shades back. Wisps scatter from it.", fear: "Wisps · Shatter" },
    { g: "ᛉ", n: "Salt Circle", img: "media/v13-spell_salt.webp", what: "A ring of salt on the ground that harms what stands in it and slows it. Cinders are undone by salt.", fear: "Cinders · Kiln" },
    { g: "ᚾ", n: "Knot", img: "media/v13-spell_knot.webp", what: "Need-rune binding: a red thread that holds a shade where it stands while you work. The Knotted fear their own kind of knot.", fear: "Knotted · Shatter" },
  ];
  $("#spellCards").innerHTML = SPELLS.map(s => `
    <button class="spell" type="button" aria-pressed="false" aria-label="${s.n}: turn the card">
      <span class="face front"><img src="${s.img}" alt="" loading="lazy"><span class="glyph rune" aria-hidden="true">${s.g}</span><span class="t"><h3>${s.n}</h3><span class="dim" style="font-size:15px">Tap to turn</span></span></span>
      <span class="face back"><span class="k">The working</span><p>${s.what}</p><span class="k" style="margin-top:auto">Answers</span><p style="color:#ffb27c">${s.fear}</p></span>
    </button>`).join("");
  document.querySelectorAll(".spell").forEach(c => c.addEventListener("click", () => c.setAttribute("aria-pressed", c.getAttribute("aria-pressed") !== "true")));

  /* ---------------- bestiary ---------------- */
  const BEASTS = [
    { n: "The Frayed", s: "Common", img: "media/v13-spell_bolts.webp", lore: "Shades that come up where a thread has worn through. They hunt in twos and threes, flank, and lunge. Close the tear behind them or more will come.", fear: "Ember Hand", resist: "Nothing in particular", where: "Every tear in the Reach" },
    { n: "Wisps", s: "Common", img: "media/v13-wisps.webp", lore: "Small, pale and quick, keeping their distance and throwing cold light. Drawing Breath can swallow what they throw.", fear: "Thurisaz", resist: "Fire passes half through", where: "The Whisperwood" },
    { n: "The Knotted", s: "Elder", img: "media/v13-knotted.webp", lore: "A big shade bound up in red thread. It winds up, then charges. Step aside, and burn it while it recovers.", fear: "Knot", resist: "Bolts glance off", where: "Deeper tears" },
    { n: "Cinders", s: "New in 1.2", img: "media/v13-new_shades.webp", lore: "A Frayed that came up through a hearth and kept the heat. Quick, and fire does almost nothing to it.", fear: "Salt Circle", resist: "Ember Hand", where: "From Act II" },
    { n: "The Hollowed", s: "New in 1.2", img: "media/v13-undercroft.webp", lore: "A Knotted that waited so long the thread wore through and left only the shape. When it falls it breaks into two lesser Frayed.", fear: "Kenaz bolts", resist: "Knot barely holds it", where: "From Act II · the undercroft" },
  ];
  const tabs = $("#beastTabs"), panel = $("#beastPanel");
  const showBeast = i => {
    const b = BEASTS[i];
    tabs.querySelectorAll(".tab").forEach((t, k) => { t.setAttribute("aria-selected", k === i); t.tabIndex = k === i ? 0 : -1; });
    panel.innerHTML = `<img src="${b.img}" alt="${b.n}" loading="lazy"><div class="body"><div class="label">${b.s}</div><h3 style="font-size:34px">${b.n}</h3><p>${b.lore}</p>
      <div class="stats"><div class="stat fear"><div class="k">Fears</div><div class="v">${b.fear}</div></div><div class="stat resist"><div class="k">Shrugs off</div><div class="v">${b.resist}</div></div>
      <div class="stat" style="grid-column:span 2"><div class="k">Found</div><div class="v">${b.where}</div></div></div></div>`;
  };
  BEASTS.forEach((b, i) => {
    const t = document.createElement("button");
    t.className = "tab"; t.type = "button"; t.setAttribute("role", "tab"); t.innerHTML = `${b.n}<small>${b.s}</small>`;
    t.addEventListener("click", () => showBeast(i));
    t.addEventListener("keydown", e => { const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); const k = (i + d + BEASTS.length) % BEASTS.length; showBeast(k); tabs.children[k].focus(); } });
    tabs.appendChild(t);
  });
  showBeast(0);

  /* ---------------- people ---------------- */
  const PEOPLE = [
    { g: "ᚨ", n: "Rowan Ashgrove", r: "The house", p: "Wrote the books, and wants a cataloguer who will not ask why. Teaches you the first workings by the study fire." },
    { g: "ᛏ", n: "Tom Wick", r: "Hollowmere", p: "Can see the threads a bit. Only a bit. Help him with his tale and he'll walk with you, and your Attention comes back quicker for it.", tag: "Companion" },
    { g: "ᛚ", n: "Ada Lyle", r: "Hollowmere", p: "Walked these roads before the tears came and doesn't trust the quiet. Become her friend and she throws what light she has at shades.", tag: "Companion" },
    { g: "ᚺ", n: "Edwin Hale", r: "The wood", p: "The man who walks out of the Whisperwood when the path stops repeating. Find him in Hollowmere by day." },
    { g: "ᛃ", n: "Agnes Tolley", r: "Herbalist", p: "Herbs and simples, and she buys whatever you pull out of Stillwater Mere at a fair price." },
    { g: "ᚲ", n: "Mr Crane", r: "Curio dealer", p: "Deals in curios behind a white mask. Ask him nothing you don't want answered." },
    { g: "ᚠ", n: "Ines Varga", r: "Charms", p: "Sells charms for every robe and every road. Bring her a rose and see what she says." },
    { g: "ᛗ", n: "Abel Marsh", r: "Chandler", p: "Candles, oils and lamp-wicks. He likes a good pike, if you have the patience for one." },
  ];
  $("#peopleGrid").innerHTML = PEOPLE.map(w => `<article class="who"><div class="seal rune" aria-hidden="true">${w.g}</div><div class="role">${w.r}</div><h3>${w.n}</h3><p>${w.p}</p>${w.tag ? `<span class="tag">${w.tag}</span>` : ""}</article>`).join("");

  /* ---------------- the books ---------------- */
  const BOOKS = [
    { n: "Book I", t: "The Unbroken Thread", s: "Hermetic, runic, chaos and celestial practice", c: "media/cover1.jpg", a: "B0HJN9ZRC3", pr: "$4.99", d: "The foundation: the Seven Hermetic Principles and grounding, ritual libraries for warding, abundance and personal power, the 24 runes of the Elder Futhark, sigil craft and celestial timing. Ends with a 30-day practice plan." },
    { n: "Book II", t: "The Waking Vessel", s: "Amulets, oils and wakened objects", c: "media/cover2.jpg", a: "B0HNSJ6YXN", pr: "$4.99", d: "Making, charging and retiring your own amulets, oils and instruments: the Threefold Vessel, seven amulets, seven anointing oils, seal and bindrune construction, and the Law of the Limit." },
    { n: "Book III", t: "The Tended Flame", s: "Candle craft", c: "media/cover3.jpg", a: "B0HJRLLLV7", pr: "$4.99", d: "The four bodies of a candle, dressing and carving, ten full workings from the Anchor Light to the nine-night Nine-Band Pillar, and a grounded way to read a burn." },
    { n: "Book IV", t: "The Wide Sky", s: "Celestial events and places of power", c: "media/cover4.jpg", a: "B0HJR21P43", pr: "$4.99", d: "Magic on the sky's timetable: eclipses, meteor showers and solstice sunrises, a dated calendar to 2028, ten workings, and how to find your own place of power. Southern skies in mind." },
    { n: "Book V", t: "The Whole Work", s: "The capstone", c: "media/cover5.jpg", a: "B0HJSTZJ9J", pr: "$5.99", d: "The system reduced to five laws, one diagnostic for any working that isn't working, seven great workings that run for months or years, and a master index of all five books." },
  ];
  $("#shelf").innerHTML = BOOKS.map(b => `<article class="book rise">
      <a class="tome" href="https://www.amazon.com/dp/${b.a}" aria-label="${b.t} on Kindle"><span class="cv"><img src="${b.c}" alt="${b.t} cover" loading="lazy"></span></a>
      <div class="num">${b.n}</div><h3>${b.t}</h3><div class="sub">${b.s}</div><p>${b.d}</p>
      <a class="btn sm" href="https://www.amazon.com/dp/${b.a}">Kindle · ${b.pr}</a></article>`).join("");
  const STORIES = [
    { t: "The Keeper of the Unbroken Thread", c: "media/story1.jpg", a: "B0HJRKXMMF", d: "A locked house, an antique key, a book no one can read, and letters nobody else can see." },
    { t: "The Careful Hand", c: "media/story2.jpg", a: "B0HJRL29WB", d: "An old woman with no name asks only to see the book. What she notices is worse than the letters." },
    { t: "The Turning Key", c: "media/story3.jpg", a: "B0HJRMKMF9", d: "Elsbeth Marrow inherits her grandmother's door and a key for every room but the one she needs." },
    { t: "The Hollow Hour", c: "media/story4.jpg", a: "B0HJRFHWN9", d: "Every clock in the village stops at the same hour. Wren Ashby inherits her aunt's cottage, and the silence." },
  ];
  $("#stories").innerHTML = STORIES.map((s, i) => `<article class="story"><img src="${s.c}" alt="${s.t} cover" loading="lazy"><div><div class="label">Story ${i + 1}</div><h3>${s.t}</h3><p>${s.d}</p><a class="btn sm ghost" href="https://www.amazon.com/dp/${s.a}">Kindle · $0.99</a></div></article>`).join("");
  // turn the books in the light under the pointer
  if (fine && !reduce) document.querySelectorAll(".tome").forEach(t => {
    const cvr = t.querySelector(".cv");
    t.addEventListener("pointermove", e => { const r = t.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; cvr.style.setProperty("--ry", (x * 34) + "deg"); cvr.style.setProperty("--rx", (-y * 18) + "deg"); });
    t.addEventListener("pointerleave", () => { cvr.style.removeProperty("--ry"); cvr.style.removeProperty("--rx"); });
  });

  /* ---------------- letters: email sign-up into Rowan's own Google Form ---------------- */
  const SIGNUP = { action: "https://docs.google.com/forms/d/e/1FAIpQLSd_1ODE-FIfMC1K2MM_JD1D4B8q18KRP0xduUwVY5o1mtmgNQ/formResponse", field: "entry.360860348" }; // the Google Form's formResponse URL and its email entry id
  const su = $("#signup");
  if (su) {
    if (!SIGNUP.action) {
      su.hidden = true;
      $("#lettersTitle").textContent = "Hear when the Reach changes";
      $(".letters p").textContent = "Follow the game on itch.io for a note with every update, read the news here, or add the RSS feed to your reader.";
      const f = $(".letters .also a"); if (f) f.textContent = "Follow the game on itch.io";
    } else {
      su.addEventListener("submit", e => {
        e.preventDefault();
        const em = $("#suEmail"), note = $("#suNote");
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value.trim())) { note.textContent = "That email doesn't look right. Check it and try again."; em.focus(); return; }
        const body = new URLSearchParams(); body.append(SIGNUP.field, em.value.trim());
        fetch(SIGNUP.action, { method: "POST", mode: "no-cors", body }).then(() => {
          su.classList.add("done"); note.textContent = "Thank you. The next letter from the Reach will find you.";
        }).catch(() => { note.textContent = "Something went wrong. Please try again in a moment."; });
      });
    }
  }

  // every link off the site opens in a new tab
  document.querySelectorAll('a[href^="http"]').forEach(a => { a.target = "_blank"; a.rel = "noopener"; });
  watch();
})();
