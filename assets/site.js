const DATA_PATH = "./data/questions.json";
const STORAGE_KEY = "ipas-mock-exam-state-v1";
const EXAM_MINUTES = 60;

const SYLLABUS_LABELS = {
  L11101: "AI 的概念與分類",
  L11102: "AI 治理概念",
  L11203: "資料隱私與安全",
  L11301: "機器學習基本原理與目的",
  L11302: "常見的機器學習模型與評估方法",
  L11401: "鑑別式 AI 與生成式 AI 的基本原理",
  L11402: "鑑別式 AI 與生成式 AI 的整合應用",
  L12101: "No Code / Low Code 的基本概念",
  L12102: "No Code / Low Code 的優勢與限制",
  L12201: "生成式 AI 應用領域與常見工具",
  L12202: "如何善用生成式 AI 工具",
  L12301: "生成式 AI 導入評估",
  L12302: "生成式 AI 導入規劃",
  L12303: "生成式 AI 風險管理",
};

const loadData = async () => {
  const response = await fetch(DATA_PATH);
  if (!response.ok) throw new Error("題庫載入失敗");
  return response.json();
};

const loadState = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

const saveState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const createInitialState = (questionCount) => ({
  answers: {},
  flagged: [],
  currentIndex: 0,
  startedAt: Date.now(),
  deadlineAt: Date.now() + EXAM_MINUTES * 60 * 1000,
  submittedAt: null,
  questionCount,
});

const sanitizeMediaPath = (html) =>
  html.replaceAll("../image/", "./assets/images/");

const escapeHtml = (text) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const scoreExam = (questions, answers) => {
  let correct = 0;
  let blank = 0;

  questions.forEach((question) => {
    const answer = answers[question.id];
    if (!answer) {
      blank += 1;
      return;
    }
    if (answer === question.correctOption) correct += 1;
  });

  return {
    total: questions.length,
    correct,
    blank,
    wrong: questions.length - correct - blank,
    rate: questions.length ? Math.round((correct / questions.length) * 100) : 0,
  };
};

const getStatus = (question, userAnswer) => {
  if (!userAnswer) return "blank";
  return userAnswer === question.correctOption ? "correct" : "wrong";
};

const renderRichBlock = (html) => sanitizeMediaPath(html);

const initHomePage = async () => {
  const data = await loadData();
  const metaNodes = document.querySelectorAll(".hero__meta span");
  if (metaNodes.length >= 2) {
    metaNodes[0].textContent = `共 ${data.questionCount} 題`;
    metaNodes[1].textContent = `${data.syllabusMap.length} 個命題大綱`;
  }
};

