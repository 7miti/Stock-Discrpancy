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
        model: 'gemini-2.0-flash', // Fast and robust
        contents: [
            {
                role: 'user',
                parts: [
                    { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
                    { text: 'Extract shoe product information from this label. CRITICAL FOCUS: THE UK SIZE IS MANDATORY. Extract exactly what is written next to UK/U.K. or in the UK grid cell.' }
                ]
            }
        ],
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    shoeName: { type: Type.STRING, description: "Name or Model of the shoe" },
                    brand: { type: Type.STRING, description: "Brand (Nike, Adidas, Puma, etc)" },
                    euSize: { type: Type.STRING, description: "EU Shoe Size" },
                    usSize: { type: Type.STRING, description: "US Shoe Size" },
                    ukSize: { type: Type.STRING, description: "UK Shoe Size - This is the most important field" },
                    color: { type: Type.STRING, description: "Color or Color Code" },
                    sku: { type: Type.STRING, description: "SKU, Barcode, or Article No (ART No)" },
                    quantity: { type: Type.STRING, description: "Quantity if stated" },
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
