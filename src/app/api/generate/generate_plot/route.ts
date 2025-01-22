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
    // Validate request body
    const body = await request.json();
    console.log('Raw request body:', body);
    
    if (!body.prompt || typeof body.prompt !== 'string') {
      throw new Error('Invalid or missing prompt in request');
    }

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
        { role: "user", content: body.prompt }
      ]
    });

    if (!response.choices[0].message.content) {
      throw new Error('Empty response from OpenAI');
    }

    console.log('OpenAI response:', response.choices[0].message.content);

    try {
      const storyJson = JSON.parse(response.choices[0].message.content) as ComicsResponse;
      
      // Validate the parsed JSON structure
      if (!storyJson.comics || !Array.isArray(storyJson.comics)) {
        throw new Error('Invalid JSON structure: missing comics array');
      }

      if (storyJson.comics.length !== 3) {
        throw new Error(`Expected 3 panels, got ${storyJson.comics.length}`);
      }

      // Validate each panel
      storyJson.comics.forEach((panel, index) => {
        if (!panel.prompt || !panel.caption) {
          throw new Error(`Panel ${index + 1} missing prompt or caption`);
        }
      });

      console.log('Validated story JSON:', storyJson);
      return NextResponse.json(storyJson);
    } catch (parseError: unknown) {
      console.error('JSON Parse Error:', parseError);
      throw new Error(`Failed to parse OpenAI response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }

  } catch (error: unknown) {
    console.error('API Route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate plot' },
      { status: 500 }
    );
  }
}
