'use client';

import { useState, useEffect } from 'react';
import styles from '../app/tenders/tenders.module.css'; // Adjust path
import { getTenders, saveTender, deleteTender } from '@/lib/tenderService';

import * as XLSX from 'xlsx';

export default function Tenders() {
    const [tenders, setTenders] = useState([]);
    const [form, setForm] = useState({
        name: '', // ID/Name
        origin: '',
        destination: '',
        weight: '',
        price: '', // Our Price
        date: '',
        status: 'Lost',
        carrierPrice: '', // Was winningPrice, now Price of Carrier (Cost/Market)
        transportType: '',
        capacity: '', // Was cargoType, now Pallets/Cubes
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
        if (!form.name || !form.price) return;

        saveTender(form);
        setTenders(getTenders());
        setForm({
            name: '', origin: '', destination: '', weight: '', price: '',
            date: '', status: 'Lost', carrierPrice: '',
            transportType: '', capacity: '', comment: ''
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

            // Mapping: Name, Origin, Destination, Weight, Price, Status, CarrierPrice, Date, Transport, Capacity, Comment
            const newTenders = [];
            // Skip header row 0
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length === 0) continue;

                // Flexible mapping - try to grab visible columns
                const tender = {
                    name: row[0] || 'Imported ' + i,
                    origin: row[1] || '',
                    destination: row[2] || '',
                    weight: row[3] || '',
                    price: row[4] || '',
                    status: (row[5] && row[5].toLowerCase().includes('won')) ? 'Won' : 'Lost', // Very simple heuristic
                    carrierPrice: row[6] || '',
                    date: row[7] || new Date().toISOString().split('T')[0],
                    transportType: row[8] || '',
                    capacity: row[9] || '', // Pallets/Cubes
                    comment: row[10] || ''
                };

                if (tender.price) { // Minimal validation
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
                        {/* ID */}
                        <input name="name" placeholder="ID тендера" value={form.name} onChange={handleChange} required />

                        <input name="origin" placeholder="Откуда" value={form.origin} onChange={handleChange} />
                        <input name="destination" placeholder="Куда" value={form.destination} onChange={handleChange} />

                        <input name="transportType" placeholder="Тип транспортного средства" value={form.transportType} onChange={handleChange} />
                        <input name="weight" type="number" placeholder="Вес (кг)" value={form.weight} onChange={handleChange} />
                        <input name="capacity" placeholder="Палеты / Кубы / Места" value={form.capacity} onChange={handleChange} />

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
                                    <th>ID</th>
                                    <th>Маршрут</th>
                                    <th>Тип ТС / Груз</th>
                                    <th>Ставки</th>
                                    <th>Статус</th>
                                    <th>Действие</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenders.map(t => (
                                    <tr key={t.id}>
                                        <td>
                                            <strong>{t.name}</strong><br />
                                            <span style={{ fontSize: '0.8rem', color: '#666' }}>{t.date}</span>
                                        </td>
                                        <td>
                                            {t.origin} &rarr; {t.destination}<br />
                                        </td>
                                        <td style={{ fontSize: '0.9rem' }}>
                                            {t.transportType && <div>🚛 {t.transportType}</div>}
                                            {t.weight && <div>⚖️ {t.weight} кг</div>}
                                            {t.capacity && <div>📦 {t.capacity}</div>}
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
