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
                    { text: 'Extract shoe product information from this label. Return valid JSON only with the exact keys: shoeName, brand, euSize, usSize, ukSize, color, sku, quantity. Extract sizes exactly as they appear on the label, whether they are numbers (e.g., 9, 10.5, 42, 42.5, 42 2/3) or letters (e.g., S, M, L, XL, XS). They might be in a tabular format next to abbreviations like US, UK, EUR, F, D, J, CM. If you see multiple sizes, extract the explicitly labeled US, UK, and EU sizes. SKU is usually an alphanumeric barcode string or ART/Article No, sometimes located above a barcode. If a field is not found, leave it as an empty string.' }
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
