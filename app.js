const views = Array.from(document.querySelectorAll('.view'));
const links = Array.from(document.querySelectorAll('[data-view-link], [data-view]'));

function showToast(text = 'Saved successfully.') {
  const toast = document.getElementById('toast');
  toast.textContent = text;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 1600);
}

function showView(id) {
  views.forEach((v) => v.classList.toggle('active', v.id === id));
  window.location.hash = id;
}

links.forEach((node) => {
  node.addEventListener('click', (e) => {
    const target = node.dataset.view || node.dataset.viewLink;
    if (!target) return;
    e.preventDefault();
    showView(target);
  });
});

if (window.location.hash) {
  const hashView = window.location.hash.slice(1);
  if (document.getElementById(hashView)) showView(hashView);
}

const featuresRoot = document.getElementById('features');
window.seed.features.forEach((feature) => {
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `<h3>${feature.title}</h3><p>${feature.body}</p>`;
  featuresRoot.appendChild(card);
});

const stats = {
  'Total Applications': window.seed.applications.length,
  Interviews: window.seed.applications.filter((a) => a.status === 'Interview').length,
  Offers: window.seed.applications.filter((a) => a.status === 'Offer').length,
  Rejections: window.seed.applications.filter((a) => a.status === 'Rejected').length,
  Pending: window.seed.applications.filter((a) => a.outcome === 'Pending').length,
  'Follow-ups Due': window.seed.applications.filter((a) => a.followUp !== '-').length
};

const statsGrid = document.getElementById('stats-grid');
Object.entries(stats).forEach(([label, value]) => {
  const div = document.createElement('div');
  div.className = 'stat';
  div.innerHTML = `<strong>${value}</strong><span>${label}</span>`;
  statsGrid.appendChild(div);
});

const recentApps = document.getElementById('recent-apps');
window.seed.applications.forEach((app) => {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${app.company}</td>
    <td>${app.role}</td>
    <td>${app.applied}</td>
    <td><span class="status-chip">${app.status}</span></td>
    <td>${app.score}%</td>
    <td>${app.next}</td>
  `;
  recentApps.appendChild(tr);
});

const trackerBody = document.getElementById('tracker-body');
function renderTracker(items) {
  trackerBody.innerHTML = '';
  items.forEach((app) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${app.company}</td><td>${app.role}</td><td>${app.status}</td><td>${app.applied}</td><td>${app.followUp}</td><td>${app.outcome}</td>`;
    trackerBody.appendChild(tr);
  });
}
renderTracker(window.seed.applications);

document.getElementById('tracker-search').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  renderTracker(window.seed.applications.filter((a) => `${a.company} ${a.role}`.toLowerCase().includes(q)));
});

const statusBars = document.getElementById('status-bars');
const total = window.seed.applications.length;
[...new Set(window.seed.applications.map((a) => a.status))].forEach((status) => {
  const count = window.seed.applications.filter((a) => a.status === status).length;
  const ratio = Math.round((count / total) * 100);
  const row = document.createElement('div');
  row.className = 'status-bar-wrap';
  row.innerHTML = `<span>${status}</span><div class="status-bar"><div style="width:${ratio}%"></div></div><span>${count}</span>`;
  statusBars.appendChild(row);
});

const documentsGrid = document.getElementById('documents-grid');
window.seed.documents.forEach((doc) => {
  const article = document.createElement('article');
  article.className = 'card';
  article.innerHTML = `<h3>${doc.type}</h3><p><strong>${doc.title}</strong></p><p>${doc.company} · ${doc.role}</p><p>${doc.date} · ${doc.version}</p>`;
  documentsGrid.appendChild(article);
});

let currentStep = 1;
const stepLabels = ['Job Info', 'Resume', 'Analysis', 'Outputs', 'Review'];
const stepper = document.getElementById('stepper');
const stepLabel = document.getElementById('step-label');

function renderStepper() {
  stepper.innerHTML = '';
  stepLabels.forEach((name, i) => {
    const step = document.createElement('div');
    step.className = `step-pill ${i + 1 === currentStep ? 'active' : ''}`;
    step.textContent = `${i + 1}. ${name}`;
    stepper.appendChild(step);
  });
  stepLabel.textContent = `Step ${currentStep} of 5`;
  document.querySelectorAll('.step').forEach((el) => {
    const visible = Number(el.dataset.step) === currentStep;
    el.classList.toggle('hidden', !visible);
  });
}
renderStepper();

