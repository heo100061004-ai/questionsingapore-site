const list = document.getElementById('admin-questions');
const clearButton = document.getElementById('clear-questions');
const searchInput = document.getElementById('admin-search');
const statusFilterSelect = document.getElementById('admin-status-filter');
const categoryFilterSelect = document.getElementById('admin-category-filter');
const sortFilterSelect = document.getElementById('admin-sort-filter');
const tabButtons = Array.from(document.querySelectorAll('.admin-tab'));
const kpiContainer = document.getElementById('admin-kpis');
const categoryContainer = document.getElementById('analytics-category');
const channelContainer = document.getElementById('analytics-channel');
const languageContainer = document.getElementById('analytics-language');
const trendContainer = document.getElementById('analytics-trend');
const modal = document.getElementById('question-modal');
const modalCategory = document.getElementById('question-modal-category');
const modalStatus = document.getElementById('question-modal-status');
const modalTitle = document.getElementById('question-modal-title');
const modalMeta = document.getElementById('question-modal-meta');
const modalQuestion = document.getElementById('question-modal-question');
const modalContactType = document.getElementById('question-modal-contact-type');
const modalContactValue = document.getElementById('question-modal-contact-value');
const modalLanguage = document.getElementById('question-modal-language');
const modalCreatedAt = document.getElementById('question-modal-created-at');
const modalReply = document.getElementById('question-modal-reply');
const modalSendButton = document.getElementById('question-modal-send');
const modalOpenChannelButton = document.getElementById('question-modal-open-channel');
const modalCloseTargets = Array.from(document.querySelectorAll('[data-modal-close]'));
const adminBanner = document.getElementById('admin-banner');
const adminBannerUrlInput = document.getElementById('admin-banner-url');
const adminBannerApplyButton = document.getElementById('admin-banner-apply');
const adminBannerFileInput = document.getElementById('admin-banner-file');
const adminBannerResetButton = document.getElementById('admin-banner-reset');
const adminBannerSizeInfo = document.getElementById('admin-banner-size');
const homeVideoUrlInput = document.getElementById('home-video-url');
const homeVideoApplyButton = document.getElementById('home-video-apply');
const homeVideoFileInput = document.getElementById('home-video-file');
const homeVideoResetButton = document.getElementById('home-video-reset');
const homeVideoSizeInfo = document.getElementById('home-video-size');
const store = window.QuestionSingaporeStore;
const ADMIN_EMAIL = 'hello@questionsingapore.com';
const ADMIN_WHATSAPP_NUMBER = '6592218254';
const ADMIN_BANNER_STORAGE_KEY = 'question-singapore-admin-banner-url';
const ADMIN_DEFAULT_BANNER_URL = 'hero-bg.svg';
const HOME_TOP_VIDEO_STORAGE_KEY = 'question-singapore-home-top-video-url';
const HOME_MEDIA_DB_NAME = 'question-singapore-media-db';
const HOME_MEDIA_DB_VERSION = 1;
const HOME_MEDIA_STORE_NAME = 'media';
const HOME_TOP_VIDEO_BLOB_KEY = 'home-top-video';

let currentView = 'recent';
let searchTerm = '';
let statusFilter = 'pending';
let categoryFilter = 'all';
let sortOrder = 'latest';
let selectedQuestionId = null;

const languageMap = {
  ko: '한국어',
  en: 'English',
  zh: '中文'
};

const contactMap = {
  email: '이메일',
  whatsapp: 'WhatsApp'
};

function normalizeText(value) {
  return (value || '').toString().toLowerCase();
}

