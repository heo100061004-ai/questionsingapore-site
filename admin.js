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
const chatbotSummaryContainer = document.getElementById('analytics-chatbot-summary');
const chatbotTopContainer = document.getElementById('analytics-chatbot-top');
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
const modalChatSummary = document.getElementById('question-modal-chat-summary');
const modalChatHistory = document.getElementById('question-modal-chat-history');
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
const bannerSyncGuide = document.getElementById('banner-sync-guide');
const bannerSyncMessage = document.getElementById('banner-sync-message');
const bannerSyncCommand = document.getElementById('banner-sync-command');
const bannerSyncCopyButton = document.getElementById('banner-sync-copy');
const homeVideoUrlInput = document.getElementById('home-video-url');
const homeVideoApplyButton = document.getElementById('home-video-apply');
const homeVideoFileInput = document.getElementById('home-video-file');
const homeVideoResetButton = document.getElementById('home-video-reset');
const homeVideoSizeInfo = document.getElementById('home-video-size');
const videoSyncGuide = document.getElementById('video-sync-guide');
const videoSyncMessage = document.getElementById('video-sync-message');
const videoSyncCommand = document.getElementById('video-sync-command');
const videoSyncCopyButton = document.getElementById('video-sync-copy');
const sponsorAdminList = document.getElementById('sponsor-admin-list');
const sponsorSyncGuide = document.getElementById('sponsor-sync-guide');
const sponsorSyncMessage = document.getElementById('sponsor-sync-message');
const sponsorSyncCommand = document.getElementById('sponsor-sync-command');
const sponsorSyncCopyButton = document.getElementById('sponsor-sync-copy');
const sponsorSizeDesktop = document.getElementById('sponsor-size-desktop');
const sponsorSizeMobile = document.getElementById('sponsor-size-mobile');
const sponsorSizeLimit = document.getElementById('sponsor-size-limit');
const docSuggestRefreshButton = document.getElementById('doc-suggest-refresh');
const docSuggestCopyButton = document.getElementById('doc-suggest-copy');
const docSuggestRunButton = document.getElementById('doc-suggest-run');
const docSuggestStatus = document.getElementById('doc-suggest-status');
const docSuggestCommand = document.getElementById('doc-suggest-command');
const docSuggestList = document.getElementById('doc-suggest-list');
const expertForm = document.getElementById('expert-form');
const expertNameInput = document.getElementById('expert-name');
const expertSearchInput = document.getElementById('expert-search');
const expertContactInput = document.getElementById('expert-contact');
const expertCategoryInput = document.getElementById('expert-category');
const expertServicesInput = document.getElementById('expert-services');
const expertNotesInput = document.getElementById('expert-notes');
const expertFormMessage = document.getElementById('expert-form-message');
const expertList = document.getElementById('expert-list');
const rawDocUploadForm = document.getElementById('raw-doc-upload-form');
const rawDocFilesInput = document.getElementById('raw-doc-files');
const rawDocLanguageInput = document.getElementById('raw-doc-language');
const rawDocCategoryInput = document.getElementById('raw-doc-category');
const rawDocSourceInput = document.getElementById('raw-doc-source');
const rawDocUrlInput = document.getElementById('raw-doc-url');
const rawDocKeywordsInput = document.getElementById('raw-doc-keywords');
const rawDocUploadButton = document.getElementById('raw-doc-upload-button');
const rawDocUploadStatus = document.getElementById('raw-doc-upload-status');
const docArchiveToggleButton = document.getElementById('doc-archive-toggle');
const docArchiveRefreshButton = document.getElementById('doc-archive-refresh');
const docArchivePanel = document.getElementById('doc-archive-panel');
const docArchiveStatus = document.getElementById('doc-archive-status');
const docArchiveList = document.getElementById('doc-archive-list');
const modalExperts = document.getElementById('question-modal-experts');
const store = window.QuestionSingaporeStore;
const ADMIN_EMAIL = 'hello@questionsingapore.com';
const ADMIN_WHATSAPP_NUMBER = '6592218254';
const ADMIN_BANNER_STORAGE_KEY = 'question-singapore-admin-banner-url';
const ADMIN_DEFAULT_BANNER_URL = 'hero-bg.svg';
const BANNER_CONFIG_PATH = '/config/banner.json';
const HOME_TOP_VIDEO_STORAGE_KEY = 'question-singapore-home-top-video-url';
const HOME_MEDIA_DB_NAME = 'question-singapore-media-db';
const HOME_MEDIA_DB_VERSION = 1;
const HOME_MEDIA_STORE_NAME = 'media';
const HOME_TOP_VIDEO_BLOB_KEY = 'home-top-video';
const SPONSOR_CONFIG_PATH = '/config/sponsors.json';

let currentView = 'recent';
let searchTerm = '';
let statusFilter = 'pending';
let categoryFilter = 'all';
let sortOrder = 'latest';
let selectedQuestionId = null;
let docSuggestions = [];
let docArchiveOpen = false;
let expertSearchTerm = '';
const expandedExpertIds = new Set();

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

function normalizeExpertCategory(value) {
  const text = normalizeText(value);
  if (text.includes('recruitment') || text.includes('employment') || text.includes('고용')) {
    return 'employment';
  }
  if (text.includes('property') || text.includes('부동산')) {
    return 'property';
  }
  if (text.includes('relocation') || text.includes('리로케이션')) {
    return 'relocation';
  }
  return 'employment';
}

