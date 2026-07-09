const form = document.getElementById('question-form');
const message = document.getElementById('form-message');
const recentQuestionsList = document.getElementById('recent-questions');
const languageSelect = document.getElementById('language-select');
const contactTypeSelect = document.getElementById('contact-type');
const contactEmailGroup = document.getElementById('contact-email-group');
const contactValueInput = document.getElementById('contact-value');
const whatsappFields = document.getElementById('whatsapp-fields');
const countryCodeInput = document.getElementById('country-code');
const phoneNumberInput = document.getElementById('phone-number');
const store = window.QuestionSingaporeStore;

const translations = {
  ko: {
    heroEyebrow: 'Singapore Advisory Studio',
    heroTitle: '싱가포르 현지 전문가와 함께하는 신뢰할 수 있는 정보 가이드',
    heroText: '취업 · 부동산 · 리로케이션까지 현지 라이선스를 보유한 전문가에게 안전하게 문의하세요.',
    heroPoint1: '✔ 모든 상담은 비공개로 진행됩니다.',
    heroPoint2: '✔ 답변은 등록하신 연락처로 개별 안내드립니다.',
    heroPoint3: '✔ 필요 시 검증된 현지 전문가 네트워크를 연결해 드립니다.',
    btnQuestion: '질문하기',
    btnAdmin: '관리자',
    heroInfo1: '연락처: 이메일 또는 WhatsApp',
    heroInfo2: '언어: 한국어 / English / 中文',
    heroInfo3: '빠른 상담 신청으로 전문가 답변을 바로 받아보세요.',
    heroFlowTitle: '상담 흐름',
    heroFlow1: '질문과 연락처를 등록합니다.',
    heroFlow2: '관리자가 답변을 준비합니다.',
    heroFlow3: '이메일 또는 WhatsApp으로 바로 회신합니다.',
    heroFlow4: '언어별 맞춤 안내를 제공합니다.',
    categoriesCaption: '핵심 카테고리',
    categoriesTitle: '가장 많이 묻는 3가지 주제',
    catEmpTitle: '고용',
    catEmpDesc: '직무, 비자, 기업 문화, 이직 전략까지 현실적인 조언을 확인하세요.',
    catEmp1: '채용 시장과 커리어 전략',
    catEmp2: '이력서와 인터뷰 준비',
    catEmp3: '워킹 비자 정보',
    catRealtyTitle: '부동산',
    catRealtyDesc: '주거지 선택, 임대 조건, 구매 비용을 미리 이해할 수 있습니다.',
    catRealty1: '지역별 생활비 비교',
    catRealty2: '계약서 체크 포인트',
    catRealty3: '투자 관점의 매물 선택',
    catRelocTitle: '리로케이션',
    catRelocDesc: '이사 준비부터 정착까지 필요한 기본 정보를 단계별로 안내합니다.',
    catReloc1: '거주지 정하기',
    catReloc2: '교통과 학교 정보',
    catReloc3: '생활 적응 팁',
    answerCaption: '실전 질문과 답변',
    answerTitle: '전문가가 답해주는 대표 사례',
    qa1Q: 'Q. 싱가포르에서 IT 직무로 이직하려면 무엇이 가장 중요하나요?',
    qa1A: 'A. 현지 채용 시장에서는 실무 경험과 함께 커뮤니케이션 능력이 중요합니다. 특히 프로젝트 사례와 결과를 숫자로 보여줄 수 있다면 강점이 됩니다.',
    qa2Q: 'Q. 1인 가구로 거주할 때 어떤 지역이 좋을까요?',
    qa2A: 'A. 교통 접근성과 생활비의 균형을 보면, 조용한 주거 지역이 좋습니다. 이동 시간이 길어지지 않도록 지하철 접근성을 먼저 확인하세요.',
    qa3Q: 'Q. 리로케이션 시 꼭 준비해야 할 항목이 있나요?',
    qa3A: 'A. 의료, 통신, 교통, 은행 계좌 개설 순서로 준비하면 훨씬 수월합니다. 초기 2주 동안 필요한 기본 서비스부터 정리하는 것이 좋습니다.',
    askCaption: '문의 신청',
    askTitle: '답변이 필요한 상황을 알려주세요',
    nameLabel: '이름',
    categoryLabel: '카테고리',
    selectOption: '선택해주세요',
    categoryEmployment: '고용',
    categoryRealty: '부동산',
    categoryRelocation: '리로케이션',
    contactTypeLabel: '연락 방식',
    contactEmail: '이메일',
    contactWhatsapp: '핸드폰(WhatsApp)',
    emailPlaceholder: '이메일 주소',
    countryCodeLabel: '국가번호',
    countryCodePlaceholder: '+65',
    phoneNumberLabel: '핸드폰 번호',
    phoneNumberPlaceholder: '92218254',
    contactValueLabel: '연락처',
    languageLabel: '언어',
    languageKo: '한국어',
    languageEn: 'English',
    languageZh: '中文',
    questionLabel: '질문 내용',
    btnSubmit: '질문 등록',
    consultTitle: '전문가 상담 프로세스',
    consult1: '문의 내용을 등록하면 관리자에게 즉시 전달됩니다.',
    consult2: '관리자가 답변을 준비한 뒤 이메일 또는 WhatsApp으로 회신합니다.',
    consult3: '언어 설정에 따라 한국어·영어·중국어로 안내를 받을 수 있습니다.',
    processTitle: '전문가 상담 프로세스',
    process1: '문의 내용을 등록하면 관리자에게 즉시 전달됩니다.',
    process2: '관리자가 답변을 준비한 뒤 이메일 또는 WhatsApp으로 회신합니다.',
    process3: '언어 설정에 따라 한국어·영어·중국어로 안내를 받을 수 있습니다.',
    recentCaption: '최근 접수된 질문',
    recentTitle: '이 사이트에 남겨진 최신 문의',
    alertIncomplete: '질문 내용과 연락처를 모두 입력해주세요.',
    alertSuccess: '님의 질문이 접수되었습니다. 관리자 페이지에서 답변을 준비해 바로 보내드릴 수 있습니다.',
    thankYou: '님, 문의가 접수되었습니다.'
  },
  en: {
    heroEyebrow: 'Singapore Advisory Studio',
    heroTitle: 'A trusted guide with Singapore local experts',
    heroText: 'From employment to real estate and relocation, ask safely to licensed local experts.',
    heroPoint1: '✔ All consultations are handled privately.',
    heroPoint2: '✔ Answers are delivered individually to your registered contact.',
    heroPoint3: '✔ When needed, we connect you with a verified local expert network.',
    btnQuestion: 'Ask a Question',
    btnAdmin: '관리자',
    heroInfo1: 'Contact: Email or WhatsApp',
    heroInfo2: 'Language: Korean / English / Chinese',
    heroInfo3: 'Submit your inquiry and receive expert guidance quickly.',
    heroFlowTitle: 'Consultation Flow',
    heroFlow1: 'Submit your question and contact details.',
    heroFlow2: 'An admin prepares the response.',
    heroFlow3: 'You receive a direct reply by email or WhatsApp.',
    heroFlow4: 'Guidance is provided in your selected language.',
    categoriesCaption: 'Core Categories',
    categoriesTitle: 'Top 3 Most Asked Topics',
    catEmpTitle: 'Employment',
    catEmpDesc: 'Get practical guidance on jobs, visas, workplace culture, and career moves.',
    catEmp1: 'Hiring market and career strategy',
    catEmp2: 'Resume and interview preparation',
    catEmp3: 'Work visa information',
    catRealtyTitle: 'Real Estate',
    catRealtyDesc: 'Understand location choices, rental terms, and purchase costs in advance.',
    catRealty1: 'Cost of living by area',
    catRealty2: 'Lease contract checkpoints',
    catRealty3: 'Property selection from an investment view',
    catRelocTitle: 'Relocation',
    catRelocDesc: 'Follow step-by-step essentials from moving preparation to local settlement.',
    catReloc1: 'Choosing where to live',
    catReloc2: 'Transport and school information',
    catReloc3: 'Daily life adaptation tips',
    answerCaption: 'Expert Q&A',
    answerTitle: 'Representative cases answered by experts',
    qa1Q: 'Q. What is most important when moving into an IT role in Singapore?',
    qa1A: 'A. In the local hiring market, practical experience and communication skills matter most. Showing project outcomes with measurable numbers is a major strength.',
    qa2Q: 'Q. Which area is suitable for a single-person household?',
    qa2A: 'A. A quiet residential area with balanced transport access and living cost is usually best. Check MRT accessibility first to avoid long commute times.',
    qa3Q: 'Q. What should I prepare first for relocation?',
    qa3A: 'A. It is smoother if you prepare in this order: healthcare, telecom, transport, and bank account setup. Focus on essential services for your first two weeks.',
    askCaption: 'Inquiry Submission',
    askTitle: 'Tell us your situation for a tailored answer',
    nameLabel: 'Name',
    categoryLabel: 'Category',
    selectOption: 'Please select',
    categoryEmployment: 'Employment',
    categoryRealty: 'Real Estate',
    categoryRelocation: 'Relocation',
    contactTypeLabel: 'Contact Method',
    contactEmail: 'Email',
    contactWhatsapp: 'Phone (WhatsApp)',
    emailPlaceholder: 'Email address',
    countryCodeLabel: 'Country Code',
    countryCodePlaceholder: '+65',
    phoneNumberLabel: 'Phone Number',
    phoneNumberPlaceholder: '92218254',
    contactValueLabel: 'Contact',
    languageLabel: 'Language',
    questionLabel: 'Question',
    btnSubmit: 'Submit Inquiry',
    consultTitle: 'Expert Consultation Process',
    consult1: 'Your inquiry is sent to the admin immediately.',
    consult2: 'The admin prepares a reply and sends it by email or WhatsApp.',
    consult3: 'You receive guidance in Korean, English, or Chinese based on your language choice.',
    processTitle: 'Consultation Process',
    process1: 'Your inquiry is sent to the admin immediately.',
    process2: 'The admin prepares a reply and sends it by email or WhatsApp.',
    process3: 'You will receive guidance in Korean, English, or Chinese based on your language choice.',
    recentCaption: 'Recent Questions',
    recentTitle: 'Latest inquiries submitted here',
    alertIncomplete: 'Please fill in both the question and contact information.',
    alertSuccess: 'Your inquiry has been received. The admin will prepare a reply and send it shortly.',
    thankYou: 'Your inquiry has been received.'
  },
  zh: {
    heroEyebrow: '新加坡咨询工作室',
    heroTitle: '由新加坡本地专家陪伴的可信信息指南',
    heroText: '涵盖就业、房产与搬迁，安全地向持牌本地专家咨询。',
    heroPoint1: '✔ 所有咨询均为非公开私密进行。',
    heroPoint2: '✔ 回复将发送至您登记的联系方式。',
    heroPoint3: '✔ 如有需要，我们将为您连接经过验证的本地专家网络。',
    btnQuestion: '提问',
    btnAdmin: '관리자',
    heroInfo1: '联系方式：电子邮件或WhatsApp',
    heroInfo2: '语言：韩语 / 英语 / 中文',
    heroInfo3: '提交咨询，快速获得专家指导。',
    heroFlowTitle: '咨询流程',
    heroFlow1: '提交您的问题和联系方式。',
    heroFlow2: '管理员准备答复。',
    heroFlow3: '通过电子邮件或WhatsApp向您直接回复。',
    heroFlow4: '按您选择的语言提供个性化说明。',
    categoriesCaption: '核心分类',
    categoriesTitle: '最常被咨询的 3 个主题',
    catEmpTitle: '就业',
    catEmpDesc: '获取关于岗位、签证、企业文化与跳槽策略的实用建议。',
    catEmp1: '招聘市场与职业策略',
    catEmp2: '简历与面试准备',
    catEmp3: '工作签证信息',
    catRealtyTitle: '房地产',
    catRealtyDesc: '提前了解居住区域选择、租赁条件与购房成本。',
    catRealty1: '各区域生活成本对比',
    catRealty2: '合同审查要点',
    catRealty3: '从投资视角选择房源',
    catRelocTitle: '搬迁',
    catRelocDesc: '从搬家准备到落地安顿，按步骤掌握关键基础信息。',
    catReloc1: '确定居住区域',
    catReloc2: '交通与学校信息',
    catReloc3: '生活适应建议',
    answerCaption: '专家问答',
    answerTitle: '专家为您解答典型案例',
    qa1Q: 'Q. 在新加坡转职 IT 岗位时，最重要的是什么？',
    qa1A: 'A. 在本地招聘市场中，实务经验与沟通能力都很关键。若能用量化结果展示项目成果，会更具竞争力。',
    qa2Q: 'Q. 一人居住的话，适合选择哪些区域？',
    qa2A: 'A. 建议优先选择交通便利且生活成本平衡、相对安静的居住区。请先确认地铁可达性，避免通勤过长。',
    qa3Q: 'Q. 搬迁时必须优先准备哪些事项？',
    qa3A: 'A. 按照医疗、通信、交通、银行开户的顺序准备会更顺利。建议先整理前两周必须用到的基础服务。',
    askCaption: '提交咨询',
    askTitle: '告诉我们您的情况以获得定制答案',
    nameLabel: '姓名',
    categoryLabel: '分类',
    selectOption: '请选择',
    categoryEmployment: '就业',
    categoryRealty: '房地产',
    categoryRelocation: '搬迁',
    contactTypeLabel: '联系方式',
    contactEmail: '电子邮件',
    contactWhatsapp: '手机（WhatsApp）',
    emailPlaceholder: '电子邮件地址',
    countryCodeLabel: '国家区号',
    countryCodePlaceholder: '+65',
    phoneNumberLabel: '手机号码',
    phoneNumberPlaceholder: '92218254',
    contactValueLabel: '联系方式',
    languageLabel: '语言',
    questionLabel: '问题内容',
    btnSubmit: '提交咨询',
    consultTitle: '专家咨询流程',
    consult1: '您的咨询会立即发送给管理员。',
    consult2: '管理员准备回复后通过电子邮件或WhatsApp发送。',
    consult3: '根据您的语言选择，您将收到韩语、英语或中文指导。',
    processTitle: '专家咨询流程',
    process1: '您的咨询会立即发送给管理员。',
    process2: '管理员准备回复后通过电子邮件或WhatsApp发送。',
    process3: '根据您的语言选择，您将收到韩语、英语或中文指导。',
    recentCaption: '最新咨询',
    recentTitle: '本网站提交的最新咨询',
    alertIncomplete: '请填写问题内容和联系方式。',
    alertSuccess: '您的咨询已收到。管理员将尽快准备回复。',
    thankYou: '您的咨询已收到。'
  }
};

