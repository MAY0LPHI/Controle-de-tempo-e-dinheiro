export const Views = {
    history: (state) => {
        const skippedTotal = state.decisions
            .filter(d => d.action === 'skip')
            .reduce((acc, curr) => acc + curr.price, 0);
        
        const envelopeTotal = state.envelopes.reduce((acc, curr, idx) => {
            return curr ? acc + (state.challengeSettings.envelopeValues[idx] || 0) : acc;
        }, 0);
        
        const totalSaved = skippedTotal + envelopeTotal;
        const hoursSaved = (totalSaved / (state.settings.hourlyRate || 1)).toFixed(1);

        const formatTimeLeft = (target) => {
            const diff = target - Date.now();
            if (diff <= 0) return "Pronto para decidir!";
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            if (hours >= 24) return `${Math.floor(hours/24)}d ${hours%24}h restantes`;
            return `${hours}h ${mins}m restantes`;
        };

        return `
        <div class="fade-in">
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h2 class="text-3xl font-extrabold tracking-tight">Painel</h2>
                    <p class="text-gray-400 text-sm font-medium">Sua jornada financeira</p>
                </div>
                <div class="icon-blob">
                    <i data-lucide="zap" class="text-[#39D353] w-6 h-6"></i>
                </div>
            </div>

            <div class="bg-[#F8F9FA] rounded-[32px] p-8 mb-8 border border-gray-100 shadow-sm relative overflow-hidden">
                <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-[#39D353]/5 rounded-full blur-2xl"></div>
                <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Economia Total</p>
                <div class="flex items-baseline gap-2 mb-1">
                    <span class="text-4xl font-extrabold tracking-tighter">R$ ${totalSaved.toLocaleString('pt-BR')}</span>
                </div>
                <p class="text-sm font-bold text-[#39D353] flex items-center gap-1">
                    <i data-lucide="trending-up" class="w-4 h-4"></i>
                    + ${hoursSaved}h de vida recuperadas
                </p>
            </div>

            ${state.waitingItems.length > 0 ? `
            <div class="mb-10" data-waiting-section>
                <div class="flex justify-between items-center mb-4 px-1">
                    <h3 class="font-extrabold text-lg flex items-center gap-2">
                        Em Espera
                        <span class="bg-[#39D353] text-black text-[10px] px-2.5 py-1 rounded-full font-black">${state.waitingItems.length}</span>
                    </h3>
                </div>
                <div class="space-y-4">
                    ${state.waitingItems.map(item => `
                        <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-[24px] border border-gray-100 relative overflow-hidden transition-all hover:border-gray-200">
                            <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                                <i data-lucide="clock" class="w-5 h-5 ${item.targetTime <= Date.now() ? 'text-[#39D353]' : 'text-gray-300'}"></i>
                            </div>
                            <div class="flex-1">
                                <p class="font-bold text-sm">R$ ${item.price.toLocaleString('pt-BR')}</p>
                                <p class="text-[10px] ${item.targetTime <= Date.now() ? 'text-[#39D353]' : 'text-gray-400'} font-bold uppercase">
                                    ${formatTimeLeft(item.targetTime)}
                                </p>
                            </div>
                            <div class="flex items-center gap-2">
                                <button data-id="${item.id}" class="btn-decide-waiting p-2 bg-black text-white rounded-xl active:scale-90 transition-transform">
                                    <i data-lucide="check" class="w-4 h-4"></i>
                                </button>
                                <button data-id="${item.id}" class="btn-delete-waiting p-2 bg-gray-200/50 text-gray-400 rounded-xl active:scale-90 transition-all">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <div class="space-y-6">
                <div class="flex justify-between items-center px-1">
                    <h3 class="font-extrabold text-lg">Histórico</h3>
                    <button class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Atividade Recente</button>
                </div>
                
                ${state.decisions.length ? state.decisions.slice().reverse().map(d => `
                    <div class="flex items-center gap-4 group">
                        <div class="w-12 h-12 rounded-2xl ${d.action === 'skip' ? 'bg-[#39D353]/10 text-[#39D353]' : 'bg-gray-100 text-gray-400'} flex items-center justify-center shrink-0">
                            <i data-lucide="${d.action === 'skip' ? 'shield-check' : 'shopping-bag'}" class="w-5 h-5"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-bold text-sm">R$ ${d.price.toLocaleString('pt-BR')}</p>
                            <p class="text-[10px] text-gray-400 font-bold uppercase">${new Date(d.timestamp).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="text-right">
                                <p class="text-[10px] font-extrabold ${d.action === 'skip' ? 'text-[#39D353]' : 'text-gray-400'} uppercase tracking-tighter">
                                    ${d.action === 'skip' ? 'Poupado' : 'Comprado'}
                                </p>
                            </div>
                            <button data-id="${d.id}" class="btn-delete-decision p-2 text-gray-200 hover:text-red-400 transition-colors">
                                <i data-lucide="x" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                `).join('') : `
                    <div class="text-center py-12 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100">
                        <p class="text-gray-400 font-medium text-sm">Sua jornada começa aqui.</p>
                    </div>
                `}
            </div>
        </div>
        `;
    },

    calc: (state) => `
        <div class="fade-in flex flex-col h-full">
            <div class="text-center mb-8">
                <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Quanto isso custa em vida?</p>
                <div class="flex justify-center items-baseline gap-1 mb-2">
                    <span class="text-2xl font-bold text-gray-200">R$</span>
                    <span id="calc-display" class="text-6xl font-extrabold tracking-tighter">0</span>
                </div>
                <p id="calc-hours-sub" class="text-sm font-bold text-[#39D353]">0 horas de trabalho</p>
            </div>

            <div class="grid grid-cols-3 gap-3 mb-8 px-2">
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `
                    <button class="keypad-btn bg-white border border-gray-50 shadow-sm" data-val="${n}">${n}</button>
                `).join('')}
                <button class="keypad-btn bg-white border border-gray-50 shadow-sm" data-val=".">,</button>
                <button class="keypad-btn bg-white border border-gray-50 shadow-sm" data-val="0">0</button>
                <button class="keypad-btn bg-gray-50 text-gray-400" data-val="del">
                    <i data-lucide="delete" class="w-6 h-6"></i>
                </button>
            </div>

            <button id="btn-open-decision" class="w-full py-6 bg-black text-white rounded-[28px] font-extrabold text-lg shadow-xl active:scale-[0.98] transition-transform">
                Analisar Compra
            </button>
        </div>
    `,

    envelopes: (state) => {
        const totalSaved = state.envelopes.reduce((acc, curr, idx) => {
            return curr ? acc + (state.challengeSettings.envelopeValues[idx] || 0) : acc;
        }, 0);
        const count = state.envelopes.filter(v => v).length;
        const totalEnvelopes = state.challengeSettings.envelopeValues.length;
        const target = state.challengeSettings.targetGoal;
        const progress = Math.min(100, (totalSaved / target * 100)).toFixed(1);
        const remaining = target - totalSaved;
        const avg = (target / totalEnvelopes).toFixed(2);

        let badge = { label: 'Iniciante', icon: 'award' };
        if (progress >= 30) badge = { label: 'Poupador Focado', icon: 'shield-check' };
        if (progress >= 70) badge = { label: 'Mestre das Finanças', icon: 'crown' };
        if (progress >= 100) badge = { label: 'Lenda da Economia', icon: 'zap' };

        return `
        <div class="fade-in pb-12">
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h2 class="text-3xl font-extrabold tracking-tight">Desafio</h2>
                    <p class="text-gray-400 text-sm font-medium">Economia Inteligente</p>
                </div>
                <div class="flex gap-2">
                    <button id="btn-lucky-draw" class="w-12 h-12 bg-[#39D353]/10 rounded-2xl flex items-center justify-center text-[#39D353] active:scale-90 transition-transform">
                        <i data-lucide="dices" class="w-6 h-6"></i>
                    </button>
                    <button id="btn-open-challenge-settings" class="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 active:scale-90 transition-transform">
                        <i data-lucide="settings-2" class="w-6 h-6"></i>
                    </button>
                </div>
            </div>
            
            <div class="bg-black rounded-[32px] p-8 mb-6 shadow-2xl relative overflow-hidden">
                <div class="absolute -right-8 -top-8 w-32 h-32 bg-[#39D353]/10 rounded-full blur-3xl"></div>
                
                <div class="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <p class="text-[10px] uppercase font-bold text-gray-500 mb-1">Total Acumulado</p>
                        <p class="text-4xl font-extrabold text-white tracking-tighter">R$ <span id="env-total-display">${totalSaved.toLocaleString('pt-BR')}</span></p>
                    </div>
                    <div class="bg-[#39D353]/20 border border-[#39D353]/30 px-3 py-1.5 rounded-full flex items-center gap-2">
                        <i data-lucide="${badge.icon}" class="w-3.5 h-3.5 text-[#39D353]"></i>
                        <span class="text-[9px] font-black text-[#39D353] uppercase tracking-wider">${badge.label}</span>
                    </div>
                </div>

                <div class="w-full bg-white/10 h-2.5 rounded-full overflow-hidden relative z-10">
                    <div id="challenge-progress-bar" class="bg-[#39D353] h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(57,211,83,0.5)]" style="width: ${progress}%"></div>
                </div>
                
                <div class="flex justify-between mt-4">
                     <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">${count}/${totalEnvelopes} Envelopes</p>
                     <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Meta: R$ ${target.toLocaleString('pt-BR')}</p>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-3 mb-8">
                <div class="bg-gray-50 p-4 rounded-[24px] border border-gray-100">
                    <p class="text-[8px] font-bold text-gray-400 uppercase mb-1">Faltam</p>
                    <p class="text-xs font-extrabold truncate">R$ ${Math.max(0, remaining).toLocaleString('pt-BR')}</p>
                </div>
                <div class="bg-gray-50 p-4 rounded-[24px] border border-gray-100">
                    <p class="text-[8px] font-bold text-gray-400 uppercase mb-1">Média</p>
                    <p class="text-xs font-extrabold">R$ ${avg}</p>
                </div>
                <div class="bg-gray-50 p-4 rounded-[24px] border border-gray-100">
                    <p class="text-[8px] font-bold text-gray-400 uppercase mb-1">Progresso</p>
                    <p class="text-xs font-extrabold text-[#39D353]">${progress}%</p>
                </div>
            </div>

            <div class="envelope-grid">
                ${state.challengeSettings.envelopeValues.map((val, i) => `
                    <div class="envelope ${state.envelopes[i] ? 'filled' : ''}" data-idx="${i}">
                        <span class="envelope-val-label">R$</span>
                        <span class="envelope-val-amount">${val}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    },

    config: (state) => `
        <div class="fade-in pb-12">
             <div class="flex items-center justify-between mb-8">
                <div>
                    <h2 class="text-3xl font-extrabold tracking-tight">Ajustes</h2>
                    <p class="text-gray-400 text-sm font-medium">Sincronização e Perfil</p>
                </div>
                <div class="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                    <i data-lucide="sliders" class="text-gray-400 w-6 h-6"></i>
                </div>
            </div>

            <div class="space-y-6">
                <!-- Profile Section -->
                <div class="p-8 bg-black rounded-[40px] shadow-xl relative overflow-hidden">
                    <div class="absolute -right-8 -top-8 w-32 h-32 bg-[#39D353]/10 rounded-full blur-3xl"></div>
                    
                    <div class="mb-6 relative z-10\">\n                        <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Configurações de Ganhos</label>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-[9px] text-gray-400 uppercase font-black">Salário (R$)</label>
                                <input id="cfg-salary" type="number" value="${state.settings.salary}" class="w-full bg-white/5 border-none outline-none text-white font-bold text-xl py-2 rounded-lg">
                            </div>
                            <div>
                                <label class="text-[9px] text-gray-400 uppercase font-black">Horas/Mês</label>
                                <input id="cfg-hours" type="number" value="${state.settings.hours}" class="w-full bg-white/5 border-none outline-none text-white font-bold text-xl py-2 rounded-lg">
                            </div>
                        </div>
                    </div>

                    <div class="pt-6 border-t border-white/10 flex items-center justify-between relative z-10">
                        <div>
                            <p class="text-[10px] text-gray-500 uppercase font-black">Valor da Hora</p>
                            <p id="cfg-rate-display" class="text-2xl font-extrabold text-[#39D353]">R$ ${state.settings.hourlyRate.toFixed(2)}</p>
                        </div>
                        <div class="w-12 h-12 bg-[#39D353] rounded-2xl flex items-center justify-center">
                            <i data-lucide="clock" class="text-black w-6 h-6"></i>
                        </div>
                    </div>
                </div>

                <!-- Backup Section -->
                <div class="space-y-3">
                    <h3 class="text-xs font-black text-gray-400 uppercase tracking-widest px-2 mb-2">Backup de Dados</h3>
                    <div class="grid grid-cols-2 gap-3">
                        <button id="btn-export-data" class="flex flex-col items-center gap-2 p-5 bg-white border border-gray-100 rounded-[28px] hover:bg-gray-50 transition-colors shadow-sm">
                            <i data-lucide="download" class="text-[#39D353] w-5 h-5"></i>
                            <span class="text-[10px] font-black uppercase">Exportar</span>
                        </button>
                        <button id="btn-import-trigger" class="flex flex-col items-center gap-2 p-5 bg-white border border-gray-100 rounded-[28px] hover:bg-gray-50 transition-colors shadow-sm relative overflow-hidden">
                            <i data-lucide="upload" class="text-blue-500 w-5 h-5"></i>
                            <span class="text-[10px] font-black uppercase">Importar</span>
                            <input type="file" id="import-file-input" class="hidden" accept=".json">
                        </button>
                    </div>
                </div>

                <!-- Danger Zone -->
                <div class="pt-6">
                    <button id="btn-reset-app" class="w-full py-5 border-2 border-red-50/50 text-red-500 rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                        Resetar App
                    </button>
                </div>

                <div class="text-center pt-8">
                    <p class="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-2">CuantoCusta</p>
                    <p class="text-[10px] text-gray-400 font-medium">Versão 2.1.0 • Dados Locais</p>
                </div>
            </div>
        </div>
    `
};
