import axios from 'axios';

const api = axios.create({
  baseURL: 'https://gamification-with-4gdj9vbap-roohul-amin.vercel.app/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const generateContent = async (prompt, level) => {
  try {
    const response = await api.post('/generate', {
      prompt,
      level,
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to generate content.');
    }

    if (error.request) {
      throw new Error('Unable to reach the server. Please try again.');
    }

    throw new Error('Something went wrong while generating content.');
  }
};

export default api;
