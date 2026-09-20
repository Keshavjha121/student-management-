import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, BookOpen, Calendar, 
  FileText, GraduationCap, TrendingUp, 
  BrainCircuit, Database, Sun, Moon,
  Search, Plus, Download, ArrowUpRight, CheckCircle2, 
  XCircle, Clock, UploadCloud, Check, UserCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, BarChart, Bar, Cell, PieChart, Pie 
} from 'recharts';
import kaggleStudents from './students.json';

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [darkMode, setDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  // Kaggle JSON mapping
  const formattedData = (kaggleStudents as any[]).map((item, index) => {
    const rawAttendance = Number(item.Attendance ?? item.attendance) || 82;
    const rawCgpa = Number(item.CGPA ?? item.cgpa ?? item.GPA ?? item.gpa) || 7.8;
    const deptName = item.Department || item.dept || item.Branch || 'CSE';

    return {
      id: String(item.StudentID || item.id || index + 1),
      roll: String(item.StudentID || item.RollNumber || item.roll || `R00${index + 1}`),
      name: `${item.FirstName || ''} ${item.LastName || ''}`.trim() || item.Name || item.name || 'Student',
      dept: deptName,
      sem: Number(item.Semester || item.sem) || 5,
      cgpa: rawCgpa,
      attendance: rawAttendance,
      risk: (rawAttendance < 75 || rawCgpa < 6.0) ? 'HIGH' : 'LOW',
    };
  });

  const [students] = useState(formattedData);

  // Dynamic calculations from dataset
  const totalCount = students.length;
  const avgAttendance = totalCount > 0 
    ? (students.reduce((acc, curr) => acc + curr.attendance, 0) / totalCount).toFixed(1) 
    : '0';
  const avgCgpa = totalCount > 0 
    ? (students.reduce((acc, curr) => acc + curr.cgpa, 0) / totalCount).toFixed(2) 
    : '0';

  // Dynamic unique departments
  const uniqueDepts = Array.from(new Set(students.map(s => s.dept)));

  // Recharts Chart Data
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
    { name: 'Safe (Low)', value: safeCount, color: '#10b981' },
    { name: 'Critical (High)', value: riskCount, color: '#f43f5e' },
  ];

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Students', icon: Users },
    { name: 'Academics', icon: BookOpen },
    { name: 'Attendance', icon: Calendar },
    { name: 'Assignments', icon: FileText },
    { name: 'Faculty', icon: GraduationCap },
    { name: 'Analytics', icon: TrendingUp },
    { name: 'Prediction', icon: BrainCircuit },
    { name: 'Dataset Manager', icon: Database },
  ];

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.roll.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'All' || s.dept === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className={`flex h-screen font-sans ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* 1. Left Sidebar */}
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
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
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
            <h1 className="text-xl font-bold tracking-tight">{activeTab}</h1>
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

        {/* Dynamic Views */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">

          {/* TAB 1: DASHBOARD */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-6">
              {/* Glowing Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Students', value: totalCount.toString(), desc: 'Loaded from dataset', color: 'from-blue-600 to-indigo-600', shadow: 'shadow-indigo-500/10' },
                  { label: 'Total Faculty', value: uniqueDepts.length.toString(), desc: 'Department Leads', color: 'from-violet-600 to-purple-600', shadow: 'shadow-purple-500/10' },
                  { label: 'Average Attendance', value: `${avgAttendance}%`, desc: '75% Mandatory cutoff', color: 'from-emerald-500 to-teal-600', shadow: 'shadow-teal-500/10' },
                  { label: 'Average CGPA', value: avgCgpa, desc: 'Overall student average', color: 'from-amber-500 to-orange-600', shadow: 'shadow-orange-500/10' },
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

              {/* Main Visual Graphs Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Area Chart: CGPA Growth */}
                <div className={`lg:col-span-2 p-6 rounded-2xl border backdrop-blur-xl ${
                  darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200'
                } shadow-xl`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold tracking-tight">Institutional CGPA Growth Curve</h3>
                      <p className="text-xs text-slate-400">Semester progression trend line</p>
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

                {/* Donut Chart: Risk Radar */}
                <div className={`p-6 rounded-2xl border backdrop-blur-xl ${
                  darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200'
                } shadow-xl flex flex-col justify-between`}>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">Academic Safety Radar</h3>
                    <p className="text-xs text-slate-400">AI prediction breakdown</p>
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

              {/* Bar Chart: Distribution */}
              <div className={`p-6 rounded-2xl border backdrop-blur-xl ${
                darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200'
              } shadow-xl`}>
                <h3 className="text-sm font-bold tracking-tight mb-1">Student Enrollment by Department</h3>
                <p className="text-xs text-slate-400 mb-6">Distribution across academic departments</p>
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

          {/* TAB 2: STUDENTS */}
          {activeTab === 'Students' && (
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
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20">
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredStudents.map((st) => (
                      <tr key={st.id} className={darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                        <td className="p-4 font-mono font-medium text-indigo-400">{st.roll}</td>
                        <td className="p-4 font-semibold">{st.name}</td>
                        <td className="p-4"><span className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px]">{st.dept}</span></td>
                        <td className="p-4">Sem {st.sem}</td>
                        <td className="p-4 font-bold">{st.cgpa}</td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ACADEMICS */}
          {activeTab === 'Academics' && (
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-base font-bold mb-4">Semester Exam Report & Grading Sheet</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400">
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
                    {[
                      { sub: 'Database Management Systems (DBMS)', int: 26, ext: 64, tot: 90, grade: 'O', status: 'Pass' },
                      { sub: 'Operating Systems (OS)', int: 22, ext: 58, tot: 80, grade: 'A+', status: 'Pass' },
                      { sub: 'Computer Networks (CN)', int: 24, ext: 62, tot: 86, grade: 'A+', status: 'Pass' },
                      { sub: 'Advanced Java Programming', int: 27, ext: 65, tot: 92, grade: 'O', status: 'Pass' },
                    ].map((item, idx) => (
                      <tr key={idx} className="h-12">
                        <td className="font-medium">{item.sub}</td>
                        <td>{item.int}</td>
                        <td>{item.ext}</td>
                        <td className="font-bold">{item.tot}</td>
                        <td><span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">{item.grade}</span></td>
                        <td><span className="text-emerald-400 font-semibold">{item.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE */}
          {activeTab === 'Attendance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { sub: 'Database Systems (DBMS)', pct: '92%', status: 'Safe' },
                  { sub: 'Operating Systems (OS)', pct: '84%', status: 'Safe' },
                  { sub: 'Computer Networks (CN)', pct: '71%', status: 'Warning (<75%)' },
                  { sub: 'Java Programming', pct: '88%', status: 'Safe' },
                ].map((att, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <p className="text-xs text-slate-400">{att.sub}</p>
                    <h3 className="text-xl font-bold mt-2">{att.pct}</h3>
                    <span className={`text-[10px] font-bold ${att.status.includes('Warning') ? 'text-rose-400' : 'text-emerald-400'}`}>{att.status}</span>
                  </div>
                ))}
              </div>

              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h3 className="text-sm font-bold mb-4">Monthly Attendance Log Calendar</h3>
                <div className="grid grid-cols-7 gap-2 text-center text-xs">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} className="font-bold text-slate-400">{d}</div>)}
                  {Array.from({ length: 28 }).map((_, idx) => {
                    const isAbsent = idx === 5 || idx === 18;
                    return (
                      <div key={idx} className={`p-2 rounded-lg border text-xs font-semibold ${
                        isAbsent 
                          ? 'bg-rose-500/20 border-rose-500/30 text-rose-300' 
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      }`}>
                        Day {idx + 1}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ASSIGNMENTS */}
          {activeTab === 'Assignments' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'SQL Joins & Indexing Query Task', sub: 'DBMS', due: '2 Days Left', marks: '25 Marks', totalSub: '42/48' },
                { title: 'Process Scheduling Algorithm in C', sub: 'OS', due: '5 Days Left', marks: '20 Marks', totalSub: '38/48' },
                { title: 'Socket Programming Client-Server', sub: 'Java', due: 'Completed', marks: '30 Marks', totalSub: '48/48' },
              ].map((asg, i) => (
                <div key={i} className={`p-5 rounded-2xl border flex flex-col justify-between ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-bold">{asg.sub}</span>
                    <h4 className="font-bold text-sm mt-2">{asg.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Due: {asg.due}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Submissions: <b className="text-white">{asg.totalSub}</b></span>
                    <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold">Grade</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: FACULTY */}
          {activeTab === 'Faculty' && (
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
          {activeTab === 'Analytics' && (
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

          {/* TAB 8: PREDICTION */}
          {activeTab === 'Prediction' && (
            <div className={`p-6 rounded-2xl border max-w-2xl ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-base font-bold mb-1 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
                Academic Risk Prediction Engine
              </h3>
              <p className="text-xs text-slate-400 mb-6">Automated risk assessment based on attendance and academic threshold.</p>

              <div className="space-y-3">
                {students.slice(0, 6).map((st) => (
                  <div key={st.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{st.name} ({st.roll})</p>
                      <p className="text-xs text-slate-500">Attendance: {st.attendance}% | CGPA: {st.cgpa} | Dept: {st.dept}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${st.risk === 'LOW' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                      {st.risk} RISK
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: DATASET MANAGER */}
          {activeTab === 'Dataset Manager' && (
            <div className="space-y-6">
              <div className={`p-8 rounded-2xl border text-center border-dashed ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white'}`}>
                <UploadCloud className="w-10 h-10 mx-auto text-indigo-400 mb-3" />
                <h4 className="font-bold text-sm">Upload New Dataset File (CSV / JSON)</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">Support for students.csv, marks.csv, and attendance logs</p>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold">
                  Browse Files
                </button>
              </div>

              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h4 className="font-bold text-sm mb-4">Active System Datasets</h4>
                <div className="space-y-2">
                  {[
                    { name: 'students.json', records: `${totalCount} records`, status: 'Parsed & Loaded' },
                    { name: 'exams_sem5.csv', records: '48 records', status: 'Active' },
                    { name: 'faculty_directory.csv', records: `${uniqueDepts.length} leads`, status: 'Active' },
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
    </div>
  );
}