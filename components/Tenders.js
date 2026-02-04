'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import styles from '../app/tenders/tenders.module.css';
import { clearTenders } from '../lib/tenderService';

export default function Tenders() {
    const [tenders, setTenders] = useState([]);

    // Form State
    const [form, setForm] = useState({
        name: '',
        origin: '',
        destination: '',
        weight: '',
        price: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Lost',
        carrierPrice: '',
        pallets: '',
        cubes: '',
        places: '',
        comment: ''
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Load Data
    useEffect(() => {
        const stored = localStorage.getItem('tenders_data');
        if (stored) setTenders(JSON.parse(stored));
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newTender = {
            ...form,
            id: Date.now(),
            name: `T-${Math.floor(Math.random() * 10000)}` // Auto-generate ID if not needed
        };
        const updated = [newTender, ...tenders];
        setTenders(updated);
        localStorage.setItem('tenders_data', JSON.stringify(updated));

        // Reset non-fixed fields
        setForm(prev => ({
            ...prev,
            origin: '', destination: '', weight: '', price: '',
            carrierPrice: '', pallets: '', cubes: '', places: '', comment: ''
        }));
    };

    const handleDelete = (id) => {
        const updated = tenders.filter(t => t.id !== id);
        setTenders(updated);
        localStorage.setItem('tenders_data', JSON.stringify(updated));
    };

    const handleClearAll = () => {
        if (confirm('Вы уверены? Это удалит ВСЕ данные о тендерах безвозвратно.')) {
            clearTenders();
            setTenders([]);
        }
    };

    // Excel Import Logic (Preserved)
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

            // ... (Keeping exact same parsing logic as before for reliability) ...
            if (data.length < 2) return;

            // 1. Detect Header Row
            let headerRowIndex = -1;
            for (let i = 0; i < Math.min(10, data.length); i++) {
                const rowStr = data[i].join(' ').toLowerCase();
                if (rowStr.includes('откуда') || rowStr.includes('куда') || rowStr.includes('дата')) {
                    headerRowIndex = i;
                    break;
                }
            }

            if (headerRowIndex === -1) {
                alert('Не удалось найти заголовки (Откуда, Куда, Дата) в первых 10 строках.');
                return;
            }

            const headers = data[headerRowIndex].map(h => String(h).toLowerCase().trim());

            // Map Columns
            const colMap = {};
            headers.forEach((h, index) => {
                if (h.includes('откуда')) colMap.origin = index;
                else if (h.includes('куда')) colMap.destination = index;
                else if (h.includes('дата')) colMap.date = index;
                else if (h.includes('вес')) colMap.weight = index;
                else if (h.includes('паллет')) colMap.pallets = index;
                else if (h.includes('куб') || h.includes('м3')) colMap.cubes = index;
                else if (h.includes('заказчик') || h.includes('цена') || h.includes('ставка')) colMap.price = index;
                else if (h.includes('перевозчик') || h.includes('индикатив')) colMap.carrierPrice = index;
                else if (h.includes('коммент') || h.includes('примеч')) colMap.comment = index;
            });

            const newTenders = [];
            for (let i = headerRowIndex + 1; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;

                // Date Parsing
                let dateVal = colMap.date !== undefined ? row[colMap.date] : '';
                let formattedDate = '';
                if (typeof dateVal === 'number') {
                    const jsDate = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
                    formattedDate = jsDate.toISOString().split('T')[0];
                } else if (typeof dateVal === 'string') {
                    // Try to parse rudimentary string dates if needed, or leave as is
                    formattedDate = dateVal;
                }

                const tender = {
                    id: Date.now() + i,
                    origin: colMap.origin !== undefined ? (row[colMap.origin] || '') : '',
                    destination: colMap.destination !== undefined ? (row[colMap.destination] || '') : '',
                    date: formattedDate,
                    weight: colMap.weight !== undefined ? (row[colMap.weight] || '') : '',
                    price: colMap.price !== undefined ? String(row[colMap.price]).replace(/[^0-9]/g, '') : '',
                    carrierPrice: colMap.carrierPrice !== undefined ? String(row[colMap.carrierPrice]).replace(/[^0-9]/g, '') : '',
                    comment: colMap.comment !== undefined ? (row[colMap.comment] || '') : '',
                    pallets: colMap.pallets !== undefined ? (row[colMap.pallets] || '') : '',
                    cubes: colMap.cubes !== undefined ? (row[colMap.cubes] || '') : '',
                    status: 'Lost' // Default
                };

                // Basic validation: must have route or price
                if (tender.origin || tender.price) {
                    newTenders.push(tender);
                }
            }

            const updated = [...newTenders, ...tenders];
            setTenders(updated);
            localStorage.setItem('tenders_data', JSON.stringify(updated));
            alert(`Загружено ${newTenders.length} записей!`);
        };
        reader.readAsBinaryString(file);
    };

    // Calculate Slice
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTenders = tenders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(tenders.length / itemsPerPage);

    const handleNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const handlePrev = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    return (
        <div className={styles.container}>
            {/* Action Bar */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Новая запись</h2>
                    {tenders.length > 0 && (
                        <button onClick={handleClearAll} className={styles.clearBtn}>
                            Очистить всё 🗑️
                        </button>
                    )}
                </div>

                <div className={styles.sectionContent}>
                    {/* Add Form */}
                    <form onSubmit={handleSubmit} className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Откуда</label>
                            <input className={styles.input} name="origin" placeholder="Город..." value={form.origin} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Куда</label>
                            <input className={styles.input} name="destination" placeholder="Город..." value={form.destination} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Вес (кг)</label>
                            <input className={styles.input} name="weight" type="number" placeholder="20000" value={form.weight} onChange={handleChange} />
                        </div>

                        {/* Cargo Params */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Паллеты</label>
                            <input className={styles.input} name="pallets" placeholder="33..." value={form.pallets} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Кубы (м³)</label>
                            <input className={styles.input} name="cubes" placeholder="82..." value={form.cubes} onChange={handleChange} />
                        </div>

                        {/* Prices */}
                        <div className={styles.formGroup}>
                            <label className={styles.label} style={{ color: '#4f46e5' }}>Наша Ставка (₸)</label>
                            <input className={styles.input} name="price" type="number" placeholder="500000" value={form.price} onChange={handleChange} required
                                style={{ borderColor: '#a5b4fc', backgroundColor: '#eef2ff' }} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Индикатив / Перевозчик (₸)</label>
                            <input className={styles.input} name="carrierPrice" type="number" placeholder="480000" value={form.carrierPrice} onChange={handleChange} />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Дата</label>
                            <input className={styles.input} name="date" type="date" value={form.date} onChange={handleChange} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Статус</label>
                            <select className={styles.select} name="status" value={form.status} onChange={handleChange}>
                                <option value="Won">Выигран</option>
                                <option value="Lost">Проигран</option>
                            </select>
                        </div>

                        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                            <label className={styles.label}>Комментарий</label>
                            <input className={styles.input} name="comment" placeholder="Детали груза..." value={form.comment} onChange={handleChange} />
                        </div>

                        <button type="submit" className={styles.submitBtn}>Добавить запись в базу</button>
                    </form>

                    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #eee' }}>
                        <label className={styles.label} style={{ display: 'block', marginBottom: '0.5rem' }}>Или загрузите Excel</label>
                        <div className={styles.uploadArea} onClick={() => document.getElementById('fileUpload').click()}>
                            <span style={{ fontSize: '2rem' }}>📂</span>
                            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>Нажмите или перетащите файл .xlsx сюда</p>
                            <input id="fileUpload" type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ display: 'none' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>История тендеров ({tenders.length})</h2>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Маршрут / Дата</th>
                                <th>Груз</th>
                                <th>Наша Цена</th>
                                <th>Рынок / Перевозчик</th>
                                <th>Статус</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentTenders.map(t => (
                                <tr key={t.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', fontWeight: '500' }}>
                                            {t.origin || '—'} <span className={styles.routeArrow}>→</span> {t.destination || '—'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>{t.date}</div>
                                        {t.comment && <div style={{ fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic', marginTop: '2px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.comment}</div>}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {t.weight && <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>⚖️ {t.weight}</span>}
                                            {t.pallets && <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>🪵 {t.pallets}</span>}
                                            {t.cubes && <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>🧊 {t.cubes}</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.priceMain}>{t.price ? parseInt(t.price).toLocaleString() : '—'} ₸</div>
                                    </td>
                                    <td>
                                        <div style={{ color: '#6b7280' }}>
                                            {t.carrierPrice ? parseInt(t.carrierPrice).toLocaleString() + ' ₸' : '—'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`${styles.badge} ${t.status === 'Won' ? styles.badgeWon : styles.badgeLost}`}>
                                            {t.status === 'Won' ? 'Выигран' : 'Проигран'}
                                        </span>
                                    </td>
                                    <td>
                                        <button onClick={() => handleDelete(t.id)} className={styles.deleteBtn} title="Удалить">×</button>
                                    </td>
                                </tr>
                            ))}
                            {currentTenders.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                                        Нет записей. Добавьте вручную или загрузите Excel.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className={styles.pagination}>
                        <button onClick={handlePrev} disabled={currentPage === 1} className={styles.pageBtn}>
                            &larr; Назад
                        </button>
                        <span className={styles.pageInfo}>Страница {currentPage} из {totalPages}</span>
                        <button onClick={handleNext} disabled={currentPage === totalPages} className={styles.pageBtn}>
                            Вперед &rarr;
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
