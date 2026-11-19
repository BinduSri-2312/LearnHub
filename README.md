# LearnHub – Learning Management System

LearnHub is a web-based Learning Management System (LMS) built using Python Flask, SQLite, HTML, CSS, Bootstrap, and JavaScript.

It provides separate dashboards for administrators and students, with role-based access control to manage courses, student enrollments, and learning materials.

## Features

### Admin

* Secure admin login
* Admin dashboard with statistics
* Add, update, and delete courses
* View and manage registered students
* Upload course materials
* Manage learning resources

### Student

* Student registration and login
* Student dashboard
* Browse available courses
* Enroll in courses
* View enrolled courses
* Access and download course materials

### Security

* Password hashing
* Role-based authorization
* Protected API endpoints
* Session-based authentication
* Secure file upload handling

## Technologies Used

| Component         | Technology                       |
| ----------------- | -------------------------------- |
| Frontend          | HTML, CSS, Bootstrap, JavaScript |
| Backend           | Python, Flask                    |
| Database          | SQLite                           |
| Authentication    | Flask Sessions                   |
| Password Security | Werkzeug                         |
| File Uploads      | Flask                            |
| Deployment        | PythonAnywhere                   |

## Project Structure

```text
LearnHub/
│
├── LearnHub-Backend/
│   ├── app.py
│   ├── config.py
│   ├── database.py
│   ├── init_db.py
│   ├── create_admin.py
│   ├── requirements.txt
│   ├── routes/
│   │   ├── auth.py
│   │   ├── admin.py
│   │   ├── student.py
│   │   └── decorators.py
│   └── uploads/
│
└── LearnHub-Frontend/
    ├── index.html
    ├── login.html
    ├── register.html
    ├── admin/
    ├── student/
    └── assets/
        ├── css/
        └── js/
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/BinduSri-2312/LearnHub.git
cd LearnHub
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

### 3. Install dependencies

```bash
cd LearnHub-Backend
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file inside `LearnHub-Backend`.

```env
SECRET_KEY=your-strong-random-secret-key
```

### 5. Initialize the database

```bash
python init_db.py
```

### 6. Create an administrator account

```bash
python create_admin.py
```

### 7. Run the application

```bash
python app.py
```

Open the a
