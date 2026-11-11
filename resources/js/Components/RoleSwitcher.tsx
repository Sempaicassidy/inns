import { useActiveRole } from '@/contexts/ActiveRoleContext';
import { Check, ChevronDown, Loader2, Repeat } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function RoleSwitcher() {
    const { activeRole, availableRoles, switchRole, isSwitching } = useActiveRole();
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const activeMeta = availableRoles.find((r) => r.role === activeRole);
    const activeLabel = activeMeta?.title_sw || activeMeta?.title || activeRole;
    const canSwitch = availableRoles.length > 1;

    useEffect(() => {
        const onClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    const handleSelect = async (role: string) => {
        if (role === activeRole || isSwitching) return;
        setError(null);
        const result = await switchRole(role);
        if (!result.success) {
            setError(result.error || 'Unable to switch workspace.');
        }
        setOpen(false);
    };

    return (
        <div ref={containerRef} className="px-3 pt-3">
            <p className="px-1 mb-1 text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37]/60">
                Current Workspace
            </p>
            <button
                type="button"
                onClick={() => canSwitch && setOpen((v) => !v)}
                disabled={!canSwitch || isSwitching}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition ${
                    canSwitch
                        ? 'bg-white/5 border-[#D4AF37]/25 hover:bg-white/10 hover:border-[#D4AF37]/50 cursor-pointer'
                        : 'bg-white/5 border-[#D4AF37]/15 cursor-default'
                }`}
                title={canSwitch ? 'Switch workspace role' : 'No other roles assigned'}
            >
                <span className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center shrink-0">
                    {isSwitching ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Repeat className="w-3.5 h-3.5" />
                    )}
                </span>
                <span className="flex-1 min-w-0">
                    <span className="block text-[10px] font-semibold text-white/50 leading-none mb-0.5">Active Role</span>
                    <span className="block text-xs font-bold text-white truncate">{activeLabel}</span>
                </span>
                {canSwitch && (
                    <ChevronDown className={`w-3.5 h-3.5 text-white/50 transition-transform ${open ? 'rotate-180' : ''}`} />
                )}
            </button>

            {open && canSwitch && (
                <div className="mt-1.5 rounded-xl border border-[#D4AF37]/25 bg-[#16294a] shadow-xl overflow-hidden">
                    <p className="px-3 pt-2.5 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37]/60">
                        Available Roles
                    </p>
                    <div className="px-1.5 pb-1.5 max-h-56 overflow-y-auto">
                        {availableRoles.map((role) => {
                            const isActive = role.role === activeRole;
                            const label = role.title_sw || role.title || role.role;
                            return (
                                <button
                                    key={role.role}
                                    type="button"
                                    onClick={() => handleSelect(role.role)}
                                    disabled={isSwitching}
                                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs font-semibold transition ${
                                        isActive
                                            ? 'bg-[#D4AF37]/15 text-[#D4AF37]'
                                            : 'text-white/70 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    <span className="flex-1 truncate">{label}</span>
                                    {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                    {error && <p className="px-3 pb-2 text-[11px] font-semibold text-rose-400">{error}</p>}
                </div>
            )}
        </div>
    );
}