function escapeHtml(value) {
  return (value || '')
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isAnswered(question) {
  return question.status === '답변완료' || (question.answer || '').trim();
}

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function excerptText(value, max = 120) {
  const text = (value || '').toString().replace(/\s+/g, ' ').trim();
  if (!text) {
    return '질문 내용이 없습니다.';
  }

  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, max).trimEnd()}…`;
}

function setAdminBannerImage(url) {
  if (!adminBanner) {
    return;
  }

  const imageUrl = (url || ADMIN_DEFAULT_BANNER_URL).trim();
  adminBanner.style.backgroundImage = `url('${imageUrl}')`;
  updateAdminBannerSizeInfo(imageUrl);
  if (adminBannerUrlInput) {
    adminBannerUrlInput.value = imageUrl === ADMIN_DEFAULT_BANNER_URL ? '' : imageUrl;
  }
}

function updateAdminBannerSizeInfo(imageUrl) {
  if (!adminBannerSizeInfo) {
    return;
  }

  adminBannerSizeInfo.textContent = '확인 중...';
  const probe = new Image();
  probe.onload = () => {
    adminBannerSizeInfo.textContent = `${probe.naturalWidth} x ${probe.naturalHeight}px`;
  };
  probe.onerror = () => {
    adminBannerSizeInfo.textContent = '크기 확인 불가';
  };
  probe.src = imageUrl;
}

function saveAdminBannerImage(url) {
  const imageUrl = (url || '').trim();

  if (!imageUrl) {
    window.localStorage.removeItem(ADMIN_BANNER_STORAGE_KEY);
    setAdminBannerImage(ADMIN_DEFAULT_BANNER_URL);
    return;
  }

  window.localStorage.setItem(ADMIN_BANNER_STORAGE_KEY, imageUrl);
  setAdminBannerImage(imageUrl);
}

function initAdminBannerImage() {
  if (!adminBanner) {
    return;
  }

  const savedUrl = window.localStorage.getItem(ADMIN_BANNER_STORAGE_KEY);
  setAdminBannerImage(savedUrl || ADMIN_DEFAULT_BANNER_URL);
}

function updateHomeVideoSizeInfo(videoUrl) {
  if (!homeVideoSizeInfo) {
    return;
  }

  if (!videoUrl) {
    homeVideoSizeInfo.textContent = '설정 안됨';
    return;
  }

  homeVideoSizeInfo.textContent = '확인 중...';
  const probe = document.createElement('video');
  probe.preload = 'metadata';
  probe.onloadedmetadata = () => {
    homeVideoSizeInfo.textContent = `${probe.videoWidth} x ${probe.videoHeight}px`;
  };
  probe.onerror = () => {
    homeVideoSizeInfo.textContent = '크기 확인 불가';
  };
  probe.src = videoUrl;
}

function setHomeVideo(url) {
  const videoUrl = (url || '').trim();
  if (homeVideoUrlInput) {
    homeVideoUrlInput.value = videoUrl;
  }
  updateHomeVideoSizeInfo(videoUrl);
}

function saveHomeVideo(url) {
  const videoUrl = (url || '').trim();

  if (!videoUrl) {
    window.localStorage.removeItem(HOME_TOP_VIDEO_STORAGE_KEY);
    setHomeVideo('');
    return;
  }

  try {
    window.localStorage.setItem(HOME_TOP_VIDEO_STORAGE_KEY, videoUrl);
    setHomeVideo(videoUrl);
  } catch (error) {
    window.alert('영상이 너무 커서 저장할 수 없습니다. URL 방식으로 등록해주세요.');
  }
}

async function initHomeVideoSettings() {
  const savedUrl = window.localStorage.getItem(HOME_TOP_VIDEO_STORAGE_KEY);
  if (savedUrl) {
    setHomeVideo(savedUrl);
    return;
  }

  try {
    const blob = await getHomeVideoBlob();
    if (blob) {
      const objectUrl = URL.createObjectURL(blob);
      setHomeVideo('');
      updateHomeVideoSizeInfo(objectUrl);
      return;
    }
  } catch (error) {
    console.error('Home video init failed:', error);
  }

  setHomeVideo('');
}

function openHomeMediaDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = window.indexedDB.open(HOME_MEDIA_DB_NAME, HOME_MEDIA_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(HOME_MEDIA_STORE_NAME)) {
        db.createObjectStore(HOME_MEDIA_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open media DB'));
  });
}

async function saveHomeVideoBlob(file) {
  const db = await openHomeMediaDb();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(HOME_MEDIA_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(HOME_MEDIA_STORE_NAME);
    const request = store.put(file, HOME_TOP_VIDEO_BLOB_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Failed to save video blob'));
  });
}

async function getHomeVideoBlob() {
  const db = await openHomeMediaDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HOME_MEDIA_STORE_NAME, 'readonly');
    const store = transaction.objectStore(HOME_MEDIA_STORE_NAME);
    const request = store.get(HOME_TOP_VIDEO_BLOB_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error('Failed to read video blob'));
  });
}

async function clearHomeVideoBlob() {
  const db = await openHomeMediaDb();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(HOME_MEDIA_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(HOME_MEDIA_STORE_NAME);
    const request = store.delete(HOME_TOP_VIDEO_BLOB_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error('Failed to clear video blob'));
  });
}

function countBy(items, mapper) {
  const result = new Map();
  items.forEach((item) => {
    const key = mapper(item);
    result.set(key, (result.get(key) || 0) + 1);
  });
  return [...result.entries()].sort((a, b) => b[1] - a[1]);
}

function formatMetricRows(rows) {
  if (!rows.length) {
    return '<p class="empty-state">데이터가 없습니다.</p>';
  }

  const max = Math.max(...rows.map(([, value]) => Number(value) || 0), 1);

  return rows
    .map(([label, value]) => {
      const amount = Number(value) || 0;
      const width = amount ? Math.max((amount / max) * 100, 10) : 0;
      return `
        <div class="analytics-row analytics-row--chart">
          <div class="analytics-row__head">
            <span>${escapeHtml(label)}</span>
            <strong>${amount}</strong>
          </div>
          <div class="analytics-bar" aria-hidden="true">
            <span style="width:${width}%"></span>
          </div>
        </div>
      `;
    })
    .join('');
}

function getCategories(questions) {
  return [...new Set(questions.map((question) => question.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'));
}

function syncFilterControls() {
  if (statusFilterSelect) {
    statusFilterSelect.value = statusFilter;
  }

  if (categoryFilterSelect) {
    categoryFilterSelect.value = categoryFilter;
  }

  if (sortFilterSelect) {
    sortFilterSelect.value = sortOrder;
  }
}

function populateCategoryFilter(questions) {
  if (!categoryFilterSelect) {
    return;
  }

  const categories = getCategories(questions);
  if (categoryFilter !== 'all' && !categories.includes(categoryFilter)) {
    categoryFilter = 'all';
  }

  categoryFilterSelect.innerHTML = ['<option value="all">전체 카테고리</option>']
    .concat(categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`))
    .join('');

  categoryFilterSelect.value = categoryFilter;
}

