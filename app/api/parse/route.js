import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request) {
    // Initialize OpenAI client with DeepSeek configuration inside handler
    const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: process.env.DEEPSEEK_API_KEY,
    });

    try {
        const { text } = await request.json();

        const systemPrompt = `You are a data extraction assistant. 
        Extract tender data from the provided text into a JSON array.
        Target keys: 
        - "name" (string - ID)
        - "origin" (string)
        - "destination" (string)
        - "weight" (number or string)
        - "transportType" (string, e.g. Tents, Ref, Tral)
        - "capacity" (string - pallets, cubes, volume)
        - "comment" (string)
        - "price" (number - our price)
        - "status" (Won/Lost)
        - "carrierPrice" (number - winning/market price)
        - "date" (YYYY-MM-DD)
        
        Rules:
        - If status is unclear, default to 'Lost'.
        - If date is missing, use today's date.
        - Return ONLY the JSON array. No markdown.
        `;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ],
            model: "deepseek-chat",
        });

        // Clean content to ensure valid JSON (sometimes models add backticks)
        let rawContent = completion.choices[0].message.content;
        rawContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsedData = JSON.parse(rawContent);

        return NextResponse.json({ tenders: parsedData });

    } catch (error) {
        console.error('Info Extraction Error:', error);
        return NextResponse.json(
            { error: 'Failed to extract data.', details: error.message },
            { status: 500 }
        );
    }
}
