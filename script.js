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
const homeTopVideo = document.getElementById('home-top-video');
const homeTopVideoSource = document.getElementById('home-top-video-source');
const homeTopVideoEmpty = document.getElementById('home-top-video-empty');
const homeVideoPlayButton = document.getElementById('home-video-play');
const chatbotForm = document.getElementById('chatbot-form');
const chatbotInput = document.getElementById('chatbot-input');
const chatbotMessages = document.getElementById('chatbot-messages');
const chatbotCategorySelect = document.getElementById('chatbot-category');
const chatbotQuickList = document.getElementById('chatbot-quick-list');
const askSection = document.getElementById('ask');
const socialLinkedinCard = document.getElementById('social-linkedin-card');
const socialWhatsappCard = document.getElementById('social-whatsapp-card');
const socialKakaoCard = document.getElementById('social-kakao-card');
const socialLinkedinQr = document.getElementById('social-linkedin-qr');
const socialWhatsappQr = document.getElementById('social-whatsapp-qr');
const socialKakaoQr = document.getElementById('social-kakao-qr');
const store = window.QuestionSingaporeStore;
const HOME_TOP_VIDEO_STORAGE_KEY = 'question-singapore-home-top-video-url';
const CHAT_FLOW_STATE_KEY = 'question-singapore-chat-flow-state';
const ADMIN_DEFAULT_BANNER_URL = 'hero-bg.svg';
const SOCIAL_LINKS = {
  linkedin: 'https://www.linkedin.com/company/question-singapore/',
  whatsapp: 'https://chat.whatsapp.com/DTdusHVhuP07h7RLjlR6Ot?s=cl&p=i&ilr=4',
  kakao: 'https://open.kakao.com/o/pbjE82ui'
};
const SPONSOR_FALLBACK_DATA = {
  meta: {
    bannerGuideline: {
      recommendedDesktop: '1200x320',
      recommendedMobile: '720x240',
      maxFileSizeMb: 2
    }
  },
  categories: []
};

