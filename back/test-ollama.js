const axios = require('axios');

async function testOllamaDirectly() {
  try {
    console.log('Testing direct Ollama connection...');

    const client = axios.create({
      baseURL: 'http://127.0.0.1:11434',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'close'
      },
      maxRedirects: 0,
      validateStatus: function (status) {
        return status < 500;
      }
    });

    const chatData = {
      model: 'llama3.2:3b',
      prompt: 'Generate a simple IEEE citation for a quantum computing paper titled "Quantum Algorithms" by Smith et al., 2023',
      stream: false,
      options: {
        temperature: 0.7,
        num_ctx: 4096
      }
    };

    console.log('Sending request to Ollama...');
    const start = Date.now();
    const response = await client.post('/api/generate', chatData);
    const duration = Date.now() - start;

    console.log(`Success! Response received in ${duration}ms`);
    console.log('Response:', response.data?.response?.substring(0, 200) + '...');

    return true;
  } catch (error) {
    console.error('Ollama test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return false;
  }
}

testOllamaDirectly().then(success => {
  console.log(`Test result: ${success ? 'SUCCESS' : 'FAILED'}`);
  process.exit(success ? 0 : 1);
});