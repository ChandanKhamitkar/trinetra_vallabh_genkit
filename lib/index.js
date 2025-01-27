"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuSuggestionFlow = void 0;
const z = __importStar(require("zod"));
const core_1 = require("@genkit-ai/core");
const googleai_1 = require("@genkit-ai/googleai");
const dotprompt_1 = require("@genkit-ai/dotprompt");
const dotprompt_2 = require("@genkit-ai/dotprompt");
const functions_1 = require("@genkit-ai/firebase/functions");
const googleAIapiKey = process.env.GOOGLE_GENAI_API_KEY;
var LevelOfCooking;
(function (LevelOfCooking) {
    LevelOfCooking["BEGINNER"] = "beginner";
    LevelOfCooking["INTERMEDIATE"] = "intermediate";
    LevelOfCooking["ADVANCED"] = "advanced";
})(LevelOfCooking || (LevelOfCooking = {}));
var LevelOfRecipeCook;
(function (LevelOfRecipeCook) {
    LevelOfRecipeCook["EASY"] = "easy";
    LevelOfRecipeCook["MEDIUM"] = "medium";
    LevelOfRecipeCook["HARD"] = "hard";
})(LevelOfRecipeCook || (LevelOfRecipeCook = {}));
var Lifestyle;
(function (Lifestyle) {
    Lifestyle["SEDENTARY"] = "sedentary";
    Lifestyle["ACTIVE"] = "active";
    Lifestyle["HECTIC"] = "hectic";
})(Lifestyle || (Lifestyle = {}));
var DietaryPreferences;
(function (DietaryPreferences) {
    DietaryPreferences["VEGETARIAN"] = "vegetarian";
    DietaryPreferences["NONVEGETARIAN"] = "nonvegetarian";
    DietaryPreferences["VEGAN"] = "vegan";
})(DietaryPreferences || (DietaryPreferences = {}));
var WeekDays;
(function (WeekDays) {
    WeekDays["MONDAY"] = "Monday";
    WeekDays["TUESDAY"] = "Tuesday";
    WeekDays["WEDNESDAY"] = "Wednesday";
    WeekDays["THURSDAY"] = "Thursday";
    WeekDays["FRIDAY"] = "Friday";
    WeekDays["SATURDAY"] = "Saturday";
})(WeekDays || (WeekDays = {}));
(0, core_1.configureGenkit)({
    plugins: [
        (0, googleai_1.googleAI)({ apiKey: "AIzaSyAtx5N0JzyuT03hU_kZ6SWfKQUNgLuXAxg" }),
        (0, dotprompt_2.dotprompt)({ dir: "prompts" }),
    ],
    logLevel: "debug",
    enableTracingAndMetrics: true,
});
// export const imageRetrivalTool = defineTool(
//   {
//     name: "imageRetrival",
//     description: "Generates and image for the recipe based on the name",
//     inputSchema: z.object({ name: z.string() }),
//     outputSchema: z.string(),
//   },
//   async ({ name }): Promise<string> => {
//     const res = await fetch(
//       `https://www.googleapis.com/customsearch/v1?q=${name}&cx=05a8572eddfd645dc&imgSize=XLARGE&imgType=photo&num=1&searchType=image&key=AIzaSyAtx5N0JzyuT03hU_kZ6SWfKQUNgLuXAxg`
//     );
//     if (res.status === 200) {
//       return (await res.json()).items[0].link;
//     } else {
//       return "null";
//     }
//   }
// );
// Define a simple flow that prompts an LLM to generate menu suggestions.
exports.menuSuggestionFlow = (0, functions_1.onFlow)({
    name: "forMenuGeneration",
    inputSchema: z.object({
        name: z.string(),
        gender: z.string(),
        age: z.number(),
        lifestyle: z.enum(Object.values(Lifestyle)),
        healthGoals: z.array(z.string()),
        healthIssues: z.array(z.string()),
        healthRecords: z.object({
            weight: z.number(),
            height: z.number(),
            waterPercent: z.number().nullable(),
            fatPercent: z.number().nullable(),
            boneMass: z.number().nullable(),
            calories: z.number().nullable(),
            muscleMass: z.number().nullable(),
        }),
        foodPreferences: z.object({
            dietaryPreferences: z.enum(Object.values(DietaryPreferences)),
            cookingExperience: z.enum(Object.values(LevelOfCooking)),
            spiceLevel: z.number(),
            sweetHotLevel: z.number(),
            mealCount: z.number(),
        }),
        allergies: z.array(z.string()),
        favouriteFoods: z.array(z.string()),
    }),
    outputSchema: z.object({
        menu: z.object({
            dayofWeek: z.object({
                recipeName: z.string(),
                levelOfCook: z.enum(Object.values(LevelOfRecipeCook)),
                timeRequireToCook: z.string(),
                macroNutrientIndex: z.object({
                    protein: z.string(),
                    carbs: z.string(),
                    calories: z.string(),
                }),
                ingredients: z.array(z.string()),
                recipe: z.array(z.string()),
                cutlery: z.array(z.string()),
            }),
        }),
    }),
    authPolicy: (0, functions_1.noAuth)(),
    httpsOptions: {
        //  secrets : [googleAIapiKey],
        cors: "http://localhost:52114",
    },
}, async (subject) => {
    const { name, gender, age, lifestyle, healthGoals, healthIssues, healthRecords, foodPreferences, allergies, favouriteFoods, } = subject;
    console.log("Received input for menuSuggestionFlow:", subject);
    const agent = await (0, dotprompt_1.prompt)("main");
    // if(agent === null){
    const result = await agent.generate({
        input: subject,
    });
    // }
    const llmResponse = result.output();
    return llmResponse;
});
// Start a flow server, which exposes your flows as HTTP endpoints. This call
// must come last, after all of your plug-in configuration and flow definitions.
// You can optionally specify a subset of flows to serve, and configure some
// HTTP server options, but by default, the flow server serves all defined flows.
// startFlowsServer();
//# sourceMappingURL=index.js.map