const initExamPage = async () => {
  const data = await loadData();
  const questions = data.questions;
  const elements = {
    timerDisplay: document.getElementById("timerDisplay"),
    progressDisplay: document.getElementById("progressDisplay"),
    progressBar: document.getElementById("progressBar"),
    questionPalette: document.getElementById("questionPalette"),
    questionMeta: document.getElementById("questionMeta"),
    questionHeading: document.getElementById("questionHeading"),
    questionMedia: document.getElementById("questionMedia"),
    questionContent: document.getElementById("questionContent"),
    optionsForm: document.getElementById("optionsForm"),
    navStatus: document.getElementById("navStatus"),
    prevButton: document.getElementById("prevButton"),
    nextButton: document.getElementById("nextButton"),
    flagButton: document.getElementById("flagButton"),
    resetExamButton: document.getElementById("resetExamButton"),
    submitExamButton: document.getElementById("submitExamButton"),
  };

  let state = loadState();
  if (!state.questionCount || state.questionCount !== questions.length || state.submittedAt) {
    state = createInitialState(questions.length);
    saveState(state);
  }

  const updateTimer = () => {
    const remainingMs = Math.max(0, state.deadlineAt - Date.now());
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    elements.timerDisplay.textContent = `${minutes}:${seconds}`;
    if (remainingMs <= 0) submitExam(true);
  };

  const updatePalette = () => {
    elements.questionPalette.innerHTML = questions
      .map((question, index) => {
        const answered = state.answers[question.id];
        const flagged = state.flagged.includes(question.id);
        const classes = [
          "palette__button",
          answered ? "is-answered" : "",
          flagged ? "is-flagged" : "",
          index === state.currentIndex ? "is-current" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return `<button class="${classes}" type="button" data-index="${index}">${index + 1}</button>`;
      })
      .join("");

    elements.questionPalette.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        state.currentIndex = Number(button.dataset.index);
        saveState(state);
        renderCurrentQuestion();
      });
    });
  };

  const updateProgress = () => {
    const answeredCount = Object.keys(state.answers).length;
    elements.progressDisplay.textContent = `${answeredCount} / ${questions.length}`;
    elements.progressBar.style.width = `${(answeredCount / questions.length) * 100}%`;
  };

  const renderCurrentQuestion = () => {
    const question = questions[state.currentIndex];
    const syllabusLabel = SYLLABUS_LABELS[question.syllabus] || question.syllabus;
    elements.questionMeta.textContent = `${question.syllabus}・${syllabusLabel}`;
    elements.questionHeading.textContent = `第 ${question.sequence} 題`;
    elements.questionContent.innerHTML = renderRichBlock(question.questionHtml);
    elements.questionMedia.innerHTML = question.mediaHtml
      .map((media) => renderRichBlock(media))
      .join("");
    elements.navStatus.textContent = `第 ${question.sequence} 題 / 共 ${questions.length} 題`;
    elements.flagButton.classList.toggle("is-active", state.flagged.includes(question.id));
    elements.flagButton.textContent = state.flagged.includes(question.id) ? "取消標記" : "標記此題";

    elements.optionsForm.innerHTML = question.options
      .map((option) => {
        const checked = state.answers[question.id] === option.key ? "checked" : "";
        const selectedClass = checked ? "is-selected" : "";
        return `
          <label class="option-card ${selectedClass}">
            <input type="radio" name="answer" value="${option.key}" ${checked} />
            <span class="option-card__letter">${option.key}</span>
            <span>${renderRichBlock(option.html)}</span>
          </label>
        `;
      })
      .join("");

    elements.optionsForm.querySelectorAll('input[name="answer"]').forEach((input) => {
      input.addEventListener("change", () => {
        state.answers[question.id] = input.value;
        saveState(state);
        updateProgress();
        updatePalette();
        renderCurrentQuestion();
      });
    });

    elements.prevButton.disabled = state.currentIndex === 0;
    elements.nextButton.textContent =
      state.currentIndex === questions.length - 1 ? "前往交卷" : "下一題";

    updateProgress();
    updatePalette();
  };

  const submitExam = (autoSubmit = false) => {
    state.submittedAt = Date.now();
    state.score = scoreExam(questions, state.answers);
    saveState(state);
    const target = autoSubmit ? "./review.html?mode=timeout" : "./review.html?mode=submitted";
    window.location.href = target;
  };

  elements.prevButton.addEventListener("click", () => {
    if (state.currentIndex > 0) {
      state.currentIndex -= 1;
      saveState(state);
      renderCurrentQuestion();
    }
  });

  elements.nextButton.addEventListener("click", () => {
    if (state.currentIndex === questions.length - 1) {
      submitExam(false);
      return;
    }
    state.currentIndex += 1;
    saveState(state);
    renderCurrentQuestion();
  });

  elements.flagButton.addEventListener("click", () => {
    const questionId = questions[state.currentIndex].id;
    const flaggedSet = new Set(state.flagged);
    if (flaggedSet.has(questionId)) {
      flaggedSet.delete(questionId);
    } else {
      flaggedSet.add(questionId);
    }
    state.flagged = [...flaggedSet];
    saveState(state);
    renderCurrentQuestion();
  });

  elements.resetExamButton.addEventListener("click", () => {
    if (!window.confirm("要重新開始考試嗎？目前作答將被清空。")) return;
    state = createInitialState(questions.length);
    saveState(state);
    renderCurrentQuestion();
    updateTimer();
  });

  elements.submitExamButton.addEventListener("click", () => {
    const unanswered = questions.length - Object.keys(state.answers).length;
    const prompt = unanswered
      ? `還有 ${unanswered} 題未作答，仍要交卷嗎？`
      : "確定交卷並前往解答版嗎？";
    if (window.confirm(prompt)) submitExam(false);
  });

  renderCurrentQuestion();
  updateTimer();
  window.setInterval(updateTimer, 1000);
};

