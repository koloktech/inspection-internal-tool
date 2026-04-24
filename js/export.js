/**
 * Real .docx report generator with embedded images for better mobile compatibility.
 */
const REPORT_COLORS = {
    primary: '2563EB',
    primaryLight: 'F0F5FF',
    areaFill: 'E8EEF8',
    success: '059669',
    warning: 'D97706',
    danger: 'DC2626',
    border: 'CCCCCC',
    muted: '666666',
    mutedLight: '999999',
    priorityFill: 'FFF7ED',
    priorityBorder: 'F2C078'
};

const REPORT_LAYOUT = {
    pageWidth: 11906,
    margins: { top: 1134, right: 1134, bottom: 1417, left: 1134 },
    contentWidth: 9638,
    docInfoWidth: 6800,
    docInfoColumnWidths: [2500, 4300],
    statsColumnWidths: [1928, 1928, 1928, 1928, 1926],
    checklistColumnWidths: [500, 1300, 1500, 3188, 3150],
    coverImageWidth: 599,
    coverImageHeight: 449,
    photoMaxWidth: 189,
    photoMaxHeight: 265
};

const exportReport = {
    async generate(inspection) {
        if (!inspection) {
            app.showToast('No active inspection', 'error');
            return;
        }

        if (!window.docx) {
            app.showToast('Word export library is not ready yet. Please try again.', 'error');
            return;
        }

        const defects = await DB.getDefectsByInspection(inspection.id);
        const data = buildReportData(inspection, defects);
        const document = await buildWordDocument(window.docx, data);
        const blob = await window.docx.Packer.toBlob(document);

        downloadBlob(
            blob,
            `Inspection Report - ${sanitizeFilenamePart(inspection.project)} - ${sanitizeFilenamePart(inspection.unit)}.docx`
        );

        app.showToast('Word document downloaded', 'success');
    }
};

