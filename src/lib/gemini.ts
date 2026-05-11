import { GoogleGenAI, Type } from '@google/genai';

// Initialize the Gemini client using the environment variable injected by the system
const getAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set. Please add it in Settings > Secrets.");
    }
    return new GoogleGenAI({ apiKey });
};

export async function extractShoeLabel(base64Image: string) {
    const ai = getAI();
    // Strip headers if present from base64 string
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash', // More stable quota on free tier
        contents: [
            {
                role: 'user',
                parts: [
                    { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
                    { text: 'Extract shoe label info. UK SIZE is the priority focus. Find numbers/letters next to UK/U.K./GB. Also get Brand, Model (shoeName), SKU, Color. Return JSON.' }
                ]
            }
        ],
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    shoeName: { type: Type.STRING },
                    brand: { type: Type.STRING },
                    euSize: { type: Type.STRING },
                    usSize: { type: Type.STRING },
                    ukSize: { type: Type.STRING, description: "Extract values next to UK labels" },
                    color: { type: Type.STRING },
                    sku: { type: Type.STRING },
                    quantity: { type: Type.STRING },
                },
                required: ["ukSize"]
            }
        }
    });

    try {
        if (!response.text) {
            throw new Error("AI returned an empty response.");
        }
        console.log("Raw AI response:", response.text);
        return JSON.parse(response.text);
    } catch (e) {
        console.error("Parse error:", e);
        throw new Error("The AI failed to format the brand/size data correctly. Please retry or enter manually.");
    }
}
