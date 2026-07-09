const list = document.getElementById('admin-questions');
const clearButton = document.getElementById('clear-questions');
const kpiContainer = document.getElementById('admin-kpis');
const categoryContainer = document.getElementById('analytics-category');
const channelContainer = document.getElementById('analytics-channel');
const languageContainer = document.getElementById('analytics-language');
const trendContainer = document.getElementById('analytics-trend');
const store = window.QuestionSingaporeStore;
const ADMIN_EMAIL = 'hello@questionsingapore.com';
const ADMIN_WHATSAPP_NUMBER = '6592218254';

const languageMap = {
  ko: '한국어',
  en: 'English',
  zh: '中文'
};

const contactMap = {
  email: '이메일',
  whatsapp: 'WhatsApp'
};

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

  return rows
    .map(([label, value]) => `<div class="analytics-row"><span>${label}</span><strong>${value}</strong></div>`)
    .join('');
}

function renderDashboard() {
  if (!store) {
    return;
  }

  const questions = store.getQuestions();
  const total = questions.length;
  const answered = questions.filter((q) => q.status === '답변완료' || (q.answer || '').trim()).length;
  const pending = total - answered;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = questions.filter((q) => new Date(q.createdAt) >= todayStart).length;
  const responseRate = total ? Math.round((answered / total) * 100) : 0;

  if (kpiContainer) {
    kpiContainer.innerHTML = `
      <article class="admin-kpi-card"><p>총 문의</p><h3>${total}</h3></article>
      <article class="admin-kpi-card"><p>오늘 접수</p><h3>${todayCount}</h3></article>
      <article class="admin-kpi-card"><p>답변 완료</p><h3>${answered}</h3></article>
      <article class="admin-kpi-card"><p>미답변</p><h3>${pending}</h3></article>
      <article class="admin-kpi-card"><p>답변률</p><h3>${responseRate}%</h3></article>
    `;
  }

  if (categoryContainer) {
    const categoryRows = countBy(questions, (q) => q.category || '기타');
    categoryContainer.innerHTML = formatMetricRows(categoryRows);
  }

  if (channelContainer) {
    const channelRows = countBy(questions, (q) => contactMap[q.contactType] || '기타');
    channelContainer.innerHTML = `<h4>연락 채널</h4>${formatMetricRows(channelRows)}`;
  }

  if (languageContainer) {
    const languageRows = countBy(questions, (q) => languageMap[q.language] || q.language || '기타');
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
      const count = questions.filter((q) => {
        const created = new Date(q.createdAt);
        return created >= day && created < nextDay;
      }).length;
      const label = `${day.getMonth() + 1}/${day.getDate()}`;
      return [label, count];
    });

    trendContainer.innerHTML = formatMetricRows(trendRows);
  }
}

function renderQuestions() {
  if (!list || !store) {
    return;
  }

  const questions = store.getQuestions();

  if (!questions.length) {
    list.innerHTML = '<p class="empty-state">아직 저장된 질문이 없습니다.</p>';
    return;
  }

  list.innerHTML = questions
    .map((question) => {
      const date = new Date(question.createdAt).toLocaleString('ko-KR');
      return `
        <article class="admin-card">
          <div class="admin-card__meta">
            <span class="chip">${question.category}</span>
            <span>${question.status || '신규'}</span>
          </div>
          <h3>${question.name}</h3>
          <p><strong>Q.</strong> ${question.question}</p>
          <p><strong>연락:</strong> ${contactMap[question.contactType] || '연락처'} · ${question.contactValue || '-'}</p>
          <p><strong>언어:</strong> ${languageMap[question.language] || question.language}</p>
          <p><strong>A.</strong> ${question.answer || '아직 답변이 준비되지 않았습니다.'}</p>
          <form class="reply-form" data-id="${question.id}">
            <textarea name="reply" rows="3" placeholder="답변 내용을 입력하세요">${question.answer || ''}</textarea>
            <button class="button" type="submit">답변 보내기</button>
          </form>
        </article>
      `;
    })
    .join('');
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

if (list) {
  list.addEventListener('submit', (event) => {
    const form = event.target.closest('form');
    if (!form) {
      return;
    }

    event.preventDefault();
    const id = form.getAttribute('data-id');
    const reply = form.reply.value.trim();
    const question = store.getQuestions().find((item) => item.id === id);

    if (!question || !reply) {
      window.alert('답변 내용을 입력해주세요.');
      return;
    }

    const updated = store.updateQuestion(id, { answer: reply, status: '답변완료' });
    if (updated) {
      openReplyChannel(updated, reply);
      renderQuestions();
      renderDashboard();
    }
  });
}

if (clearButton) {
  clearButton.addEventListener('click', () => {
    const confirmed = window.confirm('모든 질문을 삭제하시겠습니까?');
    if (!confirmed) {
      return;
    }

    store.clearQuestions();
    renderQuestions();
    renderDashboard();
  });
}

renderQuestions();
renderDashboard();
