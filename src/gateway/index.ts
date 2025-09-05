import { callGoogleAIStudioAPI, callGroqAPI, callPerplexityAPI, callWorkersAIAPI } from "./utils";
import { ReqSchema } from "../schema";
import { z } from "zod";

export async function callGatewayAI(input: z.infer<typeof ReqSchema>) {
    try {

        // Determine the type of request
        const requestType = input.type;
        
        // Get the model id
        const modelId = input.model_id;

        // Combine system prompt and user prompt
        const systemPrompt = input.system_prompt || "";
        const combinedPrompt = `${systemPrompt}\n\nUser Request: ${input.prompt}`;
    
        let response;
        
        switch (input.provider) {
        case 'groq':
            response = await callGroqAPI(combinedPrompt, modelId);
            break;
        case 'google-ai-studio':
            response = await callGoogleAIStudioAPI(combinedPrompt, modelId);
            break;
        case 'workers-ai':
            response = await callWorkersAIAPI(combinedPrompt, modelId);
            break;
        default:
            throw new Error(`Unsupported provider: ${input.provider}`);
        }
        return response;
    } catch (error) {
        console.error(error);
        throw new Error(`Failed to call gateway AI: ${error}`);
    }
}
  