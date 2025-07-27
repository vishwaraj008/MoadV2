const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function explainWithGemini(code) {
    try {
        const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });
        const result = await model.generateContent(`Explain this JavaScript function in bullet points:\n\n${code}`);
        return result.response.text();
    } catch (err) {
        console.error('Gemini error:', err);
        return 'Failed to generate explanation.';
    }
}

module.exports = { explainWithGemini };