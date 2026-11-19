
from flask import Blueprint, jsonify, session, current_app, send_from_directory
from database import get_db_connection
from routes.decorators import role_required
import os

student_bp = Blueprint('student', __name__)


# STUDENT DASHBOARD
@student_bp.route('/dashboard', methods=['GET'])
@role_required('student')
def dashboard():
    connection = get_db_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            "SELECT name, email FROM users WHERE user_id = ?",
            (session['user_id'],)
        )
        student = cursor.fetchone()

        if not student:
            return jsonify({
                "status": "error",
                "message": "Student not found"
            }), 404

        cursor.execute(
            "SELECT COUNT(*) FROM enrollments WHERE user_id = ?",
            (session['user_id'],)
        )
        total_enrollments = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM courses")
        total_courses = cursor.fetchone()[0]

        return jsonify({
            "status": "success",
            "student": {
                "name": student[0],
                "email": student[1]
            },
            "total_enrollments": total_enrollments,
            "total_courses": total_courses
        })

    except Exception:
        return jsonify({
            "status": "error",
            "message": "Unable to load student dashboard"
        }), 500

    finally:
        connection.close()


# GET ALL AVAILABLE COURSES
@student_bp.route('/courses', methods=['GET'])
@role_required('student')
def get_courses():
    connection = get_db_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                c.course_id,
                c.title,
                c.description,
                c.instructor,
                c.duration,
                CASE
                    WHEN e.enrollment_id IS NULL THEN 0
                    ELSE 1
                END AS is_enrolled
            FROM courses c
            LEFT JOIN enrollments e
                ON c.course_id = e.course_id
                AND e.user_id = ?
            ORDER BY c.course_id DESC
        """, (session['user_id'],))

        rows = cursor.fetchall()

        courses = []

        for row in rows:
            courses.append({
                "course_id": row[0],
                "title": row[1],
                "description": row[2],
                "instructor": row[3],
                "duration": row[4],
                "is_enrolled": bool(row[5])
            })

        return jsonify({
            "status": "success",
            "courses": courses
        })

    except Exception:
        return jsonify({
            "status": "error",
            "message": "Unable to fetch courses"
        }), 500

    finally:
        connection.close()


# ENROLL IN A COURSE
@student_bp.route('/enroll/<int:course_id>', methods=['POST'])
@role_required('student')
def enroll_course(course_id):
    connection = get_db_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            "SELECT course_id FROM courses WHERE course_id = ?",
            (course_id,)
        )

        if not cursor.fetchone():
            return jsonify({
                "status": "error",
                "message": "Course not found"
            }), 404

        cursor.execute("""
            INSERT INTO enrollments (user_id, course_id)
            VALUES (?, ?)
        """, (session['user_id'], course_id))

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Successfully enrolled in the course!"
        }), 201

    except Exception as error:
        connection.rollback()

        if "UNIQUE constraint failed" in str(error):
            return jsonify({
                "status": "error",
                "message": "You are already enrolled in this course."
            }), 409

        return jsonify({
            "status": "error",
            "message": "Unable to enroll in the course"
        }), 500

    finally:
        connection.close()


# GET MY ENROLLED COURSES
@student_bp.route('/my-courses', methods=['GET'])
@role_required('student')
def get_my_courses():
    connection = get_db_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                c.course_id,
                c.title,
                c.description,
                c.instructor,
                c.duration,
                e.enrolled_at
            FROM enrollments e
            JOIN courses c ON e.course_id = c.course_id
            WHERE e.user_id = ?
            ORDER BY e.enrolled_at DESC
        """, (session['user_id'],))

        rows = cursor.fetchall()

        courses = []

        for row in rows:
            courses.append({
                "course_id": row[0],
                "title": row[1],
                "description": row[2],
                "instructor": row[3],
                "duration": row[4],
                "enrolled_at": str(row[5])
            })

        return jsonify({
            "status": "success",
            "courses": courses
        })

    except Exception:
        return jsonify({
            "status": "error",
            "message": "Unable to fetch enrolled courses"
        }), 500

    finally:
        connection.close()


# ================= STUDENT COURSE MATERIALS =================

# GET MATERIALS FOR AN ENROLLED COURSE
@student_bp.route('/materials/<int:course_id>', methods=['GET'])
@role_required('student')
def get_course_materials(course_id):

    connection = get_db_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT m.material_id, m.title, m.uploaded_at
            FROM materials m
            JOIN enrollments e ON m.course_id = e.course_id
            WHERE m.course_id = ? AND e.user_id = ?
            ORDER BY m.uploaded_at DESC
        """, (course_id, session['user_id']))

        rows = cursor.fetchall()

        materials = []

        for row in rows:
            materials.append({
                "material_id": row[0],
                "title": row[1],
                "uploaded_at": str(row[2])
            })

        return jsonify({
            "status": "success",
            "materials": materials
        })

    except Exception:
        return jsonify({
            "status": "error",
            "message": "Unable to fetch course materials"
        }), 500

    finally:
        connection.close()


# DOWNLOAD COURSE MATERIAL
@student_bp.route('/materials/download/<int:material_id>', methods=['GET'])
@role_required('student')
def download_material(material_id):

    connection = get_db_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT m.file_path
            FROM materials m
            JOIN enrollments e ON m.course_id = e.course_id
            WHERE m.material_id = ? AND e.user_id = ?
        """, (material_id, session['user_id']))

        material = cursor.fetchone()

        if not material:
            return jsonify({
                "status": "error",
                "message": "Material not found or access denied"
            }), 404

        upload_folder = os.path.join(current_app.root_path, 'uploads')

        return send_from_directory(
            upload_folder,
            material[0],
            as_attachment=True
        )

    finally:
        connection.close()