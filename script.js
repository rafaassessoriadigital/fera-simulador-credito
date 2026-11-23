const CONSULTORES = {
  Rafa: { nome: "Rafa", whatsapp: "5541988685625" },
  Nanda: { nome: "Nanda", whatsapp: "5511983773894" }
};

const RODIZIO_ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbyfmXcl46nco8bn99aksjkdoqCv_CsjdT08zF59SsYGgJyend1prWfvhuG65X90kbEw/exec";

let valorSelecionado = 3000;
let mesesSelecionados = 24;
let ultimoEnvioHash = "";
let ultimoConsultorAtribuido = null;
let enviandoFicha = false;

const valorRange = document.getElementById("valor-range");
const valorDisplay = document.getElementById("valor-display");
const parcelaEstimadaEl = document.getElementById("parcela-estimada");
const botoesParcela = document.querySelectorAll(".parcela-btn");

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calcularParcela() {
  const taxa = 0.022;
  const fator = Math.pow(1 + taxa, mesesSelecionados);
  const parcela = (valorSelecionado * (taxa * fator)) / (fator - 1);
  if (parcelaEstimadaEl) {
    parcelaEstimadaEl.textContent = `${formatarMoeda(parcela)} / mês`;
  }
  return parcela;
}

if (valorRange) {
  valorRange.addEventListener("input", (e) => {
    valorSelecionado = Number(e.target.value);
    if (valorDisplay) {
      valorDisplay.textContent = formatarMoeda(valorSelecionado);
    }
    calcularParcela();
  });
}

botoesParcela.forEach((btn) => {
  btn.addEventListener("click", () => {
    botoesParcela.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    mesesSelecionados = Number(btn.dataset.meses);
    calcularParcela();
  });
});

function irParaEtapa(numero) {
  for (let i = 1; i <= 4; i++) {
    const etapa = document.getElementById(`etapa-${i}`);
    if (etapa) etapa.classList.add("hidden");
  }
  const alvo = document.getElementById(`etapa-${numero}`);
  if (alvo) alvo.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Máscaras de CPF, Celular e CEP
const inputCpf = document.getElementById("cpf-cliente");
if (inputCpf) {
  inputCpf.addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    e.target.value = v;
  });
}

const inputCelular = document.getElementById("celular-cliente");
if (inputCelular) {
  inputCelular.addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/, "($1) $2");
    v = v.replace(/(\d)(\d{4})$/, "$1-$2");
    e.target.value = v;
  });
}

const inputCep = document.getElementById("cep-cliente");
if (inputCep) {
  inputCep.addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "");
    v = v.replace(/^(\d{5})(\d)/, "$1-$2");
    e.target.value = v;

    const cepLimpo = v.replace(/\D/g, "");
    if (cepLimpo.length === 8) {
      fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
        .then((res) => res.json())
        .then((dados) => {
          if (!dados.erro) {
            document.getElementById("logradouro-cliente").value = dados.logradouro || "";
            document.getElementById("bairro-cliente").value = dados.bairro || "";
            document.getElementById("cidade-cliente").value = dados.localidade || "";
            document.getElementById("uf-cliente").value = dados.uf || "PR";
            document.getElementById("numero-cliente").focus();
          }
        })
        .catch((err) => console.warn("ViaCEP indisponível no momento:", err));
    }
  });
}