const translations = {
  ko: {
    heroEyebrow: 'Singapore Advisory Studio',
    topHeaderTitle: '싱가포르 정보와 전문가 네트워크 안내',
    heroTitle: '신뢰할수 있는 싱가포르<br />정보와 전문가 네트워크',
    heroText: '취업 · 부동산 · 리로케이션까지 현지 라이선스를 보유한 전문가에게 안전하게 문의하세요.',
    heroPoint1: '✔ 모든 상담은 비공개로 진행됩니다.',
    heroPoint2: '✔ 답변은 등록하신 연락처로 개별 안내드립니다.',
    heroPoint3: '✔ 필요 시 검증된 현지 전문가 네트워크를 연결해 드립니다.',
    btnQuestion: '질문하기',
    btnAdmin: '관리자',
    heroInfo1: '연락처: 이메일 또는 WhatsApp',
    heroInfo2: '언어: 한국어 / English / 中文',
    heroInfo3: '빠른 상담 신청으로 전문가의 답변과 네트워크를 만들어 보세요.',
    heroFlowTitle: '서비스 이용 안내',
    heroFlow1: '일반 정보는 AI 스마트 안내를 이용해서 검색합니다.',
    heroFlow2: '전문가 상담 필요시 질문과 연락처를 입력합니다.',
    heroFlow3: '관리자와 이메일/와츠앱으로 추가 상담을 진행합니다.',
    homeVideoCta: '소개 영상 보기',
    homeVideoEmpty: '관리자에서 소개 영상을 설정하면 이 영역에 표시됩니다.',
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
    chatCaption: 'AI 스마트 안내',
    chatTitle: '문의 내용에 대한 정보를 실시간으로 확인할수 있습니다.',
    chatInputLabel: '챗봇 질문',
    chatCategoryLabel: '카테고리',
    categoryRecruitment: '채용/고용',
    chatInputPlaceholder: '예: Employment Pass 이직 준비 체크리스트 알려줘',
    chatSend: '보내기',
    chatTipTitle: '챗봇을 더 잘 쓰는 방법',
    chatTip1: '목적, 현재 상황, 기한을 함께 적어주시면 더 정확합니다.',
    chatTip2: '한 번에 한 가지 질문만 보내면 답변이 더 짧고 명확해집니다.',
    chatTip3: '정확한 판단이 필요하면 마지막에 상담폼으로 이어가면 좋습니다.',
    chatWelcome: '안녕하세요. Question Singapore AI 스마트 안내 서비스입니다. 문의 내용을 바탕으로 요약 정보를 제공하고, 필요하면 세부 안내로 이어질 수 있습니다.',
    chatStep1Title: '핵심 정보부터 빠르게 정리합니다.',
    chatStep1Text: 'FAQ와 등록 문서를 기준으로 실무에 필요한 포인트를 먼저 보여드립니다.',
    chatStep2Title: '상황에 맞는 다음 확인 항목을 안내합니다.',
    chatStep2Text: '문의 신청폼으로 세부 내용을 전달해 주시면 더 정확하게 이어서 안내해 드립니다.',
    chatStep3Title: '필요하면 전문가 상담으로 자연스럽게 이어집니다.',
    chatStep3Text: '원하실 경우 현지 전문가와 연결해 상담을 이어갈 수 있습니다.',
    chatError: '응답 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
    chatTyping: '답변을 준비 중입니다...',
    chatCta: '상담폼 접수',
    chatCtaA: '상담폼 접수',
    chatCtaB: '상담폼 접수',
    askCaption: '문의 신청',
    askTitle: '답변이 필요한 상황을 알려주세요',
    nameLabel: '이름',
    namePlaceholder: '이름',
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
    phoneNumberPlaceholder: '핸드폰 번호',
    contactValueLabel: '연락처',
    languageLabel: '언어',
    languageKo: '한국어',
    languageEn: 'English',
    languageZh: '中文',
    questionLabel: '질문 내용',
    questionPlaceholder: '문의하실 질문 내용을 상세히 기입해 주세요.',
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
    ,socialQrTitle: 'Community & Network'
    ,socialOpenLabel: '열기'
  },
  en: {
    heroEyebrow: 'Singapore Advisory Studio',
    topHeaderTitle: 'Singapore Information and Expert Network Guide',
    heroTitle: 'A trusted Singapore guide<br />with expert networks',
    heroText: 'From employment to real estate and relocation, ask safely to licensed local experts.',
    heroPoint1: '✔ All consultations are handled privately.',
    heroPoint2: '✔ Answers are delivered individually to your registered contact.',
    heroPoint3: '✔ When needed, we connect you with a verified local expert network.',
    btnQuestion: 'Ask a Question',
    btnAdmin: '관리자',
    heroInfo1: 'Contact: Email or WhatsApp',
    heroInfo2: 'Language: Korean / English / Chinese',
    heroInfo3: 'Submit your inquiry and receive expert guidance quickly.',
    heroFlowTitle: 'How To Use',
    heroFlow1: 'Use AI Smart Guide first to search general information.',
    heroFlow2: 'If expert help is needed, submit your question and contact details.',
    heroFlow3: 'Continue follow-up consultation with admin by email or WhatsApp.',
    homeVideoCta: 'View Intro Overview',
    homeVideoEmpty: 'This area displays the intro video once it is configured in Admin.',
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
    chatCaption: 'AI Smart Guide',
    chatTitle: 'You can check information about your inquiry in real time.',
    chatInputLabel: 'Chatbot question',
    chatCategoryLabel: 'Category',
    categoryRecruitment: 'Recruitment',
    chatInputPlaceholder: 'Example: Checklist for changing jobs on Employment Pass',
    chatSend: 'Send',
    chatTipTitle: 'How to get better answers',
    chatTip1: 'Add your goal, current situation, and timeline for a more precise reply.',
    chatTip2: 'Send one question at a time to keep the answer short and clear.',
    chatTip3: 'If you need a precise decision, move to the consultation form at the end.',
    chatWelcome: 'Hello. This is the Question Singapore AI Smart Guide. We provide summary information based on your inquiry, and can continue with more detail if needed.',
    chatStep1Title: 'We quickly organize the key information first.',
    chatStep1Text: 'We surface practical points based on FAQs and registered documents.',
    chatStep2Title: 'We guide the next checks for your situation.',
    chatStep2Text: 'If you send details through the inquiry form, we can guide you more precisely.',
    chatStep3Title: 'If needed, we continue naturally into expert consultation.',
    chatStep3Text: 'When desired, we can connect you with a local expert to continue the consultation.',
    chatError: 'Something went wrong while generating a response. Please try again shortly.',
    chatTyping: 'Preparing your answer...',
    chatCta: 'Request more guidance',
    chatCtaA: 'Request more guidance',
    chatCtaB: 'Leave an inquiry if needed',
    askCaption: 'Inquiry Submission',
    askTitle: 'Tell us your situation for a tailored answer',
    nameLabel: 'Name',
    namePlaceholder: 'Name',
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
    phoneNumberPlaceholder: 'Phone number',
    contactValueLabel: 'Contact',
    languageLabel: 'Language',
    questionLabel: 'Question',
    questionPlaceholder: 'Please provide your question in detail.',
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
    ,socialQrTitle: 'Community & Network'
    ,socialOpenLabel: 'Open'
  },
  zh: {
    heroEyebrow: '新加坡咨询工作室',
    topHeaderTitle: '新加坡信息与专家网络指南',
    heroTitle: '值得信赖的新加坡信息<br />与专家网络',
    heroText: '涵盖就业、房产与搬迁，安全地向持牌本地专家咨询。',
    heroPoint1: '✔ 所有咨询均为非公开私密进行。',
    heroPoint2: '✔ 回复将发送至您登记的联系方式。',
    heroPoint3: '✔ 如有需要，我们将为您连接经过验证的本地专家网络。',
    btnQuestion: '提问',
    btnAdmin: '관리자',
    heroInfo1: '联系方式：电子邮件或WhatsApp',
    heroInfo2: '语言：韩语 / 英语 / 中文',
    heroInfo3: '提交咨询，快速获得专家指导。',
    heroFlowTitle: '服务使用说明',
    heroFlow1: '一般信息请先使用 AI 智能引导进行搜索。',
    heroFlow2: '如需专家咨询，请填写问题与联系方式。',
    heroFlow3: '随后通过邮件或 WhatsApp 与管理员继续咨询。',
    homeVideoCta: '查看介绍概览',
    homeVideoEmpty: '在管理员页面完成设置后，此区域将显示介绍视频。',
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
    chatCaption: 'AI 智能引导',
    chatTitle: '可实时查看与咨询内容相关的信息。',
    chatInputLabel: '聊天问题',
    chatCategoryLabel: '分类',
    categoryRecruitment: '招聘/就业',
    chatInputPlaceholder: '例如：Employment Pass 换工作需要准备什么？',
    chatSend: '发送',
    chatTipTitle: '更高效使用聊天机器人的方法',
    chatTip1: '把目标、当前情况和时间安排一起写上，会更准确。',
    chatTip2: '一次只问一个问题，答案会更短更清楚。',
    chatTip3: '如果需要准确判断，最后可以转到咨询表单。',
    chatWelcome: '您好，这里是 Question Singapore AI 智能引导服务。我们会根据您的问题提供摘要信息，如有需要，也可继续提供更详细的说明。',
    chatStep1Title: '先快速整理核心信息。',
    chatStep1Text: '我们会根据 FAQ 和已登记文档优先展示实用要点。',
    chatStep2Title: '说明适合您情况的下一步检查项。',
    chatStep2Text: '请通过咨询申请表提交细节，我们可以更准确地继续说明。',
    chatStep3Title: '必要时自然衔接到专家咨询。',
    chatStep3Text: '如您需要，可继续连接当地专家进行咨询。',
    chatError: '生成回复时出现问题，请稍后重试。',
    chatTyping: '正在整理回答...',
    chatCta: '获取更多帮助',
    chatCtaA: '获取更多帮助',
    chatCtaB: '如有需要可提交咨询',
    askCaption: '提交咨询',
    askTitle: '告诉我们您的情况以获得定制答案',
    nameLabel: '姓名',
    namePlaceholder: '姓名',
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
    phoneNumberPlaceholder: '手机号码',
    contactValueLabel: '联系方式',
    languageLabel: '语言',
    questionLabel: '问题内容',
    questionPlaceholder: '请详细填写您想咨询的问题。',
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
    ,socialQrTitle: '社群与网络'
    ,socialOpenLabel: '打开'
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

function sanitizeCategorySelectors() {
  const selectors = Array.from(document.querySelectorAll('select')).filter((node) => {
    const id = String(node.id || '').toLowerCase();
    const name = String(node.name || '').toLowerCase();
    return id.includes('category') || name.includes('category');
  });

  selectors.forEach((select) => {
    const options = Array.from(select.options || []);
    options.forEach((option) => {
      const value = String(option.value || '').toLowerCase();
      const text = String(option.textContent || '').toLowerCase();
      const isRecruitmentLike = value.includes('employment') || value.includes('recruitment') || text.includes('employment') || text.includes('recruit') || text.includes('고용') || text.includes('채용');
      const isPropertyLike = value.includes('property') || text.includes('property') || text.includes('부동산');
      const isRelocationLike = value.includes('relocation') || text.includes('relocation') || text.includes('리로케이션') || text.includes('搬迁');
      const isPlaceholder = value === '';

      if (isPlaceholder) {
        return;
      }

      if (isRecruitmentLike) {
        option.value = 'recruitment';
        return;
      }

      if (isPropertyLike) {
        option.value = 'property';
        return;
      }

      if (isRelocationLike) {
        option.value = 'relocation';
        return;
      }

      option.remove();
    });

    const hasRecruitment = Array.from(select.options || []).some((option) => String(option.value) === 'recruitment');
    const hasProperty = Array.from(select.options || []).some((option) => String(option.value) === 'property');
    const hasRelocation = Array.from(select.options || []).some((option) => String(option.value) === 'relocation');

    if (!hasRecruitment) {
      const opt = document.createElement('option');
      opt.value = 'recruitment';
      opt.textContent = 'Recruitment';
      select.appendChild(opt);
    }

    if (!hasProperty) {
      const opt = document.createElement('option');
      opt.value = 'property';
      opt.textContent = 'Property';
      select.appendChild(opt);
    }

    if (!hasRelocation) {
      const opt = document.createElement('option');
      opt.value = 'relocation';
      opt.textContent = 'Relocation';
      select.appendChild(opt);
    }

    if (!['recruitment', 'property', 'relocation'].includes(select.value)) {
      select.value = 'recruitment';
    }
  });
}

const chatbotQuickByCategory = {
  ko: {
    recruitment: [
      { label: 'EP/S Pass 차이', question: 'Employment Pass와 S Pass 차이 알려줘' },
      { label: '이직 체크리스트', question: 'Employment Pass 이직 준비 체크리스트 알려줘' },
      { label: '인터뷰 준비', question: '싱가포르 취업 인터뷰 준비 핵심 포인트 알려줘' }
    ],
    property: [
      { label: '입주 초기 설정', question: '집 입주 직후 꼭 설정할 항목 알려줘' },
      { label: '임대 계약 체크', question: '싱가포르 임대 계약서에서 꼭 확인할 조항 알려줘' },
      { label: '지역별 비용', question: '싱가포르 지역별 월세와 생활비 비교해줘' }
    ],
    relocation: [
      { label: '첫 주 준비', question: '싱가포르 도착 후 첫 7일 체크리스트 알려줘' },
      { label: '초기 정착 순서', question: '리로케이션 초기 정착을 어떤 순서로 하면 좋을까?' },
      { label: '가족 동반 이주', question: '가족과 함께 이주할 때 꼭 먼저 확인할 항목 알려줘' }
    ]
  },
  en: {
    recruitment: [
      { label: 'EP vs S Pass', question: 'What is the difference between Employment Pass and S Pass?' },
      { label: 'Job Change Checklist', question: 'Give me a checklist for changing jobs on Employment Pass.' },
      { label: 'Interview Prep', question: 'What are key interview prep points for jobs in Singapore?' }
    ],
    property: [
      { label: 'Move-in Setup', question: 'What should I set up first right after moving into a home?' },
      { label: 'Lease Contract', question: 'What lease clauses should I check carefully in Singapore?' },
      { label: 'Area Cost Comparison', question: 'Compare rent and living costs by area in Singapore.' }
    ],
    relocation: [
      { label: 'First Week Plan', question: 'Give me a first-week relocation checklist for Singapore.' },
      { label: 'Setup Priority', question: 'What should I prioritize in the first 30 days after relocation?' },
      { label: 'Family Move', question: 'What are key checkpoints when relocating with family to Singapore?' }
    ]
  },
  zh: {
    recruitment: [
      { label: 'EP 与 S Pass 区别', question: '请说明 Employment Pass 和 S Pass 的主要区别。' },
      { label: '跳槽清单', question: '请给我一份 Employment Pass 持有者跳槽准备清单。' },
      { label: '面试准备', question: '在新加坡求职面试，最关键的准备点是什么？' }
    ],
    property: [
      { label: '入住初期设置', question: '搬入新家后，优先要完成哪些设置？' },
      { label: '租约重点', question: '在新加坡租房合同中需要重点确认哪些条款？' },
      { label: '区域成本比较', question: '请比较新加坡不同区域的租金和生活成本。' }
    ],
    relocation: [
      { label: '首周计划', question: '请给我一份在新加坡落地后第一周的安顿清单。' },
      { label: '初期优先项', question: '搬迁后前 30 天应优先处理哪些事项？' },
      { label: '家庭搬迁', question: '带家人搬迁到新加坡时的关键检查点有哪些？' }
    ]
  }
};

const chatbotTrendingByCategory = {
  recruitment: [],
  property: [],
  relocation: []
};

async function notifyAdminOfInquiry(payload) {
  try {
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Admin notify failed:', response.status);
    }
  } catch (error) {
    console.error('Admin notify error:', error);
  }
}

async function trackKnowledgeEvent(eventType, payload) {
  try {
    const response = await fetch('/api/knowledge-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventType,
        payload
      })
    });

    if (!response.ok) {
      console.error('Knowledge event failed:', response.status);
    }
  } catch (error) {
    console.error('Knowledge event error:', error);
  }
}

