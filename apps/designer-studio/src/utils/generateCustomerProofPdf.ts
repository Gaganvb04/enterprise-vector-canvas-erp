import type { InvitationPage } from '../store/studioStore';

export function downloadCustomerProofPdf(
  pages: InvitationPage[],
  customerVariables: Record<string, any>,
  documentName: string
) {
  // Create a clean HTML document for printable PDF proof
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download the Customer Proof PDF.');
    return;
  }

  const pagesHtml = pages.map((page, index) => {
    const textBlocksHtml = page.textBlocks.map(tb => {
      let content = tb.content;
      // Resolve variables
      Object.keys(customerVariables).forEach(k => {
        const val = customerVariables[k]?.value || customerVariables[k] || '';
        content = content.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'gi'), val);
      });

      return `
        <div style="
          position: absolute;
          left: ${tb.x}px;
          top: ${tb.y}px;
          width: ${tb.width}px;
          font-family: '${tb.fontFamily}', serif;
          font-size: ${tb.fontSize * 1.33}px;
          font-weight: ${tb.fontWeight};
          color: ${tb.fontColor};
          text-align: ${tb.textAlign};
          line-height: ${tb.lineHeight || 1.4};
          letter-spacing: ${tb.letterSpacing || 0}px;
        ">
          ${content}
        </div>
      `;
    }).join('');

    return `
      <div style="
        width: 148mm;
        height: 210mm;
        background-color: ${page.background?.color || '#FAF5EF'};
        position: relative;
        box-sizing: border-box;
        margin: 20px auto;
        border: 1px solid #ddd;
        border-radius: 12px;
        overflow: hidden;
        page-break-after: always;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      ">
        <div style="position: absolute; top: 15px; right: 20px; font-size: 10px; color: #888; text-transform: uppercase;">
          Page ${index + 1} of ${pages.length} — Customer Approval Proof
        </div>
        ${textBlocksHtml}
      </div>
    `;
  }).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${documentName} — Customer Proof PDF</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:wght@400;600&family=Montserrat:wght@400;600&family=Playfair+Display:ital,wght@0,600;1,400&display=swap');
          body {
            margin: 0;
            padding: 20px;
            background: #f4f4f4;
            font-family: sans-serif;
          }
          @media print {
            body { background: white; padding: 0; }
            div { shadow: none; border: none; }
          }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #161412; font-family: 'Playfair Display', serif;">${documentName} — Official Customer Proof</h2>
          <p style="margin: 5px 0; color: #666; font-size: 12px;">Rooted Memoirs Studio | Approved Invitation Design Proof</p>
        </div>
        ${pagesHtml}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}