const languageMap = {
  ko: '한국어',
  en: 'English',
  zh: '中文'
};

const contactMap = {
  email: 'Email',
  whatsapp: 'WhatsApp'
};

function updateLanguage(lang) {
  const translation = translations[lang] || translations.ko;

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n;
    if (key && translation[key]) {
      element.textContent = translation[key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    if (key && translation[key]) {
      element.placeholder = translation[key];
    }
  });
}

function updateContactFields() {
  if (!contactTypeSelect || !contactEmailGroup || !contactValueInput || !whatsappFields || !countryCodeInput || !phoneNumberInput) {
    return;
  }

  const isWhatsapp = contactTypeSelect.value === 'whatsapp';
  contactEmailGroup.hidden = isWhatsapp;
  whatsappFields.hidden = !isWhatsapp;
  contactValueInput.required = !isWhatsapp;
  countryCodeInput.required = isWhatsapp;
  phoneNumberInput.required = isWhatsapp;
}

function formatPhoneByCountry(countryCode, digitsOnly) {
  const d = (digitsOnly || '').replace(/\D/g, '').slice(0, 12);
  if (!d) {
    return '';
  }

  const groupsByCountry = {
    '+65': [4, 4],
    '+82': [3, 4, 4],
    '+86': [3, 4, 4],
    '+66': [3, 3, 4],
    '+84': [3, 3, 4],
    '+62': [3, 4, 4],
    '+60': [2, 4, 4],
    '+81': [2, 4, 4],
    '+63': [3, 3, 4],
    '+1': [3, 3, 4],
    '+44': [4, 3, 4],
    '+61': [3, 3, 3]
  };

  const groups = groupsByCountry[countryCode] || [3, 3, 4];
  const parts = [];
  let cursor = 0;

  for (const size of groups) {
    if (cursor >= d.length) {
      break;
    }
    parts.push(d.slice(cursor, cursor + size));
    cursor += size;
  }

  if (cursor < d.length) {
    parts.push(d.slice(cursor));
  }

  return parts.join('-');
}

