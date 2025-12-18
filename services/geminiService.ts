import { GoogleGenAI, Type } from "@google/genai";
import { Task } from "../types";

const generateTasksFromGoal = async (goal: string, date: string, sessionId: string): Promise<Partial<Task>[]> => {
  if (!process.env.API_KEY) {
    console.warn("API Key missing");
    return [];
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      // Use gemini-3-flash-preview for basic text tasks as per guidelines
      model: "gemini-3-flash-preview",
      contents: `Break down the following goal into a concrete, actionable to-do list for a single productivity sprint. 
      Keep tasks atomic (15-60 mins). 
      Goal: "${goal}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "A clear, actionable task name"
              }
            },
            required: ["title"]
          }
        }
      }
    });

    if (response.text) {
      const rawTasks = JSON.parse(response.text) as { title: string }[];
      return rawTasks.map(t => ({
        id: crypto.randomUUID(),
        title: t.title,
        isCompleted: false,
        totalTime: 0,
        date: date,
        sessionId: sessionId
      }));
    }
    return [];
  } catch (error) {
    console.error("Failed to generate tasks:", error);
    return [];
  }
};

export { generateTasksFromGoal };