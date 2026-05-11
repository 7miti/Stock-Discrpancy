import { GoogleGenAI, Type } from '@google/genai';

// Initialize the Gemini client using the environment variable injected by the system
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function extractShoeLabel(base64Image: string) {
    // Strip headers if present from base64 string
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            {
                role: 'user',
                parts: [
                    { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
                    { text: 'Extract shoe product information from this label. Return valid JSON only with exactly these keys: shoeName, brand, euSize, usSize, ukSize, color, sku, quantity.\n\nCRITICAL SIZES INSTRUCTIONS:\n- Look at tables/grids. If you see abbreviations like "US 9", "UK 8.5", "F 42 2/3", "EUR 42.5", extract those numbers exactly as they appear (including decimals and fractions).\n- US, UK, and EU size are mandatory fields if they exist anywhere on the label.\n- Do not overthink, just extract the visible numbers or letters next to the size labels.\n- Keep it extremely fast.\n- If a field is really missing, leave as empty string.' }
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
                    ukSize: { type: Type.STRING, description: "UK Shoe Size" },
                    color: { type: Type.STRING, description: "Color or Color Code" },
                    sku: { type: Type.STRING, description: "SKU, Barcode, or Article No (ART No)" },
                    quantity: { type: Type.STRING, description: "Quantity if stated" },
                }
            }
        }
    });

    try {
        if (!response.text) {
            throw new Error("Empty response from AI");
        }
        console.log("Raw AI response:", response.text);
        return JSON.parse(response.text);
    } catch (e) {
        console.error("Parse error:", e);
        throw new Error("Failed to parse AI response.");
    }
}
