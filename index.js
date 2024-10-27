require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const axios = require('axios');

const LLaMA_API_URL = process.env.LLAMA_API_URL; // Set your LLaMA endpoint in the .env file

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Home Route
app.get('/', (req, res) => {
    res.render('index');
});

// Helper function to query the LLaMA model
async function queryLLaMAModel(promptText) {
    try {
        const response = await axios.post(
            LLaMA_API_URL,
            {
                inputs: promptText,
                parameters: {
                    max_new_tokens: 100,
                    temperature: 0.7,
                },
            },
            {
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.LLAMA_API_KEY}`
                }
            }
        );
        return response.data.choices[0].text.trim();
    } catch (error) {
        console.error("Error querying LLaMA model:", error);
        throw error;
    }
}

// Analyze Health Problem and return Nutrient Deficiencies
app.post('/analyze', async (req, res) => {
    const healthProblem = req.body.healthProblem;
    try {
        const prompt = `What nutrient deficiencies or main deficiencies are linked to ${healthProblem}?`;
        const deficienciesText = await queryLLaMAModel(prompt);
        const deficiencies = deficienciesText.split(',');

        res.render('results', { healthProblem, deficiencies });
    } catch (error) {
        res.status(500).send("Internal server error");
    }
});

// Fetch Foods Rich in Selected Nutrient
app.get('/nutrient/:name', async (req, res) => {
    const nutrient = req.params.name;
    try {
        const prompt = `What foods are rich in ${nutrient}?`;
        const foods = await queryLLaMAModel(prompt);

        res.render('nutrient', { nutrient, foods });
    } catch (error) {
        res.status(500).send("Internal server error");
    }
});

// Fetch Yoga Recommendations
app.post('/yoga', async (req, res) => {
    const healthProblem = req.body.healthProblem;
    try {
        const prompt = `Suggest yoga practices that could help relieve symptoms of ${healthProblem}.`;
        const yogaSuggestions = await queryLLaMAModel(prompt);

        res.render('yoga', { healthProblem, yogaSuggestions });
    } catch (error) {
        res.status(500).send("Internal server error");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
