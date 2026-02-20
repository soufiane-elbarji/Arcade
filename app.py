import os
import psycopg2
import psycopg2.extras
from urllib.parse import urlparse
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
if uri and uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://")

def get_db_connection():
    conn = psycopg2.connect(uri)
    return conn

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
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("SELECT username, total_exp FROM users WHERE id = %s", (session["user_id"],))
        user_data = cur.fetchall()
        
        if not user_data:
            session.clear()
            return redirect("/login")
            
        return render_template("index.html", username=user_data[0]["username"], exp=user_data[0]["total_exp"])
    finally:
        cur.close()
        conn.close()

@app.route("/login", methods=["GET", "POST"])
def login():
    session.clear()
    if request.method == "POST":
        if not request.form.get("username"):
            return render_template("login.html", error="Must provide username")
        elif not request.form.get("password"):
            return render_template("login.html", error="Must provide password")

        username = request.form.get("username").lower()

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        try:
            cur.execute("SELECT * FROM users WHERE username = %s", (username,))
            rows = cur.fetchall()

            if len(rows) != 1 or not check_password_hash(rows[0]["hash"], request.form.get("password")):
                return render_template("login.html", error="Invalid username and/or password")

            session["user_id"] = rows[0]["id"]
            
            # Increment Access Count
            cur.execute("UPDATE users SET access_count = access_count + 1 WHERE id = %s", (rows[0]["id"],))
            conn.commit()

            return redirect("/")
        except Exception as e:
            conn.rollback()
            return render_template("login.html", error="An error occurred.")
        finally:
            cur.close()
            conn.close()
    else:
        return render_template("login.html")

@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username").lower() if request.form.get("username") else None
        password = request.form.get("password")
        confirmation = request.form.get("confirmation")

        if not username or not password:
            return render_template("register.html", error="Missing fields")
        if password != confirmation:
            return render_template("register.html", error="Passwords do not match")

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        try:
            # Check existing user
            cur.execute("SELECT * FROM users WHERE username = %s", (username,))
            rows = cur.fetchall()
            if len(rows) > 0:
                return render_template("register.html", error="Username already taken")

            # Insert new user
            hash_pw = generate_password_hash(password)
            cur.execute("INSERT INTO users (username, hash, access_count) VALUES (%s, %s, 1)", (username, hash_pw))
            conn.commit()

            # Log in
            cur.execute("SELECT * FROM users WHERE username = %s", (username,))
            rows = cur.fetchall()
            session["user_id"] = rows[0]["id"]
            
            return redirect("/")
        except Exception as e:
            conn.rollback()
            return render_template("register.html", error="Error creating user.")
        finally:
            cur.close()
            conn.close()
    else:
        return render_template("register.html")

# --- ADMIN ROUTE ---
@app.route("/admin")
@login_required
def admin():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("SELECT username FROM users WHERE id = %s", (session["user_id"],))
        user_rows = cur.fetchall()
        
        if not user_rows:
            return redirect("/")

        if user_rows[0]["username"] != "admin":
            return render_template("index.html")
            
        cur.execute("SELECT * FROM users ORDER BY access_count DESC")
        all_users = cur.fetchall()
            
        return render_template("admin.html", users=all_users)
    finally:
        cur.close()
        conn.close()

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

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        # Insert score
        cur.execute("INSERT INTO scores (user_id, game_name, score) VALUES (%s, %s, %s)", (user_id, game_name, score))

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

        cur.execute("UPDATE users SET total_exp = total_exp + %s WHERE id = %s", (exp_gained, user_id))
        conn.commit()
        
        cur.execute("SELECT username, total_exp FROM users WHERE id = %s", (user_id,))
        user_data = cur.fetchall()
        
        return ({"success": True, "username": user_data[0]["username"], "new_exp": user_data[0]["total_exp"]}), 200
    except Exception as e:
        conn.rollback()
        return ({"success": False, "error": "Database error"}), 500
    finally:
        cur.close()
        conn.close()

@app.route("/leaderboard")
@login_required
def leaderboard():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute("SELECT username, total_exp FROM users ORDER BY total_exp DESC LIMIT 10")
        top_users = cur.fetchall()
        return render_template("leaderboard.html", top_users=top_users)
    finally:
        cur.close()
        conn.close()