async function buildWordDocument(docxLib, data) {
    const {
        AlignmentType,
        BorderStyle,
        Document,
        PageBreak,
        Paragraph,
        TextRun
    } = docxLib;

    const defaultCellBorders = buildBorders(BorderStyle, REPORT_COLORS.border);
    const content = [];

    content.push(
        ...(await createCoverImageParagraph(docxLib)),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 80 },
            children: [
                new TextRun({
                    text: 'HOME DEFECT INSPECTION REPORT',
                    bold: true,
                    size: 36,
                    color: REPORT_COLORS.primary
                })
            ]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 320 },
            children: [
                new TextRun({
                    text: data.inspection.project,
                    size: 24,
                    color: '444444'
                })
            ]
        }),
        createTable(docxLib, {
            width: REPORT_LAYOUT.docInfoWidth,
            columnWidths: REPORT_LAYOUT.docInfoColumnWidths,
            alignment: AlignmentType.CENTER,
            rows: data.docInfoRows.map(([label, value]) => createRow(docxLib, [
                createCell(docxLib, [
                    createTextParagraph(docxLib, label, {
                        bold: true,
                        size: 20
                    })
                ], {
                    shading: { fill: REPORT_COLORS.primaryLight },
                    width: REPORT_LAYOUT.docInfoColumnWidths[0],
                    borders: defaultCellBorders
                }),
                createCell(docxLib, [
                    createTextParagraph(docxLib, value, { size: 20 })
                ], {
                    width: REPORT_LAYOUT.docInfoColumnWidths[1],
                    borders: defaultCellBorders
                })
            ])),
            borders: defaultCellBorders
        }),
        ...createNumberedSection(docxLib, '1.', 'DISCLAIMER AND LIMITATION OF LIABILITY'),
        createBodyParagraph(docxLib, 'This Home Defect Inspection Report is prepared under the supervision of qualified technical personnel registered with the Board of Engineers Malaysia (BEM) and the Malaysia Board of Technologists (MBOT). The findings contained herein represent the professional technical opinion of the Inspector(s) based on engineering principles and building technology standards. As such, the contents of this report are technically substantiated and are intended to serve as a formal record of the property\'s condition at the time of inspection.'),
        createBodyParagraph(docxLib, 'Please note: For the purposes of this report, the terms \'purchaser\' and \'client\' are used interchangeably and refer to the same entity.'),
        ...createNumberedSection(docxLib, '2.', 'BRIEF SUMMARY'),
        createBodyParagraph(docxLib, 'House defect inspection refers to a non-invasive assessment of property\'s current conditions. Home inspection offers an opportunity to identify defects during defect liability period (Warranty).'),
        ...createNumberedSection(docxLib, '3.', 'NO WARRANTY OR FINANCIAL LIABILITY'),
        createBodyParagraph(docxLib, 'This report acts solely as a technical advisory document to assist the Client in identifying rectification needs.'),
        createBodyParagraph(docxLib, 'This report is not a guarantee of the property\'s value, future performance, or habitability, nor is it a warranty against future defects.'),
        createBodyParagraph(docxLib, 'Inspectors act strictly as technical consultants. We expressly disclaim any liability for financial losses, legal disputes, compensation claims, or "Loss of Use" claims arising between the Client and the Developer. Our role is strictly limited to defect detection; we are not responsible for the successful execution of repairs or the financial costs associated with them.'),
        ...createNumberedSection(docxLib, '4.', 'SCOPE OF INSPECTION'),
        createBodyParagraph(docxLib, 'This report constitutes the inspection process, defined strictly as a Visual, Non-Invasive Inspection of the property. This Report only covers and deals with evidence of defects and relevant technical issues found in the subject property. The inspection is limited to the readily accessible areas of the building and is based on a visual examination of surface work (excluding areas obstructed by furniture and stored items), and the carrying out of standard non-destructive tests.'),
        createSubSectionHeading(docxLib, '4.1. LIMITATIONS AND EXCLUSIONS'),
        createBodyParagraph(docxLib, 'The scope is limited to the identification of patent defects (visible imperfections, incomplete works, and non-compliance with visible specifications) that were readily apparent at the time of inspection. This inspection does not cover latent defects (concealed faults), structural integrity verification (unless explicitly specified), soil analysis, or concealed mechanical, electrical, and plumbing (M&E) systems that are buried within walls or slabs.'),
        createSubSectionHeading(docxLib, '4.2. NATURE OF FINDINGS & DISPUTE RESOLUTION'),
        createBodyParagraph(docxLib, 'The identification of defects is based on visual evidence and professional assessment. Where further investigation is required (e.g., confirming the extent of "hollowness" or tracing "leakage"), it is the Developer\'s responsibility to conduct invasive testing to determine the root cause.'),
        createBodyParagraph(docxLib, 'Should there be any disagreement regarding the identified defects from the Contractor or Developer\'s side during the rectification process, technical justification and clarification will be required. We remain open to re-evaluating specific findings, provided that valid technical evidence or industry-standard explanations are submitted to substantiate such disagreements.'),
        createSubSectionHeading(docxLib, '4.3. SCOPE'),
        createBodyParagraph(docxLib, `The defect inspection was conducted on the ${data.inspectionDate} for the property situated at ${data.propertyLocation}, pursuant to the Defect Liability Period (DLP).`),
        createBodyParagraph(docxLib, `Based on our assessment, the quality of workmanship in specific areas of the property is unsatisfactory. This report serves as a comprehensive record of the defects identified. We request that ${data.developerName} take immediate remedial action to repair and rectify these defects in accordance with industry standards. Please refer to the attached photographic evidence for the necessary action.`),
        createBodyParagraph(docxLib, 'Purchaser,', { spacing: { before: 220, after: 600 } }),
        createBodyParagraph(docxLib, '(________________)', { spacing: { after: 120 } }),
        createBodyParagraph(docxLib, `NAME: ${data.clientName}`, { boldPrefix: 'NAME:' }),
        createBodyParagraph(docxLib, 'DATE:'),
        new Paragraph({ children: [new PageBreak()] }),
        createSectionHeading(docxLib, 'SUMMARY OF DEFECTS')
    );

    content.push(
        createTable(docxLib, {
            width: REPORT_LAYOUT.contentWidth,
            columnWidths: REPORT_LAYOUT.statsColumnWidths,
            rows: [
                createRow(docxLib, data.stats.map(stat => createCell(docxLib, [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 40 },
                        children: [
                            new TextRun({
                                text: String(stat.value),
                                bold: true,
                                size: 34,
                                color: stat.color
                            })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: stat.label,
                                bold: true,
                                size: 16,
                                color: REPORT_COLORS.muted,
                                allCaps: true
                            })
                        ]
                    })
                ], {
                    width: Math.round(REPORT_LAYOUT.contentWidth / data.stats.length),
                    borders: defaultCellBorders
                })))
            ],
            borders: defaultCellBorders
        }),
        createBodyParagraph(docxLib, `In the Defect Summary of the report for ${data.inspection.unit}, ${data.inspection.project}, a total of ${data.totalDefects} defects were identified across multiple areas of the property.`)
    );

    if (data.prioritySummary) {
        content.push(createHighlightBox(docxLib, data.prioritySummary));
    }

    if (data.categorySummaryLines.length > 0) {
        content.push(
            createBodyParagraph(docxLib, 'Breakdown by category:', { bold: true, spacing: { before: 80, after: 50 } }),
            ...data.categorySummaryLines.map(line => createListParagraph(docxLib, line))
        );
    }

    if (data.areaSummaryLines.length > 0) {
        content.push(
            createBodyParagraph(docxLib, 'Breakdown by area:', { bold: true, spacing: { before: 80, after: 50 } }),
            ...data.areaSummaryLines.map(line => createListParagraph(docxLib, line))
        );
    }

    content.push(
        new Paragraph({ children: [new PageBreak()] }),
        createSectionHeading(docxLib, 'DEFECT CHECKLIST'),
        await createChecklistTable(docxLib, data, defaultCellBorders),
        new Paragraph({ children: [new PageBreak()] }),
        createSectionHeading(docxLib, 'REFERENCES AND STANDARDS USED'),
        createBodyParagraph(
            docxLib,
            'The inspection observations and suggested rectification remarks in this report were prepared with reference to the following official sources, together with the applicable project specifications, manufacturer requirements, and site conditions. This list is not exhaustive and does not replace consultant / engineer instructions where specialist review is required.'
        ),
        ...STANDARDS_REFERENCES.flatMap((ref, index) => ([
            createBodyParagraph(docxLib, `${index + 1}. ${ref.title}`, { bold: true, spacing: { before: 80, after: 30 } }),
            createBodyParagraph(docxLib, ref.description, { spacing: { after: 20 } }),
            createBodyParagraph(docxLib, ref.url, { color: REPORT_COLORS.primary, size: 18, spacing: { after: 100 } })
        ]))
    );

    return new Document({
        creator: 'PROSPEC Inspection Tool',
        title: `Inspection Report - ${data.inspection.project} | ${data.inspection.unit}`,
        description: 'Home defect inspection report',
        sections: [{
            properties: {
                page: {
                    size: { width: REPORT_LAYOUT.pageWidth, height: 16838 },
                    margin: REPORT_LAYOUT.margins
                }
            },
            children: content
        }]
    });
}

