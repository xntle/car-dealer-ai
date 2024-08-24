import { NextResponse } from 'next/server';
import { createWriteStream, createReadStream } from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';

export async function POST(req) {
  try {
    const buffer = await req.arrayBuffer(); // Get the request body as a buffer
    const audioBuffer = Buffer.from(buffer);
    const outputFile = path.join(process.cwd(), 'public', 'output.wav');

    // Write the audio buffer to a file
    const writeStream = createWriteStream(outputFile);
    writeStream.write(audioBuffer);
    writeStream.end();

    // Transcribe the audio file using OpenAI's Whisper API
    const form = new FormData();
    form.append('file', createReadStream(outputFile));
    form.append('model', 'whisper-1');
    form.append('response_format', 'text');

    const transcriptionResponse = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    const transcribedText = transcriptionResponse.data.text;

    // Use GPT-4O Mini to generate a response based on the transcribed text
    const chatResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant providing concise responses.',
          },
          { role: 'user', content: transcribedText },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const chatResponseText = chatResponse.data.choices[0].message.content;

    // Respond with the AI's response
    return NextResponse.json({ text: chatResponseText });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Failed to process the audio' }, { status: 500 });
  }
}
