/**
 * Word Document (.doc) Report Generator - matches Milano 8 report format.
 * Generates Word-compatible HTML and downloads as .doc file.
 *
 * Sections:
 * 1. Cover / Document Info
 * 2. Disclaimer & Limitation of Liability
 * 3. Brief Summary
 * 4. No Warranty or Financial Liability
 * 5. Scope of Inspection (with sub-sections)
 * 6. Summary of Defects (stats + breakdown)
 * 7. Defect Checklist table (grouped by area, with photos 7cm x 5cm)
 * 8. Signature block
 */
const exportReport = {
    async generate(inspection) {
        if (!inspection) {
            app.showToast('No active inspection', 'error');
            return;
        }

        const defects = await DB.getDefectsByInspection(inspection.id);
        const date = new Date(inspection.createdAt).toLocaleDateString('en-MY', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        const today = new Date().toLocaleDateString('en-MY', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        const minorCount = defects.filter(d => d.severity === 'Minor').length;
        const majorCount = defects.filter(d => d.severity === 'Major').length;
        const criticalCount = defects.filter(d => d.severity === 'Critical').length;
        const openCount = defects.filter(d => d.status === 'Open').length;
        const priorityDefects = defects
            .filter(d => d.severity === 'Critical' || d.severity === 'Major')
            .sort((a, b) => {
                const severityOrder = { Critical: 0, Major: 1 };
                return (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99);
            });

        // Group defects by area
        const byArea = {};
        defects.forEach(d => {
            if (!byArea[d.area]) byArea[d.area] = [];
            byArea[d.area].push(d);
        });

        // Category summary
        const catSummary = {};
        defects.forEach(d => {
            catSummary[d.category] = (catSummary[d.category] || 0) + 1;
        });

        // Area summary
        const areaSummaryParts = [];
        for (const area of Object.keys(byArea)) {
            const count = byArea[area].length;
            const cats = {};
            byArea[area].forEach(d => { cats[d.category] = (cats[d.category] || 0) + 1; });
            const catList = Object.entries(cats).map(([c, n]) => `${c} (${n})`).join(', ');
            areaSummaryParts.push(`<b>${esc(area)}</b>: ${count} defect${count !== 1 ? 's' : ''} &mdash; ${catList}`);
        }

        // Build defect checklist rows
        let defectRows = '';
        let counter = 1;

        for (const area of Object.keys(byArea)) {
            defectRows += `<tr><td colspan="5" style="background:#e8eef8;font-weight:bold;color:#1e40af;font-size:11pt;padding:8px;letter-spacing:0.5px;">${esc(area).toUpperCase()}</td></tr>`;

            for (const d of byArea[area]) {
                // Photo cell: 7cm height x 5cm width per photo
                let photoHtml = '';
                if (d.photos && d.photos.length > 0) {
                    photoHtml = d.photos.map(p =>
                        `<img src="${p}" width="189" height="265" style="width:5cm;height:7cm;object-fit:contain;border:1px solid #ddd;margin:2px 0;display:block;">`
                    ).join('');
                } else {
                    photoHtml = '<i style="color:#bbb;font-size:9pt;">No photo</i>';
                }

                const remarksText = d.remarks ? `<br><i>Remarks: ${escWithBreaks(d.remarks)}</i>` : '';

                defectRows += `
                    <tr>
                        <td style="text-align:center;width:30px;vertical-align:top;padding:6px;">${counter++}</td>
                        <td style="width:90px;vertical-align:top;padding:6px;">${esc(d.area)}</td>
                        <td style="width:90px;vertical-align:top;padding:6px;">${esc(d.category)}</td>
                        <td style="vertical-align:top;padding:6px;">${escWithBreaks(d.description)}${remarksText}</td>
                        <td style="width:5.5cm;text-align:center;vertical-align:top;padding:6px;">${photoHtml}</td>
                    </tr>
                `;
            }
        }

        if (defects.length === 0) {
            defectRows = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#999;">No defects recorded.</td></tr>';
        }

        const catSummaryHtml = Object.entries(catSummary)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => `<li>${cat}: ${count} defect${count !== 1 ? 's' : ''}</li>`)
            .join('');

        const referencesHtml = STANDARDS_REFERENCES.map((ref, index) => `
            <li style="margin-bottom:8px;">
                <b>${index + 1}. ${esc(ref.title)}</b><br>
                ${esc(ref.description)}<br>
                <a href="${esc(ref.url)}">${esc(ref.url)}</a>
            </li>
        `).join('');

        let prioritySummaryHtml = '';
        if (priorityDefects.length > 0) {
            const criticalAreas = [...new Set(priorityDefects.filter(d => d.severity === 'Critical').map(d => d.area))];
            const majorAreas = [...new Set(priorityDefects.filter(d => d.severity === 'Major').map(d => d.area))];

            let conclusionText = '';
            if (criticalCount > 0) {
                conclusionText = `This project contains <b>${criticalCount}</b> critical defect${criticalCount !== 1 ? 's' : ''} and <b>${majorCount}</b> major defect${majorCount !== 1 ? 's' : ''}. Immediate review and rectification attention is recommended for the critical items identified${criticalAreas.length > 0 ? `, particularly in ${criticalAreas.map(area => `<b>${esc(area)}</b>`).join(', ')}` : ''}.`;
            } else {
                conclusionText = `No critical defects were recorded, however <b>${majorCount}</b> major defect${majorCount !== 1 ? 's' : ''} were identified${majorAreas.length > 0 ? ` in areas including ${majorAreas.map(area => `<b>${esc(area)}</b>`).join(', ')}` : ''}. These major items should be prioritised early during rectification planning.`;
            }

            const priorityItemsHtml = priorityDefects
                .slice(0, 12)
                .map(d => `
                    <li>
                        <b>${esc(d.severity)}</b> - <b>${esc(d.area)}</b> / ${esc(d.category)}:<br>
                        ${esc(d.description)}
                    </li>
                `).join('');

            const remainingCount = priorityDefects.length - Math.min(priorityDefects.length, 12);
            const remainingText = remainingCount > 0
                ? `<p style="margin-top:8px;"><i>Additional ${remainingCount} major / critical item${remainingCount !== 1 ? 's are' : ' is'} listed in the detailed defect checklist section.</i></p>`
                : '';

            prioritySummaryHtml = `
                <div style="border:1px solid #f2c078;background:#fff7ed;padding:12px 14px;margin:14px 0 16px;">
                    <p style="margin-bottom:8px;"><b>Priority Conclusion</b></p>
                    <p style="margin-bottom:10px;">${conclusionText}</p>
                    <p style="margin-bottom:6px;"><b>Major / Critical Issues to Note Early:</b></p>
                    <ul style="margin-left:20px;margin-bottom:0;">${priorityItemsHtml}</ul>
                    ${remainingText}
                </div>
            `;
        }

        // Dynamic scope text
        const propertyLocation = `${esc(inspection.unit)}, ${esc(inspection.project)}${inspection.address ? ', ' + esc(inspection.address) : ''}`;
        const developerName = esc(inspection.developer || 'the Developer');
        const clientName = esc(inspection.client || '________________');

        // Word-compatible HTML document
        const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<title>Inspection Report - ${esc(inspection.project)} | ${esc(inspection.unit)}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
    @page {
        size: A4;
        margin: 2cm 2cm 2.5cm 2cm;
    }
    body {
        font-family: "Segoe UI", Calibri, Arial, sans-serif;
        color: #222;
        font-size: 11pt;
        line-height: 1.5;
    }

    /* Cover */
    .report-cover {
        text-align: center;
        padding: 50px 20px 30px;
        border-bottom: 3px solid #2563eb;
        margin-bottom: 30px;
    }
    .report-cover h1 {
        font-size: 28pt;
        color: #2563eb;
        margin-bottom: 8px;
    }
    .report-cover .subtitle {
        font-size: 16pt;
        color: #444;
        margin-bottom: 20px;
    }

    /* Doc Info Table */
    .doc-info-table {
        width: 70%;
        margin: 0 auto 30px;
        border-collapse: collapse;
    }
    .doc-info-table td {
        padding: 6px 12px;
        border: 1px solid #bbb;
        font-size: 10pt;
    }
    .doc-info-table td:first-child {
        font-weight: bold;
        background: #f0f5ff;
        width: 40%;
    }

    /* Section Titles */
    .section-num {
        font-size: 12pt;
        font-weight: bold;
        color: #2563eb;
        margin: 24px 0 8px;
    }
    .section-title {
        font-size: 12pt;
        font-weight: bold;
        color: #2563eb;
        margin: 24px 0 8px;
        text-transform: uppercase;
    }
    .sub-section-title {
        font-size: 11pt;
        font-weight: bold;
        color: #2563eb;
        margin: 16px 0 6px;
    }

    .section-content {
        font-size: 10.5pt;
        line-height: 1.6;
        margin-bottom: 12px;
        text-align: justify;
    }
    .section-content p { margin-bottom: 8px; }

    /* Stats Table */
    .stats-table {
        width: 100%;
        border-collapse: collapse;
        margin: 12px 0 20px;
    }
    .stats-table td {
        text-align: center;
        padding: 10px 6px;
        border: 1px solid #ccc;
        font-size: 10pt;
    }
    .stats-table .num { font-size: 22pt; font-weight: bold; display: block; }
    .stats-table .lbl { font-size: 8pt; text-transform: uppercase; color: #666; font-weight: bold; }

    /* Checklist Table */
    .checklist-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10pt;
        margin-bottom: 20px;
    }
    .checklist-table th {
        background: #2563eb;
        color: #fff;
        padding: 8px 6px;
        font-size: 9pt;
        text-transform: uppercase;
        text-align: left;
        font-weight: bold;
    }
    .checklist-table td {
        padding: 6px;
        border: 1px solid #ccc;
        vertical-align: top;
    }

    /* Signature */
    .sig-table { width: 100%; margin-top: 50px; }
    .sig-table td { text-align: center; padding: 6px; vertical-align: top; width: 50%; }
    .sig-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 6px; font-size: 10pt; }
    .sig-label { font-size: 9pt; color: #555; }

    /* Page break */
    .page-break { page-break-before: always; }
</style>
</head>
<body>

<!-- ===== COVER ===== -->
<div class="report-cover">
    <h1>HOME DEFECT<br>INSPECTION REPORT</h1>
    <div class="subtitle">${esc(inspection.project)}</div>
</div>

<table class="doc-info-table">
    <tr><td>Revision No</td><td>Revision 00</td></tr>
    <tr><td>Issued Date</td><td>${today}</td></tr>
    <tr><td>Title</td><td>${esc(inspection.unit)}, ${esc(inspection.project)}</td></tr>
    <tr><td>House Owner / Client / Purchaser</td><td>${esc(inspection.client || 'N/A')}</td></tr>
    <tr><td>Developer / Contractor</td><td>${esc(inspection.developer || 'N/A')}</td></tr>
    ${inspection.address ? `<tr><td>Property Address</td><td>${esc(inspection.address)}</td></tr>` : ''}
    <tr><td>Inspection Date</td><td>${date}</td></tr>
</table>

<!-- ===== 1. DISCLAIMER ===== -->
<p class="section-num">1.</p>
<p class="section-title">DISCLAIMER AND LIMITATION OF LIABILITY</p>
<div class="section-content">
    <p>This Home Defect Inspection Report is prepared under the supervision of qualified technical personnel registered with the Board of Engineers Malaysia (BEM) and the Malaysia Board of Technologists (MBOT). The findings contained herein represent the professional technical opinion of the Inspector(s) based on engineering principles and building technology standards. As such, the contents of this report are technically substantiated and are intended to serve as a formal record of the property&rsquo;s condition at the time of inspection.</p>
    <p>Please note: For the purposes of this report, the terms &lsquo;purchaser&rsquo; and &lsquo;client&rsquo; are used interchangeably and refer to the same entity.</p>
</div>

<!-- ===== 2. BRIEF SUMMARY ===== -->
<p class="section-num">2.</p>
<p class="section-title">BRIEF SUMMARY</p>
<div class="section-content">
    <p>House defect inspection refers to a non-invasive assessment of property&rsquo;s current conditions. Home inspection offers an opportunity to identify defects during defect liability period (Warranty).</p>
</div>

<!-- ===== 3. NO WARRANTY ===== -->
<p class="section-num">3.</p>
<p class="section-title">NO WARRANTY OR FINANCIAL LIABILITY</p>
<div class="section-content">
    <p>This report acts solely as a technical advisory document to assist the Client in identifying rectification needs.</p>
    <p>This report is not a guarantee of the property&rsquo;s value, future performance, or habitability, nor is it a warranty against future defects.</p>
    <p>Inspectors act strictly as technical consultants. We expressly disclaim any liability for financial losses, legal disputes, compensation claims, or &ldquo;Loss of Use&rdquo; claims arising between the Client and the Developer. Our role is strictly limited to defect detection; we are not responsible for the successful execution of repairs or the financial costs associated with them.</p>
</div>

<!-- ===== 4. SCOPE OF INSPECTION ===== -->
<p class="section-num">4.</p>
<p class="section-title">SCOPE OF INSPECTION</p>
<div class="section-content">
    <p>This report constitutes the inspection process, defined strictly as a Visual, Non-Invasive Inspection of the property. This Report only covers and deals with evidence of defects and relevant technical issues found in the subject property. The inspection is limited to the readily accessible areas of the building and is based on a visual examination of surface work (excluding areas obstructed by furniture and stored items), and the carrying out of standard non-destructive tests.</p>
</div>

<!-- 4.1 LIMITATIONS -->
<p class="sub-section-title">4.1. LIMITATIONS AND EXCLUSIONS</p>
<div class="section-content">
    <p>The scope is limited to the identification of patent defects (visible imperfections, incomplete works, and non-compliance with visible specifications) that were readily apparent at the time of inspection. This inspection does not cover latent defects (concealed faults), structural integrity verification (unless explicitly specified), soil analysis, or concealed mechanical, electrical, and plumbing (M&amp;E) systems that are buried within walls or slabs.</p>
</div>

<!-- 4.2 NATURE OF FINDINGS -->
<p class="sub-section-title">4.2. NATURE OF FINDINGS &amp; DISPUTE RESOLUTION</p>
<div class="section-content">
    <p>The identification of defects is based on visual evidence and professional assessment. Where further investigation is required (e.g., confirming the extent of &ldquo;hollowness&rdquo; or tracing &ldquo;leakage&rdquo;), it is the Developer&rsquo;s responsibility to conduct invasive testing to determine the root cause.</p>
    <p>Should there be any disagreement regarding the identified defects from the Contractor or Developer&rsquo;s side during the rectification process, technical justification and clarification will be required. We remain open to re-evaluating specific findings, provided that valid technical evidence or industry-standard explanations are submitted to substantiate such disagreements.</p>
</div>

<!-- 4.3 SCOPE -->
<p class="sub-section-title">4.3. SCOPE</p>
<div class="section-content">
    <p>The defect inspection was conducted on the <b>${date}</b> for the property situated at <b>${propertyLocation}</b>, pursuant to the Defect Liability Period (DLP).</p>
    <p>Based on our assessment, the quality of workmanship in specific areas of the property is unsatisfactory. This report serves as a comprehensive record of the defects identified. We request that <b>${developerName}</b> take immediate remedial action to repair and rectify these defects in accordance with industry standards. Please refer to the attached photographic evidence for the necessary action.</p>
    <p style="margin-top:30px;">Purchaser,</p>
    <p style="margin-top:40px;">(________________)</p>
    <p>NAME: <b>${clientName}</b></p>
    <p>DATE:</p>
</div>

<!-- ===== SUMMARY OF DEFECTS ===== -->
<div class="page-break"></div>
<p class="section-title">SUMMARY OF DEFECTS</p>

<table class="stats-table">
    <tr>
        <td><span class="num" style="color:#2563eb;">${defects.length}</span><span class="lbl">Total Defects</span></td>
        <td><span class="num" style="color:#059669;">${minorCount}</span><span class="lbl">Minor</span></td>
        <td><span class="num" style="color:#d97706;">${majorCount}</span><span class="lbl">Major</span></td>
        <td><span class="num" style="color:#dc2626;">${criticalCount}</span><span class="lbl">Critical</span></td>
        <td><span class="num" style="color:#d97706;">${openCount}</span><span class="lbl">Open</span></td>
    </tr>
</table>

<div class="section-content">
    <p>In the Defect Summary of the report for <b>${esc(inspection.unit)}, ${esc(inspection.project)}</b>, a total of <b>${defects.length}</b> defects were identified across multiple areas of the property.</p>
    ${prioritySummaryHtml}

    <p><b>Breakdown by category:</b></p>
    <ul style="margin-left:20px;margin-bottom:10px;">${catSummaryHtml}</ul>

    <p><b>Breakdown by area:</b></p>
    <ul style="margin-left:20px;margin-bottom:10px;">${areaSummaryParts.map(s => `<li>${s}</li>`).join('')}</ul>
</div>

<!-- ===== DEFECT CHECKLIST ===== -->
<div class="page-break"></div>
<p class="section-title">DEFECT CHECKLIST</p>

<table class="checklist-table">
    <thead>
        <tr>
            <th style="width:30px;">No</th>
            <th style="width:90px;">Area</th>
            <th style="width:90px;">Category</th>
            <th>Description &amp; Remarks</th>
            <th style="width:5.5cm;">Photo</th>
        </tr>
    </thead>
    <tbody>
        ${defectRows}
    </tbody>
</table>

<!-- ===== REFERENCES ===== -->
<div class="page-break"></div>
<p class="section-title">REFERENCES AND STANDARDS USED</p>
<div class="section-content">
    <p>The inspection observations and suggested rectification remarks in this report were prepared with reference to the following official sources, together with the applicable project specifications, manufacturer requirements, and site conditions. This list is not exhaustive and does not replace consultant / engineer instructions where specialist review is required.</p>
    <ol style="margin-left:20px;margin-bottom:10px;">${referencesHtml}</ol>
</div>

<!-- ===== SIGNATURE ===== -->
<table class="sig-table">
    <tr>
        <td>
            <div class="sig-line">Purchaser / Client</div>
            <div class="sig-label">${esc(inspection.client || 'Name: ________________')}</div>
            <div class="sig-label">Date: ________________</div>
        </td>
        <td>
            <div class="sig-line">Inspector</div>
            <div class="sig-label">${esc(inspection.inspector || 'Name: ________________')}</div>
            <div class="sig-label">Date: ________________</div>
        </td>
    </tr>
</table>

<p style="text-align:center;color:#999;font-size:8pt;margin-top:40px;border-top:1px solid #ddd;padding-top:10px;">
    Generated by Meem Inspection Tool &middot; ${today}
</p>

</body>
</html>`;

        // Download as .doc file
        const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Inspection Report - ${inspection.project} - ${inspection.unit}.doc`.replace(/[/\\?%*:|"<>]/g, '-');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        app.showToast('Word document downloaded', 'success');
    }
};

function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escWithBreaks(str) {
    return esc(str).replace(/\n/g, '<br>');
}
