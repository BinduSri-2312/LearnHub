
import os
from flask import Flask, send_from_directory
from database import get_db_connection
from config import Config

from routes.auth import auth_bp
from routes.admin import admin_bp
from routes.student import student_bp

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.abspath(
    os.path.join(BASE_DIR, "..", "LearnHub-Frontend")
)

app = Flask(__name__)
app.config.from_object(Config)

app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(admin_bp, url_prefix="/api/admin")
app.register_blueprint(student_bp, url_prefix="/api/student")


# Frontend pages
@app.route("/")
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>")
def frontend_files(filename):
    return send_from_directory(FRONTEND_DIR, filename)


# Health check
@app.route("/health")
def health():
    return {"status": "success", "message": "LearnHub is running!"}


if __name__ == "__main__":
    app.run(debug=False, port=5000)