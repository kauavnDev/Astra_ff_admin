/**
 * ASTRA ELITE HUB - CORE SCRIPT
 * Gerenciamento de Diárias de Free Fire
 */

// 1. DATABASE DO SISTEMA
let db = {
    modo: "SOLO",
    rodada: 1,
    times: [] // Armazenará todos os dados dos slots
};

// 2. CONTROLE DO MODAL DE BOAS-VINDAS E MODOS
function setMode(modo, elemento) {
    db.modo = modo;
    // Atualiza visual dos botões no modal
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    elemento.classList.add('active');
    
    // Atualiza texto na sidebar e no sistema
    document.getElementById('display-modo').innerText = `MODO: ${modo}`;
    console.log(`[SISTEMA] Modo definido para: ${modo}`);
}

function closeWelcome() {
    const modal = document.getElementById('welcome-modal');
    modal.style.opacity = '0';
    setTimeout(() => {
        modal.style.display = 'none';
    }, 400);
}

// 3. NAVEGAÇÃO ENTRE TELAS (VIEWS)
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.toggle('active');
    overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
}

function showView(viewName) {
    // Gerenciar classes de visualização
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));

    const targetView = document.getElementById('view-' + viewName);
    if (targetView) {
        targetView.classList.add('active');
    }

    // Renderizar conteúdo específico se necessário
    if (viewName === 'pix') renderPix();
    if (viewName === 'queda') renderMotor();

    // Fecha o menu lateral após o clique
    if (window.innerWidth <= 768) toggleMenu();
}

// 4. PROCESSAMENTO DA LISTA MASTER
function processarLista() {
    const input = document.getElementById('input-lista').value;
    if (!input.trim()) {
        alert("⚠️ ERRO: Cole a lista de times antes de prosseguir.");
        return;
    }

    // Regex para limpar numeração (ex: "01- ", "02. ", "1 )")
    const linhas = input.split('\n').filter(l => l.trim() !== "");
    
    db.times = linhas.map((linha, index) => {
        const nomeLimpo = linha.replace(/^[0-9]+[\s-]*\.*[\s-]*\)*\s*/, '').trim().toUpperCase();
        return {
            id: index,
            nome: nomeLimpo,
            pix: "",
            nicks: "",
            pago: false,
            pontosTotal: 0,
            killsTotal: 0,
            booyahs: 0
        };
    });

    console.log("[SISTEMA] Slots gerados:", db.times.length);
    showView('pix');
}

// 5. GESTÃO DE SLOTS (PAGAMENTO E NICKS)
function renderPix() {
    const container = document.getElementById('pix-list');
    if (db.times.length === 0) {
        container.innerHTML = `<div class="glass-card">Nenhum time importado ainda.</div>`;
        return;
    }

    container.innerHTML = db.times.map(t => `
        <div class="glass-card" style="border-left: 4px solid ${t.pago ? 'var(--success)' : 'var(--danger)'}">
            <div class="slot-row">
                <span style="font-weight:900;">#${String(t.id + 1).padStart(2, '0')} ${t.nome}</span>
                <div class="status-badge ${t.pago ? 'pago' : 'pendente'}" onclick="toggleStatus(${t.id})">
                    ${t.pago ? 'PAGO' : 'PENDENTE'}
                </div>
            </div>
            <input type="text" placeholder="Chave PIX ou Ref." value="${t.pix}" onchange="db.times[${t.id}].pix = this.value">
            <input type="text" placeholder="Nicks (Ex: Nick1, Nick2...)" value="${t.nicks}" onchange="db.times[${t.id}].nicks = this.value">
        </div>
    `).join('');
}

function toggleStatus(id) {
    db.times[id].pago = !db.times[id].pago;
    renderPix();
}

// 6. MOTOR DE QUEDAS (LANÇAMENTO DE PONTOS)
function renderMotor() {
    const container = document.getElementById('motor-queda');
    document.getElementById('num-queda').innerText = String(db.rodada).padStart(2, '0');

    if (db.times.length === 0) {
        container.innerHTML = `<div class="glass-card">Importe a lista na aba Configuração.</div>`;
        return;
    }

    container.innerHTML = db.times.map(t => `
        <div class="glass-card" style="margin-bottom:10px; padding: 15px;">
            <div onclick="toggleAccordion('score_${t.id}')" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center">
                <span style="font-weight:700; font-size:0.9rem;">${t.nome}</span>
                <span style="color:var(--accent); font-weight:800; font-size:0.8rem;">${t.pontosTotal} PTS</span>
            </div>
            <div id="score_${t.id}" class="score-grid" style="display:none;">
                <div>
                    <label>Posição</label>
                    <input type="number" id="pos_${t.id}" min="1" max="12" placeholder="1-12">
                </div>
                <div>
                    <label>Kills</label>
                    <input type="number" id="kil_${t.id}" min="0" placeholder="0">
                </div>
            </div>
        </div>
    `).join('') + `
        <button onclick="finalizarQueda()" class="glow-button">SALVAR RESULTADOS DA QUEDA ${db.rodada}</button>
    `;
}

