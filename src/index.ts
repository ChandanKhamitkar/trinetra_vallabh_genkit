import * as z from "zod";

// Import the Genkit core libraries and plugins.
import { defineTool, generate, retrieve } from "@genkit-ai/ai";
import { configureGenkit } from "@genkit-ai/core";
import { defineFlow, startFlowsServer } from "@genkit-ai/flow";
import { googleAI } from "@genkit-ai/googleai";
import { prompt } from "@genkit-ai/dotprompt";

import { gemini15Flash } from "@genkit-ai/googleai";
import { dotprompt } from "@genkit-ai/dotprompt";
import { defineSecret } from "firebase-functions/params";
import { onFlow, noAuth } from "@genkit-ai/firebase/functions";
const googleAIapiKey = process.env.GOOGLE_GENAI_API_KEY;

enum LevelOfCooking {
    BEGINNER = "BEGINNER",
    INTERMEDIATE = "INTERMEDIATE",
    ADVANCED = "ADVANCED",
}

enum Lifestyle {
    SEDENTARY = "sedentary",
    ACTIVE = "active",
    HECTIC = "hectic",
}

enum DietaryPreferences {
    VEGETARIAN = "vegetarian",
    NONVEGETARIAN = "nonvegetarian",
    VEGAN = "vegan",
}

interface FoodPreferences {
    dietaryPreferences: DietaryPreferences;
    cookingExperience: LevelOfCooking;
    spiceLevel: number;
    sweetHotLevel: number;
    mealCount: number;
}

interface HealthMetric {
    weight: number;
    height: number;
    waterPercent: number | null;
    fatPercent: number | null;
    boneMass: number | null;
    calories: number | null;
}

interface User {
    name: string;
    gender: string;
    age: number;
    lifestyle: Lifestyle;
    healthGoals: string[];
    healthIssues: string[];
    healthRecords: HealthMetric[];
    foodPreferences: FoodPreferences;
    allergies: string[];
    favouriteFoods: string[];
}

configureGenkit({
    plugins: [
        googleAI({ apiKey: "AIzaSyAtx5N0JzyuT03hU_kZ6SWfKQUNgLuXAxg" }),
        dotprompt({ dir: "prompts" })
    ],
    logLevel: "debug",
    enableTracingAndMetrics: true,
});

export const imageRetrivalTool = defineTool({
    name: 'imageRetrival',
    description: 'Generates and image for the recipe based on the name',
    inputSchema: z.object({ name: z.string() }),
    outputSchema: z.string(),
}, async ({ name }): Promise<string> => {
    const res = await fetch(`https://www.googleapis.com/customsearch/v1?q=${name}&cx=05a8572eddfd645dc&imgSize=XLARGE&imgType=photo&num=1&searchType=image&key=AIzaSyAtx5N0JzyuT03hU_kZ6SWfKQUNgLuXAxg`);

    if (res.status === 200) {
        return (await res.json()).items[0].link;
    }
    else {
        return "null";
    }

})

// Define a simple flow that prompts an LLM to generate menu suggestions.
export const menuSuggestionFlow = onFlow(
    {
        name: "forMenuGeneration",
        inputSchema: z.object({
            name: z.string(),
            gender: z.string(),
            age: z.number(),
            lifestyle: z.enum(Object.values(Lifestyle) as [string, ...string[]]),
            healthGoals: z.array(z.string()),
            healthIssues: z.array(z.string()),
            healthRecords: z.array(
                z.object({
                    weight: z.number(),
                    height: z.number(),
                    waterPercent: z.number().optional(),
                    fatPercent: z.number().optional(),
                    boneMass: z.number().optional(),
                    calories: z.number().optional(),
                })
            ),
            foodPreferences: z.object({
                dietaryPreferences: z.enum(
                    Object.values(DietaryPreferences) as [string, ...string[]]
                ),
                cookingExperience : z.enum(Object.values(LevelOfCooking) as [
                    string,
                    ...string[]
                ]),
                spiceLevel: z.number(),
                sweetHotLevel: z.number(),
                mealCount: z.number(),       
            }),
            allergies: z.array(z.string()),
            favouriteFoods: z.array(z.string()),
        }),
        outputSchema: z.unknown(),
        authPolicy: noAuth(),
        // httpsOptions : {
        //   secrets : [googleAIapiKey],
        //   cors: true,
        // }
    },
    async (subject) => {
        const {
            name,
            gender,
            age,
            lifestyle,
            healthGoals,
            healthIssues,
            healthRecords,
            foodPreferences,
            allergies,
            favouriteFoods,
        } = subject;
        console.log('subject = ', subject);
        const agent = await prompt('main');
        // if(agent === null){ 
        const result = await agent.generate({
            input: subject
        });
        // }
        const llmResponse = result.output();
        return llmResponse;
    }
);

// Start a flow server, which exposes your flows as HTTP endpoints. This call
// must come last, after all of your plug-in configuration and flow definitions.
// You can optionally specify a subset of flows to serve, and configure some
// HTTP server options, but by default, the flow server serves all defined flows.
// startFlowsServer();