function matchesSearch(question) {
  if (!searchTerm) {
    return true;
  }

  const haystack = [question.name, question.question, question.answer, question.contactValue, question.category, question.status]
    .map(normalizeText)
    .join(' ');
  return haystack.includes(searchTerm);
}

function sortQuestions(questions) {
  const sorted = [...questions];

  switch (sortOrder) {
    case 'oldest':
      sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
    case 'name':
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
      break;
    default:
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
  }

  return sorted;
}

function getFilteredQuestions(questions) {
  let filtered = questions.filter(matchesSearch);

  if (statusFilter === 'answered') {
    filtered = filtered.filter((question) => isAnswered(question));
  } else if (statusFilter === 'pending') {
    filtered = filtered.filter((question) => !isAnswered(question));
  }

  if (categoryFilter !== 'all') {
    const selectedCategory = normalizeText(categoryFilter);
    filtered = filtered.filter((question) => normalizeText(question.category) === selectedCategory);
  }

  return sortQuestions(filtered);
}

function getEmptyStateLabel(hasQuestions, visibleCount) {
  if (!hasQuestions) {
    return '아직 저장된 질문이 없습니다.';
  }

  if (!visibleCount) {
    if (statusFilter === 'pending') {
      return currentView === 'archive' ? '미답변 아카이브 항목이 없습니다.' : '미답변 문의가 없습니다.';
    }

    if (statusFilter === 'answered') {
      return currentView === 'recent' ? '최근 문의 중 답변 완료된 항목이 없습니다.' : '아카이브에 저장된 문의가 없습니다.';
    }

    return '조건에 맞는 문의가 없습니다.';
  }

  return '조건에 맞는 문의가 없습니다.';
}

function setActiveTab(view) {
  currentView = view;
  statusFilter = view === 'archive' ? 'answered' : 'pending';
  syncFilterControls();
  renderQuestions();
}