function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIndex = result.indexOf(',');
      const base64 = commaIndex >= 0 ? result.slice(commaIndex + 1) : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function getAdminApiHeaders() {
  const token = window.localStorage.getItem('question-singapore-admin-api-token') || '';
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['x-admin-token'] = token;
  }
  return headers;
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

function buildConfigSyncCommand(configPath, value, commitMessage) {
  const payload = JSON.stringify({ url: value || '' }, null, 2);
  return [
    `cat > ${configPath} <<'EOF'`,
    payload,
    'EOF',
    '',
    `git add ${configPath} && git commit -m "${commitMessage}" && git push`
  ].join('\n');
}

function showSyncGuide(kind, message, command) {
  const isBanner = kind === 'banner';
  const guide = isBanner ? bannerSyncGuide : videoSyncGuide;
  const text = isBanner ? bannerSyncMessage : videoSyncMessage;
  const area = isBanner ? bannerSyncCommand : videoSyncCommand;

  if (!guide || !text || !area) {
    return;
  }

  text.textContent = message;
  area.value = command;
  guide.hidden = false;
}

function initSyncGuides() {
  [
    [bannerSyncGuide, bannerSyncMessage, bannerSyncCommand],
    [videoSyncGuide, videoSyncMessage, videoSyncCommand],
    [sponsorSyncGuide, sponsorSyncMessage, sponsorSyncCommand]
  ].forEach(([guide, text, area]) => {
    if (text) {
      text.textContent = '';
    }
    if (area) {
      area.value = '';
    }
    if (guide) {
      guide.hidden = true;
    }
  });
}

function buildJsonSyncCommand(configPath, payload, commitMessage) {
  return [
    `cat > ${configPath} <<'EOF'`,
    JSON.stringify(payload, null, 2),
    'EOF',
    '',
    `git add ${configPath} && git commit -m "${commitMessage}" && git push`
  ].join('\n');
}

