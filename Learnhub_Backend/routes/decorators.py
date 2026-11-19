from functools import wraps
from flask import session, jsonify

def role_required(required_role):

    def decorator(function):

        @wraps(function)
        def wrapper(*args, **kwargs):

            if 'user_id' not in session:
                return jsonify({
                    "status": "error",
                    "message": "Please login first"
                }), 401

            if session.get('role') != required_role:
                return jsonify({
                    "status": "error",
                    "message": "Access denied"
                }), 403

            return function(*args, **kwargs)

        return wrapper

    return decorator