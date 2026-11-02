import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import { CheckCircle, Building2 } from 'lucide-react';

interface RoleMeta {
    role: string;
    title: string;
    title_sw: string;
    description: string;
    badge: string;
    color: string;
    icon: string;
}

interface SelectRoleProps extends PageProps {
    roles: RoleMeta[];
    activeRole: string | null;
    property: { name: string; property_type: string } | null;
}

export default function SelectRole({ roles, activeRole, property }: SelectRoleProps) {
    const { data, setData, post, processing, errors } = useForm({
        role: activeRole ?? (roles[0]?.role ?? ''),
    });

    const handleSelect = (roleKey: string) => {
        setData('role', roleKey);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('role.select.post'));
    };

    const colorBorder = (color: string, selected: boolean) => {
        if (!selected) return 'border-[#E2E8F0] hover:border-[#2563EB]';
        if (color === 'blue') return 'border-[#2563EB] ring-2 ring-[#2563EB]/20';
        if (color === 'green') return 'border-[#15803D] ring-2 ring-[#15803D]/20';
        if (color === 'amber') return 'border-[#B45309] ring-2 ring-[#B45309]/20';
        if (color === 'red') return 'border-[#B91C1C] ring-2 ring-[#B91C1C]/20';
        if (color === 'navy') return 'border-[#1E3A5F] ring-2 ring-[#1E3A5F]/20';
        return 'border-[#2563EB] ring-2 ring-[#2563EB]/20';
    };

    const colorBadge = (color: string) => {
        if (color === 'green') return 'bg-[#DCFCE7] text-[#15803D]';
        if (color === 'amber') return 'bg-[#FEF3C7] text-[#B45309]';
        if (color === 'red') return 'bg-[#FEE2E2] text-[#B91C1C]';
        if (color === 'navy') return 'bg-[#1E3A5F]/10 text-[#1E3A5F]';
        return 'bg-[#DBEAFE] text-[#2563EB]';
    };

    const colorCheck = (color: string) => {
        if (color === 'green') return 'text-[#15803D]';
        if (color === 'amber') return 'text-[#B45309]';
        if (color === 'red') return 'text-[#B91C1C]';
        if (color === 'navy') return 'text-[#1E3A5F]';
        return 'text-[#2563EB]';
    };

    return (
        <>
            <Head title="Select Your Role — THE INNS" />

            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
                {/* Header */}
                <div className="w-full max-w-lg text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-10 h-10 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-[#1E3A5F] tracking-wide">THE INNS</span>
                    </div>
                    {property && (
                        <p className="text-sm text-[#64748B] mb-1">{property.name}</p>
                    )}
                    <h1 className="text-2xl font-bold text-[#1E293B]">Chagua Jukumu Lako</h1>
                    <p className="text-sm text-[#64748B] mt-2">
                        Una majukumu mengi. Chagua jukumu unalotaka kutumia sasa.
                    </p>
                </div>

                {/* Role Cards */}
                <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-3">
                    {roles.map((roleMeta) => {
                        const isSelected = data.role === roleMeta.role;
                        return (
                            <button
                                key={roleMeta.role}
                                type="button"
                                onClick={() => handleSelect(roleMeta.role)}
                                className={`w-full text-left bg-white rounded-lg border-2 p-4 transition-all duration-150 flex items-center gap-4 ${colorBorder(roleMeta.color, isSelected)}`}
                            >
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${
                                    isSelected ? 'bg-[#1E3A5F] text-white' : 'bg-[#F8FAFC]'
                                }`}>
                                    {roleMeta.icon}
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-[#1E293B]">{roleMeta.title_sw}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorBadge(roleMeta.color)}`}>
                                            {roleMeta.badge}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[#64748B] mt-0.5 line-clamp-2">{roleMeta.description}</p>
                                </div>

                                {/* Check */}
                                {isSelected && (
                                    <CheckCircle className={`w-5 h-5 flex-shrink-0 ${colorCheck(roleMeta.color)}`} />
                                )}
                            </button>
                        );
                    })}

                    {errors.role && (
                        <p className="text-sm text-[#B91C1C] text-center">{errors.role}</p>
                    )}

                    <button
                        type="submit"
                        disabled={processing || !data.role}
                        className="w-full mt-4 py-3 bg-[#2563EB] text-white rounded-lg font-semibold hover:bg-[#1E3A5F] transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {processing ? 'Inaendelea...' : 'Ingia kwa Jukumu Hili →'}
                    </button>
                </form>

                <p className="text-xs text-[#64748B] mt-6 text-center">
                    Unaweza kubadilisha jukumu wakati wowote kutoka kwa kitufe cha juu kulia.
                </p>
            </div>
        </>
    );
}

