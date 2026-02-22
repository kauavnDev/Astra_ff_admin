/**
 * ASTRA ELITE ENGINE v3.0
 * Core: Gerenciamento de Estado e Processamento de Pontos
 */

// 1. ESTADO GLOBAL DA APLICAÇÃO
let astraDB = {
    config: {
        modo: "SOLO",
        quedaAtual: 1,
        isBooted: false
    },
    competidores: [],
    tabelaPontos: {
        1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 
        7: 4, 8: 3, 9: 2, 10: 1, 11: 0, 12: 0
    }
};

// 2. INICIALIZAÇÃO E RELÓGIO
document.addEventListener('DOMContentLoaded', () => {
    // Iniciar Relógio do HUD
    setInterval(updateClock, 1000);
    console.log("[SISTEMA] Astra Elite pronto para inicialização.");
});

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', { hour12: false });
    const clockEl = document.getElementById('digital-clock');
    if(clockEl) clockEl.innerText = timeString;
}

// 3. SELEÇÃO DE PROTOCOLO (MODO DE JOGO)
function selectProtocol(modo, element) {
    astraDB.config.modo = modo;
    
    // UI Update
    document.querySelectorAll('.mode-card').forEach(card => card.classList.remove('active'));
    element.classList.add('active');
    
    // Toast informativo
    showToast(`Protocolo ${modo} selecionado.`);
}

// 4. BOOT DO SISTEMA (PROCESSAR LISTA)
function bootSystem() {
    const input = document.getElementById('master-input').value;
    
    if(!input.trim()) {
        showToast("ERRO: Lista master vazia!", "danger");
        return;
    }

    // Processamento da lista com Regex para remover numeração automática
    const linhas = input.split('\n').filter(l => l.trim() !== "");
    
    astraDB.competidores = linhas.map((linha, index) => {
        const nomeLimpo = linha.replace(/^[0-9]+[\s-]*\.*[\s-]*\)*\s*/, '').trim().toUpperCase();
        return {
            id: index,
            nome: nomeLimpo,
            pago: false,
            nicks: "",
            pontosTotal: 0,
            killsTotal: 0,
            booyahs: 0,
            posicoes: [] // Histórico de posições
        };
    });

    // Atualizar HUD
    document.getElementById('hud-mode').innerText = astraDB.config.modo;
    
    // Transição de Interface
    document.getElementById('welcome-modal').classList.add('hidden');
    document.getElementById('app-interface').classList.remove('hidden');
    
    renderSlots();
    updateStats();
    showToast("Sistema inicializado com sucesso.");
}

