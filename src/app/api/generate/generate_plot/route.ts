import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Define the response type
interface ComicPanel {
  prompt: string;
  caption: string;
}

interface ComicsResponse {
  comics: ComicPanel[];
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    console.log('Received prompt:', prompt);
    
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('Missing GitHub token');
    }

    const client = new OpenAI({
      apiKey: process.env.GITHUB_TOKEN,
      baseURL: "https://models.inference.ai.azure.com",
    });

    const systemPrompt = `
    Create a 3-panel comic story about a dog's adventure. For each panel, provide:
    1. An image generation prompt that includes 'FOLEY black dog' and ends with 'realistic style'
    2. A caption that refers to the dog as 'Foley'

    Format the output as JSON with this structure:
    {
        "comics": [
            {
                "prompt": "Image generation prompt here",
                "caption": "Caption text here"
            }
        ]
    }
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ]
    });

    const storyJson = JSON.parse(response.choices[0].message.content || '') as ComicsResponse;
    return NextResponse.json(storyJson);

  } catch (error) {
    console.error('API Route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate plot' },
      { status: 500 }
    );
  }
}
