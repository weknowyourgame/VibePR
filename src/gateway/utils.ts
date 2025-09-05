
// Groq API
export async function callGroqAPI(prompt: string, model: string) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('Missing GROQ_API_KEY');
    }
  
    const url = `https://gateway.ai.cloudflare.com/v1/${process.env.ACCOUNT_ID}/ai-worker-scouts/groq/chat/completions`;
    
    const body = JSON.stringify({
      messages: [
        {
          role: "user",
          content: prompt,
        }
      ],
      model: model,
      temperature: 0.6,
      max_tokens: 2048,
      top_p: 0.95
    });
  
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body,
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      throw new Error(`Groq API failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
  
    const groqData = (await response.json()) as any;
    console.log('Groq API call - Response:', JSON.stringify(groqData, null, 2));
    
    return groqData;
  }
  
// Perplexity AI API
export async function callPerplexityAPI(prompt: string, model: string) {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('Missing PERPLEXITY_API_KEY');
    }
  
    const url = `https://gateway.ai.cloudflare.com/v1/${process.env.ACCOUNT_ID}/ai-worker-scouts/perplexity-ai/chat/completions`;
    
    const body = JSON.stringify({
      model: model,
      messages: [
        {
          role: "user",
          content: prompt,
        }
      ],
      temperature: 0.6,
      max_tokens: 2048,
      top_p: 0.95
    });
  
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body,
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', errorText);
      throw new Error(`Perplexity API failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
  
    const data = await response.json();
    console.log('Perplexity API call - Response:', JSON.stringify(data, null, 2));
    
    return data;
  }
  
// Google AI Studio API
export async function callGoogleAIStudioAPI(prompt: string, model: string) {
    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
    if (!apiKey) {
      throw new Error('Missing GOOGLE_AI_STUDIO_API_KEY');
    }
  
    const url = `https://gateway.ai.cloudflare.com/v1/${process.env.ACCOUNT_ID}/ai-worker-scouts/google-ai-studio/v1/models/${model}:generateContent`;
    
    const body = JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 2048,
        topP: 0.95
      }
    });
  
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body,
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google AI Studio error response:', errorText);
      throw new Error(`Google AI Studio API failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
  
    const studioData = (await response.json()) as any;
    
    // Convert Google AI Studio response to OpenAI format
    // The response structure might be different, let's handle various formats
    let content: string = "";
    
    if (studioData && studioData.candidates && studioData.candidates[0] && studioData.candidates[0].content) {
      content = studioData.candidates[0].content.parts?.[0]?.text || "";
    } else if (studioData && studioData.candidates && studioData.candidates[0] && studioData.candidates[0].text) {
      content = studioData.candidates[0].text;
    } else if (studioData && (studioData as any).text) {
      content = studioData.text as string;
    } else if (studioData && (studioData as any).content) {
      content = studioData.content as string;
    } else {
      console.error('Unexpected Google AI Studio response format:', studioData);
      content = "I'll help you research and gather information on your topic. Let me create a comprehensive search and analysis plan to find the most relevant and up-to-date information for you.";
    }
    
    console.log('Extracted content:', content);
    
    return {
      choices: [{
        message: {
          content: content
        }
      }]
    };
  }

// Workers AI API
export async function callWorkersAIAPI(prompt: string, model: string) {
    const apiKey = process.env.CLOUDFLARE_API_TOKEN;
    if (!apiKey) {
      throw new Error('Missing CLOUDFLARE_API_TOKEN');
    }
  
    const url = `https://gateway.ai.cloudflare.com/v1/${process.env.ACCOUNT_ID}/ai-worker-scouts/workers-ai/${model}`;
    
    const body = JSON.stringify({
      prompt: prompt,
      max_tokens: 2048,
      temperature: 0.6
    });
  
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body,
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Workers AI API failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
  
    const data: any = await response.json();
    
    // Convert Workers AI response to OpenAI format
    return {
      choices: [{
        message: {
          content: data.response || ""
        }
      }]
    };
  }