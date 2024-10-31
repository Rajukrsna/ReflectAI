# ReflectAI

ReflectAI is a health and wellness web application designed to help users track their health problems, nutrient deficiencies, and habits. The application provides recommendations for diet and yoga practices based on the user's health concerns.

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Features
- Analyze health problems and identify nutrient deficiencies.
- Get food recommendations rich in specific nutrients.
- Receive yoga recommendations based on health issues.
- Track daily habits and monitor health improvements.
- Generate a comprehensive health report in PDF format.

## Technologies Used
- **Node.js**: JavaScript runtime for server-side applications.
- **Express.js**: Web framework for Node.js.
- **MongoDB**: NoSQL database for storing health records and habits.
- **EJS**: Template engine for rendering HTML views.
- **PDFKit**: Library for generating PDF documents.
- **Axios**: Promise-based HTTP client for making API requests.

## Getting Started

### Prerequisites
- Node.js installed on your machine.
- MongoDB database set up and running.
- Create a `.env` file in the root directory with the following variables:
- 
### Step 2: Install Dependencies

Run the following command to install the required dependencies:

`npm install express express-session mongoose dotenv axios pdfkit ejs`

### Step 3: Set Up Environment Variables

Create a `.env` file in the root directory and add the following variables:

`MONGO_URI=<your_mongo_db_connection_string>
LLAMA_API_URL=<your_llama_api_url>
LLAMA_API_KEY=<your_llama_api_key>`

### Step 4: Start the Server

Run the following command to start the server:

`node server.js`

The server will be running on `http://localhost:3000`.

API Endpoints
-------------

### 1\. Home Route

-   **GET** `/`
-   Renders the home page with options to analyze health problems and track habits.

### 2\. Analyze Health Problem

-   **POST** `/analyze`
-   Body: `{ "healthProblem": "your_health_problem" }`
-   Analyzes the provided health problem and returns nutrient deficiencies.

### 3\. Remove Health Problem

-   **POST** `/remove-health-problem`
-   Body: `{ "problemToRemove": "health_problem_to_remove" }`
-   Removes the specified health problem from the session.

### 4\. Fetch Foods Rich in Selected Nutrient

-   **GET** `/nutrient`
-   Returns foods beneficial for the currently selected health problem.

### 5\. Fetch Yoga Recommendations

-   **POST** `/yoga`
-   Returns yoga practices that help with symptoms of the currently selected health problem.

### 6\. Generate Health Report

-   **GET** `/generate-report`
-   Generates and downloads a PDF report of health records.

### 7\. Habit Tracking Page

-   **GET** `/habits`
-   Displays a list of habits and health improvement metrics.

### 8\. Mark Habit as Complete

-   **POST** `/complete-habit`
-   Body: `{ "habitId": "id_of_habit" }`
-   Marks a habit as completed for the day.

### 9\. Add Habit

-   **POST** `/add-habit`
-   Body: `{ "name": "habit_name", "priority": "habit_priority", "description": "habit_description" }`
-   Adds a new habit to the habit tracker.

### 10\. Delete Habit

-   **POST** `/delete-habit`
-   Body: `{ "habitId": "id_of_habit" }`
-   Deletes the specified habit from the habit tracker.

License
-------

This project is licensed under the MIT License.

Acknowledgments
---------------

-   Inspired by various health and wellness applications.

 `Feel free to modify any part of it according to your specific needs!`