async function createChecklistTable(docxLib, data, borders) {
    const { AlignmentType } = docxLib;
    const rows = [
        createRow(docxLib, [
            createHeaderCell(docxLib, 'No', REPORT_LAYOUT.checklistColumnWidths[0]),
            createHeaderCell(docxLib, 'Area', REPORT_LAYOUT.checklistColumnWidths[1]),
            createHeaderCell(docxLib, 'Category', REPORT_LAYOUT.checklistColumnWidths[2]),
            createHeaderCell(docxLib, 'Description & Remarks', REPORT_LAYOUT.checklistColumnWidths[3]),
            createHeaderCell(docxLib, 'Photo', REPORT_LAYOUT.checklistColumnWidths[4])
        ])
    ];

    if (data.totalDefects === 0) {
        rows.push(
            createRow(docxLib, [
                createCell(docxLib, [
                    new docxLib.Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 240, after: 240 },
                        children: [
                            new docxLib.TextRun({
                                text: 'No defects recorded.',
                                italics: true,
                                color: REPORT_COLORS.mutedLight
                            })
                        ]
                    })
                ], {
                    columnSpan: 5,
                    borders
                })
            ])
        );
    } else {
        let counter = 1;
        for (const [area, defects] of data.defectsByArea) {
            rows.push(
                createRow(docxLib, [
                    createCell(docxLib, [
                        createTextParagraph(docxLib, area.toUpperCase(), {
                            bold: true,
                            color: REPORT_COLORS.primary,
                            size: 22
                        })
                    ], {
                        columnSpan: 5,
                        shading: { fill: REPORT_COLORS.areaFill },
                        borders
                    })
                ])
            );

            for (const defect of defects) {
                const photoParagraphs = await createPhotoParagraphs(docxLib, defect.photos || []);
                const descriptionParagraphs = [
                    createMultilineParagraph(docxLib, defect.description, { size: 20 })
                ];

                if (defect.remarks) {
                    descriptionParagraphs.push(
                        createMultilineParagraph(docxLib, `Remarks: ${defect.remarks}`, {
                            size: 18,
                            italics: true
                        }, {
                            spacing: { before: 80 }
                        })
                    );
                }

                rows.push(
                    createRow(docxLib, [
                        createCell(docxLib, [
                            new docxLib.Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [new docxLib.TextRun({ text: String(counter++), size: 20 })]
                            })
                        ], {
                            width: REPORT_LAYOUT.checklistColumnWidths[0],
                            borders
                        }),
                        createCell(docxLib, [
                            createTextParagraph(docxLib, defect.area, { size: 20 })
                        ], {
                            width: REPORT_LAYOUT.checklistColumnWidths[1],
                            borders
                        }),
                        createCell(docxLib, [
                            createMultilineParagraph(docxLib, defect.categoryLabel, { size: 20 })
                        ], {
                            width: REPORT_LAYOUT.checklistColumnWidths[2],
                            borders
                        }),
                        createCell(docxLib, descriptionParagraphs, {
                            width: REPORT_LAYOUT.checklistColumnWidths[3],
                            borders
                        }),
                        createCell(docxLib, photoParagraphs, {
                            width: REPORT_LAYOUT.checklistColumnWidths[4],
                            borders
                        })
                    ])
                );
            }
        }
    }

    return createTable(docxLib, {
        width: REPORT_LAYOUT.contentWidth,
        columnWidths: REPORT_LAYOUT.checklistColumnWidths,
        layout: docxLib.TableLayoutType.FIXED,
        rows,
        borders
    });
}

