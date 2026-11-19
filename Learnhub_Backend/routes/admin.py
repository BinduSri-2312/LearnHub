
from flask import Blueprint, jsonify, session, request, current_app
from routes.decorators import role_required
from database import get_db_connection
from werkzeug.utils import secure_filename
import os

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/dashboard', methods=['GET'])
@role_required('admin')
def dashboard():
    return jsonify({
        "status": "success",
        "message": "Welcome to Admin Dashboard",
        "user_id": session['user_id'],
        "role": session['role']
    })


@admin_bp.route('/stats', methods=['GET'])
@role_required('admin')
def get_admin_stats():
    connection = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'student'")
        total_students = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM courses")
        total_courses = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM enrollments")
        total_enrollments = cursor.fetchone()[0]

        return jsonify({
            "status": "success",
            "total_students": total_students,
            "total_courses": total_courses,
            "total_enrollments": total_enrollments
        })

    except Exception:
        return jsonify({
            "status": "error",
            "message": "Unable to fetch dashboard statistics"
        }), 500

    finally:
        if connection:
            connection.close()


# ---------------- COURSE MANAGEMENT ----------------

@admin_bp.route('/courses', methods=['GET'])
@role_required('admin')
def get_courses():
    connection = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT course_id, title, description,
                   instructor, duration, created_at
            FROM courses
            ORDER BY course_id DESC
        """)

        courses = cursor.fetchall()

        course_list = []

        for course in courses:
            course_list.append({
                "course_id": course[0],
                "title": course[1],
                "description": course[2],
                "instructor": course[3],
                "duration": course[4],
                "created_at": str(course[5])
            })

        return jsonify({
            "status": "success",
            "courses": course_list
        })

    except Exception:
        return jsonify({
            "status": "error",
            "message": "Unable to fetch courses"
        }), 500

    finally:
        if connection:
            connection.close()


@admin_bp.route('/courses', methods=['POST'])
@role_required('admin')
def add_course():
    data = request.get_json(silent=True) or {}

    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    instructor = data.get('instructor', '').strip()
    duration = data.get('duration', '').strip()

    if not title or not instructor or not duration:
        return jsonify({
            "status": "error",
            "message": "Title, instructor and duration are required"
        }), 400

    connection = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO courses (title, description, instructor, duration)
            VALUES (?, ?, ?, ?)
        """, (title, description, instructor, duration))

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Course added successfully",
            "course_id": cursor.lastrowid
        }), 201

    except Exception:
        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": "Unable to add course"
        }), 500

    finally:
        if connection:
            connection.close()


@admin_bp.route('/courses/<int:course_id>', methods=['PUT'])
@role_required('admin')
def update_course(course_id):
    data = request.get_json(silent=True) or {}

    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    instructor = data.get('instructor', '').strip()
    duration = data.get('duration', '').strip()

    if not title or not instructor or not duration:
        return jsonify({
            "status": "error",
            "message": "Title, instructor and duration are required"
        }), 400

    connection = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE courses
            SET title = ?,
                description = ?,
                instructor = ?,
                duration = ?
            WHERE course_id = ?
        """, (title, description, instructor, duration, course_id))

        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({
                "status": "error",
                "message": "Course not found or no changes made"
            }), 404

        return jsonify({
            "status": "success",
            "message": "Course updated successfully"
        })

    except Exception:
        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": "Unable to update course"
        }), 500

    finally:
        if connection:
            connection.close()


@admin_bp.route('/courses/<int:course_id>', methods=['DELETE'])
@role_required('admin')
def delete_course(course_id):
    connection = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            "DELETE FROM courses WHERE course_id = ?",
            (course_id,)
        )

        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({
                "status": "error",
                "message": "Course not found"
            }), 404

        return jsonify({
            "status": "success",
            "message": "Course deleted successfully"
        })

    except Exception:
        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": "Unable to delete course"
        }), 500

    finally:
        if connection:
            connection.close()


# ---------------- STUDENT MANAGEMENT ----------------

@admin_bp.route('/students', methods=['GET'])
@role_required('admin')
def get_students():
    connection = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                u.user_id,
                u.name,
                u.email,
                u.created_at,
                COUNT(e.enrollment_id) AS total_courses
            FROM users u
            LEFT JOIN enrollments e ON u.user_id = e.user_id
            WHERE u.role = 'student'
            GROUP BY u.user_id, u.name, u.email, u.created_at
            ORDER BY u.user_id DESC
        """)

        students = cursor.fetchall()

        student_list = []

        for student in students:
            student_list.append({
                "user_id": student[0],
                "name": student[1],
                "email": student[2],
                "created_at": str(student[3]),
                "total_courses": student[4]
            })

        return jsonify({
            "status": "success",
            "students": student_list
        })

    except Exception:
        return jsonify({
            "status": "error",
            "message": "Unable to fetch students"
        }), 500

    finally:
        if connection:
            connection.close()


@admin_bp.route('/students/<int:user_id>', methods=['DELETE'])
@role_required('admin')
def delete_student(user_id):
    connection = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            DELETE FROM users
            WHERE user_id = ? AND role = 'student'
        """, (user_id,))

        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({
                "status": "error",
                "message": "Student not found"
            }), 404

        return jsonify({
            "status": "success",
            "message": "Student deleted successfully"
        })

    except Exception:
        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": "Unable to delete student"
        }), 500

    finally:
        if connection:
            connection.close()


# ================= COURSE MATERIAL MANAGEMENT =================

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'}


def allowed_file(filename):
    return (
        '.' in filename and
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    )


@admin_bp.route('/materials', methods=['GET', 'POST'])
@role_required('admin')
def upload_material():

        if request.method == 'GET':
            connection = None

        try:
            connection = get_db_connection()
            cursor = connection.cursor()

            cursor.execute("""
                SELECT
                    m.material_id,
                    m.title,
                    m.file_path,
                    m.uploaded_at,
                    m.course_id,
                    c.title AS course_title
                FROM materials m
                JOIN courses c ON m.course_id = c.course_id
                ORDER BY m.material_id DESC
            """)

            materials = [dict(row) for row in cursor.fetchall()]

            return jsonify({
                "status": "success",
                "materials": materials
            }), 200

        except Exception:
            return jsonify({
                "status": "error",
                "message": "Unable to fetch materials"
            }), 500

        finally:
            if connection:
                connection.close()

      