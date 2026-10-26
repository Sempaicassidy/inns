export interface User {
    id: number;
    tenant_id?: string;
    property_id?: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    status: string;
    locale: string;
    email_verified_at?: string;
    tenant?: Tenant;
    property?: Property;
}

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    subdomain?: string;
    plan: string;
    is_active: boolean;
}

export interface Property {
    id: string;
    tenant_id: string;
    name: string;
    code?: string;
    property_type: 'hotel' | 'lodge' | 'camp' | 'resort' | 'guest_house';
    timezone: string;
    currency: string;
    checkin_time: string;
    checkout_time: string;
    city?: string;
    country: string;
}

export interface RoomType {
    id: string;
    code: string;
    name: string;
    base_occupancy: number;
    max_adults: number;
    max_children: number;
    base_price_minor: number;
    amenities?: string[];
    description?: string;
}

export interface Room {
    id: string;
    room_type_id: string;
    room_number: string;
    floor: string;
    status_occupancy: 'vacant' | 'occupied';
    status_hk: 'clean' | 'dirty' | 'inspected' | 'out_of_order' | 'out_of_service';
    is_active: boolean;
    room_type?: RoomType;
}

export interface RatePlan {
    id: string;
    code: string;
    name: string;
    meal_plan: 'RO' | 'BB' | 'HB' | 'FB' | 'AI';
    is_resident_only: boolean;
    cancellation_policy?: Record<string, unknown>;
    rules?: Record<string, unknown>;
}

export interface Guest {
    id: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    phone?: string;
    email?: string;
    nationality: string;
    is_resident: boolean;
    id_type: string;
    id_number?: string;
    vip_level: string;
    is_blacklisted: boolean;
    preferences?: Record<string, unknown>;
    notes?: string;
}

export interface ReservationRoom {
    id: string;
    reservation_id: string;
    room_type_id: string;
    room_id?: string;
    rate_plan_id: string;
    check_in: string;
    check_out: string;
    rate_price_minor: number;
    status: string;
    room_type?: RoomType;
    room?: Room;
    reservation?: Reservation;
}

export interface Reservation {
    id: string;
    property_id: string;
    ref_no: string;
    guest_id: string;
    company_id?: string;
    source: string;
    status: 'inquiry' | 'tentative' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
    check_in: string;
    check_out: string;
    adults: number;
    children: number;
    total_minor: number;
    deposit_minor: number;
    notes?: string;
    guest?: Guest;
    reservation_rooms?: ReservationRoom[];
    folios?: Folio[];
}

export interface Stay {
    id: string;
    reservation_room_id: string;
    room_id: string;
    guest_id: string;
    checked_in_at: string;
    checked_out_at?: string;
    registration_data?: Record<string, unknown>;
    room?: Room;
    guest?: Guest;
    reservation_room?: ReservationRoom;
}

export interface FolioLine {
    id: string;
    folio_id: string;
    business_date: string;
    line_type: 'room' | 'restaurant' | 'bar' | 'laundry' | 'tour' | 'minibar' | 'miscellaneous' | 'adjustment';
    description: string;
    amount_minor: number;
    tax_minor: number;
    source_ref?: string;
    posted_by?: User;
    created_at: string;
}

export interface Payment {
    id: string;
    folio_id: string;
    business_date: string;
    payment_method: 'cash' | 'mpesa' | 'tigopesa' | 'airtelmoney' | 'halopesa' | 'card' | 'bank_transfer' | 'city_ledger';
    provider?: string;
    provider_ref?: string;
    amount_minor: number;
    currency: string;
    status: 'pending' | 'confirmed' | 'failed' | 'refunded';
    notes?: string;
    receiver?: User;
    created_at: string;
}

export interface Folio {
    id: string;
    property_id: string;
    reservation_id?: string;
    stay_id?: string;
    folio_number: string;
    owner_type: 'guest' | 'company';
    owner_id: string;
    currency: string;
    total_charges_minor: number;
    total_payments_minor: number;
    balance_minor: number;
    status: 'open' | 'settled' | 'closed';
    lines?: FolioLine[];
    payments?: Payment[];
    reservation?: Reservation;
    stay?: Stay;
    created_at: string;
}

export interface HousekeepingTask {
    id: string;
    room_id: string;
    task_type: 'checkout_clean' | 'stayover_clean' | 'deep_clean' | 'inspection' | 'touchup';
    priority: 'normal' | 'high' | 'urgent';
    status: 'pending' | 'in_progress' | 'completed' | 'inspected';
    notes?: string;
    room?: Room;
    assignee?: User;
    created_at: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
        property?: Property;
        businessDate?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
};
