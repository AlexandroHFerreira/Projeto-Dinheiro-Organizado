# 💰 Dinheiro Organizado

O **Dinheiro Organizado** é uma aplicação web para a gestão de finanças pessoais desenvolvida com JavaScript puro, HTML5 e CSS3. A aplicação permite aos utilizadores registar receitas, despesas e caixinhas de poupança, disponibilizando um diagnóstico financeiro em tempo real e mantendo a privacidade total dos dados.

---

## 🚀 Funcionalidades

- **Gestão de Lançamentos:**
  - **Entradas:** Registo de rendimentos e receitas recebidas.
  - **Gastos:** Registo de despesas quotidianas e recorrentes.
  - **Caixinhas:** Organização do dinheiro reservado para metas ou fundo de emergência.
- **Cálculo Automático de Saldo:**
  - O saldo disponível é calculado continuamente através da fórmula:
    $$\text{Saldo Disponível} = \text{Entradas} - \text{Gastos} - \text{Caixinhas}$$
- **Análise Visual e Gráfica:**
  - Barra de distribuição percentual das entradas dividida entre gastos, poupança e sobra.
  - Gráfico de barras dinâmico e responsivo desenhado em código SVG nativo com ajuste automático de escala e suporte a valores negativos.
- **Orientação Personalizada:**
  - Sistema de dicas financeiras que analisa a percentagem de despesas e poupanças, sugerindo ações de ajuste de acordo com os registos efetuados.
- **Privacidade e Armazenamento Local:**
  - Todos os dados ficam armazenados exclusivamente no `localStorage` do navegador sob a chave `dinheiro-organizado:v1`.
  - Nenhum dado é enviado para servidores externos.
- **Exportação e Gestão de Dados:**
  - Exibição de todos os dados estruturados em formato JSON.
  - Opção de copiar o JSON para a área de transferência com suporte de seleção de texto em caso de incompatibilidade.
  - Botão para apagar todos os registos com sistema de dupla confirmação e temporizador de 4 segundos.
- **Interface e Acessibilidade:**
  - Respeito pelas áreas seguras em ecrãs de telemóveis através de `env(safe-area-inset)`.
  - Implementação de atributos ARIA (`role="tab"`, `role="tabpanel"`, `aria-live="polite"`) para leitores de ecrã.
  - Suporte para redução de movimento através de `prefers-reduced-motion`.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5:** Estruturação semântica, formulários com validação nativa e elementos acessíveis.
- **CSS3:** Variáveis CSS (`custom properties`), tipografia fluida com `clamp()`, layout em CSS Grid e Flexbox, e regras para modo escuro.
- **JavaScript (Vanilla JS, ES6+):** Formatação monetária em `pt-BR` via `Intl.NumberFormat`, manipulação do DOM, cálculo de coordenadas SVG e gestão do `localStorage`.
- **Google Fonts:** Tipografia `Bricolage Grotesque` carregada externamente.

---

## 📁 Estrutura do Projeto

- **`index.html`:** Estrutura da página, painéis de resumo, navegação por abas e formulário.
- **`style.css`:** Declaração do tema visual, paleta de cores, estilos de componentes e media queries.
- **`script.js`:** Motor de regras de negócio, cálculos matemáticos, persistência e construção de gráficos.
