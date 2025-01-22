import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    console.log('Received prompt:', prompt);
    
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error('REPLICATE_API_TOKEN is not set in environment variables');
      throw new Error('Missing Replicate API token');
    }

    console.log('Initializing Replicate client...');
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    console.log('Starting image generation with prompt:', prompt);
    try {
      // Create and wait for the prediction
      const prediction = await replicate.predictions.create({
        version: "1eaac30a6af4d4b1ef8f18b51aa1b88b4fba01b58490028c2ddf34cd6ffd5f86",
        input: {
          prompt: prompt,
          num_inference_steps: 28,
          guidance_scale: 10,
          model: "dev"
        }
      });

      console.log('Prediction created:', prediction);

      // Wait for the prediction to complete
      let result = await replicate.wait(prediction);
      console.log('Prediction result:', result);

      if (!result.output || !Array.isArray(result.output) || result.output.length === 0) {
        throw new Error('No image generated');
      }

      return NextResponse.json({ imageUrl: result.output[0] });

    } catch (error) {
      console.error('Replicate API error:', error);
      throw error;
    }

  } catch (error) {
    console.error('API Route error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 500 }
    );
  }
}
