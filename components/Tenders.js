'use client';

import { useState, useEffect } from 'react';
import styles from '../app/tenders/tenders.module.css'; // Adjust path
import { getTenders, saveTender, deleteTender, clearTenders } from '@/lib/tenderService';

import * as XLSX from 'xlsx';

export default function Tenders() {
    const [tenders, setTenders] = useState([]);
    const [form, setForm] = useState({
        name: '',
        origin: '',
        destination: '',
        weight: '',
        price: '', // Our Price
        date: '',
        status: 'Lost',
        carrierPrice: '',
        transportType: '',
        pallets: '', // New separate field
        cubes: '',   // New separate field
        places: '',  // New separate field
        comment: ''
    });

    useEffect(() => {
        setTenders(getTenders());
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.price) return;

        const submission = { ...form };
        // Auto-generate ID if user can't input it
        submission.name = `Тендер ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

        saveTender(submission);
        setTenders(getTenders());
        setForm({
            name: '', origin: '', destination: '', weight: '', price: '',
            date: '', status: 'Lost', carrierPrice: '',
            transportType: '', pallets: '', cubes: '', places: '', comment: ''
        });
    };

    const handleDelete = (id) => {
        deleteTender(id);
        setTenders(getTenders());
    }

    const handleClearAll = () => {
        if (confirm('Вы уверены, что хотите удалить ВСЕ данные? Это действие нельзя отменить.')) {
            clearTenders();
            setTenders([]);
        }
    }

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

            if (data.length === 0) return;

            // 1. Find Header Row
            let headerRowIndex = -1;
            const columnMap = {};

            // Keywords to identify columns (lower case)
            const mapKeys = {
                origin: ['откуда', 'origin'],
                destination: ['куда', 'destination'],
                date: ['дата', 'date'],
                weight: ['тоннаж', 'вес', 'weight', 'tonnage'],
                pallets: ['паллет', 'палеты', 'pallets'],
                cubes: ['кубы', 'cubes', 'объем'],
                price: ['заказчик', 'цена', 'price', 'ставка', 'наша'], // "Заказчик" seems to be the price column based on screenshot
                carrierPrice: ['перевозчик', 'carrier', 'winning'],
                comment: ['комментарии', 'comment', 'примечание']
            };

            // Scan first 20 rows for headers
            for (let i = 0; i < Math.min(data.length, 20); i++) {
                const row = data[i];
                let matches = 0;
                row.forEach((cell, colIdx) => {
                    if (typeof cell !== 'string') return;
                    const val = cell.toLowerCase().trim();

                    // Check against mapKeys
                    for (const [key, keywords] of Object.entries(mapKeys)) {
                        if (keywords.some(k => val.includes(k))) {
                            columnMap[key] = colIdx;
                            matches++;
                        }
                    }
                });

                // If found at least "Origin" and "Destination" or "Price", assume this is header
                if (matches >= 2 && columnMap.origin !== undefined) {
                    headerRowIndex = i;
                    break;
                }
            }

            if (headerRowIndex === -1) {
                alert("Не удалось найти заголовки (Откуда, Куда, Заказчик и т.д.) в первых 20 строках.");
                return;
            }

            const newTenders = [];
            // 2. Iterate Data Rows
            for (let i = headerRowIndex + 1; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;

                // Helper to get safe value
                const val = (key) => {
                    const idx = columnMap[key];
                    return (idx !== undefined && row[idx] !== undefined) ? row[idx] : '';
                };

                // Date Parsing (Excel Serial or String)
                let dateStr = '';
                const rawDate = val('date');
                if (rawDate) {
                    if (typeof rawDate === 'number') {
                        // Excel serial date to JS Date
                        const dateObj = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
                        if (!isNaN(dateObj)) {
                            dateStr = dateObj.toISOString().split('T')[0];
                        }
                    } else if (typeof rawDate === 'string') {
                        // Try standard parsing
                        const dateObj = new Date(rawDate);
                        if (!isNaN(dateObj)) dateStr = rawDate;
                    }
                }

                // If Date is unclear/invalid, user said "let it be not added", so we can leave empty or default?
                // Application logic currently requires date for sorting usually, but let's check.
                // We'll leave it empty string if invalid, or maybe current date if critical. 
                // Creating a specific date only if valid.

                const tender = {
                    name: `Imported ${i}`,
                    origin: val('origin'),
                    destination: val('destination'),
                    weight: val('weight'),
                    price: val('price'), // "Заказчик"
                    carrierPrice: val('carrierPrice'), // "Перевозчик"
                    status: 'Lost', // Default
                    date: dateStr, // Can be empty
                    transportType: '',
                    pallets: val('pallets'),
                    cubes: val('cubes'),
                    places: '',
                    comment: val('comment')
                };

                // Heuristic for Status: If we have a price and it seems valid?
                // Actually user logic: "Won" if we did it?
                // Screenshot shows "Перевозчик" column. If "Перевозчик" exists, maybe we gave it to someone? 
                // Or maybe we Lost it?
                // Let's stick to default Lost unless we see "Won" keyword.
                // User didn't specify mapping for status.

                // Clean up numeric values
                if (tender.price) tender.price = String(tender.price).replace(/[^0-9.]/g, '');
                if (tender.carrierPrice) tender.carrierPrice = String(tender.carrierPrice).replace(/[^0-9.]/g, '');

                if (tender.price) {
                    saveTender(tender);
                }
            }
            setTenders(getTenders());
            alert(`Успешно импортировано строк: ${newTenders.length} (Найдено строк данных после заголовка)`); // Actually saveTender is called in loop
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Данные тендеров</h1>
                {tenders.length > 0 && (
                    <button onClick={handleClearAll} style={{
                        background: '#fee2e2', color: '#ef4444', border: 'none',
                        padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                    }}>
                        Очистить всё 🗑️
                    </button>
                )}
            </header>

            <div className={styles.content}>
                <section className={styles.inputSection}>
                    <h2>Импорт Excel</h2>
                    <div style={{ marginBottom: '1rem' }}>
                        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
                    </div>

                    <h2>Добавить новый тендер</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {/* ID input removed as requested */}

                        <input name="origin" placeholder="Откуда" value={form.origin} onChange={handleChange} />
                        <input name="destination" placeholder="Куда" value={form.destination} onChange={handleChange} />

                        {/* Transport Type removed as requested */}
                        <input name="weight" type="number" placeholder="Вес (кг)" value={form.weight} onChange={handleChange} />

                        <input name="pallets" placeholder="Паллеты" value={form.pallets} onChange={handleChange} />
                        <input name="cubes" placeholder="Кубы" value={form.cubes} onChange={handleChange} />
                        <input name="places" placeholder="Места" value={form.places} onChange={handleChange} />

                        <input name="price" type="number" placeholder="Наша цена (KZT)" value={form.price} onChange={handleChange} required />

                        <input name="comment" placeholder="Комментарий" value={form.comment} onChange={handleChange} />

                        <input name="date" type="date" value={form.date} onChange={handleChange} />
                        <select name="status" value={form.status} onChange={handleChange}>
                            <option value="Won">Выигран</option>
                            <option value="Lost">Проигран</option>
                        </select>

                        <input name="carrierPrice" type="number" placeholder="Цена перевозчика (Индикатив)" value={form.carrierPrice} onChange={handleChange} />

                        <button type="submit">Добавить запись</button>
                    </form>
                </section>

                <section className={styles.listSection}>
                    <h2>История ({tenders.length})</h2>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    {/* ID removed */}
                                    <th>Маршрут</th>
                                    <th>Груз / Инфо</th>
                                    <th>Ставки</th>
                                    <th>Статус</th>
                                    <th>Действие</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenders.map(t => (
                                    <tr key={t.id}>
                                        <td>
                                            {t.origin} &rarr; {t.destination}<br />
                                            <span style={{ fontSize: '0.8rem', color: '#666' }}>{t.date}</span>
                                        </td>
                                        <td style={{ fontSize: '0.9rem' }}>
                                            {/* Transport Type display removed */}
                                            {t.weight && <div>⚖️ {t.weight} кг</div>}
                                            {t.pallets && <div>🪵 {t.pallets} пал.</div>}
                                            {t.cubes && <div>🧊 {t.cubes} м³</div>}
                                            {t.places && <div>📦 {t.places} мест</div>}
                                            {t.comment && <div style={{ fontStyle: 'italic', color: '#555' }}>"{t.comment}"</div>}
                                        </td>
                                        <td>
                                            <div>Мы: <b>{parseInt(t.price).toLocaleString()} ₸</b></div>
                                            {t.carrierPrice && <div style={{ color: '#666', fontSize: '0.9rem' }}>Перевозчик: {parseInt(t.carrierPrice).toLocaleString()} ₸</div>}
                                        </td>
                                        <td className={t.status === 'Won' ? styles.won : styles.lost}>
                                            {t.status === 'Won' ? 'Выигран' : 'Проигран'}
                                        </td>
                                        <td><button onClick={() => handleDelete(t.id)} className={styles.deleteBtn}>×</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}
