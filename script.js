import englishVocabulary from "./database.js";

const WORD_DATABASE = englishVocabulary;

const STORAGE_KEY = "english_vocab_app_v1";

function createDefaultState() {
  return {
    selectedCount: 5,
    accumulatedIds: [],
    newTodayIds: [],
    stats: {
      correct: 0,
      wrong: 0,
      weakIds: []
    },
    studyFilter: "all",
    practiceOrder: "ordered",
    practice: {
      queue: [],
      currentIndex: 0,
      roundCorrect: 0,
      roundWrong: 0,
      roundWeakIds: [],
      checkedCurrent: false,
      isWeakMode: false
    }
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw);
    const base = createDefaultState();
    return {
      ...base,
      ...parsed,
      practiceOrder: parsed.practiceOrder === "random" ? "random" : "ordered",
      stats: { ...base.stats, ...(parsed.stats || {}) },
      practice: { ...base.practice, ...(parsed.practice || {}) }
    };
  } catch {
    return createDefaultState();
  }
}

let state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getWordById(id) {
  return WORD_DATABASE.find((w) => w.id === id);
}

function normalizeAnswer(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getAcceptedAnswers(word) {
  const base = [normalizeAnswer(word.en)];
  if (word.en.toLowerCase() === "you") {
    base.push("u");
  }
  return base;
}

const el = {
  navButtons: document.querySelectorAll(".nav-btn"),
  viewSession: document.getElementById("viewSession"),
  viewDictionary: document.getElementById("viewDictionary"),
  navFullCount: document.getElementById("navFullCount"),
  statAccumulated: document.getElementById("statAccumulated"),
  statNewToday: document.getElementById("statNewToday"),
  statCorrect: document.getElementById("statCorrect"),
  statWeak: document.getElementById("statWeak"),
  countButtons: document.getElementById("countButtons"),
  countRange: document.getElementById("countRange"),
  selectedCountLabel: document.getElementById("selectedCountLabel"),
  addWordsBtn: document.getElementById("addWordsBtn"),
  resetProgressBtn: document.getElementById("resetProgressBtn"),
  statusBanner: document.getElementById("statusBanner"),
  studyStage: document.getElementById("studyStage"),
  studyFilterPills: document.getElementById("studyFilterPills"),
  pillAllCount: document.getElementById("pillAllCount"),
  pillNewCount: document.getElementById("pillNewCount"),
  pillReviewCount: document.getElementById("pillReviewCount"),
  studyCardsGrid: document.getElementById("studyCardsGrid"),
  goToPracticeBtn: document.getElementById("goToPracticeBtn"),
  goToPracticeBottomBtn: document.getElementById("goToPracticeBottomBtn"),
  practiceStage: document.getElementById("practiceStage"),
  backToStudyBtn: document.getElementById("backToStudyBtn"),
  practiceProgressText: document.getElementById("practiceProgressText"),
  practiceScoreText: document.getElementById("practiceScoreText"),
  practiceProgressFill: document.getElementById("practiceProgressFill"),
  practiceCard: document.getElementById("practiceCard"),
  practiceOriginBadge: document.getElementById("practiceOriginBadge"),
  practiceCategoryBadge: document.getElementById("practiceCategoryBadge"),
  practiceSpanishPrompt: document.getElementById("practiceSpanishPrompt"),
  practiceHint: document.getElementById("practiceHint"),
  answerForm: document.getElementById("answerForm"),
  englishInput: document.getElementById("englishInput"),
  checkBtn: document.getElementById("checkBtn"),
  validationBox: document.getElementById("validationBox"),
  validationTitle: document.getElementById("validationTitle"),
  validationDetail: document.getElementById("validationDetail"),
  nextWordBtn: document.getElementById("nextWordBtn"),
  roundSummary: document.getElementById("roundSummary"),
  roundSummaryText: document.getElementById("roundSummaryText"),
  weakWordsList: document.getElementById("weakWordsList"),
  practiceAgainBtn: document.getElementById("practiceAgainBtn"),
  practiceWeakBtn: document.getElementById("practiceWeakBtn"),
  backStudyFromSummaryBtn: document.getElementById("backStudyFromSummaryBtn"),
  dictSearchInput: document.getElementById("dictSearchInput"),
  dictCategorySelect: document.getElementById("dictCategorySelect"),
  dictionaryCountInfo: document.getElementById("dictionaryCountInfo"),
  dictionaryList: document.getElementById("dictionaryList"),
  statWeakCard: document.getElementById("statWeakCard"),
  weakWordsModal: document.getElementById("weakWordsModal"),
  closeWeakModalBtn: document.getElementById("closeWeakModalBtn"),
  closeWeakModalBottomBtn: document.getElementById("closeWeakModalBottomBtn"),
  weakModalDesc: document.getElementById("weakModalDesc"),
  weakModalList: document.getElementById("weakModalList"),
  startWeakPracticeFromModalBtn: document.getElementById("startWeakPracticeFromModalBtn")
};

function renderCountSelector() {
  el.countButtons.innerHTML = "";
  for (let n = 1; n <= 10; n++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `count-btn ${state.selectedCount === n ? "active" : ""}`;
    btn.textContent = String(n);
    btn.addEventListener("click", () => setSelectedCount(n));
    el.countButtons.appendChild(btn);
  }
  el.countRange.value = String(state.selectedCount);
  el.selectedCountLabel.textContent = String(state.selectedCount);
}

function setSelectedCount(n) {
  const clamped = Math.max(1, Math.min(10, Number(n) || 1));
  state.selectedCount = clamped;
  saveState();
  renderCountSelector();
  updateAddButtonText();
}

function getAvailableNewWords() {
  const existing = new Set(state.accumulatedIds);
  return WORD_DATABASE.filter((w) => !existing.has(w.id));
}

function updateAddButtonText() {
  const available = getAvailableNewWords().length;
  if (available === 0) {
    el.addWordsBtn.textContent = "Todas las palabras añadidas";
    el.addWordsBtn.disabled = true;
  } else {
    const toAdd = Math.min(state.selectedCount, available);
    el.addWordsBtn.textContent = `Añadir ${toAdd} ${toAdd === 1 ? "palabra" : "palabras"} y estudiar`;
    el.addWordsBtn.disabled = false;
  }
}

function renderStatsAndBanner() {
  el.navFullCount.textContent = String(WORD_DATABASE.length);
  el.statAccumulated.textContent = String(state.accumulatedIds.length);
  el.statNewToday.textContent = String(state.newTodayIds.length);
  el.statCorrect.textContent = String(state.stats.correct);
  el.statWeak.textContent = String(state.stats.weakIds.length);

  const available = getAvailableNewWords().length;
  if (state.accumulatedIds.length === 0) {
    el.statusBanner.className = "status-banner";
    el.statusBanner.textContent = `Elige de 1 a 10 palabras nuevas para comenzar tu historial acumulado (hay ${WORD_DATABASE.length} palabras disponibles en la base de datos).`;
  } else {
    const reviewCount = Math.max(0, state.accumulatedIds.length - state.newTodayIds.length);
    el.statusBanner.className = available === 0 ? "status-banner warning" : "status-banner";
    el.statusBanner.textContent =
      `Tienes ${state.accumulatedIds.length} palabras acumuladas (${state.newTodayIds.length} nuevas de la tanda actual y ${reviewCount} anteriores para repasar). ` +
      (available > 0
        ? `Quedan ${available} palabras sin incorporar en el diccionario.`
        : "¡Ya incorporaste todas las palabras de la base de datos!");
  }
}

function createWordCardElement(word, options = {}) {
  const { isNew = false, showOrigin = false, indexNumber = null } = options;
  const card = document.createElement("article");
  card.className = `word-card ${isNew ? "is-new" : ""}`;

  const originBadge = showOrigin
    ? `<span class="badge ${isNew ? "badge-new" : "badge-review"}">${isNew ? "Nueva" : "Acumulada"}</span>`
    : "";

  const prefix = indexNumber !== null ? `#${indexNumber} · ` : "";

  card.innerHTML = `
    <div class="word-card-top">
      <span class="word-en">${prefix}${word.en}</span>
      <span class="word-cat">${word.category}</span>
    </div>
    <div class="word-es">${word.es}</div>
    ${originBadge ? `<div>${originBadge}</div>` : ""}
    <p class="word-example">"${word.example}"</p>
    <p class="word-note">${word.note}</p>
  `;
  return card;
}

function renderStudyStage() {
  if (state.accumulatedIds.length === 0) {
    el.studyStage.classList.add("hidden");
    return;
  }

  el.studyStage.classList.remove("hidden");

  const newSet = new Set(state.newTodayIds);
  const allWords = state.accumulatedIds.map(getWordById).filter(Boolean);
  const newWords = allWords.filter((w) => newSet.has(w.id));
  const reviewWords = allWords.filter((w) => !newSet.has(w.id));

  el.pillAllCount.textContent = String(allWords.length);
  el.pillNewCount.textContent = String(newWords.length);
  el.pillReviewCount.textContent = String(reviewWords.length);

  el.studyFilterPills.querySelectorAll(".pill").forEach((pill) => {
    pill.classList.toggle("active", pill.dataset.filter === state.studyFilter);
  });

  let filtered = allWords;
  if (state.studyFilter === "new") filtered = newWords;
  if (state.studyFilter === "review") filtered = reviewWords;

  el.studyCardsGrid.innerHTML = "";
  if (filtered.length === 0) {
    el.studyCardsGrid.innerHTML = `<p class="muted">No hay palabras en este filtro todavía.</p>`;
    return;
  }

  filtered.forEach((word) => {
    el.studyCardsGrid.appendChild(
      createWordCardElement(word, {
        isNew: newSet.has(word.id),
        showOrigin: true
      })
    );
  });
}

function addSelectedWordsAndStudy() {
  const available = getAvailableNewWords();
  if (available.length === 0) return;

  const countToAdd = Math.min(state.selectedCount, available.length);
  const newlyPicked = available.slice(0, countToAdd).map((w) => w.id);

  state.newTodayIds = newlyPicked;
  state.accumulatedIds = [...state.accumulatedIds, ...newlyPicked];
  state.studyFilter = "all";

  el.practiceStage.classList.add("hidden");
  saveState();
  renderAll();
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getActiveStudyWords() {
  const newSet = new Set(state.newTodayIds);
  const allWords = state.accumulatedIds.map(getWordById).filter(Boolean);
  if (state.studyFilter === "new") {
    return allWords.filter((w) => newSet.has(w.id));
  }
  if (state.studyFilter === "review") {
    return allWords.filter((w) => !newSet.has(w.id));
  }
  return allWords;
}

function setPracticeOrder(order) {
  state.practiceOrder = order === "random" ? "random" : "ordered";
  saveState();
  renderOrderSelectors();
}

function renderOrderSelectors() {
  const current = state.practiceOrder || "ordered";
  document.querySelectorAll(".order-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.order === current);
  });
}

function openWeakModal() {
  renderWeakModalContent();
  el.weakWordsModal.classList.remove("hidden");
}

function closeWeakModal() {
  el.weakWordsModal.classList.add("hidden");
}

function renderWeakModalContent() {
  const weakWords = state.stats.weakIds.map(getWordById).filter(Boolean);
  el.weakModalList.innerHTML = "";

  if (weakWords.length === 0) {
    el.weakModalDesc.textContent =
      "No tienes palabras marcadas para reforzar en este momento. ¡Excelente progreso!";
    el.weakModalList.innerHTML = `
      <div class="empty-state">
        <span style="font-size: 2.5rem; display: block; margin-bottom: 8px;">🎉</span>
        <p style="font-weight: 600; color: var(--text); margin: 0 0 4px;">¡Sin palabras pendientes!</p>
        <p class="muted" style="margin: 0;">Cuando falles alguna palabra durante la práctica, se guardará aquí automáticamente para que puedas repasarla y reforzarla.</p>
      </div>
    `;
    el.startWeakPracticeFromModalBtn.classList.add("hidden");
  } else {
    el.weakModalDesc.textContent =
      `Tienes ${weakWords.length} ${weakWords.length === 1 ? "palabra que requiere" : "palabras que requieren"} refuerzo:`;
    el.startWeakPracticeFromModalBtn.classList.remove("hidden");
    el.startWeakPracticeFromModalBtn.textContent = `⚡ Practicar ${weakWords.length} ${weakWords.length === 1 ? "palabra" : "palabras"} ahora`;

    weakWords.forEach((word) => {
      const card = document.createElement("article");
      card.className = "weak-modal-card";
      card.innerHTML = `
        <div class="weak-modal-top">
          <span class="weak-modal-en">${word.id} · ${word.en}</span>
          <span class="weak-modal-cat">${word.category}</span>
        </div>
        <div class="weak-modal-es">${word.es}</div>
        <p class="weak-modal-ex">"${word.example}"</p>
      `;
      el.weakModalList.appendChild(card);
    });
  }
}

function startPractice(weakOnly = false) {
  if (state.accumulatedIds.length === 0) return;

  let queueIds = [];

  if (weakOnly) {
    const sourceWeak =
      state.practice.roundWeakIds.length > 0 ? state.practice.roundWeakIds : state.stats.weakIds;
    const validWeak = sourceWeak.filter((id) => state.accumulatedIds.includes(id));
    let weakWords = (validWeak.length > 0 ? validWeak : state.stats.weakIds).map(getWordById).filter(Boolean);
    if (weakWords.length === 0) return;

    if (state.practiceOrder === "random") {
      queueIds = shuffleArray(weakWords).map((w) => w.id);
    } else {
      queueIds = [...weakWords]
        .sort((a, b) => parseInt(a.id.replace(/\D/g, ""), 10) - parseInt(b.id.replace(/\D/g, ""), 10))
        .map((w) => w.id);
    }
  } else {
    let activeWords = getActiveStudyWords();
    if (activeWords.length === 0) {
      activeWords = state.accumulatedIds.map(getWordById).filter(Boolean);
    }
    if (activeWords.length === 0) return;

    if (state.practiceOrder === "random") {
      // Baraja el conjunto de palabras activo usando Fisher-Yates sin repeticiones
      queueIds = shuffleArray(activeWords).map((w) => w.id);
    } else {
      // Modo secuencial desde el ID menor al mayor
      queueIds = [...activeWords]
        .sort((a, b) => parseInt(a.id.replace(/\D/g, ""), 10) - parseInt(b.id.replace(/\D/g, ""), 10))
        .map((w) => w.id);
    }
  }

  state.practice = {
    queue: queueIds,
    currentIndex: 0,
    roundCorrect: 0,
    roundWrong: 0,
    roundWeakIds: [],
    checkedCurrent: false,
    isWeakMode: weakOnly
  };

  saveState();
  el.studyStage.classList.add("hidden");
  el.practiceStage.classList.remove("hidden");
  renderPracticeView();
}

function renderPracticeView() {
  const p = state.practice;
  const total = p.queue.length;

  if (total === 0 || p.currentIndex >= total) {
    showRoundSummary();
    return;
  }

  el.practiceCard.classList.remove("hidden");
  el.roundSummary.classList.add("hidden");

  const currentId = p.queue[p.currentIndex];
  const word = getWordById(currentId);
  if (!word) return;

  const isNew = state.newTodayIds.includes(word.id);
  const isWeak = p.isWeakMode;
  let contextLabel = isWeak ? " (Refuerzo)" : "";
  if (!isWeak) {
    if (state.studyFilter === "new") contextLabel = " (Nuevas)";
    if (state.studyFilter === "review") contextLabel = " (Repaso)";
  }
  const orderIndicator = state.practiceOrder === "random" ? " · 🔀 Aleatorio" : " · 🗂️ Ordenada";

  el.practiceProgressText.textContent = `Palabra ${p.currentIndex + 1} de ${total}${contextLabel}${orderIndicator}`;
  el.practiceScoreText.textContent = `Aciertos en ronda: ${p.roundCorrect}`;
  el.practiceProgressFill.style.width = `${(p.currentIndex / total) * 100}%`;

  el.practiceOriginBadge.textContent = isNew ? "Nueva de hoy" : "Acumulada para repaso";
  el.practiceOriginBadge.className = `badge ${isNew ? "badge-new" : "badge-review"}`;
  el.practiceCategoryBadge.textContent = word.category;

  el.practiceSpanishPrompt.textContent = word.es;
  el.practiceHint.textContent = `Pista: "${word.example.replace(new RegExp(`\\b${word.en}\\b`, "gi"), "_____")}"`;

  el.englishInput.value = "";
  el.englishInput.disabled = p.checkedCurrent;
  el.checkBtn.disabled = p.checkedCurrent;
  el.validationBox.classList.add("hidden");
  el.validationBox.classList.remove("correct", "incorrect");

  if (!p.checkedCurrent) {
    el.englishInput.focus();
  }
}

function handleCheckAnswer(event) {
  event.preventDefault();
  const p = state.practice;
  if (p.checkedCurrent || p.currentIndex >= p.queue.length) return;

  const userRaw = el.englishInput.value;
  const normalizedUser = normalizeAnswer(userRaw);
  if (!normalizedUser) {
    el.englishInput.focus();
    return;
  }

  const word = getWordById(p.queue[p.currentIndex]);
  const accepted = getAcceptedAnswers(word);
  const isCorrect = accepted.includes(normalizedUser);

  p.checkedCurrent = true;
  el.englishInput.disabled = true;
  el.checkBtn.disabled = true;
  el.validationBox.classList.remove("hidden", "correct", "incorrect");

  if (isCorrect) {
    p.roundCorrect += 1;
    state.stats.correct += 1;
    state.stats.weakIds = state.stats.weakIds.filter((id) => id !== word.id);

    el.validationBox.classList.add("correct");
    el.validationTitle.textContent = "¡Está bien!";
    el.validationDetail.textContent = `Escribiste "${userRaw.trim()}" correctamente. Respuesta: "${word.en}" — ${word.example}`;
  } else {
    p.roundWrong += 1;
    state.stats.wrong += 1;
    if (!state.stats.weakIds.includes(word.id)) {
      state.stats.weakIds.push(word.id);
    }
    if (!p.roundWeakIds.includes(word.id)) {
      p.roundWeakIds.push(word.id);
    }

    el.validationBox.classList.add("incorrect");
    el.validationTitle.textContent = "Está mal";
    el.validationDetail.innerHTML =
      `Tu respuesta: <strong>${userRaw.trim()}</strong> · Respuesta correcta: <strong>${word.en}</strong> (${word.es}).<br>` +
      `<em>${word.example}</em> — ${word.note}`;
  }

  saveState();
  renderStatsAndBanner();
  el.nextWordBtn.focus();
}

function handleNextWord() {
  const p = state.practice;
  p.currentIndex += 1;
  p.checkedCurrent = false;
  saveState();
  renderPracticeView();
}

function showRoundSummary() {
  const p = state.practice;
  el.practiceProgressFill.style.width = "100%";
  el.practiceCard.classList.add("hidden");
  el.roundSummary.classList.remove("hidden");

  const total = p.queue.length;
  el.roundSummaryText.textContent =
    `Respondiste ${total} ${total === 1 ? "palabra" : "palabras"}: ${p.roundCorrect} ${p.roundCorrect === 1 ? "acierto" : "aciertos"} y ${p.roundWrong} ${p.roundWrong === 1 ? "error" : "errores"}.`;

  el.weakWordsList.innerHTML = "";
  const weakToShow = p.roundWeakIds.length > 0 ? p.roundWeakIds : state.stats.weakIds;

  if (weakToShow.length > 0) {
    weakToShow.forEach((id) => {
      const w = getWordById(id);
      if (!w) return;
      const chip = document.createElement("span");
      chip.className = "weak-chip";
      chip.textContent = `${w.en} (${w.es})`;
      el.weakWordsList.appendChild(chip);
    });
    el.practiceWeakBtn.classList.remove("hidden");
  } else {
    el.practiceWeakBtn.classList.add("hidden");
  }
}

function populateCategoryFilter() {
  const categories = [...new Set(WORD_DATABASE.map((w) => w.category))];
  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    el.dictCategorySelect.appendChild(opt);
  });
}

