import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Raw request body:', body);

    // Handle both formats
    let prompts: string[] = [];
    
    if (body.prompts) {
      prompts = Array.isArray(body.prompts) ? body.prompts : [body.prompts];
    } else if (body.prompt) {
      prompts = [body.prompt];
    } else {
      throw new Error('No prompts provided in request');
    }

    console.log('Processed prompts:', prompts);

    if (prompts.length === 0) {
      throw new Error('Empty prompts array');
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('Missing Replicate API token');
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const imageUrls: string[] = [];
    
    for (const prompt of prompts) {
      try {
        console.log('Processing individual prompt:', prompt);
        // Create prediction with exact API structure
        const prediction = await replicate.predictions.create({
          version: "1eaac30a6af4d4b1ef8f18b51aa1b88b4fba01b58490028c2ddf34cd6ffd5f86",
          input: {
            prompt: prompt,
            num_inference_steps: 50,
            guidance_scale: 7.5,
            negative_prompt: "ugly, blurry, poor quality, disfigured",
            num_outputs: 1
          }
        });

        console.log('Prediction created:', prediction);
        const result = await replicate.wait(prediction);
        console.log('Result received:', result);
        
        if (!result.output || !Array.isArray(result.output) || result.output.length === 0) {
          throw new Error('No image generated');
        }

        imageUrls.push(result.output[0]);
        console.log('Generated URL:', result.output[0]);
      } catch (error) {
        console.error('Replicate API error:', error);
        throw error;
      }
    }

    return NextResponse.json({ imageUrls });

  } catch (error) {
    console.error('API Route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate images' },
      { status: 500 }
    );
  }
}
