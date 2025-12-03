import os
from cs50 import SQL
from flask import Flask, flash, redirect, render_template, request, session
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
from helpers import login_required

# Configure application
app = Flask(__name__)

# --- CONFIG CHANGE 1: Security ---
# You need a secret key for secure sessions
app.secret_key = os.environ.get("SECRET_KEY", "dev_key_for_testing")

# --- CONFIG CHANGE 2: Sessions ---
# We switch to "filesystem" only if we are local, otherwise use Cookies (better for free hosting)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# --- DATABASE SETUP (The Big Change) ---
# This checks: Is there a database online? If yes, use it. If no, use local file.
uri = os.environ.get("DATABASE_URL")
if uri:
    if uri.startswith("postgres://"):
        uri = uri.replace("postgres://", "postgresql://")
    db = SQL(uri)
else:
    db = SQL("sqlite:///project.db")
    

# --- After Request Handler to Disable Caching ---
@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response

# --- Authentication Routes ---

@app.route("/") # Home route
@login_required
def index():
    """Show game portal"""
    try:
        db = get_db()
        user_data = db.execute("SELECT username, total_exp FROM users WHERE id = ?", (session["user_id"],)).fetchone()
        
        if user_data is None:
            # User in session but not in DB, clear session
            session.clear()
            return redirect("/login")
            
        return render_template("index.html", username=user_data["username"], exp=user_data["total_exp"])
    except (IndexError, TypeError):
        # Handle case where user might be in session but deleted from DB
        session.clear()
        return redirect("/login")


@app.route("/login", methods=["GET", "POST"]) # Login route
def login():
    """Log user in"""
    # Forget any user_id
    session.clear()

    if request.method == "POST":
        # Ensure username was submitted
        if not request.form.get("username"):
            return render_template("login.html", error="Must provide username")

        # Ensure password was submitted
        elif not request.form.get("password"):
            return render_template("login.html", error="Must provide password")

        # Query database for username
        db = get_db()
        rows = db.execute("SELECT * FROM users WHERE username = ?", (request.form.get("username"),)).fetchall()

        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(rows[0]["hash"], request.form.get("password")):
            return render_template("login.html", error="Invalid username and/or password")

        # Remember which user has logged in
        session["user_id"] = rows[0]["id"]

        # Redirect user to home page
        return redirect("/")

    else:
        return render_template("login.html")


@app.route("/logout") # Logout route
def logout():
    """Log user out"""
    session.clear()
    return redirect("/")


@app.route("/register", methods=["GET", "POST"]) # Registration route
def register():
    """Register user"""
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        confirmation = request.form.get("confirmation")

        # Validation
        if not username:
            return render_template("register.html", error="Must provide username")
        elif not password:
            return render_template("register.html", error="Must provide password")
        elif password != confirmation:
            return render_template("register.html", error="Passwords do not match")

        # Check if username already exists
        db = get_db()
        rows = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchall()
        if len(rows) > 0:
            return render_template("register.html", error="Username already taken")

        # Insert new user into database
        hash_pw = generate_password_hash(password)
        try:
            db.execute("INSERT INTO users (username, hash) VALUES (?, ?)", (username, hash_pw))
            db.commit()
        except sqlite3.IntegrityError:
            return render_template("register.html", error="Username already taken")

        # Log the user in automatically
        rows = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchall()
        session["user_id"] = rows[0]["id"]

        return redirect("/")

    else:
        return render_template("register.html")

# --- Game Routes ---

@app.route("/game/snake") # Snake game route
@login_required
def snake():
    """Show Snake game page"""
    return render_template("snake.html")

@app.route("/game/tictactoe") # Tic-Tac-Toe game route
@login_required
def tictactoe():
    """Show Tic-Tac-Toe game page"""
    return render_template("tictactoe.html")

@app.route("/game/2048") # 2048 game route
@login_required
def game_2048():
    """Show 2048 game page"""
    return render_template("2048.html")

@app.route("/game/breakout") # Breakout game route
@login_required
def breakout():
    """Show Breakout game page"""
    return render_template("breakout.html")

@app.route("/game/tetris") # Tetris game route
@login_required
def tetris():
    """Show Tetris game page"""
    return render_template("tetris.html")

@app.route("/game/pacman") # Pac-Man game route
@login_required
def pacman():
    """Show Pac-Man game page"""
    return render_template("pacman.html")

@app.route("/game/flappyball") # Updated Flappy Ball route
@login_required
def flappyball():
    """Show Flappy Ball game page"""
    return render_template("flappyball.html")

@app.route("/game/minesweeper") # NEW Minesweeper route
@login_required
def minesweeper():
    """Show Minesweeper game page"""
    return render_template("minesweeper.html")


# --- API Routes ---

@app.route("/api/submit_score", methods=["POST"]) # Submit score route
@login_required
def submit_score():
    """Allow user to submit a score from a game"""
    data = request.json
    
    game_name = data.get("game_name")
    score = data.get("score")
    user_id = session["user_id"]

    if not game_name or score is None:
        return ({"success": False, "error": "Invalid data"}), 400

    db = get_db()

    # Insert the score
    db.execute(
        "INSERT INTO scores (user_id, game_name, score) VALUES (?, ?, ?)",
        (user_id, game_name, score)
    )

    # Update user's total EXP
    exp_gained = 0
    if game_name == 'snake':
        exp_gained = int(score) # 1 EXP per point in Snake
    elif game_name == 'tictactoe':
        exp_gained = int(score) * 50 # 50 EXP for a win (score=1)
    elif game_name == '2048':
        exp_gained = int(score / 10) # 1 EXP per 10 points in 2048
    elif game_name == 'breakout':
        exp_gained = int(score / 2) # 1 EXP per 2 points in Breakout
    elif game_name == 'tetris':
        exp_gained = int(score / 10) # 1 EXP per 10 points in Tetris
    elif game_name == 'pacman':
        exp_gained = int(score / 5) # 1 EXP per 5 points in Pac-Man
    elif game_name == 'flappyball':
        exp_gained = int(score) * 5 # 5 EXP per point in Flappy Ball
    elif game_name == 'minesweeper':
        exp_gained = int(score) # 1 EXP per cleared cell in Minesweeper
        
    db.execute(
        "UPDATE users SET total_exp = total_exp + ? WHERE id = ?",
        (exp_gained, user_id)
    )
    
    # Commit both database changes
    db.commit()
    
    # Get new total EXP and username to send back
    user_data = db.execute("SELECT username, total_exp FROM users WHERE id = ?", (user_id,)).fetchone()

    return ({"success": True, "username": user_data["username"], "new_exp": user_data["total_exp"]}), 200


@app.route("/leaderboard") # Leaderboard route
@login_required
def leaderboard():
    """Show leaderboards"""
    
    db = get_db()
    # Get top 10 users by total EXP
    top_users = db.execute(
        "SELECT username, total_exp FROM users ORDER BY total_exp DESC LIMIT 10"
    ).fetchall()

    return render_template("leaderboard.html", top_users=top_users)
