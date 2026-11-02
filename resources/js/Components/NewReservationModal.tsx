import { Guest, RatePlan, Room, RoomType } from '@/types';
import { router, useForm } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    Check,
    ChevronDown,
    ChevronUp,
    CreditCard,
    DollarSign,
    Lock,
    Search,
    Shield,
    Tag,
    User,
    Users,
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

    const effectiveRoomId = initialRoomId || preselectedRoomId;
    const defaultCheckIn = initialCheckIn || preselectedDate || new Date().toISOString().split('T')[0];
    const defaultCheckOut = initialCheckOut || (() => {
        const d = new Date(defaultCheckIn);
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    })();

    const [guestSearch, setGuestSearch] = useState('');
    const [showGuestDropdown, setShowGuestDropdown] = useState(false);
    const [kycOpen, setKycOpen] = useState(true);
    const [roomSearch, setRoomSearch] = useState('');
    const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>(
        effectiveRoomId ? [effectiveRoomId] : []
    );
    const [expandedFloors, setExpandedFloors] = useState<Record<string, boolean>>({});
    const [submitErrors, setSubmitErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const initialRoomObj = rooms.find(r => String(r.id) === String(effectiveRoomId));
    const initialRtId = initialRoomObj?.room_type_id || initialRoomObj?.roomType?.id || roomTypes[0]?.id || '';
    const initialRpId = ratePlans[0]?.id || '';
    const initialPriceMinor = initialRoomObj?.roomType?.base_price_minor || initialRoomObj?.room_type?.base_price_minor || 35000000;

    const { data, setData, post, processing, reset, errors } = useForm({
        title: 'Mr',
        guest_id: '',
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        company_name: '',
        tax_number: '',
        id_type: 'national_id',
        id_number: '',
        address: '',
        nationality: 'Tanzanian',
        room_ids: effectiveRoomId ? [effectiveRoomId] : ([] as string[]),
        room_id: effectiveRoomId || (rooms[0]?.id ?? ''),
        room_type_id: initialRtId,
        rate_plan_id: initialRpId,
        rate_price: initialPriceMinor / 100,
        check_in: defaultCheckIn,
        check_out: defaultCheckOut,
        adults: 2,
        children: 0,
        source: 'walk_in',
        discount_minor: 0,
        notes: '',
        check_in_now: false,
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
            const basePriceMinor = rObj?.roomType?.base_price_minor || rObj?.room_type?.base_price_minor || 35000000;

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
                phone: targetGuest ? (targetGuest.phone ?? '') : prev.phone,
                email: targetGuest ? (targetGuest.email ?? '') : prev.email,
                nationality: targetGuest ? (targetGuest.nationality ?? 'Tanzanian') : prev.nationality,
                id_number: targetGuest ? (targetGuest.id_number ?? '') : prev.id_number,
            }));
        }
    }, [isOpen, initialRoomId, initialCheckIn, initialCheckOut, initialGuestId, preselectedRoomId, preselectedDate, rooms, roomTypes, ratePlans]);

    // Update selected rooms in form data
    useEffect(() => {
        if (selectedRoomIds.length > 0) {
            const firstRoomId = selectedRoomIds[0];
            const roomObj = rooms.find(r => String(r.id) === String(firstRoomId));
            const rtId = roomObj?.room_type_id || roomObj?.roomType?.id || roomObj?.room_type?.id || roomTypes[0]?.id || '';
            const rtPriceMinor = roomObj?.roomType?.base_price_minor || roomObj?.room_type?.base_price_minor || 35000000;

            setData(prev => ({
                ...prev,
                room_ids: selectedRoomIds,
                room_id: firstRoomId,
                room_type_id: rtId || prev.room_type_id,
                rate_price: rtPriceMinor / 100,
            }));
        }
    }, [selectedRoomIds, rooms, roomTypes]);

    // Filter existing guests by search query
    const filteredGuests = useMemo(() => {
        if (!guestSearch.trim()) return [];
        const q = guestSearch.toLowerCase();
        return guests.filter(g =>
            g.first_name?.toLowerCase().includes(q) ||
            g.last_name?.toLowerCase().includes(q) ||
            g.phone?.includes(q) ||
            g.email?.toLowerCase().includes(q)
        ).slice(0, 5);
    }, [guests, guestSearch]);

    // Handle selecting an existing guest
    const handleSelectGuest = (g: Guest) => {
        setData(prev => ({
            ...prev,
            guest_id: g.id,
            first_name: g.first_name || '',
            last_name: g.last_name || '',
            phone: g.phone || '',
            email: g.email || '',
            id_type: (g as any).id_type || 'national_id',
            id_number: (g as any).id_number || '',
            nationality: g.nationality || 'Tanzanian',
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

    // Calculate total amount
    const totalAmountMinor = useMemo(() => {
        let sum = 0;
        selectedRoomIds.forEach(id => {
            const room = rooms.find(r => String(r.id) === String(id));
            const rt = room?.room_type || room?.roomType;
            const price = rt?.base_price_minor || 35000000;
            sum += price * nights;
        });
        return Math.max(0, sum - (data.discount_minor || 0));
    }, [selectedRoomIds, rooms, nights, data.discount_minor]);

    const toggleRoomSelection = (roomId: string) => {
        setSelectedRoomIds(prev =>
            prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
        );
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

        if (selectedRoomIds.length === 0) {
            setSubmitErrors({ room: 'Please select at least one room from the list.' });
            return;
        }

        const primaryRoomId = selectedRoomIds[0] || data.room_id || (rooms[0]?.id ?? '');
        const primaryRoom = rooms.find(r => String(r.id) === String(primaryRoomId));
        const rtId = primaryRoom?.room_type_id || primaryRoom?.roomType?.id || primaryRoom?.room_type?.id || roomTypes[0]?.id || '';
        const rpId = data.rate_plan_id || ratePlans[0]?.id || '';
        const rtPrice = (primaryRoom?.roomType?.base_price_minor || primaryRoom?.room_type?.base_price_minor || 35000000) / 100;

        const payload: Record<string, any> = {
            ...data,
            guest_id: data.guest_id ? data.guest_id : null,
            room_id: primaryRoomId || null,
            room_ids: selectedRoomIds,
            room_type_id: rtId || null,
            rate_plan_id: rpId || null,
            rate_price: data.rate_price && Number(data.rate_price) > 0 ? Number(data.rate_price) : rtPrice,
        };

        setIsSubmitting(true);
        setSubmitErrors({});

        router.post(route('reservations.store'), payload, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmitting(false);
                reset();
                onClose();
            },
            onError: (errs) => {
                setIsSubmitting(false);
                setSubmitErrors(errs);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            +
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">New Reservation / Walk-In</h2>
                            <p className="text-xs text-gray-500">Create booking or check in guest directly</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                        title="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
                    {/* Error Notice Banner */}
                    {(Object.keys(errors).length > 0 || Object.keys(submitErrors).length > 0) && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-1 animate-in fade-in">
                            <div className="font-bold flex items-center gap-1.5 text-sm text-red-900">
                                <span>Reservation Validation Errors:</span>
                            </div>
                            <ul className="list-disc list-inside space-y-0.5 mt-1 text-red-700">
                                {Object.entries({ ...errors, ...submitErrors }).map(([key, err]) => (
                                    <li key={key}>
                                        <strong className="capitalize">{key.replace('_', ' ')}:</strong> {err}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {/* SECTION 1: GUEST INFORMATION */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Title */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    Title
                                </label>
                                <select
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                >
                                    <option value="Mr">Mr.</option>
                                    <option value="Mrs">Mrs.</option>
                                    <option value="Ms">Ms.</option>
                                    <option value="Dr">Dr.</option>
                                    <option value="Prof">Prof.</option>
                                </select>
                            </div>

                            {/* Search Existing Guest */}
                            <div className="md:col-span-3 relative">
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    Search Existing Guest
                                </label>
                                <div className="relative">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={guestSearch}
                                        onChange={e => {
                                            setGuestSearch(e.target.value);
                                            setShowGuestDropdown(true);
                                        }}
                                        onFocus={() => setShowGuestDropdown(true)}
                                        placeholder="Search by name, phone, or email..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
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
                                                }));
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Autocomplete Dropdown */}
                                {showGuestDropdown && filteredGuests.length > 0 && (
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-30 overflow-hidden divide-y divide-gray-100">
                                        {filteredGuests.map(g => (
                                            <button
                                                key={g.id}
                                                type="button"
                                                onClick={() => handleSelectGuest(g)}
                                                className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition flex items-center justify-between group"
                                            >
                                                <div>
                                                    <div className="font-semibold text-sm text-gray-900 group-hover:text-blue-600">
                                                        {g.first_name} {g.last_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {g.phone} {g.email ? `• ${g.email}` : ''}
                                                    </div>
                                                </div>
                                                <span className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition">
                                                    Select
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Name, Phone, Email */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={data.first_name}
                                    onChange={e => setData('first_name', e.target.value)}
                                    placeholder="e.g. Baraka"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                />
                                {errors.first_name && (
                                    <span className="text-xs text-red-500 mt-1">{errors.first_name}</span>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={data.last_name}
                                    onChange={e => setData('last_name', e.target.value)}
                                    placeholder="e.g. Mlowe"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    Phone <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={data.phone}
                                    onChange={e => setData('phone', e.target.value)}
                                    placeholder="e.g. +255 712 345 678"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                />
                                {errors.phone && (
                                    <span className="text-xs text-red-500 mt-1">{errors.phone}</span>
                                )}
                            </div>
                        </div>

                        {/* Email, Company Name, TIN */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    placeholder="guest@example.com"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    Company Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={data.company_name}
                                    onChange={e => setData('company_name', e.target.value)}
                                    placeholder="Enter company name"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    TIN / GSTIN Number (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={data.tax_number}
                                    onChange={e => setData('tax_number', e.target.value)}
                                    placeholder="Enter TIN number"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                />
                            </div>
                        </div>

                        {/* Collapsible KYC Information */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                            <button
                                type="button"
                                onClick={() => setKycOpen(!kycOpen)}
                                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-100/60 transition"
                            >
                                <span className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-blue-600" />
                                    KYC Information
                                </span>
                                {kycOpen ? (
                                    <ChevronUp className="w-4 h-4 text-gray-500" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                )}
                            </button>

                            {kycOpen && (
                                <div className="p-4 pt-1 border-t border-gray-200/60 grid grid-cols-1 md:grid-cols-4 gap-4 bg-white">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            ID Type
                                        </label>
                                        <select
                                            value={data.id_type}
                                            onChange={e => setData('id_type', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500/20"
                                        >
                                            <option value="national_id">National ID (NIDA)</option>
                                            <option value="passport">Passport</option>
                                            <option value="driving_license">Driving License</option>
                                            <option value="voter_id">Voter ID</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            ID Number
                                        </label>
                                        <input
                                            type="text"
                                            value={data.id_number}
                                            onChange={e => setData('id_number', e.target.value)}
                                            placeholder="Enter ID number"
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            value={data.address}
                                            onChange={e => setData('address', e.target.value)}
                                            placeholder="Enter address"
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Nationality
                                        </label>
                                        <input
                                            type="text"
                                            value={data.nationality}
                                            onChange={e => setData('nationality', e.target.value)}
                                            placeholder="Tanzanian"
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 2: DATES & STAY SETTINGS */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-blue-50/40 border border-blue-100">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                Check-in Date
                            </label>
                            <input
                                type="date"
                                required
                                value={data.check_in}
                                onChange={e => setData('check_in', e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                Check-out Date
                            </label>
                            <input
                                type="date"
                                required
                                value={data.check_out}
                                onChange={e => setData('check_out', e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Rate Plan
                            </label>
                            <select
                                value={data.rate_plan_id}
                                onChange={e => setData('rate_plan_id', e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800"
                            >
                                {ratePlans.map(rp => (
                                    <option key={rp.id} value={rp.id}>
                                        {rp.name} ({rp.meal_plan})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-blue-600" />
                                Guests
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={data.adults}
                                    onChange={e => setData('adults', Number(e.target.value))}
                                    className="w-1/2 bg-white border border-gray-200 rounded-xl px-2 py-2 text-sm text-gray-800"
                                >
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <option key={n} value={n}>{n} Ad</option>
                                    ))}
                                </select>
                                <select
                                    value={data.children}
                                    onChange={e => setData('children', Number(e.target.value))}
                                    className="w-1/2 bg-white border border-gray-200 rounded-xl px-2 py-2 text-sm text-gray-800"
                                >
                                    {[0, 1, 2, 3].map(n => (
                                        <option key={n} value={n}>{n} Ch</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: FLOOR-BY-FLOOR ROOM SELECTOR */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">
                                    Select Rooms <span className="text-red-500">*</span>
                                    <span className="text-xs font-normal text-gray-500 ml-1">
                                        (You can select multiple)
                                    </span>
                                </h3>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                                <button
                                    type="button"
                                    onClick={expandAllFloors}
                                    className="text-blue-600 hover:underline font-medium"
                                >
                                    Expand All
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                    type="button"
                                    onClick={collapseAllFloors}
                                    className="text-blue-600 hover:underline font-medium"
                                >
                                    Collapse All
                                </button>
                                <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded-md font-medium">
                                    {selectedRoomIds.length} of {totalMatchingRooms} rooms selected
                                </span>
                            </div>
                        </div>

                        {/* Room Search Filter */}
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={roomSearch}
                                onChange={e => setRoomSearch(e.target.value)}
                                placeholder="Search rooms by number, type, floor..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        {/* Floor Accordions */}
                        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                            {Object.keys(floorGroups).length > 0 ? (
                                Object.entries(floorGroups).map(([floor, floorRooms]) => {
                                    const isExpanded = expandedFloors[floor] !== false;
                                    const availableCount = floorRooms.filter(r => r.status_occupancy === 'vacant').length;

                                    return (
                                        <div key={floor} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                                            {/* Floor Bar */}
                                            <button
                                                type="button"
                                                onClick={() => toggleFloor(floor)}
                                                className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100/70 transition flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <span className="w-6 h-6 rounded-md bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                                                        {floor.charAt(0).toUpperCase()}
                                                    </span>
                                                    <span className="font-semibold text-sm text-gray-900">
                                                        {floor.toLowerCase().includes('floor') ? floor : `Floor ${floor}`}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {availableCount} rooms available
                                                    </span>
                                                </div>
                                                {isExpanded ? (
                                                    <ChevronUp className="w-4 h-4 text-gray-500" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                                )}
                                            </button>

                                            {/* Rooms Grid inside Floor */}
                                            {isExpanded && (
                                                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                    {floorRooms.map(room => {
                                                        const isSelected = selectedRoomIds.includes(room.id);
                                                        const isOccupied = room.status_occupancy === 'occupied';
                                                        const rt = room.room_type || room.roomType;
                                                        const price = rt?.base_price_minor || 35000000;

                                                        return (
                                                            <div
                                                                key={room.id}
                                                                onClick={() => !isOccupied && toggleRoomSelection(room.id)}
                                                                className={`border rounded-xl p-3 cursor-pointer transition-all duration-150 relative ${
                                                                    isOccupied
                                                                        ? 'bg-gray-50/70 border-gray-200 opacity-60 cursor-not-allowed'
                                                                        : isSelected
                                                                        ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20'
                                                                        : 'bg-white border-gray-200 hover:border-blue-400'
                                                                }`}
                                                            >
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isSelected}
                                                                            disabled={isOccupied}
                                                                            onChange={() => {}}
                                                                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                                                                        />
                                                                        <span className="font-bold text-sm text-gray-900">
                                                                            Room {room.room_number}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-xs font-bold text-emerald-600">
                                                                        {formatTZS(price)}
                                                                        <span className="text-[10px] text-gray-400 font-normal"> /night</span>
                                                                    </span>
                                                                </div>

                                                                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                                                    <span className="text-[11px] font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">
                                                                        {rt?.name || 'Standard'}
                                                                    </span>
                                                                    <span className="text-[11px] text-gray-500">
                                                                        Capacity: {rt?.max_adults || 2} guests
                                                                    </span>
                                                                </div>

                                                                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-400">
                                                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">WiFi</span>
                                                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">TV</span>
                                                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">AC</span>
                                                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">+2</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    No rooms match your search query.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 4: PRICING & STATUS */}
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-4">
                        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                            Pricing & Status
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Total Amount ({nights} {nights === 1 ? 'night' : 'nights'})
                                </label>
                                <div className="text-2xl font-bold text-gray-900">
                                    {formatTZS(totalAmountMinor)}
                                </div>
                                <span className="text-xs text-gray-500">
                                    Includes taxes for {selectedRoomIds.length} room(s)
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Discount Amount (TZS)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.discount_minor ? data.discount_minor / 100 : ''}
                                    onChange={e => setData('discount_minor', Number(e.target.value) * 100)}
                                    placeholder="0"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800"
                                />
                            </div>

                            <div className="flex flex-col justify-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.check_in_now}
                                        onChange={e => setData('check_in_now', e.target.checked)}
                                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                                    />
                                    <span className="text-sm font-semibold text-gray-800">
                                        Check In Immediately
                                    </span>
                                </label>
                                <span className="text-xs text-gray-500 ml-6">
                                    Assigns room key and creates active stay
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 flex-wrap">
                        <div className="text-xs text-gray-500 font-medium">
                            {selectedRoomIds.length === 0 ? (
                                <span className="text-amber-600 font-bold">Select at least 1 room</span>
                            ) : (
                                <span className="text-emerald-700 font-bold">✓ {selectedRoomIds.length} room(s) selected</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing || isSubmitting || selectedRoomIds.length === 0}
                                className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md shadow-blue-500/20 cursor-pointer"
                            >
                                {processing || isSubmitting ? 'Saving...' : 'Confirm Reservation'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