const initReviewPage = async () => {
  const data = await loadData();
  const questions = data.questions;
  const state = loadState();
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode") || "answer-key";
  const answers = state.answers || {};
  const score = state.score || scoreExam(questions, answers);

  const elements = {
    reviewModeLabel: document.getElementById("reviewModeLabel"),
    reviewSummaryText: document.getElementById("reviewSummaryText"),
    reviewSyllabusFilter: document.getElementById("reviewSyllabusFilter"),
    reviewStatusFilter: document.getElementById("reviewStatusFilter"),
    reviewList: document.getElementById("reviewList"),
    scoreTotal: document.getElementById("scoreTotal"),
    scoreCorrect: document.getElementById("scoreCorrect"),
    scoreRate: document.getElementById("scoreRate"),
    scoreBlank: document.getElementById("scoreBlank"),
  };

  const modeText =
    mode === "submitted"
      ? "交卷檢討版"
      : mode === "timeout"
        ? "時間到自動交卷"
        : "解答版";

  elements.reviewModeLabel.textContent = modeText;
  elements.reviewSummaryText.textContent =
    mode === "answer-key"
      ? "目前顯示完整解答與解析，可直接作為老師講解版或學生複習版使用。"
      : `本次作答答對 ${score.correct} 題，共 ${score.total} 題，正確率 ${score.rate}%。下方已展開完整答案與解析。`;

  elements.scoreTotal.textContent = String(score.total);
  elements.scoreCorrect.textContent = String(score.correct);
  elements.scoreRate.textContent = `${score.rate}%`;
  elements.scoreBlank.textContent = String(score.blank);

  elements.reviewSyllabusFilter.innerHTML = [
    '<option value="all">全部命題大綱</option>',
    ...data.syllabusMap.map(
      (item) =>
        `<option value="${item.id}">${item.id}・${SYLLABUS_LABELS[item.id] || item.id} (${item.count} 題)</option>`,
    ),
  ].join("");

  const renderList = () => {
    const syllabusFilter = elements.reviewSyllabusFilter.value;
    const statusFilter = elements.reviewStatusFilter.value;

    const filtered = questions.filter((question) => {
      const userAnswer = answers[question.id];
      const status = getStatus(question, userAnswer);
      const matchSyllabus = syllabusFilter === "all" || question.syllabus === syllabusFilter;
      const matchStatus = statusFilter === "all" || status === statusFilter;
      return matchSyllabus && matchStatus;
    });

    if (!filtered.length) {
      elements.reviewList.innerHTML =
        '<section class="panel empty-state">目前沒有符合條件的題目。</section>';
      return;
    }

    elements.reviewList.innerHTML = filtered
      .map((question) => {
        const userAnswer = answers[question.id];
        const status = getStatus(question, userAnswer);
        const statusText =
          status === "correct" ? "答對" : status === "wrong" ? "答錯" : "未作答";
        const statusClass =
          status === "correct" ? "pill--correct" : status === "wrong" ? "pill--wrong" : "pill--blank";

        return `
          <article class="review-card">
            <div class="review-card__top">
              <div>
                <div class="panel__label">${question.syllabus}・${SYLLABUS_LABELS[question.syllabus] || question.syllabus}</div>
                <h2>第 ${question.sequence} 題</h2>
                <div class="review-card__meta">
                  <span class="pill ${statusClass}">${statusText}</span>
                  <span class="pill pill--blank">你的答案：${userAnswer || "未作答"}</span>
                  <span class="pill pill--correct">正確答案：${question.correctOption}</span>
                </div>
              </div>
            </div>
            <div class="question-media">${question.mediaHtml.map((media) => renderRichBlock(media)).join("")}</div>
            <div class="question-richtext">${renderRichBlock(question.questionHtml)}</div>
            <div class="review-options">
              ${question.options
                .map((option) => {
                  const isCorrect = option.key === question.correctOption;
                  const isUserWrong = userAnswer === option.key && userAnswer !== question.correctOption;
                  const classes = [
                    "review-option",
                    isCorrect ? "is-correct" : "",
                    isUserWrong ? "is-user-wrong" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  const tags = [
                    isCorrect ? "<span>正解</span>" : "",
                    isUserWrong ? "<span>你的作答</span>" : "",
                  ]
                    .filter(Boolean)
                    .join("");

                  return `
                    <div class="${classes}">
                      <div class="review-option__head">
                        <span>${option.key}</span>
                        <span>${tags}</span>
                      </div>
                      <div>${renderRichBlock(option.html)}</div>
                    </div>
                  `;
                })
                .join("")}
            </div>
            <div class="review-explanation">${renderRichBlock(question.explanationHtml)}</div>
          </article>
        `;
      })
      .join("");
  };

  elements.reviewSyllabusFilter.addEventListener("change", renderList);
  elements.reviewStatusFilter.addEventListener("change", renderList);
  renderList();
};

const init = async () => {
  const page = document.body.dataset.page;
  try {
    if (page === "home") await initHomePage();
    if (page === "exam") await initExamPage();
    if (page === "review") await initReviewPage();
  } catch (error) {
    document.body.innerHTML = `<main class="shell"><section class="panel empty-state">${escapeHtml(error.message)}</section></main>`;
  }
};

init();
