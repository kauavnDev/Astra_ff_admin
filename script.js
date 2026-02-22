/**
 * ASTRA FF - ULTIMATE ENGINE v5.0
 * Features: OCR Integration, Deep History, LBFF 2021 Rules
 */

let db = {
    times: [],
    quedas: [], // Histórico de cada round
    rodadaAtual: 1,
    modo: 'SOLO',
    maxTimes: 48
};

// --- INICIALIZAÇÃO & PERSISTÊNCIA ---
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
    atualizarInterface();
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
    if(document.getElementById('sidebar').classList.contains('active')) toggleMenu();
    window.scrollTo(0,0);
}

// --- CONFIGURAÇÃO E OCR ---
function setMode(name, max, btn) {
    db.modo = name;
    db.maxTimes = max;
    document.querySelectorAll('.m-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// Lógica OCR para ler Print do Lobby
document.getElementById('ocr-upload')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function() {
        alert("Astra está lendo a imagem... Aguarde.");
        Tesseract.recognize(reader.result, 'por', { logger: m => console.log(m) })
            .then(({ data: { text } }) => {
                document.getElementById('lista-raw').value = text;
                alert("Leitura concluída! Ajuste os nomes se necessário.");
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
        pago: false, nicks: "", pts: 0, kills: 0, booyahs: 0, streak: 0
    }));

    db.quedas = [];
    db.rodadaAtual = 1;
    save();
    showView('pix');
}

// --- MOTOR DE QUEDAS (LÓGICA LBFF 2021) ---
function renderMotor() {
    const container = document.getElementById('motor-container');
    document.getElementById('round-label').innerText = `QUEDA #${db.rodadaAtual}`;
    document.getElementById('round-hud').innerText = `Q${db.rodadaAtual}`;
    document.getElementById('limit-label').innerText = `${db.modo} (${db.times.length} SLOTS)`;

    container.innerHTML = db.times.map(t => `
        <div class="slot-queda">
            <div class="slot-head" onclick="toggleSlot(this)">
                <span>#${t.id+1} ${t.nome} ${t.streak >= 2 ? '🔥' : ''}</span>
                <span style="color:var(--accent)">${t.pts} PTS</span>
            </div>
            <div class="slot-content">
                <div><label>STATUS</label>
                    <select id="st_${t.id}">
                        <option value="N">NORMAL</option>
                        <option value="DQ">DQ (BAN)</option>
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

function finalizarQueda() {
    if(!confirm(`Encerrar Queda ${db.rodadaAtual}?`)) return;
    
    const lbff = {1:12, 2:9, 3:8, 4:7, 5:6, 6:5, 7:4, 8:3, 9:2, 10:1, 11:0, 12:0};
    let roundData = { round: db.rodadaAtual, logs: [] };

    db.times.forEach(t => {
        const st = document.getElementById(`st_${t.id}`).value;
        const pos = parseInt(document.getElementById(`pos_${t.id}`).value) || 12;
        const kil = parseInt(document.getElementById(`kil_${t.id}`).value) || 0;
        const pun = parseInt(document.getElementById(`pun_${t.id}`).value) || 0;

        let ptsGanhos = 0;
        if(st === "N") {
            ptsGanhos = (lbff[pos] || 0) + kil - pun;
            t.pts += ptsGanhos;
            t.kills += kil;
            if(pos === 1) { t.booyahs++; t.streak++; } else { t.streak = 0; }
        } else {
            ptsGanhos = -pun;
            t.pts += ptsGanhos;
            t.streak = 0;
        }

        roundData.logs.push({ id: t.id, pts: ptsGanhos, pos: pos, kills: kil, status: st });
    });

    db.quedas.push(roundData);
    db.rodadaAtual++;
    save();
    renderRanking();
    renderMotor();
    alert("Resultados processados!");
}

// --- ADMIN TOOLS ---
function recalcularTabela() {
    if(!confirm("Recalcular tudo com base no histórico?")) return;
    db.times.forEach(t => { t.pts = 0; t.kills = 0; t.booyahs = 0; t.streak = 0; });
    
    db.quedas.forEach(q => {
        q.logs.forEach(log => {
            let t = db.times[log.id];
            t.pts += log.pts;
            t.kills += log.kills;
            if(log.pos === 1 && log.status === "N") t.booyahs++;
        });
    });
    renderRanking();
    save();
}

function verHistorico() {
    const modal = document.getElementById('modal-historico');
    const logArea = document.getElementById('log-content');
    logArea.innerHTML = db.quedas.length ? db.quedas.map(q => `
        <div style="padding:10px; border-bottom:1px solid var(--border)">
            <b style="color:var(--accent)">QUEDA #${q.round}</b> - ${q.logs.length} times processados.
        </div>
    `).join('') : "Sem histórico.";
    modal.classList.remove('hidden');
    document.getElementById('overlay').style.display = 'block';
}

// --- RANKING & COMPARTILHAR ---
function renderRanking() {
    document.getElementById('ranking-area').classList.remove('hidden');
    const table = document.getElementById('tabela-ranking');
    const sorted = [...db.times].sort((a,b) => b.pts - a.pts || b.booyahs - a.booyahs || b.kills - a.kills);

    table.innerHTML = `<tr><th>#</th><th>TIME</th><th style="text-align:center">K</th><th style="text-align:center">PTS</th></tr>` + 
    sorted.map((t, i) => `
        <tr>
            <td style="font-weight:900; color:${i<3?'var(--accent)':'white'}">${i+1}º</td>
            <td>
                <b>${t.nome}</b> ${t.streak >= 2 ? '🔥' : ''} ${'🏆'.repeat(t.booyahs)}
                <br><small style="color:var(--text-dim)">${t.nicks || '---'}</small>
            </td>
            <td style="text-align:center">${t.kills}</td>
            <td style="text-align:center; font-weight:900; color:var(--accent)">${t.pts}</td>
        </tr>
    `).join('');
}

function copiarTexto() {
    let txt = `🏆 *ASTRA FF - ${db.modo}* 🏆\n`;
    txt += `📊 *RANKING APÓS ${db.rodadaAtual-1}ª QUEDA*\n`;
    txt += `─`.repeat(15) + `\n\n`;

    [...db.times].sort((a,b) => b.pts - a.pts).forEach((t, i) => {
        const icon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}º`;
        txt += `${icon} *${t.nome}* | Pts: *${t.pts}*\n`;
    });

    txt += `\n🚀 *Astra Elite Hub*`;
    navigator.clipboard.writeText(txt);
    alert("Texto copiado!");
}

function baixarPrint() {
    const zone = document.getElementById('capture-zone');
    html2canvas(zone, { backgroundColor: '#020617', scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `RANKING_ASTRA_Q${db.rodadaAtual-1}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
}

// --- HELPERS ---
function toggleSlot(el) {
    const content = el.nextElementSibling;
    content.style.display = content.style.display === 'grid' ? 'none' : 'grid';
}

function fecharModal() {
    document.getElementById('modal-historico').classList.add('hidden');
    document.getElementById('overlay').style.display = 'none';
}

function atualizarInterface() {
    setInterval(() => {
        const d = new Date();
        document.getElementById('digital-clock').innerText = d.getHours().toString().padStart(2,'0') + ":" + d.getMinutes().toString().padStart(2,'0');
    }, 1000);
}

function renderPix() {
    const container = document.getElementById('pix-list');
    container.innerHTML = db.times.map(t => `
        <div class="card-main" style="border-left: 4px solid ${t.pago ? 'var(--success)' : 'var(--danger)'}">
            <div style="display:flex; justify-content:space-between; align-items:center">
                <span style="font-weight:900">#${t.id+1} ${t.nome}</span>
                <button onclick="db.times[${t.id}].pago = !db.times[${t.id}].pago; renderPix(); save();" class="m-btn" style="padding:5px 10px; background:${t.pago?'var(--success)':'var(--danger)'}">
                    ${t.pago ? 'PAGO' : 'PENDENTE'}
                </button>
            </div>
            <input type="text" placeholder="Nicks..." value="${t.nicks}" onchange="db.times[${t.id}].nicks = this.value; save();">
        </div>
    `).join('');
}
