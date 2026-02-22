let db = { times: [], rodada: 1 };

function closeWelcome() {
    document.getElementById('welcome-modal').style.display = 'none';
}

function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
    const ov = document.getElementById('overlay');
    ov.style.display = ov.style.display === 'block' ? 'none' : 'block';
}

function showView(v) {
    document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
    document.getElementById('view-' + v).classList.add('active');
    if(v === 'queda') renderMotor();
    if(document.getElementById('sidebar').classList.contains('active')) toggleMenu();
}

function processarLista() {
    const val = document.getElementById('input-lista').value;
    if(!val) return alert("Cole a lista master!");
    db.times = val.split('\n').filter(l => l.trim()).map((l, i) => ({
        id: i, nome: l.replace(/^[0-9]+[\s-]*\.*[\s-]*/, '').trim().toUpperCase(),
        nicks: "", pix: "", pago: false, pontos: 0, kills: 0, booyahs: 0
    }));
    renderPix();
    showView('pix');
}

function renderPix() {
    const cont = document.getElementById('pix-list');
    cont.innerHTML = db.times.map(t => `
        <div class="glass-card" style="border-top: 2px solid ${t.pago ? 'var(--success)' : 'var(--danger)'}">
            <div class="slot-header">
                <span style="font-weight:900; letter-spacing:1px">${t.nome}</span>
                <div class="status-pill ${t.pago ? 'pago' : 'pendente'}" onclick="togglePago(${t.id})">
                    ${t.pago ? 'PAGO' : 'PENDENTE'}
                </div>
            </div>
            <input type="text" placeholder="PIX do responsável" value="${t.pix}" onchange="db.times[${t.id}].pix=this.value">
            <input type="text" placeholder="Nicks dos jogadores" value="${t.nicks}" onchange="db.times[${t.id}].nicks=this.value">
        </div>
    `).join('');
}

function togglePago(id) {
    db.times[id].pago = !db.times[id].pago;
    renderPix();
}

function renderMotor() {
    const cont = document.getElementById('motor-queda');
    if(db.times.length === 0) return cont.innerHTML = "Importe a lista primeiro!";
    cont.innerHTML = `<h3 class="section-title">QUEDA #${db.rodada}</h3>` + db.times.map(t => `
        <div class="glass-card">
            <div onclick="const s=this.nextElementSibling; s.style.display=s.style.display==='none'?'grid':'none'" style="cursor:pointer; display:flex; justify-content:space-between">
                <strong>▼ ${t.nome}</strong>
                <span style="color:var(--accent)">${t.pontos} PTS</span>
            </div>
            <div style="display:none; grid-template-columns: 1fr 1fr; gap:10px; padding-top:15px">
                <input type="number" id="pos_${t.id}" placeholder="Posição">
                <input type="number" id="kil_${t.id}" placeholder="Kills">
            </div>
        </div>
    `).join('') + `<button onclick="salvarQueda()" class="glow-button" style="margin-top:20px">ENCERRAR QUEDA</button>`;
}

function salvarQueda() {
    const lbff = {1:12, 2:9, 3:8, 4:7, 5:6, 6:5, 7:4, 8:3, 9:2, 10:1, 11:0, 12:0};
    db.times.forEach(t => {
        const p = parseInt(document.getElementById(`pos_${t.id}`).value) || 12;
        const k = parseInt(document.getElementById(`kil_${t.id}`).value) || 0;
        t.pontos += (lbff[p] || 0) + k;
        t.kills += k;
        if(p === 1) t.booyahs++;
    });
    db.rodada++;
    renderMotor();
    renderTabela();
}

function renderTabela() {
    const res = document.getElementById('tabela-resultado');
    const sorted = [...db.times].sort((a,b) => b.pontos - a.pontos);
    res.innerHTML = `<div class="glass-card"><h4>RANKING ATUAL</h4><table style="width:100%; font-size:0.85rem; margin-top:15px">` +
        sorted.map((t,i) => `<tr style="border-bottom:1px solid #1e293b"><td style="padding:10px">${i+1}º</td><td>${t.nome}</td><td style="color:var(--accent); font-weight:bold">${t.pontos} PTS</td></tr>`).join('') +
        `</table></div>`;
}

function buscar() {
    const term = document.getElementById('searchBar').value.toUpperCase();
    const res = document.getElementById('search-results');
    res.innerHTML = db.times.filter(x => x.nome.includes(term) || x.nicks.toUpperCase().includes(term))
        .map(x => `<div class="glass-card" style="padding:10px; margin-top:5px">${x.nome}<br><small style="color:var(--accent)">${x.nicks}</small></div>`).join('');
}