function applyPhoneMask() {
  if (!countryCodeInput || !phoneNumberInput) {
    return;
  }

  const rawDigits = phoneNumberInput.value.replace(/\D/g, '');
  phoneNumberInput.value = formatPhoneByCountry(countryCodeInput.value, rawDigits);
}

function renderRecentQuestions() {
  if (!recentQuestionsList || !store) {
    return;
  }

  const questions = store.getQuestions().slice(0, 5);

  if (!questions.length) {
    recentQuestionsList.innerHTML = '<p class="empty-state">아직 저장된 질문이 없습니다.</p>';
    return;
  }

  recentQuestionsList.innerHTML = questions
    .map((question) => {
      const date = new Date(question.createdAt).toLocaleString('ko-KR');
      const answerText = question.answer ? question.answer : '관리자가 답변을 준비 중입니다.';
      return `
        <article class="recent-question">
          <div class="recent-question__meta">
            <span class="chip">${question.category}</span>
            <span>${date}</span>
          </div>
          <h3>${question.name}</h3>
          <p><strong>Q.</strong> ${question.question}</p>
          <p><strong>Contact:</strong> ${contactMap[question.contactType] || 'Contact'} · ${question.contactValue || '-'}</p>
          <p><strong>Language:</strong> ${languageMap[question.language] || question.language}</p>
          <p><strong>A.</strong> ${answerText}</p>
        </article>
      `;
    })
    .join('');
}

