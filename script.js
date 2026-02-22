// --- DATABASE GLOBAL ---
let db = { 
    times: [], 
    rodada: 1 
};

// --- CONTROLE DE NAVEGAÇÃO E MENU ---
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.toggle('active');
    overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
}

function showView(viewName) {
    // Esconde todas as telas
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    // Mostra a tela selecionada
    document.getElementById('view-' + viewName).classList.add('active');
    
    // Se for a tela de queda, renderiza o motor
    if(viewName === 'queda') renderMotor();
    
    // Fecha o menu se estiver aberto (mobile friendly)
    if(document.getElementById('sidebar').classList.contains('active')) toggleMenu();
}

// --- TUTORIAL ---
function proximoTuto() { 
    document.getElementById('tutorial').style.display = 'none'; 
}

// --- LÓGICA DE CADASTRO (VIEW SETUP) ---
function processarLista() {
    const input = document.getElementById('input-lista').value;
    if(!input.trim()) return alert("Por favor, cole a lista de times.");

    // Transforma o texto em objetos de times
    db.times = input.split('\n').filter(linha => linha.trim()).map((linha, i) => ({
        id: i,
        nome: linha.replace(/^[0-9]+[\s-]*\.*[\s-]*/, '').trim().toUpperCase(),
        nicks: "", 
        pix: "", 
        pago: false, 
        pontos: 0, 
        kills: 0, 
        booyahs: 0
    }));

    renderPix();
    showView('pix');
    alert("Lista importada com sucesso!");
}

// --- GESTÃO FINANCEIRA E NICKS (VIEW PIX) ---
function renderPix() {
    const container = document.getElementById('pix-list');
    if(db.times.length === 0) return;

    container.innerHTML = db.times.map(t => `
        <div class="card" style="border-left: 4px solid ${t.pago ? 'var(--success)' : 'var(--danger)'}">
            <div style="display:flex; justify-content:space-between; align-items:center">
                <strong style="color:var(--accent)">${t.nome}</strong>
                <button class="btn-pay" onclick="alternarPagamento(${t.id})">
                    ${t.pago ? '✅ PAGO' : '❌ PENDENTE'}
                </button>
            </div>
            <input type="text" placeholder="PIX do responsável" value="${t.pix}" onchange="db.times[${t.id}].pix = this.value">
            <input type="text" placeholder="Nicks dos Jogadores" value="${t.nicks}" onchange="db.times[${t.id}].nicks = this.value">
        </div>
    `).join('');
}

function alternarPagamento(id) {
    db.times[id].pago = !db.times[id].pago;
    renderPix();
}

// --- MOTOR DE QUEDAS (VIEW QUEDA) ---
function renderMotor() {
    const container = document.getElementById('motor-queda');
    if(db.times.length === 0) {
        container.innerHTML = "<p style='text-align:center; padding:20px;'>Nenhum time cadastrado.</p>";
        return;
    }

    container.innerHTML = `<h3>SALA #${db.rodada}</h3>` + db.times.map(t => `
        <div class="card">
            <div onclick="const s=this.nextElementSibling; s.style.display=s.style.display==='none'?'grid':'none'" style="cursor:pointer; display:flex; justify-content:space-between">
                <span>▼ ${t.nome}</span>
                <span style="color:var(--accent); font-weight:800">${t.pontos} PTS</span>
            </div>
            <div style="display:none; grid-template-columns: 1fr 1fr; gap:10px; padding-top:15px">
                <div>
                    <small style="color:#64748b">Posição</small>
                    <input type="number" id="pos_${t.id}" placeholder="1-12">
                </div>
                <div>
                    <small style="color:#64748b">Kills</small>
                    <input type="number" id="kil_${t.id}" placeholder="0">
                </div>
            </div>
        </div>
    `).join('') + `
        <button onclick="salvarQueda()" class="glow-button" style="width:100%; margin-top:20px">
            FINALIZAR QUEDA ${db.rodada}
        </button>
    `;
}

function salvarQueda() {
    if(!confirm(`Deseja salvar os resultados da Queda ${db.rodada}?`)) return;

    const tabelaLBFF = {1:12, 2:9, 3:8, 4:7, 5:6, 6:5, 7:4, 8:3, 9:2, 10:1, 11:0, 12:0};

    db.times.forEach(t => {
        const pos = parseInt(document.getElementById(`pos_${t.id}`).value) || 12;
        const kil = parseInt(document.getElementById(`kil_${t.id}`).value) || 0;

        t.pontos += (tabelaLBFF[pos] || 0) + kil;
        t.kills += kil;
        if(pos === 1) t.booyahs++;
    });

    db.rodada++;
    renderMotor();
    renderTabela();
}

// --- TABELA DE RESULTADOS ---
function renderTabela() {
    const area = document.getElementById('tabela-resultado');
    const sorted = [...db.times].sort((a,b) => b.pontos - a.pontos || b.booyahs - a.booyahs || b.kills - a.kills);

    area.innerHTML = `
        <div class="card">
            <h4 style="text-align:center; color:var(--accent)">CLASSIFICAÇÃO GERAL</h4>
            <table>
                <thead>
                    <tr><th>#</th><th>TIME</th><th style="text-align:center">K</th><th style="text-align:center">TOTAL</th></tr>
                </thead>
                <tbody>
                    ${sorted.map((t, i) => `
                        <tr>
                            <td style="font-weight:900; color:var(--accent)">${i+1}º</td>
                            <td>${t.nome} ${'🏆'.repeat(t.booyahs)}<br><small style="color:#64748b">${t.nicks || 'Sem nicks'}</small></td>
                            <td style="text-align:center">${t.kills}</td>
                            <td style="text-align:center; font-weight:900">${t.pontos}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <button onclick="copiarWhatsApp()" style="width:100%; margin-top:15px; background:var(--success); border:none; padding:12px; border-radius:8px; color:white; font-weight:bold; cursor:pointer">
                COPIAR PARA WHATSAPP
            </button>
        </div>
    `;
}

function copiarWhatsApp() {
    let texto = `🏆 *ASTRA HUB - RESULTADOS* 🏆\n\n`;
    const sorted = [...db.times].sort((a,b) => b.pontos - a.pontos);
    
    sorted.forEach((t, i) => {
        texto += `${i+1}º *${t.nome}* - ${t.pontos} pts\n`;
    });

    navigator.clipboard.writeText(texto);
    alert("Ranking copiado para o WhatsApp!");
}

// --- BUSCA RÁPIDA ---
function buscar() {
    const termo = document.getElementById('searchBar').value.toUpperCase();
    const resultados = document.getElementById('search-results');
    
    if(!termo) { resultados.innerHTML = ""; return; }

    const filtrados = db.times.filter(t => t.nome.includes(termo) || t.nicks.toUpperCase().includes(termo));

    resultados.innerHTML = filtrados.map(t => `
        <div class="card" style="margin-bottom:5px; padding:10px;">
            <div style="color:var(--accent); font-weight:bold;">${t.nome}</div>
            <div style="font-size:0.7rem; color:#64748b">JOGADORES: ${t.nicks || 'Não informado'}</div>
        </div>
    `).join('');
}
