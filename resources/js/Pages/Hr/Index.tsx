import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Award,
    BadgeAlert,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    DollarSign,
    Edit3,
    Eye,
    FileText,
    Filter,
    Key,
    Lock,
    LogOut,
    Mail,
    MessageSquare,
    MoreVertical,
    Phone,
    Plus,
    Printer,
    Search,
    Shield,
    Trash2,
    TrendingUp,
    UserCheck,
    UserMinus,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface Employee {
    id: string;
    employee_code: string;
    full_name: string;
    gender?: string;
    department: string;
    position: string;
    phone?: string;
    email?: string;
    nida_number?: string;
    date_of_birth?: string;
    salary_minor: number;
    employment_type: string;
    hire_date: string;
    emergency_contact?: string;
    address?: string;
    bank_name?: string;
    bank_account?: string;
    status: 'active' | 'on_leave' | 'suspended' | 'terminated';
    is_active: boolean;
    user?: { id: number; name: string; email: string; role?: string; pin_code?: string };
}

interface Schedule {
    id: string;
    shift_date: string;
    shift_type: 'morning' | 'evening' | 'night' | 'off';
    start_time?: string;
    end_time?: string;
    status: string;
    notes?: string;
    employee: {
        id: string;
        employee_code: string;
        full_name: string;
        department: string;
        position: string;
    };
}

interface Attendance {
    id: string;
    date: string;
    status: 'on_time' | 'late' | 'early_departure' | 'absent' | 'overtime' | 'excused';
    check_in_at?: string;
    check_out_at?: string;
    remarks?: string;
    employee: {
        id: string;
        employee_code: string;
        full_name: string;
        department: string;
        position: string;
    };
}

interface Leave {
    id: string;
    leave_type: 'annual' | 'sick' | 'maternity' | 'paternity' | 'emergency' | 'unpaid';
    start_date: string;
    end_date: string;
    days_count: number;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    manager_remarks?: string;
    created_at: string;
    employee: {
        id: string;
        employee_code: string;
        full_name: string;
        department: string;
        position: string;
    };
    approved_by?: {
        name: string;
    };
}

interface Payroll {
    id: string;
    payroll_month: string;
    base_salary_minor: number;
    allowance_minor: number;
    overtime_minor: number;
    nssf_deduction_minor: number;
    paye_deduction_minor: number;
    other_deductions_minor: number;
    net_salary_minor: number;
    payment_method: string;
    payment_reference?: string;
    status: 'draft' | 'approved' | 'paid';
    paid_at?: string;
    notes?: string;
    employee: {
        id: string;
        employee_code: string;
        full_name: string;
        department: string;
        position: string;
        bank_name?: string;
        bank_account?: string;
    };
}

interface Disciplinary {
    id: string;
    record_type: 'warning' | 'commendation' | 'query' | 'appraisal' | 'training';
    title: string;
    description: string;
    incident_date: string;
    action_taken?: string;
    created_at: string;
    employee: {
        id: string;
        employee_code: string;
        full_name: string;
        department: string;
        position: string;
    };
    creator?: {
        name: string;
    };
}

interface Stats {
    total_staff: number;
    active_staff: number;
    active_on_shift: number;
    present_today: number;
    on_leave_count: number;
    pending_leaves_count: number;
    total_monthly_payroll_minor: number;
    front_office_count: number;
    housekeeping_count: number;
    food_beverage_count: number;
    maintenance_count: number;
    security_count: number;
    accounts_count: number;
    management_count: number;
}

interface HrIndexProps extends PageProps {
    employees: Employee[];
    todaySchedules: Schedule[];
    attendances: Attendance[];
    leaves: Leave[];
    payrolls: Payroll[];
    disciplinaryRecords: Disciplinary[];
    stats: Stats;
    currentMonth: string;
    targetDate?: string;
    attendanceDate?: string;
}

