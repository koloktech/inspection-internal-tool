/**
 * Excel DB module using SheetJS (xlsx).
 * Exports and imports inspection data to/from .xlsx files.
 *
 * Excel file structure:
 * - Sheet "Inspection Info": project metadata
 * - Sheet "Defects": all defect records (No, Area, Category, Severity, Status, Description, Remarks)
 * - Photos stored as base64 references in a "Photos" sheet
 */
const excelDB = {

    // ============================================
    // EXPORT SINGLE INSPECTION TO EXCEL
    // ============================================
    async exportInspectionToExcel(inspection) {
        if (!inspection) {
            app.showToast('No inspection selected', 'error');
            return;
        }

        const defects = await DB.getDefectsByInspection(inspection.id);
        const wb = XLSX.utils.book_new();

        // Sheet 1: Inspection Info
        const infoData = [
            ['Field', 'Value'],
            ['Project', inspection.project],
            ['Unit / Block', inspection.unit],
            ['Inspector', inspection.inspector || ''],
            ['Client / Purchaser', inspection.client || ''],
            ['Developer / Contractor', inspection.developer || ''],
            ['Address', inspection.address || ''],
            ['Date Created', new Date(inspection.createdAt).toLocaleDateString('en-MY')],
            ['Total Defects', defects.length],
            ['Areas', (inspection.areas || []).join(', ')]
        ];
        const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
        infoSheet['!cols'] = [{ wch: 22 }, { wch: 60 }];
        XLSX.utils.book_append_sheet(wb, infoSheet, 'Inspection Info');

        // Sheet 2: Defects
        const defectHeaders = ['No', 'Area', 'Category', 'Severity', 'Status', 'Description', 'Remarks', 'Photos Count', 'Date'];
        const defectRows = defects.map((d, i) => [
            i + 1,
            d.area,
            d.category,
            d.severity,
            d.status,
            d.description,
            d.remarks || '',
            (d.photos || []).length,
            new Date(d.createdAt).toLocaleDateString('en-MY')
        ]);

        const defectSheet = XLSX.utils.aoa_to_sheet([defectHeaders, ...defectRows]);
        defectSheet['!cols'] = [
            { wch: 5 }, { wch: 20 }, { wch: 18 }, { wch: 10 },
            { wch: 12 }, { wch: 50 }, { wch: 30 }, { wch: 8 }, { wch: 12 }
        ];
        XLSX.utils.book_append_sheet(wb, defectSheet, 'Defects');

        // Sheet 3: Photos reference (base64 stored here for re-import)
        const photoHeaders = ['Defect No', 'Area', 'Category', 'Photo Index', 'Base64 Data'];
        const photoRows = [];
        defects.forEach((d, i) => {
            if (d.photos && d.photos.length > 0) {
                d.photos.forEach((photo, pi) => {
                    photoRows.push([i + 1, d.area, d.category, pi + 1, photo]);
                });
            }
        });

        if (photoRows.length > 0) {
            const photoSheet = XLSX.utils.aoa_to_sheet([photoHeaders, ...photoRows]);
            photoSheet['!cols'] = [
                { wch: 10 }, { wch: 20 }, { wch: 18 }, { wch: 10 }, { wch: 50 }
            ];
            XLSX.utils.book_append_sheet(wb, photoSheet, 'Photos');
        }

        // Download
        const filename = `${inspection.project} - ${inspection.unit}.xlsx`.replace(/[/\\?%*:|"<>]/g, '-');
        XLSX.writeFile(wb, filename);
        app.showToast('Excel file saved', 'success');
    },

    // ============================================
    // EXPORT ALL INSPECTIONS TO EXCEL
    // ============================================
    async exportAllToExcel() {
        const inspections = await DB.getAllInspections();
        if (inspections.length === 0) {
            app.showToast('No inspections to export', 'error');
            return;
        }

        const wb = XLSX.utils.book_new();

        // Sheet 1: All Inspections summary
        const summaryHeaders = ['No', 'Project', 'Unit', 'Inspector', 'Client', 'Developer', 'Date', 'Total Defects'];
        const summaryRows = [];

        for (let i = 0; i < inspections.length; i++) {
            const insp = inspections[i];
            const defects = await DB.getDefectsByInspection(insp.id);
            summaryRows.push([
                i + 1,
                insp.project,
                insp.unit,
                insp.inspector || '',
                insp.client || '',
                insp.developer || '',
                new Date(insp.createdAt).toLocaleDateString('en-MY'),
                defects.length
            ]);
        }

        const summarySheet = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
        summarySheet['!cols'] = [
            { wch: 5 }, { wch: 30 }, { wch: 20 }, { wch: 20 },
            { wch: 25 }, { wch: 25 }, { wch: 12 }, { wch: 10 }
        ];
        XLSX.utils.book_append_sheet(wb, summarySheet, 'All Inspections');

        // Sheet 2: All defects across all inspections
        const allDefectHeaders = ['No', 'Project', 'Unit', 'Area', 'Category', 'Severity', 'Status', 'Description', 'Remarks', 'Date'];
        const allDefectRows = [];
        let counter = 1;

        for (const insp of inspections) {
            const defects = await DB.getDefectsByInspection(insp.id);
            for (const d of defects) {
                allDefectRows.push([
                    counter++,
                    insp.project,
                    insp.unit,
                    d.area,
                    d.category,
                    d.severity,
                    d.status,
                    d.description,
                    d.remarks || '',
                    new Date(d.createdAt).toLocaleDateString('en-MY')
                ]);
            }
        }

        const allDefectSheet = XLSX.utils.aoa_to_sheet([allDefectHeaders, ...allDefectRows]);
        allDefectSheet['!cols'] = [
            { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 18 },
            { wch: 10 }, { wch: 12 }, { wch: 50 }, { wch: 30 }, { wch: 12 }
        ];
        XLSX.utils.book_append_sheet(wb, allDefectSheet, 'All Defects');

        const filename = `Meem Inspections - ${new Date().toLocaleDateString('en-MY')}.xlsx`;
        XLSX.writeFile(wb, filename);
        app.showToast('All inspections exported', 'success');
    },

    // ============================================
    // IMPORT FROM EXCEL
    // ============================================
    importFromExcel() {
        document.getElementById('excelImportInput').click();
    },

    async handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        event.target.value = '';

        try {
            const data = await file.arrayBuffer();
            const wb = XLSX.read(data);

            // Check for Inspection Info sheet
            if (!wb.SheetNames.includes('Inspection Info')) {
                app.showToast('Invalid file: missing "Inspection Info" sheet', 'error');
                return;
            }

            // Parse inspection info
            const infoSheet = wb.Sheets['Inspection Info'];
            const infoRows = XLSX.utils.sheet_to_json(infoSheet, { header: 1 });

            const getInfoValue = (field) => {
                const row = infoRows.find(r => r[0] === field);
                return row ? (row[1] || '') : '';
            };

            const inspection = {
                project: getInfoValue('Project'),
                unit: getInfoValue('Unit / Block'),
                inspector: getInfoValue('Inspector'),
                client: getInfoValue('Client / Purchaser'),
                developer: getInfoValue('Developer / Contractor'),
                address: getInfoValue('Address'),
                areas: getInfoValue('Areas') ? getInfoValue('Areas').split(', ') : [...app.DEFAULT_AREAS],
                createdAt: new Date().toISOString()
            };

            if (!inspection.project || !inspection.unit) {
                app.showToast('Invalid file: missing Project or Unit', 'error');
                return;
            }

            // Save inspection
            const inspId = await DB.saveInspection(inspection);
            inspection.id = inspId;

            // Parse defects
            if (wb.SheetNames.includes('Defects')) {
                const defectSheet = wb.Sheets['Defects'];
                const defectRows = XLSX.utils.sheet_to_json(defectSheet);

                // Parse photos if available
                const photoMap = {};
                if (wb.SheetNames.includes('Photos')) {
                    const photoSheet = wb.Sheets['Photos'];
                    const photoRows = XLSX.utils.sheet_to_json(photoSheet);
                    photoRows.forEach(p => {
                        const key = p['Defect No'];
                        if (!photoMap[key]) photoMap[key] = [];
                        photoMap[key].push(p['Base64 Data']);
                    });
                }

                for (const row of defectRows) {
                    const defect = {
                        inspectionId: inspId,
                        area: row['Area'] || '',
                        category: row['Category'] || '',
                        severity: row['Severity'] || 'Minor',
                        status: row['Status'] || 'Open',
                        description: row['Description'] || '',
                        remarks: row['Remarks'] || '',
                        photos: photoMap[row['No']] || [],
                        createdAt: new Date().toISOString()
                    };
                    await DB.saveDefect(defect);
                }
            }

            app.showToast(`Imported: ${inspection.project} | ${inspection.unit}`, 'success');
            await app.loadAllProjects();
            await app.updateStorageEstimate();
            app.nav('homeScreen');

        } catch (err) {
            console.error('Import error:', err);
            app.showToast('Error importing file: ' + err.message, 'error');
        }
    }
};