function initHomeVideo() {
  if (!homeTopVideo || !homeTopVideoSource) {
    return;
  }

  function applyVideoUrl(videoUrl) {
    if (!videoUrl) {
      homeTopVideo.hidden = true;
      if (homeVideoPlayButton) homeVideoPlayButton.hidden = true;
      if (homeTopVideoEmpty) homeTopVideoEmpty.hidden = false;
      return;
    }
    homeTopVideoSource.src = videoUrl;
    homeTopVideo.load();
    homeTopVideo.hidden = true;
    if (homeVideoPlayButton) homeVideoPlayButton.hidden = false;
    if (homeTopVideoEmpty) homeTopVideoEmpty.hidden = true;
  }

  // 1. 먼저 config 파일에서 로드 (모든 기기에서 동일)
  fetch('/config/video.json')
    .then((res) => res.ok ? res.json() : Promise.reject('config not found'))
    .then((data) => {
      if (data && data.url) {
        window.localStorage.setItem(HOME_TOP_VIDEO_STORAGE_KEY, data.url);
        applyVideoUrl(data.url);
      } else {
        const cached = window.localStorage.getItem(HOME_TOP_VIDEO_STORAGE_KEY) || '';
        applyVideoUrl(cached);
      }
    })
    .catch(() => {
      // 2. config 파일 로드 실패 시, localStorage 사용
      const cached = window.localStorage.getItem(HOME_TOP_VIDEO_STORAGE_KEY) || '';
      applyVideoUrl(cached);
    });
}