export default function HrIndex({
    auth,
    employees = [],
    todaySchedules = [],
    attendances = [],
    leaves = [],
    payrolls = [],
    disciplinaryRecords = [],
    stats,
    currentMonth,
    targetDate,
    attendanceDate,
}: HrIndexProps) {
    const [activeTab, setActiveTab] = useState<'directory' | 'roster' | 'attendance' | 'leaves' | 'payroll' | 'performance'>('directory');
    const [selectedDept, setSelectedDept] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Modals state
    const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
    const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [isViewProfileOpen, setIsViewProfileOpen] = useState(false);
    const [isAssignShiftOpen, setIsAssignShiftOpen] = useState(false);
    const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
    const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
    const [isReviewLeaveOpen, setIsReviewLeaveOpen] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
    const [isViewPayslipOpen, setIsViewPayslipOpen] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
    const [isAddDisciplinaryOpen, setIsAddDisciplinaryOpen] = useState(false);

    // Form: Add Employee
    const staffForm = useForm({
        full_name: '',
        gender: 'male',
        department: 'Front Office',
        position: '',
        phone: '',
        email: '',
        nida_number: '',
        date_of_birth: '',
        salary: '',
        salary_minor: 0,
        employment_type: 'full_time',
        hire_date: new Date().toISOString().split('T')[0],
        emergency_contact: '',
        address: '',
        bank_name: '',
        bank_account: '',
        create_user_account: false,
        system_role: 'receptionist',
        password: '',
        pin_code: '',
    });

    // Form: Edit Employee
    const editStaffForm = useForm({
        id: '',
        full_name: '',
        gender: 'male',
        department: 'Front Office',
        position: '',
        phone: '',
        email: '',
        nida_number: '',
        date_of_birth: '',
        salary: '',
        salary_minor: 0,
        employment_type: 'full_time',
        hire_date: '',
        status: 'active',
        emergency_contact: '',
        address: '',
        bank_name: '',
        bank_account: '',
        system_role: 'staff',
        password: '',
        pin_code: '',
    });

    // Form: Assign Shift
    const shiftForm = useForm({
        employee_id: employees.length > 0 ? employees[0].id : '',
        shift_date: targetDate || new Date().toISOString().split('T')[0],
        shift_type: 'morning',
        start_time: '07:00',
        end_time: '15:30',
        notes: '',
    });

    // Form: Record Attendance
    const attendanceForm = useForm({
        employee_id: employees.length > 0 ? employees[0].id : '',
        attendance_date: attendanceDate || new Date().toISOString().split('T')[0],
        status: 'on_time',
        check_in_at: '07:00',
        check_out_at: '',
        remarks: '',
    });

    // Form: Apply Leave
    const leaveForm = useForm({
        employee_id: employees.length > 0 ? employees[0].id : '',
        leave_type: 'annual',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        reason: '',
    });

    // Form: Review Leave
    const reviewLeaveForm = useForm({
        status: 'approved',
        manager_remarks: '',
    });

    // Form: Add Disciplinary / Appraisal
    const disciplinaryForm = useForm({
        employee_id: employees.length > 0 ? employees[0].id : '',
        record_type: 'commendation',
        title: '',
        description: '',
        incident_date: new Date().toISOString().split('T')[0],
        action_taken: '',
    });

    const formatMoney = (minor: number) => {
        return new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            maximumFractionDigits: 0,
        }).format(minor / 100);
    };

    const filteredEmployees = useMemo(() => {
        return employees.filter((emp) => {
            const matchesDept = selectedDept === 'all' || emp.department === selectedDept;
            const matchesSearch =
                searchQuery === '' ||
                emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (emp.phone && emp.phone.includes(searchQuery));
            return matchesDept && matchesSearch;
        });
    }, [employees, selectedDept, searchQuery]);

    const handleCreateEmployee = (e: React.FormEvent) => {
        e.preventDefault();
        staffForm.post(route('hr.employees.store'), {
            onSuccess: () => {
                setIsAddStaffOpen(false);
                staffForm.reset();
            },
        });
    };

    const handleOpenEditEmployee = (emp: Employee) => {
        setSelectedEmployee(emp);
        editStaffForm.setData({
            id: emp.id,
            full_name: emp.full_name,
            gender: emp.gender || 'male',
            department: emp.department,
            position: emp.position,
            phone: emp.phone || '',
            email: emp.email || '',
            nida_number: emp.nida_number || '',
            date_of_birth: emp.date_of_birth ? emp.date_of_birth.substring(0, 10) : '',
            salary: (emp.salary_minor / 100).toString(),
            salary_minor: emp.salary_minor,
            employment_type: emp.employment_type || 'full_time',
            hire_date: emp.hire_date ? emp.hire_date.substring(0, 10) : '',
            status: emp.status,
            emergency_contact: emp.emergency_contact || '',
            address: emp.address || '',
            bank_name: emp.bank_name || '',
            bank_account: emp.bank_account || '',
            system_role: emp.user?.role || 'staff',
            password: '',
            pin_code: emp.user?.pin_code || '',
        });
        setIsEditStaffOpen(true);
    };

    const handleUpdateEmployee = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployee) return;
        editStaffForm.put(route('hr.employees.update', selectedEmployee.id), {
            onSuccess: () => {
                setIsEditStaffOpen(false);
            },
        });
    };

    const handleDeleteEmployee = (emp: Employee) => {
        if (confirm(`Are you sure you want to remove employee ${emp.full_name} from the system?`)) {
            router.delete(route('hr.employees.destroy', emp.id));
        }
    };

    const handleAssignShift = (e: React.FormEvent) => {
        e.preventDefault();
        shiftForm.post(route('hr.shifts.store'), {
            onSuccess: () => {
                setIsAssignShiftOpen(false);
                shiftForm.reset();
            },
        });
    };

    const handleDeleteShift = (id: string) => {
        if (confirm('Remove this shift assignment from the schedule?')) {
            router.delete(route('hr.shifts.destroy', id));
        }
    };

    const handleRecordAttendance = (e: React.FormEvent) => {
        e.preventDefault();
        attendanceForm.post(route('hr.attendance.store'), {
            onSuccess: () => {
                setIsAttendanceOpen(false);
                attendanceForm.reset();
            },
        });
    };

    const handleApplyLeave = (e: React.FormEvent) => {
        e.preventDefault();
        leaveForm.post(route('hr.leaves.store'), {
            onSuccess: () => {
                setIsApplyLeaveOpen(false);
                leaveForm.reset();
            },
        });
    };

    const handleOpenReviewLeave = (leave: Leave) => {
        setSelectedLeave(leave);
        reviewLeaveForm.setData({
            status: leave.status === 'pending' ? 'approved' : leave.status,
            manager_remarks: leave.manager_remarks || '',
        });
        setIsReviewLeaveOpen(true);
    };

    const handleUpdateLeaveStatus = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLeave) return;
        reviewLeaveForm.put(route('hr.leaves.update_status', selectedLeave.id), {
            onSuccess: () => {
                setIsReviewLeaveOpen(false);
            },
        });
    };

    const handleGeneratePayroll = () => {
        if (confirm(`Generate monthly payroll for ${currentMonth} for all active employees?`)) {
            router.post(route('hr.payrolls.generate'), { payroll_month: currentMonth });
        }
    };

    const handleUpdatePayrollStatus = (id: string, status: 'approved' | 'paid') => {
        router.put(route('hr.payrolls.update_status', id), { status });
    };

    const handleAddDisciplinary = (e: React.FormEvent) => {
        e.preventDefault();
        disciplinaryForm.post(route('hr.disciplinary.store'), {
            onSuccess: () => {
                setIsAddDisciplinaryOpen(false);
                disciplinaryForm.reset();
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Staff & Human Resources" />

            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                {/* Header Section */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                    Staff & Human Resources
                                </h1>
                                
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setIsAssignShiftOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                        >
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <span>Assign Shift</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAddStaffOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-xs cursor-pointer"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>Add Employee</span>
                        </button>
                    </div>
                </div>

                {/* Key Metrics Overview */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center justify-between text-slate-500 text-xs">
                            <span>Total Staff</span>
                            
                        </div>
                        <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.total_staff || 0}</p>
                        <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
                            {stats?.active_staff || 0} Active
                        </span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center justify-between text-slate-500 text-xs">
                            <span>On Shift Today</span>
                            
                        </div>
                        <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.active_on_shift || 0}</p>
                        
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center justify-between text-slate-500 text-xs">
                            <span>Present Today</span>
                            
                        </div>
                        <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.present_today || 0}</p>
                        
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center justify-between text-slate-500 text-xs">
                            <span>On Leave</span>
                            
                        </div>
                        <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.on_leave_count || 0}</p>
                        <span className="text-[11px] text-amber-600 font-medium mt-0.5 block">
                            {stats?.pending_leaves_count || 0} Pending
                        </span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs col-span-2">
                        <div className="flex items-center justify-between text-slate-500 text-xs">
                            <span>Monthly Base Payroll</span>
                            
                        </div>
                        <p className="text-2xl font-bold text-slate-900 mt-2">
                            {formatMoney(stats?.total_monthly_payroll_minor || 0)}
                        </p>
                        
                    </div>
                </div>

                {/* Department Distribution Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                    <button
                        onClick={() => setSelectedDept('all')}
                        className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                            selectedDept === 'all'
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        All Departments ({employees.length})
                    </button>
                    {['Front Office', 'Housekeeping', 'Food & Beverage', 'Maintenance', 'Security', 'Accounts', 'Management'].map((dept) => (
                        <button
                            key={dept}
                            onClick={() => setSelectedDept(dept)}
                            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                                selectedDept === dept
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {dept} ({employees.filter((e) => e.department === dept).length})
                        </button>
                    ))}
                </div>

                {/* 6 Tabs Navigation */}
                <div className="flex items-center border-b border-slate-200 gap-1 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('directory')}
                        className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                            activeTab === 'directory'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Staff Directory ({employees.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('roster')}
                        className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                            activeTab === 'roster'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Shift Roster ({todaySchedules.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                            activeTab === 'attendance'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Clock className="w-4 h-4" />
                        Attendance ({attendances.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('leaves')}
                        className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                            activeTab === 'leaves'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <LogOut className="w-4 h-4" />
                        Leave & Time Off ({leaves.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('payroll')}
                        className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                            activeTab === 'payroll'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <DollarSign className="w-4 h-4" />
                        Payroll & Payslips ({payrolls.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('performance')}
                        className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                            activeTab === 'performance'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Award className="w-4 h-4" />
                        Disciplinary & Records ({disciplinaryRecords.length})
                    </button>
                </div>

                {/* Tab 1: Staff Directory */}
                {activeTab === 'directory' && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="relative w-full sm:w-80">
                                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name, code, role, phone..."
                                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                                />
                            </div>
                            <span className="text-xs text-slate-500 self-end sm:self-center">
                                Showing {filteredEmployees.length} of {employees.length} employees
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                                        <th className="py-3 px-4">Employee</th>
                                        <th className="py-3 px-4">Department & Role</th>
                                        <th className="py-3 px-4">Contact</th>
                                        <th className="py-3 px-4">System Access</th>
                                        <th className="py-3 px-4">Base Salary</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredEmployees.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-slate-400">
                                                No employees found matching your criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEmployees.map((emp) => (
                                            <tr key={emp.id} className="hover:bg-slate-50/80 transition group">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                                                            {emp.full_name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-slate-900 block">
                                                                {emp.full_name}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-mono">
                                                                {emp.employee_code}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="font-medium text-slate-800 block">
                                                        {emp.position}
                                                    </span>
                                                    <span className="text-[11px] text-slate-500">
                                                        {emp.department} • {emp.employment_type.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-slate-700">
                                                        {emp.phone && (
                                                            <span className="flex items-center gap-1">
                                                                <Phone className="w-3 h-3 text-slate-400" />
                                                                {emp.phone}
                                                            </span>
                                                        )}
                                                        {emp.email && (
                                                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                                                <Mail className="w-3 h-3 text-slate-400" />
                                                                {emp.email}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {emp.user ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <Key className="w-3 h-3 text-emerald-600" />
                                                            {emp.user.role || 'User'}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                                                            No Login
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                                                    {formatMoney(emp.salary_minor)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                            emp.status === 'active'
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : emp.status === 'on_leave'
                                                                ? 'bg-amber-50 text-amber-700'
                                                                : emp.status === 'suspended'
                                                                ? 'bg-rose-50 text-rose-700'
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}
                                                    >
                                                        {emp.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="inline-flex items-center gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedEmployee(emp);
                                                                setIsViewProfileOpen(true);
                                                            }}
                                                            title="View Profile"
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenEditEmployee(emp)}
                                                            title="Edit Details & Password"
                                                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteEmployee(emp)}
                                                            title="Remove Employee"
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab 2: Shift Roster */}
                {activeTab === 'roster' && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <label className="text-xs font-bold text-slate-600">Schedule Date:</label>
                                <input
                                    type="date"
                                    value={shiftForm.data.shift_date}
                                    onChange={(e) => {
                                        shiftForm.setData('shift_date', e.target.value);
                                        router.get(route('hr.index'), { schedule_date: e.target.value }, { preserveState: true });
                                    }}
                                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 font-mono"
                                />
                            </div>

                            <button
                                onClick={() => setIsAssignShiftOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition cursor-pointer"
                            >
                                
                                <span>Assign New Shift</span>
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                                        <th className="py-3 px-4">Employee</th>
                                        <th className="py-3 px-4">Department & Role</th>
                                        <th className="py-3 px-4">Shift Type</th>
                                        <th className="py-3 px-4">Working Hours</th>
                                        <th className="py-3 px-4">Notes</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {todaySchedules.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-slate-400">
                                                No shifts scheduled for this date.
                                            </td>
                                        </tr>
                                    ) : (
                                        todaySchedules.map((sch) => (
                                            <tr key={sch.id} className="hover:bg-slate-50/80 transition">
                                                <td className="py-3 px-4">
                                                    <span className="font-bold text-slate-900 block">
                                                        {sch.employee?.full_name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        {sch.employee?.employee_code}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-slate-800">{sch.employee?.position}</span>
                                                    <span className="text-[10px] text-slate-400 block">{sch.employee?.department}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                            sch.shift_type === 'morning'
                                                                ? 'bg-amber-50 text-amber-700'
                                                                : sch.shift_type === 'evening'
                                                                ? 'bg-blue-50 text-blue-700'
                                                                : sch.shift_type === 'night'
                                                                ? 'bg-purple-50 text-purple-700'
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}
                                                    >
                                                        {sch.shift_type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-mono text-slate-700">
                                                    {sch.start_time && sch.end_time ? `${sch.start_time} - ${sch.end_time}` : 'Full Day'}
                                                </td>
                                                <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                                                    {sch.notes || '-'}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteShift(sch.id)}
                                                        title="Delete Shift"
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab 3: Daily Attendance */}
                {activeTab === 'attendance' && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <label className="text-xs font-bold text-slate-600">Attendance Date:</label>
                                <input
                                    type="date"
                                    value={attendanceForm.data.attendance_date}
                                    onChange={(e) => {
                                        attendanceForm.setData('attendance_date', e.target.value);
                                        router.get(route('hr.index'), { attendance_date: e.target.value }, { preserveState: true });
                                    }}
                                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 font-mono"
                                />
                            </div>

                            <button
                                onClick={() => setIsAttendanceOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition cursor-pointer"
                            >
                                <Clock className="w-3.5 h-3.5" />
                                <span>Record Attendance (Clock In)</span>
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                                        <th className="py-3 px-4">Employee</th>
                                        <th className="py-3 px-4">Department & Role</th>
                                        <th className="py-3 px-4">Check-In</th>
                                        <th className="py-3 px-4">Check-Out</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {attendances.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-slate-400">
                                                No attendance records found for this date.
                                            </td>
                                        </tr>
                                    ) : (
                                        attendances.map((att) => (
                                            <tr key={att.id} className="hover:bg-slate-50/80 transition">
                                                <td className="py-3 px-4">
                                                    <span className="font-bold text-slate-900 block">
                                                        {att.employee?.full_name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        {att.employee?.employee_code}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-slate-800">{att.employee?.position}</span>
                                                    <span className="text-[10px] text-slate-400 block">{att.employee?.department}</span>
                                                </td>
                                                <td className="py-3 px-4 font-mono text-slate-800">
                                                    {att.check_in_at ? att.check_in_at.substring(11, 16) : '-'}
                                                </td>
                                                <td className="py-3 px-4 font-mono text-slate-800">
                                                    {att.check_out_at ? att.check_out_at.substring(11, 16) : '-'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                            att.status === 'on_time'
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : att.status === 'late'
                                                                ? 'bg-amber-50 text-amber-700'
                                                                : att.status === 'absent'
                                                                ? 'bg-rose-50 text-rose-700'
                                                                : 'bg-blue-50 text-blue-700'
                                                        }`}
                                                    >
                                                        {att.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                                                    {att.remarks || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab 4: Leave & Time Off */}
                {activeTab === 'leaves' && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Leave Applications & Approvals</h3>
                                
                            </div>

                            <button
                                onClick={() => setIsApplyLeaveOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition cursor-pointer"
                            >
                                
                                <span>Apply for Leave</span>
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                                        <th className="py-3 px-4">Employee</th>
                                        <th className="py-3 px-4">Leave Type</th>
                                        <th className="py-3 px-4">Duration</th>
                                        <th className="py-3 px-4">Days</th>
                                        <th className="py-3 px-4">Reason</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {leaves.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-slate-400">
                                                No leave applications submitted yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        leaves.map((lv) => (
                                            <tr key={lv.id} className="hover:bg-slate-50/80 transition">
                                                <td className="py-3 px-4">
                                                    <span className="font-bold text-slate-900 block">
                                                        {lv.employee?.full_name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        {lv.employee?.employee_code}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="font-semibold text-slate-800 capitalize">
                                                        {lv.leave_type} Leave
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-mono text-slate-700">
                                                    {lv.start_date} to {lv.end_date}
                                                </td>
                                                <td className="py-3 px-4 font-bold text-slate-900">
                                                    {lv.days_count} day(s)
                                                </td>
                                                <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                                                    {lv.reason || '-'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                            lv.status === 'approved'
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : lv.status === 'pending'
                                                                ? 'bg-amber-50 text-amber-700'
                                                                : lv.status === 'rejected'
                                                                ? 'bg-rose-50 text-rose-700'
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}
                                                    >
                                                        {lv.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        onClick={() => handleOpenReviewLeave(lv)}
                                                        className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg transition cursor-pointer"
                                                    >
                                                        Review
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab 5: Payroll & Payslips */}
                {activeTab === 'payroll' && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <label className="text-xs font-bold text-slate-600">Payroll Month:</label>
                                <input
                                    type="month"
                                    value={currentMonth}
                                    onChange={(e) => {
                                        router.get(route('hr.index'), { payroll_month: e.target.value }, { preserveState: true });
                                    }}
                                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 font-mono"
                                />
                            </div>

                            <button
                                onClick={handleGeneratePayroll}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                            >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>Generate Payroll for {currentMonth}</span>
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                                        <th className="py-3 px-4">Employee</th>
                                        <th className="py-3 px-4">Base Salary</th>
                                        <th className="py-3 px-4">NSSF (10%)</th>
                                        <th className="py-3 px-4">PAYE Tax</th>
                                        <th className="py-3 px-4">Net Salary</th>
                                        <th className="py-3 px-4">Method</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {payrolls.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-12 text-center text-slate-400">
                                                No payroll generated for {currentMonth}. Click "Generate Payroll" above to compute.
                                            </td>
                                        </tr>
                                    ) : (
                                        payrolls.map((pr) => (
                                            <tr key={pr.id} className="hover:bg-slate-50/80 transition">
                                                <td className="py-3 px-4">
                                                    <span className="font-bold text-slate-900 block">
                                                        {pr.employee?.full_name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        {pr.employee?.employee_code} • {pr.employee?.position}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-mono text-slate-800">
                                                    {formatMoney(pr.base_salary_minor)}
                                                </td>
                                                <td className="py-3 px-4 font-mono text-rose-600">
                                                    -{formatMoney(pr.nssf_deduction_minor)}
                                                </td>
                                                <td className="py-3 px-4 font-mono text-rose-600">
                                                    -{formatMoney(pr.paye_deduction_minor)}
                                                </td>
                                                <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                                                    {formatMoney(pr.net_salary_minor)}
                                                </td>
                                                <td className="py-3 px-4 uppercase text-slate-600 font-semibold text-[10px]">
                                                    {pr.payment_method}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                            pr.status === 'paid'
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : pr.status === 'approved'
                                                                ? 'bg-blue-50 text-blue-700'
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}
                                                    >
                                                        {pr.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedPayroll(pr);
                                                                setIsViewPayslipOpen(true);
                                                            }}
                                                            title="View / Print Payslip"
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                                        >
                                                            <Printer className="w-4 h-4" />
                                                        </button>
                                                        {pr.status === 'draft' && (
                                                            <button
                                                                onClick={() => handleUpdatePayrollStatus(pr.id, 'approved')}
                                                                className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition cursor-pointer"
                                                            >
                                                                Approve
                                                            </button>
                                                        )}
                                                        {pr.status === 'approved' && (
                                                            <button
                                                                onClick={() => handleUpdatePayrollStatus(pr.id, 'paid')}
                                                                className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
                                                            >
                                                                Mark Paid
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tab 6: Performance & Disciplinary */}
                {activeTab === 'performance' && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Performance & Disciplinary Logs</h3>
                                
                            </div>

                            <button
                                onClick={() => setIsAddDisciplinaryOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition cursor-pointer"
                            >
                                
                                <span>Record Event</span>
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                                        <th className="py-3 px-4">Date</th>
                                        <th className="py-3 px-4">Employee</th>
                                        <th className="py-3 px-4">Type</th>
                                        <th className="py-3 px-4">Title & Details</th>
                                        <th className="py-3 px-4">Action Taken</th>
                                        <th className="py-3 px-4">Logged By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {disciplinaryRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-slate-400">
                                                No performance or disciplinary records logged.
                                            </td>
                                        </tr>
                                    ) : (
                                        disciplinaryRecords.map((rec) => (
                                            <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                                                <td className="py-3 px-4 font-mono text-slate-700">
                                                    {rec.incident_date}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="font-bold text-slate-900 block">
                                                        {rec.employee?.full_name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        {rec.employee?.employee_code}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                            rec.record_type === 'commendation'
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : rec.record_type === 'warning'
                                                                ? 'bg-rose-50 text-rose-700'
                                                                : rec.record_type === 'query'
                                                                ? 'bg-amber-50 text-amber-700'
                                                                : 'bg-blue-50 text-blue-700'
                                                        }`}
                                                    >
                                                        {rec.record_type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 max-w-md">
                                                    <span className="font-bold text-slate-900 block">{rec.title}</span>
                                                    <span className="text-slate-500 text-[11px] line-clamp-2">{rec.description}</span>
                                                </td>
                                                <td className="py-3 px-4 text-slate-700">
                                                    {rec.action_taken || '-'}
                                                </td>
                                                <td className="py-3 px-4 text-slate-500 text-[11px]">
                                                    {rec.creator?.name || 'Manager'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL 1: ADD EMPLOYEE (With Password & Login Access) */}
            {isAddStaffOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200/80 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                            <div>
                                <h3 className="font-bold text-base text-slate-900">Add New Employee</h3>
                                
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddStaffOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateEmployee} className="space-y-4 pt-4 text-xs">
                            {/* Personal Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={staffForm.data.full_name}
                                        onChange={(e) => staffForm.setData('full_name', e.target.value)}
                                        placeholder="e.g. John Mwita"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Gender</label>
                                    <select
                                        value={staffForm.data.gender}
                                        onChange={(e) => staffForm.setData('gender', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={staffForm.data.phone}
                                        onChange={(e) => staffForm.setData('phone', e.target.value)}
                                        placeholder="+255 7XX XXX XXX"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={staffForm.data.email}
                                        onChange={(e) => staffForm.setData('email', e.target.value)}
                                        placeholder="staff@hotel.com"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                    {staffForm.errors.email && (
                                        <span className="text-rose-600 text-[11px] mt-1 block">{staffForm.errors.email}</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">National ID (NIDA)</label>
                                    <input
                                        type="text"
                                        value={staffForm.data.nida_number}
                                        onChange={(e) => staffForm.setData('nida_number', e.target.value)}
                                        placeholder="1990XXXXXXXXXXXXXX"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={staffForm.data.date_of_birth}
                                        onChange={(e) => staffForm.setData('date_of_birth', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                    />
                                </div>
                            </div>

                            {/* Department & Employment */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Department *</label>
                                    <select
                                        value={staffForm.data.department}
                                        onChange={(e) => staffForm.setData('department', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                    >
                                        <option value="Front Office">Front Office</option>
                                        <option value="Housekeeping">Housekeeping</option>
                                        <option value="Food & Beverage">Food & Beverage</option>
                                        <option value="Kitchen">Kitchen</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Security">Security</option>
                                        <option value="Accounts">Accounts</option>
                                        <option value="Management">Management</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Position / Job Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={staffForm.data.position}
                                        onChange={(e) => staffForm.setData('position', e.target.value)}
                                        placeholder="e.g. Front Desk Officer"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Employment Type *</label>
                                    <select
                                        value={staffForm.data.employment_type}
                                        onChange={(e) => staffForm.setData('employment_type', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                    >
                                        <option value="full_time">Full-Time</option>
                                        <option value="part_time">Part-Time</option>
                                        <option value="contract">Contract</option>
                                        <option value="casual">Casual</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Base Monthly Salary (TZS) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={staffForm.data.salary}
                                        onChange={(e) => staffForm.setData('salary', e.target.value)}
                                        placeholder="e.g. 500000"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Hire / Joining Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={staffForm.data.hire_date}
                                        onChange={(e) => staffForm.setData('hire_date', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                    />
                                </div>
                            </div>

                            {/* Bank Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                                    <input
                                        type="text"
                                        value={staffForm.data.bank_name}
                                        onChange={(e) => staffForm.setData('bank_name', e.target.value)}
                                        placeholder="CRDB, NMB, M-Pesa..."
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Bank Account / Phone Number</label>
                                    <input
                                        type="text"
                                        value={staffForm.data.bank_account}
                                        onChange={(e) => staffForm.setData('bank_account', e.target.value)}
                                        placeholder="0152XXXXXXXX..."
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                    />
                                </div>
                            </div>

                            {/* System Login & Credentials Access (Requested Feature) */}
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                            <Shield className="w-4 h-4 text-blue-600" />
                                            System Login Access & Password
                                        </h4>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Enable this to assign a password so this employee can log into the system.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={staffForm.data.create_user_account}
                                            onChange={(e) => staffForm.setData('create_user_account', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                {staffForm.data.create_user_account && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                                        <div>
                                            <label className="font-bold text-slate-700 block mb-1">
                                                System Role <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={staffForm.data.system_role}
                                                onChange={(e) => staffForm.setData('system_role', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                            >
                                                <option value="receptionist">Front Desk / Receptionist</option>
                                                <option value="general_manager">General Manager / Admin</option>
                                                <option value="accountant">Accountant / Finance</option>
                                                <option value="cashier">POS Cashier</option>
                                                <option value="waiter">Restaurant Waiter</option>
                                                <option value="chef">Kitchen Chef</option>
                                                <option value="housekeeper">Housekeeper</option>
                                                <option value="storekeeper">Store / Inventory Manager</option>
                                                <option value="staff">General Staff</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="font-bold text-slate-700 block mb-1">
                                                Login Password <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="password"
                                                value={staffForm.data.password}
                                                onChange={(e) => staffForm.setData('password', e.target.value)}
                                                placeholder="Min. 6 characters"
                                                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                            />
                                            {staffForm.errors.password && (
                                                <span className="text-rose-600 text-[11px] mt-1 block">{staffForm.errors.password}</span>
                                            )}
                                        </div>
                                        <div>
                                            <label className="font-bold text-slate-700 block mb-1">
                                                Quick PIN (Optional)
                                            </label>
                                            <input
                                                type="password"
                                                maxLength={6}
                                                value={staffForm.data.pin_code}
                                                onChange={(e) => staffForm.setData('pin_code', e.target.value)}
                                                placeholder="4-digit PIN for POS"
                                                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setIsAddStaffOpen(false)}
                                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={staffForm.processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                                >
                                    Save Employee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: EDIT EMPLOYEE (With Password Reset/Update) */}
            {isEditStaffOpen && selectedEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200/80 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                            <div>
                                <h3 className="font-bold text-base text-slate-900">Edit Employee Details</h3>
                                
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEditStaffOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateEmployee} className="space-y-4 pt-4 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={editStaffForm.data.full_name}
                                        onChange={(e) => editStaffForm.setData('full_name', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Employment Status</label>
                                    <select
                                        value={editStaffForm.data.status}
                                        onChange={(e) => editStaffForm.setData('status', e.target.value as any)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                    >
                                        <option value="active">Active</option>
                                        <option value="on_leave">On Leave</option>
                                        <option value="suspended">Suspended</option>
                                        <option value="terminated">Terminated</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={editStaffForm.data.phone}
                                        onChange={(e) => editStaffForm.setData('phone', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={editStaffForm.data.email}
                                        onChange={(e) => editStaffForm.setData('email', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Department</label>
                                    <select
                                        value={editStaffForm.data.department}
                                        onChange={(e) => editStaffForm.setData('department', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                    >
                                        <option value="Front Office">Front Office</option>
                                        <option value="Housekeeping">Housekeeping</option>
                                        <option value="Food & Beverage">Food & Beverage</option>
                                        <option value="Kitchen">Kitchen</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Security">Security</option>
                                        <option value="Accounts">Accounts</option>
                                        <option value="Management">Management</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Position</label>
                                    <input
                                        type="text"
                                        required
                                        value={editStaffForm.data.position}
                                        onChange={(e) => editStaffForm.setData('position', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Monthly Salary (TZS)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editStaffForm.data.salary}
                                        onChange={(e) => editStaffForm.setData('salary', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                                    <input
                                        type="text"
                                        value={editStaffForm.data.bank_name}
                                        onChange={(e) => editStaffForm.setData('bank_name', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Bank Account</label>
                                    <input
                                        type="text"
                                        value={editStaffForm.data.bank_account}
                                        onChange={(e) => editStaffForm.setData('bank_account', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                    />
                                </div>
                            </div>

                            {/* System Login & Password Reset */}
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                        <Shield className="w-4 h-4 text-blue-600" />
                                        System Login & Password Credentials
                                    </h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        {selectedEmployee?.user
                                            ? `Linked login account: ${selectedEmployee.user.email} (Current Role: ${selectedEmployee.user.role || 'staff'})`
                                            : 'No system login account linked yet. Enter a password below to create one.'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">System Role</label>
                                        <select
                                            value={editStaffForm.data.system_role}
                                            onChange={(e) => editStaffForm.setData('system_role', e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                        >
                                            <option value="receptionist">Front Desk / Receptionist</option>
                                            <option value="general_manager">General Manager / Admin</option>
                                            <option value="accountant">Accountant / Finance</option>
                                            <option value="cashier">POS Cashier</option>
                                            <option value="waiter">Restaurant Waiter</option>
                                            <option value="chef">Kitchen Chef</option>
                                            <option value="housekeeper">Housekeeper</option>
                                            <option value="storekeeper">Store / Inventory Keeper</option>
                                            <option value="staff">General Staff</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">
                                            {selectedEmployee?.user ? 'New Password' : 'Set Password'}
                                        </label>
                                        <input
                                            type="password"
                                            value={editStaffForm.data.password}
                                            onChange={(e) => editStaffForm.setData('password', e.target.value)}
                                            placeholder={selectedEmployee?.user ? 'Leave blank to keep unchanged' : 'Min. 6 characters'}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">Quick PIN</label>
                                        <input
                                            type="password"
                                            maxLength={6}
                                            value={editStaffForm.data.pin_code}
                                            onChange={(e) => editStaffForm.setData('pin_code', e.target.value)}
                                            placeholder="4-digit PIN for POS"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setIsEditStaffOpen(false)}
                                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editStaffForm.processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                                >
                                    Update Details
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: VIEW PROFILE */}
            {isViewProfileOpen && selectedEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200/80">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                            <div>
                                <h3 className="font-bold text-base text-slate-900">{selectedEmployee.full_name}</h3>
                                <p className="text-xs text-slate-500 font-mono">{selectedEmployee.employee_code}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsViewProfileOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="py-4 space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Department</span>
                                    <span className="font-bold text-slate-800">{selectedEmployee.department}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Position</span>
                                    <span className="font-bold text-slate-800">{selectedEmployee.position}</span>
                                </div>
                                <div className="mt-2">
                                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Joining Date</span>
                                    <span className="font-medium text-slate-700">{selectedEmployee.hire_date}</span>
                                </div>
                                <div className="mt-2">
                                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Base Salary</span>
                                    <span className="font-bold text-emerald-700 font-mono">{formatMoney(selectedEmployee.salary_minor)}</span>
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <div className="flex justify-between py-1 border-b border-slate-100">
                                    <span className="text-slate-500">Phone:</span>
                                    <span className="font-semibold text-slate-800">{selectedEmployee.phone || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-100">
                                    <span className="text-slate-500">Email:</span>
                                    <span className="font-semibold text-slate-800">{selectedEmployee.email || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-100">
                                    <span className="text-slate-500">National ID (NIDA):</span>
                                    <span className="font-mono text-slate-800">{selectedEmployee.nida_number || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-100">
                                    <span className="text-slate-500">Bank / Payment:</span>
                                    <span className="text-slate-800 font-medium">
                                        {selectedEmployee.bank_name ? `${selectedEmployee.bank_name} (${selectedEmployee.bank_account})` : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-slate-500">System Login:</span>
                                    <span className="text-slate-800 font-medium">
                                        {selectedEmployee.user ? `Enabled (${selectedEmployee.user.role || 'Staff'})` : 'No Login Account'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-3 flex justify-end border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => setIsViewProfileOpen(false)}
                                className="px-4 py-1.5 bg-slate-900 text-white rounded-xl font-bold cursor-pointer text-xs"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: ASSIGN SHIFT */}
            {isAssignShiftOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200/80">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                            <div>
                                <h3 className="font-bold text-base text-slate-900">Assign Shift</h3>
                                
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAssignShiftOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAssignShift} className="space-y-4 pt-4 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Select Employee *</label>
                                <select
                                    required
                                    value={shiftForm.data.employee_id}
                                    onChange={(e) => shiftForm.setData('employee_id', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                >
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.full_name} ({emp.position} - {emp.department})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Shift Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={shiftForm.data.shift_date}
                                        onChange={(e) => shiftForm.setData('shift_date', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Shift Type *</label>
                                    <select
                                        value={shiftForm.data.shift_type}
                                        onChange={(e) => shiftForm.setData('shift_type', e.target.value as any)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                    >
                                        <option value="morning">Morning (06:00 - 14:00)</option>
                                        <option value="evening">Evening (14:00 - 22:00)</option>
                                        <option value="night">Night (22:00 - 06:00)</option>
                                        <option value="off">Day Off (Ruhusa/Mapumziko)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={shiftForm.data.start_time}
                                        onChange={(e) => shiftForm.setData('start_time', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={shiftForm.data.end_time}
                                        onChange={(e) => shiftForm.setData('end_time', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Shift Notes</label>
                                <textarea
                                    rows={2}
                                    value={shiftForm.data.notes}
                                    onChange={(e) => shiftForm.setData('notes', e.target.value)}
                                    placeholder="Optional notes or instructions..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                />
                            </div>

                            <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setIsAssignShiftOpen(false)}
                                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={shiftForm.processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                                >
                                    Save Shift
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 5: RECORD ATTENDANCE */}
            {isAttendanceOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200/80">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                            <div>
                                <h3 className="font-bold text-base text-slate-900">Record Attendance</h3>
                                
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAttendanceOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleRecordAttendance} className="space-y-4 pt-4 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Select Employee *</label>
                                <select
                                    required
                                    value={attendanceForm.data.employee_id}
                                    onChange={(e) => attendanceForm.setData('employee_id', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                >
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.full_name} ({emp.position})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={attendanceForm.data.attendance_date}
                                        onChange={(e) => attendanceForm.setData('attendance_date', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Status *</label>
                                    <select
                                        value={attendanceForm.data.status}
                                        onChange={(e) => attendanceForm.setData('status', e.target.value as any)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                    >
                                        <option value="on_time">On Time</option>
                                        <option value="late">Late</option>
                                        <option value="early_departure">Early Departure</option>
                                        <option value="absent">Absent</option>
                                        <option value="overtime">Overtime</option>
                                        <option value="excused">Excused / Authorized</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Clock-In Time</label>
                                    <input
                                        type="time"
                                        value={attendanceForm.data.check_in_at}
                                        onChange={(e) => attendanceForm.setData('check_in_at', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Clock-Out Time</label>
                                    <input
                                        type="time"
                                        value={attendanceForm.data.check_out_at}
                                        onChange={(e) => attendanceForm.setData('check_out_at', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Remarks / Note</label>
                                <textarea
                                    rows={2}
                                    value={attendanceForm.data.remarks}
                                    onChange={(e) => attendanceForm.setData('remarks', e.target.value)}
                                    placeholder="Optional attendance remarks..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                />
                            </div>

                            <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setIsAttendanceOpen(false)}
                                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={attendanceForm.processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                                >
                                    Save Attendance
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 6: APPLY LEAVE */}
            {isApplyLeaveOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200/80">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                            <div>
                                <h3 className="font-bold text-base text-slate-900">Apply for Leave</h3>
                                
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsApplyLeaveOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleApplyLeave} className="space-y-4 pt-4 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Select Employee *</label>
                                <select
                                    required
                                    value={leaveForm.data.employee_id}
                                    onChange={(e) => leaveForm.setData('employee_id', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                >
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.full_name} ({emp.position})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Leave Type *</label>
                                <select
                                    value={leaveForm.data.leave_type}
                                    onChange={(e) => leaveForm.setData('leave_type', e.target.value as any)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                >
                                    <option value="annual">Annual Leave</option>
                                    <option value="sick">Sick Leave</option>
                                    <option value="maternity">Maternity Leave</option>
                                    <option value="paternity">Paternity Leave</option>
                                    <option value="emergency">Emergency Leave</option>
                                    <option value="unpaid">Unpaid Leave</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Start Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={leaveForm.data.start_date}
                                        onChange={(e) => leaveForm.setData('start_date', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">End Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={leaveForm.data.end_date}
                                        onChange={(e) => leaveForm.setData('end_date', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Reason for Leave *</label>
                                <textarea
                                    rows={3}
                                    required
                                    value={leaveForm.data.reason}
                                    onChange={(e) => leaveForm.setData('reason', e.target.value)}
                                    placeholder="Explain reason for leave request..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                />
                            </div>

                            <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setIsApplyLeaveOpen(false)}
                                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={leaveForm.processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                                >
                                    Submit Application
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 7: REVIEW LEAVE */}
            {isReviewLeaveOpen && selectedLeave && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200/80">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                            <div>
                                <h3 className="font-bold text-base text-slate-900">Review Leave Request</h3>
                                <p className="text-xs text-slate-500">{selectedLeave.employee?.full_name}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsReviewLeaveOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateLeaveStatus} className="space-y-4 pt-4 text-xs">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                                <p><strong>Leave Type:</strong> <span className="capitalize">{selectedLeave.leave_type} Leave</span></p>
                                <p><strong>Dates:</strong> {selectedLeave.start_date} to {selectedLeave.end_date} ({selectedLeave.days_count} days)</p>
                                <p><strong>Reason:</strong> {selectedLeave.reason}</p>
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Decision *</label>
                                <select
                                    value={reviewLeaveForm.data.status}
                                    onChange={(e) => reviewLeaveForm.setData('status', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                                >
                                    <option value="approved">Approve Leave</option>
                                    <option value="rejected">Reject Leave</option>
                                    <option value="cancelled">Cancel Request</option>
                                </select>
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Manager Remarks / Feedback</label>
                                <textarea
                                    rows={2}
                                    value={reviewLeaveForm.data.manager_remarks}
                                    onChange={(e) => reviewLeaveForm.setData('manager_remarks', e.target.value)}
                                    placeholder="Optional comments for employee..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                />
                            </div>

                            <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setIsReviewLeaveOpen(false)}
                                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={reviewLeaveForm.processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                                >
                                    Submit Decision
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 8: VIEW & PRINT PAYSLIP */}
            {isViewPayslipOpen && selectedPayroll && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl border border-slate-200/80 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Official Payslip</span>
                                <h3 className="font-bold text-base text-slate-900">Monthly Salary Statement</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Print</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsViewPayslipOpen(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="py-6 space-y-6 text-xs">
                            {/* Hotel Header */}
                            <div className="text-center pb-4 border-b border-slate-100">
                                <h2 className="text-lg font-black text-slate-900 tracking-tight">THE INNS HOTEL & SANCTUARY</h2>
                                <p className="text-[11px] text-slate-500 mt-0.5">Salary Advice & Payslip • Month of {selectedPayroll.payroll_month}</p>
                            </div>

                            {/* Employee Info Grid */}
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                                <div>
                                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Employee Name</span>
                                    <span className="font-bold text-slate-900 text-sm">{selectedPayroll.employee?.full_name}</span>
                                    <span className="text-[10px] text-slate-500 font-mono block">{selectedPayroll.employee?.employee_code}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Role & Department</span>
                                    <span className="font-semibold text-slate-800">{selectedPayroll.employee?.position}</span>
                                    <span className="text-[10px] text-slate-500 block">{selectedPayroll.employee?.department}</span>
                                </div>
                                <div className="mt-1">
                                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Payment Method</span>
                                    <span className="font-semibold text-slate-800 uppercase">{selectedPayroll.payment_method}</span>
                                </div>
                                <div className="mt-1">
                                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Account / Bank</span>
                                    <span className="font-mono text-slate-700">{selectedPayroll.employee?.bank_name || 'Cash/M-Pesa'}</span>
                                </div>
                            </div>

                            {/* Earnings & Deductions Breakdown */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Earnings</h4>
                                    <div className="space-y-1.5 border-b border-slate-100 pb-2">
                                        <div className="flex justify-between">
                                            <span className="text-slate-700">Base Salary</span>
                                            <span className="font-mono font-bold text-slate-900">{formatMoney(selectedPayroll.base_salary_minor)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Statutory Deductions</h4>
                                    <div className="space-y-1.5 border-b border-slate-100 pb-2">
                                        <div className="flex justify-between">
                                            <span className="text-slate-700">NSSF Contribution (10%)</span>
                                            <span className="font-mono font-bold text-rose-600">-{formatMoney(selectedPayroll.nssf_deduction_minor)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-700">PAYE Income Tax</span>
                                            <span className="font-mono font-bold text-rose-600">-{formatMoney(selectedPayroll.paye_deduction_minor)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Net Pay */}
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex justify-between items-center">
                                    <div>
                                        <span className="text-xs font-bold text-emerald-900 uppercase block">Net Pay Amount</span>
                                        <span className="text-[10px] text-emerald-700">Total Take-Home Pay</span>
                                    </div>
                                    <span className="text-xl font-black text-emerald-800 font-mono">
                                        {formatMoney(selectedPayroll.net_salary_minor)}
                                    </span>
                                </div>
                            </div>

                            {/* Signatures */}
                            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center text-[10px] text-slate-500">
                                <div>
                                    <div className="border-b border-slate-300 pb-8 mb-1"></div>
                                    <span>Employer Signature & Stamp</span>
                                </div>
                                <div>
                                    <div className="border-b border-slate-300 pb-8 mb-1"></div>
                                    <span>Employee Signature</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => setIsViewPayslipOpen(false)}
                                className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer text-xs"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 9: ADD DISCIPLINARY / PERFORMANCE RECORD */}
            {isAddDisciplinaryOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200/80">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                            <div>
                                <h3 className="font-bold text-base text-slate-900">Log Performance / Disciplinary Event</h3>
                                <p className="text-xs text-slate-500">Record recognition, warning, query or appraisal</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddDisciplinaryOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddDisciplinary} className="space-y-4 pt-4 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Select Employee *</label>
                                <select
                                    required
                                    value={disciplinaryForm.data.employee_id}
                                    onChange={(e) => disciplinaryForm.setData('employee_id', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                                >
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.full_name} ({emp.position})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Record Type *</label>
                                    <select
                                        value={disciplinaryForm.data.record_type}
                                        onChange={(e) => disciplinaryForm.setData('record_type', e.target.value as any)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                                    >
                                        <option value="commendation">Commendation (Praise)</option>
                                        <option value="warning">Official Warning</option>
                                        <option value="query">Query / Explanation</option>
                                        <option value="appraisal">Performance Appraisal</option>
                                        <option value="training">Training Record</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Incident Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={disciplinaryForm.data.incident_date}
                                        onChange={(e) => disciplinaryForm.setData('incident_date', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Event Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={disciplinaryForm.data.title}
                                    onChange={(e) => disciplinaryForm.setData('title', e.target.value)}
                                    placeholder="e.g. Employee of the Month, Habitual Late Arrival..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Description & Details *</label>
                                <textarea
                                    rows={3}
                                    required
                                    value={disciplinaryForm.data.description}
                                    onChange={(e) => disciplinaryForm.setData('description', e.target.value)}
                                    placeholder="Detailed description of the event or accomplishment..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Action Taken (Optional)</label>
                                <input
                                    type="text"
                                    value={disciplinaryForm.data.action_taken}
                                    onChange={(e) => disciplinaryForm.setData('action_taken', e.target.value)}
                                    placeholder="e.g. First Written Warning, Bonus Awarded..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                                />
                            </div>

                            <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setIsAddDisciplinaryOpen(false)}
                                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={disciplinaryForm.processing}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                                >
                                    Save Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
