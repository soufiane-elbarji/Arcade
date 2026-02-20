import os
from cs50 import SQL
from flask import Flask, flash, redirect, render_template, request, session
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
from helpers import login_required

# Configure application
app = Flask(__name__)

# --- CONFIG: Security & Sessions ---
app.secret_key = os.environ.get("SECRET_KEY", "dev_key_for_testing")
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# --- CONFIG: Database ---
uri = os.environ.get("DATABASE_URL")
if uri:
    if uri.startswith("postgres://"):
        uri = uri.replace("postgres://", "postgresql://")
    db = SQL(uri)
else:
    db = SQL("sqlite:///project.db")

# --- No-Cache Helper ---
@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response

# --- ROUTES ---

@app.route("/")
@login_required
def index():
    user_data = db.execute("SELECT username, total_exp FROM users WHERE id = ?", session["user_id"])
    
    if not user_data:
        session.clear()
        return redirect("/login")
        
    return render_template("index.html", username=user_data[0]["username"], exp=user_data[0]["total_exp"])

@app.route("/login", methods=["GET", "POST"])
def login():
    session.clear()
    if request.method == "POST":
        if not request.form.get("username"):
            return render_template("login.html", error="Must provide username")
        elif not request.form.get("password"):
            return render_template("login.html", error="Must provide password")

        # 1. Force lowercase
        username = request.form.get("username").lower()

        rows = db.execute("SELECT * FROM users WHERE username = ?", username)

        if len(rows) != 1 or not check_password_hash(rows[0]["hash"], request.form.get("password")):
            return render_template("login.html", error="Invalid username and/or password")

        session["user_id"] = rows[0]["id"]
        
        # 2. Increment Access Count
        # We use try/except in case the column hasn't been added yet (safety check)
        try:
            db.execute("UPDATE users SET access_count = access_count + 1 WHERE id = ?", rows[0]["id"])
        except Exception:
            pass # Old DB version, ignore count update

        return redirect("/")
    else:
        return render_template("login.html")

@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        # 1. Force lowercase
        username = request.form.get("username").lower() if request.form.get("username") else None
        password = request.form.get("password")
        confirmation = request.form.get("confirmation")

        if not username or not password:
            return render_template("register.html", error="Missing fields")
        if password != confirmation:
            return render_template("register.html", error="Passwords do not match")

        # Check existing user
        rows = db.execute("SELECT * FROM users WHERE username = ?", username)
        if len(rows) > 0:
            return render_template("register.html", error="Username already taken")

        # Insert new user
        hash_pw = generate_password_hash(password)
        try:
            # 2. Set initial access_count to 1
            # Note: If this fails (old DB), it falls back to the EXCEPT block
            db.execute("INSERT INTO users (username, hash, access_count) VALUES (?, ?, 1)", username, hash_pw)
        except Exception:
            # Fallback for old databases without access_count column
            try:
                db.execute("INSERT INTO users (username, hash) VALUES (?, ?)", username, hash_pw)
            except:
                return render_template("register.html", error="Error creating user")

        # Log in
        rows = db.execute("SELECT * FROM users WHERE username = ?", username)
        session["user_id"] = rows[0]["id"]
        return redirect("/")
    else:
        return render_template("register.html")

# --- ADMIN ROUTE ---
@app.route("/admin")
@login_required
def admin():
    # 1. Get current user
    user_rows = db.execute("SELECT username FROM users WHERE id = ?", session["user_id"])
    if not user_rows:
        return redirect("/")

    # 2. Check if admin (lowercase)
    # You MUST register a user named "admin" to see this page
    if user_rows[0]["username"] != "admin":
        return render_template("index.html") # Or redirect to home
        
    # 3. Get stats (Handle case where access_count might be missing)
    try:
        all_users = db.execute("SELECT * FROM users ORDER BY access_count DESC")
    except Exception:
        # Fallback if column missing
        all_users = db.execute("SELECT * FROM users")
        
    return render_template("admin.html", users=all_users)

# --- GAME ROUTES ---
@app.route("/game/snake")
@login_required
def snake(): return render_template("snake.html")

@app.route("/game/tictactoe")
@login_required
def tictactoe(): return render_template("tictactoe.html")

@app.route("/game/2048")
@login_required
def game_2048(): return render_template("2048.html")

@app.route("/game/breakout")
@login_required
def breakout(): return render_template("breakout.html")

@app.route("/game/tetris")
@login_required
def tetris(): return render_template("tetris.html")

@app.route("/game/pacman")
@login_required
def pacman(): return render_template("pacman.html")

@app.route("/game/flappyball")
@login_required
def flappyball(): return render_template("flappyball.html")

@app.route("/game/minesweeper")
@login_required
def minesweeper(): return render_template("minesweeper.html")

# --- API ROUTES ---
@app.route("/api/submit_score", methods=["POST"])
@login_required
def submit_score():
    data = request.json
    game_name = data.get("game_name")
    score = data.get("score")
    user_id = session["user_id"]

    if not game_name or score is None:
        return ({"success": False, "error": "Invalid data"}), 400

    # Insert score
    db.execute("INSERT INTO scores (user_id, game_name, score) VALUES (?, ?, ?)", user_id, game_name, score)

    # Calculate EXP
    exp_gained = 0
    if game_name == 'snake': exp_gained = int(score)
    elif game_name == 'tictactoe': exp_gained = int(score) * 50
    elif game_name == '2048': exp_gained = int(score / 10)
    elif game_name == 'breakout': exp_gained = int(score / 2)
    elif game_name == 'tetris': exp_gained = int(score / 10)
    elif game_name == 'pacman': exp_gained = int(score / 5)
    elif game_name == 'flappyball': exp_gained = int(score) * 5
    elif game_name == 'minesweeper': exp_gained = int(score)

    db.execute("UPDATE users SET total_exp = total_exp + ? WHERE id = ?", exp_gained, user_id)
    
    user_data = db.execute("SELECT username, total_exp FROM users WHERE id = ?", user_id)
    return ({"success": True, "username": user_data[0]["username"], "new_exp": user_data[0]["total_exp"]}), 200

@app.route("/leaderboard")
@login_required
def leaderboard():
    top_users = db.execute("SELECT username, total_exp FROM users ORDER BY total_exp DESC LIMIT 10")
    return render_template("leaderboard.html", top_users=top_users)