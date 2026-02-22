/**
 * ASTRA ADMIN ENGINE v4.0
 * Foco: Painel Único, Minimização e Gestão de Pontos
 */

// 1. ESTADO DA APLICAÇÃO
let astraState = {
    modo: 'SOLO',
    queda: 1,
    times: [],
    pontuacao: { 1:12, 2:9, 3:8, 4:7, 5:6, 6:5, 7:4, 8:3, 9:2, 10:1, 11:0, 12:0 }
};

// 2. NAVEGAÇÃO ENTRE SEÇÕES
function showSection(sectionId) {
    // Esconder todas as seções
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    // Remover active de todos os itens do menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });

    // Mostrar a seção desejada
    document.getElementById(`section-${sectionId}`).classList.add('active');
    
    // Ativar item no menu (procurar pelo texto ou ícone se necessário)
    // Simplificado: assume ordem fixa para exemplo
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.style.width = sidebar.style.width === '80px' ? '260px' : '80px';
}

// 3. CONFIGURAÇÃO INICIAL
function setMode(m, btn) {
    astraState.modo = m;
    document.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('current-mode').innerText = m;
}

function startApp() {
    const input = document.getElementById('list-input').value;
    if (!input.trim()) return alert("Cole a lista primeiro!");

    const linhas = input.split('\n').filter(l => l.trim() !== "");
    
    astraState.times = linhas.map((linha, index) => ({
        id: index,
        nome: linha.replace(/^[0-9]+[\s-]*\.*[\s-]*\)*\s*/, '').trim().toUpperCase(),
        pago: false,
        nicks: "",
        pontos: 0,
        kills: 0,
        booyahs: 0,
        minimizado: false
    }));

    renderSlots();
    showSection('panel'); // Vai direto para o painel após gerar
}

// 4. GESTÃO DOS SLOTS (PAINEL ÚNICO)
function renderSlots() {
    const container = document.getElementById('slots-container');
    container.innerHTML = "";

    astraState.times.forEach(t => {
        const div = document.createElement('div');
        div.className = `slot-card ${t.minimizado ? 'minimized' : ''}`;
        div.innerHTML = `
            <div class="slot-header" onclick="toggleMinimize(${t.id})">
                <span class="slot-title">#${String(t.id + 1).padStart(2, '0')} - ${t.nome}</span>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span class="status-badge ${t.pago ? 'pago' : 'pendente'}" onclick="event.stopPropagation(); togglePay(${t.id})">
                        ${t.pago ? 'PAGO' : 'PENDENTE'}
                    </span>
                    <i class="ph ph-caret-${t.minimizado ? 'down' : 'up'}"></i>
                </div>
            </div>
            <div class="slot-body">
                <input type="text" placeholder="Nicks/Observações" value="${t.nicks}" 
                       onchange="astraState.times[${t.id}].nicks = this.value" style="margin-bottom: 15px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <input type="number" id="pos_${t.id}" placeholder="Posição (1-12)">
                    <input type="number" id="kill_${t.id}" placeholder="Kills">
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function toggleMinimize(id) {
    astraState.times[id].minimizado = !astraState.times[id].minimizado;
    renderSlots();
}

function togglePay(id) {
    astraState.times[id].pago = !astraState.times[id].pago;
    renderSlots();
}

// 5. PROCESSAMENTO DE DADOS
function saveRound() {
    if (!confirm(`Confirmar encerramento da Queda #${astraState.queda}?`)) return;

    astraState.times.forEach(t => {
        const posVal = parseInt(document.getElementById(`pos_${t.id}`).value) || 12;
        const killVal = parseInt(document.getElementById(`kill_${t.id}`).value) || 0;

        t.pontos += (astraState.pontuacao[posVal] || 0) + killVal;
        t.kills += killVal;
        if (posVal === 1) t.booyahs++;

        // Limpar campos de input
        document.getElementById(`pos_${t.id}`).value = "";
        document.getElementById(`kill_${t.id}`).value = "";
        
        // Minimizar todos automaticamente para a próxima queda ficar limpa
        t.minimizado = true;
    });

    astraState.queda++;
    document.getElementById('header-round').innerText = `QUEDA #${String(astraState.queda).padStart(2, '0')}`;
    
    updateRankingUI();
    showSection('ranking');
    alert("Queda finalizada! Ranking atualizado.");
}

// 6. RANKING E UTILITÁRIOS
function updateRankingUI() {
    const output = document.getElementById('ranking-output');
    const sorted = [...astraState.times].sort((a, b) => b.pontos - a.pontos || b.booyahs - a.booyahs);

    output.innerHTML = `
        <table style="width:100%; border-collapse: collapse; margin-top:20px;">
            <tr style="color: var(--neon-blue); font-size: 0.8rem; text-align: left;">
                <th style="padding: 10px;">POS</th>
                <th>TIME</th>
                <th>KILLS</th>
                <th>TOTAL</th>
            </tr>
            ${sorted.map((t, i) => `
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 15px 10px; font-weight:900;">${i+1}º</td>
                    <td>${t.nome} ${t.booyahs > 0 ? '🏆'.repeat(t.booyahs) : ''}</td>
                    <td>${t.kills}</td>
                    <td style="color: var(--neon-blue); font-weight:900;">${t.pontos} pts</td>
                </tr>
            `).join('')}
        </table>
    `;
}

function filterSlots() {
    const term = document.getElementById('slot-search').value.toUpperCase();
    astraState.times.forEach(t => {
        const match = t.nome.includes(term) || t.nicks.toUpperCase().includes(term);
        // Aqui buscamos o elemento visual para esconder
        const cards = document.querySelectorAll('.slot-card');
        cards[t.id].style.display = match ? "block" : "none";
    });
}

function copyRanking() {
    let txt = `📊 *RANKING PARCIAL - QUEDA ${astraState.queda - 1}* 📊\n\n`;
    const sorted = [...astraState.times].sort((a,b) => b.pontos - a.pontos);
    sorted.forEach((t, i) => {
        txt += `${i+1}º ${t.nome} - ${t.pontos} pts\n`;
    });
    navigator.clipboard.writeText(txt);
    alert("Ranking copiado para o WhatsApp!");
}
