/**
 * IndexedDB wrapper for persistent inspection data storage.
 * Stores inspections and defects locally so data survives page refresh.
 */
const DB = {
    DB_NAME: 'MeemInspectionDB',
    DB_VERSION: 2,
    db: null,
    initPromise: null,

    async init() {
        if (this.db) return this.db;
        if (this.initPromise) return this.initPromise;

        if (!window.indexedDB) {
            throw new Error('Local browser database is not available.');
        }

        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;

                if (!db.objectStoreNames.contains('inspections')) {
                    const inspStore = db.createObjectStore('inspections', { keyPath: 'id', autoIncrement: true });
                    inspStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                if (!db.objectStoreNames.contains('defects')) {
                    const defStore = db.createObjectStore('defects', { keyPath: 'id', autoIncrement: true });
                    defStore.createIndex('inspectionId', 'inspectionId', { unique: false });
                    defStore.createIndex('area', 'area', { unique: false });
                }

                if (!db.objectStoreNames.contains('drafts')) {
                    db.createObjectStore('drafts', { keyPath: 'id' });
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                this.db.onversionchange = () => {
                    this.db.close();
                    this.db = null;
                    this.initPromise = null;
                };
                resolve(this.db);
            };

            request.onerror = (e) => {
                this.initPromise = null;
                reject(e.target.error);
            };

            request.onblocked = () => {
                this.initPromise = null;
                reject(new Error('Local database update is blocked. Close other app tabs and reopen.'));
            };
        });

        return this.initPromise;
    },

    async ensureReady() {
        if (!this.db) {
            await this.init();
        }
        return this.db;
    },

    // --- Inspections ---
    async saveInspection(inspection) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('inspections', 'readwrite');
            const store = tx.objectStore('inspections');
            const request = store.put(inspection);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getInspection(id) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('inspections', 'readonly');
            const store = tx.objectStore('inspections');
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getAllInspections() {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('inspections', 'readonly');
            const store = tx.objectStore('inspections');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async deleteInspection(id) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('inspections', 'readwrite');
            const store = tx.objectStore('inspections');
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    // --- Defects ---
    async saveDefect(defect) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('defects', 'readwrite');
            const store = tx.objectStore('defects');
            const request = store.put(defect);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getDefect(id) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('defects', 'readonly');
            const store = tx.objectStore('defects');
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getDefectsByInspection(inspectionId) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('defects', 'readonly');
            const store = tx.objectStore('defects');
            const index = store.index('inspectionId');
            const request = index.getAll(inspectionId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async deleteDefect(id) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('defects', 'readwrite');
            const store = tx.objectStore('defects');
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async deleteDefectsByInspection(inspectionId) {
        const defects = await this.getDefectsByInspection(inspectionId);
        await this.ensureReady();
        const tx = this.db.transaction('defects', 'readwrite');
        const store = tx.objectStore('defects');
        for (const defect of defects) {
            store.delete(defect.id);
        }
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    // --- Drafts ---
    async saveDraft(id, data) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('drafts', 'readwrite');
            const store = tx.objectStore('drafts');
            const request = store.put({ id, data, updatedAt: new Date().toISOString() });
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getDraft(id) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('drafts', 'readonly');
            const store = tx.objectStore('drafts');
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result?.data || null);
            request.onerror = () => reject(request.error);
        });
    },

    async deleteDraft(id) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('drafts', 'readwrite');
            const store = tx.objectStore('drafts');
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
};
