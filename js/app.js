// app.js — lógica principal, navegação, eventos

(function () {
  'use strict';

  // ─── Estado ───────────────────────────────────────────────────────────────
  const MAX_INPUT_LENGTH = 12;
  const CONFETTI_COLORS = ['#22C55E', '#16A34A', '#4ADE80', '#FACC15', '#34D399'];

  let currentScreen = 'home';
  let currentValue = '';
  let selectedReminder = 24 * 60 * 60 * 1000; // 24h default em ms
  let selectedCategory = '';
  let doubtItem = null; // item em dúvida
  let confirmingPurchase = false;

  // ─── Init ─────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const perfil = getPerfil();
    if (!perfil) {
      showScreen('setup');
    } else {
      showScreen('home');
      checkLembretes();
    }

    bindSetup();
    bindKeypad();
    bindNav();
    bindModals();
    bindQuarentena();
    bindProfile();
  });

  // ─── Navegação ────────────────────────────────────────────────────────────
  function showScreen(name) {
    currentScreen = name;
    document.querySelectorAll('.screen').forEach((s) => {
      s.classList.remove('active');
    });
    const target = document.getElementById('screen-' + name);
    if (target) {
      target.classList.add('active');
    }

    document.querySelectorAll('.nav-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.screen === name);
    });

    if (name === 'savings') {
      renderSavings();
      renderEnvelopes('envelope-grid');
    }
    if (name === 'profile') {
      renderProfile();
    }
  }

  function bindNav() {
    document.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const s = btn.dataset.screen;
        if (s) showScreen(s);
      });
    });
  }

  // ─── Setup de perfil ──────────────────────────────────────────────────────
  function bindSetup() {
    const form = document.getElementById('setup-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const salario = parseFloat(document.getElementById('setup-salario').value.replace(',', '.'));
      const horas = parseFloat(document.getElementById('setup-horas').value.replace(',', '.'));
      if (!salario || !horas || salario <= 0 || horas <= 0) {
        showSetupError('Preencha todos os campos corretamente.');
        return;
      }
      savePerfil(salario, horas);
      showScreen('home');
      checkLembretes();
    });
  }

  function showSetupError(msg) {
    const el = document.getElementById('setup-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }

  // ─── Teclado numérico ─────────────────────────────────────────────────────
  function bindKeypad() {
    document.querySelectorAll('.key-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const k = btn.dataset.key;
        handleKey(k);
      });
    });

    const calcBtn = document.getElementById('calc-btn');
    if (calcBtn) {
      calcBtn.addEventListener('click', openModalValePena);
    }
  }

  function handleKey(k) {
    if (k === 'back') {
      currentValue = currentValue.slice(0, -1);
    } else if (k === '.') {
      if (!currentValue.includes('.')) {
        currentValue = currentValue === '' ? '0.' : currentValue + '.';
      }
    } else {
      if (currentValue === '0') currentValue = k;
      else currentValue += k;
      // limitar tamanho
      if (currentValue.length > MAX_INPUT_LENGTH) currentValue = currentValue.slice(0, MAX_INPUT_LENGTH);
    }
    updateDisplay();
  }

  function updateDisplay() {
    const raw = parseFloat(currentValue) || 0;
    const el = document.getElementById('calc-display');
    if (el) {
      el.textContent = raw === 0 && currentValue === ''
        ? 'R$0'
        : formatBRL(raw);
    }
  }

  function getCurrentValueNumber() {
    return parseFloat(currentValue) || 0;
  }

  // ─── Modal "Vale a pena?" ─────────────────────────────────────────────────
  function openModalValePena() {
    const valor = getCurrentValueNumber();
    if (valor <= 0) return;

    const perfil = getPerfil();
    if (!perfil) { showScreen('setup'); return; }

    confirmingPurchase = false;
    const horas = calcHorasGastas(valor, perfil.valorHora);
    const investido = calcInvestimento(valor);

    document.getElementById('vp-tempo').textContent = formatHoras(horas);
    document.getElementById('vp-investido').textContent = formatBRL(investido);
    document.getElementById('vp-confirm-text').style.display = 'none';
    document.getElementById('vp-buy-btn').textContent = 'Comprar';
    document.getElementById('vp-buy-confirm').style.display = 'none';

    openModal('modal-vale-pena');
  }

  // ─── Modal "Ainda em dúvida?" ─────────────────────────────────────────────
  function openModalDuvida() {
    const valor = getCurrentValueNumber();
    const perfil = getPerfil();
    if (!perfil) return;

    const horas = calcHorasGastas(valor, perfil.valorHora);

    document.getElementById('duvida-tempo').textContent = formatHoras(horas);
    document.getElementById('duvida-valor').textContent = formatBRL(valor);
    document.getElementById('duvida-nome').value = '';
    selectedCategory = '';
    selectedReminder = 24 * 60 * 60 * 1000;

    document.querySelectorAll('.cat-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.reminder-btn').forEach((b) => {
      const isDefault = b.dataset.ms === String(24 * 60 * 60 * 1000);
      b.classList.toggle('active', isDefault);
    });
    updateDefinirBtn();

    closeModal('modal-vale-pena');
    openModal('modal-duvida');
  }

  // ─── Bind modais ──────────────────────────────────────────────────────────
  function bindModals() {
    // Overlay click fecha
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay.id);
      });
    });

    // "Vale a pena?" — Não comprar
    const noBtn = document.getElementById('vp-no-btn');
    if (noBtn) {
      noBtn.addEventListener('click', () => {
        const valor = getCurrentValueNumber();
        if (valor > 0) {
          addEconomia(valor);
          showConfetti();
          currentValue = '';
          updateDisplay();
        }
        closeModal('modal-vale-pena');
      });
    }

    // "Vale a pena?" — Comprar
    const buyBtn = document.getElementById('vp-buy-btn');
    if (buyBtn) {
      buyBtn.addEventListener('click', () => {
        if (!confirmingPurchase) {
          const perfil = getPerfil();
          const horas = calcHorasGastas(getCurrentValueNumber(), perfil.valorHora);
          const confirmText = document.getElementById('vp-confirm-text');
          confirmText.textContent = 'Tem certeza que quer trocar ' + formatHoras(horas) + ' da sua vida por isso?';
          confirmText.style.display = 'block';
          document.getElementById('vp-buy-confirm').style.display = 'flex';
          buyBtn.style.display = 'none';
          confirmingPurchase = true;
        }
      });
    }

    const buyConfirmYes = document.getElementById('vp-buy-yes');
    if (buyConfirmYes) {
      buyConfirmYes.addEventListener('click', () => {
        addGasto(getCurrentValueNumber());
        currentValue = '';
        updateDisplay();
        closeModal('modal-vale-pena');
        confirmingPurchase = false;
      });
    }

    const buyConfirmNo = document.getElementById('vp-buy-no');
    if (buyConfirmNo) {
      buyConfirmNo.addEventListener('click', () => {
        document.getElementById('vp-confirm-text').style.display = 'none';
        document.getElementById('vp-buy-confirm').style.display = 'none';
        document.getElementById('vp-buy-btn').style.display = '';
        confirmingPurchase = false;
      });
    }

    // "Vale a pena?" — Não tenho certeza
    const unsureBtn = document.getElementById('vp-unsure-btn');
    if (unsureBtn) {
      unsureBtn.addEventListener('click', openModalDuvida);
    }

    // Categorias
    document.querySelectorAll('.cat-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCategory = btn.dataset.cat;
        updateDefinirBtn();
      });
    });

    // Lembretes
    document.querySelectorAll('.reminder-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.reminder-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedReminder = parseInt(btn.dataset.ms, 10);
        updateDefinirBtn();
      });
    });

    // Definir lembrete
    const definirBtn = document.getElementById('definir-btn');
    if (definirBtn) {
      definirBtn.addEventListener('click', () => {
        const nome = document.getElementById('duvida-nome').value.trim();
        const valor = getCurrentValueNumber();
        addQuarentena({
          nome: nome || 'Item sem nome',
          categoria: selectedCategory,
          valor,
          lembrete_timestamp: Date.now() + selectedReminder,
        });
        currentValue = '';
        updateDisplay();
        closeModal('modal-duvida');
      });
    }

    document.getElementById('duvida-nome').addEventListener('input', updateDefinirBtn);

    // Close buttons
    document.querySelectorAll('.modal-close').forEach((btn) => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay');
        if (modal) closeModal(modal.id);
      });
    });
  }

  function updateDefinirBtn() {
    const btn = document.getElementById('definir-btn');
    if (!btn) return;
    btn.disabled = !selectedCategory || !selectedReminder;
  }

  // ─── Economias / Dashboard ────────────────────────────────────────────────
  function renderSavings() {
    const perfil = getPerfil();
    const economias = getEconomias();
    const quarentena = getQuarentena();

    const totalEl = document.getElementById('savings-total');
    if (totalEl) totalEl.textContent = formatBRL(economias.total);

    const horasEl = document.getElementById('savings-horas');
    if (horasEl && perfil) {
      const h = calcHorasGastas(economias.total, perfil.valorHora);
      horasEl.textContent = formatHoras(h);
    }

    // Quarentena lista
    const lista = document.getElementById('quarentena-lista');
    if (lista) {
      lista.innerHTML = '';
      if (quarentena.length === 0) {
        lista.innerHTML = '<p class="empty-state">Nenhum item em quarentena.</p>';
      } else {
        quarentena.forEach((item) => {
          lista.appendChild(buildQuarentenaCard(item));
        });
      }
    }
  }

  function buildQuarentenaCard(item) {
    const agora = Date.now();
    const vencido = item.lembrete_timestamp <= agora;
    const card = document.createElement('div');
    card.className = 'quarentena-card';

    const timeLeft = item.lembrete_timestamp - agora;
    let tempoLabel = '';
    if (vencido) {
      tempoLabel = '<span class="badge-revisar">Revisar</span>';
    } else {
      tempoLabel = formatTimeLeft(timeLeft);
    }

    const catIcon = getCatIcon(item.categoria);

    card.innerHTML = `
      <div class="qcard-header">
        <span class="qcard-icon">${catIcon}</span>
        <div class="qcard-info">
          <span class="qcard-nome">${escapeHtml(item.nome)}</span>
          <span class="qcard-valor">${formatBRL(item.valor)}</span>
        </div>
        <span class="qcard-tempo">${tempoLabel}</span>
      </div>
      <div class="qcard-actions">
        <button class="btn-outline btn-sm" data-action="buy" data-id="${item.id}">Comprar mesmo assim</button>
        <button class="btn-ghost btn-sm" data-action="discard" data-id="${item.id}">Descartar</button>
      </div>
    `;

    card.querySelector('[data-action="buy"]').addEventListener('click', () => {
      addGasto(item.valor);
      removeQuarentena(item.id);
      renderSavings();
    });

    card.querySelector('[data-action="discard"]').addEventListener('click', () => {
      removeQuarentena(item.id);
      renderSavings();
    });

    return card;
  }

  function formatTimeLeft(ms) {
    if (ms <= 0) return 'Vencido';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h >= 24) return Math.floor(h / 24) + 'd';
    if (h > 0) return h + 'h ' + m + 'm';
    return m + 'min';
  }

  function getCatIcon(cat) {
    const icons = { Roupas: '👕', Comida: '🍔', Eletrônicos: '💻', Casa: '🏠', Lazer: '🎮' };
    return icons[cat] || '📦';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function bindQuarentena() {
    // delegação de eventos já feita em buildQuarentenaCard
  }

  // ─── Perfil ───────────────────────────────────────────────────────────────
  function renderProfile() {
    const perfil = getPerfil() || {};
    const economias = getEconomias();
    const quarentena = getQuarentena();
    const envCount = getEnvelopesCount();

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    set('profile-salario', formatBRL(perfil.salario || 0));
    set('profile-horas', (perfil.horas || 0) + 'h/mês');
    set('profile-valor-hora', formatBRL(perfil.valorHora || 0));
    set('profile-total-eco', formatBRL(economias.total));
    set('profile-quarentena-count', quarentena.length);
    set('profile-envelopes', envCount + '/100');
  }

  function bindProfile() {
    const editBtn = document.getElementById('profile-edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        const perfil = getPerfil();
        if (perfil) {
          document.getElementById('setup-salario').value = perfil.salario;
          document.getElementById('setup-horas').value = perfil.horas;
        }
        showScreen('setup');
      });
    }
  }

  // ─── Lembretes ────────────────────────────────────────────────────────────
  function checkLembretes() {
    const vencidos = getLembretesVencidos();
    const toast = document.getElementById('lembrete-toast');
    if (!toast) return;
    if (vencidos.length > 0) {
      toast.textContent = '🔔 Você tem ' + vencidos.length + ' lembrete' + (vencidos.length > 1 ? 's' : '') + ' para revisar!';
      toast.style.display = 'block';
      toast.addEventListener('click', () => {
        showScreen('savings');
        toast.style.display = 'none';
      }, { once: true });
    } else {
      toast.style.display = 'none';
    }
  }

  // ─── Modal utils ──────────────────────────────────────────────────────────
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  // ─── Confetti ─────────────────────────────────────────────────────────────
  function showConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    container.innerHTML = '';
    const colors = CONFETTI_COLORS;
    for (let i = 0; i < 40; i++) {
      const dot = document.createElement('div');
      dot.className = 'confetti-dot';
      dot.style.left = Math.random() * 100 + '%';
      dot.style.background = colors[Math.floor(Math.random() * colors.length)];
      dot.style.animationDelay = Math.random() * 0.5 + 's';
      dot.style.animationDuration = (0.8 + Math.random() * 0.6) + 's';
      container.appendChild(dot);
    }
    container.style.display = 'block';
    setTimeout(() => { container.style.display = 'none'; container.innerHTML = ''; }, 1800);
  }
})();
