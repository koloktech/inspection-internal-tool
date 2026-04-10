/**
 * IndexedDB wrapper for persistent inspection data storage.
 * Stores inspections and defects locally so data survives page refresh.
 */
const DB = {
    DB_NAME: 'MeemInspectionDB',
    DB_VERSION: 1,
    db: null,

    async init() {
        return new Promise((resolve, reject) => {
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
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };

            request.onerror = (e) => reject(e.target.error);
        });
    },

    // --- Inspections ---
    async saveInspection(inspection) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('inspections', 'readwrite');
            const store = tx.objectStore('inspections');
            const request = store.put(inspection);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getInspection(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('inspections', 'readonly');
            const store = tx.objectStore('inspections');
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getAllInspections() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('inspections', 'readonly');
            const store = tx.objectStore('inspections');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async deleteInspection(id) {
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
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('defects', 'readwrite');
            const store = tx.objectStore('defects');
            const request = store.put(defect);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getDefect(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('defects', 'readonly');
            const store = tx.objectStore('defects');
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getDefectsByInspection(inspectionId) {
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
        const tx = this.db.transaction('defects', 'readwrite');
        const store = tx.objectStore('defects');
        for (const defect of defects) {
            store.delete(defect.id);
        }
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }
};
