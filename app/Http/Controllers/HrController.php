<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Property;
use App\Models\StaffAttendance;
use App\Models\StaffDisciplinaryRecord;
use App\Models\StaffLeave;
use App\Models\StaffPayroll;
use App\Models\StaffSchedule;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class HrController extends Controller
{
    /**
     * Resolve active tenant ID and property.
     */
    private function resolveTenantAndProperty(?Request $request): array
    {
        $user = $request?->user();

        if ($user && ! $user->canAccessHr()) {
            abort(403, 'Unauthorized. Staff and POS station operators cannot access Staff & HR Management.');
        }

        $tenantId = $user?->tenant_id;

        if ($tenantId) {
            $property = $user?->property ?? Property::where('tenant_id', $tenantId)->first();
            if (! $property) {
                $tenant = Tenant::find($tenantId);
                $propertyName = $tenant ? $tenant->name.' Main Lodge' : 'Main Lodge';
                $property = Property::create([
                    'tenant_id' => $tenantId,
                    'name' => $propertyName,
                    'code' => strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $propertyName), 0, 4)),
                    'is_main' => true,
                    'property_type' => 'hotel',
                    'city' => 'Dar es Salaam',
                    'country' => 'Tanzania',
                    'currency' => 'TZS',
                    'is_active' => true,
                ]);
            }
        } else {
            $property = Property::first();
            $tenantId = $property?->tenant_id;
        }

        return [$tenantId, $property];
    }

    /**
     * Display comprehensive Staff & HR management hub.
     */
    public function index(Request $request): Response
    {
        [$tenantId, $property] = $this->resolveTenantAndProperty($request);

        // Auto-link any hotel user account that doesn't have an employee record yet
        $tenantUsers = User::where('tenant_id', $tenantId)->get();
        foreach ($tenantUsers as $u) {
            $hasEmp = Employee::where('tenant_id', $tenantId)
                ->where(function ($q) use ($u) {
                    $q->where('user_id', $u->id)->orWhere('email', $u->email);
                })
                ->exists();

            if (! $hasEmp) {
                Employee::create([
                    'tenant_id' => $tenantId,
                    'property_id' => $property?->id,
                    'user_id' => $u->id,
                    'employee_code' => 'EMP-'.strtoupper(substr(uniqid(), -4)),
                    'full_name' => $u->name,
                    'email' => $u->email,
                    'phone' => $u->phone,
                    'department' => match ($u->role) {
                        'general_manager', 'owner', 'manager' => 'Management',
                        'accountant' => 'Accounts',
                        'housekeeper' => 'Housekeeping',
                        'chef', 'waiter' => 'Food & Beverage',
                        'receptionist' => 'Front Office',
                        default => 'Front Office',
                    },
                    'position' => ucwords(str_replace('_', ' ', $u->role ?: 'Staff Member')),
                    'salary_minor' => 0,
                    'employment_type' => 'full_time',
                    'hire_date' => Carbon::now()->toDateString(),
                    'status' => ($u->status === 'active' || ($u->is_active ?? true)) ? 'active' : 'suspended',
                ]);
            }
        }

        // 1. All Employees
        $employees = Employee::with('user')
            ->where('tenant_id', $tenantId)
            ->orderBy('status', 'asc') // active first
            ->orderBy('full_name', 'asc')
            ->get();

        // 2. Today's Shifts & Schedules
        $targetDate = $request->input('schedule_date', today()->toDateString());
        $todaySchedules = StaffSchedule::with('employee')
            ->where('tenant_id', $tenantId)
            ->whereDate('shift_date', $targetDate)
            ->orderBy('shift_type')
            ->get();

        // 3. Attendance Records (Selected date or today)
        $attendanceDate = $request->input('attendance_date', today()->toDateString());
        $attendances = StaffAttendance::with('employee')
            ->where('tenant_id', $tenantId)
            ->whereDate('date', $attendanceDate)
            ->orderBy('created_at', 'desc')
            ->get();

        // 4. Leave Applications
        $leaves = StaffLeave::with(['employee', 'approver'])
            ->where('tenant_id', $tenantId)
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get();

        // 5. Payroll Records
        $currentMonth = $request->input('payroll_month', Carbon::now()->format('Y-m'));
        $payrolls = StaffPayroll::with('employee')
            ->where('tenant_id', $tenantId)
            ->where('payroll_month', $currentMonth)
            ->orderBy('created_at', 'desc')
            ->get();

        // 6. Disciplinary & Performance Logs
        $disciplinaryRecords = StaffDisciplinaryRecord::with(['employee', 'creator'])
            ->where('tenant_id', $tenantId)
            ->orderBy('incident_date', 'desc')
            ->take(50)
            ->get();

        // Summary Statistics
        $totalStaff = $employees->count();
        $activeStaff = $employees->where('status', 'active')->count();
        $activeOnShift = $todaySchedules->where('status', 'scheduled')->count();
        $presentToday = $attendances->whereIn('status', ['on_time', 'late', 'overtime'])->count();
        $onLeaveCount = $employees->where('status', 'on_leave')->count();
        $pendingLeavesCount = $leaves->where('status', 'pending')->count();
        $totalMonthlyPayrollMinor = (int) $employees->where('status', 'active')->sum('salary_minor');

        // Department Breakdown
        $departments = [
            'Front Office' => $employees->where('department', 'Front Office')->count(),
            'Housekeeping' => $employees->where('department', 'Housekeeping')->count(),
            'Food & Beverage' => $employees->where('department', 'Food & Beverage')->count(),
            'Maintenance' => $employees->where('department', 'Maintenance')->count(),
            'Security' => $employees->where('department', 'Security')->count(),
            'Accounts' => $employees->where('department', 'Accounts')->count(),
            'Management' => $employees->where('department', 'Management')->count(),
        ];

        return Inertia::render('Hr/Index', [
            'employees' => $employees,
            'todaySchedules' => $todaySchedules,
            'attendances' => $attendances,
            'leaves' => $leaves,
            'payrolls' => $payrolls,
            'disciplinaryRecords' => $disciplinaryRecords,
            'targetDate' => $targetDate,
            'attendanceDate' => $attendanceDate,
            'currentMonth' => $currentMonth,
            'stats' => [
                'total_staff' => $totalStaff,
                'active_staff' => $activeStaff,
                'active_on_shift' => $activeOnShift,
                'present_today' => $presentToday,
                'on_leave_count' => $onLeaveCount,
                'pending_leaves_count' => $pendingLeavesCount,
                'total_monthly_payroll_minor' => $totalMonthlyPayrollMinor,
                'front_office_count' => $departments['Front Office'],
                'housekeeping_count' => $departments['Housekeeping'],
                'food_beverage_count' => $departments['Food & Beverage'],
                'maintenance_count' => $departments['Maintenance'],
                'security_count' => $departments['Security'],
                'accounts_count' => $departments['Accounts'],
                'management_count' => $departments['Management'],
            ],
        ]);
    }

    /**
     * Store a new employee with optional system login account.
     */
    public function storeEmployee(Request $request): RedirectResponse
    {
        if ($request->filled('salary')) {
            $rawSalary = (float) preg_replace('/[^0-9.]/', '', (string) $request->input('salary'));
            $request->merge(['salary_minor' => (int) round($rawSalary * 100)]);
        } elseif ($request->has('salary') && ! $request->filled('salary_minor')) {
            $request->merge(['salary_minor' => (int) round((float) $request->input('salary') * 100)]);
        }
        if (! $request->filled('full_name') && ($request->filled('first_name') || $request->filled('last_name'))) {
            $request->merge(['full_name' => trim(($request->input('first_name') ?? '').' '.($request->input('last_name') ?? ''))]);
        }
        if ($request->has('designation') && ! $request->filled('position')) {
            $request->merge(['position' => $request->input('designation')]);
        }
        if (! $request->filled('employment_type')) {
            $request->merge(['employment_type' => 'full_time']);
        }

        $validated = $request->validate([
            'full_name' => 'required|string|max:150',
            'gender' => 'nullable|string|in:male,female,other',
            'department' => 'required|string',
            'position' => 'required|string|max:100',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'nida_number' => 'nullable|string|max:30',
            'date_of_birth' => 'nullable|date',
            'salary_minor' => 'required|integer|min:0',
            'employment_type' => 'required|in:full_time,part_time,contract,casual',
            'hire_date' => 'required|date',
            'emergency_contact' => 'nullable|string|max:100',
            'address' => 'nullable|string|max:200',
            'bank_name' => 'nullable|string|max:80',
            'bank_account' => 'nullable|string|max:50',
            'create_user_account' => 'nullable|boolean',
            'username' => 'nullable|string|max:60|regex:/^[a-zA-Z0-9_\.\-]+$/|unique:users,username',
            'password' => 'nullable|string|min:6',
            'system_role' => 'nullable|string|max:50',
            'pin_code' => 'nullable|string|max:10',
        ]);

        [$tenantId, $property] = $this->resolveTenantAndProperty($request);

        $code = 'EMP-'.strtoupper(substr(uniqid(), -4));

        $userId = null;
        if (! empty($validated['password']) || $request->boolean('create_user_account')) {
            if (empty($validated['email'])) {
                return redirect()->back()->withErrors(['email' => 'An email address is required to create a system login account.']);
            }
            if (empty($validated['password'])) {
                return redirect()->back()->withErrors(['password' => 'Password is required to create a system login account.']);
            }

            $systemRole = $validated['system_role'] ?? null;
            if (empty($systemRole) || $systemRole === 'staff') {
                $dept = strtolower($validated['department'] ?? '');
                $pos = strtolower($validated['position'] ?? '');
                if (str_contains($dept, 'front') || str_contains($pos, 'reception') || str_contains($pos, 'front')) {
                    $systemRole = 'receptionist';
                } elseif (str_contains($dept, 'account') || str_contains($pos, 'account')) {
                    $systemRole = 'accountant';
                } elseif (str_contains($dept, 'housekeep') || str_contains($pos, 'clean')) {
                    $systemRole = 'housekeeper';
                } else {
                    $systemRole = 'receptionist';
                }
            }

            // Resolve or generate unique username
            $cleanUsername = trim($validated['username'] ?? '');
            if (empty($cleanUsername)) {
                $baseUsername = Str::lower(preg_replace('/[^a-zA-Z0-9_]/', '_', explode(' ', trim($validated['full_name']))[0]));
                if (empty($baseUsername)) {
                    $baseUsername = 'staff';
                }
                $candidate = $baseUsername;
                $counter = 1;
                while (User::where('username', $candidate)->exists()) {
                    $candidate = $baseUsername.'_'.$counter;
                    $counter++;
                }
                $cleanUsername = $candidate;
            }

            // Check if user already exists (include soft-deleted so we can restore instead of duplicating)
            $user = User::withTrashed()->where('email', $validated['email'])->first();
            if ($user) {
                if ($user->trashed()) {
                    $user->restore();
                }
                $user->update([
                    'tenant_id' => $tenantId,
                    'property_id' => $property?->id,
                    'name' => $validated['full_name'],
                    'username' => $user->username ?: $cleanUsername,
                    'phone' => $validated['phone'] ?? $user->phone,
                    'password' => Hash::make($validated['password']),
                    'role' => $systemRole,
                    'pin_code' => $validated['pin_code'] ?? $user->pin_code,
                    'status' => 'active',
                ]);
            } else {
                $user = User::create([
                    'tenant_id' => $tenantId,
                    'property_id' => $property?->id,
                    'name' => $validated['full_name'],
                    'username' => $cleanUsername,
                    'email' => $validated['email'],
                    'phone' => $validated['phone'] ?? null,
                    'password' => Hash::make($validated['password']),
                    'role' => $systemRole,
                    'pin_code' => $validated['pin_code'] ?? null,
                    'status' => 'active',
                    'email_verified_at' => null, // Strictly requires email verification
                ]);

                try {
                    $user->sendEmailVerificationNotification();
                } catch (\Throwable $e) {
                    \Log::warning("Email verification send failed for {$user->email}: ".$e->getMessage());
                }
            }
            $userId = $user->id;
        }

        Employee::create([
            'tenant_id' => $tenantId,
            'property_id' => $property?->id,
            'user_id' => $userId,
            'employee_code' => $code,
            'full_name' => $validated['full_name'],
            'gender' => $validated['gender'] ?? null,
            'department' => $validated['department'],
            'position' => $validated['position'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'nida_number' => $validated['nida_number'] ?? null,
            'date_of_birth' => $validated['date_of_birth'] ?? null,
            'salary_minor' => $validated['salary_minor'],
            'employment_type' => $validated['employment_type'],
            'hire_date' => $validated['hire_date'],
            'emergency_contact' => $validated['emergency_contact'] ?? null,
            'address' => $validated['address'] ?? null,
            'bank_name' => $validated['bank_name'] ?? null,
            'bank_account' => $validated['bank_account'] ?? null,
            'status' => 'active',
        ]);

        $message = "Employee {$validated['full_name']} registered successfully ({$code}).";
        if ($userId) {
            $message .= " A verification link has been sent to {$validated['email']} for account activation.";
        }

        return redirect()->back()->with('success', $message);
    }

    /**
     * Update employee details & system user credentials.
     */
    public function updateEmployee(Request $request, string $id): RedirectResponse
    {
        [$tenantId, $property] = $this->resolveTenantAndProperty($request);
        $employee = Employee::where('tenant_id', $tenantId)->findOrFail($id);

        if ($request->filled('salary')) {
            $rawSalary = (float) preg_replace('/[^0-9.]/', '', (string) $request->input('salary'));
            $request->merge(['salary_minor' => (int) round($rawSalary * 100)]);
        } elseif ($request->has('salary') && ! $request->filled('salary_minor')) {
            $request->merge(['salary_minor' => (int) round((float) $request->input('salary') * 100)]);
        }

        $validated = $request->validate([
            'full_name' => 'required|string|max:150',
            'gender' => 'nullable|string|in:male,female,other',
            'department' => 'required|string',
            'position' => 'required|string|max:100',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'nida_number' => 'nullable|string|max:30',
            'date_of_birth' => 'nullable|date',
            'salary_minor' => 'required|integer|min:0',
            'employment_type' => 'required|in:full_time,part_time,contract,casual',
            'hire_date' => 'required|date',
            'status' => 'required|in:active,on_leave,suspended,terminated',
            'emergency_contact' => 'nullable|string|max:100',
            'address' => 'nullable|string|max:200',
            'bank_name' => 'nullable|string|max:80',
            'bank_account' => 'nullable|string|max:50',
            'username' => 'nullable|string|max:60|regex:/^[a-zA-Z0-9_\.\-]+$/|unique:users,username,'.($employee->user_id ?? 'NULL'),
            'password' => 'nullable|string|min:6',
            'system_role' => 'nullable|string|max:50',
            'pin_code' => 'nullable|string|max:10',
        ]);

        $employee->update($validated);

        // Handle User account and Password update/creation
        $systemRole = $validated['system_role'] ?? null;
        if (empty($systemRole) || $systemRole === 'staff') {
            $dept = strtolower($validated['department'] ?? '');
            $pos = strtolower($validated['position'] ?? '');
            if (str_contains($dept, 'front') || str_contains($pos, 'reception') || str_contains($pos, 'front')) {
                $systemRole = 'receptionist';
            }
        }
        $pinCode = $validated['pin_code'] ?? null;
        $password = $request->input('password');

        if ($employee->user) {
            $userUpdateData = [
                'name' => $validated['full_name'],
                'email' => $validated['email'] ?? $employee->user->email,
                'phone' => $validated['phone'] ?? $employee->user->phone,
                'status' => $validated['status'] === 'active' ? 'active' : 'inactive',
            ];
            if ($request->filled('username')) {
                $userUpdateData['username'] = $validated['username'];
            }
            if (! empty($systemRole)) {
                $userUpdateData['role'] = $systemRole;
            }
            if ($pinCode !== null) {
                $userUpdateData['pin_code'] = $pinCode;
            }
            if (! empty($password)) {
                $userUpdateData['password'] = Hash::make($password);
            }
            $employee->user->update($userUpdateData);
        } elseif (! empty($password) && ! empty($validated['email'])) {
            // Create user account if password is provided
            $cleanUsername = trim($validated['username'] ?? '');
            if (empty($cleanUsername)) {
                $baseUsername = Str::lower(preg_replace('/[^a-zA-Z0-9_]/', '_', explode(' ', trim($validated['full_name']))[0]));
                $candidate = $baseUsername ?: 'staff';
                $c = 1;
                while (User::where('username', $candidate)->exists()) {
                    $candidate = ($baseUsername ?: 'staff').'_'.$c;
                    $c++;
                }
                $cleanUsername = $candidate;
            }

            $user = User::withTrashed()->where('email', $validated['email'])->first();
            if ($user) {
                if ($user->trashed()) {
                    $user->restore();
                }
                $user->update([
                    'tenant_id' => $tenantId,
                    'property_id' => $property?->id,
                    'name' => $validated['full_name'],
                    'username' => $user->username ?: $cleanUsername,
                    'phone' => $validated['phone'] ?? $user->phone,
                    'password' => Hash::make($password),
                    'role' => $systemRole ?: 'staff',
                    'pin_code' => $pinCode,
                    'status' => $validated['status'] === 'active' ? 'active' : 'inactive',
                ]);
            } else {
                $user = User::create([
                    'tenant_id' => $tenantId,
                    'property_id' => $property?->id,
                    'name' => $validated['full_name'],
                    'username' => $cleanUsername,
                    'email' => $validated['email'],
                    'phone' => $validated['phone'] ?? null,
                    'password' => Hash::make($password),
                    'role' => $systemRole ?: 'staff',
                    'pin_code' => $pinCode,
                    'status' => $validated['status'] === 'active' ? 'active' : 'inactive',
                ]);
            }
            $employee->update(['user_id' => $user->id]);
        }

        return redirect()->back()->with('success', "Employee details for {$employee->full_name} updated successfully.");
    }

    /**
     * Delete or Terminate employee and associated user account.
     */
    public function destroyEmployee(Request $request, string $id): RedirectResponse
    {
        [$tenantId] = $this->resolveTenantAndProperty($request);
        $employee = Employee::where('tenant_id', $tenantId)->findOrFail($id);
        $name = $employee->full_name;
        $currentUser = $request->user();

        // 1. Strictly prevent self-deletion by user ID or email
        if (
            ($employee->user_id && $employee->user_id === $currentUser->id)
            || (! empty($employee->email) && strtolower($employee->email) === strtolower($currentUser->email))
        ) {
            return redirect()->back()->with('error', 'You cannot delete your own currently logged-in account.');
        }

        // 2. Also delete user account if linked
        if ($employee->user_id) {
            $user = User::find($employee->user_id);
            if ($user) {
                if ($user->id === $currentUser->id) {
                    return redirect()->back()->with('error', 'You cannot delete your own currently logged-in account.');
                }
                $user->update(['status' => 'inactive']);
                $user->delete();
            }
        }

        $employee->update(['status' => 'terminated']);
        $employee->delete();

        return redirect()->back()->with('success', "Employee {$name} and login account removed from the system.");
    }

    /**
     * Resend verification / activation email to an employee with a system login account.
     */
    public function resendVerificationEmail(Request $request, string $id): RedirectResponse
    {
        [$tenantId] = $this->resolveTenantAndProperty($request);
        $employee = Employee::where('tenant_id', $tenantId)->findOrFail($id);

        if (! $employee->user) {
            return redirect()->back()->with('error', "Employee {$employee->full_name} does not have a system login account.");
        }

        if ($employee->user->hasVerifiedEmail()) {
            return redirect()->back()->with('info', "The account for {$employee->full_name} ({$employee->user->email}) is already verified and active.");
        }

        try {
            $employee->user->sendEmailVerificationNotification();

            return redirect()->back()->with('success', "A fresh email verification link has been sent to {$employee->user->email}.");
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'Failed to send verification email: '.$e->getMessage());
        }
    }

    /**
     * Assign / update shift schedule.
     */
    public function assignShift(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'shift_date' => 'required|date',
            'shift_type' => 'required|in:morning,evening,night,off',
            'start_time' => 'nullable|string',
            'end_time' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        [$tenantId, $property] = $this->resolveTenantAndProperty($request);

        StaffSchedule::updateOrCreate([
            'tenant_id' => $tenantId,
            'employee_id' => $validated['employee_id'],
            'shift_date' => $validated['shift_date'],
        ], [
            'property_id' => $property?->id,
            'shift_type' => $validated['shift_type'],
            'start_time' => $validated['start_time'] ?? null,
            'end_time' => $validated['end_time'] ?? null,
            'status' => 'scheduled',
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Shift scheduled successfully.');
    }

    /**
     * Remove scheduled shift.
     */
    public function destroyShift(Request $request, string $id): RedirectResponse
    {
        [$tenantId] = $this->resolveTenantAndProperty($request);
        $schedule = StaffSchedule::where('tenant_id', $tenantId)->findOrFail($id);
        $schedule->delete();

        return redirect()->back()->with('success', 'Shift removed from schedule.');
    }

    /**
     * Record daily attendance.
     */
    public function recordAttendance(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'attendance_date' => 'nullable|date',
            'date' => 'nullable|date',
            'status' => 'required|in:on_time,late,early_departure,absent,overtime,excused',
            'check_in_at' => 'nullable|string',
            'check_out_at' => 'nullable|string',
            'remarks' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:255',
        ]);

        [$tenantId, $property] = $this->resolveTenantAndProperty($request);
        $targetDate = $validated['attendance_date'] ?? $validated['date'] ?? today()->toDateString();
        $remarks = $validated['remarks'] ?? $validated['notes'] ?? null;

        StaffAttendance::updateOrCreate([
            'tenant_id' => $tenantId,
            'employee_id' => $validated['employee_id'],
            'date' => $targetDate,
        ], [
            'property_id' => $property?->id,
            'status' => $validated['status'],
            'check_in_at' => ! empty($validated['check_in_at']) ? Carbon::parse($targetDate.' '.$validated['check_in_at']) : null,
            'check_out_at' => ! empty($validated['check_out_at']) ? Carbon::parse($targetDate.' '.$validated['check_out_at']) : null,
            'remarks' => $remarks,
        ]);

        return redirect()->back()->with('success', 'Attendance record saved successfully.');
    }

    /**
     * Submit leave application.
     */
    public function storeLeave(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'leave_type' => 'required|in:annual,sick,maternity,paternity,emergency,unpaid',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string|max:500',
        ]);

        [$tenantId, $property] = $this->resolveTenantAndProperty($request);

        $start = Carbon::parse($validated['start_date']);
        $end = Carbon::parse($validated['end_date']);
        $daysCount = $start->diffInDays($end) + 1;

        StaffLeave::create([
            'tenant_id' => $tenantId,
            'property_id' => $property?->id,
            'employee_id' => $validated['employee_id'],
            'leave_type' => $validated['leave_type'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'days_count' => $daysCount,
            'reason' => $validated['reason'],
            'status' => 'pending',
        ]);

        return redirect()->back()->with('success', "Leave application for {$daysCount} day(s) submitted successfully.");
    }

    /**
     * Approve or reject leave.
     */
    public function updateLeaveStatus(Request $request, string $id): RedirectResponse
    {
        [$tenantId] = $this->resolveTenantAndProperty($request);
        $leave = StaffLeave::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected,cancelled',
            'manager_remarks' => 'nullable|string|max:300',
        ]);

        $leave->update([
            'status' => $validated['status'],
            'approved_by_user_id' => $request->user()?->id,
            'manager_remarks' => $validated['manager_remarks'] ?? null,
        ]);

        // If approved and current date is within leave period, set employee status to on_leave
        if ($validated['status'] === 'approved') {
            $today = today()->toDateString();
            if ($leave->start_date <= $today && $leave->end_date >= $today) {
                $leave->employee->update(['status' => 'on_leave']);
            }
        } elseif ($validated['status'] === 'rejected' || $validated['status'] === 'cancelled') {
            if ($leave->employee->status === 'on_leave') {
                $leave->employee->update(['status' => 'active']);
            }
        }

        return redirect()->back()->with('success', 'Leave status updated to: '.strtoupper($validated['status']));
    }

    /**
     * Generate monthly payroll for all active employees.
     */
    public function generatePayroll(Request $request): RedirectResponse
    {
        [$tenantId, $property] = $this->resolveTenantAndProperty($request);
        $month = $request->input('payroll_month', Carbon::now()->format('Y-m'));

        $activeEmployees = Employee::where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->get();

        $generatedCount = 0;

        foreach ($activeEmployees as $emp) {
            $baseSalary = $emp->salary_minor;
            // Statutory NSSF: 10% of base salary
            $nssf = (int) round($baseSalary * 0.10);
            // Basic PAYE estimate for taxable income (> 270,000 TZS)
            $paye = $baseSalary > 27000000 ? (int) round(($baseSalary - 27000000) * 0.09) : 0;
            $netSalary = max(0, $baseSalary - $nssf - $paye);

            StaffPayroll::updateOrCreate([
                'tenant_id' => $tenantId,
                'employee_id' => $emp->id,
                'payroll_month' => $month,
            ], [
                'property_id' => $property?->id,
                'base_salary_minor' => $baseSalary,
                'allowance_minor' => 0,
                'overtime_minor' => 0,
                'nssf_deduction_minor' => $nssf,
                'paye_deduction_minor' => $paye,
                'other_deductions_minor' => 0,
                'net_salary_minor' => $netSalary,
                'payment_method' => ! empty($emp->bank_account) ? 'bank' : 'mpesa',
                'payment_reference' => null,
                'status' => 'draft',
            ]);

            $generatedCount++;
        }

        return redirect()->back()->with('success', "Monthly payroll for {$month} generated for {$generatedCount} active employee(s).");
    }

    /**
     * Mark payroll as approved or paid.
     */
    public function updatePayrollStatus(Request $request, string $id): RedirectResponse
    {
        [$tenantId] = $this->resolveTenantAndProperty($request);
        $payroll = StaffPayroll::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:draft,approved,paid',
            'payment_method' => 'nullable|string',
            'payment_reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:255',
        ]);

        $updateData = [
            'status' => $validated['status'],
            'payment_method' => $validated['payment_method'] ?? $payroll->payment_method,
            'payment_reference' => $validated['payment_reference'] ?? $payroll->payment_reference,
            'notes' => $validated['notes'] ?? $payroll->notes,
        ];

        if ($validated['status'] === 'paid') {
            $updateData['paid_at'] = now();
        }

        $payroll->update($updateData);

        return redirect()->back()->with('success', 'Payroll payment status updated to: '.strtoupper($validated['status']));
    }

    /**
     * Store Disciplinary or Performance record.
     */
    public function storeDisciplinary(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'record_type' => 'required|in:warning,commendation,query,appraisal,training',
            'title' => 'required|string|max:150',
            'description' => 'required|string|max:1000',
            'incident_date' => 'nullable|date',
            'action_taken' => 'nullable|string|max:200',
        ]);

        [$tenantId, $property] = $this->resolveTenantAndProperty($request);

        StaffDisciplinaryRecord::create([
            'tenant_id' => $tenantId,
            'property_id' => $property?->id,
            'employee_id' => $validated['employee_id'],
            'record_type' => $validated['record_type'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'incident_date' => $validated['incident_date'] ?? today()->toDateString(),
            'action_taken' => $validated['action_taken'] ?? null,
            'created_by_user_id' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Performance/Disciplinary record saved successfully.');
    }
}
