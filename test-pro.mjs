import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

async function test() {
  try {
    const { text } = await generateText({
      model: google('gemini-1.5-pro'),
      prompt: 'Diga OK',
    });
    console.log('RESULTADO:' + text);
  } catch (e) {
    console.error('ERRO:' + e.message);
  }
}
test();
