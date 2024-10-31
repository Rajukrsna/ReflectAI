require('dotenv').config();
const express = require('express');
const session = require('express-session');
const app = express();
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const HealthRecord = require('./models/HealthRecord');
// Import Habit model
const Habit = require('./models/Habit');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const LLaMA_API_URL = process.env.LLAMA_API_URL;
const LLaMA_API_KEY = process.env.LLAMA_API_KEY;
app.use(
    session({
        secret: 'your_secret_key', 
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false } 
    })
);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {

    const nutrientsArray=null
    if (!req.session.healthProblems) {
        req.session.healthProblems = [];
    }
    res.render('index', {
        healthProblems: req.session.healthProblems,
        nutrientsArray,
        habits:[
            
        ]
    });
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
                    "Authorization": `Bearer ${LLaMA_API_KEY}`
                }
            }
        );

        if (response.data && response.data[0] && response.data[0].generated_text) {
            console.log("LLaMA API Response:", response.data);
            return response.data[0].generated_text.trim();
        } else {
            throw new Error("Unexpected response format from LLaMA API.");
        }
    } catch (error) {
        console.error("Error querying LLaMA model:", error);
        throw error;
    }
}

// Analyze Health Problem and return Nutrient Deficiencies
app.post('/analyze', async (req, res) => {
    const healthProblem = req.body.healthProblem;
    req.session.currentHealthProblem = healthProblem;
    if (!req.session.healthProblems) {
        req.session.healthProblems = [];
    }
    req.session.healthProblems.push(healthProblem);

    try {
        const prompt = `List only the nutrient deficiencies or possible causes associated with ${healthProblem}, without explanations or additional information, in a comma-separated format.`;

        const deficienciesText = await queryLLaMAModel(prompt);
        
        // Ensure text truncation starts from 0
      
           // Save health problem and deficiencies to MongoDB
           const record = new HealthRecord({
            healthProblem: healthProblem,
            nutrientDeficiencies: deficienciesText
        });

        await record.save();   
      
        // Render page with updated health problems and deficiencies
        res.render('index', {
            healthProblems: req.session.healthProblems,
            nutrientsArray: deficienciesText ,
            habits:[]// Use consistent naming
        });
          // Save health problem and deficiencies to MongoDB

    } catch (error) {
        res.status(500).send("Internal server error");
    }
});

// Route to remove health problem
app.post('/remove-health-problem', (req, res) => {
    const problemToRemove = req.body.problemToRemove;
    req.session.healthProblems = req.session.healthProblems.filter(
        problem => problem !== problemToRemove
    );

    res.redirect('/');
});

// Fetch Foods Rich in Selected Nutrient
app.get('/nutrient', async (req, res) => {
    try {
        const healthProblem = req.session.currentHealthProblem; // get health problem from query parameter
        const prompt = `List foods beneficial for alleviating ${healthProblem}. For each food, provide only the following details in a list format: Food Name, Available Nutrient, Health Benefits. Do not include additional information.`;

        const foodsText = await queryLLaMAModel(prompt);

        // Parse response assuming it returns in "Food Name: Nutrient - Benefits" format
        const foodsArray = foodsText.split('\n').map(line => {
            const [foodName, nutrientsAndBenefits] = line.split(':').map(item => item.trim());
            const [nutrients, benefits] = nutrientsAndBenefits?.split('-').map(item => item.trim()) || ["", ""];
            return { foodName, nutrients, benefits };
        });
          // Update the dietSuggestions field in MongoDB
          const record =await HealthRecord.findOneAndUpdate(
            { healthProblem: healthProblem }, // Find the record by health problem
            { $set: { dietSuggestions: foodsArray } }, // Set dietSuggestions field with foodsArray
            { new: true, upsert: true } // Create a new record if none exists
        );


        res.render('nutrient', { foods: foodsArray });
    } catch (error) {
        console.error("Error fetching nutrient data:", error);
        res.status(500).send("Internal server error");
    }
});


// Fetch Yoga Recommendations
app.post('/yoga', async (req, res) => {
    const healthProblem = req.session.currentHealthProblem;
    try {
        const prompt = `List yoga practice names that help with symptoms of ${healthProblem}, without any descriptions or additional details.Just the name along with a line of description on how to do that is enough. In the response, dont inclulde the prompt line that i asked you. Just the Yoga recommendation`;
        const YogaSuggestions = await queryLLaMAModel(prompt);
        const record = await HealthRecord.findOneAndUpdate(
            { healthProblem: healthProblem }, // Match the health problem
            { $set: {yogaRecommendations:YogaSuggestions} }, // Update the record with yoga suggestions
            { new: true, upsert: true } // Create a new record if none exists
        );

        res.render('yoga', { healthProblem, YogaSuggestions });
    } catch (error) {
        res.status(500).send("Internal server error");
    }
});

