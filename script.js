/**
 * ASTRA FF - ELITE ENGINE v4.5
 * Core: Gestão de Modos, Streak System & Image Capture
 */

let db = {
    times: [],
    queda: 1,
    modo: 'SOLO',
    maxTimes: 48
};

// 1. NAVEGAÇÃO E HUD
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.toggle('active');
    overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active');
    
    if(viewId === 'queda') renderMotor();
    if(viewId === 'pix') renderPix();
    
    // Fecha o menu automaticamente após clicar
    if(document.getElementById('sidebar').classList.contains('active')) toggleMenu();
    window.scrollTo(0,0);
}

// 2. CONFIGURAÇÃO DE MODO
function setMode(name, max, btn) {
    db.modo = name;
    db.maxTimes = max;
    document.querySelectorAll('.m-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// 3. PROCESSAMENTO DA LISTA
function processarLista() {
    const raw = document.getElementById('lista-raw').value;
    if(!raw.trim()) return alert("Erro: Cole a lista de times!");

    // Divide a lista e respeita o limite do modo escolhido
    const linhas = raw.split('\n').filter(l => l.trim()).slice(0, db.maxTimes);
    
    db.times = linhas.map((linha, i) => ({
        id: i,
        nome: linha.replace(/^[0-9]+[\s-]*\.*[\s-]*/, '').trim().toUpperCase(),
        pago: false,
        nicks: "",
        pts: 0,
        kills: 0,
        booyahs: 0,
        streak: 0, // Contador de vitórias seguidas
        lastWin: false
    }));

    alert(`Sucesso! ${db.times.length} times cadastrados no modo ${db.modo}.`);
    showView('pix'); // Avança automaticamente
}

// 4. GESTÃO FINANCEIRA (PIX)
function renderPix() {
    const container = document.getElementById('pix-list');
    if(db.times.length === 0) return container.innerHTML = "<p>Nenhum time cadastrado.</p>";

    container.innerHTML = db.times.map(t => `
        <div class="card-main" style="border-left: 5px solid ${t.pago ? 'var(--success)' : 'var(--danger)'}">
            <div style="display:flex; justify-content:space-between; align-items:center">
                <span style="font-weight:800; font-size:0.8rem">#${t.id+1} ${t.nome}</span>
                <button onclick="togglePago(${t.id})" class="m-btn" style="background:${t.pago?'var(--success)':'var(--danger)'}; width:100px; padding:5px">
                    ${t.pago ? 'PAGO' : 'PENDENTE'}
                </button>
            </div>
            <input type="text" placeholder="Nicks dos jogadores" value="${t.nicks}" onchange="db.times[${t.id}].nicks = this.value" style="margin-top:10px">
        </div>
    `).join('');
}

function togglePago(id) {
    db.times[id].pago = !db.times[id].pago;
    renderPix();
}

// 5. MOTOR DE QUEDAS (LANÇAMENTO)
function renderMotor() {
    const container = document.getElementById('motor-container');
    document.getElementById('round-label').innerText = `QUEDA #${db.queda}`;
    document.getElementById('limit-label').innerText = `${db.modo} - ${db.times.length} TIMES`;

    container.innerHTML = db.times.map(t => `
        <div class="slot-queda">
            <div class="slot-head" onclick="toggleSlot(this)">
                <span>${t.nome} ${t.streak >= 2 ? '<span class="win-streak">🔥 '+t.streak+'</span>' : ''}</span>
                <span style="color:var(--accent)">${t.pts} PTS</span>
            </div>
            <div class="slot-content">
                <div><label>STATUS</label>
                    <select id="st_${t.id}">
                        <option value="N">NORMAL</option>
                        <option value="DQ">DQ (BAN)</option>
                        <option value="WO">W.O.</option>
                    </select>
                </div>
                <div><label>PUNIÇÃO (-)</label><input type="number" id="pun_${t.id}" value="0"></div>
                <div><label>POSIÇÃO</label><input type="number" id="pos_${t.id}" placeholder="1-12"></div>
                <div><label>KILLS</label><input type="number" id="kil_${t.id}" placeholder="0"></div>
            </div>
        </div>
    `).join('');
}

function toggleSlot(el) {
    const content = el.nextElementSibling;
    content.style.display = content.style.display === 'grid' ? 'none' : 'grid';
}

// 6. CÁLCULO DE PONTOS E RANKING
function finalizarQueda() {
    if(!confirm(`Deseja encerrar a Queda #${db.queda} e somar os pontos?`)) return;
    
    const pontuacaoLBFF = {1:12, 2:9, 3:8, 4:7, 5:6, 6:5, 7:4, 8:3, 9:2, 10:1, 11:0, 12:0};

    db.times.forEach(t => {
        const status = document.getElementById(`st_${t.id}`).value;
        const punicao = parseInt(document.getElementById(`pun_${t.id}`).value) || 0;
        
        if(status === "N") {
            const pos = parseInt(document.getElementById(`pos_${t.id}`).value) || 12;
            const kills = parseInt(document.getElementById(`kil_${t.id}`).value) || 0;
            
            // Soma pontos
            t.pts += (pontuacaoLBFF[pos] || 0) + kills - punicao;
            t.kills += kills;

            // Lógica de Booyah e Streak (Foguinho)
            if(pos === 1) {
                t.booyahs++;
                t.streak++;
            } else {
                t.streak = 0; // Perde o foguinho se não ganhar
            }
        } else {
            // Se for DQ ou WO, apenas retira punição se houver
            t.pts -= punicao;
            t.streak = 0;
        }
    });

    db.queda++;
    renderRanking();
    renderMotor();
    window.scrollTo(0, document.body.scrollHeight);
}

function renderRanking() {
    document.getElementById('ranking-area').classList.remove('hidden');
    const table = document.getElementById('tabela-ranking');
    const sorted = [...db.times].sort((a,b) => b.pts - a.pts || b.booyahs - a.booyahs || b.kills - a.kills);

    table.innerHTML = `
        <tr>
            <th>#</th>
            <th>TIME / JOGADORES</th>
            <th style="text-align:center">K</th>
            <th style="text-align:center">PTS</th>
        </tr>
    ` + sorted.map((t, i) => `
        <tr>
            <td style="font-weight:900; color:${i<3?'var(--accent)':'white'}">${i+1}º</td>
            <td>
                <span style="font-weight:800">${t.nome}</span> 
                ${t.streak >= 2 ? '<span class="win-streak">🔥'+t.streak+'</span>' : ''}
                ${t.booyahs > 0 ? ' 🏆'.repeat(t.booyahs) : ''}
                <br><small style="color:#64748b">${t.nicks || '---'}</small>
            </td>
            <td style="text-align:center">${t.kills}</td>
            <td style="text-align:center; font-weight:900; color:var(--accent)">${t.pts}</td>
        </tr>
    `).join('');
}

// 7. COMPARTILHAMENTO
function copiarTexto() {
    let texto = `📊 *ASTRA FF - RANKING ATUALIZADO*\n*QUEDA ${db.queda-1} FINALIZADA*\n\n`;
    const sorted = [...db.times].sort((a,b) => b.pts - a.pts);
    
    sorted.forEach((t, i) => {
        texto += `${i+1}º ${t.nome} - ${t.pts} pts ${t.streak >= 2 ? '🔥' : ''}\n`;
    });

    navigator.clipboard.writeText(texto).then(() => {
        alert("Texto copiado para o WhatsApp!");
    });
}

function baixarPrint() {
    const area = document.getElementById('capture-zone');
    html2canvas(area, { backgroundColor: '#020617' }).then(canvas => {
        const base64image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.download = `Ranking_Astra_Queda_${db.queda-1}.png`;
        link.href = base64image;
        link.click();
    });
}

// Relógio HUD
setInterval(() => {
    const now = new Date();
    document.getElementById('digital-clock').innerText = 
        String(now.getHours()).padStart(2, '0') + ":" + 
        String(now.getMinutes()).padStart(2, '0');
}, 1000);
