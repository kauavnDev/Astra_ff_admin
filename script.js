let app = {
    times: [],
    queda: 1,
    modo: 'SOLO'
};

function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
    const overlay = document.getElementById('overlay');
    overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active');
    
    // UI Refresh
    if(viewId === 'pix') renderPix();
    if(viewId === 'queda') renderMotor();
    
    // Close Sidebar
    if(document.getElementById('sidebar').classList.contains('active')) toggleMenu();
}

function cadastrarTimes() {
    const input = document.getElementById('master-list-input').value;
    if(!input.trim()) return alert("Erro: Lista vazia.");

    app.times = input.split('\n').filter(l => l.trim()).map((linha, i) => ({
        id: i,
        nome: linha.replace(/^[0-9]+[\s-]*\.*[\s-]*/, '').trim().toUpperCase(),
        pago: false,
        nicks: "",
        pts: 0,
        kills: 0,
        booyahs: 0,
        dqCount: 0,
        status: "NORMAL" // NORMAL, W.O, DQ
    }));

    alert("Times Cadastrados com Sucesso!");
    showView('pix');
}

function renderPix() {
    const container = document.getElementById('pix-container');
    container.innerHTML = app.times.map(t => `
        <div class="card-glass" style="border-left: 5px solid ${t.pago ? 'var(--success)' : 'var(--danger)'}">
            <div style="display:flex; justify-content:space-between; align-items:center">
                <span style="font-weight:800">${t.nome}</span>
                <button class="btn-status-pay ${t.pago ? 'pago' : 'pendente'}" onclick="togglePago(${t.id})">
                    ${t.pago ? 'PAGO' : 'PENDENTE'}
                </button>
            </div>
            <input type="text" placeholder="Nicks dos jogadores" value="${t.nicks}" onchange="app.times[${t.id}].nicks = this.value">
        </div>
    `).join('');
}

function togglePago(id) {
    app.times[id].pago = !app.times[id].pago;
    renderPix();
}

function renderMotor() {
    const container = document.getElementById('motor-slots-area');
    document.getElementById('hud-round-val').innerText = app.queda;
    
    container.innerHTML = app.times.map(t => `
        <div class="slot-queda-card">
            <div class="slot-header" onclick="this.nextElementSibling.classList.toggle('minimized')">
                <span style="font-weight:800; font-size:0.8rem">#${t.id+1} ${t.nome}</span>
                <span style="color:var(--accent); font-size:0.7rem">${t.pts} PTS</span>
            </div>
            <div class="slot-body minimized">
                <div>
                    <label style="font-size:0.6rem">STATUS</label>
                    <select id="st_${t.id}" onchange="atualizarStatusSlot(${t.id}, this.value)">
                        <option value="NORMAL">NORMAL</option>
                        <option value="WO">W.O.</option>
                        <option value="DQ">DQ (ELIMINADO)</option>
                    </select>
                </div>
                <div>
                    <label style="font-size:0.6rem">PUNIÇÃO (-)</label>
                    <input type="number" id="pun_${t.id}" value="0">
                </div>
                <div>
                    <label style="font-size:0.6rem">POSIÇÃO</label>
                    <input type="number" id="pos_${t.id}" placeholder="1-12">
                </div>
                <div>
                    <label style="font-size:0.6rem">KILLS</label>
                    <input type="number" id="kil_${t.id}" placeholder="0">
                </div>
            </div>
        </div>
    `).join('');
}

function processarQueda() {
    if(!confirm("Encerrar queda " + app.queda + "?")) return;
    const lbff = {1:12, 2:9, 3:8, 4:7, 5:6, 6:5, 7:4, 8:3, 9:2, 10:1, 11:0, 12:0};

    app.times.forEach(t => {
        const st = document.getElementById(`st_${t.id}`).value;
        const pun = parseInt(document.getElementById(`pun_${t.id}`).value) || 0;
        
        if(st === "NORMAL") {
            const pos = parseInt(document.getElementById(`pos_${t.id}`).value) || 12;
            const kil = parseInt(document.getElementById(`kil_${t.id}`).value) || 0;
            t.pts += (lbff[pos] || 0) + kil - pun;
            t.kills += kil;
            if(pos === 1) t.booyahs++;
        } else if(st === "WO") {
            t.pts -= 0; // W.O geralmente não pontua e não perde nada além da queda
        } else if(st === "DQ") {
            t.pts -= pun; // Aplica punição se houver
        }
    });

    app.queda++;
    renderMotor();
    alert("Queda finalizada!");
}

function handleSearch() {
    const termo = document.getElementById('search-input').value.toUpperCase();
    const area = document.getElementById('search-results-area');
    if(!termo) return area.innerHTML = "";

    const filtered = app.times.filter(t => t.nome.includes(termo) || t.nicks.toUpperCase().includes(termo));
    area.innerHTML = filtered.map(t => `
        <div class="card-glass">
            <b style="color:var(--accent)">${t.nome}</b><br>
            <small>NICKS: ${t.nicks || 'Vazio'}</small><br>
            <small>STATUS: ${t.pago ? 'PAGO' : 'PENDENTE'}</small>
        </div>
    `).join('');
}

function resetSystem() {
    if(confirm("Deseja apagar TUDO?")) location.reload();
}

// Relógio HUD
setInterval(() => {
    const d = new Date();
    document.getElementById('digital-clock').innerText = d.getHours() + ":" + String(d.getMinutes()).padStart(2, '0');
}, 1000);