function renderDashboard() {
  if (!store) {
    return;
  }

  const questions = store.getQuestions();
  populateCategoryFilter(questions);

  const total = questions.length;
  const answered = questions.filter((question) => isAnswered(question)).length;
  const pending = total - answered;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = questions.filter((question) => new Date(question.createdAt) >= todayStart).length;
  const responseRate = total ? Math.round((answered / total) * 100) : 0;

  if (kpiContainer) {
    kpiContainer.innerHTML = `
      <article class="admin-kpi-card admin-kpi-card--accent">
        <p>총 문의</p>
        <h3>${total}</h3>
        <span>누적 접수</span>
      </article>
      <article class="admin-kpi-card">
        <p>오늘 접수</p>
        <h3>${todayCount}</h3>
        <span>당일 유입</span>
      </article>
      <article class="admin-kpi-card">
        <p>답변 완료</p>
        <h3>${answered}</h3>
        <span>아카이브 반영</span>
      </article>
      <article class="admin-kpi-card">
        <p>미답변</p>
        <h3>${pending}</h3>
        <span>우선 처리</span>
      </article>
      <article class="admin-kpi-card admin-kpi-card--emphasis">
        <p>답변률</p>
        <h3>${responseRate}%</h3>
        <span>운영 효율</span>
      </article>
    `;
  }

  if (categoryContainer) {
    const categoryRows = countBy(questions, (question) => question.category || '기타');
    categoryContainer.innerHTML = `<h4>카테고리 분포</h4>${formatMetricRows(categoryRows)}`;
  }

  if (channelContainer) {
    const channelRows = countBy(questions, (question) => contactMap[question.contactType] || '기타');
    channelContainer.innerHTML = `<h4>연락 채널</h4>${formatMetricRows(channelRows)}`;
  }

  if (languageContainer) {
    const languageRows = countBy(questions, (question) => languageMap[question.language] || question.language || '기타');
    languageContainer.innerHTML = `<h4>접수 언어</h4>${formatMetricRows(languageRows)}`;
  }

  if (trendContainer) {
    const dayBuckets = [];
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      dayBuckets.push(day);
    }

    const trendRows = dayBuckets.map((day) => {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const count = questions.filter((question) => {
        const created = new Date(question.createdAt);
        return created >= day && created < nextDay;
      }).length;
      const label = `${day.getMonth() + 1}/${day.getDate()}`;
      return [label, count];
    });

    trendContainer.innerHTML = `<h4>최근 7일 문의 추이</h4>${formatMetricRows(trendRows)}`;
  }
}

function renderQuestions() {
  if (!list || !store) {
    return;
  }

  const questions = store.getQuestions();
  const visibleQuestions = getFilteredQuestions(questions);

  if (!questions.length) {
    list.innerHTML = '<p class="empty-state">아직 저장된 질문이 없습니다.</p>';
    return;
  }

  if (!visibleQuestions.length) {
    list.innerHTML = `<p class="empty-state">${getEmptyStateLabel(questions.length, visibleQuestions.length)}</p>`;
    return;
  }

  list.innerHTML = visibleQuestions
    .map((question) => {
      const date = formatDateTime(question.createdAt);
      const answered = isAnswered(question);
      return `
        <article class="admin-card" data-question-id="${escapeHtml(question.id)}">
          <div class="admin-card__surface" role="button" tabindex="0" data-action="open-question" data-question-id="${escapeHtml(question.id)}">
            <div class="admin-card__topline">
              <span class="chip">${escapeHtml(question.category || '미분류')}</span>
              <span class="status-pill ${answered ? 'is-answered' : 'is-pending'}">${escapeHtml(question.status || '신규')}</span>
            </div>
            <h3>${escapeHtml(question.name || '방문자')}</h3>
            <p class="admin-card__question">${escapeHtml(excerptText(question.question, 150))}</p>
            <dl class="admin-card__facts">
              <div>
                <dt>연락</dt>
                <dd>${escapeHtml(contactMap[question.contactType] || '연락처')} · ${escapeHtml(question.contactValue || '-')}</dd>
              </div>
              <div>
                <dt>언어</dt>
                <dd>${escapeHtml(languageMap[question.language] || question.language || '기타')}</dd>
              </div>
              <div>
                <dt>등록</dt>
                <dd>${escapeHtml(date)}</dd>
              </div>
            </dl>
            <div class="admin-card__note">${answered ? '아카이브로 보관된 답변 완료 문의입니다.' : '빠른 대응이 필요한 신규 문의입니다.'}</div>
          </div>
          <div class="admin-card__actions">
            <button class="button button--secondary" type="button" data-action="open-question" data-question-id="${escapeHtml(question.id)}">상세 보기</button>
            <button class="button" type="button" data-action="answer-question" data-question-id="${escapeHtml(question.id)}">${answered ? '답변 수정' : '답변하기'}</button>
          </div>
        </article>
      `;
    })
    .join('');
}

function getSelectedQuestion() {
  if (!store || !selectedQuestionId) {
    return null;
  }

  return store.getQuestions().find((question) => question.id === selectedQuestionId) || null;
}

