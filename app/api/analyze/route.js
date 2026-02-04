import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request) {
    // Initialize OpenAI client with DeepSeek configuration inside handler
    // to avoid build-time errors if env vars are missing
    const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: process.env.DEEPSEEK_API_KEY,
    });

    try {
        const { message, tenders } = await request.json();

        // Check if tenders exist
        const hasData = tenders && tenders.length > 0;

        // Construct system prompt with historical context
        let systemPrompt = `Ты ИИ-помощник по анализу тендеров. 
    Твоя цель - помочь пользователю выигрывать тендеры, анализируя прошлые данные.
    
    ${hasData
                ? `Вот исторические данные по тендерам (JSON), обрати внимание на поля: 'origin', 'destination', 'weight', 'transportType', 'cargoType', 'comment':
           ${JSON.stringify(tenders, null, 2)}`
                : `У тебя пока НЕТ исторических данных. 
           Если пользователь спрашивает про анализ или цены, ОТВЕТЬ ЕМУ: 
           "У меня пока нет данных для анализа. Пожалуйста, перейдите во вкладку 'Тендеры' и загрузите Excel-файл или вставьте текст с историей ваших поездок."
           Не выдумывай цены, если данных нет.`
            }
    
    Когда уместно (и есть данные):
    1. Сравнивай текущий запрос с похожими прошлыми тендерами (маршрут, вес, тип авто, груз).
    2. Если пользователь спрашивает цену, проверь, выигрывали мы или проигрывали похожие тендеры.
       - Если ВЫИГРЫВАЛИ: Предложи похожую цену или немного выше (с маржой).
       - Если ПРОИГРЫВАЛИ: Проверь "winningPrice" (цену победителя), если есть, и предложи цену ниже той, что мы давали.
    3. Будь кратким и профессиональным. Отвечай на русском языке. Используй Markdown для форматирования (жирный шрифт, списки).`;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            model: "deepseek-chat",
        });

        return NextResponse.json({
            content: completion.choices[0].message.content
        });

    } catch (error) {
        console.error('DeepSeek API Error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze data.' },
            { status: 500 }
        );
    }
}
