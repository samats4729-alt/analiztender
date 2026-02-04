// Simple local storage wrapper for tenders
const STORAGE_KEY = 'tenders_data';

export const getTenders = () => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

export const saveTender = (tender) => {
    const tenders = getTenders();
    tenders.push({ ...tender, id: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tenders));
};

export const updateTender = (updatedTender) => {
    const tenders = getTenders();
    const index = tenders.findIndex(t => t.id === updatedTender.id);
    if (index !== -1) {
        tenders[index] = updatedTender;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tenders));
    }
}

export const deleteTender = (id) => {
    const tenders = getTenders();
    const filtered = tenders.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