function renderDictionary() {
  const rawQuery = (el.dictSearchInput.value || "").trim().toLowerCase();
  const query = normalizeAnswer(rawQuery);
  const cleanIdQuery = query.replace(/^#/, "");
  const idNumMatch = cleanIdQuery.match(/^w?(\d+)$/i);
  const targetIdNum = idNumMatch ? parseInt(idNumMatch[1], 10) : null;
  const category = el.dictCategorySelect.value;

  const matches = WORD_DATABASE.map((word, idx) => ({ word, position: idx + 1 })).filter(
    ({ word }) => {
      const matchesCat = category === "all" || word.category === category;
      if (!matchesCat) return false;
      if (!query) return true;

      const wordEn = normalizeAnswer(word.en);
      const wordId = normalizeAnswer(word.id);
      const wordIdNum = parseInt(word.id.replace(/^w/i, ""), 10);

      // Búsqueda solo por ID (ej. "w42", "w01", "42", "1")
      const matchesId =
        wordId === cleanIdQuery ||
        (targetIdNum !== null && wordIdNum === targetIdNum);

      // Búsqueda solo por la palabra en inglés ('en')
      const matchesEn = wordEn.includes(query);

      return matchesId || matchesEn;
    }
  );

  // Ordenar para mostrar coincidencias más exactas primero
  if (query) {
    matches.sort((a, b) => {
      const aEn = normalizeAnswer(a.word.en);
      const bEn = normalizeAnswer(b.word.en);
      const aId = normalizeAnswer(a.word.id);
      const bId = normalizeAnswer(b.word.id);
      const aIdNum = parseInt(a.word.id.replace(/^w/i, ""), 10);
      const bIdNum = parseInt(b.word.id.replace(/^w/i, ""), 10);

      const getRank = (en, id, idNum) => {
        if (id === cleanIdQuery || (targetIdNum !== null && idNum === targetIdNum)) return 0;
        if (en === query) return 1;
        if (en.startsWith(query)) return 2;
        return 3;
      };

      const rankA = getRank(aEn, aId, aIdNum);
      const rankB = getRank(bEn, bId, bIdNum);

      if (rankA !== rankB) return rankA - rankB;
      return a.position - b.position;
    });
  }

  el.dictionaryCountInfo.textContent = `Mostrando ${matches.length} de ${WORD_DATABASE.length} palabras en el diccionario.`;
  el.dictionaryList.innerHTML = "";

  if (matches.length === 0) {
    el.dictionaryList.innerHTML = `<p class="muted">No se encontraron palabras con ese criterio.</p>`;
    return;
  }

  matches.forEach(({ word, position }) => {
    el.dictionaryList.appendChild(
      createWordCardElement(word, {
        isNew: state.newTodayIds.includes(word.id),
        showOrigin: false,
        indexNumber: position
      })
    );
  });
}

function switchView(viewName) {
  el.navButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });
  el.viewSession.classList.toggle("active", viewName === "session");
  el.viewDictionary.classList.toggle("active", viewName === "dictionary");
  if (viewName === "dictionary") {
    renderDictionary();
  }
}

