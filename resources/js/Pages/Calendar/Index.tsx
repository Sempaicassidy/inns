import RoomAvailabilityCalendar, { CalendarProps } from '@/Components/RoomAvailabilityCalendar';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';

export default function CalendarPage(props: CalendarProps & PageProps) {
    return (
        <AuthenticatedLayout>
            <Head title="Room Availability Matrix - THE INNS" />
            <RoomAvailabilityCalendar {...props} />
        </AuthenticatedLayout>
    );
}