app.get('/generate-report', async (req, res) => {
    try {
        // Fetch health records from MongoDB
        const healthRecords = await HealthRecord.find();

        // Initialize PDF document and file path
        const doc = new PDFDocument();
        const filePath = path.join(__dirname, 'Health_Report.pdf');
        const writeStream = fs.createWriteStream(filePath);

        // Pipe PDF document to file
        doc.pipe(writeStream);

        // Add Title
        doc.fontSize(18).text('Health Report', { align: 'center' });
        doc.moveDown();

        // Check if there are any health records
        if (healthRecords.length === 0) {
            doc.fontSize(14).text("No health records available.", { align: 'center' });
        } else {
            // Loop through records and add to PDF
            healthRecords.forEach(record => {
                doc.fontSize(14).text(`Health Problem: ${record.healthProblem}`);
                doc.fontSize(12).text(`Nutrient Deficiencies: ${record.nutrientDeficiencies?.join(', ') || 'None'}`);
                doc.text(`Diet Suggestions: ${record.dietSuggestions || 'None'}`);
                doc.text(`Yoga Recommendations: ${record.yogaRecommendations?.join(', ') || 'None'}`);
                doc.moveDown();
            });
        }

        doc.end();

        // Wait until PDF is fully written to file
        writeStream.on('finish', () => {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="Health_Report.pdf"');

            res.download(filePath, 'Health_Report.pdf', (err) => {
                if (err) {
                    console.error("Error downloading PDF:", err);
                    return res.status(500).send("Error downloading report");
                }
                // Delete file after download
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) console.error("Error deleting PDF after download:", unlinkErr);
                });
            });
        });

        // Handle write stream error
        writeStream.on('error', (error) => {
            console.error("Error writing PDF:", error);
            res.status(500).send("Error generating PDF report");
        });

    } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).send("Error generating report");
    }
});





// Route to render the habit tracking page
app.get('/habits', async (req, res) => {
    try {
        const habits = await Habit.find();
        const totalHabits = habits.length;

        // Calculate number of completed habits for today
        const today = new Date().toDateString();
        const completedHabitsToday = habits.filter(habit => new Date(habit.lastCompletedDate).toDateString() === today).length;

        // Each habit completion contributes 1% to the health improvement
        const healthImprovement = totalHabits > 0 ? (completedHabitsToday / totalHabits) * 100 : 0;

        res.render('habit', { habits, healthImprovement });
    } catch (error) {
        console.error("Error retrieving habits:", error);
        res.status(500).send("Error retrieving habits.");
    }
});


// Route to mark habit as complete
app.post('/complete-habit', async (req, res) => {
    const { habitId } = req.body;
    try {
        const habit = await Habit.findById(habitId);
        const today = new Date();
        const lastCompleted = new Date(habit.lastCompletedDate);

        // Only increment days followed if not already completed today
        if (today.toDateString() !== lastCompleted.toDateString()) {
            habit.daysFollowed += 1;
            habit.lastCompletedDate = today;
            await habit.save();
        }

        res.redirect('/habits');
    } catch (error) {
        console.error("Error completing habit:", error);
        res.status(500).send("Error completing habit.");
    }
});
app.post('/add-habit', async (req, res) => {
    const { name, priority, description } = req.body;
    try {
        const newHabit = new Habit({
            name,
            priority,
            description,
            daysFollowed: 1, // Start with 1 day followed
            lastCompletedDate: new Date() // Initialize with today's date
        });
        
        await newHabit.save();

        // Ensure req.session.habits is initialized
        if (!req.session.habits) {
            req.session.habits = [];
        }


        // Add the new habit to the session if it doesn't already exist
        if (newHabit && !req.session.habits.find(h => h._id.toString() === habit._id.toString())) {
            req.session.habits.push(newHabit);
        }

        res.redirect('/habits');
    } catch (error) {
        console.error("Error adding habit:", error);
        res.status(500).send("Error adding habit.");
    }
});

app.post('/delete-habit', async (req, res) => {
    const habitId = req.body.habitId;
    try {
        await Habit.findByIdAndDelete(habitId);
        res.redirect('/habits'); // Redirect back to the habits page after deletion
    } catch (error) {
        console.error("Error deleting habit:", error);
        res.status(500).send("Error deleting habit.");
    }
});


// Function to calculate health improvement percentage
function calculateHealthImprovement(habits) {
    let completedDays = habits.reduce((total, habit) => total + habit.daysFollowed, 0);
    return Math.min(completedDays, 100);  // Cap at 100%
}


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