function resetProgress() {
  const confirmed = window.confirm("¿Deseas borrar tu historial acumulado, aciertos y palabras a reforzar?");
  if (!confirmed) return;
  state = createDefaultState();
  saveState();
  el.practiceStage.classList.add("hidden");
  renderAll();
}

function renderAll() {
  renderCountSelector();
  updateAddButtonText();
  renderStatsAndBanner();
  renderOrderSelectors();
  renderStudyStage();
  renderDictionary();
}

el.navButtons.forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

document.querySelectorAll(".order-btn").forEach((btn) => {
  btn.addEventListener("click", () => setPracticeOrder(btn.dataset.order));
});

if (el.statWeakCard) {
  el.statWeakCard.addEventListener("click", openWeakModal);
  el.statWeakCard.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openWeakModal();
    }
  });
}

if (el.closeWeakModalBtn) {
  el.closeWeakModalBtn.addEventListener("click", closeWeakModal);
}
if (el.closeWeakModalBottomBtn) {
  el.closeWeakModalBottomBtn.addEventListener("click", closeWeakModal);
}
if (el.weakWordsModal) {
  el.weakWordsModal.addEventListener("click", (e) => {
    if (e.target === el.weakWordsModal) closeWeakModal();
  });
}
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && el.weakWordsModal && !el.weakWordsModal.classList.contains("hidden")) {
    closeWeakModal();
  }
});

