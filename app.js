import { AppState, updateState, Storage, resetState } from './storage.js';
import { Views } from './components.js';

const DOM = {
    content: document.getElementById('main-content'),
    navItems: document.querySelectorAll('.nav-item'),
    setup: document.getElementById('setup-overlay'),
    tutorial: document.getElementById('tutorial-modal'),
    decisionModal: document.getElementById('decision-modal'),
    waitModal: document.getElementById('wait-modal'),
    challengeModal: document.getElementById('challenge-config-modal'),
    modalHours: document.getElementById('modal-hours-display'),
    toastContainer: document.getElementById('toast-container')
};

let currentInput = "0";
let selectedWaitHours = 24;
let selectedCategory = { name: 'Lazer', emoji: '🏖️' };
let activeInterval = null;

function init() {
    checkOnboarding();
    requestNotificationPermission();
    render('calc');
    setupGlobalListeners();
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-message ${type} shadow-lg`;
    toast.innerHTML = `
        <div class="flex items-center gap-2">
            <i data-lucide="${type === 'success' ? 'check-circle' : (type === 'wait' ? 'clock' : 'alert-circle')}" class="w-4 h-4"></i>
            <span>${message}</span>
        </div>
    `;
    DOM.toastContainer.appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
}

function checkOnboarding() {
    if (!AppState.settings.hourlyRate || AppState.settings.hourlyRate === 0) {
        DOM.setup.classList.remove('hidden');
    } else if (!AppState.onboarded) {
        DOM.tutorial.classList.remove('hidden');
    }
}

function render(viewName) {
    if (activeInterval) clearInterval(activeInterval);
    
    DOM.content.innerHTML = Views[viewName](AppState);
    lucide.createIcons();

    if (viewName === 'calc') setupCalcKeypad();
    if (viewName === 'envelopes') setupEnvelopeLogic();
    if (viewName === 'history') setupHistoryLogic();
    if (viewName === 'config') setupConfigLogic();

    DOM.navItems.forEach(nav => {
        const isActive = nav.dataset.nav === viewName;
        nav.classList.toggle('active', isActive);
        if (isActive && nav.querySelector('i')) {
            nav.querySelector('i').classList.add('text-black');
            nav.querySelector('i').classList.remove('text-gray-300');
        } else if (nav.querySelector('i')) {
            nav.querySelector('i').classList.remove('text-black');
            nav.querySelector('i').classList.add('text-gray-300');
        }
    });
}

function setupConfigLogic() {
    const salInput = document.getElementById('cfg-salary');
    const hrsInput = document.getElementById('cfg-hours');
    const rateDisplay = document.getElementById('cfg-rate-display');

    const updateRate = () => {
        const s = parseFloat(salInput.value) || 0;
        const h = parseFloat(hrsInput.value) || 0;
        const rate = h > 0 ? s / h : 0;
        rateDisplay.innerText = `R$ ${rate.toFixed(2)}`;
        
        const newSettings = { salary: s, hours: h, hourlyRate: rate };
        updateState('settings', newSettings);
    };

    salInput.oninput = updateRate;
    hrsInput.oninput = updateRate;

    document.getElementById('btn-export-data').onclick = () => {
        const dataStr = JSON.stringify(AppState, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `cuanto-custa-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        showToast("Dados exportados com sucesso!");
    };

    document.getElementById('btn-import-trigger').onclick = () => {
        document.getElementById('import-file-input').click();
    };

    document.getElementById('import-file-input').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (importedData.settings && importedData.envelopes) {
                    Storage.save(importedData);
                    window.location.reload();
                } else {
                    showToast("Arquivo inválido.", "error");
                }
            } catch (err) {
                showToast("Erro ao ler arquivo.", "error");
            }
        };
        reader.readAsText(file);
    };

    document.getElementById('btn-reset-app').onclick = () => {
        if (confirm("Isso apagará permanentEMENTE todos os seus dados e histórico. Tem certeza?")) {
            resetState();
            window.location.reload();
        }
    };
}