function formatDateInputValue(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw.slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function estimateSponsorImageSize(card) {
  if (!card) {
    return;
  }

  const preview = card.querySelector('.sponsor-admin-card__preview img');
  const meta = card.querySelector('[data-role="sponsor-image-meta"]');
  if (!preview || !meta) {
    return;
  }

  const update = () => {
    if (preview.naturalWidth && preview.naturalHeight) {
      meta.textContent = `이미지 크기 ${preview.naturalWidth} x ${preview.naturalHeight}px`;
    } else {
      meta.textContent = '이미지 크기 확인 중';
    }
  };

  preview.addEventListener('load', update, { once: true });
  update();
}

function showSponsorSyncGuide(message, payload) {
  if (!sponsorSyncGuide || !sponsorSyncMessage || !sponsorSyncCommand) {
    return;
  }

  sponsorSyncMessage.textContent = message;
  sponsorSyncCommand.value = buildJsonSyncCommand('config/sponsors.json', payload, 'Update sponsor slots');
  sponsorSyncGuide.hidden = false;
}

function parseSponsorFormData(container, item) {
  const imageUrl = container.querySelector('[data-field="imageUrl"]')?.value.trim() || item.imageUrl || '';
  const rawLink = container.querySelector('[data-field="linkUrl"]')?.value.trim() || '';
  const startDate = container.querySelector('[data-field="startDate"]')?.value || '';
  const endDate = container.querySelector('[data-field="endDate"]')?.value || '';
  const active = container.querySelector('[data-field="active"]')?.checked !== false;
  const linkUrl = rawLink || '#';
  return {
    ...item,
    imageUrl,
    linkUrl,
    startDate: startDate || '',
    endDate: endDate || '',
    active
  };
}

function renderSponsorAdmin() {
  if (!sponsorAdminList || !store || typeof store.getSponsors !== 'function') {
    return;
  }

  const payload = store.getSponsors();
  const categories = Array.isArray(payload.categories) ? payload.categories : [];
  const guideline = payload.meta && payload.meta.bannerGuideline ? payload.meta.bannerGuideline : null;

  if (guideline) {
    if (sponsorSizeDesktop) sponsorSizeDesktop.textContent = guideline.recommendedDesktop || '-';
    if (sponsorSizeMobile) sponsorSizeMobile.textContent = guideline.recommendedMobile || '-';
    if (sponsorSizeLimit) sponsorSizeLimit.textContent = `${guideline.maxFileSizeMb || '-'}MB`;
  }

  sponsorAdminList.innerHTML = categories.map((category) => {
    const cards = (Array.isArray(category.items) ? category.items : []).map((item) => `
      <article class="sponsor-admin-card" data-category-id="${escapeHtml(category.id || '')}" data-item-id="${escapeHtml(item.id || '')}">
        <div class="sponsor-admin-card__preview"><img src="${escapeHtml(item.imageUrl || '')}" alt="${escapeHtml(category.label || '배너')} 샘플" /></div>
        <div class="sponsor-admin-card__fields">
          <label><span>배너 이미지 경로 또는 Data URL</span><input data-field="imageUrl" type="text" placeholder="assets/sponsors/sample.svg" value="${escapeHtml(item.imageUrl || '')}" /></label>
          <label><span>배너 이미지 파일 업로드</span><input data-action="upload-sponsor-image" type="file" accept="image/*" /></label>
          <label><span>클릭 이동 링크 URL</span><input data-field="linkUrl" type="url" placeholder="https://advertiser.example" value="${escapeHtml(item.linkUrl || '')}" /></label>
          <div class="sponsor-admin-card__meta">
            <label><span>광고 시작일</span><input data-field="startDate" type="date" value="${escapeHtml(formatDateInputValue(item.startDate || ''))}" /></label>
            <label><span>광고 종료일</span><input data-field="endDate" type="date" value="${escapeHtml(formatDateInputValue(item.endDate || ''))}" /></label>
          </div>
          <label><span><input data-field="active" type="checkbox" ${item.active === false ? '' : 'checked'} /> 현재 슬롯 활성화</span></label>
          <p class="home-media-box__meta" data-role="sponsor-image-meta">이미지 크기 확인 중</p>
        </div>
        <div class="sponsor-admin-card__actions">
          <button class="button button--secondary" type="button" data-action="save-sponsor">슬롯 저장</button>
        </div>
      </article>
    `).join('');

    return `
      <section class="sponsor-admin-category" data-category-id="${escapeHtml(category.id || '')}">
        <div class="sponsor-admin-category__head">
          <h3>${escapeHtml(category.label || '')}</h3>
          <span class="chip">${Array.isArray(category.items) ? category.items.length : 0}개 슬롯</span>
        </div>
        <div class="sponsor-admin-grid">${cards}</div>
      </section>
    `;
  }).join('');

  Array.from(sponsorAdminList.querySelectorAll('.sponsor-admin-card')).forEach(estimateSponsorImageSize);
}

function saveSponsorSlot(categoryId, itemId, card) {
  if (!store || typeof store.getSponsors !== 'function' || typeof store.saveSponsors !== 'function') {
    return;
  }

  const payload = store.getSponsors();
  const categories = Array.isArray(payload.categories) ? payload.categories : [];
  const nextCategories = categories.map((category) => {
    if (category.id !== categoryId) {
      return category;
    }
    return {
      ...category,
      items: (Array.isArray(category.items) ? category.items : []).map((item) => {
        if (item.id !== itemId) {
          return item;
        }
        return parseSponsorFormData(card, item);
      })
    };
  });

  const nextPayload = {
    ...payload,
    meta: {
      ...(payload.meta || {}),
      updatedAt: new Date().toISOString()
    },
    categories: nextCategories
  };

  store.saveSponsors(nextPayload);
  showSponsorSyncGuide('로컬 추천 서비스 배너가 저장되었습니다. 모든 기기에 반영하려면 아래 명령을 실행하세요.', nextPayload);
  renderSponsorAdmin();
}

async function initSponsorsAdmin() {
  if (!store || typeof store.saveSponsors !== 'function') {
    return;
  }

  try {
    const response = await fetch(SPONSOR_CONFIG_PATH);
    if (response.ok) {
      const data = await response.json();
      store.saveSponsors(data);
    }
  } catch (error) {
    console.warn('Config 파일에서 스폰서 설정을 불러오지 못했습니다:', error);
  }

  renderSponsorAdmin();
}

async function copyCommandToClipboard(command, button) {
  if (!command) {
    return;
  }

  const original = button ? button.textContent : '';
  try {
    await navigator.clipboard.writeText(command);
    if (button) {
      button.textContent = '복사 완료';
      window.setTimeout(() => {
        button.textContent = original;
      }, 1200);
    }
  } catch (error) {
    console.warn('Clipboard copy failed:', error);
    window.alert('자동 복사에 실패했습니다. 아래 명령어를 직접 복사해 실행해주세요.');
  }
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
    const clearCommand = buildConfigSyncCommand('config/banner.json', '', 'Clear banner image');
    console.log('모든 기기 배너를 초기화하려면 터미널에서 실행:\n' + clearCommand);
    showSyncGuide('banner', '로컬 배너가 초기화되었습니다. 모든 기기에 반영하려면 아래 명령을 실행하세요.', clearCommand);
    return;
  }

  window.localStorage.setItem(ADMIN_BANNER_STORAGE_KEY, imageUrl);
  setAdminBannerImage(imageUrl);

  const syncCommand = buildConfigSyncCommand('config/banner.json', imageUrl, 'Update banner image URL');
  console.log('모든 기기 배너 동기화를 위해 터미널에서 실행:\n' + syncCommand);
  showSyncGuide('banner', '로컬 배너가 저장되었습니다. 모든 기기에 반영하려면 아래 명령을 실행하세요.', syncCommand);
}

