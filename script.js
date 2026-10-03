/* ==========================================================================
   Dinheiro Organizado — Lógica
   Índice:
     1. Constantes e atalhos
     2. Estado e armazenamento
     3. Cálculos e regras
     4. Orientação ao usuário
     5. Desenho da tela (resumo, lista, gráfico, JSON)
     6. Eventos
     7. Início
   ========================================================================== */

(() => {
  'use strict';


  /* 1. CONSTANTES E ATALHOS ---------------------------------------------- */

  const CHAVE_ARMAZENAMENTO = 'dinheiro-organizado:v1';

  const ESTADO_INICIAL = {
    usuario: '',
    entradas: [],
    despesas: [],
    caixinhas: []
  };

  // Textos de cada aba
  const ABAS = {
    despesas: {
      titulo: 'Gastos',
      ajuda: 'Anote cada gasto: mercado, transporte, assinaturas…',
      exemplo: 'Ex.: Mercado'
    },
    entradas: {
      titulo: 'Entradas',
      ajuda: 'Salário, aluguel recebido ou qualquer outra renda.',
      exemplo: 'Ex.: Salário'
    },
    caixinhas: {
      titulo: 'Caixinhas',
      ajuda: 'Dinheiro guardado para uma reserva ou objetivo.',
      exemplo: 'Ex.: Reserva de emergência'
    }
  };

  const formatarMoeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  const $ = (id) => document.getElementById(id);
  const clonar = (objeto) => JSON.parse(JSON.stringify(objeto));


  /* 2. ESTADO E ARMAZENAMENTO -------------------------------------------- */

  let estado = carregarEstado();
  let abaAtual = 'despesas';

  // Mantém só lançamentos válidos: { descricao: texto, valor: número }
  function filtrarLancamentos(lista) {
    if (!Array.isArray(lista)) return [];

    return lista
      .filter((item) => item && typeof item.valor === 'number' && isFinite(item.valor))
      .map((item) => ({
        descricao: String(item.descricao || '').slice(0, 60),
        valor: item.valor
      }));
  }

  function carregarEstado() {
    try {
      const salvo = localStorage.getItem(CHAVE_ARMAZENAMENTO);

      if (salvo) {
        const dados = JSON.parse(salvo);
        return {
          usuario: String(dados.usuario || ''),
          entradas: filtrarLancamentos(dados.entradas),
          despesas: filtrarLancamentos(dados.despesas),
          caixinhas: filtrarLancamentos(dados.caixinhas)
        };
      }
    } catch (erro) {
      // Armazenamento indisponível ou dados corrompidos: começa do zero
    }

    return clonar(ESTADO_INICIAL);
  }

  function salvarEstado() {
    try {
      localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(estado));
    } catch (erro) {
      // Sem armazenamento: o app continua funcionando nesta sessão
    }
  }


  /* 3. CÁLCULOS E REGRAS ------------------------------------------------- */

  // Soma os valores de uma lista, evitando erros de centavos
  function somar(lista) {
    const centavos = lista.reduce((total, item) => total + item.valor * 100, 0);
    return Math.round(centavos) / 100;
  }

  // Converte "1.250,90", "R$ 25,90" ou "25.90" em número (NaN se inválido)
  function converterValor(texto) {
    let limpo = String(texto).trim().replace(/R\$\s?/i, '').replace(/\s/g, '');

    if (limpo.includes(',')) {
      limpo = limpo.replace(/\./g, '').replace(',', '.');
    }

    const numero = Number(limpo);
    return isFinite(numero) ? Math.round(numero * 100) / 100 : NaN;
  }

  // Totais e saldo: saldo = entradas − gastos − guardado
  function calcularResumo() {
    const entradas = somar(estado.entradas);
    const despesas = somar(estado.despesas);
    const guardado = somar(estado.caixinhas);

    return {
      total_entradas: entradas,
      total_despesas: despesas,
      total_economizado: guardado,
      saldo_disponivel: Math.round((entradas - despesas - guardado) * 100) / 100
    };
  }

  // Porcentagem entre 0 e 100
  function porcentagem(valor, total) {
    return total > 0 ? Math.max(0, Math.min(100, (valor / total) * 100)) : 0;
  }

  // Objeto completo trocado em JSON (entrada + processamento + saída)
  function gerarJSON() {
    const resumo = calcularResumo();

    return {
      usuario: estado.usuario,
      entradas: estado.entradas,
      despesas: estado.despesas,
      caixinhas: estado.caixinhas,
      resumo,
      recomendacao: gerarOrientacao(resumo)
    };
  }


  /* 4. ORIENTAÇÃO AO USUÁRIO --------------------------------------------- */

  function gerarOrientacao(resumo) {
    const nome = estado.usuario ? `${estado.usuario}, ` : '';
    const semRegistros = !estado.entradas.length && !estado.despesas.length && !estado.caixinhas.length;

    if (semRegistros) {
      return 'Comece registrando o que você recebe neste mês na aba Entradas. Depois anote seus gastos.';
    }

    if (resumo.total_entradas === 0) {
      return `${nome}você já registrou gastos, mas falta informar suas entradas. Sem elas não dá para calcular o saldo.`;
    }

    const parteGastos = resumo.total_despesas / resumo.total_entradas;
    const parteGuardada = resumo.total_economizado / resumo.total_entradas;
    const maiorGasto = [...estado.despesas].sort((a, b) => b.valor - a.valor)[0];

    if (resumo.saldo_disponivel < 0) {
      const excesso = formatarMoeda.format(Math.abs(resumo.saldo_disponivel));
      const sugestao = maiorGasto ? `, a começar por “${maiorGasto.descricao}”` : '';
      return `${nome}você está gastando e guardando mais do que recebe (${excesso} acima). Corte primeiro gastos que não são essenciais${sugestao}.`;
    }

    if (parteGastos >= 0.8) {
      const sugestao = maiorGasto ? ` “${maiorGasto.descricao}”, seu maior gasto,` : '';
      return `${nome}seus gastos consomem ${Math.round(parteGastos * 100)}% das entradas. Revise${sugestao} e procure um item para reduzir.`;
    }

    if (parteGuardada === 0) {
      return `${nome}seus gastos estão sob controle. Que tal separar uma primeira quantia na aba Caixinhas, mesmo que pequena?`;
    }

    if (parteGuardada < 0.1) {
      return `${nome}você já guarda ${Math.round(parteGuardada * 100)}% do que recebe. Tente chegar a 10% e depois a 20%.`;
    }

    if (parteGuardada < 0.2) {
      return `${nome}bom ritmo: você guarda ${Math.round(parteGuardada * 100)}% das entradas. Falta pouco para os 20%.`;
    }

    return `${nome}ótimo! Você guarda ${Math.round(parteGuardada * 100)}% do que recebe. Mantenha o hábito e defina um objetivo para suas caixinhas.`;
  }


  /* 5. DESENHO DA TELA --------------------------------------------------- */

  // 5.1 Saldo e totais
  function desenharResumo(resumo) {
    $('saldo').textContent = formatarMoeda.format(resumo.saldo_disponivel);
    $('total-entradas').textContent = formatarMoeda.format(resumo.total_entradas);
    $('total-gastos').textContent = formatarMoeda.format(resumo.total_despesas);
    $('total-guardado').textContent = formatarMoeda.format(resumo.total_economizado);

    $('saldo-titulo').textContent = estado.usuario
      ? `Saldo disponível de ${estado.usuario}`
      : 'Saldo disponível';

    $('dica').textContent = gerarOrientacao(resumo);
  }

  // 5.2 Barra de distribuição (gastos / guardado / sobra)
  function desenharBarra(resumo) {
    let pctGastos = porcentagem(resumo.total_despesas, resumo.total_entradas);
    let pctGuardado = porcentagem(resumo.total_economizado, resumo.total_entradas);

    // Se passar de 100%, reduz as duas partes na mesma proporção
    if (pctGastos + pctGuardado > 100) {
      const fator = 100 / (pctGastos + pctGuardado);
      pctGastos *= fator;
      pctGuardado *= fator;
    }

    const pctSobra = resumo.total_entradas > 0 ? Math.max(0, 100 - pctGastos - pctGuardado) : 0;

    $('barra').innerHTML = `
      <i style="width: ${pctGastos}%; background: var(--gasto)"></i>
      <i style="width: ${pctGuardado}%; background: var(--guardado)"></i>
      <i style="width: ${pctSobra}%; background: var(--entrada)"></i>`;

    $('pct-gastos').textContent = `${Math.round(pctGastos)}%`;
    $('pct-guardado').textContent = `${Math.round(pctGuardado)}%`;
    $('pct-sobra').textContent = `${Math.round(pctSobra)}%`;
  }

  // 5.3 Gráfico de barras em SVG (entradas, gastos, guardado e saldo)
  function arredondarEscala(valor) {
    if (valor <= 0) return 100;

    const potencia = Math.pow(10, Math.floor(Math.log10(valor)));
    const fracao = valor / potencia;
    const passo = fracao <= 1 ? 1 : fracao <= 2 ? 2 : fracao <= 5 ? 5 : 10;

    return passo * potencia;
  }

  function desenharGrafico(resumo) {
    const barras = [
      { nome: 'Entradas', valor: resumo.total_entradas, cor: 'var(--entrada)' },
      { nome: 'Gastos', valor: resumo.total_despesas, cor: 'var(--gasto)' },
      { nome: 'Guardado', valor: resumo.total_economizado, cor: 'var(--guardado)' },
      {
        nome: 'Saldo',
        valor: resumo.saldo_disponivel,
        cor: resumo.saldo_disponivel < 0 ? 'var(--gasto)' : 'var(--texto)'
      }
    ];

    // Dimensões e margens do desenho
    const largura = 600;
    const altura = 270;
    const margem = { esquerda: 8, direita: 8, topo: 26, base: 34 };
    const areaLargura = largura - margem.esquerda - margem.direita;
    const areaAltura = altura - margem.topo - margem.base;

    // Escala vertical (aceita saldo negativo)
    const valores = barras.map((b) => b.valor);
    const maximo = arredondarEscala(Math.max(0, ...valores));
    const minimo = Math.min(0, ...valores) < 0 ? -arredondarEscala(-Math.min(0, ...valores)) : 0;
    const eixoY = (valor) => margem.topo + ((maximo - valor) / (maximo - minimo)) * areaAltura;

    // Linhas de grade
    let grade = '';
    for (let i = 0; i <= 4; i++) {
      const y = eixoY(minimo + ((maximo - minimo) * i) / 4);
      grade += `<line class="grade" x1="${margem.esquerda}" x2="${largura - margem.direita}" y1="${y}" y2="${y}"/>`;
    }

    // Barras, valores e nomes
    const larguraColuna = areaLargura / barras.length;
    let desenho = '';

    barras.forEach((barra, i) => {
      const larguraBarra = Math.min(larguraColuna * 0.55, 90);
      const centro = margem.esquerda + larguraColuna * i + larguraColuna / 2;
      const yZero = eixoY(0);
      const yValor = eixoY(barra.valor);
      const topo = Math.min(yZero, yValor);
      const alturaBarra = Math.max(Math.abs(yZero - yValor), barra.valor === 0 ? 0 : 2);
      const yRotulo = barra.valor < 0 ? yValor + 16 : topo - 7;

      desenho += `
        <rect x="${centro - larguraBarra / 2}" y="${topo}" width="${larguraBarra}" height="${alturaBarra}" rx="6" fill="${barra.cor}"/>
        <text class="valor" x="${centro}" y="${yRotulo}" text-anchor="middle">${formatarMoeda.format(barra.valor)}</text>
        <text x="${centro}" y="${altura - 10}" text-anchor="middle">${barra.nome}</text>`;
    });

    const descricaoAcessivel =
      `Gráfico de barras com entradas ${formatarMoeda.format(resumo.total_entradas)}, ` +
      `gastos ${formatarMoeda.format(resumo.total_despesas)}, ` +
      `guardado ${formatarMoeda.format(resumo.total_economizado)} ` +
      `e saldo ${formatarMoeda.format(resumo.saldo_disponivel)}`;

    $('grafico').innerHTML = `
      <svg viewBox="0 0 ${largura} ${altura}" role="img" aria-label="${descricaoAcessivel}">
        ${grade}
        ${desenho}
        <line class="zero" x1="${margem.esquerda}" x2="${largura - margem.direita}" y1="${eixoY(0)}" y2="${eixoY(0)}"/>
      </svg>`;
  }

  // 5.4 Lista da aba atual
  function desenharLista() {
    const aba = ABAS[abaAtual];
    const lista = estado[abaAtual];
    const ul = $('lista');

    $('registros-titulo').textContent = aba.titulo;
    $('registros-ajuda').textContent = aba.ajuda;
    $('descricao').placeholder = aba.exemplo;
    $('subtotal').textContent = formatarMoeda.format(somar(lista));

    ul.innerHTML = '';

    if (!lista.length) {
      const vazio = document.createElement('li');
      vazio.className = 'vazio';
      vazio.textContent = 'Nada por aqui ainda. Adicione o primeiro registro acima.';
      ul.appendChild(vazio);
      return;
    }

    lista.forEach((item, indice) => {
      const li = document.createElement('li');

      const descricao = document.createElement('span');
      descricao.className = 'descricao';
      descricao.textContent = item.descricao;

      const valor = document.createElement('span');
      valor.className = 'valor-item';
      valor.textContent = formatarMoeda.format(item.valor);

      const remover = document.createElement('button');
      remover.type = 'button';
      remover.textContent = 'Remover';
      remover.setAttribute('aria-label', `Remover ${item.descricao}`);
      remover.addEventListener('click', () => {
        estado[abaAtual].splice(indice, 1);
        salvarEstado();
        desenhar();
      });

      li.append(descricao, valor, remover);
      ul.appendChild(li);
    });
  }

  // 5.5 Atualiza a tela inteira
  function desenhar() {
    const resumo = calcularResumo();

    desenharResumo(resumo);
    desenharBarra(resumo);
    desenharGrafico(resumo);
    desenharLista();

    $('json').textContent = JSON.stringify(gerarJSON(), null, 2);
  }


  /* 6. EVENTOS ----------------------------------------------------------- */

  // 6.1 Troca de aba
  document.querySelectorAll('[role="tab"]').forEach((aba) => {
    aba.addEventListener('click', () => {
      abaAtual = aba.dataset.tipo;

      document.querySelectorAll('[role="tab"]').forEach((outra) => {
        outra.setAttribute('aria-selected', outra === aba);
      });

      $('registros').setAttribute('aria-labelledby', aba.id);
      $('erro').textContent = '';
      desenhar();
    });
  });

  // 6.2 Adicionar registro
  $('formulario').addEventListener('submit', (evento) => {
    evento.preventDefault();

    const descricao = $('descricao').value.trim();
    const valor = converterValor($('valor').value);

    if (!descricao) {
      $('erro').textContent = 'Escreva uma descrição.';
      $('descricao').focus();
      return;
    }

    if (!(valor > 0)) {
      $('erro').textContent = 'Digite um valor maior que zero, como 25,90.';
      $('valor').focus();
      return;
    }

    estado[abaAtual].push({ descricao, valor });

    $('descricao').value = '';
    $('valor').value = '';
    $('erro').textContent = '';

    salvarEstado();
    desenhar();
    $('descricao').focus();
  });

  // 6.3 Nome do usuário
  $('nome').addEventListener('input', (evento) => {
    estado.usuario = evento.target.value.trim();
    salvarEstado();
    desenhar();
  });

  // 6.4 Copiar JSON
  $('copiar').addEventListener('click', (evento) => {
    const botao = evento.currentTarget;
    const texto = $('json').textContent;

    const avisarCopiado = () => {
      botao.textContent = 'Copiado';
      setTimeout(() => { botao.textContent = 'Copiar JSON'; }, 1500);
    };

    // Plano B: seleciona o texto para o usuário copiar com Ctrl+C
    const selecionarTexto = () => {
      const intervalo = document.createRange();
      intervalo.selectNodeContents($('json'));
      const selecao = window.getSelection();
      selecao.removeAllRanges();
      selecao.addRange(intervalo);
      botao.textContent = 'Selecionado: use Ctrl+C';
    };

    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto).then(avisarCopiado, selecionarTexto);
    } else {
      selecionarTexto();
    }
  });

  // 6.5 Apagar tudo (pede um segundo clique em até 4 segundos)
  let aguardandoConfirmacao = false;
  let temporizador;

  $('limpar').addEventListener('click', (evento) => {
    const botao = evento.currentTarget;

    if (!aguardandoConfirmacao) {
      aguardandoConfirmacao = true;
      botao.textContent = 'Clique de novo para apagar tudo';
      temporizador = setTimeout(() => {
        aguardandoConfirmacao = false;
        botao.textContent = 'Apagar tudo';
      }, 4000);
      return;
    }

    clearTimeout(temporizador);
    aguardandoConfirmacao = false;
    botao.textContent = 'Apagar tudo';

    estado = clonar(ESTADO_INICIAL);
    $('nome').value = '';
    salvarEstado();
    desenhar();
  });


  /* 7. INÍCIO ------------------------------------------------------------ */

  $('nome').value = estado.usuario;
  desenhar();
})();
