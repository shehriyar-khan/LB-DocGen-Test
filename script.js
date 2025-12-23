// Client-side Document Generator: PDF (jsPDF) + DOCX (docx + FileSaver)
// Works on GitHub Pages (no backend required)

function $(id) {
  return document.getElementById(id);
}

function safeFilename(str) {
  return (str || "document").trim().replace(/[^\w\-]+/g, "_").slice(0, 80);
}

function getFormData() {
  const fullName = $("fullName").value.trim();
  const company = $("company").value.trim();
  const email = $("email").value.trim();
  const address = $("address").value.trim();
  const dateInput = $("date").value;
  const notes = $("notes").value.trim();
  const format = $("format").value; // pdf | docx

  const date = dateInput ? new Date(dateInput + "T00:00:00") : new Date();
  const dateStr = date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  return { fullName, company, email, address, dateStr, notes, format };
}

function validateRequired(data) {
  if (!data.fullName) {
    alert("Please enter Full Name.");
    $("fullName").focus();
    return false;
  }
  return true;
}

// ------- Templates (plain text) -------
// You can make these as complex as you want (sections, clauses, tables, etc.)
function buildDocText(type, data) {
  const baseHeader =
`Prepared for: ${data.fullName}${data.company ? " • " + data.company : ""}
Email: ${data.email || "—"}
Address: ${data.address || "—"}
Date: ${data.dateStr}

`;

  if (type === "nda") {
    return baseHeader +
`NON-DISCLOSURE AGREEMENT (NDA)

This Non-Disclosure Agreement ("Agreement") is entered into on ${data.dateStr} by and between:
- Disclosing Party: ${data.company || data.fullName}
- Receiving Party: ${data.fullName}

1. Confidential Information
The Receiving Party agrees to keep confidential any non-public information disclosed.

2. Permitted Use
Confidential Information will only be used for evaluation/business discussions.

3. Non-Disclosure
The Receiving Party will not disclose Confidential Information to third parties without written consent.

4. Term
This Agreement remains in effect for 2 years from the date above.

Notes:
${data.notes || "—"}

Signature: ______________________
Name: ${data.fullName}
`;
  }

  if (type === "invoice") {
    const invoiceNo = `INV-${Math.floor(Math.random() * 90000 + 10000)}`;
    return baseHeader +
`INVOICE

Bill To: ${data.fullName}${data.company ? " (" + data.company + ")" : ""}
Invoice Date: ${data.dateStr}
Invoice #: ${invoiceNo}

Line Items:
1) Professional Services .................................. $500.00

Subtotal: $500.00
Tax:      $0.00
Total:    $500.00

Notes:
${data.notes || "—"}

Thank you for your business.
`;
  }

  // letter default
  return baseHeader +
`LETTER

Dear ${data.fullName},

This letter confirms the details provided in the form.

Details:
- Company: ${data.company || "—"}
- Email: ${data.email || "—"}
- Address: ${data.address || "—"}

Additional Notes:
${data.notes || "—"}

Sincerely,
Document Generator
`;
}

function updatePreview(text) {
  $("previewBox").textContent = text;
}

// ------- PDF generation -------
function downloadPDF(filename, text) {
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) {
    alert("PDF library failed to load (jsPDF). Check the CDN link or your connection.");
    return;
  }

  const doc = new jsPDF({ unit: "pt", format: "letter" });

  const margin = 54; // 0.75in
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - margin * 2;

  doc.setFont("Times", "Normal");
  doc.setFontSize(12);

  const lines = doc.splitTextToSize(text, usableWidth);

  let y = margin;
  const lineHeight = 16;

  for (const line of lines) {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }

  doc.save(filename);
}

// ------- DOCX generation -------
async function downloadDOCX(filename, text) {
  const docx = window.docx;
  if (!docx) {
    alert("Word library failed to load (docx). Check the CDN link or your connection.");
    return;
  }
  if (!window.saveAs) {
    alert("FileSaver failed to load. Check the CDN link or your connection.");
    return;
  }

  // Convert plain text into paragraphs
  const paragraphs = text
    .split(/\r?\n/)
    .map(line => new docx.Paragraph({ text: line, spacing: { after: 120 } }));

  const document = new docx.Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await docx.Packer.toBlob(document);
  window.saveAs(blob, filename);
}

// ------- Main handler -------
async function handleGenerate(type) {
  const data = getFormData();
  if (!validateRequired(data)) return;

  const text = buildDocText(type, data);
  updatePreview(text);

  const base = `${type.toUpperCase()}_${safeFilename(data.fullName)}`;
  if (data.format === "pdf") {
    downloadPDF(`${base}.pdf`, text);
  } else {
    await downloadDOCX(`${base}.docx`, text);
  }
}

function init() {
  // Default date today
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  $("date").value = `${yyyy}-${mm}-${dd}`;

  // Buttons: generate based on doc type
  document.querySelectorAll("button[data-doc]").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const type = btn.getAttribute("data-doc");
      await handleGenerate(type);
    });
  });

  // Live preview uses the "letter" template as you type (nice UX)
  const ids = ["fullName","company","email","address","date","notes"];
  ids.forEach(id => {
    $(id).addEventListener("input", () => {
      const data = getFormData();
      if (!data.fullName) {
        updatePreview("Fill out the form and click a document button.");
        return;
      }
      updatePreview(buildDocText("letter", data));
    });
  });
}

document.addEventListener("DOMContentLoaded", init);
