import { Guest, RatePlan, Room, RoomType } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Building2,
    Calendar,
    Car,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    CreditCard,
    DollarSign,
    FileCheck2,
    FileSpreadsheet,
    FileText,
    Fingerprint,
    Globe,
    HelpCircle,
    IdCard,
    KeyRound,
    Lock,
    MapPin,
    Phone,
    Plus,
    Receipt,
    Search,
    Shield,
    Sparkles,
    Tag,
    User,
    UserCheck,
    Users,
    Utensils,
    Wifi,
    X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface NewReservationModalProps {
    isOpen: boolean;
    onClose: () => void;
    rooms?: Room[];
    roomTypes?: RoomType[];
    ratePlans?: RatePlan[];
    guests?: Guest[];
    preselectedRoomId?: string;
    preselectedDate?: string;
    initialRoomId?: string;
    initialCheckIn?: string;
    initialCheckOut?: string;
    initialGuestId?: string;
}

export default function NewReservationModal({
    isOpen,
    onClose,
    rooms = [],
    roomTypes = [],
    ratePlans = [],
    guests = [],
    preselectedRoomId,
    preselectedDate,
    initialRoomId,
    initialCheckIn,
    initialCheckOut,
    initialGuestId,
}: NewReservationModalProps) {
    if (!isOpen) return null;

    const pageProps = usePage().props as any;
    const currentUser = pageProps?.auth?.user;

    const effectiveRoomId = initialRoomId || preselectedRoomId;
    const defaultCheckIn = initialCheckIn || preselectedDate || new Date().toISOString().split('T')[0];
    const defaultCheckOut = initialCheckOut || (() => {
        const d = new Date(defaultCheckIn);
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    })();

    const [activeSection, setActiveSection] = useState<'all' | 'stay' | 'guest' | 'id' | 'billing' | 'legal'>('all');
    const [guestSearch, setGuestSearch] = useState('');
    const [showGuestDropdown, setShowGuestDropdown] = useState(false);
    const [roomSearch, setRoomSearch] = useState('');
    const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>(
        effectiveRoomId ? [effectiveRoomId] : []
    );
    const [expandedFloors, setExpandedFloors] = useState<Record<string, boolean>>({});
    const [submitErrors, setSubmitErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [autoReceiptNo, setAutoReceiptNo] = useState(() => {
        const yymm = new Date().toISOString().slice(2, 7).replace('-', '');
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `RCT-${yymm}-${rand}`;
    });

    // Dynamic Rate Plans & Meal Basis Management
    const [localRatePlans, setLocalRatePlans] = useState<RatePlan[]>(ratePlans);
    const [showAddRatePlanModal, setShowAddRatePlanModal] = useState(false);
    const [savingPlan, setSavingPlan] = useState(false);
    const [planError, setPlanError] = useState('');
    const [newPlanForm, setNewPlanForm] = useState({
        name: '',
        meal_plan: 'BB',
        code: '',
        is_resident_only: false,
    });

    useEffect(() => {
        if (ratePlans && ratePlans.length > 0) {
            setLocalRatePlans(ratePlans);
        }
    }, [ratePlans]);

    const initialRoomObj = rooms.find(r => String(r.id) === String(effectiveRoomId));
    const initialRtId = initialRoomObj?.room_type_id || initialRoomObj?.roomType?.id || roomTypes[0]?.id || '';
    const initialRpId = (localRatePlans[0]?.id || ratePlans[0]?.id) || '';
    const initialPriceMinor = initialRoomObj?.roomType?.base_price_minor || initialRoomObj?.room_type?.base_price_minor || 0;

    const { data, setData, post, processing, reset, errors } = useForm({
        // Section 1: Stay & Room Details
        check_in: defaultCheckIn,
        check_in_time: '14:00',
        check_out: defaultCheckOut,
        check_out_time: '10:00',
        room_ids: effectiveRoomId ? [effectiveRoomId] : ([] as string[]),
        room_id: effectiveRoomId || (rooms[0]?.id ?? ''),
        room_type_id: initialRtId,
        rate_plan_id: initialRpId,
        rate_price: initialPriceMinor / 100,
        adults: 2,
        children: 0,
        source: 'walk_in',
        check_in_now: true,

        // Section 2: Guest Personal Information
        title: 'Mr',
        guest_id: '',
        first_name: '',
        last_name: '',
        gender: 'male',
        age: '' as number | string,
        phone: '',
        email: '',
        nationality: 'Tanzanian',
        tribe: '',

        // Section 3: Statutory Identification & Travel Itinerary
        id_type: 'national_id',
        id_number: '',
        origin: '',
        destination: '',
        vehicle_reg_no: '',
        company_name: '',
        tax_number: '',
        address: '',

        // Section 4: Billing, Payments & Receipt
        discount_minor: 0,
        deposit: (initialPriceMinor / 100),
        payment_method: 'cash',
        receipt_no: '',

        // Section 5: Legal Compliance & Signatures
        notes: '',
        guest_signature: true,
        receptionist_name: currentUser?.name || 'Front Desk Attendant',
    });

    // Synchronize form when modal opens or initial props change
    useEffect(() => {
        if (isOpen) {
            const effRoomId = initialRoomId || preselectedRoomId || '';
            const inDate = initialCheckIn || preselectedDate || new Date().toISOString().split('T')[0];
            const outDate = initialCheckOut || (() => {
                const d = new Date(inDate);
                d.setDate(d.getDate() + 1);
                return d.toISOString().split('T')[0];
            })();

            const rObj = rooms.find(r => String(r.id) === String(effRoomId));
            const rtId = rObj?.room_type_id || rObj?.roomType?.id || rObj?.room_type?.id || roomTypes[0]?.id || '';
            const rpId = ratePlans[0]?.id || '';
            const basePriceMinor = rObj?.roomType?.base_price_minor || rObj?.room_type?.base_price_minor || 0;

            if (effRoomId) {
                setSelectedRoomIds([effRoomId]);
            } else if (rooms.length > 0 && selectedRoomIds.length === 0) {
                const firstVacant = rooms.find(r => r.status_occupancy === 'vacant') || rooms[0];
                if (firstVacant) {
                    setSelectedRoomIds([firstVacant.id]);
                }
            }

            const targetGuest = initialGuestId ? guests.find(g => String(g.id) === String(initialGuestId)) : null;

            setData(prev => ({
                ...prev,
                check_in: inDate,
                check_out: outDate,
                room_ids: effRoomId ? [effRoomId] : (prev.room_ids.length > 0 ? prev.room_ids : (rooms[0]?.id ? [rooms[0].id] : [])),
                room_id: effRoomId || prev.room_id || (rooms[0]?.id ?? ''),
                room_type_id: rtId || prev.room_type_id,
                rate_plan_id: prev.rate_plan_id || rpId,
                rate_price: basePriceMinor / 100,
                guest_id: targetGuest ? targetGuest.id : prev.guest_id,
                first_name: targetGuest ? targetGuest.first_name : prev.first_name,
                last_name: targetGuest ? targetGuest.last_name : prev.last_name,
                gender: targetGuest && (targetGuest as any).gender ? (targetGuest as any).gender : prev.gender,
                age: targetGuest && (targetGuest as any).age ? (targetGuest as any).age : prev.age,
                phone: targetGuest ? (targetGuest.phone ?? '') : prev.phone,
                email: targetGuest ? (targetGuest.email ?? '') : prev.email,
                nationality: targetGuest ? (targetGuest.nationality ?? 'Tanzanian') : prev.nationality,
                tribe: targetGuest && (targetGuest as any).tribe ? (targetGuest as any).tribe : prev.tribe,
                id_type: targetGuest ? ((targetGuest as any).id_type || 'national_id') : prev.id_type,
                id_number: targetGuest ? (targetGuest.id_number ?? '') : prev.id_number,
                origin: targetGuest && (targetGuest as any).origin ? (targetGuest as any).origin : prev.origin,
                destination: targetGuest && (targetGuest as any).destination ? (targetGuest as any).destination : prev.destination,
                vehicle_reg_no: targetGuest && (targetGuest as any).vehicle_reg_no ? (targetGuest as any).vehicle_reg_no : prev.vehicle_reg_no,
                receptionist_name: currentUser?.name || prev.receptionist_name,
            }));
        }
    }, [isOpen, initialRoomId, initialCheckIn, initialCheckOut, initialGuestId, preselectedRoomId, preselectedDate, rooms, roomTypes, ratePlans]);

    // Update selected rooms in form data
    useEffect(() => {
        if (selectedRoomIds.length > 0) {
            const firstRoomId = selectedRoomIds[0];
            const roomObj = rooms.find(r => String(r.id) === String(firstRoomId));
            const rtId = roomObj?.room_type_id || roomObj?.roomType?.id || roomObj?.room_type?.id || roomTypes[0]?.id || '';
            const rtPriceMinor = roomObj?.roomType?.base_price_minor || roomObj?.room_type?.base_price_minor || 0;

            setData(prev => ({
                ...prev,
                room_ids: selectedRoomIds,
                room_id: firstRoomId,
                room_type_id: rtId || prev.room_type_id,
                rate_price: rtPriceMinor / 100,
            }));
        }
    }, [selectedRoomIds, rooms, roomTypes]);

    // Auto-select first rate plan if none selected
    useEffect(() => {
        if (!data.rate_plan_id && localRatePlans.length > 0) {
            setData('rate_plan_id', localRatePlans[0].id);
        }
    }, [localRatePlans, data.rate_plan_id]);

    const handleCreateRatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingPlan(true);
        setPlanError('');

        try {
            const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch(route('rate-plans.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(newPlanForm),
            });

            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                throw new Error(
                    res.status === 419
                        ? 'Session expired. Please refresh the page and try again.'
                        : `Server error (${res.status}). Please try again.`
                );
            }

            const json = await res.json();
            if (json.success && json.ratePlan) {
                setLocalRatePlans(prev => [...prev, json.ratePlan]);
                setData('rate_plan_id', json.ratePlan.id);
                setShowAddRatePlanModal(false);
                setNewPlanForm({ name: '', meal_plan: 'BB', code: '', is_resident_only: false });
            } else if (json.errors) {
                const firstErr = Object.values(json.errors)[0];
                setPlanError(Array.isArray(firstErr) ? (firstErr as any)[0] : String(firstErr));
            } else {
                setPlanError(json.message || 'Failed to save rate plan.');
            }
        } catch (err: any) {
            setPlanError(err?.message || 'Network error creating rate plan.');
        } finally {
            setSavingPlan(false);
        }
    };

    // Filter existing guests by search query
    const filteredGuests = useMemo(() => {
        if (!guestSearch.trim()) return [];
        const q = guestSearch.toLowerCase();
        return guests.filter(g =>
            g.first_name?.toLowerCase().includes(q) ||
            g.last_name?.toLowerCase().includes(q) ||
            g.phone?.includes(q) ||
            g.email?.toLowerCase().includes(q) ||
            (g as any).id_number?.toLowerCase().includes(q)
        ).slice(0, 5);
    }, [guests, guestSearch]);

    // Handle selecting an existing guest
    const handleSelectGuest = (g: Guest) => {
        setData(prev => ({
            ...prev,
            guest_id: g.id,
            first_name: g.first_name || '',
            last_name: g.last_name || '',
            gender: (g as any).gender || prev.gender,
            age: (g as any).age || '',
            phone: g.phone || '',
            email: g.email || '',
            id_type: (g as any).id_type || 'national_id',
            id_number: (g as any).id_number || '',
            origin: (g as any).origin || '',
            destination: (g as any).destination || '',
            vehicle_reg_no: (g as any).vehicle_reg_no || '',
            nationality: g.nationality || 'Tanzanian',
            tribe: (g as any).tribe || '',
        }));
        setGuestSearch(`${g.first_name} ${g.last_name}`);
        setShowGuestDropdown(false);
    };

    // Calculate nights
    const nights = useMemo(() => {
        try {
            const start = new Date(data.check_in).getTime();
            const end = new Date(data.check_out).getTime();
            const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            return Math.max(1, isNaN(diff) ? 1 : diff);
        } catch {
            return 1;
        }
    }, [data.check_in, data.check_out]);

    // Helper to format Date with Day name in English
    const formatDayName = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr + 'T00:00:00');
            return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    // Group rooms by floor and apply roomSearch
    const floorGroups = useMemo(() => {
        const groups: Record<string, Room[]> = {};
        const q = roomSearch.toLowerCase();

        rooms.forEach(r => {
            const rawFloor = r.floor ? String(r.floor).trim() : 'Ground Floor';
            const floorKey = rawFloor || 'Ground Floor';
            const rt = r.room_type || r.roomType;
            const matchesSearch = !q ||
                r.room_number?.toLowerCase().includes(q) ||
                rt?.name?.toLowerCase().includes(q) ||
                floorKey.toLowerCase().includes(q);

            if (matchesSearch) {
                if (!groups[floorKey]) groups[floorKey] = [];
                groups[floorKey].push(r);
            }
        });

        return groups;
    }, [rooms, roomSearch]);

    const totalMatchingRooms = useMemo(() => {
        return Object.values(floorGroups).reduce((acc, list) => acc + list.length, 0);
    }, [floorGroups]);

    // Calculate total amount (strictly 1 room per guest reservation)
    const totalAmountMinor = useMemo(() => {
        const roomId = selectedRoomIds[0] || data.room_id;
        const room = rooms.find(r => String(r.id) === String(roomId));
        const rt = room?.room_type || room?.roomType;
        const price = rt?.base_price_minor || (data.rate_price ? Number(data.rate_price) * 100 : 0) || 35000000;
        const sum = price * nights;
        return Math.max(0, sum - (data.discount_minor || 0));
    }, [selectedRoomIds, data.room_id, data.rate_price, rooms, nights, data.discount_minor]);

    // Single room selection handler
    const selectRoom = (roomId: string) => {
        setSelectedRoomIds([roomId]);
        const selectedRoom = rooms.find(r => String(r.id) === String(roomId));
        const rtId = selectedRoom?.room_type_id || selectedRoom?.roomType?.id || selectedRoom?.room_type?.id || '';
        const basePrice = (selectedRoom?.roomType?.base_price_minor || selectedRoom?.room_type?.base_price_minor || 0) / 100;
        setData(prev => ({
            ...prev,
            room_id: roomId,
            room_ids: [roomId],
            room_type_id: rtId,
            rate_price: basePrice > 0 ? basePrice : prev.rate_price,
        }));
    };

    const toggleFloor = (floor: string) => {
        setExpandedFloors(prev => ({ ...prev, [floor]: !prev[floor] }));
    };

    const expandAllFloors = () => {
        const next: Record<string, boolean> = {};
        Object.keys(floorGroups).forEach(f => { next[f] = true; });
        setExpandedFloors(next);
    };

    const collapseAllFloors = () => {
        const next: Record<string, boolean> = {};
        Object.keys(floorGroups).forEach(f => { next[f] = false; });
        setExpandedFloors(next);
    };

    const formatTZS = (minor: number) => {
        return new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            maximumFractionDigits: 0,
        }).format(minor / 100);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const targetRoomId = selectedRoomIds[0] || data.room_id;
        if (!targetRoomId) {
            setSubmitErrors({ room: 'Please select an available room for this guest booking.' });
            return;
        }

        const primaryRoom = rooms.find(r => String(r.id) === String(targetRoomId));
        const rtId = primaryRoom?.room_type_id || primaryRoom?.roomType?.id || primaryRoom?.room_type?.id || roomTypes[0]?.id || '';
        const rpId = data.rate_plan_id || ratePlans[0]?.id || '';
        const rtPrice = (primaryRoom?.roomType?.base_price_minor || primaryRoom?.room_type?.base_price_minor || 0) / 100;

        const payload: Record<string, any> = {
            ...data,
            age: data.age ? Number(data.age) : null,
            deposit: data.deposit ? Number(data.deposit) : 0,
            guest_id: data.guest_id ? data.guest_id : null,
            room_id: targetRoomId,
            room_ids: [targetRoomId],
            room_type_id: rtId || null,
            rate_plan_id: rpId || null,
            rate_price: data.rate_price && Number(data.rate_price) > 0 ? Number(data.rate_price) : rtPrice,
            total_minor: totalAmountMinor,
            source: data.source || 'walk_in',
            receptionist_name: data.receptionist_name || currentUser?.name || 'Front Desk Attendant',
        };

        setIsSubmitting(true);
        setSubmitErrors({});

        // Offline Data Collection Mode: If disconnected, store into IndexedDB offline queue
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            import('@/Services/offlineSync').then(({ default: offlineSync }) => {
                const guestName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'New Guest';
                offlineSync.queueOfflineAction({
                    url: route('reservations.store'),
                    method: 'POST',
                    data: payload,
                    title: `Register Guest: ${guestName} (Room ${primaryRoom?.room_number || 'Unassigned'})`,
                    module: 'reservation',
                });
                setIsSubmitting(false);
                reset();
                onClose();
            });
            return;
        }

        router.post(route('reservations.store'), payload, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmitting(false);
                reset();
                onClose();
            },
            onError: (errs) => {
                setIsSubmitting(false);
                if (typeof navigator !== 'undefined' && !navigator.onLine) {
                    import('@/Services/offlineSync').then(({ default: offlineSync }) => {
                        const guestName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'New Guest';
                        offlineSync.queueOfflineAction({
                            url: route('reservations.store'),
                            method: 'POST',
                            data: payload,
                            title: `Register Guest: ${guestName} (Room ${primaryRoom?.room_number || 'Unassigned'})`,
                            module: 'reservation',
                        });
                        reset();
                        onClose();
                    });
                    return;
                }
                setSubmitErrors(errs);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full my-6 max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
                            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                                    Guest Registration & Reservation Form
                                </h2>
                            </div>
                            <p className="text-xs text-slate-500">
                                Statutory guest ledger registration, identity verification, room assignment & billing receipt
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        title="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Section Quick Jump Bar */}
                <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto text-xs no-scrollbar">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-600 shrink-0">
                        <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400">Sections:</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => setActiveSection('all')}
                            className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                                activeSection === 'all'
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            All Sections
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSection('stay')}
                            className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                                activeSection === 'stay'
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            1. Stay & Room
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSection('guest')}
                            className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                                activeSection === 'guest'
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            2. Guest Details
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSection('id')}
                            className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                                activeSection === 'id'
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            3. ID & Itinerary
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSection('billing')}
                            className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                                activeSection === 'billing'
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            4. Billing & Receipt
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveSection('legal')}
                            className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                                activeSection === 'legal'
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            5. Signatures & Remarks
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">
                    {/* Error Notice Banner */}
                    {(Object.keys(errors).length > 0 || Object.keys(submitErrors).length > 0) && (
                        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1 animate-in fade-in">
                            <div className="font-bold flex items-center gap-1.5 text-sm text-rose-900">
                                <AlertCircle className="w-4 h-4 text-rose-600" />
                                <span>Please resolve the following errors:</span>
                            </div>
                            <ul className="list-disc list-inside space-y-0.5 mt-1 text-rose-700">
                                {Object.entries({ ...errors, ...submitErrors }).map(([key, err]) => (
                                    <li key={key}>
                                        <strong className="capitalize">{key.replace('_', ' ')}:</strong> {err}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* =========================================================================
                        SECTION 1: STAY & ROOM DETAILS
                    ========================================================================= */}
                    {(activeSection === 'all' || activeSection === 'stay') && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-extrabold text-xs flex items-center justify-center">
                                        1
                                    </span>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">Stay & Room Details</h3>
                                        <p className="text-[11px] text-slate-500">Stay dates, check-in/departure times, occupancy and room assignment</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                                        {nights} {nights === 1 ? 'Night' : 'Nights'}
                                    </span>
                                </div>
                            </div>

                            {/* Check-in, Check-out, Time and Guests */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Check-In Date */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                        Check-In Date <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={data.check_in}
                                        onChange={e => setData('check_in', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                    <span className="text-[10px] text-slate-500 mt-1 block">
                                        {formatDayName(data.check_in)}
                                    </span>
                                </div>

                                {/* Check-In Time */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                                        Check-In Time
                                    </label>
                                    <input
                                        type="time"
                                        value={data.check_in_time}
                                        onChange={e => setData('check_in_time', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-1 block">Standard check-in 14:00</span>
                                </div>

                                {/* Check-Out Date */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                        Expected Departure Date <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={data.check_out}
                                        onChange={e => setData('check_out', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                    <span className="text-[10px] text-slate-500 mt-1 block">
                                        {formatDayName(data.check_out)}
                                    </span>
                                </div>

                                {/* Check-Out Time */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                                        Expected Departure Time
                                    </label>
                                    <input
                                        type="time"
                                        value={data.check_out_time}
                                        onChange={e => setData('check_out_time', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-1 block">Standard check-out 10:00</span>
                                </div>
                            </div>

                            {/* Booking Source & Number of Occupants */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Booking Source
                                    </label>
                                    <select
                                        value={data.source}
                                        onChange={e => setData('source', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    >
                                        <option value="walk_in">Walk-In Guest</option>
                                        <option value="phone">Phone Reservation</option>
                                        <option value="website">Direct Website</option>
                                        <option value="booking_com">Booking.com / Online Portal</option>
                                        <option value="agent">Travel Agent / Tour Operator</option>
                                        <option value="corporate">Corporate Account</option>
                                    </select>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-semibold text-slate-700">
                                            Rate Plan & Meal Basis
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddRatePlanModal(true)}
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/70 px-2 py-0.5 rounded-lg transition cursor-pointer"
                                            title="Add new rate plan and dining formula"
                                        >
                                            <Plus className="w-3 h-3 stroke-[2.5]" />
                                            <span>Add Plan</span>
                                        </button>
                                    </div>
                                    <select
                                        value={data.rate_plan_id}
                                        onChange={e => setData('rate_plan_id', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                                    >
                                        {localRatePlans.length === 0 ? (
                                            <option value="">No rate plans configured &bull; Click '+ Add Plan'</option>
                                        ) : (
                                            localRatePlans.map(rp => (
                                                <option key={rp.id} value={rp.id}>
                                                    {rp.name} ({rp.meal_plan})
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    {localRatePlans.length === 0 && (
                                        <p className="text-[10px] text-amber-600 mt-1">
                                            No rate plan found. Click <strong>Add Plan</strong> above to create one.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-blue-600" />
                                        Occupants (Adults / Children)
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            value={data.adults}
                                            onChange={e => setData('adults', Number(e.target.value))}
                                            className="w-1/2 bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-900 font-medium"
                                        >
                                            {[1, 2, 3, 4, 5, 6].map(n => (
                                                <option key={n} value={n}>{n} Adults</option>
                                            ))}
                                        </select>
                                        <select
                                            value={data.children}
                                            onChange={e => setData('children', Number(e.target.value))}
                                            className="w-1/2 bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-900 font-medium"
                                        >
                                            {[0, 1, 2, 3, 4].map(n => (
                                                <option key={n} value={n}>{n} Children</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Room Selector (Floor by Floor) */}
                            <div className="pt-2 space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                            <KeyRound className="w-3.5 h-3.5 text-[#1E3A5F]" />
                                            Room Assignment <span className="text-rose-500">*</span>
                                        </h4>
                                        <p className="text-[11px] text-slate-500">
                                            Select 1 designated room for this guest (strictly 1 room per booking)
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                        <button
                                            type="button"
                                            onClick={expandAllFloors}
                                            className="text-[#1E3A5F] hover:underline font-semibold"
                                        >
                                            Expand All
                                        </button>
                                        <span className="text-slate-300">|</span>
                                        <button
                                            type="button"
                                            onClick={collapseAllFloors}
                                            className="text-[#1E3A5F] hover:underline font-semibold"
                                        >
                                            Collapse All
                                        </button>
                                        <span className="text-[#1E3A5F] bg-[#1E3A5F]/10 px-2.5 py-1 rounded-lg font-bold border border-[#1E3A5F]/20">
                                            {selectedRoomIds[0]
                                                ? `Room ${rooms.find(r => String(r.id) === String(selectedRoomIds[0]))?.room_number || ''} Selected`
                                                : 'No Room Selected'}
                                        </span>
                                    </div>
                                </div>

                                <div className="relative">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={roomSearch}
                                        onChange={e => setRoomSearch(e.target.value)}
                                        placeholder="Search room number, type, floor..."
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#1E3A5F]/20"
                                    />
                                </div>

                                {/* Accordion Floor Groups */}
                                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                                    {Object.keys(floorGroups).length > 0 ? (
                                        Object.entries(floorGroups).map(([floor, floorRooms]) => {
                                            const isExpanded = expandedFloors[floor] !== false;
                                            const availableCount = floorRooms.filter(r => r.status_occupancy === 'vacant').length;

                                            return (
                                                <div key={floor} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleFloor(floor)}
                                                        className="w-full px-3.5 py-2 bg-slate-50 hover:bg-slate-100/80 transition flex items-center justify-between text-left"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-5 h-5 rounded-md bg-[#1E3A5F] text-white text-[10px] font-bold flex items-center justify-center">
                                                                {floor.charAt(0).toUpperCase()}
                                                            </span>
                                                            <span className="font-bold text-xs text-slate-900">
                                                                {floor.toLowerCase().includes('floor') ? floor : `Floor ${floor}`}
                                                            </span>
                                                            <span className="text-[11px] text-slate-500">
                                                                ({availableCount} available / {floorRooms.length} total)
                                                            </span>
                                                        </div>
                                                        {isExpanded ? (
                                                            <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                                                        ) : (
                                                            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                                        )}
                                                    </button>

                                                    {isExpanded && (
                                                        <div className="p-2.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                            {floorRooms.map(room => {
                                                                const isSelected = selectedRoomIds.includes(room.id);
                                                                const isOccupied = room.status_occupancy === 'occupied';
                                                                const rt = room.room_type || room.roomType;
                                                                const price = rt?.base_price_minor || 35000000;

                                                                return (
                                                                    <div
                                                                        key={room.id}
                                                                        onClick={() => !isOccupied && selectRoom(room.id)}
                                                                        className={`border rounded-xl p-2.5 cursor-pointer transition flex items-center justify-between ${
                                                                            isOccupied
                                                                                ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                                                                                : isSelected
                                                                                ? 'bg-[#1E3A5F]/10 border-[#1E3A5F] ring-1 ring-[#1E3A5F]'
                                                                                : 'bg-white border-slate-200 hover:border-[#1E3A5F]/40'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <input
                                                                                type="radio"
                                                                                name="assigned_single_room"
                                                                                checked={isSelected}
                                                                                disabled={isOccupied}
                                                                                onChange={() => !isOccupied && selectRoom(room.id)}
                                                                                className="text-[#1E3A5F] focus:ring-[#1E3A5F] w-3.5 h-3.5 shrink-0 cursor-pointer"
                                                                            />
                                                                            <div className="truncate">
                                                                                <div className="font-bold text-xs text-slate-900">
                                                                                    Room {room.room_number}
                                                                                </div>
                                                                                <div className="text-[10px] text-slate-500 truncate">
                                                                                    {rt?.name || 'Standard'}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <span className="text-[11px] font-bold text-emerald-700 shrink-0">
                                                                            {formatTZS(price)}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-6 text-slate-400 text-xs">
                                            No rooms found matching your search.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Inline Room / Guest Conflict Error */}
                            {(submitErrors.room_id || submitErrors.guest_id || submitErrors.room) && (
                                <div className="mt-1 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
                                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-rose-900 mb-0.5">Booking Conflict Detected</p>
                                        <p>{submitErrors.room_id || submitErrors.guest_id || submitErrors.room}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* =========================================================================
                        SECTION 2: GUEST PERSONAL INFORMATION
                    ========================================================================= */}
                    {(activeSection === 'all' || activeSection === 'guest') && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-extrabold text-xs flex items-center justify-center">
                                        2
                                    </span>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">Guest Personal Information</h3>
                                        <p className="text-[11px] text-slate-500">Full legal name as shown on official ID, age, gender, phone & ethnicity</p>
                                    </div>
                                </div>
                            </div>

                            {/* Autocomplete / Search Returning Guest */}
                            <div className="relative">
                                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                    <Search className="w-3.5 h-3.5 text-blue-600" />
                                    Search Returning Guest
                                </label>
                                <div className="relative">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={guestSearch}
                                        onChange={e => {
                                            setGuestSearch(e.target.value);
                                            setShowGuestDropdown(true);
                                        }}
                                        onFocus={() => setShowGuestDropdown(true)}
                                        placeholder="Search by full name, phone number, or national ID..."
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                    />
                                    {guestSearch && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setGuestSearch('');
                                                setData(prev => ({
                                                    ...prev,
                                                    guest_id: '',
                                                    first_name: '',
                                                    last_name: '',
                                                    phone: '',
                                                    email: '',
                                                    age: '',
                                                    tribe: '',
                                                    id_number: '',
                                                }));
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {showGuestDropdown && filteredGuests.length > 0 && (
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden divide-y divide-slate-100">
                                        {filteredGuests.map(g => (
                                            <button
                                                key={g.id}
                                                type="button"
                                                onClick={() => handleSelectGuest(g)}
                                                className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition flex items-center justify-between group"
                                            >
                                                <div>
                                                    <div className="font-bold text-xs text-slate-900 group-hover:text-blue-600">
                                                        {g.first_name} {g.last_name}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        {g.phone} &bull; {g.nationality} {(g as any).id_number ? `&bull; ID: ${(g as any).id_number}` : ''}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition">
                                                    Select
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Full Name, Title, Gender & Age */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                                {/* Title */}
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Title
                                    </label>
                                    <select
                                        value={data.title}
                                        onChange={e => setData('title', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                                    >
                                        <option value="Mr">Mr.</option>
                                        <option value="Mrs">Mrs.</option>
                                        <option value="Ms">Ms.</option>
                                        <option value="Dr">Dr.</option>
                                        <option value="Prof">Prof.</option>
                                        <option value="Hon">Hon.</option>
                                    </select>
                                </div>

                                {/* First Name */}
                                <div className="sm:col-span-4">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        First Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.first_name}
                                        onChange={e => setData('first_name', e.target.value)}
                                        placeholder="e.g. Emmanuel"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                {/* Last Name */}
                                <div className="sm:col-span-4">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Last Name / Surname <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.last_name}
                                        onChange={e => setData('last_name', e.target.value)}
                                        placeholder="e.g. Massawe"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                {/* Gender */}
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Gender <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.gender}
                                        onChange={e => setData('gender', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                            </div>

                            {/* Age, Phone, Email, Nationality, Tribe */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                                {/* Age */}
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Age
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="125"
                                        value={data.age}
                                        onChange={e => setData('age', e.target.value)}
                                        placeholder="e.g. 34"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                                    />
                                </div>

                                {/* Phone */}
                                <div className="sm:col-span-3">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                                        Phone Number <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={data.phone}
                                        onChange={e => setData('phone', e.target.value)}
                                        placeholder="+255 7XX XXX XXX"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                                    />
                                </div>

                                {/* Email */}
                                <div className="sm:col-span-3">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        placeholder="guest@example.com"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                                    />
                                </div>

                                {/* Nationality */}
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Nationality
                                    </label>
                                    <input
                                        type="text"
                                        value={data.nationality}
                                        onChange={e => setData('nationality', e.target.value)}
                                        placeholder="Tanzanian"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                                    />
                                </div>

                                {/* Tribe / Ethnicity */}
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Tribe / Ethnicity
                                    </label>
                                    <input
                                        type="text"
                                        value={data.tribe}
                                        onChange={e => setData('tribe', e.target.value)}
                                        placeholder="e.g. Sukuma, Chagga..."
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* =========================================================================
                        SECTION 3: STATUTORY IDENTIFICATION & TRAVEL ITINERARY
                    ========================================================================= */}
                    {(activeSection === 'all' || activeSection === 'id') && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-extrabold text-xs flex items-center justify-center">
                                        3
                                    </span>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Statutory Identification & Travel Itinerary
                                        </h3>
                                        <p className="text-[11px] text-slate-500">
                                            Official government ID, origin address, destination, and vehicle registration
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* ID Type & ID Number */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <IdCard className="w-3.5 h-3.5 text-blue-600" />
                                        Official ID Type <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.id_type}
                                        onChange={e => setData('id_type', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold"
                                    >
                                        <option value="national_id">National ID (NIDA)</option>
                                        <option value="driving_license">Driving License</option>
                                        <option value="passport">Passport</option>
                                        <option value="voter_id">Voter ID</option>
                                        <option value="zanzibar_id">Zanzibar Resident ID (ZAN ID)</option>
                                        <option value="other">Other Official Government ID</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <Fingerprint className="w-3.5 h-3.5 text-blue-600" />
                                        ID / Document Number <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.id_number}
                                        onChange={e => setData('id_number', e.target.value)}
                                        placeholder="e.g. 19900101-12345-00001-22"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-1 block">Physical original ID must be presented upon check-in</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <Car className="w-3.5 h-3.5 text-blue-600" />
                                        Vehicle Plate Number
                                    </label>
                                    <input
                                        type="text"
                                        value={data.vehicle_reg_no}
                                        onChange={e => setData('vehicle_reg_no', e.target.value)}
                                        placeholder="e.g. T 842 DYZ (if traveling by vehicle)"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-semibold"
                                    />
                                </div>
                            </div>

                            {/* Origin and Destination */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                        Origin Address (Coming From) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.origin}
                                        onChange={e => setData('origin', e.target.value)}
                                        placeholder="City, town, or district originating from (e.g. Dar es Salaam)"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                        Destination (Going To) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.destination}
                                        onChange={e => setData('destination', e.target.value)}
                                        placeholder="City, town, or country proceeding to (e.g. Arusha, Nairobi)"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* =========================================================================
                        SECTION 4: BILLING, PAYMENTS & RECEIPT
                    ========================================================================= */}
                    {(activeSection === 'all' || activeSection === 'billing') && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-extrabold text-xs flex items-center justify-center">
                                        4
                                    </span>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">Billing, Payments & Receipt</h3>
                                        <p className="text-[11px] text-slate-500">Rate breakdown, advance amount paid, payment method and receipt reference</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-500">Total Stay Amount:</span>
                                    <div className="text-lg font-black text-slate-900">{formatTZS(totalAmountMinor)}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Nightly Rate */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Rate per Night (TZS)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.rate_price}
                                        onChange={e => setData('rate_price', Number(e.target.value))}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                                    />
                                </div>

                                {/* Advance Deposit / Amount Paid */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                        Advance Amount Paid (TZS)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.deposit}
                                        onChange={e => setData('deposit', Number(e.target.value))}
                                        placeholder="0"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold text-emerald-700"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-1 block">Enter 0 if paying upon check-out</span>
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                                        Payment Method
                                    </label>
                                    <select
                                        value={data.payment_method}
                                        onChange={e => setData('payment_method', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="mpesa">M-Pesa (Vodacom)</option>
                                        <option value="tigopesa">Mix by Yas / Tigo Pesa</option>
                                        <option value="airtelmoney">Airtel Money</option>
                                        <option value="bank_transfer">Bank Transfer (NMB / CRDB)</option>
                                        <option value="card">Visa / MasterCard</option>
                                    </select>
                                </div>

                                {/* Receipt Number */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                        <Receipt className="w-3.5 h-3.5 text-blue-600" />
                                        Receipt Reference #
                                    </label>
                                    <input
                                        type="text"
                                        value={data.receipt_no}
                                        onChange={e => setData('receipt_no', e.target.value)}
                                        placeholder="Auto-generated if blank"
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-semibold"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-1 block">Generated automatically if left empty</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* =========================================================================
                        SECTION 5: LEGAL COMPLIANCE, SIGNATURES & REMARKS
                    ========================================================================= */}
                    {(activeSection === 'all' || activeSection === 'legal') && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-extrabold text-xs flex items-center justify-center">
                                        5
                                    </span>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Legal Compliance, Signatures & Special Remarks
                                        </h3>
                                        <p className="text-[11px] text-slate-500">
                                            Guest declaration, attendant verification, and special operational remarks
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Remarks / Accompanied with */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Special Remarks & Accompanied Persons (e.g. traveling with driver, special requests, luggage instructions)
                                </label>
                                <textarea
                                    rows={2}
                                    value={data.notes}
                                    onChange={e => setData('notes', e.target.value)}
                                    placeholder="Enter any special remarks, accompanying guests, or vehicle parking details..."
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            {/* Signatures & Declarations */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                {/* Receptionist Confirmation */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        <UserCheck className="w-4 h-4 text-blue-600" />
                                        Attendant Verification (Receptionist Name)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={data.receptionist_name}
                                        onChange={e => setData('receptionist_name', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900"
                                    />
                                    <p className="text-[10px] text-slate-500">
                                        Receptionist confirms that the original government-issued ID was physically verified prior to key delivery.
                                    </p>
                                </div>

                                {/* Guest Declaration & Signature Check */}
                                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
                                    <label className="flex items-start gap-2.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.guest_signature}
                                            onChange={e => setData('guest_signature', e.target.checked)}
                                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5"
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 block">
                                                Guest Signature & Statutory Declaration
                                            </span>
                                            <span className="text-[10px] text-slate-600 leading-relaxed block mt-0.5">
                                                Guest confirms that all registered personal details and travel destinations are true and accurate in compliance with statutory Tanzanian accommodation regulations.
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Instant Check-In Toggle */}
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                                <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.check_in_now}
                                        onChange={e => setData('check_in_now', e.target.checked)}
                                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                                    />
                                    <div>
                                        <span className="text-xs font-bold text-slate-900 block">
                                            Check In Immediately
                                        </span>
                                        <span className="text-[10px] text-slate-500 block">
                                            Room status will immediately be updated to Occupied upon registration.
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 flex-wrap">
                        <div className="text-xs text-slate-600 font-medium">
                            {selectedRoomIds.length === 0 ? (
                                <span className="text-amber-600 font-bold">Select at least 1 room</span>
                            ) : (
                                <span className="text-emerald-700 font-bold">
                                    ✓ {selectedRoomIds.length} room(s) assigned &bull; Total: {formatTZS(totalAmountMinor)}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing || isSubmitting || selectedRoomIds.length === 0}
                                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{processing || isSubmitting ? 'Recording Ledger...' : 'Confirm & Register Guest'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Quick Add Rate Plan & Meal Basis Modal */}
            {showAddRatePlanModal && (
                <div className="fixed inset-0 z-60 flex items-start sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                    <Utensils className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Add Rate Plan & Meal Basis</h3>
                                    <p className="text-[11px] text-slate-500">Configure dining formulas and accommodation plans</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAddRatePlanModal(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRatePlan} className="p-5 space-y-3.5 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Rate Plan Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newPlanForm.name}
                                    onChange={e => setNewPlanForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Bed & Breakfast Standard, Full Board Safari..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        Meal Basis *
                                    </label>
                                    <select
                                        value={newPlanForm.meal_plan}
                                        onChange={e => setNewPlanForm(prev => ({ ...prev, meal_plan: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-blue-500"
                                    >
                                        <option value="BB">BB - Bed & Breakfast</option>
                                        <option value="HB">HB - Half Board (Breakfast & Dinner)</option>
                                        <option value="FB">FB - Full Board (All 3 Meals)</option>
                                        <option value="RO">RO - Room Only (European Plan)</option>
                                        <option value="AI">AI - All Inclusive Package</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        Code (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={newPlanForm.code}
                                        onChange={e => setNewPlanForm(prev => ({ ...prev, code: e.target.value }))}
                                        placeholder="e.g. BB-STD"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 uppercase focus:bg-white focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer pt-1">
                                <input
                                    type="checkbox"
                                    checked={newPlanForm.is_resident_only}
                                    onChange={e => setNewPlanForm(prev => ({ ...prev, is_resident_only: e.target.checked }))}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                />
                                <span className="font-semibold text-slate-700">East African / Tanzania Resident Only</span>
                            </label>

                            {planError && (
                                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                                    {planError}
                                </div>
                            )}

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddRatePlanModal(false)}
                                    className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingPlan}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                                >
                                    {savingPlan ? 'Saving...' : 'Save & Select Rate Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