function buildQrImageUrl(targetUrl) {
  const encoded = encodeURIComponent(targetUrl || '');
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encoded}`;
}

function applySocialCard(card, qrImage, url) {
  if (!card || !qrImage || !url) {
    return;
  }
  card.href = url;
  qrImage.src = buildQrImageUrl(url);
}

function initFooterSocialLinks() {
  applySocialCard(socialLinkedinCard, socialLinkedinQr, SOCIAL_LINKS.linkedin);
  applySocialCard(socialWhatsappCard, socialWhatsappQr, SOCIAL_LINKS.whatsapp);
  applySocialCard(socialKakaoCard, socialKakaoQr, SOCIAL_LINKS.kakao);
}

function escapeHtmlText(value) {
  return (value || '')
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isSponsorActive(item) {
  if (!item || item.active === false) {
    return false;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = item.startDate ? new Date(item.startDate) : null;
  const end = item.endDate ? new Date(item.endDate) : null;

  if (start && !Number.isNaN(start.getTime()) && start > now) {
    return false;
  }

  if (end && !Number.isNaN(end.getTime())) {
    end.setHours(23, 59, 59, 999);
    if (end < now) {
      return false;
    }
  }

  return true;
}

function normalizeSponsorLink(value) {
  const raw = (value || '').toString().trim();
  if (!raw) {
    return '#';
  }

  if (raw.startsWith('#')) {
    return raw;
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  return '#';
}

function renderSponsorSlots(data) {
  const container = document.getElementById('sponsor-slots');
  const note = document.getElementById('sponsor-guideline-text');
  if (!container) {
    return;
  }

  const payload = data && typeof data === 'object' ? data : SPONSOR_FALLBACK_DATA;
  const categories = Array.isArray(payload.categories) ? payload.categories : [];
  const guideline = payload.meta && payload.meta.bannerGuideline ? payload.meta.bannerGuideline : null;

  if (note && guideline) {
    note.textContent = `권장 배너: 데스크톱 ${guideline.recommendedDesktop}, 모바일 ${guideline.recommendedMobile}, 최대 ${guideline.maxFileSizeMb}MB`;
  }

  const visibleCategories = categories
    .map((category) => ({
      ...category,
      items: Array.isArray(category.items)
        ? category.items
          .filter(isSponsorActive)
          .slice(0, 3)
          .map((item) => ({
            ...item,
            linkUrl: normalizeSponsorLink(item.linkUrl)
          }))
        : []
    }))
    .filter((category) => category.items.length > 0);

  if (!visibleCategories.length) {
    container.innerHTML = '<article class="sponsor-column sponsor-column--empty"><p>현재 노출중인 추천 서비스가 없습니다.</p></article>';
    return;
  }

  container.innerHTML = visibleCategories.map((category) => {
    const cards = category.items.map((item) => `
      <article class="sponsor-card">
        <a class="sponsor-card__anchor" href="${escapeHtmlText(item.linkUrl || '#')}" target="_blank" rel="noopener noreferrer">
          <div class="sponsor-card__image">
            <img src="${escapeHtmlText(item.imageUrl || '')}" alt="${escapeHtmlText((category.label || '추천 서비스') + ' 배너')}" loading="lazy" />
          </div>
        </a>
      </article>
    `).join('');

    return `
      <div class="sponsor-column">
        <div class="sponsor-column__head">
          <h3>${escapeHtmlText(category.label || '')}</h3>
          <span class="chip">${category.items.length}개</span>
        </div>
        <div class="sponsor-stack">${cards}</div>
      </div>
    `;
  }).join('');
}

function initSponsors() {
  fetch('/config/sponsors.json')
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error('sponsors not found'))))
    .then((data) => {
      if (store && typeof store.saveSponsors === 'function') {
        store.saveSponsors(data);
      }
      renderSponsorSlots(data);
    })
    .catch(() => {
      const cached = store && typeof store.getSponsors === 'function' ? store.getSponsors() : SPONSOR_FALLBACK_DATA;
      renderSponsorSlots(cached);
    });
}

if (homeVideoPlayButton && homeTopVideo) {
  homeVideoPlayButton.addEventListener('click', async () => {
    homeTopVideo.hidden = false;
    homeVideoPlayButton.hidden = true;
    try {
      await homeTopVideo.play();
    } catch (error) {
      console.error('Video play failed:', error);
    }
  });
}

function updateLanguage(lang) {
  const translation = translations[lang] || translations.ko;

  document.documentElement.lang = lang;
  if (document.body) {
    document.body.classList.remove('lang-ko', 'lang-en', 'lang-zh');
    document.body.classList.add(`lang-${lang}`);
  }

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n;
    if (key && translation[key]) {
      element.textContent = translation[key];
    }
  });

  document.querySelectorAll('[data-i18n-html]').forEach((element) => {
    const key = element.dataset.i18nHtml;
    if (key && translation[key]) {
      element.innerHTML = translation[key];
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

  const contactType = (contactTypeSelect.value || 'email').toLowerCase();
  const isWhatsApp = contactType === 'whatsapp';

  contactEmailGroup.hidden = isWhatsApp;
  whatsappFields.hidden = !isWhatsApp;

  contactValueInput.required = !isWhatsApp;
  phoneNumberInput.required = isWhatsApp;
  countryCodeInput.required = isWhatsApp;

  if (!isWhatsApp) {
    phoneNumberInput.value = '';
  } else if (!countryCodeInput.value) {
    countryCodeInput.value = '+65';
  }
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

function sourceLabel(source) {
  const key = (source || '').toString();
  if (key === 'faq') {
    return 'FAQ Match';
  }
  if (key === 'faq-en-fallback') {
    return 'EN FAQ Match';
  }
  if (key === 'llm-fallback') {
    return '';
  }
  if (key === 'ai-context') {
    return 'AI Q&A Context';
  }
  if (key === 'context-fallback') {
    return 'Context Match';
  }
  if (key === 'fallback') {
    return 'General Fallback';
  }
  return key ? `Source: ${key}` : '';
}

function normalizeChatbotCategory(value = '') {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('recruitment') || normalized.includes('채용') || normalized.includes('employment') || normalized.includes('고용') || normalized.includes('就业')) {
    return 'recruitment';
  }
  if (normalized.includes('property') || normalized.includes('부동산') || normalized.includes('房地产')) {
    return 'property';
  }
  if (normalized.includes('relocation') || normalized.includes('리로케이션') || normalized.includes('搬迁')) {
    return 'relocation';
  }
  return 'recruitment';
}

function getChatFlowState() {
  try {
    const raw = window.localStorage.getItem(CHAT_FLOW_STATE_KEY);
    if (!raw) {
      return { mode: 'idle', stage: 0 };
    }
    const parsed = JSON.parse(raw);
    const mode = parsed && parsed.mode === 'guided' ? 'guided' : 'idle';
    const stage = Number(parsed && parsed.stage) || 0;
    return { mode, stage: Math.min(5, Math.max(0, stage)) };
  } catch (error) {
    return { mode: 'idle', stage: 0 };
  }
}

function saveChatFlowState(state) {
  try {
    window.localStorage.setItem(CHAT_FLOW_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    // Ignore storage failures.
  }
}

function resetChatFlowState() {
  saveChatFlowState({ mode: 'idle', stage: 0 });
}

function isGuidedConversationCandidate(question = '') {
  const value = String(question || '').trim().toLowerCase();
  if (!value) {
    return false;
  }

  if (value.length <= 28) {
    return true;
  }

  const broadPatterns = [
    /어떻게\s*(시작|준비|해야|생각)/,
    /방향|추천|고민|조언|상담|비교|도와줘|도와 줘|help me decide|where should|what should i consider|should i|어떤\s*게|무엇부터|먼저|계속|더 자세히/,
  ];

  return broadPatterns.some((pattern) => pattern.test(value));
}

function getChatbotCtaBucket() {
  try {
    const key = 'question-singapore-chat-cta-bucket';
    const cached = window.localStorage.getItem(key);
    if (cached === 'A' || cached === 'B') {
      return cached;
    }
    const bucket = Math.random() < 0.5 ? 'A' : 'B';
    window.localStorage.setItem(key, bucket);
    return bucket;
  } catch (error) {
    return 'A';
  }
}

function applyChatbotCtaVariant() {
  const cta = document.querySelector('[data-i18n="chatCta"]');
  if (!cta) {
    return;
  }

  const lang = languageSelect?.value || 'ko';
  const t = translations[lang] || translations.ko;
  const bucket = getChatbotCtaBucket();
  const key = bucket === 'B' ? 'chatCtaB' : 'chatCtaA';
  cta.textContent = t[key] || t.chatCta;
}

function appendChatMessage(role, text, meta = '') {
  if (!chatbotMessages) {
    return null;
  }

  const wrapper = document.createElement('article');
  wrapper.className = `chatbot-message chatbot-message--${role}`;

  const rawText = String(text || '').trim();
  let bodyText = rawText;
  let referenceItems = [];

  if (role === 'bot' && rawText) {
    const referenceMatch = rawText.match(/\n\n(참고 링크|Reference Links|参考链接):\n([\s\S]*)$/i);
    if (referenceMatch) {
      bodyText = rawText.slice(0, referenceMatch.index).trim();
      referenceItems = referenceMatch[2]
        .split('\n')
        .map((line) => line.replace(/^[-•]\s*/, '').trim())
        .filter(Boolean)
        .map((line) => {
          const separatorIndex = line.lastIndexOf(': ');
          if (separatorIndex > -1) {
            return {
              label: line.slice(0, separatorIndex).trim(),
              url: line.slice(separatorIndex + 2).trim()
            };
          }
          const url = line.trim();
          return {
            label: url,
            url
          };
        })
        .filter((item) => /^https?:\/\//i.test(item.url));
    }
  }

  const bodyEl = document.createElement('div');
  bodyEl.className = 'chatbot-message__body';
  bodyEl.textContent = bodyText;
  wrapper.appendChild(bodyEl);

  if (referenceItems.length > 0) {
    const refsEl = document.createElement('div');
    refsEl.className = 'chatbot-references';

    for (const ref of referenceItems.slice(0, 3)) {
      const chip = document.createElement('a');
      chip.className = 'chatbot-reference-chip';
      chip.href = ref.url;
      chip.target = '_blank';
      chip.rel = 'noreferrer noopener';
      chip.textContent = ref.label;
      refsEl.appendChild(chip);
    }

    wrapper.appendChild(refsEl);
  }

  if (meta) {
    const metaEl = document.createElement('div');
    const sourceKey = (meta || '').toString();
    const label = sourceLabel(sourceKey);
    if (label) {
      metaEl.className = `chatbot-meta chatbot-meta--${sourceKey}`;
      metaEl.textContent = label;
      wrapper.appendChild(metaEl);
    }
  }

  chatbotMessages.appendChild(wrapper);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  return wrapper;
}

function normalizeDisplayedChatbotAnswer(text = '', language = 'ko') {
  let body = String(text || '').trim();
  if (!body) {
    return body;
  }

  const legacyPatterns = [
    /^좋은 질문이에요\.\s*상황에 맞게 핵심부터 편하게 정리해드릴게요\.\s*/,
    /^좋은 질문이에요\.\s*/,
    /^좋은 포인트예요\.\s*핵심만 짧게 정리해볼게요\.\s*/,
    /^핵심만 짧게 정리해볼게요\.\s*/,
    /\n*필요하시면 현재 상황\(비자 상태, 예산, 일정\)을 알려주세요\.\s*다음 단계까지 같이 정리해드릴게요\.\s*$/,
    /\n*필요하시면 현재 상황을 기준으로 전문가 상담까지 자연스럽게 이어서 도와드릴게요\.\s*$/
  ];

  for (const pattern of legacyPatterns) {
    body = body.replace(pattern, '');
  }

  body = body
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n');

  body = body.trim();
  return body;
}

function revealAskSection() {
  if (!askSection) {
    return;
  }

  askSection.hidden = false;
  askSection.classList.remove('ask-section--collapsed');
  askSection.classList.add('ask-section--revealed');
  askSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function refreshChatbotWelcomeMessage() {
  const lang = languageSelect?.value || 'ko';
  const translation = translations[lang] || translations.ko;
  const welcomeEl = chatbotMessages?.querySelector('[data-chatbot-welcome="true"]');

  if (!welcomeEl) {
    return;
  }

  const metaEl = welcomeEl.querySelector('.chatbot-meta');
  const metaClone = metaEl ? metaEl.cloneNode(true) : null;

  welcomeEl.textContent = translation.chatWelcome;
  if (metaClone) {
    welcomeEl.appendChild(metaClone);
  }
}

function renderChatbotStepState(activeStep = 1) {
  document.querySelectorAll('[data-chatbot-step-item]').forEach((item) => {
    const stepNumber = Number(item.getAttribute('data-chatbot-step-item') || '1');
    item.classList.toggle('chatbot-stepper__item--active', stepNumber === activeStep);
    item.classList.toggle('chatbot-stepper__item--done', stepNumber < activeStep);
  });
}

function initChatbot() {
  if (!chatbotMessages || !chatbotForm || !chatbotInput) {
    return;
  }

  const currentLang = languageSelect?.value || 'ko';
  const translation = translations[currentLang] || translations.ko;
  renderChatbotStepState(1);
  const welcomeMessage = appendChatMessage('bot', translation.chatWelcome);
  if (welcomeMessage) {
    welcomeMessage.setAttribute('data-chatbot-welcome', 'true');
  }
  applyChatbotCtaVariant();

  chatbotForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const question = chatbotInput.value.trim();
    const lang = languageSelect?.value || 'ko';
    const category = chatbotCategorySelect?.value || 'recruitment';
    const t = translations[lang] || translations.ko;
    const currentFlow = getChatFlowState();
    const guidedCandidate = currentFlow.mode === 'guided' || isGuidedConversationCandidate(question);
    const guidedStage = currentFlow.mode === 'guided' ? Math.min(5, Math.max(1, currentFlow.stage || 1)) : 1;
    const nextFlowStage = guidedStage >= 5 ? 0 : guidedStage + 1;

    if (!question) {
      return;
    }

    appendChatMessage('user', question);
    chatbotInput.value = '';
    appendChatMessage('bot', t.chatTyping);

    if (guidedCandidate) {
      saveChatFlowState(nextFlowStage > 0 ? { mode: 'guided', stage: nextFlowStage } : { mode: 'idle', stage: 0 });
      renderChatbotStepState(guidedStage);
    } else {
      resetChatFlowState();
      renderChatbotStepState(1);
    }

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          language: lang,
          category,
          conversationMode: guidedCandidate ? 'guided' : 'normal',
          conversationStage: guidedCandidate ? guidedStage : 0
        })
      });

      const lastTyping = chatbotMessages.lastElementChild;
      if (lastTyping && lastTyping.classList.contains('chatbot-message--bot')) {
        lastTyping.remove();
      }

      if (!response.ok) {
        appendChatMessage('bot', t.chatError);
        return;
      }

      const data = await response.json();
      const sourceKey = data && data.source ? String(data.source) : '';
      appendChatMessage('bot', normalizeDisplayedChatbotAnswer(data.answer || t.chatError, lang), sourceKey);

      if (guidedCandidate && guidedStage >= 5) {
        resetChatFlowState();
        renderChatbotStepState(3);
      }
    } catch (error) {
      const lastTyping = chatbotMessages.lastElementChild;
      if (lastTyping && lastTyping.classList.contains('chatbot-message--bot')) {
        lastTyping.remove();
      }
      appendChatMessage('bot', t.chatError);
    }
  });

}

if (languageSelect) {
  languageSelect.addEventListener('change', () => {
    updateLanguage(languageSelect.value);
    refreshChatbotWelcomeMessage();
    renderChatbotStepState(1);
    applyChatbotCtaVariant();
  });
}

document.querySelectorAll('.chatbot-cta[href="#ask"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    revealAskSection();
  });
});

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
    const emailOnly = Boolean(emailContact);
    const phoneOnly = Boolean(phoneNumber.replace(/\D/g, ''));
    let resolvedContactType = contactType;
    let contactValue = '';

    if (contactType === 'whatsapp' || (!emailOnly && phoneOnly)) {
      const normalizedCode = countryCode
        ? (countryCode.startsWith('+') ? countryCode : `+${countryCode.replace(/[^0-9]/g, '')}`)
        : '+65';
      const normalizedNumber = phoneNumber.replace(/[^0-9]/g, '');
      resolvedContactType = 'whatsapp';
      contactValue = normalizedNumber ? `${normalizedCode}${normalizedNumber}` : '';
    } else if (emailOnly) {
      resolvedContactType = 'email';
      contactValue = emailContact;
    }

    const translation = translations[language] || translations.ko;

    if (!question || !contactValue) {
      message.textContent = translation.alertIncomplete;
      return;
    }

    let savedEntry = null;
    if (store) {
      savedEntry = store.addQuestion({ name, category, question, contactType: resolvedContactType, contactValue, language });
    }

    notifyAdminOfInquiry({
      id: savedEntry?.id || '',
      name,
      category,
      question,
      contactType: resolvedContactType,
      contactValue,
      language,
      createdAt: savedEntry?.createdAt || new Date().toISOString()
    });

    trackKnowledgeEvent('inquiry', {
      id: savedEntry?.id || '',
      category,
      question,
      contactType: resolvedContactType,
      language,
      createdAt: savedEntry?.createdAt || new Date().toISOString()
    });

    message.textContent = translation.alertSuccess;
    renderRecentQuestions();
    form.reset();
    updateContactFields();
    message.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

renderRecentQuestions();
sanitizeCategorySelectors();
updateLanguage('ko');
updateContactFields();
initHomeVideo();
initChatbot();
initFooterSocialLinks();
initSponsors();
