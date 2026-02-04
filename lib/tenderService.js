const STORAGE_KEY = 'tenders_data';

export const getTenders = () => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

export const saveTender = (tender) => {
    const tenders = getTenders();
    // Simple ID generation if not present
    if (!tender.id) {
        tender.id = Date.now().toString();
    }
    tenders.unshift(tender); // Add to top
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tenders));
    return tenders;
};

export const deleteTender = (id) => {
    let tenders = getTenders();
    tenders = tenders.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tenders));
    return tenders;
};

export const clearTenders = () => {
    localStorage.removeItem(STORAGE_KEY);
    return [];
};
