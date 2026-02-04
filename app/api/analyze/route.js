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
        const body = await request.json();
        const { tenders } = body;

        let userMessage = '';
        let messages = [];

        // Handle both 'message' (string) and 'messages' (array) inputs
        if (body.messages && Array.isArray(body.messages) && body.messages.length > 0) {
            messages = body.messages;
            userMessage = messages[messages.length - 1].content || '';
        } else if (body.message) {
            userMessage = body.message;
            messages = [{ role: 'user', content: userMessage }];
        } else {
            return NextResponse.json({ error: 'No message provided' }, { status: 400 });
        }

        userMessage = userMessage.toLowerCase();

        // Context Optimization Strategy:
        // 1. Filter by keywords in user message (if cities mentioned)
        // 2. Always include recent tenders
        // 3. Hard limit total count to avoid Token Limit (130k tokens)

        let relevantTenders = tenders || [];

        // Simple keyword based RAG
        const keywords = userMessage.split(/[\s,.-]+/).filter(w => w.length > 3);
        const matchedTenders = tenders.filter(t =>
            keywords.some(k =>
                (t.origin && t.origin.toLowerCase().includes(k)) ||
                (t.destination && t.destination.toLowerCase().includes(k)) ||
                (t.comment && t.comment.toLowerCase().includes(k))
            )
        );

        if (matchedTenders.length > 50) {
            // If we found specific matches, prioritize them!
            relevantTenders = matchedTenders;
        } else {
            // Otherwise, just take the most recent ones
            relevantTenders = tenders;
        }

        // Hard Limit to 400 items (~10k-20k tokens safe range)
        // DeepSeek context is 128k, but let's be safe and snappy.
        if (relevantTenders.length > 400) {
            relevantTenders = relevantTenders.slice(0, 400);
        }

        const hasData = relevantTenders.length > 0;

        let systemPrompt = `Ты ИИ-помощник по анализу тендеров. 
    Твоя цель - помочь пользователю выигрывать тендеры, анализируя прошлые данные.
    
    ${hasData
                ? `Вот исторические данные по тендерам (JSON, последние или релевантные ${relevantTenders.length} шт): 
           - 'name' (ID тендера)
           - 'origin', 'destination' (Маршрут)
           - 'transportType' (Тип авто)
           - 'pallets', 'cubes', 'places' (Груз)
           - 'weight' (Вес)
           - 'price' (Наша ставка)
           - 'carrierPrice' (Цена перевозчика/Индикатив)
           - 'status' (Won/Lost)
           
           Данные:
           ${JSON.stringify(relevantTenders, null, 2)}`
                : `У тебя пока НЕТ данных для этого запроса. Ответь: "Недостаточно данных для анализа этого направления."`
            }
    
    Сценарий:
    1. Если найдены похожие маршруты — скажи среднюю выигрышную цену (carrierPrice) и нашу цену.
    2. Дай рекомендацию по цене.
    3. Будь краток.`;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                ...messages
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