// 5. RENDERIZAÇÃO DOS SLOTS
function renderSlots() {
    const grid = document.getElementById('slots-grid');
    grid.innerHTML = ""; // Limpar grid

    astraDB.competidores.forEach(comp => {
        const card = document.createElement('div');
        card.className = 'slot-card-elite';
        card.innerHTML = `
            <div class="slot-header-ui">
                <span class="slot-number">SLOT #${String(comp.id + 1).padStart(2, '0')}</span>
                <div class="status-toggle ${comp.pago ? 'paid' : 'pending'}" onclick="togglePayment(${comp.id})">
                    ${comp.pago ? 'PAGO' : 'PENDENTE'}
                </div>
            </div>
            <h3 style="margin-bottom:10px; font-weight:800;">${comp.nome}</h3>
            <input type="text" placeholder="Nicks dos jogadores..." value="${comp.nicks}" 
                   onchange="astraDB.competidores[${comp.id}].nicks = this.value">
            
            <div class="points-input-group">
                <div>
                    <label class="label-tech">Posição</label>
                    <input type="number" id="pos_${comp.id}" min="1" max="12" placeholder="Ex: 1">
                </div>
                <div>
                    <label class="label-tech">Kills</label>
                    <input type="number" id="kill_${comp.id}" min="0" placeholder="Ex: 5">
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 6. LÓGICA DE PAGAMENTO
function togglePayment(id) {
    astraDB.competidores[id].pago = !astraDB.competidores[id].pago;
    renderSlots();
    updateStats();
}

function updateStats() {
    const pagos = astraDB.competidores.filter(c => c.pago).length;
    document.getElementById('stat-paid').innerText = pagos;
    document.getElementById('stat-pending').innerText = astraDB.competidores.length - pagos;
}

// 7. PROCESSAMENTO DE QUEDAS (ROUND)
function confirmRound() {
    if(!confirm(`Deseja encerrar a Queda #${astraDB.config.quedaAtual}?`)) return;

    astraDB.competidores.forEach(comp => {
        const posInput = document.getElementById(`pos_${comp.id}`);
        const killInput = document.getElementById(`kill_${comp.id}`);
        
        const pos = parseInt(posInput.value) || 12;
        const kills = parseInt(killInput.value) || 0;

        // Cálculo de Pontuação (Posição + Kills)
        const ptsRodada = (astraDB.tabelaPontos[pos] || 0) + kills;
        
        comp.pontosTotal += ptsRodada;
        comp.killsTotal += kills;
        if(pos === 1) comp.booyahs++;

        // Resetar inputs para a próxima
        posInput.value = "";
        killInput.value = "";
    });

    astraDB.config.quedaAtual++;
    document.getElementById('hud-round').innerText = String(astraDB.config.quedaAtual).padStart(2, '0');
    
    updateRanking();
    showToast(`Queda processada. Iniciando Sala #${astraDB.config.quedaAtual}`);
}

// 8. ATUALIZAÇÃO DO RANKING (LEADERBOARD)
function updateRanking() {
    const container = document.getElementById('ranking-container');
    
    // Sort por: Pontos > Booyahs > Kills
    const ranking = [...astraDB.competidores].sort((a, b) => {
        return b.pontosTotal - a.pontosTotal || b.booyahs - a.booyahs || b.killsTotal - a.killsTotal;
    });

    container.innerHTML = `
        <table class="ranking-table-ui">
            <thead>
                <tr>
                    <th>POS</th>
                    <th>TIME</th>
                    <th>K</th>
                    <th>PTS</th>
                </tr>
            </thead>
            <tbody>
                ${ranking.map((t, i) => `
                    <tr>
                        <td class="rank-pos">${i + 1}º</td>
                        <td>${t.nome} ${t.booyahs > 0 ? '🏆'.repeat(t.booyahs) : ''}</td>
                        <td>${t.killsTotal}</td>
                        <td style="color:var(--accent-blue); font-weight:bold;">${t.pontosTotal}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    // Mostrar a área de ranking caso esteja oculta
    document.getElementById('ranking-area').classList.remove('hidden');
}

// 9. UTILITÁRIOS: BUSCA, TOAST E WHATSAPP
function filterSlots() {
    const termo = document.getElementById('global-search').value.toUpperCase();
    const cards = document.querySelectorAll('.slot-card-elite');
    
    astraDB.competidores.forEach((comp, index) => {
        const matches = comp.nome.includes(termo) || comp.nicks.toUpperCase().includes(termo);
        cards[index].style.display = matches ? "block" : "none";
    });
}

function copyRanking() {
    let txt = `🏆 *RANKING ATUALIZADO - SALA ${astraDB.config.quedaAtual - 1}* 🏆\n\n`;
    const sorted = [...astraDB.competidores].sort((a,b) => b.pontosTotal - a.pontosTotal);
    
    sorted.forEach((t, i) => {
        txt += `${i+1}º *${t.nome}* - ${t.pontosTotal} pts\n`;
    });

    navigator.clipboard.writeText(txt).then(() => {
        showToast("Copiado para o Clipboard!");
    });
}

function showToast(msg, type = "success") {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.style.cssText = `
        background: ${type === 'danger' ? 'var(--danger)' : 'var(--bg-card)'};
        color: white; border: 1px solid var(--accent-blue);
        padding: 12px 25px; border-radius: 8px; margin-top: 10px;
        font-family: var(--font-tech); font-size: 0.7rem;
        animation: bootUp 0.3s ease; box-shadow: 0 0 15px rgba(0,0,0,0.5);
    `;
    toast.innerText = `> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function toggleSettings() {
    showToast("Acesso ao kernel não autorizado.", "danger");
}
