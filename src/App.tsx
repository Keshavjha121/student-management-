import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, Users, BookOpen, Calendar, 
  FileText, GraduationCap, TrendingUp, Database, 
  Sun, Moon, Search, Plus, Download, ArrowUpRight, 
  CheckCircle2, XCircle, Clock, UploadCloud, Check, 
  UserCheck, ArrowLeft, Mail, Phone, MapPin, X
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, BarChart, Bar, Cell, PieChart, Pie 
} from 'recharts';
import rawKaggleStudents from './students.json';

// Seeded deterministic generator based on student_id to prevent identical mock data
function getStudentSeed(idStr: string) {
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Students' | 'Academics' | 'Attendance' | 'Assignments' | 'Faculty' | 'Analytics' | 'Dataset Manager'>('Dashboard');
  const [darkMode, setDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  
  // Selected student for Profile modal/view
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  // Tab-specific student selectors
  const [academicStudentId, setAcademicStudentId] = useState<string>('');
  const [attendanceStudentId, setAttendanceStudentId] = useState<string>('');
  const [assignmentStudentId, setAssignmentStudentId] = useState<string>('');

  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    dept: 'CSE',
    sem: '5',
    cgpa: '',
    attendance: '',
    email: '',
    phone: '',
    address: '',
    // Subject marks (5 subjects per dept)
    subjectMarks: [
      { subject: '', internal: '', external: '' },
      { subject: '', internal: '', external: '' },
      { subject: '', internal: '', external: '' },
      { subject: '', internal: '', external: '' },
      { subject: '', internal: '', external: '' },
    ],
    // Assignments (4 assignments)
    assignments: [
      { title: '', status: 'Submitted', marks: '', submissionDate: '' },
      { title: '', status: 'Submitted', marks: '', submissionDate: '' },
      { title: '', status: 'Submitted', marks: '', submissionDate: '' },
      { title: '', status: 'Submitted', marks: '', submissionDate: '' },
    ],
  });

  // Dataset manager custom uploaded dataset state
  const [uploadedDatasetName, setUploadedDatasetName] = useState('students.json');

  const getDefaultSubjects = (dept: string) => {
    const subjectsMap: Record<string, string[]> = {
      'CSE': ['Database Management', 'Operating Systems', 'Computer Networks', 'Design & Analysis of Algorithms', 'Cloud Computing'],
      'ECE': ['Digital Signal Processing', 'VLSI Design', 'Microcontrollers', 'Analog Communication', 'Embedded Systems'],
      'ISE': ['Information Security', 'Software Engineering', 'Big Data Analytics', 'Web Architecture', 'Machine Learning'],
      'EEE': ['Power Electronics', 'Control Systems', 'Electric Drives', 'Renewable Energy', 'High Voltage Engg'],
      'Architecture': ['Architectural Design', 'Building Construction', 'History of Architecture', 'Structural Mechanics', 'Urban Planning'],
      'Mechanical': ['Thermodynamics', 'Fluid Mechanics', 'Kinematics of Machines', 'Manufacturing Tech', 'CAD/CAM']
    };
    return subjectsMap[dept] || subjectsMap['CSE'];
  };

  // Format and assign real unique values to all students
  const initialStudents = useMemo(() => {
    return (rawKaggleStudents as any[]).map((item, index) => {
      const id = String(item.StudentID || item.student_id || item.id || `S${String(index + 1).padStart(5, '0')}`);
      const seed = getStudentSeed(id);
      
      // Calculate individual attendance and CGPA if not present in dataset
      const calcAttendance = item.Attendance !== undefined 
        ? Number(item.Attendance) 
        : 60 + (seed % 38); // Varies between 60% and 97% for each student
      
      const calcCgpa = item.CGPA !== undefined 
        ? Number(item.CGPA) 
        : Number((5.5 + ((seed % 42) / 10)).toFixed(2)); // Varies between 5.50 and 9.70

      const firstName = item.FirstName || '';
      const lastName = item.LastName || '';
      const fullName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : (item.Name || item.name || `Student ${id}`);
      const dept = item.Department || item.department || ['CSE', 'ECE', 'ISE', 'EEE', 'Architecture', 'Mechanical'][seed % 6];
      const sem = Number(item.Semester || item.semester) || ((seed % 8) + 1);

      return {
        id,
        roll: id,
        name: fullName,
        dept,
        sem,
        cgpa: calcCgpa,
        attendance: calcAttendance,
        risk: (calcAttendance < 75 || calcCgpa < 6.0) ? 'HIGH' : 'LOW',
        email: item.Email || item.email || `${fullName.toLowerCase().replace(/\s+/g, '')}@institution.edu`,
        phone: item.Phone || item.phone || `+91 ${9000000000 + (seed % 999999999)}`,
        address: item.Address || item.address || 'Campus Residence, Hostel Block B',
        isManual: false
      };
    });
  }, []);

  const [students, setStudents] = useState(initialStudents);

  // Set default selected students on load
  React.useEffect(() => {
    if (students.length > 0 && !academicStudentId) {
      setAcademicStudentId(students[0].id);
      setAttendanceStudentId(students[0].id);
      setAssignmentStudentId(students[0].id);
    }
  }, [students]);

  React.useEffect(() => {
    if (isAddModalOpen) {
      const subjects = getDefaultSubjects(newStudentForm.dept);
      setNewStudentForm(prev => ({
        ...prev,
        subjectMarks: subjects.map((sub, i) => ({
          subject: sub,
          internal: prev.subjectMarks[i]?.internal || '',
          external: prev.subjectMarks[i]?.external || '',
        }))
      }));
    }
  }, [newStudentForm.dept, isAddModalOpen]);

  // Dynamic calculations across dataset
  const totalCount = students.length;
  const avgAttendance = totalCount > 0 
    ? (students.reduce((acc, curr) => acc + curr.attendance, 0) / totalCount).toFixed(1) 
    : '0';
  const avgCgpa = totalCount > 0 
    ? (students.reduce((acc, curr) => acc + curr.cgpa, 0) / totalCount).toFixed(2) 
    : '0';

  const uniqueDepts = Array.from(new Set(students.map(s => s.dept)));

  // Generate Student-Specific Academic Data
  const getStudentAcademics = (stId: string) => {
    const student = students.find(s => s.id === stId);
    if (!student) return null;
    if (student.isManual && (student as any).manualAcademics?.length > 0) {
      return { empty: false, student, records: (student as any).manualAcademics };
    }
    if (student.isManual && student.cgpa === 0) return { empty: true, student };

    const seed = getStudentSeed(stId);
    const subjectsMap: Record<string, string[]> = {
      'CSE': ['Database Management', 'Operating Systems', 'Computer Networks', 'Design & Analysis of Algorithms', 'Cloud Computing'],
      'ECE': ['Digital Signal Processing', 'VLSI Design', 'Microcontrollers', 'Analog Communication', 'Embedded Systems'],
      'ISE': ['Information Security', 'Software Engineering', 'Big Data Analytics', 'Web Architecture', 'Machine Learning'],
      'EEE': ['Power Electronics', 'Control Systems', 'Electric Drives', 'Renewable Energy', 'High Voltage Engg'],
      'Architecture': ['Architectural Design', 'Building Construction', 'History of Architecture', 'Structural Mechanics', 'Urban Planning'],
      'Mechanical': ['Thermodynamics', 'Fluid Mechanics', 'Kinematics of Machines', 'Manufacturing Tech', 'CAD/CAM']
    };

    const subjects = subjectsMap[student.dept] || subjectsMap['CSE'];
    const records = subjects.map((sub, i) => {
      const variance = (seed + i * 17) % 25;
      const total = Math.min(98, Math.max(45, Math.round(student.cgpa * 9.5) + (variance - 10)));
      const internal = Math.round(total * 0.3);
      const external = total - internal;
      let grade = 'A';
      if (total >= 90) grade = 'O';
      else if (total >= 80) grade = 'A+';
      else if (total >= 70) grade = 'A';
      else if (total >= 60) grade = 'B+';
      else if (total >= 50) grade = 'B';
      else grade = 'RA';

      return {
        subject: sub,
        internal,
        external,
        total,
        grade,
        status: total >= 50 ? 'Pass' : 'Backlog'
      };
    });

    return { empty: false, student, records };
  };

  // Generate Student-Specific Attendance Data
  const getStudentAttendance = (stId: string) => {
    const student = students.find(s => s.id === stId);
    if (!student) return null;
    if (student.isManual && student.attendance === 0) return { empty: true, student };

    const seed = getStudentSeed(stId);
    const totalClassesPerSub = 40 + (seed % 15);
    const subjectsMap: Record<string, string[]> = {
      'CSE': ['Database Management', 'Operating Systems', 'Computer Networks', 'Algorithms'],
      'ECE': ['DSP', 'VLSI Design', 'Microcontrollers', 'Analog Comm'],
      'ISE': ['Information Security', 'Software Engg', 'Big Data Analytics', 'Web Arch'],
      'EEE': ['Power Electronics', 'Control Systems', 'Electric Drives', 'Renewables'],
      'Architecture': ['Architectural Design', 'Building Const', 'Structures', 'Urban Planning'],
      'Mechanical': ['Thermodynamics', 'Fluid Mechanics', 'Kinematics', 'Manufacturing']
    };

    const subs = subjectsMap[student.dept] || subjectsMap['CSE'];
    const subjectList = subs.map((sub, i) => {
      const delta = ((seed + i * 11) % 18) - 9;
      const subPct = Math.min(100, Math.max(42, student.attendance + delta));
      const attended = Math.round((subPct / 100) * totalClassesPerSub);
      const absent = totalClassesPerSub - attended;

      return {
        subject: sub,
        percentage: subPct,
        totalClasses: totalClassesPerSub,
        attended,
        absent,
        status: subPct >= 75 ? 'Regular' : 'Shortage Warning'
      };
    });

    return { empty: false, student, subjectList };
  };

  // Generate Student-Specific Assignment Data
  const getStudentAssignments = (stId: string) => {
    const student = students.find(s => s.id === stId);
    if (!student) return null;
    if (student.isManual && (student as any).manualAssignments?.length > 0) {
      return { empty: false, student, assignments: (student as any).manualAssignments };
    }
    if (student.isManual && student.cgpa === 0) return { empty: true, student };

    const seed = getStudentSeed(stId);
    const titles = [
      'Problem Set 1: Theoretical Analysis',
      'Case Study & Real-time Implementation',
      'Mini Project Source Code & Documentation',
      'Lab Practical Assignment Evaluation'
    ];

    const assignments = titles.map((title, i) => {
      const isPending = ((seed + i * 7) % 5 === 0) && student.attendance < 75;
      const isLate = ((seed + i * 3) % 4 === 0) && !isPending;
      const maxMarks = 25;
      const marks = isPending ? 0 : Math.min(25, Math.max(12, Math.round(student.cgpa * 2.3) + ((seed + i) % 4)));

      return {
        id: `ASG-${i + 1}`,
        title,
        status: isPending ? 'Pending' : (isLate ? 'Late Submission' : 'Submitted'),
        submissionDate: isPending ? '-' : `2026-03-${10 + ((seed + i * 4) % 15)}`,
        marks: isPending ? '-' : `${marks} / ${maxMarks}`,
        grade: isPending ? '-' : (marks >= 22 ? 'O' : marks >= 18 ? 'A' : 'B')
      };
    });

    return { empty: false, student, assignments };
  };

  // Charts configuration
  const trendData = [
    { sem: 'Sem 1', cgpa: 7.1 },
    { sem: 'Sem 2', cgpa: 7.4 },
    { sem: 'Sem 3', cgpa: 7.8 },
    { sem: 'Sem 4', cgpa: 8.2 },
    { sem: 'Sem 5', cgpa: Number(avgCgpa) || 7.9 },
  ];

  const deptChartData = uniqueDepts.map(dept => ({
    name: dept,
    students: students.filter(s => s.dept === dept).length
  }));

  const safeCount = students.filter(s => s.risk === 'LOW').length;
  const riskCount = students.filter(s => s.risk === 'HIGH').length;

  const riskDonutData = [
    { name: 'Safe', value: safeCount, color: '#10b981' },
    { name: 'At Risk', value: riskCount, color: '#f43f5e' },
  ];

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Students', icon: Users },
    { name: 'Academics', icon: BookOpen },
    { name: 'Attendance', icon: Calendar },
    { name: 'Assignments', icon: FileText },
    { name: 'Faculty', icon: GraduationCap },
    { name: 'Analytics', icon: TrendingUp },
    { name: 'Dataset Manager', icon: Database },
  ];

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.roll.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'All' || s.dept === selectedDept;
    return matchesSearch && matchesDept;
  });

  // Handle manual student addition
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.name.trim()) {
      alert('Please enter student name');
      return;
    }

    const newId = `S${String(students.length + 1).padStart(5, '0')}`;
    const cgpaVal = newStudentForm.cgpa ? parseFloat(newStudentForm.cgpa) : 0;
    const attVal = newStudentForm.attendance ? parseInt(newStudentForm.attendance) : 0;

    const newStudentObj = {
      id: newId,
      roll: newId,
      name: newStudentForm.name.trim(),
      dept: newStudentForm.dept,
      sem: parseInt(newStudentForm.sem) || 1,
      cgpa: cgpaVal,
      attendance: attVal,
      risk: (attVal > 0 && attVal < 75) || (cgpaVal > 0 && cgpaVal < 6.0) ? 'HIGH' : 'LOW' as 'HIGH' | 'LOW',
      email: newStudentForm.email || `${newStudentForm.name.toLowerCase().replace(/\s+/g, '')}@institution.edu`,
      phone: newStudentForm.phone || '+91 9876543210',
      address: newStudentForm.address || 'Campus Hostel',
      isManual: true,
      manualAcademics: newStudentForm.subjectMarks.filter(s => s.subject.trim()).map(s => {
        const internal = parseInt(s.internal) || 0;
        const external = parseInt(s.external) || 0;
        const total = internal + external;
        let grade = 'B';
        if (total >= 90) grade = 'O';
        else if (total >= 80) grade = 'A+';
        else if (total >= 70) grade = 'A';
        else if (total >= 60) grade = 'B+';
        else if (total >= 50) grade = 'B';
        else grade = 'RA';
        return {
          subject: s.subject,
          internal,
          external,
          total,
          grade,
          status: total >= 50 ? 'Pass' : 'Backlog'
        };
      }),
      manualAssignments: newStudentForm.assignments.filter(a => a.title.trim()).map((a, i) => ({
        id: `ASG-${i + 1}`,
        title: a.title,
        status: a.status,
        submissionDate: a.submissionDate || '-',
        marks: a.status === 'Pending' ? '-' : `${parseInt(a.marks) || 0} / 25`,
        grade: a.status === 'Pending' ? '-' : ((parseInt(a.marks) || 0) >= 22 ? 'O' : (parseInt(a.marks) || 0) >= 18 ? 'A' : 'B')
      })),
    };

    setStudents([newStudentObj, ...students]);
    setIsAddModalOpen(false);
    setNewStudentForm({
      name: '',
      dept: 'CSE',
      sem: '5',
      cgpa: '',
      attendance: '',
      email: '',
      phone: '',
      address: '',
      subjectMarks: [
        { subject: '', internal: '', external: '' },
        { subject: '', internal: '', external: '' },
        { subject: '', internal: '', external: '' },
        { subject: '', internal: '', external: '' },
        { subject: '', internal: '', external: '' },
      ],
      assignments: [
        { title: '', status: 'Submitted', marks: '', submissionDate: '' },
        { title: '', status: 'Submitted', marks: '', submissionDate: '' },
        { title: '', status: 'Submitted', marks: '', submissionDate: '' },
        { title: '', status: 'Submitted', marks: '', submissionDate: '' },
      ],
    });
    alert(`Student ${newStudentObj.name} added successfully with ID: ${newId}`);
  };

  // CSV Reader for Dataset Manager
  const handleDatasetFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      if (lines.length <= 1) {
        alert('Invalid or empty CSV file');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const parsedStudents = lines.slice(1).map((line, idx) => {
        const parts = line.split(',').map(p => p.trim());
        const rowObj: Record<string, string> = {};
        headers.forEach((h, i) => {
          rowObj[h] = parts[i] || '';
        });

        const id = rowObj['studentid'] || rowObj['student_id'] || rowObj['roll'] || `S${String(idx + 1).padStart(5, '0')}`;
        const name = rowObj['name'] || `${rowObj['firstname'] || ''} ${rowObj['lastname'] || ''}`.trim() || `Student ${id}`;
        const dept = rowObj['department'] || rowObj['dept'] || 'CSE';
        const sem = Number(rowObj['semester'] || rowObj['sem']) || 5;
        const cgpa = Number(rowObj['cgpa'] || rowObj['gpa']) || 7.5;
        const att = Number(rowObj['attendance']) || 80;

        return {
          id,
          roll: id,
          name,
          dept,
          sem,
          cgpa,
          attendance: att,
          risk: (att < 75 || cgpa < 6.0) ? 'HIGH' : 'LOW' as 'HIGH' | 'LOW',
          email: rowObj['email'] || `${name.toLowerCase().replace(/\s+/g, '')}@institution.edu`,
          phone: rowObj['phone'] || '+91 9999988888',
          address: rowObj['address'] || 'University Hostel Block A',
          isManual: false
        };
      });

      setStudents(parsedStudents);
      setUploadedDatasetName(file.name);
      alert(`Loaded ${parsedStudents.length} student records from ${file.name}`);
    };
    reader.readAsText(file);
  };

  const currentDetailStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className={`flex h-screen font-sans ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* 1. Sidebar */}
      <aside className={`w-64 border-r flex flex-col justify-between shrink-0 ${darkMode ? 'border-slate-800/80 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
        <div className="p-4">
          <div className="flex items-center gap-3 px-3 py-4 mb-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight leading-tight">STUDENT ERP</h2>
              <span className="text-xs text-indigo-400 font-medium">Enterprise v2.4</span>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name && !selectedStudentId;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveTab(item.name as any);
                    setSelectedStudentId(null);
                  }}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25' 
                      : darkMode 
                        ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800/60">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border ${
              darkMode ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
              {darkMode ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
              {darkMode ? 'Dark Theme' : 'Light Theme'}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-500">Toggle</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className={`h-16 border-b px-8 flex items-center justify-between shrink-0 ${
          darkMode ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight">
              {selectedStudentId ? 'Student Academic Profile' : activeTab}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              Academic Year 2026-27
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold">Administrator</p>
              <p className="text-[11px] text-slate-500">admin@institution.edu</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white">
              AD
            </div>
          </div>
        </header>

        {/* Dynamic Pages Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">

          {/* VIEW: SINGLE STUDENT DETAILED PROFILE (Triggered when any student row is clicked) */}
          {selectedStudentId && currentDetailStudent ? (
            <div className="space-y-6">
              <button 
                onClick={() => setSelectedStudentId(null)}
                className="flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Students Table
              </button>

              {/* Student Header Card */}
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xl">
                      {currentDetailStudent.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold">{currentDetailStudent.name}</h2>
                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-xs font-semibold">
                          {currentDetailStudent.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Department of {currentDetailStudent.dept} • Semester {currentDetailStudent.sem}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="text-center px-4 py-2 rounded-xl bg-slate-950/40 border border-slate-800">
                      <p className="text-[10px] text-slate-400">Current CGPA</p>
                      <p className="text-lg font-bold text-indigo-400">{currentDetailStudent.cgpa || 'N/A'}</p>
                    </div>
                    <div className="text-center px-4 py-2 rounded-xl bg-slate-950/40 border border-slate-800">
                      <p className="text-[10px] text-slate-400">Attendance</p>
                      <p className={`text-lg font-bold ${currentDetailStudent.attendance < 75 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {currentDetailStudent.attendance}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{currentDetailStudent.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{currentDetailStudent.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{currentDetailStudent.address}</span>
                  </div>
                </div>
              </div>

              {/* Individual Academic Grades */}
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-sm mb-4">Academic & Semester Grade Card</h3>
                {getStudentAcademics(currentDetailStudent.id)?.empty ? (
                  <p className="text-xs text-slate-400 py-4">No academic records available for this newly added student.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-800 text-slate-400 pb-2">
                        <tr>
                          <th className="pb-3">Subject</th>
                          <th className="pb-3">Internal (30)</th>
                          <th className="pb-3">External (70)</th>
                          <th className="pb-3">Total (100)</th>
                          <th className="pb-3">Grade</th>
                          <th className="pb-3">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {getStudentAcademics(currentDetailStudent.id)?.records?.map((rec, i) => (
                          <tr key={i} className="h-10">
                            <td className="font-medium">{rec.subject}</td>
                            <td>{rec.internal}</td>
                            <td>{rec.external}</td>
                            <td className="font-bold">{rec.total}</td>
                            <td><span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">{rec.grade}</span></td>
                            <td>
                              <span className={rec.status === 'Pass' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                                {rec.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Individual Attendance Breakdown */}
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-sm mb-4">Subject-wise Attendance Metrics</h3>
                {getStudentAttendance(currentDetailStudent.id)?.empty ? (
                  <p className="text-xs text-slate-400 py-4">No attendance records available for this newly added student.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {getStudentAttendance(currentDetailStudent.id)?.subjectList?.map((att, i) => (
                      <div key={i} className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                        <p className="text-xs font-semibold">{att.subject}</p>
                        <h4 className="text-xl font-bold mt-2">{att.percentage}%</h4>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {att.attended} Attended / {att.totalClasses} Total
                        </p>
                        <span className={`text-[10px] font-bold mt-2 block ${att.status.includes('Warning') ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {att.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Individual Assignments */}
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-sm mb-4">Coursework Assignments & Submissions</h3>
                {getStudentAssignments(currentDetailStudent.id)?.empty ? (
                  <p className="text-xs text-slate-400 py-4">No assignments available for this newly added student.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-800 text-slate-400 pb-2">
                        <tr>
                          <th className="pb-3">Task Title</th>
                          <th className="pb-3">Submission Status</th>
                          <th className="pb-3">Submitted On</th>
                          <th className="pb-3">Marks</th>
                          <th className="pb-3">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {getStudentAssignments(currentDetailStudent.id)?.assignments?.map((asg, i) => (
                          <tr key={i} className="h-10">
                            <td className="font-medium">{asg.title}</td>
                            <td>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                asg.status === 'Submitted'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : asg.status === 'Late Submission'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>
                                {asg.status}
                              </span>
                            </td>
                            <td>{asg.submissionDate}</td>
                            <td className="font-bold">{asg.marks}</td>
                            <td>{asg.grade}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          ) : null}

          {/* TAB 1: DASHBOARD */}
          {!selectedStudentId && activeTab === 'Dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Students', value: totalCount.toString(), desc: 'Loaded from dataset', color: 'from-blue-600 to-indigo-600', shadow: 'shadow-indigo-500/10' },
                  { label: 'Total Faculty', value: uniqueDepts.length.toString(), desc: 'Department Leads', color: 'from-violet-600 to-purple-600', shadow: 'shadow-purple-500/10' },
                  { label: 'Average Attendance', value: `${avgAttendance}%`, desc: '75% Mandatory Cutoff', color: 'from-emerald-500 to-teal-600', shadow: 'shadow-teal-500/10' },
                  { label: 'Average CGPA', value: avgCgpa, desc: 'Overall Student Average', color: 'from-amber-500 to-orange-600', shadow: 'shadow-orange-500/10' },
                ].map((stat, idx) => (
                  <div key={idx} className={`relative overflow-hidden p-5 rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 ${
                    darkMode ? 'bg-slate-900/70 border-slate-800/80' : 'bg-white border-slate-200'
                  } ${stat.shadow} shadow-lg`}>
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none`}></div>
                    <p className="text-xs font-medium text-slate-400">{stat.label}</p>
                    <div className="flex items-baseline justify-between mt-2">
                      <h3 className="text-3xl font-extrabold tracking-tight">{stat.value}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-gradient-to-r ${stat.color} text-white`}>Active</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 font-medium">
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                      {stat.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-2 p-6 rounded-2xl border backdrop-blur-xl ${
                  darkMode ? 'bg-slate-900/60 border-slate-800/80 shadow-slate-950/40' : 'bg-white border-slate-200 shadow-sm'
                } shadow-xl`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold tracking-tight">Institutional CGPA Growth Curve</h3>
                      <p className="text-xs text-slate-400">Semester progression trend analysis</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Realtime Forecast
                    </span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="cgpaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="sem" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis domain={[5, 10]} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                        <Area type="monotone" dataKey="cgpa" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#cgpaGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border backdrop-blur-xl ${
                  darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200'
                } shadow-xl flex flex-col justify-between`}>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">Academic Safety Radar</h3>
                    <p className="text-xs text-slate-400">Risk status across total enrolled</p>
                  </div>
                  <div className="h-44 w-full my-auto flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={riskDonutData} innerRadius={50} outerRadius={75} paddingAngle={6} dataKey="value">
                          {riskDonutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-center">
                    <div>
                      <p className="text-[10px] text-slate-400">Safe Students</p>
                      <p className="text-base font-bold text-emerald-400">{safeCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">At Risk</p>
                      <p className="text-base font-bold text-rose-400">{riskCount}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-2xl border backdrop-blur-xl ${
                darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200'
              } shadow-xl`}>
                <h3 className="text-sm font-bold tracking-tight mb-1">Student Enrollment by Department</h3>
                <p className="text-xs text-slate-400 mb-6">Distribution across institution disciplines</p>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptChartData}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                      <Bar dataKey="students" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STUDENTS (Clicking any row opens that student's complete profile) */}
          {!selectedStudentId && activeTab === 'Students' && (
            <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="p-4 border-b border-slate-800/80 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm w-full max-w-sm ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <Search className="w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search by name or roll number..." 
                      className="bg-transparent outline-none w-full text-xs"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <select 
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium outline-none ${darkMode ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                  >
                    <option value="All">All Departments</option>
                    {uniqueDepts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Student
                </button>
              </div>

              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-left text-xs">
                  <thead className={`uppercase text-[10px] tracking-wider font-semibold border-b sticky top-0 ${darkMode ? 'border-slate-800 text-slate-400 bg-slate-950' : 'border-slate-200 text-slate-600 bg-slate-50'}`}>
                    <tr>
                      <th className="p-4">Roll No</th>
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Dept</th>
                      <th className="p-4">Semester</th>
                      <th className="p-4">CGPA</th>
                      <th className="p-4">Attendance</th>
                      <th className="p-4">Risk Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredStudents.map((st) => (
                      <tr 
                        key={st.id} 
                        onClick={() => setSelectedStudentId(st.id)}
                        className={`cursor-pointer transition-colors ${darkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-100'}`}
                      >
                        <td className="p-4 font-mono font-medium text-indigo-400">{st.roll}</td>
                        <td className="p-4 font-semibold">{st.name}</td>
                        <td className="p-4"><span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px]">{st.dept}</span></td>
                        <td className="p-4">Sem {st.sem}</td>
                        <td className="p-4 font-bold">{st.cgpa || '-'}</td>
                        <td className="p-4">
                          <span className={st.attendance < 75 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-medium'}>
                            {st.attendance}%
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.risk === 'LOW' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                            {st.risk}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-indigo-400 hover:text-indigo-300 font-semibold text-xs underline">
                            View Profile →
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ACADEMICS (Student-wise selector) */}
          {!selectedStudentId && activeTab === 'Academics' && (
            <div className="space-y-6">
              {/* Student Selector Bar */}
              <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div>
                  <h3 className="font-bold text-sm">Select Student for Academic Grade Card</h3>
                  <p className="text-xs text-slate-400">Filter grades, subject-wise scores and exam reports by individual student</p>
                </div>
                <div className="flex items-center gap-3">
                  <select 
                    value={academicStudentId}
                    onChange={(e) => setAcademicStudentId(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.roll} - {s.name} ({s.dept})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected Student's Academic Record */}
              {academicStudentId && (() => {
                const data = getStudentAcademics(academicStudentId);
                if (!data) return null;
                if (data.empty) {
                  return (
                    <div className={`p-12 text-center rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                      No academic records available for newly created student {data.student.name}.
                    </div>
                  );
                }

                return (
                  <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                      <div>
                        <h4 className="font-bold text-base">{data.student.name} ({data.student.roll})</h4>
                        <p className="text-xs text-slate-400">Department of {data.student.dept} • Semester {data.student.sem}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Current CGPA</span>
                        <p className="text-2xl font-bold text-indigo-400">{data.student.cgpa}</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-800 text-slate-400">
                          <tr>
                            <th className="pb-3">Subject Name</th>
                            <th className="pb-3">Internal (30)</th>
                            <th className="pb-3">External (70)</th>
                            <th className="pb-3">Total (100)</th>
                            <th className="pb-3">Grade</th>
                            <th className="pb-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {data.records?.map((item, idx) => (
                            <tr key={idx} className="h-12">
                              <td className="font-medium">{item.subject}</td>
                              <td>{item.internal}</td>
                              <td>{item.external}</td>
                              <td className="font-bold">{item.total}</td>
                              <td><span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">{item.grade}</span></td>
                              <td>
                                <span className={item.status === 'Pass' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 4: ATTENDANCE (Student-wise selector) */}
          {!selectedStudentId && activeTab === 'Attendance' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div>
                  <h3 className="font-bold text-sm">Select Student for Attendance Ledger</h3>
                  <p className="text-xs text-slate-400">Detailed subject percentage, total classes, and absent logs</p>
                </div>
                <select 
                  value={attendanceStudentId}
                  onChange={(e) => setAttendanceStudentId(e.target.value)}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.roll} - {s.name} ({s.attendance}%)
                    </option>
                  ))}
                </select>
              </div>

              {attendanceStudentId && (() => {
                const data = getStudentAttendance(attendanceStudentId);
                if (!data) return null;
                if (data.empty) {
                  return (
                    <div className={`p-12 text-center rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                      No attendance records available for newly added student {data.student.name}.
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {data.subjectList?.map((att, i) => (
                        <div key={i} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                          <p className="text-xs text-slate-400">{att.subject}</p>
                          <h3 className="text-2xl font-bold mt-2">{att.percentage}%</h3>
                          <p className="text-[11px] text-slate-500 mt-1">{att.attended} Present • {att.absent} Absent</p>
                          <span className={`text-[10px] font-bold mt-2 block ${att.status.includes('Warning') ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {att.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <h3 className="text-sm font-bold mb-4">{data.student.name} - Monthly Attendance Grid (Day 1 to 28)</h3>
                      <div className="grid grid-cols-7 gap-2 text-center text-xs">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} className="font-bold text-slate-400">{d}</div>)}
                        {Array.from({ length: 28 }).map((_, idx) => {
                          const dayOfWeek = idx % 7; // 0=Mon, 1=Tue, ..., 6=Sun
                          const isSunday = dayOfWeek === 6;
                          const seed = getStudentSeed(data.student.id);
                          const isAbsent = !isSunday && ((seed + idx) % 5 === 0) && data.student.attendance < 85;
                          return (
                            <div key={idx} className={`p-2.5 rounded-lg border text-xs font-semibold ${
                              isSunday
                                ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
                                : isAbsent 
                                  ? 'bg-rose-500/20 border-rose-500/30 text-rose-300' 
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                            }`}>
                              {isSunday ? '🏖 Holiday' : `Day ${idx + 1}`}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 5: ASSIGNMENTS (Student-wise selector) */}
          {!selectedStudentId && activeTab === 'Assignments' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div>
                  <h3 className="font-bold text-sm">Select Student for Assigned Coursework</h3>
                  <p className="text-xs text-slate-400">View individual deadlines, submission statuses, and scores</p>
                </div>
                <select 
                  value={assignmentStudentId}
                  onChange={(e) => setAssignmentStudentId(e.target.value)}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.roll} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {assignmentStudentId && (() => {
                const data = getStudentAssignments(assignmentStudentId);
                if (!data) return null;
                if (data.empty) {
                  return (
                    <div className={`p-12 text-center rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                      No assignments available for newly added student {data.student.name}.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.assignments?.map((asg, i) => (
                      <div key={i} className={`p-5 rounded-2xl border flex flex-col justify-between ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[11px] font-bold font-mono">{asg.id}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              asg.status === 'Submitted'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : asg.status === 'Late Submission'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {asg.status}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm mt-3">{asg.title}</h4>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" /> Submitted on: {asg.submissionDate}
                          </p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400">Awarded Marks: <b className="text-white">{asg.marks}</b></span>
                          <span className="px-2.5 py-1 rounded bg-slate-800 text-xs font-bold text-indigo-400">Grade: {asg.grade}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 6: FACULTY */}
          {!selectedStudentId && activeTab === 'Faculty' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {uniqueDepts.map((deptName, idx) => (
                <div key={idx} className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">HOD - {deptName}</h4>
                      <p className="text-xs text-slate-400">Department Lead ({deptName})</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 text-xs">
                    <span className="text-slate-500">Managing: </span>
                    <span className="font-medium text-slate-300">
                      {students.filter(s => s.dept === deptName).length} Students Enrolled
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 7: ANALYTICS */}
          {!selectedStudentId && activeTab === 'Analytics' && (
            <div className="space-y-6">
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="font-bold text-sm mb-4">Departmental Average Performance Index</h3>
                <div className="space-y-4">
                  {uniqueDepts.map((d, i) => {
                    const deptStudents = students.filter(s => s.dept === d);
                    const deptAvgCgpa = deptStudents.length > 0 
                      ? (deptStudents.reduce((acc, c) => acc + c.cgpa, 0) / deptStudents.length).toFixed(2)
                      : '0.00';
                    const pctWidth = `${Math.min(100, Math.max(10, Number(deptAvgCgpa) * 10))}%`;

                    return (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">{d} Department</span>
                          <span className="font-bold text-indigo-400">{deptAvgCgpa} CGPA</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: pctWidth }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: DATASET MANAGER (Functional upload and preview) */}
          {!selectedStudentId && activeTab === 'Dataset Manager' && (
            <div className="space-y-6">
              <div className={`p-8 rounded-2xl border text-center border-dashed ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'}`}>
                <UploadCloud className="w-10 h-10 mx-auto text-indigo-400 mb-3" />
                <h4 className="font-bold text-sm">Upload New Dataset File (.csv / .json)</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Upload any Kaggle student dataset with columns: student_id, name, department, semester, cgpa, attendance
                </p>
                <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer inline-block">
                  Browse & Replace Dataset
                  <input 
                    type="file" 
                    accept=".csv,.json" 
                    className="hidden" 
                    onChange={handleDatasetFileUpload}
                  />
                </label>
              </div>

              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h4 className="font-bold text-sm mb-4">Active System Datasets</h4>
                <div className="space-y-2">
                  {[
                    { name: uploadedDatasetName, records: `${totalCount} records`, status: 'Loaded & Live in ERP' },
                    { name: 'faculty_directory.csv', records: `${uniqueDepts.length} leads`, status: 'Connected' },
                  ].map((ds, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs">
                      <span className="font-mono font-medium">{ds.name}</span>
                      <span className="text-slate-400">{ds.records}</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5"/> {ds.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 3. ADD STUDENT MODAL FORM */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base">Add New Student</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-5 text-xs">
              {/* Basic Info */}
              <div>
                <h4 className="font-bold text-sm mb-3 text-indigo-400">📋 Basic Information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Student Full Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Keshav Jha" 
                      className={`w-full px-3 py-2 rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                      value={newStudentForm.name}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Department</label>
                      <select 
                        className={`w-full px-3 py-2 rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                        value={newStudentForm.dept}
                        onChange={(e) => setNewStudentForm({ ...newStudentForm, dept: e.target.value })}
                      >
                        <option value="CSE">CSE</option>
                        <option value="ECE">ECE</option>
                        <option value="ISE">ISE</option>
                        <option value="EEE">EEE</option>
                        <option value="Architecture">Architecture</option>
                        <option value="Mechanical">Mechanical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Semester</label>
                      <input 
                        type="number" min="1" max="8" 
                        className={`w-full px-3 py-2 rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                        value={newStudentForm.sem}
                        onChange={(e) => setNewStudentForm({ ...newStudentForm, sem: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Initial CGPA</label>
                      <input 
                        type="number" step="0.01" placeholder="e.g. 8.2"
                        className={`w-full px-3 py-2 rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                        value={newStudentForm.cgpa}
                        onChange={(e) => setNewStudentForm({ ...newStudentForm, cgpa: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Attendance %</label>
                      <input 
                        type="number" placeholder="e.g. 85"
                        className={`w-full px-3 py-2 rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                        value={newStudentForm.attendance}
                        onChange={(e) => setNewStudentForm({ ...newStudentForm, attendance: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Email Address</label>
                    <input 
                      type="email" placeholder="student@institution.edu"
                      className={`w-full px-3 py-2 rounded-xl border outline-none ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}
                      value={newStudentForm.email}
                      onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Academic & Semester Grade Card */}
              <div className={`p-4 rounded-xl border ${darkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
                <h4 className="font-bold text-sm mb-3 text-indigo-400">🎓 Academic & Semester Grade Card</h4>
                <p className="text-[11px] text-slate-400 mb-3">Enter internal (max 30) and external (max 70) marks for each subject</p>
                <div className="space-y-2">
                  {newStudentForm.subjectMarks.map((sm, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <input 
                          type="text" 
                          placeholder="Subject Name"
                          className={`w-full px-2 py-1.5 rounded-lg border outline-none text-xs ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                          value={sm.subject}
                          onChange={(e) => {
                            const updated = [...newStudentForm.subjectMarks];
                            updated[idx] = { ...updated[idx], subject: e.target.value };
                            setNewStudentForm({ ...newStudentForm, subjectMarks: updated });
                          }}
                        />
                      </div>
                      <div className="col-span-3">
                        <input 
                          type="number" min="0" max="30"
                          placeholder="Internal (30)"
                          className={`w-full px-2 py-1.5 rounded-lg border outline-none text-xs ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                          value={sm.internal}
                          onChange={(e) => {
                            const updated = [...newStudentForm.subjectMarks];
                            updated[idx] = { ...updated[idx], internal: e.target.value };
                            setNewStudentForm({ ...newStudentForm, subjectMarks: updated });
                          }}
                        />
                      </div>
                      <div className="col-span-3">
                        <input 
                          type="number" min="0" max="70"
                          placeholder="External (70)"
                          className={`w-full px-2 py-1.5 rounded-lg border outline-none text-xs ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                          value={sm.external}
                          onChange={(e) => {
                            const updated = [...newStudentForm.subjectMarks];
                            updated[idx] = { ...updated[idx], external: e.target.value };
                            setNewStudentForm({ ...newStudentForm, subjectMarks: updated });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coursework Assignments & Submissions */}
              <div className={`p-4 rounded-xl border ${darkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}>
                <h4 className="font-bold text-sm mb-3 text-indigo-400">📝 Coursework Assignments & Submissions</h4>
                <p className="text-[11px] text-slate-400 mb-3">Enter assignment task titles, status, marks (out of 25), and submission date</p>
                <div className="space-y-3">
                  {newStudentForm.assignments.map((asg, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border ${darkMode ? 'border-slate-700 bg-slate-900/60' : 'border-slate-300 bg-white'}`}>
                      <p className="text-[10px] text-slate-500 mb-2 font-bold">Assignment {idx + 1}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="text" 
                          placeholder="Task Title"
                          className={`px-2 py-1.5 rounded-lg border outline-none text-xs ${darkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                          value={asg.title}
                          onChange={(e) => {
                            const updated = [...newStudentForm.assignments];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            setNewStudentForm({ ...newStudentForm, assignments: updated });
                          }}
                        />
                        <select
                          className={`px-2 py-1.5 rounded-lg border outline-none text-xs ${darkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                          value={asg.status}
                          onChange={(e) => {
                            const updated = [...newStudentForm.assignments];
                            updated[idx] = { ...updated[idx], status: e.target.value };
                            setNewStudentForm({ ...newStudentForm, assignments: updated });
                          }}
                        >
                          <option value="Submitted">Submitted</option>
                          <option value="Late Submission">Late Submission</option>
                          <option value="Pending">Pending</option>
                        </select>
                        <input 
                          type="number" min="0" max="25"
                          placeholder="Marks (out of 25)"
                          className={`px-2 py-1.5 rounded-lg border outline-none text-xs ${darkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                          value={asg.marks}
                          onChange={(e) => {
                            const updated = [...newStudentForm.assignments];
                            updated[idx] = { ...updated[idx], marks: e.target.value };
                            setNewStudentForm({ ...newStudentForm, assignments: updated });
                          }}
                        />
                        <input 
                          type="date"
                          className={`px-2 py-1.5 rounded-lg border outline-none text-xs ${darkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                          value={asg.submissionDate}
                          onChange={(e) => {
                            const updated = [...newStudentForm.assignments];
                            updated[idx] = { ...updated[idx], submissionDate: e.target.value };
                            setNewStudentForm({ ...newStudentForm, assignments: updated });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}