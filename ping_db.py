import os
import psycopg2

def keep_alive():

    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        print("Error: DATABASE_URL not found.")
        return

    try:

        conn = psycopg2.connect(db_url)
        cur = conn.cursor()

        cur.execute("SELECT 1;")
        result = cur.fetchone()
        
        print(f"Success! Database pinged. Result: {result}")

        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Failed to connect or query the database: {e}")

if __name__ == "__main__":
    keep_alive()