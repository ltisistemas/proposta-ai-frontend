/**
 * Utilitário de Higienização e Adaptação Responsiva para HTML de Propostas Comerciais
 * Garante que qualquer proposta (legada, gerada por IA ou por template)
 * se adapte perfeitamente a dispositivos móveis sem cortes em tabelas ou valores.
 */

export function ajustarHtmlResponsivoProposta(conteudoHtml: string): string {
  if (!conteudoHtml || typeof conteudoHtml !== "string") {
    return conteudoHtml;
  }

  let html = conteudoHtml;

  // 1. Remover overflow: hidden inline em wrappers de tabela para permitir scroll suave
  html = html.replace(
    /class="table-responsive-wrapper"(\s+style="[^"]*?)overflow:\s*hidden;?([^"]*")/gi,
    'class="table-responsive-wrapper"$1overflow-x: auto; -webkit-overflow-scrolling: touch;$2'
  );

  html = html.replace(
    /class="table-responsive"(\s+style="[^"]*?)overflow:\s*hidden;?([^"]*")/gi,
    'class="table-responsive"$1overflow-x: auto; -webkit-overflow-scrolling: touch;$2'
  );

  // 2. CSS Avançado de Responsividade Mobile e Tipografia
  const responsiveStyles = `
  <style data-proposta-responsive-enhancer="true">
    /* Estilos globais e scrollbars refinadas */
    * { box-sizing: border-box; }
    html, body {
      max-width: 100%;
      overflow-x: hidden;
      -webkit-text-size-adjust: 100%;
    }
    
    .table-responsive-wrapper,
    .table-responsive {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 transparent;
      border-radius: 10px;
    }

    .table-responsive-wrapper::-webkit-scrollbar,
    .table-responsive::-webkit-scrollbar {
      height: 6px;
    }
    .table-responsive-wrapper::-webkit-scrollbar-thumb,
    .table-responsive::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    /* Adaptação Mobile Estrita (<= 640px) */
    @media (max-width: 640px) {
      body {
        padding: 6px !important;
        background-color: #f8fafc !important;
      }
      .pro-card-container,
      .notepad-container {
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 12px !important;
        margin: 0 !important;
      }
      .header-content {
        padding: 20px 14px !important;
      }
      .body-content {
        padding: 18px 12px !important;
      }
      .grid-responsive {
        grid-template-columns: 1fr !important;
        gap: 14px !important;
        padding: 16px !important;
      }
      .flex-responsive {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 14px !important;
      }
      .signatures-grid,
      .signatures-flex {
        grid-template-columns: 1fr !important;
        flex-direction: column !important;
        gap: 20px !important;
        margin-top: 32px !important;
        padding-top: 24px !important;
      }
      .signatures-flex > div {
        width: 100% !important;
      }
      
      /* Tabela de Investimento & Entregáveis Adaptada */
      .table-responsive-wrapper table,
      .table-responsive table {
        width: 100% !important;
        min-width: 440px !important;
      }
      .table-responsive-wrapper th,
      .table-responsive-wrapper td,
      .table-responsive th,
      .table-responsive td {
        padding: 10px 8px !important;
        font-size: 12px !important;
      }
      .table-responsive-wrapper td:nth-child(3),
      .table-responsive-wrapper td:nth-child(4),
      .table-responsive td:nth-child(3),
      .table-responsive td:nth-child(4) {
        white-space: nowrap !important;
        font-variant-numeric: tabular-nums !important;
      }
      
      /* Bloco de Total 100% fluido */
      .total-box-wrapper {
        width: 100% !important;
        box-sizing: border-box !important;
        padding: 14px !important;
        margin-top: 14px !important;
      }
    }
  </style>
  `;

  // Se já contém o enhancer, remove primeiro para evitar duplicação
  html = html.replace(/<style data-proposta-responsive-enhancer="true">[\s\S]*?<\/style>/gi, "");

  // Inserir antes de </head> ou no início de <style>
  if (html.includes("</head>")) {
    html = html.replace("</head>", `${responsiveStyles}\n</head>`);
  } else if (html.includes("<body")) {
    html = html.replace("<body", `${responsiveStyles}\n<body`);
  } else {
    html = `${responsiveStyles}\n${html}`;
  }

  // Garantir a tag <meta name="viewport" ...> no head
  if (!html.includes('name="viewport"')) {
    const metaViewport = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head>\n  ${metaViewport}`);
    }
  }

  return html;
}
