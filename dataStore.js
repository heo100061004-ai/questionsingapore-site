const STORAGE_KEY = 'question-singapore-questions';
const EXPERT_STORAGE_KEY = 'question-singapore-experts';

const DEFAULT_QUESTIONS = [
  {
    id: 'sample-1',
    name: '전문가',
    category: '고용',
    question: '싱가포르에서 IT 분야로 이직할 때 가장 중요한 준비는 무엇인가요?',
    answer: '현지 채용 시장에서는 프로젝트 경험과 커뮤니케이션 능력을 함께 보여주는 것이 중요합니다.',
    contactType: 'email',
    contactValue: 'consult@questionsingapore.com',
    language: 'ko',
    status: '답변완료',
    createdAt: '2026-07-09T09:00:00.000Z'
  },
  {
    id: 'sample-2',
    name: '전문가',
    category: '부동산',
    question: '1인 가구가 살기 좋은 지역은 어디가 좋을까요?',
    answer: '교통 접근성과 생활비의 균형을 보면 조용한 지역이 더 적합합니다.',
    contactType: 'whatsapp',
    contactValue: '+6591234567',
    language: 'en',
    status: '답변완료',
    createdAt: '2026-07-09T09:15:00.000Z'
  }
];

const DEFAULT_EXPERTS = [
  {
    id: 'expert-1',
    name: 'Kim HR Advisory',
    contact: 'hello@questionsingapore.com',
    category: '고용',
    services: '취업 전략, 인터뷰 코칭, 이직 플랜',
    notes: '영어/한국어 상담 가능',
    createdAt: '2026-07-10T09:00:00.000Z'
  },
  {
    id: 'expert-2',
    name: 'SG Housing Desk',
    contact: '+65 9221 8254',
    category: '부동산',
    services: '주거지 선택, 임대 계약 체크, 입주 준비',
    notes: 'WhatsApp 우선',
    createdAt: '2026-07-10T09:05:00.000Z'
  },
  {
    id: 'expert-3',
    name: 'Relocation Onboarding Team',
    contact: 'relocation@questionsingapore.com',
    category: '리로케이션',
    services: '초기 정착 체크리스트, 생활 인프라 세팅',
    notes: '가족 동반 이주 대응',
    createdAt: '2026-07-10T09:10:00.000Z'
  }
];

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  return null;
}

function getQuestions(storage = getStorage()) {
  if (storage) {
    const raw = storage.getItem(STORAGE_KEY);

    if (!raw) {
      saveQuestions(DEFAULT_QUESTIONS, storage);
      return [...DEFAULT_QUESTIONS];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [...DEFAULT_QUESTIONS];
    } catch (error) {
      return [...DEFAULT_QUESTIONS];
    }
  }

  if (typeof window !== 'undefined' && window.__questionSingaporeQuestions) {
    return [...window.__questionSingaporeQuestions];
  }

  return [...DEFAULT_QUESTIONS];
}

function saveQuestions(questions, storage = getStorage()) {
  const normalized = Array.isArray(questions) ? questions : [];

  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  if (typeof window !== 'undefined') {
    window.__questionSingaporeQuestions = normalized;
  }

  return normalized;
}

function addQuestion({ name, category, question, contactType, contactValue, language }, storage = getStorage()) {
  const entry = {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name || '방문자',
    category: category || '미분류',
    question: question || '',
    answer: '',
    contactType: contactType || 'email',
    contactValue: contactValue || '',
    language: language || 'ko',
    status: '신규',
    createdAt: new Date().toISOString()
  };

  const questions = [entry, ...getQuestions(storage)];
  saveQuestions(questions, storage);
  return entry;
}

function updateQuestion(id, updates, storage = getStorage()) {
  const questions = getQuestions(storage);
  const index = questions.findIndex((question) => question.id === id);

  if (index === -1) {
    return null;
  }

  const updated = {
    ...questions[index],
    ...updates
  };

  if (updates.answer && !updates.status) {
    updated.status = '답변완료';
  }

  questions[index] = updated;
  saveQuestions(questions, storage);
  return updated;
}

function clearQuestions(storage = getStorage()) {
  return saveQuestions([], storage);
}

function getExperts(storage = getStorage()) {
  if (storage) {
    const raw = storage.getItem(EXPERT_STORAGE_KEY);

    if (!raw) {
      saveExperts(DEFAULT_EXPERTS, storage);
      return [...DEFAULT_EXPERTS];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [...DEFAULT_EXPERTS];
    } catch (error) {
      return [...DEFAULT_EXPERTS];
    }
  }

  if (typeof window !== 'undefined' && window.__questionSingaporeExperts) {
    return [...window.__questionSingaporeExperts];
  }

  return [...DEFAULT_EXPERTS];
}

function saveExperts(experts, storage = getStorage()) {
  const normalized = Array.isArray(experts) ? experts : [];

  if (storage) {
    storage.setItem(EXPERT_STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  if (typeof window !== 'undefined') {
    window.__questionSingaporeExperts = normalized;
  }

  return normalized;
}

function addExpert({ name, contact, category, services, notes }, storage = getStorage()) {
  const entry = {
    id: `expert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: (name || '').trim(),
    contact: (contact || '').trim(),
    category: (category || '고용').trim(),
    services: (services || '').trim(),
    notes: (notes || '').trim(),
    createdAt: new Date().toISOString()
  };

  const experts = [entry, ...getExperts(storage)];
  saveExperts(experts, storage);
  return entry;
}

function removeExpert(id, storage = getStorage()) {
  const experts = getExperts(storage);
  const filtered = experts.filter((expert) => expert.id !== id);
  saveExperts(filtered, storage);
  return filtered.length !== experts.length;
}

const api = {
  STORAGE_KEY,
  EXPERT_STORAGE_KEY,
  DEFAULT_QUESTIONS,
  DEFAULT_EXPERTS,
  getQuestions,
  saveQuestions,
  addQuestion,
  updateQuestion,
  clearQuestions,
  getExperts,
  saveExperts,
  addExpert,
  removeExpert
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}

if (typeof window !== 'undefined') {
  window.QuestionSingaporeStore = api;
}
