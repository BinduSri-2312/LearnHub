
from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db_connection

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():

    data = request.get_json(silent=True) or {}

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({
            "status": "error",
            "message": "All fields are required"
        }), 400

    if len(password) < 8:
        return jsonify({
            "status": "error",
            "message": "Password must contain at least 8 characters"
        }), 400

    connection = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT user_id FROM users WHERE email = ?",
            (email,)
        )

        if cursor.fetchone():
            return jsonify({
                "status": "error",
                "message": "Email already registered"
            }), 409

        hashed_password = generate_password_hash(password)

        cursor.execute(
            """
            INSERT INTO users (name, email, password, role)
            VALUES (?, ?, ?, 'student')
            """,
            (name, email, hashed_password)
        )

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Registration successful"
        }), 201

    except Exception:
        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": "Registration failed"
        }), 500

    finally:
        if connection:
            connection.close()


@auth_bp.route('/login', methods=['POST'])
def login():

    data = request.get_json(silent=True) or {}

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({
            "status": "error",
            "message": "Email and password are required"
        }), 400

    connection = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT user_id, name, email, password, role
            FROM users
            WHERE email = ?
            """,
            (email,)
        )

        user = cursor.fetchone()

        if not user or not check_password_hash(
            user['password'], password
        ):
            return jsonify({
                "status": "error",
                "message": "Invalid email or password"
            }), 401

        session.clear()
        session['user_id'] = user['user_id']
        session['role'] = user['role']

        if user['role'] == 'admin':
            redirect_url = '/admin/dashboard.html'
        else:
            redirect_url = '/student/dashboard.html'

        return jsonify({
            "status": "success",
            "message": "Login successful",
            "user": {
                "user_id": user['user_id'],
                "name": user['name'],
                "email": user['email'],
                "role": user['role']
            },
            "redirect": redirect_url
        }), 200

    except Exception:
        return jsonify({
            "status": "error",
            "message": "Login failed. Please try again."
        }), 500

    finally:
        if connection:
            connection.close()


# ================= ADMIN PASSWORD CHANGE =================

@auth_bp.route('/admin/change-password', methods=['POST'])
def change_admin_password():

    if 'user_id' not in session or session.get('role') != 'admin':
        return jsonify({
            "status": "error",
            "message": "Admin login required"
        }), 401

    data = request.get_json(silent=True) or {}

    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    confirm_password = data.get('confirm_password', '')

    if not current_password or not new_password or not confirm_password:
        return jsonify({
            "status": "error",
            "message": "All fields are required"
        }), 400

    if len(new_password) < 12:
        return jsonify({
            "status": "error",
            "message": "New password must contain at least 12 characters"
        }), 400

    if new_password != confirm_password:
        return jsonify({
            "status": "error",
            "message": "New passwords do not match"
        }), 400

    if current_password == new_password:
        return jsonify({
            "status": "error",
            "message": "New password must be different from current password"
        }), 400

    connection = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT password
            FROM users
            WHERE user_id = ? AND role = 'admin'
            """,
            (session['user_id'],)
        )

        admin = cursor.fetchone()

        if not admin or not check_password_hash(
            admin['password'], current_password
        ):
            return jsonify({
                "status": "error",
                "message": "Current password is incorrect"
            }), 400

        hashed_password = generate_password_hash(new_password)

        cursor.execute(
            """
            UPDATE users
            SET password = ?
            WHERE user_id = ? AND role = 'admin'
            """,
            (hashed_password, session['user_id'])
        )

        connection.commit()

        session.clear()

        return jsonify({
            "status": "success",
            "message": "Password changed successfully. Please log in again."
        }), 200

    except Exception:
        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": "Unable to change password. Please try again."
        }), 500

    finally:
        if connection:
            connection.close()


@auth_bp.route('/logout', methods=['POST'])
def logout():

    session.clear()

    return jsonify({
        "status": "success",
        "message": "Logged out successfully"
    }), 200

# ================= FORGOT PASSWORD =================

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():

    data = request.get_json(silent=True) or {}

    email = data.get('email', '').strip().lower()
    new_password = data.get('new_password', '')
    confirm_password = data.get('confirm_password', '')

    if not email or not new_password or not confirm_password:
        return jsonify({
            "status": "error",
            "message": "All fields are required"
        }), 400

    if len(new_password) < 8:
        return jsonify({
            "status": "error",
            "message": "Password must contain at least 8 characters"
        }), 400

    if new_password != confirm_password:
        return jsonify({
            "status": "error",
            "message": "Passwords do not match"
        }), 400

    connection = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT user_id FROM users WHERE email = ?",
            (email,)
        )

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "status": "error",
                "message": "Email address not found"
            }), 404

        hashed_password = generate_password_hash(new_password)

        cursor.execute(
            "UPDATE users SET password = ? WHERE email = ?",
            (hashed_password, email)
        )

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Password reset successfully. Please log in."
        }), 200

    except Exception:
        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": "Unable to reset password. Please try again."
        }), 500

    finally:
        if connection:
            connection.close()
