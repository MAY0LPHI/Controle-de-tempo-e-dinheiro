// envelopes.js — lógica do desafio dos 100 envelopes

function renderEnvelopes(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const marcados = getEnvelopes();
  container.innerHTML = '';

  for (let i = 1; i <= 100; i++) {
    const cell = document.createElement('button');
    cell.className = 'envelope-cell' + (marcados.includes(i) ? ' marked' : '');
    cell.textContent = i;
    cell.dataset.num = i;
    cell.addEventListener('click', () => toggleEnvelope(i, containerId));
    container.appendChild(cell);
  }

  updateEnvelopeTotal();
}

function toggleEnvelope(num, containerId) {
  let marcados = getEnvelopes();
  if (marcados.includes(num)) {
    marcados = marcados.filter((n) => n !== num);
  } else {
    marcados.push(num);
  }
  saveEnvelopes(marcados);

  const cell = document.querySelector(`#${containerId} [data-num="${num}"]`);
  if (cell) cell.classList.toggle('marked', marcados.includes(num));

  updateEnvelopeTotal();
}

function updateEnvelopeTotal() {
  const marcados = getEnvelopes();
  const total = marcados.reduce((acc, n) => acc + n, 0);
  const el = document.getElementById('envelope-total');
  if (el) el.textContent = formatBRL(total);
  const cnt = document.getElementById('envelope-count');
  if (cnt) cnt.textContent = marcados.length + '/100';
}

function getEnvelopesCount() {
  return getEnvelopes().length;
}
