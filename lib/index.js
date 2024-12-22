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
exports.menuSuggestionFlow = exports.imageRetrivalTool = void 0;
const z = __importStar(require("zod"));
// Import the Genkit core libraries and plugins.
const ai_1 = require("@genkit-ai/ai");
const core_1 = require("@genkit-ai/core");
const googleai_1 = require("@genkit-ai/googleai");
const dotprompt_1 = require("@genkit-ai/dotprompt");
const dotprompt_2 = require("@genkit-ai/dotprompt");
const functions_1 = require("@genkit-ai/firebase/functions");
const googleAIapiKey = process.env.GOOGLE_GENAI_API_KEY;
console.log('key = ', googleAIapiKey);
var LevelOfCooking;
(function (LevelOfCooking) {
    LevelOfCooking["BEGINNER"] = "BEGINNER";
    LevelOfCooking["INTERMEDIATE"] = "INTERMEDIATE";
    LevelOfCooking["ADVANCED"] = "ADVANCED";
})(LevelOfCooking || (LevelOfCooking = {}));
var Lifestyle;
(function (Lifestyle) {
    Lifestyle["SEDENTARY"] = "SEDENTARY";
    Lifestyle["ACTIVE"] = "ACTIVE";
    Lifestyle["HECTIC"] = "HECTIC";
})(Lifestyle || (Lifestyle = {}));
var FlexiNutritionType;
(function (FlexiNutritionType) {
    FlexiNutritionType["VEGETARIAN"] = "VEGETARIAN";
    FlexiNutritionType["NON_VEGETARIAN"] = "NON_VEGETARIAN";
    FlexiNutritionType["VEGAN"] = "VEGAN";
})(FlexiNutritionType || (FlexiNutritionType = {}));
var Gender;
(function (Gender) {
    Gender["Male"] = "Male";
    Gender["Female"] = "Female";
    Gender["Other"] = "Other";
})(Gender || (Gender = {}));
var Country;
(function (Country) {
    Country["INDIA"] = "INDIA";
    Country["AMERICA"] = "AMERICA";
    Country["ITALY"] = "ITALY";
})(Country || (Country = {}));
(0, core_1.configureGenkit)({
    plugins: [
        (0, googleai_1.googleAI)({ apiKey: "AIzaSyAtx5N0JzyuT03hU_kZ6SWfKQUNgLuXAxg" }),
        (0, dotprompt_2.dotprompt)({ dir: "prompts" })
    ],
    logLevel: "debug",
    enableTracingAndMetrics: true,
});
exports.imageRetrivalTool = (0, ai_1.defineTool)({
    name: 'imageRetrival',
    description: 'Generates and image for the recipe based on the name',
    inputSchema: z.object({ name: z.string() }),
    outputSchema: z.string(),
}, async ({ name }) => {
    const res = await fetch(`https://www.googleapis.com/customsearch/v1?q=${name}&cx=05a8572eddfd645dc&imgSize=XLARGE&imgType=photo&num=1&searchType=image&key=AIzaSyAtx5N0JzyuT03hU_kZ6SWfKQUNgLuXAxg`);
    if (res.status === 200) {
        return (await res.json()).items[0].link;
    }
    else {
        return "null";
    }
});
// Define a simple flow that prompts an LLM to generate menu suggestions.
exports.menuSuggestionFlow = (0, functions_1.onFlow)({
    name: "forMenuGeneration",
    inputSchema: z.object({
        name: z.string(),
        email: z.string(),
        address: z.object({
            name: z.string(),
            doorNumber: z.string(),
            apartment: z.string(),
            city: z.string(),
            state: z.string(),
            landmark: z.string(),
            pincode: z.string(),
        }).optional(),
        age: z.number(),
        lifestyle: z.enum(Object.values(Lifestyle)),
        country: z.enum(Object.values(Country)),
        gender: z.string(),
        dailyRoutine: z.array(z.tuple([z.string(), z.object({ hour: z.number(), minutes: z.number() })])),
        levelOfCooking: z.enum(Object.values(LevelOfCooking)),
        numberOfDishes: z.number(),
        favouriteFoodItems: z.array(z.string()),
        flexiNutritionPreferences: z.object({
            type: z.enum(Object.values(FlexiNutritionType)),
            spicePreferences: z.number(),
            sweetOrHotPreferences: z.number(),
            allergies: z.array(z.string()),
            dietaryRestrictions: z.array(z.string()),
        }),
        healthGoals: z.array(z.string()),
        healthIssues: z.array(z.string()),
        healthMetrics: z.array(z.object({
            weight: z.number(),
            height: z.number(),
            waterPercentage: z.number().optional(),
            fatPercentage: z.number().optional(),
            boneMass: z.number().optional(),
            calories: z.number().optional(),
        })),
    }),
    outputSchema: z.unknown(),
    authPolicy: (0, functions_1.noAuth)(),
    // httpsOptions : {
    //   secrets : [googleAIapiKey],
    //   cors: true,
    // }
}, async (subject) => {
    const { name, lifestyle, flexiNutritionPreferences, levelOfCooking, favouriteFoodItems, healthGoals, healthIssues, healthMetrics, } = subject;
    console.log('subject = ', subject);
    const agent = await (0, dotprompt_1.prompt)('main');
    // if(agent === null){ 
    const result = await agent.generate({
        input: subject
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