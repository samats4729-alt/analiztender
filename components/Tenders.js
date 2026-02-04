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
        price: '',
        date: '',
        status: 'Lost',
        winningPrice: ''
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
        setForm({ name: '', origin: '', destination: '', weight: '', price: '', date: '', status: 'Lost', winningPrice: '' });
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

            // Removing header row if exists and mapping
            // Assuming simplified columns order or smart detection could be done. 
            // For MVP: assume user maps manually or standard format:
            // Name, Origin, Destination, Weight, Price, Status, WinningPrice, Date

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
                    winningPrice: row[6] || '',
                    date: row[7] || new Date().toISOString().split('T')[0]
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
                        <input name="name" placeholder="Название / ID тендера" value={form.name} onChange={handleChange} required />
                        <input name="origin" placeholder="Откуда" value={form.origin} onChange={handleChange} />
                        <input name="destination" placeholder="Куда" value={form.destination} onChange={handleChange} />
                        <input name="weight" type="number" placeholder="Вес (кг)" value={form.weight} onChange={handleChange} />
                        <input name="price" type="number" placeholder="Наша цена (KZT)" value={form.price} onChange={handleChange} required />

                        {/* New fields: Transport, Cargo, Comment */}
                        <input name="transportType" placeholder="Тип авто (Трал/Фура)" value={form.transportType} onChange={handleChange} />
                        <input name="cargoType" placeholder="Груз (Спецтехника)" value={form.cargoType} onChange={handleChange} />
                        <input name="comment" placeholder="Комментарий" value={form.comment} onChange={handleChange} />

                        <input name="date" type="date" value={form.date} onChange={handleChange} />
                        <select name="status" value={form.status} onChange={handleChange}>
                            <option value="Won">Выигран</option>
                            <option value="Lost">Проигран</option>
                        </select>
                        {form.status === 'Lost' && (
                            <input name="winningPrice" type="number" placeholder="Цена победителя (если известна)" value={form.winningPrice} onChange={handleChange} />
                        )}
                        <button type="submit">Добавить запись</button>
                    </form>
                </section>

                <section className={styles.listSection}>
                    <h2>История</h2>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Название</th>
                                    <th>Откуда</th>
                                    <th>Куда</th>
                                    <th>Вес</th>
                                    <th>Цена</th>
                                    <th>Статус</th>
                                    <th>Цена победителя</th>
                                    <th>Дата</th>
                                    <th>Действие</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenders.map(t => (
                                    <tr key={t.id}>
                                        <td>{t.name}</td>
                                        <td>{t.origin || t.route?.split('->')[0] || '-'}</td>
                                        <td>{t.destination || t.route?.split('->')[1] || '-'}</td>
                                        <td>{t.weight ? t.weight + ' кг' : '-'}</td>
                                        <td>{parseInt(t.price).toLocaleString()} ₸</td>
                                        <td className={t.status === 'Won' ? styles.won : styles.lost}>
                                            {t.status === 'Won' ? 'Выигран' : 'Проигран'}
                                        </td>
                                        <td>{t.winningPrice ? parseInt(t.winningPrice).toLocaleString() + ' ₸' : '-'}</td>
                                        <td>{t.date}</td>
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
