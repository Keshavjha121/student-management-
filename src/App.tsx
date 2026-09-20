import { useState, useEffect, type FormEvent } from 'react';
import './App.css';

const API_URL = 'http://localhost:8080/api/students';

interface Student {
  id: number;
  name: string;
  email: string;
  rollNumber: string;
  course: string;
}

type StudentForm = Omit<Student, 'id'>;

const emptyForm: StudentForm = {
  name: '',
  email: '',
  rollNumber: '',
  course: '',
};

function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all students from the Java backend
  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Failed to fetch students');
      const data: Student[] = await res.json();
      setStudents(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Connection error: ${err.message}`
          : 'Failed to connect to server',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      if (editingId !== null) {
        // Update existing student
        const res = await fetch(`${API_URL}?id=${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('Failed to update student');
      } else {
        // Create new student
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('Failed to create student');
      }
      resetForm();
      await fetchStudents();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong',
      );
    }
  };

  const handleEdit = (student: Student) => {
    setEditingId(student.id);
    setForm({
      name: student.name,
      email: student.email,
      rollNumber: student.rollNumber,
      course: student.course,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this student?',
    );
    if (!confirmed) return;

    setError(null);
    try {
      const res = await fetch(`${API_URL}?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete student');
      await fetchStudents();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong',
      );
    }
  };

  // Filter students by search term (name or roll number)
  const filteredStudents = students.filter((s) => {
    const term = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.rollNumber.toLowerCase().includes(term)
    );
  });

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Student Management System</h1>
          <p>Manage student records with a pure Java backend</p>
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
            <button
              className="alert-close"
              onClick={() => setError(null)}
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        )}

        <section className="card form-card">
          <h2 className="card-title">
            {editingId !== null ? 'Edit Student' : 'Add New Student'}
          </h2>
          <form onSubmit={handleSubmit} className="student-form">
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Jane Doe"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleInputChange}
                  placeholder="e.g. jane@example.com"
                />
              </div>
              <div className="form-field">
                <label htmlFor="rollNumber">Roll Number</label>
                <input
                  id="rollNumber"
                  name="rollNumber"
                  type="text"
                  value={form.rollNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. R001"
                />
              </div>
              <div className="form-field">
                <label htmlFor="course">Course</label>
                <input
                  id="course"
                  name="course"
                  type="text"
                  value={form.course}
                  onChange={handleInputChange}
                  placeholder="e.g. Computer Science"
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingId !== null ? 'Update Student' : 'Add Student'}
              </button>
              {editingId !== null && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="card table-card">
          <div className="table-header">
            <h2 className="card-title">Student List</h2>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by name or roll number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading && students.length === 0 ? (
            <div className="empty-state">Loading students...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="empty-state">
              {search
                ? 'No students match your search.'
                : 'No students yet. Add one above.'}
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="student-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Course</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="cell-id">{student.id}</td>
                      <td className="cell-roll">{student.rollNumber}</td>
                      <td className="cell-name">{student.name}</td>
                      <td className="cell-email">{student.email}</td>
                      <td className="cell-course">{student.course}</td>
                      <td className="cell-actions">
                        <button
                          className="btn btn-sm btn-edit"
                          onClick={() => handleEdit(student)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-delete"
                          onClick={() => handleDelete(student.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
