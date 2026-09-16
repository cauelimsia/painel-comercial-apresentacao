/* Painel do Comercial · apresentação para a equipe
   Navegação do deck, índice, modo apresentador, pinos dos prints e
   animações GSAP. Sem GSAP ou com prefers-reduced-motion o deck continua
   navegável: os slides aparecem direto no estado final. */

(function () {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".slide"));
  const total = slides.length;
  const segsWrap = document.querySelector("[data-segs]");
  const currentEl = document.querySelector("[data-current]");
  const totalEl = document.querySelector("[data-total]");
  const progressEl = document.querySelector("[data-progress]");
  const chapterNameEl = document.querySelector("[data-chapter-name]");
  const indexOverlay = document.querySelector("[data-index]");
  const indexList = document.querySelector("[data-index-list]");
  const bgEl = document.getElementById("bg");

  const hasGsap = typeof window.gsap !== "undefined";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animate = hasGsap && !reduced;

  let index = 0;
  let busy = false;

  totalEl.textContent = String(total).padStart(2, "0");

  /* ---------- Títulos palavra a palavra ---------- */

  // Cada palavra vira uma janelinha com a palavra dentro: na entrada, a
  // palavra sobe de dentro da própria linha. Elementos (em, span) são
  // preservados — só o texto é fatiado.
  function splitWords(node) {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = child.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) {
            frag.appendChild(document.createTextNode(" "));
            return;
          }
          const w = document.createElement("span");
          w.className = "w";
          const inner = document.createElement("span");
          inner.textContent = p;
          w.appendChild(inner);
          frag.appendChild(w);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE && !child.classList.contains("w")) {
        splitWords(child);
      }
    });
  }
  if (animate) document.querySelectorAll(".display[data-split]").forEach(splitWords);

  /* ---------- Índice ---------- */

  const indexButtons = [];
  let lastChapter = null;

  slides.forEach((s, i) => {
    const chapter = s.dataset.chapter || "Apresentação";
    if (chapter !== lastChapter) {
      const h = document.createElement("p");
      h.className = "index-chapter";
      h.textContent = chapter;
      indexList.appendChild(h);
      lastChapter = chapter;
    }
    const b = document.createElement("button");
    b.className = "index-item";
    b.type = "button";
    const num = document.createElement("span");
    num.className = "index-item__num";
    num.textContent = String(i + 1).padStart(2, "0");
    b.appendChild(num);
    b.appendChild(document.createTextNode(s.dataset.title || `Slide ${i + 1}`));
    b.addEventListener("click", () => {
      closeIndex();
      go(i);
    });
    indexList.appendChild(b);
    indexButtons.push(b);
  });

  function openIndex() {
    indexOverlay.hidden = false;
    indexButtons.forEach((b, k) => b.classList.toggle("is-current", k === index));
    const cur = indexButtons[index];
    if (cur) cur.scrollIntoView({ block: "center" });
    if (animate) {
      gsap.fromTo(
        indexOverlay.querySelector(".index-panel"),
        { autoAlpha: 0, y: 24, scale: 0.98 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: "power3.out" }
      );
    }
  }

  function closeIndex() {
    indexOverlay.hidden = true;
  }

  function toggleIndex() {
    indexOverlay.hidden ? openIndex() : closeIndex();
  }

  document.querySelector("[data-menu]").addEventListener("click", toggleIndex);
  document.querySelector("[data-index-close]").addEventListener("click", closeIndex);
  indexOverlay.addEventListener("click", (e) => {
    if (e.target === indexOverlay) closeIndex();
  });

  /* ---------- Segmentos ---------- */

  slides.forEach((s, i) => {
    const b = document.createElement("button");
    b.className = "seg";
    b.type = "button";
    b.setAttribute("aria-label", `Ir para: ${s.dataset.title || "slide " + (i + 1)}`);
    b.addEventListener("click", () => go(i));
    segsWrap.appendChild(b);
  });
  const segs = Array.from(segsWrap.children);

  document.querySelectorAll("[data-goto]").forEach((el) => {
    el.addEventListener("click", () => go(parseInt(el.dataset.goto, 10) - 1));
  });

  /* ---------- HUD ---------- */

  function pad(n) {
    return String(n + 1).padStart(2, "0");
  }

  function updateHud(i) {
    currentEl.textContent = pad(i);
    segs.forEach((d, k) => {
      d.classList.toggle("is-active", k === i);
      d.classList.toggle("is-done", k < i);
    });
    indexButtons.forEach((b, k) => b.classList.toggle("is-current", k === i));
    const light = slides[i].classList.contains("slide--light");
    document.body.classList.toggle("theme-light", light);
    if (bgEl) bgEl.style.backgroundColor = light ? "#f4efe6" : "#070a12";
    chapterNameEl.textContent = slides[i].dataset.chapter || "";
    if (animate) {
      gsap.to(progressEl, { scaleX: (i + 1) / total, duration: 0.5, ease: "power2.out" });
    } else {
      progressEl.style.transform = `scaleX(${(i + 1) / total})`;
    }
    if (window.PCFX) window.PCFX.setSlide(slides[i]);
    renderPresenter();
    history.replaceState(null, "", "#" + (i + 1));
  }

  /* ---------- Formatação ---------- */

  function formatNumber(v, decimals) {
    return v.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  function formatCount(el, v) {
    const fmt = el.dataset.fmt || "int";
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    if (fmt === "pct") return formatNumber(v, decimals) + "%";
    if (fmt === "money") return "R$ " + formatNumber(v, 0);
    if (fmt === "min") return formatNumber(v, decimals) + " min";
    if (fmt === "h") return formatNumber(v, decimals) + " h";
    return formatNumber(v, decimals);
  }

  /* ---------- Animações de entrada ---------- */

  function enterAnimations(slide, tl) {
    const words = slide.querySelectorAll(".display[data-split] .w > span");
    if (words.length) {
      tl.fromTo(words, { yPercent: 115 }, { yPercent: 0, duration: 0.85, stagger: 0.03, ease: "power3.out" }, 0.1);
    }
    const heads = Array.from(slide.querySelectorAll(".display:not([data-split])[data-r]"));
    const reveals = Array.from(slide.querySelectorAll("[data-r]")).filter((el) => !heads.includes(el));

    if (heads.length) {
      tl.fromTo(heads, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0.1);
    }
    if (reveals.length) {
      tl.fromTo(
        reveals,
        { autoAlpha: 0, y: 18, filter: "blur(6px)" },
        { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.62, stagger: 0.06, ease: "power2.out" },
        0.22
      );
    }

    const chapterNum = slide.querySelector(".chapter__num");
    if (chapterNum) {
      tl.fromTo(chapterNum, { scale: 1.3, autoAlpha: 0, x: -30 }, { scale: 1, autoAlpha: 1, x: 0, duration: 1, ease: "power3.out" }, 0.05);
    }

    slide.querySelectorAll("[data-count]").forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const obj = { v: 0 };
      tl.to(obj, { v: target, duration: 1.4, ease: "power2.out", onUpdate: () => (el.textContent = formatCount(el, obj.v)) }, 0.5);
    });

    const pins = slide.querySelectorAll(".pin");
    if (pins.length) {
      tl.fromTo(pins, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, stagger: 0.05, ease: "back.out(2)" }, 0.75);
    }

    const bars = slide.querySelectorAll("[data-bar]");
    if (bars.length) {
      tl.fromTo(bars, { scaleY: 0 }, { scaleY: 1, duration: 0.7, stagger: 0.08, ease: "power3.out" }, 0.6);
    }

    if (simEnter && slide.querySelector("[data-sim]")) tl.call(simEnter, null, 0.4);
  }

  function setFinalState(slide) {
    slide.querySelectorAll("[data-r], .pin, .display .w > span").forEach((el) => {
      el.style.opacity = "";
      el.style.visibility = "";
      el.style.transform = "";
      el.style.filter = "";
    });
    slide.querySelectorAll("[data-count]").forEach((el) => {
      el.textContent = formatCount(el, parseFloat(el.dataset.count));
    });
  }

  /* ---------- Pinos ↔ legenda ---------- */

  // Passar o mouse num item da legenda acende o pino correspondente no
  // print (e vice-versa): quem apresenta aponta sem laser.
  document.querySelectorAll("[data-pins]").forEach((wrap) => {
    const pins = Array.from(wrap.querySelectorAll(".pin"));
    const items = Array.from(wrap.querySelectorAll(".legend li"));
    const par = (n) => ({ pin: pins.find((p) => p.dataset.pin === n), item: items.find((i) => i.dataset.pin === n) });
    const hot = (n, on) => {
      const { pin, item } = par(n);
      if (pin) pin.classList.toggle("is-hot", on);
      if (item) item.classList.toggle("is-hot", on);
    };
    [...pins, ...items].forEach((el) => {
      el.addEventListener("mouseenter", () => hot(el.dataset.pin, true));
      el.addEventListener("mouseleave", () => hot(el.dataset.pin, false));
    });
  });

  /* ---------- Simulador do custo da espera ---------- */

  // Só aritmética com o que a equipe informar: conversas × parte que chega
  // ao vendedor × espera média = horas de cliente esperando. Nenhum
  // coeficiente escondido, nenhuma promessa.
  let simEnter = null;

  (function initSim() {
    const sim = document.querySelector("[data-sim]");
    if (!sim) return;

    const ins = {};
    const outs = {};
    const bars = {};
    sim.querySelectorAll("[data-sim-in]").forEach((el) => (ins[el.dataset.simIn] = el));
    sim.querySelectorAll("[data-sim-out]").forEach((el) => (outs[el.dataset.simOut] = el));
    sim.querySelectorAll("[data-sim-bar]").forEach((el) => (bars[el.dataset.simBar] = el));

    const DIAS_UTEIS = 22;
    const ALVO_MIN = 5;
    const h = (v) => formatNumber(v, 1) + " h";

    function render() {
      const conversas = parseFloat(ins.conversas.value);
      const parte = parseFloat(ins.parte.value);
      const espera = parseFloat(ins.espera.value);

      const chegam = (conversas * parte) / 100;
      const horasDia = (chegam * espera) / 60;
      const horasMes = horasDia * DIAS_UTEIS;
      const alvoDia = (chegam * ALVO_MIN) / 60;
      const alvoMes = alvoDia * DIAS_UTEIS;

      outs.conversas.textContent = String(conversas);
      outs.parte.textContent = parte + "%";
      outs.espera.textContent = espera + " min";
      outs.chegam.textContent = formatNumber(chegam, 1);
      outs.hoje.textContent = h(horasDia);
      outs.hojeMes.textContent = h(horasMes);
      outs.alvo.textContent = h(alvoDia);
      outs.alvoMes.textContent = h(alvoMes);
      outs.ganho.textContent = h(horasMes - alvoMes);

      bars.a.style.width = "100%";
      bars.b.style.width = Math.max(1.5, (alvoDia / Math.max(horasDia, 0.0001)) * 100) + "%";

      Object.keys(ins).forEach((k) => {
        const el = ins[k];
        const min = parseFloat(el.min);
        const p = ((parseFloat(el.value) - min) / (parseFloat(el.max) - min)) * 100;
        el.style.background = "linear-gradient(90deg, var(--laranja) 0 " + p + "%, rgba(255,255,255,0.22) " + p + "% 100%)";
      });
    }

    Object.keys(ins).forEach((k) => ins[k].addEventListener("input", render));
    render();

    simEnter = () => {
      bars.a.style.width = "0%";
      bars.b.style.width = "0%";
      setTimeout(render, 30);
    };
  })();

  /* ---------- Inclinação das TVs ---------- */

  (function initTilt() {
    if (!animate) return;
    const tvs = Array.from(document.querySelectorAll(".tv"));
    if (!tvs.length) return;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;

    function frame() {
      cx += (tx - cx) * 0.09;
      cy += (ty - cy) * 0.09;
      for (const el of tvs) {
        const slide = el.closest(".slide");
        if (!slide || !slide.classList.contains("is-active")) continue;
        el.style.setProperty("--tilt-y", cx.toFixed(2) + "deg");
        el.style.setProperty("--tilt-x", cy.toFixed(2) + "deg");
      }
      if (Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01) raf = requestAnimationFrame(frame);
      else raf = 0;
    }

    window.addEventListener(
      "pointermove",
      (e) => {
        tx = (e.clientX / window.innerWidth - 0.5) * 2 * 4;
        ty = -(e.clientY / window.innerHeight - 0.5) * 2 * 2.5;
        if (!raf) raf = requestAnimationFrame(frame);
      },
      { passive: true }
    );
  })();

  /* ---------- Modo apresentador ---------- */

  const presenter = { el: document.querySelector("[data-presenter]"), open: false, startedAt: null, timerId: null };

  function fmtClock(ms) {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  function renderPresenter() {
    if (!presenter.el || !presenter.open) return;
    const cur = slides[index];
    const nxt = slides[index + 1];
    presenter.el.querySelector("[data-p-now]").textContent = `${pad(index)} · ${cur.dataset.title || ""}`;
    presenter.el.querySelector("[data-p-next]").textContent = nxt ? `${pad(index + 1)} · ${nxt.dataset.title || ""}` : "— fim da apresentação —";
    presenter.el.querySelector("[data-p-notes]").textContent = cur.dataset.notes || "Sem roteiro para este slide.";
    presenter.el.querySelector("[data-p-chapter]").textContent = cur.dataset.chapter || "";
  }

  function togglePresenter() {
    if (!presenter.el) return;
    presenter.open = !presenter.open;
    presenter.el.hidden = !presenter.open;
    document.body.classList.toggle("presenting", presenter.open);
    if (presenter.open) {
      if (!presenter.startedAt) presenter.startedAt = Date.now();
      const clock = presenter.el.querySelector("[data-p-time]");
      presenter.timerId = setInterval(() => (clock.textContent = fmtClock(Date.now() - presenter.startedAt)), 1000);
      clock.textContent = fmtClock(Date.now() - presenter.startedAt);
      renderPresenter();
    } else {
      clearInterval(presenter.timerId);
    }
  }

  if (presenter.el) {
    presenter.el.querySelector("[data-p-close]").addEventListener("click", togglePresenter);
    presenter.el.querySelector("[data-p-reset]").addEventListener("click", () => {
      presenter.startedAt = Date.now();
      presenter.el.querySelector("[data-p-time]").textContent = "00:00";
    });
  }

  /* ---------- Troca de slide ---------- */

  function go(next) {
    if (next === index || next < 0 || next >= total || busy) return;
    const from = slides[index];
    const to = slides[next];
    const dir = next > index ? 1 : -1;
    index = next;
    updateHud(next);

    if (!animate) {
      from.classList.remove("is-active");
      to.classList.add("is-active");
      setFinalState(to);
      return;
    }

    busy = true;
    const tl = gsap.timeline({
      defaults: { overwrite: "auto" },
      onComplete: () => {
        busy = false;
        from.classList.remove("is-active");
        gsap.set(from, { clearProps: "all" });
        gsap.set(to, { clearProps: "clipPath" });
      },
    });

    // Cortina lateral: o slide novo entra varrendo, como uma troca de câmera.
    const inicio = dir > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)";
    tl.to(from, { autoAlpha: 0, x: -36 * dir, duration: 0.36, ease: "power2.in" }, 0);
    to.classList.add("is-active");
    tl.fromTo(to, { clipPath: inicio, autoAlpha: 1 }, { clipPath: "inset(0 0 0 0%)", duration: 0.62, ease: "power3.inOut" }, 0.1);
    const inner = to.querySelector(".slide-inner");
    if (inner) tl.fromTo(inner, { x: 48 * dir }, { x: 0, duration: 0.7, ease: "power3.out" }, 0.15);
    enterAnimations(to, tl);
  }

  const next = () => go(index + 1);
  const prev = () => go(index - 1);

  document.querySelector("[data-next]").addEventListener("click", next);
  document.querySelector("[data-prev]").addEventListener("click", prev);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      toggleIndex();
      return;
    }
    const onControl = e.target instanceof Element && e.target.closest("input, select, textarea");
    if (onControl && e.key !== "Escape") return;
    if (e.key === "p" || e.key === "P") {
      e.preventDefault();
      togglePresenter();
      return;
    }
    if (!indexOverlay.hidden) return;
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      prev();
    } else if (e.key === "Home") {
      go(0);
    } else if (e.key === "End") {
      go(total - 1);
    }
  });

  let wheelLock = 0;
  window.addEventListener(
    "wheel",
    (e) => {
      if (!indexOverlay.hidden) return;
      if (e.target instanceof Element && e.target.closest(".legend")) return;
      const now = Date.now();
      if (now - wheelLock < 1100 || Math.abs(e.deltaY) < 24) return;
      wheelLock = now;
      e.deltaY > 0 ? next() : prev();
    },
    { passive: true }
  );

  let touchX = null;
  window.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
  window.addEventListener(
    "touchend",
    (e) => {
      if (touchX === null || !indexOverlay.hidden) return;
      const dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) < 48) return;
      dx < 0 ? next() : prev();
    },
    { passive: true }
  );

  window.addEventListener("hashchange", () => {
    const n = parseInt((location.hash || "").replace("#", ""), 10);
    if (!isNaN(n) && n >= 1 && n <= total && n - 1 !== index) go(n - 1);
  });

  /* ---------- Início ---------- */

  const fromHash = parseInt((location.hash || "").replace("#", ""), 10);
  if (!isNaN(fromHash) && fromHash >= 1 && fromHash <= total) index = fromHash - 1;

  const first = slides[index];
  first.classList.add("is-active");
  updateHud(index);

  if (animate) {
    const tl = gsap.timeline();
    tl.fromTo(first, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0);
    enterAnimations(first, tl);
  } else {
    setFinalState(first);
  }
})();
