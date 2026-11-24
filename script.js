let notaSelecionada = 0;
let tagsSelecionadas = [];
const STORAGE_KEY = 'avaliacoes_culminancia_v1';

const descricoesNotas = {
  1: '1 estrela - Precisa melhorar muito',
  2: '2 estrelas - Razoável',
  3: '3 estrelas - Bom!',
  4: '4 estrelas - Muito bom!',
  5: '5 estrelas - Excelente! Parabéns!'
};

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  configurarEstrelas();
  configurarTags();
  gerarQRCode();
  atualizarPainelResultados();
});

// Alternar entre abas (Avaliar, QR Code, Resultados)
function mudarAba(nomeAba, botaoClicado) {
  document.querySelectorAll('.aba').forEach(aba => aba.classList.remove('ativa'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

  document.getElementById(`aba-${nomeAba}`).classList.add('ativa');
  if (botaoClicado) {
    botaoClicado.classList.add('active');
  }

  if (nomeAba === 'resultados') {
    atualizarPainelResultados();
  }
}

// Lógica das Estrelas
function configurarEstrelas() {
  const estrelas = document.querySelectorAll('.estrela');
  const textoNota = document.getElementById('texto-nota');

  estrelas.forEach(estrela => {
    estrela.addEventListener('click', () => {
      notaSelecionada = parseInt(estrela.getAttribute('data-valor'));
      textoNota.textContent = descricoesNotas[notaSelecionada];

      estrelas.forEach(e => {
        const valor = parseInt(e.getAttribute('data-valor'));
        e.classList.toggle('ativa', valor <= notaSelecionada);
      });
    });
  });
}

// Lógica das Tags (Pontos Positivos)
function configurarTags() {
  const botoesTag = document.querySelectorAll('.tag');

  botoesTag.forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.getAttribute('data-tag');
      btn.classList.toggle('selecionada');

      if (tagsSelecionadas.includes(tag)) {
        tagsSelecionadas = tagsSelecionadas.filter(t => t !== tag);
      } else {
        tagsSelecionadas.push(tag);
      }
    });
  });
}

// Envio do Formulário
document.getElementById('form-avaliacao').addEventListener('submit', (e) => {
  e.preventDefault();

  if (notaSelecionada === 0) {
    alert('Por favor, selecione uma nota de 1 a 5 estrelas antes de enviar!');
    return;
  }

  const novaAvaliacao = {
    id: Date.now(),
    nome: document.getElementById('nome').value.trim() || 'Anônimo',
    nota: notaSelecionada,
    tags: [...tagsSelecionadas],
    comentario: document.getElementById('comentario').value.trim(),
    data: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  };

  const avaliacoes = obterAvaliacoes();
  avaliacoes.unshift(novaAvaliacao);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(avaliacoes));

  // Efeito de confete e tela de sucesso
  if (typeof confetti === 'function') {
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
  }

  document.getElementById('card-formulario').classList.add('oculto');
  document.getElementById('card-sucesso').classList.remove('oculto');
});

// Resetar formulário para uma nova resposta
function novoFeedback() {
  document.getElementById('form-avaliacao').reset();
  notaSelecionada = 0;
  tagsSelecionadas = [];

  document.querySelectorAll('.estrela').forEach(e => e.classList.remove('ativa'));
  document.querySelectorAll('.tag').forEach(t => t.classList.remove('selecionada'));
  document.getElementById('texto-nota').textContent = 'Toque nas estrelas para dar uma nota';

  document.getElementById('card-sucesso').classList.add('oculto');
  document.getElementById('card-formulario').classList.remove('oculto');
}

// Gerar QR Code automaticamente com a URL atual
function gerarQRCode() {
  const urlAtual = window.location.href;
  document.getElementById('url-display').textContent = urlAtual;

  const containerQR = document.getElementById('qrcode');
  containerQR.innerHTML = '';

  new QRCode(containerQR, {
    text: urlAtual,
    width: 220,
    height: 220,
    colorDark: '#1e293b',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });
}

function copiarLink() {
  navigator.clipboard.writeText(window.location.href);
  alert('Link copiado para a área de transferência!');
}

// Buscar dados salvos
function obterAvaliacoes() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

// Atualizar aba de Resultados
function atualizarPainelResultados() {
  const avaliacoes = obterAvaliacoes();
  const total = avaliacoes.length;

  document.getElementById('total-avaliacoes').textContent = total;

  if (total === 0) {
    document.getElementById('media-geral').textContent = '0.0 ⭐';
    document.getElementById('resumo-tags').innerHTML = '<p class="vazio">Nenhuma avaliação registrada ainda.</p>';
    document.getElementById('lista-comentarios').innerHTML = '<p class="vazio">Nenhum comentário recebido ainda.</p>';
    return;
  }

  // Calcular média
  const somaNotas = avaliacoes.reduce((acc, item) => acc + item.nota, 0);
  const media = (somaNotas / total).toFixed(1);
  document.getElementById('media-geral').textContent = `${media} ⭐`;

  // Contabilizar Tags
  const contagemTags = {};
  avaliacoes.forEach(av => {
    av.tags.forEach(tag => {
      contagemTags[tag] = (contagemTags[tag] || 0) + 1;
    });
  });

  const containerTags = document.getElementById('resumo-tags');
  const tagsOrdenadas = Object.entries(contagemTags).sort((a, b) => b[1] - a[1]);

  if (tagsOrdenadas.length > 0) {
    containerTags.innerHTML = tagsOrdenadas
      .map(([tag, qtd]) => `<span class="tag-badge-resultado">${tag}: ${qtd}x</span>`)
      .join('');
  } else {
    containerTags.innerHTML = '<p class="vazio">Nenhum destaque marcado ainda.</p>';
  }

  // Listar Comentários (apenas com o nome)
  const listaComentarios = document.getElementById('lista-comentarios');
  listaComentarios.innerHTML = avaliacoes.map(av => `
    <div class="comentario-item">
      <div class="comentario-topo">
        <strong>${av.nome}</strong>
        <span>${'⭐'.repeat(av.nota)}</span>
      </div>
      ${av.tags.length ? `<small style="color:#4f46e5">${av.tags.join(' • ')}</small>` : ''}
      ${av.comentario ? `<p class="comentario-texto">"${av.comentario}"</p>` : ''}
    </div>
  `).join('');
}

// Exportar resultados para Excel / CSV (sem a coluna Turma)
function exportarCSV() {
  const avaliacoes = obterAvaliacoes();
  if (avaliacoes.length === 0) {
    alert('Não há avaliações para exportar.');
    return;
  }

  let csv = 'Nome;Nota;Destaques;Comentario;Horario\n';
  avaliacoes.forEach(av => {
    const comentarioLimpo = av.comentario.replace(/(\r\n|\n|\r|;)/gm, ' ');
    csv += `${av.nome};${av.nota};"${av.tags.join(', ')}";"${comentarioLimpo}";${av.data}\n`;
  });

  const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'avaliacoes-culminancia.csv';
  link.click();
}

// Limpar dados
function limparDados() {
  if (confirm('Tem certeza que deseja apagar todas as avaliações salvas neste dispositivo?')) {
    localStorage.removeItem(STORAGE_KEY);
    atualizarPainelResultados();
  }
}
