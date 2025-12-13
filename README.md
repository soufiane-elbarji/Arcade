#### ARCADE V.1
#### Video Demo:  <URL HERE>
#### Description:

**Arcade V.1** is a web-based gaming platform built with Python (Flask) and JavaScript. It features a collection of 8 classic retro games, a user authentication system, an experience (EXP) progression system, and a global leaderboard.

> **Note:** This project is designed for Desktop use. A mobile warning overlay prevents play on small touchscreens to ensure the best gameplay experience.

## Overview

The application wraps a retro neon aesthetic around a modern Flask backend. Users can create accounts to save their progress, earning EXP based on their performance across different games. The interface utilizes a "Glassmorphism" design style with animated background lights.

## Features

* **User System:** Secure Register, Login, and Logout functionality.
* **Progression:** Users earn **EXP** (Experience Points) based on game scores.
* **Leaderboard:** A global ranking displaying the top 10 players by total EXP.
* **Admin Panel:** A restricted dashboard (accessible only to the user `admin`) to monitor registered users and traffic.
* **Responsive Design:** optimized for desktop and laptop screens with dynamic scaling.
* **8 Fully Playable Games:** Custom implementations using HTML5 Canvas.

## The Games

1.  **Snake:** The classic reptile adventure. Features 3 difficulty settings (Easy, Normal, Hard) that adjust speed and scoring.
2.  **Tic-Tac-Toe:** Play against a Minimax-powered AI Bot or locally against a friend.
3.  **2048:** Join the numbers and get to the 2048 tile.
4.  **Breakout:** A brick-breaking challenge with score and life tracking.
5.  **Tetris:** The puzzle classic with level progression, line clearing, and a "Next Piece" preview.
6.  **Pac-Man:** A complex recreation featuring map navigation, pellet consumption, and Ghost AI (Chase/Scatter/Frightened modes).
7.  **Flappy Ball:** A physics-based side scroller with neon visuals.
8.  **Minesweeper:** Logic puzzle with Easy (9x9), Medium (16x16), and Hard (20x20) configurations.

## Tech Stack

### Backend
* **Python (Flask):** Handles routing, session management, and game logic integration.
* **CS50 Library:** Manages SQL database interactions.
* **SQLite / PostgreSQL:** Default storage for users and scores (Switchable via `DATABASE_URL`).
* **Werkzeug:** Handles password hashing and security.

### Frontend
* **HTML5 & CSS3:** Custom layout using Flexbox/Grid, CSS variables for neon theming, and glassmorphism effects.
* **JavaScript (ES6):** Handles all game logic, canvas rendering, and async API calls (`fetch`) to submit scores.

## How to play
* Go To this Website [Arcade](https://arcade-bspr.onrender.com/) and create an Account or Login to an existing one and Enjoy
* Or Install it and play on your local machine by following these Steps:
### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/soufiane-elbarji/Arcade.git](https://github.com/soufiane-elbarji/Arcade.git)
    cd Arcade
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Configure Environment (Optional):**
    The app defaults to a local SQLite database (`project.db`). If you want to use a specific secret key or external DB:
    ```bash
    export FLASK_APP=app.py
    export SECRET_KEY='your_secret_key'
    ```

4.  **Run the Application:**
    ```bash
    flask run
    ```

5.  **Access the App:**
    Open your browser and navigate to `http://127.0.0.1:5000`.

## 🗄️ Database Structure

The project uses `project.db` with the following schema:

* **`users`**: Stores `id`, `username`, `hash`, `total_exp`, and `access_count`.
* **`scores`**: Records individual game history linked to `user_id`.

*To initialize or update the database schema, visit the route `/setup_db` after starting the server.*

## 👨‍💻 Admin Access

To access the Admin Panel:
1.  Register a user with the username: **`admin`** (Case insensitive).
2.  Log in with this account.
3.  Navigate to `/admin` to view user statistics.