function setupCalcKeypad() {
    const display = document.getElementById('calc-display');
    const hoursText = document.getElementById('calc-hours-sub');
    currentInput = "0";

    document.querySelectorAll('.keypad-btn').forEach(btn => {
        btn.onclick = () => {
            const val = btn.dataset.val;
            
            if (val === 'del') {
                currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : "0";
            } else if (val === '.') {
                if (!currentInput.includes('.')) currentInput += '.';
            } else {
                if (currentInput === "0") currentInput = val;
                else if (currentInput.length < 10) currentInput += val;
            }

            const numericValue = parseFloat(currentInput);
            display.innerText = numericValue.toLocaleString('pt-BR', { minimumFractionDigits: currentInput.includes('.') ? 2 : 0 });
            
            const hours = (numericValue / (AppState.settings.hourlyRate || 1)).toFixed(1);
            hoursText.innerText = `${hours} horas de trabalho`;
        };
    });

    document.getElementById('btn-open-decision').onclick = () => {
        const val = parseFloat(currentInput);
        if (val <= 0) return;
        
        const hours = (val / AppState.settings.hourlyRate).toFixed(1);
        DOM.modalHours.innerText = hours;
        DOM.decisionModal.classList.remove('hidden');
    };
}

function setupHistoryLogic() {
    document.querySelectorAll('.btn-delete-decision').forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.dataset.id);
            const newList = AppState.decisions.filter(d => d.id !== id);
            updateState('decisions', newList);
            render('history');
        };
    });

    document.querySelectorAll('.btn-delete-waiting').forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.dataset.id);
            const newList = AppState.waitingItems.filter(i => i.id !== id);
            updateState('waitingItems', newList);
            render('history');
        };
    });

    document.querySelectorAll('.btn-decide-waiting').forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.dataset.id);
            const item = AppState.waitingItems.find(i => i.id === id);
            if (item) {
                currentInput = item.price.toString();
                const hours = (item.price / AppState.settings.hourlyRate).toFixed(1);
                DOM.modalHours.innerText = hours;
                

                window._pendingWaitContext = {
                    description: item.description,
                    category: item.category,
                    impulse: item.impulse
                };

                DOM.decisionModal.classList.remove('hidden');
                
                const newList = AppState.waitingItems.filter(i => i.id !== id);
                updateState('waitingItems', newList);
            }
        };
    });

    activeInterval = setInterval(() => {
        if (document.querySelector('[data-waiting-section]')) {
            const now = Date.now();
            let changed = false;
            AppState.waitingItems.forEach(item => {
                const el = document.getElementById(`timer-${item.id}`);
                if (el) {
                    const diff = item.targetTime - now;
                    if (diff <= 0) {
                        el.innerText = "PRONTO!";
                        el.classList.add('text-[#39D353]');
                        if (!item.notified) {
                            showToast(`Hora de decidir: ${item.description || 'Item'}`, 'wait');
                            item.notified = true;
                            changed = true;
                        }
                    } else {
                        const hours = Math.floor(diff / (1000 * 60 * 60));
                        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        el.innerText = hours >= 24 ? `${Math.floor(hours/24)}d ${hours%24}h` : `${hours}h ${mins}m`;
                    }
                }
            });
            if (changed) updateState('waitingItems', AppState.waitingItems);
        }
    }, 1000);
}

function setupEnvelopeLogic() {
    document.querySelectorAll('.envelope').forEach(env => {
        env.onclick = () => {
            const idx = parseInt(env.dataset.idx);
            toggleEnvelope(idx);
        };
    });

    document.getElementById('btn-lucky-draw').onclick = () => {
        const availableIdx = AppState.envelopes.map((v, i) => v ? null : i).filter(v => v !== null);
        if (availableIdx.length === 0) return;

        const luckyIdx = availableIdx[Math.floor(Math.random() * availableIdx.length)];
        const luckyEl = document.querySelector(`.envelope[data-idx="${luckyIdx}"]`);
        
        luckyEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        luckyEl.classList.add('lucky-glow');
        
        setTimeout(() => luckyEl.classList.remove('lucky-glow'), 3000);
    };

    document.getElementById('btn-open-challenge-settings').onclick = () => {
        DOM.challengeModal.classList.remove('hidden');
        document.getElementById('challenge-goal-input').value = AppState.challengeSettings.targetGoal;
    };
}

function toggleEnvelope(idx) {
    const current = [...AppState.envelopes];
    const wasFilled = current[idx];
    current[idx] = !wasFilled;
    
    updateState('envelopes', current);
    
    if (!wasFilled) {
        showToast(`Economia de R$ ${AppState.challengeSettings.envelopeValues[idx]} adicionada!`, 'success');
    }
    render('envelopes');
}