if (el.startWeakPracticeFromModalBtn) {
  el.startWeakPracticeFromModalBtn.addEventListener("click", () => {
    closeWeakModal();
    startPractice(true);
  });
}

el.countRange.addEventListener("input", (e) => setSelectedCount(e.target.value));
el.addWordsBtn.addEventListener("click", addSelectedWordsAndStudy);
el.resetProgressBtn.addEventListener("click", resetProgress);

el.studyFilterPills.addEventListener("click", (e) => {
  const pill = e.target.closest(".pill");
  if (!pill) return;
  state.studyFilter = pill.dataset.filter;
  saveState();
  renderStudyStage();
});

el.goToPracticeBtn.addEventListener("click", () => startPractice(false));
el.goToPracticeBottomBtn.addEventListener("click", () => startPractice(false));
el.backToStudyBtn.addEventListener("click", () => {
  el.practiceStage.classList.add("hidden");
  renderStudyStage();
});

el.answerForm.addEventListener("submit", handleCheckAnswer);
el.nextWordBtn.addEventListener("click", handleNextWord);

el.practiceAgainBtn.addEventListener("click", () => startPractice(false));
el.practiceWeakBtn.addEventListener("click", () => startPractice(true));
el.backStudyFromSummaryBtn.addEventListener("click", () => {
  el.practiceStage.classList.add("hidden");
  renderStudyStage();
});

el.dictSearchInput.addEventListener("input", renderDictionary);
el.dictCategorySelect.addEventListener("change", renderDictionary);

populateCategoryFilter();
renderAll();