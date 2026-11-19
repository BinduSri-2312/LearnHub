
import getpass
from werkzeug.security import generate_password_hash
from database import get_db_connection

name = input("Enter admin name: ").strip()
email = input("Enter admin email: ").strip().lower()
password = getpass.getpass("Enter admin password: ")

if not name or not email or len(password) < 8:
    print("Invalid details. Password must contain at least 8 characters.")
    raise SystemExit

connection = None

try:
    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT user_id FROM users WHERE email = ?",
        (email,)
    )

    if cursor.fetchone():
        print("This email is already registered. Use another email.")
    else:
        hashed_password = generate_password_hash(password)

        cursor.execute(
            """INSERT INTO users (name, email, password, role)
               VALUES (?, ?, ?, 'admin')""",
            (name, email, hashed_password)
        )

        connection.commit()
        print("Admin account created successfully!")

except Exception as error:
    if connection:
        connection.rollback()
    print("Error:", error)

finally:
    if connection:
        connection.close()