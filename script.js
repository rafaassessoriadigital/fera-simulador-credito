let mesesSelecionados = 24;
const TAXA_MENSAL_ESTIMADA = 0.0245;

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function calcularParcela(valor, meses) {
  const n = Number(meses) || 24;
  const v = Number(valor) || 300;
  const taxa = TAXA_MENSAL_ESTIMADA;
  const fator = Math.pow(1 + taxa, n);
  return (v * (taxa * fator)) / (fator - 1);
}

function atualizarSimulacao() {
  const rangeEl = document.getElementById('valor-range');
  const displayEl = document.getElementById('valor-display');
  const parcelaEl = document.getElementById('parcela-estimada');

  if (!rangeEl || !displayEl || !parcelaEl) return;

  const valor = Number(rangeEl.value) || 300;
  const parcela = calcularParcela(valor, mesesSelecionados);

  displayEl.textContent = formatarMoeda(valor);
  parcelaEl.textContent = `${formatarMoeda(parcela)} / mês`;
}

function configurarEventosSimulacao() {
  const rangeEl = document.getElementById('valor-range');
  const botoesParcela = document.querySelectorAll('.parcela-btn');

  if (rangeEl) {
    rangeEl.addEventListener('input', atualizarSimulacao);
    rangeEl.addEventListener('change', atualizarSimulacao);
  }

  botoesParcela.forEach((btn) => {
    btn.addEventListener('click', () => {
      botoesParcela.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      mesesSelecionados = Number(btn.dataset.meses) || 24;
      atualizarSimulacao();
    });
  });

  const ativoInicial = document.querySelector('.parcela-btn.active');
  if (ativoInicial && ativoInicial.dataset.meses) {
    mesesSelecionados = Number(ativoInicial.dataset.meses) || 24;
  }

  atualizarSimulacao();
}

function irParaEtapa(numeroEtapa) {
  const etapas = [1, 2, 3, 4];
  etapas.forEach((num) => {
    const el = document.getElementById(`etapa-${num}`);
    if (el) {
      el.classList.toggle('hidden', num !== numeroEtapa);
    }
  });
}

function obterNomeModalidade() {
  const perfil = document.getElementById('perfil-cliente')?.value || 'inss';
  const mapa = {
    inss: 'Crédito Consignado INSS',
    clt_fgts: 'Antecipação Saque-Aniversário FGTS',
    clt_consignado: 'Crédito do Trabalhador (CLT)',
    servidor: 'Crédito Consignado Público',
    bolsa_familia: 'Linha Especial Benefício',
    autonomo: 'Crédito Pessoal / Análise de Perfil'
  };
  return mapa[perfil] || 'Crédito Fera';
}

function gerarResultado() {
  const nome = document.getElementById('nome-cliente')?.value.trim() || '';
  const cpf = document.getElementById('cpf-cliente')?.value.trim() || '';
  const celular = document.getElementById('celular-cliente')?.value.trim() || '';
  const msgErro = document.getElementById('msg-erro');

  if (!nome || !cpf || !celular) {
    if (msgErro) msgErro.classList.remove('hidden');
    return;
  }

  if (msgErro) msgErro.classList.add('hidden');

  const valor = Number(document.getElementById('valor-range')?.value) || 3000;
  const parcela = calcularParcela(valor, mesesSelecionados);
  const modalidade = obterNomeModalidade();

  document.getElementById('res-modalidade').textContent = modalidade;
  document.getElementById('res-valor').textContent = formatarMoeda(valor);
  document.getElementById('res-prazo').textContent = `${mesesSelecionados}x`;
  document.getElementById('res-parcela').textContent = `${formatarMoeda(parcela)} / mês`;

  const orientacaoEl = document.getElementById('texto-orientacao');
  if (orientacaoEl) {
    orientacaoEl.textContent = `Ficha gerada para ${nome}. Clique abaixo para enviar sua simulação ao consultor da Fera Soluções Financeiras no WhatsApp.`;
  }

  const textoMsg = encodeURIComponent(
    `Olá! Simulei no Simulador Visão de Águia:\n` +
    `• Nome: ${nome}\n` +
    `• CPF: ${cpf}\n` +
    `• WhatsApp: ${celular}\n` +
    `• Modalidade: ${modalidade}\n` +
    `• Valor: ${formatarMoeda(valor)}\n` +
    `• Prazo: ${mesesSelecionados}x\n` +
    `• Parcela estimada: ${formatarMoeda(parcela)} / mês`
  );

  const btnWhats = document.getElementById('btn-whatsapp');
  if (btnWhats) {
    btnWhats.href = `https://wa.me/5541988685625?text=${textoMsg}`;
  }

  irParaEtapa(4);
}

document.addEventListener('DOMContentLoaded', configurarEventosSimulacao);
