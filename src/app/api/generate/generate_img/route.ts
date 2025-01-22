import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(request: Request) {
  try {
    // Validate request body
    const body = await request.json();
    console.log('Raw request body:', body);

    let prompts: string[] = [];
    
    if (body.prompts) {
      prompts = Array.isArray(body.prompts) ? body.prompts : [body.prompts];
    } else if (body.prompt) {
      prompts = [body.prompt];
    } else {
      throw new Error('No prompts provided in request');
    }

    // Validate prompts
    prompts = prompts.map((prompt, index) => {
      if (typeof prompt !== 'string') {
        throw new Error(`Invalid prompt at index ${index}: must be a string`);
      }
      return prompt.trim();
    });

    console.log('Validated prompts:', prompts);

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
        console.log('Processing prompt:', prompt);
        
        const prediction = await replicate.predictions.create({
          version: "1eaac30a6af4d4b1ef8f18b51aa1b88b4fba01b58490028c2ddf34cd6ffd5f86",
          input: {
            prompt: prompt,
            num_inference_steps: 8,
            guidance_scale: 3.5,
            negative_prompt: "ugly, blurry, poor quality, disfigured",
            num_outputs: 1,
            model: "schnell"
          }
        });

        console.log('Prediction created:', prediction);
        
        const result = await replicate.wait(prediction);
        console.log('Result received:', result);
        
        if (!result.output || !Array.isArray(result.output) || result.output.length === 0) {
          throw new Error('Invalid response from Replicate');
        }

        const imageUrl = result.output[0];
        if (typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
          throw new Error('Invalid image URL received');
        }

        imageUrls.push(imageUrl);
        console.log('Valid image URL generated:', imageUrl);
      } catch (error) {
        console.error('Replicate API error:', error);
        throw error;
      }
    }

    console.log('All images generated successfully:', imageUrls);
    return NextResponse.json({ imageUrls });

  } catch (error) {
    console.error('API Route error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate images',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
