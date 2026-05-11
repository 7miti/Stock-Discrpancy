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
                    { text: 'Extract shoe product information from this label. Return valid JSON only with the exact keys: shoeName, brand, euSize, usSize, ukSize, color, sku, quantity.\n\nCRITICAL INSTRUCTIONS FOR SIZES:\n- Look VERY closely for grids, tables, or lists of numbers.\n- Shoe labels almost ALWAYS show sizes. You must find them.\n- Look next to or below abbreviations like: US, UK, EU, EUR, F, FR, D, CM, CHN, JP.\n- Sizes might be whole numbers (7, 10, 42) or decimals/fractions (7.5, 10.5, 42.5, 42 2/3).\n- Sizes might also be letters (S, M, L, XL, OSFA).\n- Do not skip sizes. If you see "US 9" and "UK 8", extract them into the correct fields!\n- SKU/Article Number is usually a distinct alphanumeric code (e.g., CW2288-111, GX3060, ART NO. 1234).\n- If a field is truly not found, leave it as an empty string.' }
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
