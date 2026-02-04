'use client';

import { useState, useEffect } from 'react';
import styles from './tenders.module.css';
import Link from 'next/link';
import { getTenders, saveTender, deleteTender } from '@/lib/tenderService';

export default function TendersPage() {
    const [tenders, setTenders] = useState([]);
    const [form, setForm] = useState({
        name: '',
        route: '',
        price: '',
        date: '',
        status: 'Lost', // Won/Lost
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
        setForm({ name: '', route: '', price: '', date: '', status: 'Lost', winningPrice: '' });
    };

    const handleDelete = (id) => {
        deleteTender(id);
        setTenders(getTenders());
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Данные тендеров</h1>
                <Link href="/" className={styles.backLink}>← Назад</Link>
            </header>

            <div className={styles.content}>
                <section className={styles.inputSection}>
                    <h2>Добавить новый тендер</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <input name="name" placeholder="Название / ID тендера" value={form.name} onChange={handleChange} required />
                        <input name="route" placeholder="Маршрут (напр. Актобе -> Хромтау)" value={form.route} onChange={handleChange} />
                        <input name="price" type="number" placeholder="Наша цена (KZT)" value={form.price} onChange={handleChange} required />
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
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Название</th>
                                <th>Маршрут</th>
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
                                    <td>{t.route}</td>
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
                </section>
            </div>
        </div>
    );
}