function renderModal(question) {
  if (!modal || !question) {
    return;
  }

  const answered = isAnswered(question);
  selectedQuestionId = question.id;

  if (modalCategory) {
    modalCategory.textContent = question.category || '미분류';
  }

  if (modalStatus) {
    modalStatus.className = `status-pill ${answered ? 'is-answered' : 'is-pending'}`;
    modalStatus.textContent = question.status || '신규';
  }

  if (modalTitle) {
    modalTitle.textContent = question.name || '방문자';
  }

  if (modalMeta) {
    modalMeta.textContent = `${formatDateTime(question.createdAt)} · ${contactMap[question.contactType] || '연락처'} · ${languageMap[question.language] || question.language || '기타'}`;
  }

  if (modalQuestion) {
    modalQuestion.textContent = question.question || '질문 내용이 없습니다.';
  }

  if (modalContactType) {
    modalContactType.textContent = contactMap[question.contactType] || '연락처';
  }

  if (modalContactValue) {
    modalContactValue.textContent = question.contactValue || '-';
  }

  if (modalLanguage) {
    modalLanguage.textContent = languageMap[question.language] || question.language || '기타';
  }

  if (modalCreatedAt) {
    modalCreatedAt.textContent = formatDateTime(question.createdAt);
  }

  if (modalReply) {
    modalReply.value = question.answer || '';
  }

  if (modalOpenChannelButton) {
    modalOpenChannelButton.disabled = !modalReply || !modalReply.value.trim();
  }
}

function openQuestionModal(questionId, focusReply = false) {
  if (!modal || !store) {
    return;
  }

  const question = store.getQuestions().find((item) => item.id === questionId);
  if (!question) {
    return;
  }

  renderModal(question);
  modal.hidden = false;
  modal.classList.add('is-open');
  document.body.classList.add('modal-open');

  if (focusReply && modalReply) {
    window.setTimeout(() => modalReply.focus(), 0);
  }
}

function closeQuestionModal() {
  if (!modal) {
    return;
  }

  modal.hidden = true;
  modal.classList.remove('is-open');
  document.body.classList.remove('modal-open');
  selectedQuestionId = null;
}

function openReplyChannel(question, replyText) {
  if (!replyText) {
    return false;
  }

  if (question.contactType === 'email') {
    const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(question.contactValue)}&subject=${encodeURIComponent('Question Singapore 답변')}&body=${encodeURIComponent(replyText)}&cc=${encodeURIComponent(ADMIN_EMAIL)}`;
    window.open(outlookUrl, '_blank', 'noopener');
    window.alert(`Hotmail 작성창이 열렸습니다. ${ADMIN_EMAIL} 계정으로 로그인되어 있는지 확인해주세요.`);
    return true;
  }

  const phone = (question.contactValue || '').replace(/[^0-9]/g, '');
  const waAppUrl = `whatsapp://send?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(replyText)}`;
  const waWebUrl = `https://web.whatsapp.com/send?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(replyText)}`;
  window.open(waAppUrl, '_blank', 'noopener');
  window.setTimeout(() => {
    if (document.hasFocus()) {
      window.open(waWebUrl, '_blank', 'noopener');
    }
  }, 900);
  window.alert(`WhatsApp 앱으로 먼저 연결을 시도합니다. 열리지 않으면 Web WhatsApp으로 전환됩니다. +${ADMIN_WHATSAPP_NUMBER} 번호 계정으로 로그인되어 있는지 확인해주세요.`);
  return true;
}

function sendModalReply() {
  const question = getSelectedQuestion();
  if (!question || !modalReply) {
    return;
  }

  const reply = modalReply.value.trim();
  if (!reply) {
    window.alert('답변 내용을 입력해주세요.');
    return;
  }

  const updated = store.updateQuestion(question.id, { answer: reply, status: '답변완료' });
  if (updated) {
    openReplyChannel(updated, reply);
    renderDashboard();
    renderQuestions();
    closeQuestionModal();
  }
}

if (list) {
  list.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-action]');
    if (!trigger) {
      return;
    }

    const questionId = trigger.getAttribute('data-question-id');
    if (!questionId) {
      return;
    }

    openQuestionModal(questionId, trigger.dataset.action === 'answer-question');
  });

  list.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    const surface = event.target.closest('[data-action="open-question"]');
    if (!surface) {
      return;
    }

    event.preventDefault();
    const questionId = surface.getAttribute('data-question-id');
    if (questionId) {
      openQuestionModal(questionId, false);
    }
  });
}

if (searchInput) {
  searchInput.addEventListener('input', () => {
    searchTerm = normalizeText(searchInput.value);
    renderQuestions();
  });
}