async function createCoverImageParagraph(docxLib) {
    const imageBytes = await loadReportCoverImage();
    if (!imageBytes) return [];

    return [
        new docxLib.Paragraph({
            alignment: docxLib.AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [
                new docxLib.ImageRun({
                    type: 'jpg',
                    data: imageBytes,
                    transformation: {
                        width: REPORT_LAYOUT.coverImageWidth,
                        height: REPORT_LAYOUT.coverImageHeight
                    }
                })
            ]
        })
    ];
}

async function loadReportCoverImage() {
    if (typeof REPORT_COVER_IMAGE_BASE64 === 'string' && REPORT_COVER_IMAGE_BASE64) {
        return base64ToBytes(REPORT_COVER_IMAGE_BASE64);
    }

    try {
        const response = await fetch('./background.jpg');
        if (!response.ok) return null;

        return new Uint8Array(await response.arrayBuffer());
    } catch (e) {
        return null;
    }
}

async function createPhotoParagraphs(docxLib, photos) {
    const { AlignmentType, ImageRun, Paragraph, TextRun } = docxLib;

    if (!Array.isArray(photos) || photos.length === 0) {
        return [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: 'No photo',
                        italics: true,
                        size: 18,
                        color: REPORT_COLORS.mutedLight
                    })
                ]
            })
        ];
    }

    const paragraphs = [];

    for (const photo of photos) {
        const imageInfo = dataUrlToImageInfo(photo);
        if (!imageInfo) {
            paragraphs.push(
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: 'Photo unavailable',
                            italics: true,
                            size: 18,
                            color: REPORT_COLORS.mutedLight
                        })
                    ]
                })
            );
            continue;
        }

        const size = await getContainedImageSize(
            photo,
            REPORT_LAYOUT.photoMaxWidth,
            REPORT_LAYOUT.photoMaxHeight
        );

        paragraphs.push(
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
                children: [
                    new ImageRun({
                        type: imageInfo.type,
                        data: imageInfo.bytes,
                        transformation: size
                    })
                ]
            })
        );
    }

    return paragraphs;
}