function recomputeChallenge(target, strategy) {
    let newValues = [];
    if (strategy === 'more_envelopes') {
        let n = 1; let sum = 0;
        while (sum < target) {
            sum += n; newValues.push(n); n++;
        }
    } else {
        const baseSum = 5050; 
        const scale = target / baseSum;
        newValues = Array.from({ length: 100 }, (_, i) => Math.round((i + 1) * scale));
    }

    updateState('challengeSettings', { targetGoal: target, strategy: strategy, envelopeValues: newValues });
    updateState('envelopes', Array(newValues.length).fill(false));
    
    DOM.challengeModal.classList.add('hidden');
    render('envelopes');
}

function setupGlobalListeners() {
    DOM.navItems.forEach(btn => {
        btn.onclick = () => render(btn.dataset.nav);
    });

    document.getElementById('btn-save-setup').onclick = () => {
        const sal = parseFloat(document.getElementById('input-salary').value);
        const hrs = parseFloat(document.getElementById('input-hours').value);
        if (sal > 0 && hrs > 0) {
            updateState('settings', { salary: sal, hours: hrs, hourlyRate: sal / hrs });
            DOM.setup.classList.add('hidden');
            if (!AppState.onboarded) DOM.tutorial.classList.remove('hidden');
            else render('calc');
        }
    };

    document.getElementById('btn-close-tutorial').onclick = () => {
        updateState('onboarded', true);
        DOM.tutorial.classList.add('hidden');
        render('calc');
    };

    document.getElementById('btn-save-challenge').onclick = () => {
        const target = parseFloat(document.getElementById('challenge-goal-input').value);
        const strategy = document.getElementById('challenge-strategy-select').value;
        if (target > 0) recomputeChallenge(target, strategy);
    };

    document.getElementById('btn-confirm-buy').onclick = () => recordDecision('buy');
    document.getElementById('btn-confirm-skip').onclick = () => recordDecision('skip');
    document.getElementById('btn-confirm-wait').onclick = () => {
        DOM.decisionModal.classList.add('hidden');
        DOM.waitModal.classList.remove('hidden');
    };


    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedCategory = { name: btn.dataset.cat, emoji: btn.dataset.emoji };
        };
    });

    document.querySelector('.cat-btn[data-cat="Lazer"]').classList.add('selected');


    document.querySelectorAll('.wait-option-small').forEach(opt => {
        opt.onclick = () => {
            document.querySelectorAll('.wait-option-small').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedWaitHours = parseInt(opt.dataset.hours);
        };
    });


    const impulseSlider = document.getElementById('wait-impulse');
    const impulseLabel = document.getElementById('impulse-label');
    impulseSlider.oninput = (e) => {
        impulseLabel.innerText = `Quer ${6 - e.target.value} / Precisa ${e.target.value}`;
    };

    document.getElementById('final-confirm-wait').onclick = () => {
        const price = parseFloat(currentInput);
        const desc = document.getElementById('wait-description').value || 'Novo Item';
        const impulse = document.getElementById('wait-impulse').value;
        
        const waitItem = {
            id: Date.now(),
            price: price,
            description: desc,
            category: selectedCategory,
            impulse: impulse,
            hours: (price / AppState.settings.hourlyRate).toFixed(1),
            targetTime: Date.now() + (selectedWaitHours * 60 * 60 * 1000),
            notified: false
        };
        updateState('waitingItems', [...AppState.waitingItems, waitItem]);
        DOM.waitModal.classList.add('hidden');
        showToast("Reflexão iniciada!", "wait");
        render('history');
    };

    window.onclick = (event) => {
        if (event.target == DOM.decisionModal) DOM.decisionModal.classList.add('hidden');
        if (event.target == DOM.waitModal) DOM.waitModal.classList.add('hidden');
        if (event.target == DOM.challengeModal) DOM.challengeModal.classList.add('hidden');
    };
}

function recordDecision(action) {
    const price = parseFloat(currentInput);
    const context = window._pendingWaitContext || {};
    
    const decision = {
        id: Date.now(),
        price: price,
        hours: (price / AppState.settings.hourlyRate).toFixed(1),
        description: context.description || 'Compra Manual',
        category: context.category || { emoji: '💰', name: 'Geral' },
        impulse: context.impulse || 3,
        action: action,
        timestamp: Date.now()
    };
    
    updateState('decisions', [...AppState.decisions, decision]);
    window._pendingWaitContext = null;

    if (action === 'skip') {
        showToast(`Economizou R$ ${price.toLocaleString('pt-BR')}`, 'success');
    }

    DOM.decisionModal.classList.add('hidden');
    render('history');
}

init();
