/**
 * ASTRA FF - ULTIMATE ENGINE v5.0
 * Core: OCR, History Management, PIX Control & LBFF Rules
 */

let db = {
    times: [],
    quedas: [],
    rodadaAtual: 1,
    modo: 'SOLO',
    maxTimes: 48
};

// --- INICIALIZAÇÃO E PERSISTÊNCIA ---
window.onload = () => {
    const saved = localStorage.getItem('astra_elite_db');
    if (saved) {
        db = JSON.parse(saved);
        if (db.times.length > 0) {
            renderPix();
            renderMotor();
            if (db.quedas.length > 0) renderRanking();
        }
    }
    atualizarRelogio();
};

function save() {
    localStorage.setItem('astra_elite_db', JSON.stringify(db));
}

// --- NAVEGAÇÃO ---
function toggleMenu() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('overlay');
    sb.classList.toggle('active');
    ov.style.display = sb.classList.contains('active') ? 'block' : 'none';
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active');
    if(viewId === 'queda') renderMotor();
    if(viewId === 'pix') renderPix();
    if(document.getElementById('sidebar').classList.contains('active')) toggleMenu();
    window.scrollTo(0,0);
}

// --- SETUP & OCR ---
function setMode(name, max, btn) {
    db.modo = name;
    db.maxTimes = max;
    document.querySelectorAll('.m-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

document.getElementById('ocr-upload')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function() {
        Tesseract.recognize(reader.result, 'por').then(({ data: { text } }) => {
            document.getElementById('lista-raw').value = text;
            alert("Astra leu os nomes! Ajuste se necessário.");
        });
    };
    reader.readAsDataURL(file);
});

function processarLista() {
    const raw = document.getElementById('lista-raw').value;
    if(!raw.trim()) return alert("Erro: Lista vazia!");

    const linhas = raw.split('\n').filter(l => l.trim()).slice(0, db.maxTimes);
    db.times = linhas.map((linha, i) => ({
        id: i,
        nome: linha.replace(/^[0-9]+[\s-]*\.*[\s-]*/, '').trim().toUpperCase(),
        pago: false, 
        nicks: "", 
        pixRef: "", 
        pts: 0, 
        kills: 0, 
        booyahs: 0, 
        streak: 0
    }));

    db.quedas = [];
    db.rodadaAtual = 1;
    save();
    showView('pix');
}

// --- GESTÃO FINANCEIRA (PIX) ---
function renderPix() {
    const container = document.getElementById('pix-list');
    container.innerHTML = db.times.map(t => `
        <div class="card-main" style="border-left: 5px solid ${t.pago ? 'var(--success)' : 'var(--danger)'}">
            <div style="display:flex; justify-content:space-between; align-items:center">
                <span style="font-weight:900; font-size:0.8rem">#${t.id+1} ${t.nome}</span>
                <button onclick="togglePago(${t.id})" class="m-btn" style="background:${t.pago?'var(--success)':'var(--danger)'}; border:none; padding:5px 12px">
                    ${t.pago ? 'PAGO' : 'PENDENTE'}
                </button>
            </div>
            <div class="pix-input-group">
                <input type="text" class="input-nick" placeholder="Nicks..." value="${t.nicks}" onchange="atualizarInfo(${t.id}, 'nicks', this.value)">
                <input type="text" class="input-pix" placeholder="Ref. PIX" value="${t.pixRef}" onchange="atualizarInfo(${t.id}, 'pixRef', this.value)">
            </div>
        </div>
    `).join('');
}

function atualizarInfo(id, campo, valor) {
    db.times[id][campo] = valor;
    save();
}

function togglePago(id) {
    db.times[id].pago = !db.times[id].pago;
    save();
    renderPix();
}

// --- MOTOR DE QUEDA ---
function renderMotor() {
    const container = document.getElementById('motor-container');
    document.getElementById('round-label').innerText = `QUEDA #${db.rodadaAtual}`;
    document.getElementById('limit-label').innerText = `${db.modo} - ${db.times.length} TIMES`;

    container.innerHTML = db.times.map(t => `
        <div class="slot-queda">
            <div class="slot-head" onclick="toggleSlot(this)">
                <span>${t.nome} ${t.streak >= 2 ? '🔥' : ''}</span>
                <span style="color:var(--accent)">${t.pts} PTS</span>
            </div>
            <div class="slot-content">
                <div><label>STATUS</label><select id="st_${t.id}"><option value="N">NORMAL</option><option value="DQ">DQ</option><option value="WO">W.O</option></select></div>
                <div><label>PUNIÇÃO</label><input type="number" id="pun_${t.id}" value="0"></div>
                <div><label>POSIÇÃO</label><input type="number" id="pos_${t.id}" placeholder="1-12"></div>
                <div><label>KILLS</label><input type="number" id="kil_${t.id}" placeholder="0"></div>
            </div>
        </div>
    `).join('');
}

function finalizarQueda() {
    if(!confirm(`Finalizar Queda ${db.rodadaAtual}?`)) return;
    const lbff = {1:12, 2:9, 3:8, 4:7, 5:6, 6:5, 7:4, 8:3, 9:2, 10:1, 11:0, 12:0};
    let roundLog = { round: db.rodadaAtual, logs: [] };

    db.times.forEach(t => {
        const st = document.getElementById(`st_${t.id}`).value;
        const pos = parseInt(document.getElementById(`pos_${t.id}`).value) || 12;
        const kil = parseInt(document.getElementById(`kil_${t.id}`).value) || 0;
        const pun = parseInt(document.getElementById(`pun_${t.id}`).value) || 0;

        let ptsGanhos = st === "N" ? (lbff[pos] || 0) + kil - pun : -pun;
        t.pts += ptsGanhos;
        t.kills += (st === "N" ? kil : 0);
        if(st === "N" && pos === 1) { t.booyahs++; t.streak++; } else { t.streak = 0; }

        roundLog.logs.push({ id: t.id, pts: ptsGanhos, pos: pos, kills: kil, status: st });
    });

    db.quedas.push(roundLog);
    db.rodadaAtual++;
    save();
    renderRanking();
    renderMotor();
    alert("Queda encerrada!");
}