function buildReportData(inspection, defects) {
    const inspectionDate = formatReportDate(inspection.createdAt);
    const issuedDate = formatReportDate(new Date().toISOString());
    const defectsByArea = groupDefectsByArea(defects);
    const totalDefects = defects.length;
    const minorCount = defects.filter(defect => defect.severity === 'Minor').length;
    const majorCount = defects.filter(defect => defect.severity === 'Major').length;
    const criticalCount = defects.filter(defect => defect.severity === 'Critical').length;
    const openCount = defects.filter(defect => defect.status === 'Open').length;
    const priorityDefects = defects
        .filter(defect => defect.severity === 'Critical' || defect.severity === 'Major')
        .sort((a, b) => {
            const severityOrder = { Critical: 0, Major: 1 };
            return (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99);
        });

    const categoryCounts = {};
    defects.forEach(defect => {
        getDefectCategories(defect).forEach(category => {
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
    });

    const areaSummaryLines = defectsByArea.map(([area, areaDefects]) => {
        const counts = {};
        areaDefects.forEach(defect => {
            getDefectCategories(defect).forEach(category => {
                counts[category] = (counts[category] || 0) + 1;
            });
        });

        const categoryText = Object.entries(counts)
            .map(([category, count]) => `${category} (${count})`)
            .join(', ');

        return `${area}: ${areaDefects.length} defect${areaDefects.length !== 1 ? 's' : ''}${categoryText ? ` - ${categoryText}` : ''}`;
    });

    const propertyLocation = [inspection.unit, inspection.project, inspection.address]
        .filter(Boolean)
        .join(', ');

    return {
        inspection,
        inspectionDate,
        issuedDate,
        propertyLocation,
        developerName: inspection.developer || 'the Developer',
        clientName: inspection.client || '________________',
        defectsByArea: defectsByArea.map(([area, areaDefects]) => ([
            area,
            areaDefects.map(defect => ({
                ...defect,
                categoryLabel: formatDefectCategories(defect)
            }))
        ])),
        totalDefects,
        stats: [
            { label: 'Total Defects', value: totalDefects, color: REPORT_COLORS.primary },
            { label: 'Minor', value: minorCount, color: REPORT_COLORS.success },
            { label: 'Major', value: majorCount, color: REPORT_COLORS.warning },
            { label: 'Critical', value: criticalCount, color: REPORT_COLORS.danger },
            { label: 'Open', value: openCount, color: REPORT_COLORS.warning }
        ],
        categorySummaryLines: Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([category, count]) => `${category}: ${count} defect${count !== 1 ? 's' : ''}`),
        areaSummaryLines,
        prioritySummary: buildPrioritySummary(priorityDefects, majorCount, criticalCount),
        docInfoRows: [
            ['Revision No', 'Revision 00'],
            ['Issued Date', issuedDate],
            ['Title', `${inspection.unit || 'N/A'}, ${inspection.project || 'N/A'}`],
            ['House Owner / Client / Purchaser', inspection.client || 'N/A'],
            ['Developer / Contractor', inspection.developer || 'N/A'],
            ...(inspection.address ? [['Property Address', inspection.address]] : []),
            ['Inspection Date', inspectionDate]
        ]
    };
}

function buildPrioritySummary(priorityDefects, majorCount, criticalCount) {
    if (priorityDefects.length === 0) return null;

    const criticalAreas = [...new Set(priorityDefects.filter(defect => defect.severity === 'Critical').map(defect => defect.area))];
    const majorAreas = [...new Set(priorityDefects.filter(defect => defect.severity === 'Major').map(defect => defect.area))];

    let conclusion;
    if (criticalCount > 0) {
        conclusion = `This project contains ${criticalCount} critical defect${criticalCount !== 1 ? 's' : ''} and ${majorCount} major defect${majorCount !== 1 ? 's' : ''}. Immediate review and rectification attention is recommended for the critical items identified${criticalAreas.length > 0 ? `, particularly in ${criticalAreas.join(', ')}` : ''}.`;
    } else {
        conclusion = `No critical defects were recorded, however ${majorCount} major defect${majorCount !== 1 ? 's were' : ' was'} identified${majorAreas.length > 0 ? ` in areas including ${majorAreas.join(', ')}` : ''}. These major items should be prioritised early during rectification planning.`;
    }

    const items = priorityDefects.slice(0, 12).map(defect =>
        `${defect.severity} - ${defect.area} / ${formatDefectCategories(defect)}: ${collapseWhitespace(defect.description)}`
    );

    const remainingCount = priorityDefects.length - items.length;
    const note = remainingCount > 0
        ? `Additional ${remainingCount} major / critical item${remainingCount !== 1 ? 's are' : ' is'} listed in the detailed defect checklist section.`
        : '';

    return { conclusion, items, note };
}

function createHighlightBox(docxLib, summary) {
    return createTable(docxLib, {
        width: REPORT_LAYOUT.contentWidth,
        rows: [
            createRow(docxLib, [
                createCell(docxLib, [
                    createBodyParagraph(docxLib, 'Priority Conclusion', { bold: true, spacing: { after: 80 } }),
                    createBodyParagraph(docxLib, summary.conclusion, { spacing: { after: 120 } }),
                    createBodyParagraph(docxLib, 'Major / Critical Issues to Note Early:', { bold: true, spacing: { after: 50 } }),
                    ...summary.items.map(item => createListParagraph(docxLib, item)),
                    ...(summary.note ? [createBodyParagraph(docxLib, summary.note, { italics: true, spacing: { before: 100 } })] : [])
                ], {
                    shading: { fill: REPORT_COLORS.priorityFill },
                    borders: buildBorders(docxLib.BorderStyle, REPORT_COLORS.priorityBorder),
                    margins: { top: 140, right: 180, bottom: 140, left: 180 }
                })
            ])
        ],
        borders: buildBorders(docxLib.BorderStyle, REPORT_COLORS.priorityBorder)
    });
}

function createNumberedSection(docxLib, number, title) {
    return [
        new docxLib.Paragraph({
            spacing: { before: 240, after: 20 },
            children: [
                new docxLib.TextRun({
                    text: number,
                    bold: true,
                    size: 24,
                    color: REPORT_COLORS.primary
                })
            ]
        }),
        createSectionHeading(docxLib, title, { spacing: { after: 100 } })
    ];
}

function createSectionHeading(docxLib, text, options = {}) {
    return createTextParagraph(docxLib, text, {
        bold: true,
        size: 24,
        color: REPORT_COLORS.primary,
        allCaps: true,
        spacing: { before: 40, after: 120, ...(options.spacing || {}) }
    });
}

function createSubSectionHeading(docxLib, text) {
    return createTextParagraph(docxLib, text, {
        bold: true,
        size: 22,
        color: REPORT_COLORS.primary,
        spacing: { before: 180, after: 80 }
    });
}

function createBodyParagraph(docxLib, text, options = {}) {
    const { bold = false, italics = false, boldPrefix = '', spacing = {}, color, size } = options;
    if (boldPrefix && text.startsWith(boldPrefix)) {
        const suffix = text.slice(boldPrefix.length).trimStart();
        return new docxLib.Paragraph({
            alignment: docxLib.AlignmentType.BOTH,
            spacing: { after: 110, ...spacing },
            children: [
                new docxLib.TextRun({
                    text: boldPrefix,
                    bold: true,
                    color: color || '222222',
                    size: size || 21
                }),
                new docxLib.TextRun({
                    text: suffix ? ` ${suffix}` : '',
                    italics,
                    color: color || '222222',
                    size: size || 21
                })
            ]
        });
    }

    return createMultilineParagraph(docxLib, text, {
        bold,
        italics,
        color: color || '222222',
        size: size || 21
    }, {
        alignment: docxLib.AlignmentType.BOTH,
        spacing: { after: 110, ...spacing }
    });
}

function createListParagraph(docxLib, text) {
    return createTextParagraph(docxLib, `- ${text}`, {
        size: 20,
        spacing: { after: 50 },
        indent: { left: 360 }
    });
}

function createTextParagraph(docxLib, text, options = {}) {
    const {
        bold = false,
        italics = false,
        size = 21,
        color = '222222',
        allCaps = false,
        alignment,
        spacing = {},
        indent
    } = options;

    return new docxLib.Paragraph({
        ...(alignment ? { alignment } : {}),
        ...(indent ? { indent } : {}),
        spacing,
        children: [
            new docxLib.TextRun({
                text: text || '',
                bold,
                italics,
                size,
                color,
                allCaps
            })
        ]
    });
}

function createMultilineParagraph(docxLib, text, runOptions = {}, paragraphOptions = {}) {
    const lines = String(text || '')
        .replace(/\r\n/g, '\n')
        .split('\n');

    return new docxLib.Paragraph({
        ...paragraphOptions,
        children: lines.map((line, index) => new docxLib.TextRun({
            text: line || ' ',
            ...(index > 0 ? { break: 1 } : {}),
            ...runOptions
        }))
    });
}

function createTable(docxLib, options) {
    const { Table, TableLayoutType, WidthType } = docxLib;
    const {
        width,
        rows,
        borders,
        columnWidths,
        layout = TableLayoutType.FIXED,
        alignment
    } = options;

    return new Table({
        rows,
        width: { size: width, type: WidthType.DXA },
        columnWidths,
        layout,
        ...(alignment ? { alignment } : {}),
        borders
    });
}

function createRow(docxLib, cells) {
    return new docxLib.TableRow({ children: cells });
}

function createCell(docxLib, children, options = {}) {
    const { TableCell, VerticalAlignTable, WidthType } = docxLib;
    const { width, borders, margins, shading, columnSpan } = options;

    return new TableCell({
        children,
        verticalAlign: VerticalAlignTable.TOP,
        borders,
        margins: margins || { top: 100, right: 100, bottom: 100, left: 100 },
        ...(typeof width === 'number' ? { width: { size: width, type: WidthType.DXA } } : {}),
        ...(shading ? { shading } : {}),
        ...(columnSpan ? { columnSpan } : {})
    });
}

function createHeaderCell(docxLib, text, width) {
    return createCell(docxLib, [
        new docxLib.Paragraph({
            alignment: docxLib.AlignmentType.CENTER,
            children: [
                new docxLib.TextRun({
                    text,
                    bold: true,
                    size: 18,
                    color: 'FFFFFF',
                    allCaps: true
                })
            ]
        })
    ], {
        width,
        shading: { fill: REPORT_COLORS.primary },
        borders: buildBorders(docxLib.BorderStyle, REPORT_COLORS.primary)
    });
}

function buildBorders(BorderStyle, color) {
    return {
        top: { style: BorderStyle.SINGLE, size: 1, color },
        bottom: { style: BorderStyle.SINGLE, size: 1, color },
        left: { style: BorderStyle.SINGLE, size: 1, color },
        right: { style: BorderStyle.SINGLE, size: 1, color }
    };
}

function groupDefectsByArea(defects) {
    const grouped = new Map();
    defects.forEach(defect => {
        const area = defect.area || 'General';
        if (!grouped.has(area)) grouped.set(area, []);
        grouped.get(area).push(defect);
    });
    return Array.from(grouped.entries());
}

function getDefectCategories(defect) {
    if (typeof app?.getStoredDefectCategories === 'function') {
        const categories = app.getStoredDefectCategories(defect);
        if (categories.length > 0) return categories;
    }

    if (typeof normalizeDefectCategoriesInput === 'function') {
        const categories = normalizeDefectCategoriesInput(defect.categories || defect.category);
        if (categories.length > 0) return categories;
    }

    return defect.category ? [defect.category] : ['Others'];
}

function formatDefectCategories(defect) {
    return getDefectCategories(defect).join(' + ');
}

function formatReportDate(value) {
    const date = value ? new Date(value) : new Date();
    const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;

    return safeDate.toLocaleDateString('en-MY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function sanitizeFilenamePart(value) {
    return String(value || 'Untitled').replace(/[/\\?%*:|"<>]/g, '-');
}

function collapseWhitespace(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function dataUrlToImageInfo(dataUrl) {
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl || '');
    if (!match) return null;

    const mimeType = match[1].toLowerCase();
    const base64 = match[2];
    const type = mimeType === 'image/jpeg' ? 'jpg' : mimeType.replace('image/', '');
    if (!['jpg', 'png', 'gif', 'bmp'].includes(type)) return null;

    return { type, bytes: base64ToBytes(base64) };
}

function getContainedImageSize(dataUrl, maxWidth, maxHeight) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            const width = img.naturalWidth || maxWidth;
            const height = img.naturalHeight || maxHeight;
            const scale = Math.min(maxWidth / width, maxHeight / height, 1);

            resolve({
                width: Math.max(1, Math.round(width * scale)),
                height: Math.max(1, Math.round(height * scale))
            });
        };
        img.onerror = () => resolve({ width: maxWidth, height: maxHeight });
        img.src = dataUrl;
    });
}

function base64ToBytes(base64) {
    if (typeof atob === 'function') {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    if (typeof Buffer !== 'undefined') {
        return Uint8Array.from(Buffer.from(base64, 'base64'));
    }

    throw new Error('Base64 decoding is not available in this environment.');
}
