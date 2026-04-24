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
    inspectionDraftTimer: null,
    defectDraftTimer: null,

    DEFAULT_AREAS: [
        'Living Room', 'Master Bedroom', 'Bedroom 2', 'Bedroom 3',
        'Kitchen', 'Toilet 1', 'Toilet 2', 'Yard', 'Car Porch',
        'Balcony', 'Hallway', 'Laundry Area', 'Store Room'
    ],

    // --- Init ---
    async init() {
        this.renderCategoryOptions();
        this.bindFormProgressListeners();
        this.bindKeyboardShortcuts();
        this.bindAutosaveListeners();
        this.restoreInspectionDraft();

        try {
            await DB.init();
            await this.loadAllProjects();
        } catch (error) {
            console.error('Local database initialization failed:', error);
            this.showToast(this.getStorageErrorMessage(error), 'error');
        }

        await this.updateStorageEstimate();
    },

    bindFormProgressListeners() {
        document.querySelectorAll('input[name="severity"]').forEach(radio => {
            radio.addEventListener('change', () => this.updateFormProgress());
        });
    },

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            const formScreenActive = document.getElementById('defectFormScreen').classList.contains('active');
            if (!formScreenActive) return;

            const target = e.target;
            const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');

            if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
                e.preventDefault();
                this.saveDefect();
                return;
            }

            if (e.key === 'Escape' && !isTyping) {
                e.preventDefault();
                this.nav('defectListScreen');
            }
        });
    },

    bindAutosaveListeners() {
        ['project', 'unit', 'inspector', 'client', 'developer', 'address'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => this.scheduleInspectionDraftSave());
        });

        ['description', 'remarks'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => this.scheduleDefectDraftSave());
        });

        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.addEventListener('change', () => this.scheduleDefectDraftSave());

        document.querySelectorAll('input[name="severity"]').forEach(radio => {
            radio.addEventListener('change', () => this.scheduleDefectDraftSave());
        });

        const categoryEl = document.getElementById('categorySelection');
        if (categoryEl) categoryEl.addEventListener('change', () => this.scheduleDefectDraftSave());
    },

    // --- Navigation ---
    nav(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        window.scrollTo(0, 0);
        if (screenId === 'homeScreen') {
            this.updateStorageEstimate();
        }
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

    async updateStorageEstimate() {
        const statusEl = document.getElementById('storageStatusText');
        const usedEl = document.getElementById('storageUsedText');
        const quotaEl = document.getElementById('storageQuotaText');
        const fillEl = document.getElementById('storageMeterFill');

        if (!statusEl || !usedEl || !quotaEl || !fillEl) return;

        if (!navigator.storage || typeof navigator.storage.estimate !== 'function') {
            statusEl.textContent = 'Storage estimate is not available in this browser.';
            usedEl.textContent = 'Used: unavailable';
            quotaEl.textContent = 'Available: unavailable';
            fillEl.style.width = '0%';
            fillEl.className = 'storage-meter-fill';
            return;
        }

        try {
            const estimate = await navigator.storage.estimate();
            const usage = estimate.usage || 0;
            const quota = estimate.quota || 0;
            const percent = quota > 0 ? Math.min(100, Math.round((usage / quota) * 100)) : 0;

            fillEl.style.width = `${percent}%`;
            fillEl.className = 'storage-meter-fill';
            if (percent >= 80) {
                fillEl.classList.add('danger');
                statusEl.textContent = 'Storage almost full. Export backup soon.';
            } else if (percent >= 60) {
                fillEl.classList.add('warning');
                statusEl.textContent = 'Storage getting high. Consider exporting old inspections.';
            } else {
                statusEl.textContent = 'Storage OK for field use.';
            }

            usedEl.textContent = `Used: ${this.formatBytes(usage)} (${percent}%)`;
            quotaEl.textContent = `Limit: ${this.formatBytes(quota)}`;
        } catch (e) {
            statusEl.textContent = 'Unable to check storage right now.';
            usedEl.textContent = 'Used: unavailable';
            quotaEl.textContent = 'Available: unavailable';
            fillEl.style.width = '0%';
            fillEl.className = 'storage-meter-fill';
        }
    },

    scheduleInspectionDraftSave() {
        clearTimeout(this.inspectionDraftTimer);
        this.inspectionDraftTimer = setTimeout(() => this.saveInspectionDraft(), 250);
    },

    saveInspectionDraft() {
        const draft = {
            project: document.getElementById('project').value,
            unit: document.getElementById('unit').value,
            inspector: document.getElementById('inspector').value,
            client: document.getElementById('client').value,
            developer: document.getElementById('developer').value,
            address: document.getElementById('address').value,
            updatedAt: new Date().toISOString()
        };

        const hasContent = Object.entries(draft)
            .filter(([key]) => key !== 'updatedAt')
            .some(([, value]) => String(value || '').trim());

        if (!hasContent) {
            localStorage.removeItem('prospec_new_inspection_draft');
            return;
        }

        try {
            localStorage.setItem('prospec_new_inspection_draft', JSON.stringify(draft));
        } catch (e) {
            this.showToast('Unable to autosave inspection draft. Storage may be full.', 'error');
        }
    },

    restoreInspectionDraft() {
        try {
            const raw = localStorage.getItem('prospec_new_inspection_draft');
            if (!raw) return;

            const draft = JSON.parse(raw);
            ['project', 'unit', 'inspector', 'client', 'developer', 'address'].forEach(id => {
                const el = document.getElementById(id);
                if (el && typeof draft[id] === 'string') el.value = draft[id];
            });
            this.updateProjectSuggestionHint();
        } catch (e) {
            localStorage.removeItem('prospec_new_inspection_draft');
        }
    },

    clearInspectionDraft() {
        clearTimeout(this.inspectionDraftTimer);
        localStorage.removeItem('prospec_new_inspection_draft');
    },

    getDefectDraftKey() {
        if (!this.currentInspection || !this.currentArea) return null;
        const mode = this.editingDefectId ? `edit-${this.editingDefectId}` : 'new';
        return `prospec_defect_draft_${this.currentInspection.id}_${this.currentArea}_${mode}`;
    },

    scheduleDefectDraftSave() {
        clearTimeout(this.defectDraftTimer);
        this.defectDraftTimer = setTimeout(() => this.saveDefectDraft(), 250);
    },

    async saveDefectDraft() {
        const key = this.getDefectDraftKey();
        if (!key) return;

        const draft = {
            inspectionId: this.currentInspection.id,
            area: this.currentArea,
            editingDefectId: this.editingDefectId,
            categories: this.getSelectedCategories(),
            severity: document.querySelector('input[name="severity"]:checked')?.value || 'Minor',
            status: document.getElementById('status').value,
            description: document.getElementById('description').value,
            remarks: document.getElementById('remarks').value,
            photos: this.currentPhotos,
            updatedAt: new Date().toISOString()
        };

        const hasContent = draft.categories.length > 0
            || draft.description.trim()
            || draft.remarks.trim()
            || draft.photos.length > 0
            || draft.status !== 'Open'
            || draft.severity !== 'Minor';

        if (!hasContent) {
            await DB.deleteDraft(key);
            return;
        }

        try {
            await DB.saveDraft(key, draft);
        } catch (e) {
            this.showToast('Unable to autosave defect draft. Export/clear old data if storage is full.', 'error');
        }
    },

    async restoreDefectDraft() {
        const key = this.getDefectDraftKey();
        if (!key) return false;

        try {
            const draft = await DB.getDraft(key);
            if (!draft) return false;

            this.setSelectedCategories(draft.categories || []);
            document.getElementById('description').value = draft.description || '';
            document.getElementById('remarks').value = draft.remarks || '';
            document.getElementById('status').value = draft.status || 'Open';

            const severityRadio = document.querySelector(`input[name="severity"][value="${draft.severity || 'Minor'}"]`);
            if (severityRadio) severityRadio.checked = true;

            this.currentPhotos = Array.isArray(draft.photos) ? draft.photos : [];
            this.showToast('Autosaved draft restored', 'info');
            return true;
        } catch (e) {
            await DB.deleteDraft(key);
            return false;
        }
    },

    async clearDefectDraft() {
        clearTimeout(this.defectDraftTimer);
        const key = this.getDefectDraftKey();
        if (key) await DB.deleteDraft(key);
    },

    renderCategoryOptions() {
        const container = document.getElementById('categorySelection');
        if (!container) return;

        const usage = this.getCategoryUsageCounts();
        const ordered = [...DEFECT_CATEGORIES].sort((a, b) => {
            const diff = (usage[b] || 0) - (usage[a] || 0);
            if (diff !== 0) return diff;
            return DEFECT_CATEGORIES.indexOf(a) - DEFECT_CATEGORIES.indexOf(b);
        });

        container.innerHTML = ordered.map(category => `
            <label class="category-chip">
                <input type="checkbox" value="${this.escapeHtml(category)}" onchange="app.onCategoryChange()">
                <span>${this.escapeHtml(category)}</span>
            </label>
        `).join('');
    },

    getCategoryUsageCounts() {
        try {
            const raw = localStorage.getItem('prospec_category_usage');
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    },

    bumpCategoryUsage(categoriesOrString) {
        const categories = normalizeDefectCategoriesInput(categoriesOrString);
        if (categories.length === 0) return;
        const counts = this.getCategoryUsageCounts();
        categories.forEach(cat => { counts[cat] = (counts[cat] || 0) + 1; });
        try {
            localStorage.setItem('prospec_category_usage', JSON.stringify(counts));
        } catch (e) { /* ignore */ }
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
        this.restoreInspectionDraft();
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
            this.updateStorageEstimate();
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
        this.updateStorageEstimate();
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
        this.clearInspectionDraft();
        this.updateProjectSuggestionHint();

        document.getElementById('inspectionTitle').textContent = `${project} | ${unit}`;
        document.getElementById('inspectionMeta').textContent = `Inspector: ${inspector || '—'}`;
        await this.renderAreaList();
        this.nav('areaListScreen');
    },

    async startInspectionSafe() {
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

        const btn = document.getElementById('startInspectionBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Starting...';
        }

        try {
            const inspection = {
                project, unit, inspector, client, developer, address,
                areas: [...this.DEFAULT_AREAS],
                createdAt: new Date().toISOString()
            };

            const id = await DB.saveInspection(inspection);
            inspection.id = id;
            this.updateStorageEstimate();
            this.currentInspection = inspection;
            this.allInspections = [inspection, ...this.allInspections.filter(item => item.id !== inspection.id)];
            this.refreshProjectNameSuggestions();

            document.getElementById('project').value = '';
            document.getElementById('unit').value = '';
            document.getElementById('inspector').value = '';
            document.getElementById('client').value = '';
            document.getElementById('developer').value = '';
            document.getElementById('address').value = '';
            this.clearInspectionDraft();
            this.updateProjectSuggestionHint();

            document.getElementById('inspectionTitle').textContent = `${project} | ${unit}`;
            document.getElementById('inspectionMeta').textContent = `Inspector: ${inspector || 'N/A'}`;
            await this.renderAreaList();
            this.nav('areaListScreen');
        } catch (error) {
            console.error('Start inspection failed:', error);
            this.showToast(this.getStorageErrorMessage(error), 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Start Inspection';
            }
        }
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
        this.updateStorageEstimate();
        input.value = '';
        await this.renderAreaList();
        this.showToast(`"${newArea}" added`, 'success');
    },

    // ============================================
    // DEFECT LIST
    // ============================================
    currentDefectFilter: 'all',
    currentAreaDefects: [],

    async openDefectList(area) {
        this.currentArea = area;
        document.getElementById('defectListTitle').textContent = area;

        const defects = await DB.getDefectsByInspection(this.currentInspection.id);
        this.currentAreaDefects = defects.filter(d => d.area === area);
        this.currentDefectFilter = 'all';

        document.querySelectorAll('#defectFilters .defect-filter-chip').forEach(chip => {
            chip.classList.toggle('active', chip.getAttribute('data-filter') === 'all');
        });

        this.renderDefectList();
        this.nav('defectListScreen');
    },

    renderDefectList() {
        const areaDefects = this.currentAreaDefects || [];
        const filter = this.currentDefectFilter || 'all';
        const visible = filter === 'all'
            ? areaDefects
            : areaDefects.filter(d => d.severity === filter || d.status === filter);

        const countEl = document.getElementById('defectListCount');
        if (filter === 'all') {
            countEl.textContent = `${areaDefects.length} defect${areaDefects.length !== 1 ? 's' : ''}`;
        } else {
            countEl.textContent = `${visible.length} of ${areaDefects.length} shown (${filter})`;
        }

        const filtersEl = document.getElementById('defectFilters');
        if (filtersEl) {
            filtersEl.style.display = areaDefects.length > 0 ? 'flex' : 'none';
        }

        const container = document.getElementById('defectListContainer');
        const emptyState = document.getElementById('emptyDefectState');

        if (areaDefects.length === 0) {
            container.innerHTML = '';
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        container.style.display = 'block';

        if (visible.length === 0) {
            container.innerHTML = `<div class="empty-state"><p>No defects match this filter.</p></div>`;
            return;
        }

        container.innerHTML = visible.map(d => {
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
    },

    setDefectFilter(filter) {
        this.currentDefectFilter = filter;
        document.querySelectorAll('#defectFilters .defect-filter-chip').forEach(chip => {
            chip.classList.toggle('active', chip.getAttribute('data-filter') === filter);
        });
        this.renderDefectList();
    },

    // ============================================
    // DEFECT FORM
    // ============================================
    async openDefectForm() {
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
        this.clearDescSearch();
        document.getElementById('remarksSuggestionWrap').style.display = 'none';
        document.getElementById('remarksSuggestion').value = '';
        this.clearRemarkSearch();
        document.getElementById('photoPasteZone').blur();

        await this.restoreDefectDraft();
        this.onCategoryChange();
        this.renderPhotoPreview();
        this.updatePhotoCollapsedState();
        this.updateFormProgress();
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
        await this.restoreDefectDraft();
        this.onCategoryChange();

        this.renderPhotoPreview();
        this.updatePhotoCollapsedState();
        this.updateFormProgress();
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
        this.bumpCategoryUsage(categories);
        await this.clearDefectDraft();
        this.updateStorageEstimate();

        btn.textContent = this.editingDefectId ? 'Update Defect' : 'Save Defect';
        btn.disabled = false;

        this.showToast(this.editingDefectId ? 'Defect updated' : 'Defect saved');
        await this.openDefectList(this.currentArea);
    },

    deleteDefect() {
        this.showConfirm('Delete this defect? This cannot be undone.', async () => {
            await DB.deleteDefect(this.editingDefectId);
            await this.clearDefectDraft();
            this.updateStorageEstimate();
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
                this.scheduleDefectDraftSave();
                this.updateStorageEstimate();
            };
        };
    },

    removePhoto(index) {
        this.currentPhotos.splice(index, 1);
        this.renderPhotoPreview();
        this.scheduleDefectDraftSave();
        this.updateStorageEstimate();
    },

    renderPhotoPreview() {
        const container = document.getElementById('photoPreviewContainer');
        if (this.currentPhotos.length === 0) {
            container.innerHTML = '';
            this.updatePhotoCollapsedState();
            this.updateFormProgress();
            return;
        }

        container.innerHTML = this.currentPhotos.map((photo, i) => `
            <div class="photo-thumb">
                <img src="${photo}" alt="Photo ${i + 1}">
                <button class="remove-photo" onclick="event.stopPropagation(); app.removePhoto(${i})">&#10005;</button>
            </div>
        `).join('');

        this.updatePhotoCollapsedState();
        this.updateFormProgress();
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
        this.clearDescSearch();
        this.clearRemarkSearch();
        this.updateFormProgress();
        this.scheduleDefectDraftSave();

        if (categories.length > 0 && !this.editingDefectId) {
            setTimeout(() => this.scrollToDescription(), 100);
        }
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
        this.scheduleDefectDraftSave();
    },

    searchDescSuggestions() {
        const input = document.getElementById('descSearch');
        const resultsEl = document.getElementById('descSearchResults');
        const clearBtn = document.getElementById('descSearchClear');
        const query = (input.value || '').trim();

        clearBtn.style.display = query ? 'flex' : 'none';

        if (!query) {
            resultsEl.style.display = 'none';
            resultsEl.innerHTML = '';
            return;
        }

        const categories = this.getSelectedCategories();
        const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
        if (tokens.length === 0) {
            resultsEl.style.display = 'none';
            resultsEl.innerHTML = '';
            return;
        }

        const pool = [];
        const seen = new Set();
        const addFromCategory = (cat) => {
            (DEFECT_DESCRIPTIONS[cat] || []).forEach(desc => {
                if (!seen.has(desc)) {
                    seen.add(desc);
                    pool.push({ category: cat, description: desc });
                }
            });
        };
        if (categories.length > 0) {
            categories.forEach(addFromCategory);
        } else {
            Object.keys(DEFECT_DESCRIPTIONS).forEach(addFromCategory);
        }

        const scored = pool.map(item => {
            const lower = item.description.toLowerCase();
            let score = 0;
            let allMatch = true;
            tokens.forEach(tok => {
                const idx = lower.indexOf(tok);
                if (idx === -1) {
                    allMatch = false;
                } else {
                    score += 10;
                    if (idx === 0 || /\W/.test(lower.charAt(idx - 1))) score += 3;
                    score += Math.max(0, 5 - Math.floor(idx / 10));
                }
            });
            return { ...item, score, allMatch };
        }).filter(item => item.allMatch)
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);

        if (scored.length === 0) {
            resultsEl.innerHTML = '<div class="desc-search-empty">No matching descriptions. Try different keywords.</div>';
            resultsEl.style.display = 'block';
            return;
        }

        const showCategory = categories.length !== 1;
        resultsEl.innerHTML = scored.map(item => {
            const highlighted = this.highlightTokens(item.description, tokens);
            const catLabel = showCategory ? `<span class="desc-search-result-category">${this.escapeHtml(item.category)}</span>` : '';
            return `<div class="desc-search-result" data-desc="${this.escapeHtml(item.description)}" onclick="app.applyDescSearchResult(this)">${catLabel}${highlighted}</div>`;
        }).join('');
        resultsEl.style.display = 'block';
    },

    highlightTokens(text, tokens) {
        const escaped = this.escapeHtml(text);
        const uniqueTokens = [...new Set(tokens)].filter(Boolean);
        if (uniqueTokens.length === 0) return escaped;
        const pattern = uniqueTokens
            .map(tok => tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .sort((a, b) => b.length - a.length)
            .join('|');
        const regex = new RegExp(`(${pattern})`, 'gi');
        return escaped.replace(regex, '<mark>$1</mark>');
    },

    applyDescSearchResult(el) {
        const selected = el.getAttribute('data-desc');
        if (!selected) return;
        const descriptionEl = document.getElementById('description');
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

        this.clearDescSearch();
        descriptionEl.focus();
        this.refreshRemarksSuggestions();
        this.scheduleDefectDraftSave();
    },

    clearDescSearch() {
        const input = document.getElementById('descSearch');
        const resultsEl = document.getElementById('descSearchResults');
        const clearBtn = document.getElementById('descSearchClear');
        if (input) input.value = '';
        if (resultsEl) {
            resultsEl.innerHTML = '';
            resultsEl.style.display = 'none';
        }
        if (clearBtn) clearBtn.style.display = 'none';
    },

    searchRemarkSuggestions() {
        const input = document.getElementById('remarksSearch');
        const resultsEl = document.getElementById('remarksSearchResults');
        const clearBtn = document.getElementById('remarksSearchClear');
        const query = (input.value || '').trim();

        clearBtn.style.display = query ? 'flex' : 'none';

        if (!query) {
            resultsEl.style.display = 'none';
            resultsEl.innerHTML = '';
            return;
        }

        const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
        if (tokens.length === 0) {
            resultsEl.style.display = 'none';
            resultsEl.innerHTML = '';
            return;
        }

        const categories = this.getSelectedCategories();
        const description = document.getElementById('description').value;
        const pool = getRectificationRemarkSuggestions(categories, description);

        const scored = pool.map(text => {
            const lower = text.toLowerCase();
            let score = 0;
            let allMatch = true;
            tokens.forEach(tok => {
                const idx = lower.indexOf(tok);
                if (idx === -1) {
                    allMatch = false;
                } else {
                    score += 10;
                    if (idx === 0 || /\W/.test(lower.charAt(idx - 1))) score += 3;
                    score += Math.max(0, 5 - Math.floor(idx / 10));
                }
            });
            return { text, score, allMatch };
        }).filter(item => item.allMatch)
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);

        if (scored.length === 0) {
            resultsEl.innerHTML = '<div class="desc-search-empty">No matching remarks. Try different keywords.</div>';
            resultsEl.style.display = 'block';
            return;
        }

        resultsEl.innerHTML = scored.map(item => {
            const highlighted = this.highlightTokens(item.text, tokens);
            return `<div class="desc-search-result" data-desc="${this.escapeHtml(item.text)}" onclick="app.applyRemarkSearchResult(this)">${highlighted}</div>`;
        }).join('');
        resultsEl.style.display = 'block';
    },

    applyRemarkSearchResult(el) {
        const selected = el.getAttribute('data-desc');
        if (!selected) return;
        const remarksEl = document.getElementById('remarks');
        const existingLines = remarksEl.value
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean);

        if (!existingLines.includes(selected)) {
            existingLines.push(selected);
            remarksEl.value = existingLines.join('\n');
        } else {
            this.showToast('That remark is already added', 'info');
        }

        this.clearRemarkSearch();
        remarksEl.focus();
        this.scheduleDefectDraftSave();
    },

    clearRemarkSearch() {
        const input = document.getElementById('remarksSearch');
        const resultsEl = document.getElementById('remarksSearchResults');
        const clearBtn = document.getElementById('remarksSearchClear');
        if (input) input.value = '';
        if (resultsEl) {
            resultsEl.innerHTML = '';
            resultsEl.style.display = 'none';
        }
        if (clearBtn) clearBtn.style.display = 'none';
    },

    updateFormProgress() {
        const progressEl = document.getElementById('formProgress');
        if (!progressEl) return;
        const checks = {
            photos: (this.currentPhotos || []).length > 0,
            category: this.getSelectedCategories().length > 0,
            severity: !!document.querySelector('input[name="severity"]:checked'),
            description: (document.getElementById('description').value || '').trim().length > 0
        };
        progressEl.querySelectorAll('.form-progress-item').forEach(item => {
            const key = item.getAttribute('data-progress');
            item.classList.toggle('done', !!checks[key]);
        });
    },

    updatePhotoCollapsedState() {
        const wrap = document.getElementById('photoActionsWrap');
        if (!wrap) return;
        if ((this.currentPhotos || []).length > 0) {
            wrap.classList.add('collapsed');
        } else {
            wrap.classList.remove('collapsed');
        }
    },

    expandPhotoActions() {
        const wrap = document.getElementById('photoActionsWrap');
        if (wrap) wrap.classList.remove('collapsed');
    },

    scrollToDescription() {
        const descField = document.getElementById('description');
        if (!descField) return;
        const descGroup = descField.closest('.form-group') || descField;
        descGroup.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        this.scheduleDefectDraftSave();
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
    },

    formatBytes(bytes) {
        if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
        const units = ['B', 'KB', 'MB', 'GB'];
        let value = bytes;
        let unitIndex = 0;

        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex += 1;
        }

        const decimals = value >= 10 || unitIndex === 0 ? 0 : 1;
        return `${value.toFixed(decimals)} ${units[unitIndex]}`;
    },

    getStorageErrorMessage(error) {
        const message = String(error?.message || error || '').toLowerCase();

        if (message.includes('blocked')) {
            return 'Storage update is blocked. Close other app tabs and reopen.';
        }
        if (message.includes('quota') || message.includes('storage') || message.includes('full')) {
            return 'Phone storage is full or unavailable. Export/delete old data, then try again.';
        }
        if (message.includes('database') || message.includes('indexeddb')) {
            return 'Local database is unavailable. Reopen the app and try again.';
        }

        return 'Could not save inspection. Reopen the app and try again.';
    }
};

// Boot
document.addEventListener('DOMContentLoaded', () => app.init());

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(error => {
            console.warn('Service worker registration failed:', error);
        });
    });
}