function toggleAccordion(id) {
    const el = document.getElementById(id);
    el.style.display = el.style.display === 'none' ? 'grid' : 'none';
}

// 7. CÁLCULO LBFF E CLASSIFICAÇÃO
function finalizarQueda() {
    // Tabela oficial de pontos (LBFF/FFWS)
    const pontosPosicao = { 1: 12, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1, 11: 0, 12: 0 };

    if (!confirm(`Confirmar encerramento da Queda ${db.rodada}?`)) return;

    db.times.forEach(t => {
        const pos = parseInt(document.getElementById(`pos_${t.id}`).value) || 12;
        const kil = parseInt(document.getElementById(`kil_${t.id}`).value) || 0;

        // Somar ao total acumulado
        const pontosDaRodada = (pontosPosicao[pos] || 0) + kil;
        t.pontosTotal += pontosDaRodada;
        t.killsTotal += kil;
        if (pos === 1) t.booyahs++;
        
        // Limpar campos para a próxima
        document.getElementById(`pos_${t.id}`).value = "";
        document.getElementById(`kil_${t.id}`).value = "";
    });

    db.rodada++;
    renderMotor();
    renderTabela();
}

function renderTabela() {
    const container = document.getElementById('tabela-resultado');
    // Ordenar por Pontos > Booyahs > Kills
    const ranking = [...db.times].sort((a, b) => b.pontosTotal - a.pontosTotal || b.booyahs - a.booyahs || b.killsTotal - a.killsTotal);

    container.innerHTML = `
        <div class="glass-card" style="margin-top:30px; border-color:var(--neon)">
            <h4 style="text-align:center; margin-bottom:15px; font-family:'Orbitron';">RANKING ATUALIZADO</h4>
            <div style="overflow-x:auto">
                <table style="width:100%; border-collapse:collapse; font-size:0.8rem;">
                    <tr style="color:var(--text-dim); border-bottom:1px solid var(--border);">
                        <th style="padding:10px; text-align:left;">#</th>
                        <th style="text-align:left;">TIME</th>
                        <th style="text-align:center;">K</th>
                        <th style="text-align:center;">TOTAL</th>
                    </tr>
                    ${ranking.map((t, i) => `
                        <tr style="border-bottom:1px solid rgba(255,255,255,0.03)">
                            <td style="padding:12px; font-weight:bold; color:var(--accent)">${i + 1}º</td>
                            <td>${t.nome} ${'🏆'.repeat(t.booyahs)}</td>
                            <td style="text-align:center;">${t.killsTotal}</td>
                            <td style="text-align:center; font-weight:bold; color:var(--neon)">${t.pontosTotal}</td>
                        </tr>
                    `).join('')}
                </table>
            </div>
            <button onclick="copiarTabela()" class="glow-button" style="background:#10b981; box-shadow:0 0 10px rgba(16,185,129,0.3); margin-top:20px;">COPIAR RANKING TEXTO</button>
        </div>
    `;
}

function copiarTabela() {
    let texto = `🏆 *RANKING - MODO ${db.modo}* 🏆\n\n`;
    const ranking = [...db.times].sort((a, b) => b.pontosTotal - a.pontosTotal);
    
    ranking.forEach((t, i) => {
        const medalha = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🔹';
        texto += `${medalha} ${i+1}º ${t.nome}: ${t.pontosTotal} pts\n`;
    });
    
    texto += `\n_Gerado por Astra Elite Hub_`;
    
    navigator.clipboard.writeText(texto).then(() => {
        alert("Copiado para o WhatsApp!");
    });
}

// 8. BUSCA RÁPIDA
function buscar() {
    const termo = document.getElementById('searchBar').value.toUpperCase();
    const res = document.getElementById('search-results');
    
    if (!termo) { res.innerHTML = ""; return; }

    const filtrados = db.times.filter(t => t.nome.includes(termo) || t.nicks.toUpperCase().includes(termo));

    res.innerHTML = filtrados.map(t => `
        <div class="glass-card" style="margin-bottom:5px; padding:10px;">
            <div style="display:flex; justify-content:space-between">
                <span style="color:var(--accent); font-weight:bold;">${t.nome}</span>
                <span style="font-size:0.7rem;">${t.pago ? '✅ PAGO' : '❌ PENDENTE'}</span>
            </div>
            <small style="color:var(--text-dim)">NICKS: ${t.nicks || 'N/A'}</small>
        </div>
    `).join('');
}
