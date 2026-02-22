/**
 * ASTRA FF - ULTIMATE ENGINE v5.0
 * Foco: Histórico, Persistência e Formatação Elite
 */

let db = {
    times: [],
    quedas: [], // Aqui fica o histórico de cada round
    rodadaAtual: 1,
    modo: 'SOLO',
    maxTimes: 48
};

// --- INICIALIZAÇÃO COM AUTO-SAVE ---
window.onload = () => {
    const saved = localStorage.getItem('astra_db');
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
    localStorage.setItem('astra_db', JSON.stringify(db));
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
}

// --- CONFIGURAÇÃO ---
function setMode(name, max, btn) {
    db.modo = name;
    db.maxTimes = max;
    document.querySelectorAll('.m-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function processarLista() {
    const raw = document.getElementById('lista-raw').value;
    if(!raw.trim()) return alert("Cole a lista!");

    const linhas = raw.split('\n').filter(l => l.trim()).slice(0, db.maxTimes);
    db.times = linhas.map((linha, i) => ({
        id: i,
        nome: linha.replace(/^[0-9]+[\s-]*\.*[\s-]*/, '').trim().toUpperCase(),
        pago: false, nicks: "", pts: 0, kills: 0, booyahs: 0, streak: 0, statusGeral: "ATIVO"
    }));

    db.quedas = [];
    db.rodadaAtual = 1;
    save();
    showView('pix');
}

// --- MOTOR DE QUEDAS (MECÂNICA LBFF) ---
function finalizarQueda() {
    if(!confirm(`Finalizar Queda ${db.rodadaAtual}?`)) return;
    
    const pontuacaoLBFF = {1:12, 2:9, 3:8, 4:7, 5:6, 6:5, 7:4, 8:3, 9:2, 10:1, 11:0, 12:0};
    let logQueda = { round: db.rodadaAtual, resultados: [] };

    db.times.forEach(t => {
        const st = document.getElementById(`st_${t.id}`).value;
        const pos = parseInt(document.getElementById(`pos_${t.id}`).value) || 12;
        const kil = parseInt(document.getElementById(`kil_${t.id}`).value) || 0;
        const pun = parseInt(document.getElementById(`pun_${t.id}`).value) || 0;

        let ptsRodada = 0;
        if(st === "N") {
            ptsRodada = (pontuacaoLBFF[pos] || 0) + kil - pun;
            t.pts += ptsRodada;
            t.kills += kil;
            if(pos === 1) { t.booyahs++; t.streak++; } else { t.streak = 0; }
        } else {
            ptsRodada = -pun;
            t.pts += ptsRodada;
            t.streak = 0;
        }

        logQueda.resultados.push({ id: t.id, nome: t.nome, pts: ptsRodada, pos: pos, kills: kil, status: st });
        
        // Limpar campos para a próxima
        document.getElementById(`pos_${t.id}`).value = "";
        document.getElementById(`kil_${t.id}`).value = "";
        document.getElementById(`pun_${t.id}`).value = "0";
    });

    db.quedas.push(logQueda);
    db.rodadaAtual++;
    save();
    renderRanking();
    alert("Queda Processada!");
}

// --- RANKING & COMPARTILHAMENTO ---
function renderRanking() {
    document.getElementById('ranking-area').classList.remove('hidden');
    const table = document.getElementById('tabela-ranking');
    const sorted = [...db.times].sort((a,b) => b.pts - a.pts || b.booyahs - a.booyahs || b.kills - a.kills);

    table.innerHTML = `<tr><th>#</th><th>TIME</th><th style="text-align:center">K</th><th style="text-align:center">PTS</th></tr>` + 
    sorted.map((t, i) => `
        <tr>
            <td style="font-weight:900; color:${i<3?'var(--accent)':'white'}">${i+1}º</td>
            <td>
                ${t.nome} ${t.streak >= 2 ? '<span class="win-streak">🔥'+t.streak+'</span>' : ''}
                ${t.booyahs > 0 ? ' 🏆'.repeat(t.booyahs) : ''}
                <br><small style="color:#64748b">${t.nicks || 'Sem Nick'}</small>
            </td>
            <td style="text-align:center">${t.kills}</td>
            <td style="text-align:center; font-weight:900; color:var(--accent)">${t.pts}</td>
        </tr>
    `).join('');
}

// FORMATO ELITE WHATSAPP
function copiarTexto() {
    const emojiModo = db.modo === 'SOLO' ? '👤' : db.modo === 'DUO' ? '👥' : '🎖️';
    let txt = `🏆 *ASTRA FF - ${db.modo}* 🏆\n`;
    txt += `📅 *QUEDA:* ${db.rodadaAtual - 1} | *SALA:* ATIVA\n`;
    txt += `─`.repeat(15) + `\n\n`;

    const sorted = [...db.times].sort((a,b) => b.pts - a.pts);
    sorted.forEach((t, i) => {
        const medalha = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}º`;
        const foguinho = t.streak >= 2 ? ` 🔥${t.streak}` : '';
        txt += `${medalha} *${t.nome}*${foguinho} | Pts: *${t.pts}*\n`;
    });

    txt += `\n🚀 *Powered by Astra Elite Hub*`;
    
    navigator.clipboard.writeText(txt);
    alert("Ranking formatado para WhatsApp!");
}

// --- UTILITÁRIOS ---
function atualizarRelogio() {
    setInterval(() => {
        const d = new Date();
        document.getElementById('digital-clock').innerText = d.getHours().toString().padStart(2,'0') + ":" + d.getMinutes().toString().padStart(2,'0');
    }, 1000);
}

// Função para abrir o print (Ajustada para Mobile)
function baixarPrint() {
    const area = document.getElementById('capture-zone');
    html2canvas(area, { backgroundColor: '#020617', scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `ASTRA_RANKING_Q${db.rodadaAtual-1}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
}