function basicAnalyze(jobText, resumeText) {
  const words = jobText.toLowerCase().match(/[a-zA-Z+#.]+/g) || [];
  const resume = resumeText.toLowerCase();
  const stop = new Set(['the', 'and', 'for', 'with', 'you', 'will', 'our', 'your', 'this', 'that']);
  const freq = {};
  words.forEach((w) => {
    if (w.length < 3 || stop.has(w)) return;
    freq[w] = (freq[w] || 0) + 1;
  });
  const keywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([w]) => w);
  const matched = keywords.filter((w) => resume.includes(w));
  const missing = keywords.filter((w) => !resume.includes(w));
  const score = Math.max(25, Math.round((matched.length / Math.max(1, keywords.length)) * 100));
  return { keywords, matched, missing, score };
}

function runAnalysis() {
  const form = document.getElementById('application-form');
  const data = new FormData(form);
  const analysis = basicAnalyze(data.get('description') || '', data.get('resume') || '');
  const root = document.getElementById('analysis-result');
  root.innerHTML = `
    <div class="analysis-item"><strong>Match Score</strong><p>${analysis.score}%</p></div>
    <div class="analysis-item"><strong>Matched Keywords</strong><p>${analysis.matched.join(', ') || 'None yet'}</p></div>
    <div class="analysis-item"><strong>Missing Keywords</strong><p>${analysis.missing.join(', ') || 'Strong alignment'}</p></div>
    <div class="analysis-item"><strong>Suggestion</strong><p>Emphasize projects where you used ${analysis.missing.slice(0, 3).join(', ') || 'core required skills'}.</p></div>
  `;

  form.elements.tailoredResume.value = `Tailored resume draft for ${data.get('role')} at ${data.get('company')}\n\nSummary: Student engineer focused on scalable backend systems and reliable APIs.\n\n- Reordered bullets to prioritize role-relevant experience\n- Strengthened action verbs and measurable outcomes\n- Preserved original facts and achievements`; 

  form.elements.coverLetter.value = `Dear Hiring Team,\n\nI am excited to apply for the ${data.get('role')} role at ${data.get('company')}. My projects in API performance optimization and cloud deployments align well with your requirements.\n\nI would welcome the chance to contribute and learn with your team.\n\nSincerely,\nYour Name`;
  form.elements.networkingMessage.value = `Hi, I recently applied for ${data.get('role')} at ${data.get('company')} and would value any advice about what your team looks for in candidates.`;
  form.elements.followUp.value = `Hi, I wanted to follow up on my ${data.get('role')} application and reiterate my interest in the role. Thank you for your time.`;
}

document.getElementById('next-step').addEventListener('click', () => {
  if (currentStep === 2) runAnalysis();
  if (currentStep < 5) {
    currentStep += 1;
    renderStepper();
    return;
  }
  showToast('Application saved.');
});
document.getElementById('prev-step').addEventListener('click', () => {
  if (currentStep > 1) {
    currentStep -= 1;
    renderStepper();
  }
});

document.getElementById('copy-cover-letter').addEventListener('click', async () => {
  await navigator.clipboard.writeText(document.querySelector('[name="coverLetter"]').value || '');
  showToast('Cover letter copied.');
});

document.getElementById('download-resume').addEventListener('click', () => {
  const content = document.querySelector('[name="tailoredResume"]').value || '';
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tailored-resume.txt';
  a.click();
  URL.revokeObjectURL(url);
});

function createCoverLetter() {
  const company = document.getElementById('cl-company').value || 'the company';
  const role = document.getElementById('cl-role').value || 'the role';
  const tone = document.getElementById('cl-tone').value;
  const length = document.getElementById('cl-length').value;
  const exp = document.getElementById('cl-experience').value || 'relevant software engineering projects';
  document.getElementById('cl-output').value = `Dear Hiring Team,\n\nI am writing to express interest in the ${role} position at ${company}. ${exp}. My background combines strong engineering fundamentals with practical project delivery.\n\nI am especially drawn to ${company}'s mission and would be excited to contribute with a ${tone.toLowerCase()} communication style and ownership mindset.\n\nThank you for considering my application.\n\nSincerely,\nYour Name\n\n[Length: ${length}]`;
}

document.getElementById('generate-cover-letter').addEventListener('click', createCoverLetter);
document.getElementById('copy-cover').addEventListener('click', async () => {
  await navigator.clipboard.writeText(document.getElementById('cl-output').value || '');
  showToast('Cover letter copied.');
});

document.getElementById('generate-message').addEventListener('click', () => {
  const type = document.getElementById('net-type').value;
  const name = document.getElementById('net-name').value || 'there';
  const company = document.getElementById('net-company').value || 'your company';
  const role = document.getElementById('net-role').value || 'this role';
  const background = document.getElementById('net-background').value || 'my software engineering coursework and projects';

  document.getElementById('net-output').value = `Hi ${name},\n\nI hope you're doing well. I am reaching out regarding the ${role} opportunity at ${company}. Based on ${background}, I believe I could contribute meaningfully.\n\nIf you have a moment, I would appreciate any guidance on how to stand out for this position.\n\nThank you!\n[${type}]`;
});

document.getElementById('copy-message').addEventListener('click', async () => {
  await navigator.clipboard.writeText(document.getElementById('net-output').value || '');
  showToast('Message copied.');
});

document.getElementById('generate-tailored').addEventListener('click', () => {
  const job = document.getElementById('rt-job').value;
  const master = document.getElementById('rt-master').value;
  const analysis = basicAnalyze(job, master);
  document.getElementById('rt-tailored').value = `Tailored Draft\n\nKeyword focus: ${analysis.keywords.slice(0, 8).join(', ')}\n\n- Reordered experience to emphasize job relevance\n- Improved bullets with action + impact phrasing\n- Maintained truthfulness: no fabricated achievements`;
});
document.getElementById('improve-tailored').addEventListener('click', () => {
  const current = document.getElementById('rt-tailored');
  current.value += '\n- Added concise professional summary aligned to role requirements';
  showToast('Tailored resume improved.');
});
document.getElementById('copy-tailored').addEventListener('click', async () => {
  await navigator.clipboard.writeText(document.getElementById('rt-tailored').value || '');
  showToast('Tailored resume copied.');
});

document.getElementById('settings-form').addEventListener('submit', (e) => {
  e.preventDefault();
  showToast('Settings saved.');
});