function formatarDataBR(dataIso) {
  if (!dataIso || !dataIso.includes("-")) return "";
  const partes = dataIso.split("-");
  if (partes.length !== 3) return dataIso;
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

async function resolverConsultorNoServidor(payload) {
  if (!RODIZIO_ENDPOINT_URL || RODIZIO_ENDPOINT_URL.startsWith("COLE_AQUI")) {
    return Math.random() < 0.5 ? CONSULTORES.Rafa : CONSULTORES.Nanda;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const resp = await fetch(RODIZIO_ENDPOINT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!resp.ok) throw new Error("Resposta inválida do endpoint");
    const data = await resp.json();
    return data.consultor === "Nanda" ? CONSULTORES.Nanda : CONSULTORES.Rafa;
  } catch (err) {
    clearTimeout(timer);
    console.warn("Falha no Apps Script, usando fallback:", err);
    return Math.random() < 0.5 ? CONSULTORES.Rafa : CONSULTORES.Nanda;
  }
}

function atualizarLinkWhatsApp(consultorEscolhido, dadosFicha) {
  const mensagemWhats =
    `Olá ${consultorEscolhido.nome}! Segue minha ficha completa do *Fera Simulador de Crédito*:%0A%0A` +
    `*--- SIMULAÇÃO ---*%0A` +
    `*Valor desejado:* ${dadosFicha.valorFormatado}%0A` +
    `*Prazo:* ${dadosFicha.prazoFormatado}%0A` +
    `*Perfil:* ${dadosFicha.modalidade}%0A` +
    `*Situação CPF:* ${dadosFicha.textoCpfStatus}%0A%0A` +
    `*--- DADOS PESSOAIS ---*%0A` +
    `*Nome:* ${dadosFicha.nome}%0A` +
    `*CPF:* ${dadosFicha.cpfNum}%0A` +
    `*Nascimento:* ${dadosFicha.dataNascFormatada}%0A` +
    `*Celular:* ${dadosFicha.celular}%0A` +
    `*E-mail:* ${dadosFicha.email}%0A%0A` +
    `*--- ENDEREÇO ---*%0A` +
    `*CEP:* ${dadosFicha.cep}%0A` +
    `*Endereço:* ${dadosFicha.logradouro}, Nº ${dadosFicha.numero} (${dadosFicha.complemento})%0A` +
    `*Bairro:* ${dadosFicha.bairro} - ${dadosFicha.cidade}/${dadosFicha.uf}%0A%0A` +
    `Aguardo o retorno da consulta!`;

  const btnWhats = document.getElementById("btn-whatsapp");
  if (btnWhats) {
    btnWhats.href = `https://wa.me/${consultorEscolhido.whatsapp}?text=${mensagemWhats}`;
  }
}

async function gerarResultado() {
  if (enviandoFicha) return;

  const nome = document.getElementById("nome-cliente").value.trim();
  const cpfNum = document.getElementById("cpf-cliente").value.trim();
  const nascimento = document.getElementById("nascimento-cliente").value;
  const celular = document.getElementById("celular-cliente").value.trim();
  const email = document.getElementById("email-cliente").value.trim() || "Não informado";

  const cep = document.getElementById("cep-cliente").value.trim();
  const uf = document.getElementById("uf-cliente").value;
  const logradouro = document.getElementById("logradouro-cliente").value.trim();
  const numero = document.getElementById("numero-cliente").value.trim();
  const complemento = document.getElementById("complemento-cliente").value.trim() || "-";
  const bairro = document.getElementById("bairro-cliente").value.trim();
  const cidade = document.getElementById("cidade-cliente").value.trim();

  const msgErro = document.getElementById("msg-erro");
  const dataNascFormatada = formatarDataBR(nascimento);

  if (!nome || !cpfNum || !dataNascFormatada || !celular || !cep || !uf || !logradouro || !numero || !bairro || !cidade) {
    if (msgErro) msgErro.classList.remove("hidden");
    return;
  }
  if (msgErro) msgErro.classList.add("hidden");

  const perfil = document.getElementById("perfil-cliente").value;
  const situacaoCpf = document.getElementById("situacao-cpf").value;
  const parcela = calcularParcela();

  let modalidade = "";
  let orientacao = "";

  if (perfil === "inss") {
    modalidade = "Consignado INSS (Taxa Reduzida)";
    orientacao = "Mesmo com restrição no CPF, aposentados e pensionistas possuem liberação rápida com desconto direto na folha.";
  } else if (perfil === "clt_fgts") {
    modalidade = "Antecipação Saque-Aniversário FGTS";
    orientacao = "Liberação rápida sem parcelas mensais no bolso, descontado direto do saldo do FGTS (aceita negativados).";
  } else if (perfil === "clt_consignado") {
    modalidade = "Crédito do Trabalhador (Consignado CLT)";
    orientacao = "Linha com desconto em folha para trabalhadores de carteira assinada. Vamos consultar sua margem disponível.";
  } else if (perfil === "servidor") {
    modalidade = "Consignado Servidor Público";
    orientacao = "Condições diferenciadas e prazos estendidos para servidores públicos ativos e inativos.";
  } else if (perfil === "bolsa_familia") {
    modalidade = "Crédito Beneficiário (BPC / Bolsa Família)";
    orientacao = "Vamos verificar as financeiras parceiras com margem e liberação ativa para o seu benefício hoje.";
  } else {
    modalidade = situacaoCpf === "limpo" ? "Crédito Pessoal / Microcrédito" : "Microcrédito / Análise Especial";
    orientacao = "Vamos consultar nas nossas financeiras parceiras qual linha aprova o valor desejado para o seu CPF.";
  }

  const valorFormatado = formatarMoeda(valorSelecionado);
  const prazoFormatado = `${mesesSelecionados}x`;
  const textoCpfStatus = situacaoCpf === "limpo" ? "Sem restrições" : "Com restrições";

  document.getElementById("res-modalidade").textContent = modalidade;
  document.getElementById("res-valor").textContent = valorFormatado;
  document.getElementById("res-prazo").textContent = prazoFormatado;
  document.getElementById("res-parcela").textContent =
    perfil === "clt_fgts" ? "Desconto anual no FGTS" : `~ ${formatarMoeda(parcela)}/mês`;
  document.getElementById("texto-orientacao").textContent = orientacao;

  const dadosFicha = {
    nome,
    cpfNum,
    dataNascFormatada,
    celular,
    email,
    valorFormatado,
    prazoFormatado,
    modalidade,
    textoCpfStatus,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    uf
  };

  const hashAtual = `${cpfNum}|${valorFormatado}|${prazoFormatado}|${modalidade}|${textoCpfStatus}`;
  if (hashAtual === ultimoEnvioHash && ultimoConsultorAtribuido) {
    atualizarLinkWhatsApp(ultimoConsultorAtribuido, dadosFicha);
    irParaEtapa(4);
    return;
  }

  const btnAvancar = document.querySelector("#etapa-3 .btn-primary");
  const textoOriginalBtn = btnAvancar ? btnAvancar.textContent : "Ver Liberação →";
  enviandoFicha = true;
  if (btnAvancar) {
    btnAvancar.disabled = true;
    btnAvancar.textContent = "Gerando ficha...";
  }

  try {
    const payloadLead = {
      nome,
      cpf: cpfNum,
      nascimento: dataNascFormatada,
      celular,
      email,
      valor_desejado: valorFormatado,
      prazo: prazoFormatado,
      perfil: modalidade,
      situacao_cpf: textoCpfStatus,
      cep,
      endereco_completo: `${logradouro}, Nº ${numero} (${complemento}) - ${bairro} - ${cidade}/${uf}`
    };

    const consultorEscolhido = await resolverConsultorNoServidor(payloadLead);
    ultimoEnvioHash = hashAtual;
    ultimoConsultorAtribuido = consultorEscolhido;

    atualizarLinkWhatsApp(consultorEscolhido, dadosFicha);
    irParaEtapa(4);
  } finally {
    enviandoFicha = false;
    if (btnAvancar) {
      btnAvancar.disabled = false;
      btnAvancar.textContent = textoOriginalBtn;
    }
  }
}

calcularParcela();
