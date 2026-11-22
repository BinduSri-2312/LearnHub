
const API_BASE = "/api";

// STUDENT REGISTRATION
const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const message = document.getElementById("registerMessage");

        const userData = {
            name: document.getElementById("registerName").value.trim(),
            email: document.getElementById("registerEmail").value.trim(),
            password: document.getElementById("registerPassword").value
        };

        try {
            const response = await fetch(`${API_BASE}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (response.ok) {
                message.style.color = "green";
                message.textContent = result.message;

                registerForm.reset();

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500);

            } else {
                message.style.color = "red";
                message.textContent = result.message;
            }

        } catch (error) {
            message.style.color = "red";
            message.textContent = "Unable to connect to server.";
        }
    });
}


// COMMON LOGIN FOR ADMIN AND STUDENT
const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const message = document.getElementById("loginMessage");

        const loginData = {
            email: document.getElementById("loginEmail").value.trim(),
            password: document.getElementById("loginPassword").value
        };

        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (response.ok) {

                message.style.color = "green";
                message.textContent = result.message;

                // Redirect based on backend role
                setTimeout(() => {
                    window.location.href = result.redirect;
                }, 500);

            } else {
                message.style.color = "red";
                message.textContent = result.message;
            }

        } catch (error) {
            message.style.color = "red";
            message.textContent = "Unable to connect to server.";
        }
    });
}


// Admin Dashboard Statistics
const totalStudents = document.getElementById("totalStudents");

if (totalStudents) {
    async function loadAdminStats() {
        try {
            const response = await fetch(`${API_BASE}/admin/stats`, {
                credentials: "include"
            });

            if (response.status === 401 || response.status === 403) {
                window.location.href = "../login.html";
                return;
            }

            const data = await response.json();

            if (response.ok && data.status === "success") {
                document.getElementById("totalStudents").textContent =
                    data.total_students;

                document.getElementById("totalCourses").textContent =
                    data.total_courses;

                document.getElementById("totalEnrollments").textContent =
                    data.total_enrollments;
            }
        } catch (error) {
            console.error("Unable to load admin statistics:", error);
        }
    }

    loadAdminStats();
}


// ================= STUDENT DASHBOARD STATISTICS =================

const studentDashboard = document.getElementById("totalEnrollments");

if (studentDashboard) {

    async function loadStudentStats() {
        try {
            const [coursesResponse, enrollmentsResponse] = await Promise.all([
                fetch(`${API_BASE}/student/courses`, {
                    credentials: "include"
                }),
                fetch(`${API_BASE}/student/my-courses`, {
                    credentials: "include"
                })
            ]);

            if (
                coursesResponse.status === 401 ||
                coursesResponse.status === 403 ||
                enrollmentsResponse.status === 401 ||
                enrollmentsResponse.status === 403
            ) {
                window.location.href = "../login.html";
                return;
            }

            const coursesData = await coursesResponse.json();
            const enrollmentsData = await enrollmentsResponse.json();

            if (!coursesResponse.ok || !enrollmentsResponse.ok) {
                throw new Error("Unable to load dashboard statistics.");
            }

            document.getElementById("totalCourses").textContent =
                coursesData.courses.length;

            document.getElementById("totalEnrollments").textContent =
                enrollmentsData.courses.length;

        } catch (error) {
            console.error("Student dashboard error:", error);

            document.getElementById("studentMessage").textContent =
                "Unable to load dashboard statistics.";
        }
    }

    loadStudentStats();
}


// ================= COURSE MANAGEMENT =================

const coursesTableBody = document.getElementById("coursesTableBody");

if (coursesTableBody) {
    const courseForm = document.getElementById("courseForm");
    const courseModalElement = document.getElementById("courseModal");
    const courseModal = bootstrap.Modal.getOrCreateInstance(courseModalElement);
    const courseMessage = document.getElementById("courseMessage");

    // Load all courses
    async function loadCourses() {
        try {
            const response = await fetch(`${API_BASE}/admin/courses`, {
                credentials: "include"
            });

            if (response.status === 401 || response.status === 403) {
                window.location.href = "../login.html";
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load courses");
            }

            coursesTableBody.innerHTML = "";

            document.getElementById("courseCount").textContent =
                `${data.courses.length} Courses`;

            if (data.courses.length === 0) {
                coursesTableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-muted py-4">
                            No courses available. Add your first course.
                        </td>
                    </tr>`;
                return;
            }

            data.courses.forEach((course, index) => {
                const row = document.createElement("tr");

                const values = [
                    index + 1,
                    course.title,
                    course.instructor,
                    course.duration
                ];

                values.forEach(value => {
                    const cell = document.createElement("td");
                    cell.textContent = value ?? "";
                    row.appendChild(cell);
                });

                const actions = document.createElement("td");

                const editButton = document.createElement("button");
                editButton.className = "btn btn-sm btn-outline-primary me-2";
                editButton.textContent = "Edit";
                editButton.addEventListener("click", () => editCourse(course));

                const deleteButton = document.createElement("button");
                deleteButton.className = "btn btn-sm btn-outline-danger";
                deleteButton.textContent = "Delete";
                deleteButton.addEventListener("click", () =>
                    deleteCourse(course.course_id)
                );

                actions.append(editButton, deleteButton);
                row.appendChild(actions);
                coursesTableBody.appendChild(row);
            });

        } catch (error) {
            console.error(error);
            courseMessage.textContent = error.message;
            courseMessage.className = "alert alert-danger";
        }
    }

    // Reset form for adding a course
    document.getElementById("addCourseBtn").addEventListener("click", () => {
        courseForm.reset();
        document.getElementById("courseId").value = "";
        document.getElementById("courseModalTitle").textContent = "Add New Course";
        document.getElementById("saveCourseBtn").textContent = "Save Course";
    });

    // Edit existing course
    function editCourse(course) {
        document.getElementById("courseId").value = course.course_id;
        document.getElementById("courseTitle").value = course.title;
        document.getElementById("courseDescription").value = course.description || "";
        document.getElementById("courseInstructor").value = course.instructor;
        document.getElementById("courseDuration").value = course.duration;

        document.getElementById("courseModalTitle").textContent = "Edit Course";
        document.getElementById("saveCourseBtn").textContent = "Update Course";

        courseModal.show();
    }

    // Add or update course
    courseForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const courseId = document.getElementById("courseId").value;

        const courseData = {
            title: document.getElementById("courseTitle").value.trim(),
            description: document.getElementById("courseDescription").value.trim(),
            instructor: document.getElementById("courseInstructor").value.trim(),
            duration: document.getElementById("courseDuration").value.trim()
        };

        const url = courseId
            ? `${API_BASE}/admin/courses/${courseId}`
            : `${API_BASE}/admin/courses`;

        const method = courseId ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(courseData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to save course");
            }

            courseModal.hide();
            courseForm.reset();

            courseMessage.className = "alert alert-success";
            courseMessage.textContent = data.message;

            loadCourses();

        } catch (error) {
            courseMessage.className = "alert alert-danger";
            courseMessage.textContent = error.message;
        }
    });

    // Delete course
    async function deleteCourse(courseId) {
        if (!confirm("Are you sure you want to delete this course?")) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/admin/courses/${courseId}`, {
                method: "DELETE",
                credentials: "include"
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to delete course");
            }

            courseMessage.className = "alert alert-success";
            courseMessage.textContent = data.message;

            loadCourses();

        } catch (error) {
            courseMessage.className = "alert alert-danger";
            courseMessage.textContent = error.message;
        }
    }

    // Initial load
    loadCourses();
}

// ================= STUDENT MANAGEMENT =================

const studentsTableBody = document.getElementById("studentsTableBody");

if (studentsTableBody) {
    const studentSearch = document.getElementById("studentSearch");
    const studentMessage = document.getElementById("studentMessage");

    let allStudents = [];

    // Display students in table
    function displayStudents(students) {
        studentsTableBody.innerHTML = "";

        if (students.length === 0) {
            studentsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        No students found.
                    </td>
                </tr>`;
            return;
        }

        students.forEach((student, index) => {
            const row = document.createElement("tr");

            const values = [
                index + 1,
                student.name,
                student.email,
                student.total_courses,
                new Date(student.created_at).toLocaleDateString()
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "";
                row.appendChild(cell);
            });

            const actionCell = document.createElement("td");
            const deleteButton = document.createElement("button");

            deleteButton.className = "btn btn-sm btn-outline-danger";
            deleteButton.textContent = "Delete";

            deleteButton.addEventListener("click", () => {
                deleteStudent(student.user_id);
            });

            actionCell.appendChild(deleteButton);
            row.appendChild(actionCell);

            studentsTableBody.appendChild(row);
        });
    }

    // Fetch students from backend
    async function loadStudents() {
        try {
            const response = await fetch(`${API_BASE}/admin/students`, {
                credentials: "include"
            });

            if (response.status === 401 || response.status === 403) {
                window.location.href = "../login.html";
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load students");
            }

            allStudents = data.students;

            document.getElementById("studentCount").textContent =
                `${allStudents.length} Students`;

            displayStudents(allStudents);

        } catch (error) {
            console.error(error);
            studentMessage.className = "alert alert-danger";
            studentMessage.textContent = error.message;
        }
    }

    // Search students
    studentSearch.addEventListener("input", function () {
        const searchValue = this.value.toLowerCase().trim();

        const filteredStudents = allStudents.filter(student =>
            student.name.toLowerCase().includes(searchValue) ||
            student.email.toLowerCase().includes(searchValue)
        );

        displayStudents(filteredStudents);
    });

    // Delete student
    async function deleteStudent(userId) {
        const confirmed = confirm(
            "Are you sure you want to delete this student? This action cannot be undone."
        );

        if (!confirmed) return;

        try {
            const response = await fetch(
                `${API_BASE}/admin/students/${userId}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to delete student");
            }

            studentMessage.className = "alert alert-success";
            studentMessage.textContent = data.message;

            await loadStudents();

        } catch (error) {
            studentMessage.className = "alert alert-danger";
            studentMessage.textContent = error.message;
        }
    }

    // Initial load
    loadStudents();
}

// ================= STUDENT AVAILABLE COURSES =================

const coursesContainer = document.getElementById("coursesContainer");

if (coursesContainer) {

    const courseMessage = document.getElementById("courseMessage");

    async function loadAvailableCourses() {
        try {
            const response = await fetch(`${API_BASE}/student/courses`, {
                credentials: "include"
            });

            if (response.status === 401 || response.status === 403) {
                window.location.href = "../login.html";
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load courses");
            }

            displayAvailableCourses(data.courses);

        } catch (error) {
            coursesContainer.innerHTML = "";
            courseMessage.className = "alert alert-danger";
            courseMessage.textContent = error.message;
        }
    }

    function displayAvailableCourses(courses) {
        coursesContainer.innerHTML = "";

        if (!courses || courses.length === 0) {
            coursesContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <h5>No courses available</h5>
                    <p class="text-muted">Please check again later.</p>
                </div>`;
            return;
        }

        courses.forEach(course => {

            const column = document.createElement("div");
            column.className = "col-12 col-md-6 col-lg-4";

            const card = document.createElement("div");
            card.className = "card h-100 shadow-sm border-0";

            const cardBody = document.createElement("div");
            cardBody.className = "card-body p-4";

            const title = document.createElement("h5");
            title.className = "card-title fw-bold";
            title.textContent = course.title;

            const description = document.createElement("p");
            description.className = "text-muted";
            description.textContent = course.description || "No description available.";

            const instructor = document.createElement("p");
            instructor.innerHTML = "<strong>Instructor:</strong> ";

            const instructorName = document.createElement("span");
            instructorName.textContent = course.instructor;
            instructor.appendChild(instructorName);

            const duration = document.createElement("p");
            duration.innerHTML = "<strong>Duration:</strong> ";

            const durationValue = document.createElement("span");
            durationValue.textContent = course.duration;
            duration.appendChild(durationValue);

            const button = document.createElement("button");
            button.className = course.is_enrolled
                ? "btn btn-success w-100"
                : "btn btn-primary w-100";

            button.textContent = course.is_enrolled
                ? "Already Enrolled"
                : "Enroll Now";

            button.disabled = course.is_enrolled;

            if (!course.is_enrolled) {
                button.addEventListener("click", () => {
                    enrollStudent(course.course_id, button);
                });
            }

            cardBody.append(title, description, instructor, duration, button);
            card.appendChild(cardBody);
            column.appendChild(card);
            coursesContainer.appendChild(column);
        });
    }

    async function enrollStudent(courseId, button) {
        button.disabled = true;
        button.textContent = "Enrolling...";

        try {
            const response = await fetch(
                `${API_BASE}/student/enroll/${courseId}`,
                {
                    method: "POST",
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Enrollment failed");
            }

            courseMessage.className = "alert alert-success";
            courseMessage.textContent = data.message;

            await loadAvailableCourses();

        } catch (error) {
            courseMessage.className = "alert alert-danger";
            courseMessage.textContent = error.message;

            button.disabled = false;
            button.textContent = "Enroll Now";
        }
    }

    loadAvailableCourses();
}

// ================= STUDENT MY COURSES =================

const myCoursesContainer = document.getElementById("myCoursesContainer");

if (myCoursesContainer) {

    const myCoursesMessage = document.getElementById("myCoursesMessage");

    async function loadMyCourses() {
        try {
            const response = await fetch(`${API_BASE}/student/my-courses`, {
                credentials: "include"
            });

            if (response.status === 401 || response.status === 403) {
                window.location.href = "../login.html";
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load your courses");
            }

            displayMyCourses(data.courses);

        } catch (error) {
            myCoursesContainer.innerHTML = "";
            myCoursesMessage.className = "alert alert-danger";
            myCoursesMessage.textContent = error.message;

        }
    }

    function displayMyCourses(courses) {
        myCoursesContainer.innerHTML = "";

        if (!courses || courses.length === 0) {
            myCoursesContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <h5>You haven't enrolled in any courses yet.</h5>
                    <p class="text-muted">Explore available courses to get started.</p>
                    <a href="courses.html" class="btn btn-primary">
                        Explore Courses
                    </a>
                </div>`;
            return;
        }

        courses.forEach(course => {

            const column = document.createElement("div");
            column.className = "col-12 col-md-6 col-lg-4";

            const card = document.createElement("div");
            card.className = "card h-100 shadow-sm border-0";

            const body = document.createElement("div");
            body.className = "card-body p-4";

            const title = document.createElement("h5");
            title.className = "fw-bold";
            title.textContent = course.title;

            const description = document.createElement("p");
            description.className = "text-muted";
            description.textContent = course.description || "No description available.";

            const instructor = document.createElement("p");
            instructor.textContent = `Instructor: ${course.instructor}`;

            const duration = document.createElement("p");
            duration.textContent = `Duration: ${course.duration}`;

            const enrolledDate = document.createElement("p");
            enrolledDate.className = "small text-muted";
            enrolledDate.textContent =
                `Enrolled on: ${new Date(course.enrolled_at).toLocaleDateString()}`;

            const status = document.createElement("span");
            status.className = "badge bg-success mb-3";
            status.textContent = "Enrolled";
            const materialsButton = document.createElement("a");
            materialsButton.className = "btn btn-primary w-100 mt-2";
            materialsButton.textContent = "View Learning Materials";
            materialsButton.href = `materials.html?course_id=${course.course_id}`;

            body.append(
                title,
                status,
                description,
                instructor,
                duration,
                enrolledDate,
                materialsButton
            );

            card.appendChild(body);
            column.appendChild(card);
            myCoursesContainer.appendChild(column);
        });
    }

    loadMyCourses();
}

// ================= ADMIN COURSE MATERIAL UPLOAD =================

const materialForm = document.getElementById("materialForm");

if (materialForm) {

    const materialCourse = document.getElementById("materialCourse");
    const materialTitle = document.getElementById("materialTitle");
    const materialFile = document.getElementById("materialFile");
    const materialMessage = document.getElementById("materialMessage");
    const uploadMaterialBtn = document.getElementById("uploadMaterialBtn");

    async function loadMaterialCourses() {
        try {
            const response = await fetch(`${API_BASE}/admin/courses`, {
                credentials: "include"
            });

            if (response.status === 401 || response.status === 403) {
                window.location.href = "../login.html";
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load courses");
            }

            materialCourse.innerHTML = '<option value="">Select a course</option>';

            data.courses.forEach(course => {
                const option = document.createElement("option");
                option.value = course.course_id;
                option.textContent = course.title;
                materialCourse.appendChild(option);
            });

            if (data.courses.length === 0) {
                materialCourse.innerHTML = '<option value="">No courses available</option>';
            }

        } catch (error) {
            materialMessage.className = "alert alert-danger mt-3";
            materialMessage.textContent = error.message;
        }
    }

    materialForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const file = materialFile.files[0];

        if (!file) {
            materialMessage.className = "alert alert-danger mt-3";
            materialMessage.textContent = "Please select a file.";
            return;
        }

        const formData = new FormData();
        formData.append("course_id", materialCourse.value);
        formData.append("title", materialTitle.value.trim());
        formData.append("file", file);

        uploadMaterialBtn.disabled = true;
        uploadMaterialBtn.textContent = "Uploading...";

        try {
            const response = await fetch(`${API_BASE}/admin/materials`, {
                method: "POST",
                credentials: "include",
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Upload failed");
            }

            materialMessage.className = "alert alert-success mt-3";
            materialMessage.textContent = data.message;

            materialForm.reset();

        } catch (error) {
            materialMessage.className = "alert alert-danger mt-3";
            materialMessage.textContent = error.message;

        } finally {
            uploadMaterialBtn.disabled = false;
            uploadMaterialBtn.textContent = "Upload Material";
        }
    });

    loadMaterialCourses();
}

// ================= STUDENT COURSE MATERIALS =================

const studentMaterialsContainer = document.getElementById(
    "studentMaterialsContainer"
);

if (studentMaterialsContainer) {

    const message = document.getElementById("studentMaterialsMessage");
    const courseTitle = document.getElementById("materialCourseTitle");

    const params = new URLSearchParams(window.location.search);
    const courseId = params.get("course_id");

    async function loadStudentMaterials() {

        if (!courseId || !/^\d+$/.test(courseId)) {
            studentMaterialsContainer.textContent = "Invalid course selected.";
            return;
        }

        try {
            // Verify that the student is enrolled in this course
            const coursesResponse = await fetch(
                `${API_BASE}/student/my-courses`,
                { credentials: "include" }
            );

            if (coursesResponse.status === 401 || coursesResponse.status === 403) {
                window.location.href = "../login.html";
                return;
            }

            const coursesData = await coursesResponse.json();

            if (!coursesResponse.ok) {
                throw new Error(coursesData.message || "Unable to verify enrollment");
            }

            const enrolledCourse = coursesData.courses.find(
                course => String(course.course_id) === courseId
            );

            if (!enrolledCourse) {
                throw new Error("You are not enrolled in this course.");
            }

            courseTitle.textContent = enrolledCourse.title;

            const response = await fetch(
                `${API_BASE}/student/materials/${courseId}`,
                { credentials: "include" }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load materials");
            }

            displayStudentMaterials(data.materials);

        } catch (error) {
            studentMaterialsContainer.innerHTML = "";
            message.className = "alert alert-danger";
            message.textContent = error.message;
        }
    }

    function displayStudentMaterials(materials) {

        studentMaterialsContainer.innerHTML = "";

        if (!materials || materials.length === 0) {
            studentMaterialsContainer.innerHTML = `
                <div class="alert alert-info">
                    No learning materials have been uploaded for this course yet.
                </div>`;
            return;
        }

        materials.forEach(material => {

            const card = document.createElement("div");
            card.className = "card shadow-sm border-0 mb-3";

            const body = document.createElement("div");
            body.className = "card-body d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3";

            const details = document.createElement("div");

            const title = document.createElement("h5");
            title.textContent = material.title;

            const date = document.createElement("small");
            date.className = "text-muted";
            date.textContent =
                `Uploaded: ${new Date(material.uploaded_at).toLocaleDateString()}`;

            details.append(title, date);

            const downloadButton = document.createElement("button");
            downloadButton.className = "btn btn-primary";
            downloadButton.textContent = "Download";

            downloadButton.addEventListener("click", () => {
                downloadMaterial(material.material_id, downloadButton);
            });

            body.append(details, downloadButton);
            card.appendChild(body);
            studentMaterialsContainer.appendChild(card);
        });
    }

    async function downloadMaterial(materialId, button) {

        button.disabled = true;
        button.textContent = "Downloading...";

        try {
            const response = await fetch(
                `${API_BASE}/student/materials/download/${materialId}`,
                { credentials: "include" }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Download failed");
            }

            const blob = await response.blob();
            const fileUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = fileUrl;
            link.download = `material-${materialId}`;
            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(fileUrl);

        } catch (error) {
            message.className = "alert alert-danger";
            message.textContent = error.message;

        } finally {
            button.disabled = false;
            button.textContent = "Download";
        }
    }

    loadStudentMaterials();
}
// ================= LOGOUT =================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        logoutBtn.disabled = true;
        logoutBtn.textContent = "Logging out...";

        try {
            const response = await fetch(`${API_BASE}/logout`, {
                method: "POST",
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error("Logout failed");
            }

            window.location.replace("../login.html");

        } catch (error) {
            console.error("Logout error:", error);
            logoutBtn.disabled = false;
            logoutBtn.textContent = "Logout";
            alert("Unable to logout. Please try again.");
        }
    });
}