// --- RANKING COM TROFÉU DINÂMICO ---
function renderRanking() {
    document.getElementById('ranking-area').classList.remove('hidden');
    const table = document.getElementById('tabela-ranking');
    
    // Ordenação LBFF: Pontos > Booyahs > Kills
    const sorted = [...db.times].sort((a,b) => b.pts - a.pts || b.booyahs - a.booyahs || b.kills - a.kills);

    table.innerHTML = `<tr><th>#</th><th>TIME</th><th style="text-align:center">K</th><th style="text-align:center">PTS</th></tr>` + 
    sorted.map((t, i) => {
        // Gera os troféus baseado na quantidade de vitórias
        const trofeus = t.booyahs > 0 ? `<span style="color:var(--accent); margin-left:5px;">${'🏆'.repeat(t.booyahs)}</span>` : '';
        const medalha = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}º`;
        
        return `
        <tr>
            <td style="font-weight:900; color:${i<3?'var(--accent)':'white'}">${medalha}</td>
            <td>
                <div style="display:flex; align-items:center; gap:5px">
                    <b style="font-size:0.85rem">${t.nome}</b> 
                    ${t.streak >= 2 ? '<span class="win-streak">🔥</span>' : ''}
                    ${trofeus}
                </div>
                <small style="color:var(--text-dim); font-size:0.65rem">${t.nicks || '---'}</small>
            </td>
            <td style="text-align:center">${t.kills}</td>
            <td style="text-align:center; font-weight:900; color:var(--accent)">${t.pts}</td>
        </tr>`;
    }).join('');
}

// --- AJUSTE NO MOTOR (PARA EXIBIR VITÓRIAS ACUMULADAS) ---
function renderMotor() {
    const container = document.getElementById('motor-container');
    document.getElementById('round-label').innerText = `QUEDA #${db.rodadaAtual}`;
    document.getElementById('round-hud').innerText = `Q${db.rodadaAtual}`;

    container.innerHTML = db.times.map(t => `
        <div class="slot-queda">
            <div class="slot-head" onclick="toggleSlot(this)">
                <div style="display:flex; align-items:center; gap:8px">
                    <span>#${t.id+1} ${t.nome}</span>
                    ${t.booyahs > 0 ? `<span style="font-size:0.7rem">🏆${t.booyahs}</span>` : ''}
                    ${t.streak >= 2 ? '<span class="win-streak">🔥</span>' : ''}
                </div>
                <span style="color:var(--accent)">${t.pts} PTS</span>
            </div>
            <div class="slot-content">
                <div><label>STATUS</label>
                    <select id="st_${t.id}">
                        <option value="N">NORMAL</option>
                        <option value="DQ">DQ</option>
                        <option value="WO">W.O</option>
                    </select>
                </div>
                <div><label>PUNIÇÃO</label><input type="number" id="pun_${t.id}" value="0"></div>
                <div><label>POSIÇÃO</label><input type="number" id="pos_${t.id}" placeholder="1-12"></div>
                <div><label>KILLS</label><input type="number" id="kil_${t.id}" placeholder="0"></div>
            </div>
        </div>
    `).join('');
}


function copiarTexto() {
    let txt = `🏆 *ASTRA FF - ${db.modo}* 🏆\n📊 *RANKING APÓS Q${db.rodadaAtual-1}*\n\n`;
    [...db.times].sort((a,b) => b.pts - a.pts).forEach((t, i) => {
        txt += `${i+1}º *${t.nome}* | Pts: *${t.pts}* ${t.streak >= 2 ? '🔥' : ''}\n`;
    });
    navigator.clipboard.writeText(txt);
    alert("Texto copiado!");
}

function baixarPrint() {
    html2canvas(document.getElementById('capture-zone'), { backgroundColor: '#020617' }).then(c => {
        const a = document.createElement('a');
        a.download = `RANKING_Q${db.rodadaAtual-1}.png`;
        a.href = c.toDataURL();
        a.click();
    });
}

function recalcularTabela() {
    db.times.forEach(t => { t.pts = 0; t.kills = 0; t.booyahs = 0; t.streak = 0; });
    db.quedas.forEach(q => {
        q.logs.forEach(l => {
            let t = db.times[l.id];
            t.pts += l.pts;
            t.kills += (l.status === "N" ? l.kills : 0);
            if(l.status === "N" && l.pos === 1) t.booyahs++;
        });
    });
    renderRanking();
}

function limparQuedaAtual() {
    if(confirm("Limpar campos da queda?")) renderMotor();
}

function toggleSlot(el) {
    const c = el.nextElementSibling;
    c.style.display = c.style.display === 'grid' ? 'none' : 'grid';
}

function verHistorico() {
    const m = document.getElementById('modal-historico');
    document.getElementById('log-content').innerHTML = db.quedas.map(q => `<p>Queda #${q.round} finalizada.</p>`).join('') || "Sem dados.";
    m.classList.remove('hidden');
    document.getElementById('overlay').style.display = 'block';
}

function fecharModal() {
    document.getElementById('modal-historico').classList.add('hidden');
    document.getElementById('overlay').style.display = 'none';
}

function atualizarRelogio() {
    setInterval(() => {
        const d = new Date();
        document.getElementById('digital-clock').innerText = d.getHours().toString().padStart(2,'0') + ":" + d.getMinutes().toString().padStart(2,'0');
    }, 1000);
}
