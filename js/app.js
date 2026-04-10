/**
 * Main application logic for Meem Inspection Tool.
 */
const app = {
    // --- State ---
    currentInspection: null,
    viewingInspection: null,
    currentArea: '',
    editingDefectId: null,
    currentPhotos: [],
    confirmCallback: null,
    allInspections: [],

    DEFAULT_AREAS: [
        'Living Room', 'Master Bedroom', 'Bedroom 2', 'Bedroom 3',
        'Kitchen', 'Toilet 1', 'Toilet 2', 'Yard', 'Car Porch',
        'Balcony', 'Hallway', 'Laundry Area', 'Store Room'
    ],

    // --- Init ---
    async init() {
        await DB.init();
        this.renderCategoryOptions();
        await this.loadAllProjects();
    },

    // --- Navigation ---
    nav(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        window.scrollTo(0, 0);
    },

    // --- Toast ---
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast ' + type;
        toast.offsetHeight;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    },

    // --- Confirm Dialog ---
    showConfirm(message, callback) {
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmDialog').style.display = 'flex';
        this.confirmCallback = callback;
        document.getElementById('confirmAction').onclick = () => {
            const confirmCallback = this.confirmCallback;
            this.closeConfirm();
            if (confirmCallback) confirmCallback();
        };
    },

    closeConfirm() {
        document.getElementById('confirmDialog').style.display = 'none';
        this.confirmCallback = null;
    },

    openReferences() {
        const listEl = document.getElementById('referencesList');
        listEl.innerHTML = STANDARDS_REFERENCES.map(ref => `
            <div class="reference-item">
                <div class="reference-item-title">${this.escapeHtml(ref.title)}</div>
                <div class="reference-item-desc">${this.escapeHtml(ref.description)}</div>
                <a class="reference-item-link" href="${this.escapeHtml(ref.url)}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(ref.url)}</a>
            </div>
        `).join('');
        document.getElementById('referencesDialog').style.display = 'flex';
    },

    closeReferences() {
        document.getElementById('referencesDialog').style.display = 'none';
    },

    renderCategoryOptions() {
        const container = document.getElementById('categorySelection');
        if (!container) return;

        container.innerHTML = DEFECT_CATEGORIES.map(category => `
            <label class="category-chip">
                <input type="checkbox" value="${this.escapeHtml(category)}" onchange="app.onCategoryChange()">
                <span>${this.escapeHtml(category)}</span>
            </label>
        `).join('');
    },

    getSelectedCategories() {
        return Array.from(document.querySelectorAll('#categorySelection input:checked'))
            .map(input => input.value)
            .filter(Boolean);
    },

    setSelectedCategories(categoriesOrString) {
        const selected = new Set(normalizeDefectCategoriesInput(categoriesOrString));
        document.querySelectorAll('#categorySelection input').forEach(input => {
            input.checked = selected.has(input.value);
        });
    },

    getStoredDefectCategories(defect) {
        if (Array.isArray(defect.categories) && defect.categories.length > 0) {
            return normalizeDefectCategoriesInput(defect.categories);
        }

        return normalizeDefectCategoriesInput(defect.category);
    },

    openNewInspection() {
        this.refreshProjectNameSuggestions();
        this.updateProjectSuggestionHint();
        this.nav('newInspectionScreen');
    },

    refreshProjectNameSuggestions() {
        const listEl = document.getElementById('projectNameSuggestions');
        if (!listEl) return;

        const uniqueNames = [];
        const seen = new Set();

        this.allInspections.forEach(inspection => {
            const name = (inspection.project || '').trim();
            const normalized = name.toLowerCase();
            if (!name || seen.has(normalized)) return;
            seen.add(normalized);
            uniqueNames.push(name);
        });

        uniqueNames.sort((a, b) => a.localeCompare(b));
        listEl.innerHTML = '';

        uniqueNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            listEl.appendChild(option);
        });
    },

    updateProjectSuggestionHint() {
        const hintEl = document.getElementById('projectSuggestionHint');
        const projectInput = document.getElementById('project');
        if (!hintEl || !projectInput) return;

        const project = projectInput.value.trim().toLowerCase();
        if (!project) {
            hintEl.textContent = this.allInspections.length > 0
                ? 'Tip: choose an existing project name to group multiple units / blocks under the same project.'
                : '';
            return;
        }

        const units = [];
        const seenUnits = new Set();

        this.allInspections.forEach(inspection => {
            if ((inspection.project || '').trim().toLowerCase() !== project) return;

            const unit = (inspection.unit || '').trim();
            const normalizedUnit = unit.toLowerCase();
            if (!unit || seenUnits.has(normalizedUnit)) return;

            seenUnits.add(normalizedUnit);
            units.push(unit);
        });

        if (units.length === 0) {
            hintEl.textContent = 'This will be saved as a new project name.';
            return;
        }

        hintEl.textContent = `Existing units / blocks: ${units.slice(0, 6).join(', ')}${units.length > 6 ? ', ...' : ''}`;
    },

    // ============================================
    // HOME SCREEN - All Projects
    // ============================================
    async loadAllProjects() {
        const inspections = await DB.getAllInspections();
        this.allInspections = inspections;
        this.refreshProjectNameSuggestions();
        this.updateProjectSuggestionHint();

        const countEl = document.getElementById('projectCount');
        const listEl = document.getElementById('projectsList');
        const emptyEl = document.getElementById('emptyProjectsState');

        countEl.textContent = `${inspections.length} project${inspections.length !== 1 ? 's' : ''}`;

        if (inspections.length === 0) {
            listEl.innerHTML = '';
            emptyEl.style.display = 'block';
            return;
        }

        emptyEl.style.display = 'none';
        inspections.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        listEl.innerHTML = '';
        for (const insp of inspections) {
            const defects = await DB.getDefectsByInspection(insp.id);
            const date = new Date(insp.createdAt).toLocaleDateString('en-MY', {
                day: 'numeric', month: 'short', year: 'numeric'
            });

            const criticalCount = defects.filter(d => d.severity === 'Critical').length;
            const openCount = defects.filter(d => d.status === 'Open').length;

            const card = document.createElement('div');
            card.className = 'project-card';
            card.onclick = () => this.openProjectDetail(insp);
            card.innerHTML = `
                <div class="project-card-header">
                    <div class="project-card-title">${this.escapeHtml(insp.project)}</div>
                    <span class="project-card-arrow">&#8250;</span>
                </div>
                <div class="project-card-unit">${this.escapeHtml(insp.unit)}</div>
                <div class="project-card-meta">
                    <span>${date}</span>
                    <span>${this.escapeHtml(insp.inspector || '—')}</span>
                </div>
                <div class="project-card-stats">
                    <span class="project-stat">${defects.length} defects</span>
                    ${criticalCount > 0 ? `<span class="project-stat stat-crit">${criticalCount} critical</span>` : ''}
                    ${openCount > 0 ? `<span class="project-stat stat-open">${openCount} open</span>` : ''}
                </div>
            `;
            listEl.appendChild(card);
        }
    },

    filterProjects() {
        const query = document.getElementById('projectSearch').value.toLowerCase().trim();
        const cards = document.querySelectorAll('.project-card');
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(query) ? '' : 'none';
        });
    },

    // ============================================
    // PROJECT DETAIL SCREEN
    // ============================================
    async openProjectDetail(inspection) {
        this.viewingInspection = inspection;
        const defects = await DB.getDefectsByInspection(inspection.id);

        document.getElementById('projectDetailTitle').textContent = `${inspection.project}`;
        document.getElementById('projectDetailMeta').textContent = inspection.unit;
        document.getElementById('projectDetailProjectInput').value = inspection.project || '';
        document.getElementById('projectDetailUnitInput').value = inspection.unit || '';
        document.getElementById('projectDetailInspectorInput').value = inspection.inspector || '';
        document.getElementById('projectDetailClientInput').value = inspection.client || '';
        document.getElementById('projectDetailDeveloperInput').value = inspection.developer || '';
        document.getElementById('projectDetailAddressInput').value = inspection.address || '';

        const date = new Date(inspection.createdAt).toLocaleDateString('en-MY', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        document.getElementById('projectDetailCreated').textContent = `Created: ${date}`;

        // Info section
        document.getElementById('projectDetailInfo').innerHTML = `
            <div class="detail-row"><strong>Project</strong><span>${this.escapeHtml(inspection.project)}</span></div>
            <div class="detail-row"><strong>Unit</strong><span>${this.escapeHtml(inspection.unit)}</span></div>
            <div class="detail-row"><strong>Inspector</strong><span>${this.escapeHtml(inspection.inspector || '—')}</span></div>
            <div class="detail-row"><strong>Client</strong><span>${this.escapeHtml(inspection.client || '—')}</span></div>
            <div class="detail-row"><strong>Developer</strong><span>${this.escapeHtml(inspection.developer || '—')}</span></div>
            <div class="detail-row"><strong>Date</strong><span>${date}</span></div>
            ${inspection.address ? `<div class="detail-row"><strong>Address</strong><span>${this.escapeHtml(inspection.address)}</span></div>` : ''}
        `;

        // Stats
        const minor = defects.filter(d => d.severity === 'Minor').length;
        const major = defects.filter(d => d.severity === 'Major').length;
        const critical = defects.filter(d => d.severity === 'Critical').length;

        document.getElementById('projectDetailStats').innerHTML = `
            <div class="stat-card"><span class="stat-number">${defects.length}</span><span class="stat-label">Total</span></div>
            <div class="stat-card stat-minor"><span class="stat-number">${minor}</span><span class="stat-label">Minor</span></div>
            <div class="stat-card stat-major"><span class="stat-number">${major}</span><span class="stat-label">Major</span></div>
            <div class="stat-card stat-critical"><span class="stat-number">${critical}</span><span class="stat-label">Critical</span></div>
        `;

        // Defect list grouped by area
        const byArea = {};
        defects.forEach(d => {
            if (!byArea[d.area]) byArea[d.area] = [];
            byArea[d.area].push(d);
        });

        let html = '';
        if (defects.length === 0) {
            html = '<div class="empty-state"><p>No defects recorded.</p></div>';
        } else {
            for (const [area, areaDefects] of Object.entries(byArea)) {
                html += `<div class="detail-area-header">${this.escapeHtml(area)} <span class="meta-text">(${areaDefects.length})</span></div>`;
                for (const d of areaDefects) {
                    const sevClass = `tag-${d.severity.toLowerCase()}`;
                    html += `
                        <div class="detail-defect-row">
                            <div class="detail-defect-info">
                                <span class="tag ${sevClass}">${d.severity}</span>
                                <strong>${this.escapeHtml(d.category)}</strong>
                            </div>
                            <div class="detail-defect-desc">${this.formatMultilineHtml(d.description || '')}</div>
                        </div>
                    `;
                }
            }
        }
        document.getElementById('projectDetailDefects').innerHTML = html;

        this.nav('projectDetailScreen');
    },

    async saveProjectDetails() {
        if (!this.viewingInspection) return;

        const updatedInspection = {
            ...this.viewingInspection,
            project: document.getElementById('projectDetailProjectInput').value.trim(),
            unit: document.getElementById('projectDetailUnitInput').value.trim(),
            inspector: document.getElementById('projectDetailInspectorInput').value.trim(),
            client: document.getElementById('projectDetailClientInput').value.trim(),
            developer: document.getElementById('projectDetailDeveloperInput').value.trim(),
            address: document.getElementById('projectDetailAddressInput').value.trim()
        };

        if (!updatedInspection.project || !updatedInspection.unit) {
            this.showToast('Project and Unit are required', 'error');
            return;
        }

        await DB.saveInspection(updatedInspection);

        this.viewingInspection = updatedInspection;
        if (this.currentInspection && this.currentInspection.id === updatedInspection.id) {
            this.currentInspection = updatedInspection;
        }

        this.allInspections = this.allInspections.map(item =>
            item.id === updatedInspection.id ? updatedInspection : item
        );
        this.refreshProjectNameSuggestions();

        document.getElementById('projectDetailTitle').textContent = updatedInspection.project;
        document.getElementById('projectDetailMeta').textContent = updatedInspection.unit;

        this.showToast('Project details updated');
    },

    async resumeFromDetail() {
        await this.resumeInspection(this.viewingInspection);
    },

    async exportReportFromDetail() {
        await exportReport.generate(this.viewingInspection);
    },

    async deleteInspection() {
        this.showConfirm('Delete this entire inspection and all its defects? This cannot be undone.', async () => {
            await DB.deleteDefectsByInspection(this.viewingInspection.id);
            await DB.deleteInspection(this.viewingInspection.id);
            this.viewingInspection = null;
            this.showToast('Inspection deleted', 'info');
            await this.loadAllProjects();
            this.nav('homeScreen');
        });
    },

    // ============================================
    // START / RESUME INSPECTION
    // ============================================
    async resumeInspection(inspection) {
        this.currentInspection = inspection;
        document.getElementById('inspectionTitle').textContent = `${inspection.project} | ${inspection.unit}`;
        document.getElementById('inspectionMeta').textContent = `Inspector: ${inspection.inspector || '—'}`;
        await this.renderAreaList();
        this.nav('areaListScreen');
    },

    async startInspection() {
        const project = document.getElementById('project').value.trim();
        const unit = document.getElementById('unit').value.trim();
        const inspector = document.getElementById('inspector').value.trim();
        const client = document.getElementById('client').value.trim();
        const developer = document.getElementById('developer').value.trim();
        const address = document.getElementById('address').value.trim();

        if (!project || !unit) {
            this.showToast('Please enter Project and Unit', 'error');
            return;
        }

        const inspection = {
            project, unit, inspector, client, developer, address,
            areas: [...this.DEFAULT_AREAS],
            createdAt: new Date().toISOString()
        };

        const id = await DB.saveInspection(inspection);
        inspection.id = id;
        this.currentInspection = inspection;
        this.allInspections = [inspection, ...this.allInspections.filter(item => item.id !== inspection.id)];
        this.refreshProjectNameSuggestions();

        // Clear form
        document.getElementById('project').value = '';
        document.getElementById('unit').value = '';
        document.getElementById('inspector').value = '';
        document.getElementById('client').value = '';
        document.getElementById('developer').value = '';
        document.getElementById('address').value = '';
        this.updateProjectSuggestionHint();

        document.getElementById('inspectionTitle').textContent = `${project} | ${unit}`;
        document.getElementById('inspectionMeta').textContent = `Inspector: ${inspector || '—'}`;
        await this.renderAreaList();
        this.nav('areaListScreen');
    },

    confirmEndInspection() {
        this.showConfirm('Return to home? Your data is saved.', async () => {
            this.currentInspection = null;
            await this.loadAllProjects();
            this.nav('homeScreen');
        });
    },

    // ============================================
    // AREA LIST
    // ============================================
    async renderAreaList() {
        const listDiv = document.getElementById('areaButtonsList');
        listDiv.innerHTML = '';

        const defects = await DB.getDefectsByInspection(this.currentInspection.id);
        const areas = this.currentInspection.areas || this.DEFAULT_AREAS;

        const areaCounts = {};
        defects.forEach(d => {
            areaCounts[d.area] = (areaCounts[d.area] || 0) + 1;
        });

        areas.forEach(area => {
            const count = areaCounts[area] || 0;
            const btn = document.createElement('button');
            btn.className = 'area-btn';
            btn.innerHTML = `
                <span class="area-name">${this.escapeHtml(area)}</span>
                ${count > 0 ? `<span class="area-badge">${count}</span>` : ''}
                <span class="area-arrow">&#8250;</span>
            `;
            btn.onclick = () => this.openDefectList(area);
            listDiv.appendChild(btn);
        });
    },

    async addNewArea() {
        const input = document.getElementById('customAreaInput');
        const newArea = input.value.trim();
        if (!newArea) return;

        if (this.currentInspection.areas.includes(newArea)) {
            this.showToast('Area already exists', 'error');
            return;
        }

        this.currentInspection.areas.push(newArea);
        await DB.saveInspection(this.currentInspection);
        input.value = '';
        await this.renderAreaList();
        this.showToast(`"${newArea}" added`, 'success');
    },

    // ============================================
    // DEFECT LIST
    // ============================================
    async openDefectList(area) {
        this.currentArea = area;
        document.getElementById('defectListTitle').textContent = area;

        const defects = await DB.getDefectsByInspection(this.currentInspection.id);
        const areaDefects = defects.filter(d => d.area === area);

        document.getElementById('defectListCount').textContent = `${areaDefects.length} defect${areaDefects.length !== 1 ? 's' : ''}`;

        const container = document.getElementById('defectListContainer');
        const emptyState = document.getElementById('emptyDefectState');

        if (areaDefects.length === 0) {
            container.innerHTML = '';
            container.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            container.style.display = 'block';
            container.innerHTML = areaDefects.map(d => {
                const severityClass = `tag-${d.severity.toLowerCase()}`;
                const statusClass = d.status === 'In Progress' ? 'tag-progress' :
                                    d.status === 'Resolved' ? 'tag-resolved' : 'tag-open';
                const thumb = d.photos && d.photos.length > 0
                    ? `<img src="${d.photos[0]}" alt="">`
                    : '&#128247;';

                return `
                    <div class="defect-item" onclick="app.editDefect(${d.id})">
                        <div class="defect-item-thumb">${thumb}</div>
                        <div class="defect-item-info">
                            <div class="defect-category">
                                ${this.escapeHtml(d.category)}
                                <span class="tag ${severityClass}">${d.severity}</span>
                                <span class="tag ${statusClass}">${d.status}</span>
                            </div>
                            <div class="defect-desc">${this.escapeHtml(d.description || 'No description')}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        this.nav('defectListScreen');
    },

    // ============================================
    // DEFECT FORM
    // ============================================
    openDefectForm() {
        this.editingDefectId = null;
        this.currentPhotos = [];
        document.getElementById('formTitle').textContent = 'New Defect';
        document.getElementById('formAreaName').textContent = this.currentArea;

        this.setSelectedCategories([]);
        document.getElementById('description').value = '';
        document.getElementById('remarks').value = '';
        document.getElementById('status').value = 'Open';
        document.querySelector('input[name="severity"][value="Minor"]').checked = true;
        document.getElementById('deleteBtn').style.display = 'none';
        document.getElementById('saveBtn').textContent = 'Save Defect';
        document.getElementById('descSuggestionWrap').style.display = 'none';
        document.getElementById('descSuggestion').value = '';
        document.getElementById('remarksSuggestionWrap').style.display = 'none';
        document.getElementById('remarksSuggestion').value = '';
        document.getElementById('photoPasteZone').blur();

        this.onCategoryChange();
        this.renderPhotoPreview();
        this.nav('defectFormScreen');
    },

    async editDefect(id) {
        const defect = await DB.getDefect(id);
        if (!defect) return;

        this.editingDefectId = id;
        this.currentPhotos = defect.photos || [];

        document.getElementById('formTitle').textContent = 'Edit Defect';
        document.getElementById('formAreaName').textContent = defect.area;
        this.setSelectedCategories(this.getStoredDefectCategories(defect));
        document.getElementById('description').value = defect.description;
        document.getElementById('remarks').value = defect.remarks || '';
        document.getElementById('status').value = defect.status;

        const severityRadio = document.querySelector(`input[name="severity"][value="${defect.severity}"]`);
        if (severityRadio) severityRadio.checked = true;

        document.getElementById('deleteBtn').style.display = 'block';
        document.getElementById('saveBtn').textContent = 'Update Defect';

        // Populate description suggestions for this category
        this.onCategoryChange();

        this.renderPhotoPreview();
        this.nav('defectFormScreen');
    },

    async saveDefect() {
        const categories = this.getSelectedCategories();
        const category = categories.join(' + ');
        const description = document.getElementById('description').value.trim();
        const severity = document.querySelector('input[name="severity"]:checked').value;

        if (categories.length === 0) {
            this.showToast('Please select at least one category', 'error');
            return;
        }
        if (!description) {
            this.showToast('Please enter a description', 'error');
            return;
        }

        const btn = document.getElementById('saveBtn');
        btn.textContent = 'Saving...';
        btn.disabled = true;

        const defect = {
            inspectionId: this.currentInspection.id,
            area: this.currentArea,
            category,
            categories,
            severity,
            status: document.getElementById('status').value,
            description,
            remarks: document.getElementById('remarks').value.trim(),
            photos: this.currentPhotos,
            createdAt: new Date().toISOString()
        };

        if (this.editingDefectId) {
            defect.id = this.editingDefectId;
        }

        await DB.saveDefect(defect);

        btn.textContent = this.editingDefectId ? 'Update Defect' : 'Save Defect';
        btn.disabled = false;

        this.showToast(this.editingDefectId ? 'Defect updated' : 'Defect saved');
        await this.openDefectList(this.currentArea);
    },

    deleteDefect() {
        this.showConfirm('Delete this defect? This cannot be undone.', async () => {
            await DB.deleteDefect(this.editingDefectId);
            this.showToast('Defect deleted', 'info');
            await this.openDefectList(this.currentArea);
        });
    },

    // ============================================
    // PHOTOS
    // ============================================
    handlePhoto(event) {
        const file = event.target.files[0];
        if (!file) return;
        this.compressAndAddPhoto(file);
        event.target.value = '';
    },

    handlePhotoUpload(event) {
        const files = Array.from(event.target.files);
        files.forEach(file => this.compressAndAddPhoto(file));
        event.target.value = '';
    },

    focusPasteZone() {
        const pasteZone = document.getElementById('photoPasteZone');
        if (!pasteZone) return;
        pasteZone.focus();
        this.showToast('Paste your copied image here with Ctrl+V', 'info');
    },

    handlePaste(event) {
        const clipboardItems = Array.from(event.clipboardData?.items || []);
        const imageItems = clipboardItems.filter(item => item.type && item.type.startsWith('image/'));

        if (imageItems.length === 0) {
            this.showToast('No image found in clipboard', 'error');
            return;
        }

        event.preventDefault();

        imageItems.forEach((item, index) => {
            const file = item.getAsFile();
            if (!file) return;

            const extension = file.type.split('/')[1] || 'png';
            const clipboardFile = new File([file], `clipboard-image-${Date.now()}-${index}.${extension}`, {
                type: file.type
            });
            this.compressAndAddPhoto(clipboardFile);
        });

        this.showToast(imageItems.length > 1 ? 'Images pasted from clipboard' : 'Image pasted from clipboard');
    },

    compressAndAddPhoto(file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1024;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height = height * (MAX_WIDTH / width);
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressed = canvas.toDataURL('image/jpeg', 0.75);
                this.currentPhotos.push(compressed);
                this.renderPhotoPreview();
            };
        };
    },

    removePhoto(index) {
        this.currentPhotos.splice(index, 1);
        this.renderPhotoPreview();
    },

    renderPhotoPreview() {
        const container = document.getElementById('photoPreviewContainer');
        if (this.currentPhotos.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = this.currentPhotos.map((photo, i) => `
            <div class="photo-thumb">
                <img src="${photo}" alt="Photo ${i + 1}">
                <button class="remove-photo" onclick="event.stopPropagation(); app.removePhoto(${i})">&#10005;</button>
            </div>
        `).join('');
    },

    // ============================================
    // SUMMARY
    // ============================================
    async generateSummary() {
        const defects = await DB.getDefectsByInspection(this.currentInspection.id);

        document.getElementById('totalDefectsCount').textContent = defects.length;
        document.getElementById('minorCount').textContent = defects.filter(d => d.severity === 'Minor').length;
        document.getElementById('majorCount').textContent = defects.filter(d => d.severity === 'Major').length;
        document.getElementById('criticalCount').textContent = defects.filter(d => d.severity === 'Critical').length;

        const emptyMsg = '<div style="color:#9ca3af;text-align:center;padding:10px;">No defects yet.</div>';

        if (defects.length === 0) {
            document.getElementById('summaryByArea').innerHTML = emptyMsg;
            document.getElementById('summaryByCategory').innerHTML = emptyMsg;
            document.getElementById('summaryByStatus').innerHTML = emptyMsg;
            this.nav('summaryScreen');
            return;
        }

        document.getElementById('summaryByArea').innerHTML = this.renderSummaryRows(this.groupBy(defects, 'area'));
        document.getElementById('summaryByCategory').innerHTML = this.renderSummaryRows(this.groupBy(defects, 'category'));
        document.getElementById('summaryByStatus').innerHTML = this.renderSummaryRows(this.groupBy(defects, 'status'));

        this.nav('summaryScreen');
    },

    groupBy(arr, key) {
        return arr.reduce((acc, item) => {
            acc[item[key]] = (acc[item[key]] || 0) + 1;
            return acc;
        }, {});
    },

    renderSummaryRows(grouped) {
        return Object.entries(grouped)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => `
                <div class="summary-row">
                    <span>${this.escapeHtml(name)}</span>
                    <strong>${count}</strong>
                </div>
            `).join('');
    },

    // ============================================
    // DESCRIPTION SUGGESTIONS
    // ============================================
    onCategoryChange() {
        const categories = this.getSelectedCategories();
        const wrap = document.getElementById('descSuggestionWrap');
        const select = document.getElementById('descSuggestion');

        if (categories.length > 0) {
            const suggestions = getDefectDescriptionSuggestions(categories);
            select.innerHTML = '<option value="">-- Add common defect description --</option>';
            suggestions.forEach(desc => {
                const opt = document.createElement('option');
                opt.value = desc;
                opt.textContent = desc;
                select.appendChild(opt);
            });
            wrap.style.display = 'block';
        } else {
            select.innerHTML = '<option value="">-- Add common defect description --</option>';
            wrap.style.display = 'none';
        }

        this.renderCategoryReferenceGuides(categories);
        this.refreshRemarksSuggestions();
    },

    applyDescSuggestion() {
        const select = document.getElementById('descSuggestion');
        const selected = select.value;
        const descriptionEl = document.getElementById('description');
        if (!selected) return;

        const existingLines = descriptionEl.value
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean);

        if (!existingLines.includes(selected)) {
            existingLines.push(selected);
            descriptionEl.value = existingLines.join('\n');
        } else {
            this.showToast('That common defect is already added', 'info');
        }

        select.value = '';
        descriptionEl.focus();
        this.refreshRemarksSuggestions();
    },

    refreshRemarksSuggestions() {
        const categories = this.getSelectedCategories();
        const description = document.getElementById('description').value;
        const wrap = document.getElementById('remarksSuggestionWrap');
        const select = document.getElementById('remarksSuggestion');
        const suggestions = getRectificationRemarkSuggestions(categories, description);

        if (suggestions.length === 0) {
            wrap.style.display = 'none';
            select.innerHTML = '<option value="">-- Add suggested rectification remark --</option>';
            return;
        }

        select.innerHTML = '<option value="">-- Add suggested rectification remark --</option>';
        suggestions.forEach(remark => {
            const opt = document.createElement('option');
            opt.value = remark;
            opt.textContent = remark;
            select.appendChild(opt);
        });
        wrap.style.display = 'block';
    },

    renderCategoryReferenceGuides(categoriesOrString) {
        const categories = normalizeDefectCategoriesInput(categoriesOrString);
        const wrap = document.getElementById('categoryReferenceWrap');
        const list = document.getElementById('categoryReferenceList');
        const guides = getCategoryReferenceGuides(categories);

        if (categories.length === 0 || guides.length === 0) {
            wrap.style.display = 'none';
            list.innerHTML = '';
            return;
        }

        list.innerHTML = guides.map(guide => `
            <div class="category-reference-card">
                <div class="category-reference-title">${this.escapeHtml(guide.title)}</div>
                <div class="category-reference-quote">${this.escapeHtml(guide.quote)}</div>
                <div class="category-reference-note">${this.escapeHtml(guide.note)}</div>
                <a class="category-reference-link" href="${this.escapeHtml(guide.url)}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(guide.url)}</a>
            </div>
        `).join('');
        wrap.style.display = 'block';
    },

    applyRemarkSuggestion() {
        const select = document.getElementById('remarksSuggestion');
        const selected = select.value;
        const remarksEl = document.getElementById('remarks');
        if (!selected) return;

        const existingLines = remarksEl.value
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean);

        if (!existingLines.includes(selected)) {
            existingLines.push(selected);
            remarksEl.value = existingLines.join('\n');
        } else {
            this.showToast('That rectification remark is already added', 'info');
        }

        select.value = '';
        remarksEl.focus();
    },

    // === EXPORT ===
    async exportReport() {
        await exportReport.generate(this.currentInspection);
    },

    // === UTILS ===
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    formatMultilineHtml(str) {
        return this.escapeHtml(str).replace(/\n/g, '<br>');
    }
};

// Boot
document.addEventListener('DOMContentLoaded', () => app.init());
