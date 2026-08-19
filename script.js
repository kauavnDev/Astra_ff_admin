let especiesData = [];
let activeFilter = 'todos';

const catalogGrid = document.getElementById('catalogGrid');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');
const statsCounter = document.getElementById('statsCounter');

// 1. Carrega os dados do arquivo JSON
async function loadCatalogData() {
  try {
    const response = await fetch('dados.json');
    especiesData = await response.json();
    renderCatalog();
  } catch (error) {
    if (statsCounter) {
      statsCounter.innerHTML = '⚠️ Erro ao carregar o catálogo de espécies.';
    }
    console.error('Erro ao buscar o JSON:', error);
  }
}

// 2. Renderiza os cards dinamicamente
function renderCatalog() {
  if (!catalogGrid) return;

  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const filtered = especiesData.filter(function (item) {
    let matchesCategory = false;
    if (activeFilter === 'todos') {
      matchesCategory = true;
    } else if (activeFilter === 'ameacadas') {
      matchesCategory = item.status === 'Vulnerável' || item.status === 'Protegida';
    } else {
      matchesCategory = item.categoria === activeFilter;
    }

    const matchesSearch = query === '' ||
      item.nome.toLowerCase().includes(query) ||
      item.cientifico.toLowerCase().includes(query) ||
      item.habitat.toLowerCase().includes(query) ||
      item.descricao.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  if (statsCounter) {
    statsCounter.innerHTML = filtered.length === 0 
      ? '⚠️ Nenhuma espécie encontrada para os filtros selecionados.'
      : 'Exibindo <strong>' + filtered.length + '</strong> de <strong>' + especiesData.length + '</strong> espécies cadastradas.';
  }

  catalogGrid.innerHTML = filtered.map(function (item) {
    const badgeClass = item.categoria === 'fauna' ? 'fauna' : 'flora';
    let statusBadge = '';
    
    if (item.status && item.status !== 'Pouco Preocupante') {
      const statusClass = item.status === 'Vulnerável' ? 'warning' : 'protected';
      statusBadge = '<span class="badge ' + statusClass + '">' + item.status + '</span>';
    }

    return '<article class="card">' +
      '<img class="card-img" src="' + item.imagem + '" alt="' + item.nome + '" loading="lazy" onerror="this.src=\'https://via.placeholder.com/500x300?text=Sem+Imagem\'">' +
      '<div class="card-body">' +
        '<div>' +
          '<span class="badge ' + badgeClass + '">' + item.categoria + '</span>' +
          statusBadge +
        '</div>' +
        '<h3 class="card-title">' + item.nome + '</h3>' +
        '<p class="card-scientific">' + item.cientifico + '</p>' +
        '<p class="card-habitat">📍 <strong>Ecossistema:</strong> ' + item.habitat + '</p>' +
        '<p class="card-desc">' + item.descricao + '</p>' +
      '</div>' +
    '</article>';
  }).join('');
}

// Eventos de Busca e Filtros
if (searchInput) {
  searchInput.addEventListener('input', renderCatalog);
}

filterButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    filterButtons.forEach(function (btn) {
      btn.classList.remove('active');
    });
    button.classList.add('active');
    activeFilter = button.getAttribute('data-category');
    renderCatalog();
  });
});

// Inicializa o carregamento
loadCatalogData();
