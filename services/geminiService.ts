import { EWasteItem } from '../types';
import { GoogleGenAI, Type } from "@google/genai";


const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
});



export const analyzeImage = async (file: File): Promise<EWasteItem> => {
  console.log('Analyzing image:', file.name);

  const imagePart = {
    inlineData: {
      mimeType: file.type,
      data: await fileToBase64(file), 
    },
  };

  const textPart = {
    text: "Identify the e-waste item in this image. Provide its name, category (phone, laptop, battery, appliance, other), potential hazards, and an estimated recycling value range in Malaysian Ringgit (RM). Also write a short, impactful environmental note about recycling this item."
  }

  const response = await chat.sendMessage({
    message: [imagePart, textPart],
    // You could use responseSchema for a structured JSON output
    config: {
      responseMimeType: 'application/json',
        responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { 
            type: Type.STRING, 
            description: "Generate a unique identifier string for this item." 
          },
          itemName: { type: Type.STRING },
          category: {
            type: Type.STRING,
            enum: ['phone', 'laptop', 'battery', 'appliance', 'other'],
          },
          estimatedValue: {
            type: Type.OBJECT,
            properties: {
              min: { type: Type.NUMBER },
              max: { type: Type.NUMBER },
            },
            required: ['min', 'max'],
          },
          environmentalImpact: { 
            type: Type.STRING,
            description: "A brief description of the environmental impact of this e-waste."
          },
          hazardFlag: { 
            type: Type.BOOLEAN,
            description: "True if the item poses an immediate physical or chemical hazard."
          },
          hazardDetails: { 
            type: Type.STRING,
            description: "Details about the hazard. Leave null if hazardFlag is false."
          },
        },
        // Enforce which fields the model MUST return
        required: [
          'id', 
          'itemName', 
          'category', 
          'estimatedValue', 
          'environmentalImpact', 
          'hazardFlag'
        ],
      },
    }
  });

  const jsonText = response.text;
  
  if (jsonText) {
      // Parse the JSON string directly into your TypeScript interface
      const eWasteData: EWasteItem = JSON.parse(jsonText);
      console.log('Structured E-Waste Data:', eWasteData);
      console.log(`\nItem: ${eWasteData.itemName} (${eWasteData.category})`);
      return eWasteData; 
  }

 
  };

  
export const analyzeText = async (userMessage: string): Promise<string> => {
  console.log('Analyzing text:', userMessage);

  const response = await chat.sendMessage({
    message: [{
        text: `You are an e-waste expert assistant. Answer the user's question helpfully and concisely, 
        focusing on e-waste recycling, disposal, environmental impact, and related topics. 
        If the question is unrelated to e-waste, politely redirect them.
        
        User question: ${userMessage}`
      }]
    })
      const responseText = response.text;

  if (!responseText) {
    throw new Error('No response received from Gemini API');
  }

  return responseText;
};

// Utility function to convert a File object to a Base64 string
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Tell TypeScript: "Trust me, this is a string"
      const result = reader.result as string;
      const base64String = result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
}



