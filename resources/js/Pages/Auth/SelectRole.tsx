import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import { CheckCircle } from 'lucide-react';
import ApplicationLogo from '@/Components/ApplicationLogo';

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
        if (!selected) return 'border-[#E2E8F0]/30 bg-white/5 hover:border-[#D4AF37]';
        if (color === 'blue') return 'border-[#D4AF37] ring-2 ring-[#D4AF37]/30';
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

            <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] via-[#1E3A5F]/90 to-[#1E3A5F]/80 flex flex-col items-center justify-center p-4">
                {/* Header */}
                <div className="w-full max-w-lg text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <ApplicationLogo className="w-12 h-12 shadow-md" />
                        <span className="text-xl font-bold text-[#D4AF37] tracking-wide">THE INNS</span>
                    </div>
                    {property && (
                        <p className="text-sm text-[#D4AF37]/80 mb-1">{property.name}</p>
                    )}
                    <h1 className="text-2xl font-bold text-white">Select Your Active Role</h1>
                    <p className="text-sm text-white/70 mt-2">
                        You have multiple roles assigned. Choose the role you want to access now.
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
                                className={`w-full text-left bg-white/10 backdrop-blur-sm rounded-lg border-2 p-4 transition-all duration-150 flex items-center gap-4 ${colorBorder(roleMeta.color, isSelected)}`}
                            >
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${
                                    isSelected ? 'bg-[#D4AF37] text-[#1E3A5F]' : 'bg-white/10'
                                }`}>
                                    {roleMeta.icon}
                                </div>

                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-white">{roleMeta.title || roleMeta.title_sw}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorBadge(roleMeta.color)}`}>
                                            {roleMeta.badge}
                                        </span>
                                    </div>
                                    <p className="text-sm text-white/60 mt-0.5 line-clamp-2">{roleMeta.description}</p>
                                </div>

                                {/* Check */}
                                {isSelected && (
                                    <CheckCircle className={`w-5 h-5 flex-shrink-0 ${colorCheck(roleMeta.color)}`} />
                                )}
                            </button>
                        );
                    })}

                    {errors.role && (
                        <p className="text-sm text-rose-300 text-center">{errors.role}</p>
                    )}

                    <button
                        type="submit"
                        disabled={processing || !data.role}
                        className="w-full mt-4 py-3 bg-[#D4AF37] text-[#1E3A5F] rounded-lg font-bold hover:bg-[#B8960C] transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#D4AF37]/30"
                    >
                        {processing ? 'Processing...' : 'Continue with Selected Role →'}
                    </button>
                </form>

                <p className="text-xs text-white/50 mt-6 text-center">
                    You can switch your active role at any time from the top navigation bar.
                </p>
            </div>
        </>
    );
}