if (languageSelect) {
  languageSelect.addEventListener('change', () => {
    updateLanguage(languageSelect.value);
  });
}

if (contactTypeSelect) {
  contactTypeSelect.addEventListener('change', updateContactFields);
}

if (phoneNumberInput) {
  phoneNumberInput.addEventListener('input', applyPhoneMask);
}

if (countryCodeInput) {
  countryCodeInput.addEventListener('change', applyPhoneMask);
}

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = formData.get('name')?.toString().trim() || 'Visitor';
    const category = formData.get('category')?.toString() || 'General';
    const question = formData.get('question')?.toString().trim() || '';
    const contactType = formData.get('contactType')?.toString() || 'email';
    const emailContact = formData.get('contactValue')?.toString().trim() || '';
    const countryCode = formData.get('countryCode')?.toString().trim() || '';
    const phoneNumber = formData.get('phoneNumber')?.toString().trim() || '';
    const language = languageSelect?.value || 'ko';
    let contactValue = emailContact;

    if (contactType === 'whatsapp') {
      const normalizedCode = countryCode.startsWith('+') ? countryCode : `+${countryCode.replace(/[^0-9]/g, '')}`;
      const normalizedNumber = phoneNumber.replace(/[^0-9]/g, '');
      contactValue = `${normalizedCode}${normalizedNumber}`;
    }

    const translation = translations[language] || translations.ko;

    if (!question || !contactValue) {
      message.textContent = translation.alertIncomplete;
      return;
    }

    if (store) {
      store.addQuestion({ name, category, question, contactType, contactValue, language });
    }

    message.textContent = translation.alertSuccess;
    renderRecentQuestions();
    form.reset();
    updateContactFields();
  });
}

renderRecentQuestions();
updateLanguage('ko');
updateContactFields();