async function initAdminBannerImage() {
  if (!adminBanner) {
    return;
  }

  try {
    const response = await fetch(BANNER_CONFIG_PATH);
    if (response.ok) {
      const data = await response.json();
      const sharedUrl = (data && data.url ? String(data.url) : '').trim();
      if (sharedUrl) {
        window.localStorage.setItem(ADMIN_BANNER_STORAGE_KEY, sharedUrl);
        setAdminBannerImage(sharedUrl);
        return;
      }
    }
  } catch (error) {
    console.warn('Config 파일에서 배너를 불러오지 못했습니다:', error);
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

async function saveHomeVideo(url) {
  const videoUrl = (url || '').trim();

  if (!videoUrl) {
    window.localStorage.removeItem(HOME_TOP_VIDEO_STORAGE_KEY);
    setHomeVideo('');
    const command = buildConfigSyncCommand('config/video.json', '', 'Clear home video');
    console.log('모든 기기에서 영상을 제거하려면 터미널에서 다음을 실행하세요:\\n' + command);
    showSyncGuide('video', '로컬 영상이 초기화되었습니다. 모든 기기에 반영하려면 아래 명령을 실행하세요.', command);
    return;
  }

  // 1. 로컬 localStorage에 저장 (현재 기기에서 즉시 표시)
  window.localStorage.setItem(HOME_TOP_VIDEO_STORAGE_KEY, videoUrl);
  setHomeVideo(videoUrl);

  // 2. 모든 기기에 적용하기 위한 명령어 제시
  const command = buildConfigSyncCommand('config/video.json', videoUrl, 'Update home video URL');
  
  console.log('모든 기기에 적용하기 위해 터미널에서 다음을 실행하세요:\\n' + command);
  showSyncGuide('video', '로컬 영상이 저장되었습니다. 모든 기기에 반영하려면 아래 명령을 실행하세요.', command);
}

async function initHomeVideoSettings() {
  try {
    // 1. 먼저 config 파일에서 로드
    const response = await fetch('/config/video.json');
    if (response.ok) {
      const data = await response.json();
      if (data && data.url) {
        window.localStorage.setItem(HOME_TOP_VIDEO_STORAGE_KEY, data.url);
        setHomeVideo(data.url);
        return;
      }
    }
  } catch (error) {
    console.warn('Config 파일에서 영상 설정을 불러오지 못했습니다:', error);
  }

  // 2. config 파일 로드 실패 시, localStorage 사용
  const savedUrl = window.localStorage.getItem(HOME_TOP_VIDEO_STORAGE_KEY);
  setHomeVideo(savedUrl || '');
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

function getSelectedSuggestionFiles() {
  if (!docSuggestList) {
    return [];
  }

  const selected = Array.from(docSuggestList.querySelectorAll('input[type="checkbox"][data-doc-file]:checked'));
  return [...new Set(selected.map((node) => String(node.getAttribute('data-doc-file') || '').trim()).filter(Boolean))];
}

function updateSuggestionCommand() {
  if (!docSuggestCommand) {
    return;
  }

  const files = getSelectedSuggestionFiles();
  const commandBase = 'node tools/sync-doc-index-to-faq.js';
  if (!files.length) {
    docSuggestCommand.value = `${commandBase} --dry-run`;
    return;
  }

  docSuggestCommand.value = `${commandBase} --files ${files.join(',')}`;
}

async function runDocSuggestionSync() {
  if (!docSuggestRunButton || !docSuggestStatus) {
    return;
  }

  const files = getSelectedSuggestionFiles();
  if (!files.length) {
    window.alert('먼저 승인할 문서 제안을 1개 이상 선택해주세요.');
    return;
  }

  const originalText = docSuggestRunButton.textContent;
  docSuggestRunButton.disabled = true;
  docSuggestRunButton.textContent = '반영 실행 중...';
  docSuggestStatus.textContent = `선택 ${files.length}개 문서를 FAQ DB에 반영 중...`;

  try {
    const response = await fetch('/api/doc-sync-run', {
      method: 'POST',
      headers: getAdminApiHeaders(),
      body: JSON.stringify({
        files,
        threshold: 0.72,
        dryRun: false,
        syncLocales: true
      })
    });

    const data = await response.json();
    if (!response.ok || !data || !data.ok) {
      throw new Error((data && data.message) || `Failed: ${response.status}`);
    }

    const summary = data.summary || {};
    const inserted = Array.isArray(summary.inserted) ? summary.inserted.length : 0;
    const skipped = Array.isArray(summary.skipped) ? summary.skipped.length : 0;
    const localized = Array.isArray(summary.localizedInserted) ? summary.localizedInserted.length : 0;

    docSuggestStatus.textContent = `반영 완료: 신규 ${inserted}개, 중복 스킵 ${skipped}개, 다국어 동기화 ${localized}개`;
    await fetchDocSuggestions();
  } catch (error) {
    docSuggestStatus.textContent = '자동 반영에 실패했습니다. API 권한/배포 환경을 확인해주세요.';
    window.alert(`자동 반영 실패: ${error.message || 'unknown error'}`);
  } finally {
    docSuggestRunButton.disabled = false;
    docSuggestRunButton.textContent = originalText;
  }
}

function renderDocSuggestions() {
  if (!docSuggestList || !docSuggestStatus) {
    return;
  }

  if (!docSuggestions.length) {
    docSuggestStatus.textContent = '승인 대기 제안이 없습니다.';
    docSuggestList.innerHTML = '<p class="empty-state">문서 제안 데이터가 없습니다.</p>';
    updateSuggestionCommand();
    return;
  }

  const pending = docSuggestions.filter((item) => !item.duplicate);
  docSuggestStatus.textContent = `총 ${docSuggestions.length}개 제안 중 승인 후보 ${pending.length}개`;

  docSuggestList.innerHTML = docSuggestions
    .slice(0, 120)
    .map((item) => {
      const pendingClass = item.duplicate ? 'is-duplicate' : 'is-pending';
      const duplicateLabel = item.duplicate
        ? `중복(${item.duplicateType || 'similar'}${item.duplicateScore ? ` ${item.duplicateScore}` : ''})`
        : '승인 가능';

      return `
        <label class="doc-suggest-item ${pendingClass}">
          <input type="checkbox" data-doc-file="${escapeHtml(item.file || '')}" ${item.duplicate ? 'disabled' : 'checked'} />
          <div class="doc-suggest-item__body">
            <p class="doc-suggest-item__title">${escapeHtml(item.title || item.file || 'Untitled')}</p>
            <p class="doc-suggest-item__meta">${escapeHtml(item.domain || 'unknown')} · ${escapeHtml(item.file || '')} · ${escapeHtml(duplicateLabel)}</p>
            <p class="doc-suggest-item__question">${escapeHtml(item.question || '')}</p>
          </div>
        </label>
      `;
    })
    .join('');

  updateSuggestionCommand();
}

async function fetchDocSuggestions() {
  if (!docSuggestStatus) {
    return;
  }

  docSuggestStatus.textContent = '문서 제안을 불러오는 중...';

  try {
    const response = await fetch('/api/doc-suggestions?threshold=0.72&limit=500');
    if (!response.ok) {
      throw new Error(`Failed: ${response.status}`);
    }

    const data = await response.json();
    docSuggestions = Array.isArray(data && data.items) ? data.items : [];
    renderDocSuggestions();
  } catch (error) {
    docSuggestions = [];
    if (docSuggestList) {
      docSuggestList.innerHTML = '<p class="empty-state">제안을 불러오지 못했습니다.</p>';
    }
    docSuggestStatus.textContent = '문서 제안을 불러오지 못했습니다. 배포/API 상태를 확인해주세요.';
    updateSuggestionCommand();
  }
}

function renderExperts() {
  if (!expertList || !store || typeof store.getExperts !== 'function') {
    return;
  }

  const experts = store.getExperts().filter((expert) => {
    if (!expertSearchTerm) {
      return true;
    }

    const haystack = [expert.name, expert.contact, expert.category, expert.services, expert.notes]
      .map(normalizeText)
      .join(' ');
    return haystack.includes(expertSearchTerm);
  });

  if (!experts.length) {
    expertList.innerHTML = '<p class="empty-state">등록된 전문가가 없습니다.</p>';
    return;
  }

  expertList.innerHTML = experts
    .map((expert) => {
      return `
        <article class="expert-item" data-expert-id="${escapeHtml(expert.id || '')}">
          <div class="expert-item__topline">
            <span class="chip">${escapeHtml(expert.category || '기타')}</span>
            <div class="expert-item__actions">
              <button class="button button--secondary" type="button" data-action="toggle-expert" data-expert-id="${escapeHtml(expert.id || '')}">${expandedExpertIds.has(expert.id) ? '접기' : '보기'}</button>
              <button class="button button--secondary" type="button" data-action="remove-expert" data-expert-id="${escapeHtml(expert.id || '')}">삭제</button>
            </div>
          </div>
          <h3>${escapeHtml(expert.name || '-')}</h3>
          <p class="expert-item__line"><strong>주요 서비스:</strong> ${escapeHtml(expert.services || '-')}</p>
          <div class="expert-item__details" ${expandedExpertIds.has(expert.id) ? '' : 'hidden'}>
            <p class="expert-item__line"><strong>연락처:</strong> ${escapeHtml(expert.contact || '-')}</p>
            <p class="expert-item__line"><strong>메모:</strong> ${escapeHtml(expert.notes || '-')}</p>
            <p class="expert-item__line"><strong>등록일:</strong> ${escapeHtml(formatDateTime(expert.createdAt))}</p>
          </div>
        </article>
      `;
    })
    .join('');
}

function toggleExpertDetails(expertId) {
  if (!expertId) {
    return;
  }

  if (expandedExpertIds.has(expertId)) {
    expandedExpertIds.delete(expertId);
  } else {
    expandedExpertIds.add(expertId);
  }
  renderExperts();
}

function renderDocArchiveItems(items) {
  if (!docArchiveList) {
    return;
  }

  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    docArchiveList.innerHTML = '<p class="empty-state">기록된 업데이트 이력이 없습니다.</p>';
    return;
  }

  docArchiveList.innerHTML = list
    .map((item) => {
      const files = Array.isArray(item.files) ? item.files : [];
      const inserted = Array.isArray(item.inserted) ? item.inserted : [];
      const titleCandidates = inserted
        .map((entry) => entry && (entry.title || entry.question || entry.file || entry.sourceQuestion))
        .filter(Boolean);
      const previewItems = (titleCandidates.length ? titleCandidates : files).slice(0, 4);
      const filePreview = previewItems.join(', ');
      const fileTail = (titleCandidates.length ? titleCandidates.length : files.length) > 4
        ? ` 외 ${(titleCandidates.length ? titleCandidates.length : files.length) - 4}개`
        : '';

      return `
        <article class="doc-archive-item">
          <div class="doc-archive-item__head">
            <strong>${escapeHtml(formatDateTime(item.createdAt))}</strong>
            <span class="chip">${escapeHtml(item.trigger || 'system')}</span>
          </div>
          <p class="doc-archive-item__meta">업데이트 문서 ${Number(item.fileCount || files.length || 0)}개 · 신규 ${Number(item.insertedCount || 0)}개 · 중복 스킵 ${Number(item.skippedCount || 0)}개 · 다국어 ${Number(item.localizedCount || 0)}개</p>
          <p class="doc-archive-item__files">${escapeHtml(filePreview || '-')} ${escapeHtml(fileTail)}</p>
        </article>
      `;
    })
    .join('');
}

async function renderChatbotAnalytics() {
  if (!chatbotSummaryContainer || !chatbotTopContainer) {
    return;
  }

  chatbotSummaryContainer.innerHTML = '<p class="empty-state">챗봇 통계를 불러오는 중...</p>';
  chatbotTopContainer.innerHTML = '';

  try {
    const [logsResponse, keywordResponse] = await Promise.all([
      fetch('/api/chatbot-logs?limit=120'),
      fetch('/api/chatbot-keywords?limit=20')
    ]);

    const logsData = logsResponse.ok ? await logsResponse.json() : { items: [] };
    const keywordData = keywordResponse.ok ? await keywordResponse.json() : { items: [] };
    const logs = Array.isArray(logsData.items) ? logsData.items : [];
    const keywords = Array.isArray(keywordData.items) ? keywordData.items.slice(0, 6) : [];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayLogs = logs.filter((item) => new Date(item.createdAt) >= todayStart).length;
    const formCount = store && typeof store.getQuestions === 'function' ? store.getQuestions().length : 0;
    const conversionRate = logs.length ? Math.round((formCount / logs.length) * 100) : 0;

    chatbotSummaryContainer.innerHTML = `
      <div class="analytics-row analytics-row--chart">
        <div class="analytics-row__head"><span>최근 챗봇 대화</span><strong>${logs.length}</strong></div>
        <div class="analytics-bar" aria-hidden="true"><span style="width:${Math.max(12, Math.min(100, logs.length))}%"></span></div>
      </div>
      <div class="analytics-row analytics-row--chart">
        <div class="analytics-row__head"><span>오늘 챗봇 유입</span><strong>${todayLogs}</strong></div>
        <div class="analytics-bar" aria-hidden="true"><span style="width:${Math.max(12, Math.min(100, todayLogs * 10 || 12))}%"></span></div>
      </div>
      <div class="analytics-row analytics-row--chart">
        <div class="analytics-row__head"><span>상담폼 전환률</span><strong>${conversionRate}%</strong></div>
        <div class="analytics-bar" aria-hidden="true"><span style="width:${Math.max(12, conversionRate)}%"></span></div>
      </div>
    `;

    if (!keywords.length) {
      chatbotTopContainer.innerHTML = '<p class="empty-state">표시할 주요 질문 로그가 없습니다.</p>';
      return;
    }

    chatbotTopContainer.innerHTML = `<h4>자주 들어온 챗봇 질문</h4>${formatMetricRows(keywords.map((item) => [item.question || 'Untitled', item.count || 0]))}`;
  } catch (error) {
    chatbotSummaryContainer.innerHTML = '<p class="empty-state">챗봇 통계를 불러오지 못했습니다.</p>';
    chatbotTopContainer.innerHTML = '';
  }
}

async function fetchDocArchive() {
  if (!docArchiveStatus) {
    return;
  }

  docArchiveStatus.textContent = '아카이브를 불러오는 중...';

  try {
    const response = await fetch('/api/doc-archive?limit=120', {
      headers: getAdminApiHeaders()
    });

    const data = await response.json();
    if (!response.ok || !data || !data.ok) {
      throw new Error((data && data.message) || `Failed: ${response.status}`);
    }

    const items = Array.isArray(data.items) ? data.items : [];
    const total = Number(data.total || items.length || 0);
    docArchiveStatus.textContent = `총 ${total}건 업데이트 이력`; 
    renderDocArchiveItems(items);
  } catch (error) {
    docArchiveStatus.textContent = '아카이브를 불러오지 못했습니다.';
    if (docArchiveList) {
      docArchiveList.innerHTML = '<p class="empty-state">아카이브 조회 실패</p>';
    }
  }
}

function setDocArchiveOpen(nextOpen) {
  docArchiveOpen = Boolean(nextOpen);
  if (docArchivePanel) {
    docArchivePanel.hidden = !docArchiveOpen;
  }
  if (docArchiveRefreshButton) {
    docArchiveRefreshButton.hidden = !docArchiveOpen;
  }
  if (docArchiveToggleButton) {
    docArchiveToggleButton.textContent = docArchiveOpen ? '아카이브 닫기' : '아카이브 보기';
    docArchiveToggleButton.setAttribute('aria-expanded', docArchiveOpen ? 'true' : 'false');
  }

  if (docArchiveOpen) {
    fetchDocArchive();
  }
}

function addExpertFromForm() {
  if (!expertForm || !store || typeof store.addExpert !== 'function') {
    return;
  }

  const name = (expertNameInput && expertNameInput.value ? expertNameInput.value : '').trim();
  const contact = (expertContactInput && expertContactInput.value ? expertContactInput.value : '').trim();
  const category = (expertCategoryInput && expertCategoryInput.value ? expertCategoryInput.value : '고용').trim();
  const services = (expertServicesInput && expertServicesInput.value ? expertServicesInput.value : '').trim();
  const notes = (expertNotesInput && expertNotesInput.value ? expertNotesInput.value : '').trim();

  if (!name || !contact || !services) {
    if (expertFormMessage) {
      expertFormMessage.textContent = '이름, 연락처, 주요 서비스는 필수입니다.';
    }
    return;
  }

  store.addExpert({ name, contact, category, services, notes });
  if (expertFormMessage) {
    expertFormMessage.textContent = '전문가가 등록되었습니다.';
  }

  expertForm.reset();
  if (expertCategoryInput) {
    expertCategoryInput.value = '고용';
  }
  renderExperts();
}

function removeExpert(expertId) {
  if (!expertId || !store || typeof store.removeExpert !== 'function') {
    return;
  }

  const confirmed = window.confirm('해당 전문가를 삭제하시겠습니까?');
  if (!confirmed) {
    return;
  }

  store.removeExpert(expertId);
  if (expertFormMessage) {
    expertFormMessage.textContent = '전문가가 삭제되었습니다.';
  }
  renderExperts();
}

async function uploadRawDocs() {
  if (!rawDocFilesInput || !rawDocUploadStatus) {
    return;
  }

  const files = Array.from(rawDocFilesInput.files || []);
  if (!files.length) {
    rawDocUploadStatus.textContent = '업로드할 파일을 선택해주세요.';
    return;
  }

  const language = rawDocLanguageInput ? rawDocLanguageInput.value : 'en';
  const category = rawDocCategoryInput ? rawDocCategoryInput.value : 'employment';
  const source = rawDocSourceInput ? rawDocSourceInput.value.trim() : '';
  const url = rawDocUrlInput ? rawDocUrlInput.value.trim() : '';
  const keywords = rawDocKeywordsInput
    ? rawDocKeywordsInput.value.split(',').map((item) => item.trim()).filter(Boolean)
    : [];

  if (rawDocUploadButton) {
    rawDocUploadButton.disabled = true;
  }
  rawDocUploadStatus.textContent = `파일 ${files.length}개 인코딩 및 업로드 중...`;

  try {
    const encodedFiles = await Promise.all(
      files.map(async (file) => {
        const base64 = await convertFileToBase64(file);
        return {
          fileName: file.name,
          contentBase64: base64,
          title: file.name,
          language,
          category,
          source,
          url,
          keywords
        };
      })
    );

    const response = await fetch('/api/raw-doc-upload', {
      method: 'POST',
      headers: getAdminApiHeaders(),
      body: JSON.stringify({ files: encodedFiles })
    });

    const data = await response.json();
    if (!response.ok || !data || !data.ok) {
      throw new Error((data && data.message) || `Failed: ${response.status}`);
    }

    const ingest = data.autoIngest && data.autoIngest.summary ? data.autoIngest.summary : null;
    const inserted = ingest && Number.isFinite(Number(ingest.insertedCount)) ? Number(ingest.insertedCount) : 0;
    const skipped = ingest && Number.isFinite(Number(ingest.skippedCount)) ? Number(ingest.skippedCount) : 0;
    const localized = ingest && Number.isFinite(Number(ingest.localizedCount)) ? Number(ingest.localizedCount) : 0;
    const targetFolders = Array.isArray(data.targetFolders) ? data.targetFolders.join(', ') : '';

    rawDocUploadStatus.textContent = `업로드 완료: ${data.savedCount || encodedFiles.length}개 저장 / 자동반영 신규 ${inserted}개, 중복 스킵 ${skipped}개, 다국어 ${localized}개${targetFolders ? ` / 저장 폴더 ${targetFolders}` : ''}`;
    if (rawDocUploadForm) {
      rawDocUploadForm.reset();
    }
    if (docArchiveOpen) {
      await fetchDocArchive();
    }
  } catch (error) {
    rawDocUploadStatus.textContent = `업로드 실패: ${error.message || 'unknown error'}`;
  } finally {
    if (rawDocUploadButton) {
      rawDocUploadButton.disabled = false;
    }
  }
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

  renderChatbotAnalytics();
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

  if (modalChatSummary) {
    modalChatSummary.textContent = (question.chatSummary || '').trim() || '연결된 챗봇 대화가 없습니다.';
  }

  if (modalChatHistory) {
    const history = Array.isArray(question.chatHistory) ? question.chatHistory.slice(-6) : [];
    if (!history.length) {
      modalChatHistory.innerHTML = '';
    } else {
      modalChatHistory.innerHTML = history.map((item) => {
        const role = String(item && item.role ? item.role : '').toLowerCase() === 'assistant' ? 'AI' : 'User';
        const text = escapeHtml(item && item.text ? item.text : '');
        return `<p class="question-modal__history-item"><strong>${role}</strong> ${text}</p>`;
      }).join('');
    }
  }

  if (modalReply) {
    modalReply.value = question.answer || '';
  }

  if (modalOpenChannelButton) {
    modalOpenChannelButton.disabled = !modalReply || !modalReply.value.trim();
  }

  renderModalExpertSuggestions(question);
}

function buildExpertInsertTemplate(expert) {
  return [
    `[추천 전문가] ${expert.name || '-'}`,
    `- 카테고리: ${expert.category || '-'}`,
    `- 연락처: ${expert.contact || '-'}`,
    `- 주요 서비스: ${expert.services || '-'}`,
    expert.notes ? `- 메모: ${expert.notes}` : ''
  ].filter(Boolean).join('\n');
}

function renderModalExpertSuggestions(question) {
  if (!modalExperts || !store || typeof store.getExperts !== 'function' || !question) {
    return;
  }

  const questionCategory = normalizeExpertCategory(question.category || '');
  const experts = store.getExperts();
  const matched = experts.filter((expert) => normalizeExpertCategory(expert.category || '') === questionCategory).slice(0, 3);

  if (!matched.length) {
    modalExperts.innerHTML = '<p class="question-modal__experts-empty">이 카테고리에 등록된 추천 전문가가 없습니다.</p>';
    return;
  }

  modalExperts.innerHTML = matched
    .map((expert) => {
      return `
        <div class="question-modal__expert-item">
          <p><strong>${escapeHtml(expert.name || '-')}</strong> · ${escapeHtml(expert.services || '-')}</p>
          <button class="button button--secondary" type="button" data-action="insert-expert" data-expert-id="${escapeHtml(expert.id || '')}">답변에 삽입</button>
        </div>
      `;
    })
    .join('');
}

function insertExpertIntoReply(expertId) {
  if (!expertId || !store || typeof store.getExperts !== 'function' || !modalReply) {
    return;
  }

  const expert = store.getExperts().find((item) => item.id === expertId);
  if (!expert) {
    return;
  }

  const template = buildExpertInsertTemplate(expert);
  const current = modalReply.value.trim();
  modalReply.value = current ? `${current}\n\n${template}` : template;

  if (modalOpenChannelButton) {
    modalOpenChannelButton.disabled = !modalReply.value.trim();
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

async function sendModalReply() {
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
    try {
      await fetch('/api/knowledge-event', {
        method: 'POST',
        headers: getAdminApiHeaders(),
        body: JSON.stringify({
          eventType: 'answered',
          payload: {
            question: updated.question || '',
            answer: reply,
            category: updated.category || '',
            language: updated.language || 'ko',
            internalCategory: 'Admin Reply'
          }
        })
      });
    } catch (error) {
      console.warn('Failed to sync answered Q&A to knowledge DB:', error);
    }

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

if (bannerSyncCopyButton) {
  bannerSyncCopyButton.addEventListener('click', () => {
    const command = bannerSyncCommand ? bannerSyncCommand.value : '';
    copyCommandToClipboard(command, bannerSyncCopyButton);
  });
}

if (videoSyncCopyButton) {
  videoSyncCopyButton.addEventListener('click', () => {
    const command = videoSyncCommand ? videoSyncCommand.value : '';
    copyCommandToClipboard(command, videoSyncCopyButton);
  });
}

if (sponsorSyncCopyButton) {
  sponsorSyncCopyButton.addEventListener('click', () => {
    const command = sponsorSyncCommand ? sponsorSyncCommand.value : '';
    copyCommandToClipboard(command, sponsorSyncCopyButton);
  });
}

if (docSuggestRefreshButton) {
  docSuggestRefreshButton.addEventListener('click', () => {
    fetchDocSuggestions();
  });
}

if (docSuggestCopyButton) {
  docSuggestCopyButton.addEventListener('click', () => {
    const command = docSuggestCommand ? docSuggestCommand.value : '';
    copyCommandToClipboard(command, docSuggestCopyButton);
  });
}

if (docSuggestRunButton) {
  docSuggestRunButton.addEventListener('click', () => {
    runDocSuggestionSync();
  });
}

if (docSuggestList) {
  docSuggestList.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    if (target.type === 'checkbox') {
      updateSuggestionCommand();
    }
  });
}

if (docArchiveToggleButton) {
  docArchiveToggleButton.addEventListener('click', () => {
    setDocArchiveOpen(!docArchiveOpen);
  });
}

if (docArchiveRefreshButton) {
  docArchiveRefreshButton.addEventListener('click', () => {
    fetchDocArchive();
  });
}

if (expertForm) {
  expertForm.addEventListener('submit', (event) => {
    event.preventDefault();
    addExpertFromForm();
  });
}

if (expertList) {
  expertList.addEventListener('click', (event) => {
    const toggleTrigger = event.target.closest('[data-action="toggle-expert"]');
    if (toggleTrigger) {
      const expertId = toggleTrigger.getAttribute('data-expert-id') || '';
      toggleExpertDetails(expertId);
      return;
    }

    const trigger = event.target.closest('[data-action="remove-expert"]');
    if (!trigger) {
      return;
    }
    const expertId = trigger.getAttribute('data-expert-id') || '';
    removeExpert(expertId);
  });
}

if (expertSearchInput) {
  expertSearchInput.addEventListener('input', () => {
    expertSearchTerm = normalizeText(expertSearchInput.value);
    renderExperts();
  });
}

if (sponsorAdminList) {
  sponsorAdminList.addEventListener('change', (event) => {
    const trigger = event.target;
    if (!(trigger instanceof HTMLInputElement) || trigger.getAttribute('data-action') !== 'upload-sponsor-image') {
      return;
    }

    const card = trigger.closest('[data-item-id]');
    const file = trigger.files && trigger.files[0];
    if (!card || !file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      window.alert('이미지 파일만 업로드할 수 있습니다.');
      trigger.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return;
      }

      const imageField = card.querySelector('[data-field="imageUrl"]');
      const preview = card.querySelector('.sponsor-admin-card__preview img');
      if (imageField) {
        imageField.value = reader.result;
      }
      if (preview) {
        preview.src = reader.result;
      }
      estimateSponsorImageSize(card);
    };
    reader.readAsDataURL(file);
  });

  sponsorAdminList.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-action="save-sponsor"]');
    if (!trigger) {
      return;
    }
    const card = trigger.closest('[data-item-id]');
    if (!card) {
      return;
    }
    saveSponsorSlot(card.getAttribute('data-category-id') || '', card.getAttribute('data-item-id') || '', card);
  });
}

if (rawDocUploadForm) {
  rawDocUploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await uploadRawDocs();
  });
}

if (modalExperts) {
  modalExperts.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-action="insert-expert"]');
    if (!trigger) {
      return;
    }
    const expertId = trigger.getAttribute('data-expert-id') || '';
    insertExpertIntoReply(expertId);
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
initSyncGuides();
renderQuestions();
renderDashboard();
initAdminBannerImage();
initHomeVideoSettings();
initSponsorsAdmin();
renderExperts();
