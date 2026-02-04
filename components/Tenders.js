'use client';

import { useState, useEffect } from 'react';
import styles from '../app/tenders/tenders.module.css'; // Adjust path
import { getTenders, saveTender, deleteTender } from '@/lib/tenderService';

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

            const newTenders = [];
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;

                const tender = {
                    name: row[0] || `Imported ${i}`, // Keep import name if available, else auto
                    origin: row[1] || '',
                    destination: row[2] || '',
                    weight: row[3] || '',
                    price: row[4] || '',
                    status: (row[5] && row[5].toLowerCase().includes('won')) ? 'Won' : 'Lost',
                    carrierPrice: row[6] || '',
                    date: row[7] || new Date().toISOString().split('T')[0],
                    transportType: row[8] || '',
                    pallets: row[9] || '', // Map column 9 to pallets
                    cubes: row[10] || '', // Map column 10 to cubes
                    places: row[11] || '', // Map column 11 to places
                    comment: row[12] || '' // Shifted
                };

                if (tender.price) {
                    saveTender(tender);
                }
            }
            setTenders(getTenders());
            alert(`Импортировано строк: ${data.length - 1}`);
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Данные тендеров</h1>
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

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input name="pallets" placeholder="Паллеты" value={form.pallets} onChange={handleChange} style={{ flex: 1 }} />
                            <input name="cubes" placeholder="Кубы" value={form.cubes} onChange={handleChange} style={{ flex: 1 }} />
                            <input name="places" placeholder="Места" value={form.places} onChange={handleChange} style={{ flex: 1 }} />
                        </div>

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
                    <h2>История</h2>
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