if (statusFilterSelect) {
  statusFilterSelect.addEventListener('change', () => {
    statusFilter = statusFilterSelect.value;
    renderQuestions();
  });
}

if (categoryFilterSelect) {
  categoryFilterSelect.addEventListener('change', () => {
    categoryFilter = categoryFilterSelect.value;
    renderQuestions();
  });
}

if (sortFilterSelect) {
  sortFilterSelect.addEventListener('change', () => {
    sortOrder = sortFilterSelect.value;
    renderQuestions();
  });
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    tabButtons.forEach((tab) => {
      tab.classList.toggle('is-active', tab === button);
    });
    setActiveTab(button.dataset.view || 'recent');
  });
});

if (modalReply) {
  modalReply.addEventListener('input', () => {
    if (modalOpenChannelButton) {
      modalOpenChannelButton.disabled = !modalReply.value.trim();
    }
  });
}

if (modalSendButton) {
  modalSendButton.addEventListener('click', sendModalReply);
}

if (modalOpenChannelButton) {
  modalOpenChannelButton.addEventListener('click', () => {
    const question = getSelectedQuestion();
    if (!question || !modalReply) {
      return;
    }

    const reply = modalReply.value.trim();
    if (!reply) {
      window.alert('먼저 답변 내용을 입력해주세요.');
      return;
    }

    openReplyChannel(question, reply);
  });
}

if (adminBannerApplyButton) {
  adminBannerApplyButton.addEventListener('click', () => {
    const imageUrl = adminBannerUrlInput ? adminBannerUrlInput.value.trim() : '';
    if (!imageUrl) {
      window.alert('배너 이미지 URL을 입력해주세요.');
      return;
    }

    saveAdminBannerImage(imageUrl);
  });
}

if (adminBannerFileInput) {
  adminBannerFileInput.addEventListener('change', () => {
    const file = adminBannerFileInput.files && adminBannerFileInput.files[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      window.alert('이미지 파일만 업로드할 수 있습니다.');
      adminBannerFileInput.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        saveAdminBannerImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  });
}

if (adminBannerResetButton) {
  adminBannerResetButton.addEventListener('click', () => {
    saveAdminBannerImage('');
  });
}

if (homeVideoApplyButton) {
  homeVideoApplyButton.addEventListener('click', () => {
    const videoUrl = homeVideoUrlInput ? homeVideoUrlInput.value.trim() : '';
    if (!videoUrl) {
      window.alert('소개 영상 URL을 입력해주세요.');
      return;
    }

    clearHomeVideoBlob().catch(() => {});
    saveHomeVideo(videoUrl);
  });
}

if (homeVideoFileInput) {
  homeVideoFileInput.addEventListener('change', () => {
    const file = homeVideoFileInput.files && homeVideoFileInput.files[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('video/')) {
      window.alert('영상 파일만 업로드할 수 있습니다.');
      homeVideoFileInput.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    updateHomeVideoSizeInfo(objectUrl);

    clearHomeVideoBlob().catch(() => {});
    window.localStorage.removeItem(HOME_TOP_VIDEO_STORAGE_KEY);

    saveHomeVideoBlob(file)
      .then(() => {
        if (homeVideoUrlInput) {
          homeVideoUrlInput.value = '';
        }
      })
      .catch((error) => {
        console.error('Video blob save failed:', error);
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            saveHomeVideo(reader.result);
          }
        };
        reader.readAsDataURL(file);
      });
  });
}

if (homeVideoResetButton) {
  homeVideoResetButton.addEventListener('click', () => {
    clearHomeVideoBlob().catch(() => {});
    saveHomeVideo('');
  });
}

modalCloseTargets.forEach((target) => {
  target.addEventListener('click', closeQuestionModal);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal && !modal.hidden) {
    closeQuestionModal();
  }
});

if (clearButton) {
  clearButton.addEventListener('click', () => {
    const confirmed = window.confirm('모든 질문을 삭제하시겠습니까?');
    if (!confirmed) {
      return;
    }

    store.clearQuestions();
    selectedQuestionId = null;
    populateCategoryFilter(store.getQuestions());
    syncFilterControls();
    closeQuestionModal();
    renderQuestions();
    renderDashboard();
  });
}

const initialQuestions = store ? store.getQuestions() : [];
populateCategoryFilter(initialQuestions);
syncFilterControls();
renderQuestions();
renderDashboard();
initAdminBannerImage();
initHomeVideoSettings();
