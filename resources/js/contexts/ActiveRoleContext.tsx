import { PageProps } from '@/types';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';

export interface RoleOption {
    role: string;
    title: string;
    title_sw?: string;
    description?: string;
    badge?: string;
    color?: string;
    route?: string;
    icon?: string;
    assigned?: boolean;
}

interface ActiveRoleContextValue {
    activeRole: string;
    availableRoles: RoleOption[];
    switchRole: (role: string) => Promise<{ success: boolean; error?: string }>;
    isSwitching: boolean;
    refreshRoleContext: () => void;
}

const ActiveRoleContext = createContext<ActiveRoleContextValue | null>(null);

export function ActiveRoleProvider({ children }: PropsWithChildren) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user as any;

    const [isSwitching, setIsSwitching] = useState(false);

    const activeRole = useMemo(
        () => (auth as any)?.active_role || user?.active_role || user?.role || 'staff',
        [auth, user]
    );

    const availableRoles = useMemo<RoleOption[]>(() => {
        const shared = (auth as any)?.available_roles;
        if (Array.isArray(shared) && shared.length > 0) {
            return shared;
        }
        const list: string[] = user?.roles_list || user?.roles || (user?.role ? [user.role] : []);
        return list.map((role) => ({ role, title: role }));
    }, [auth, user]);

    const switchRole = useCallback(
        async (role: string): Promise<{ success: boolean; error?: string }> => {
            if (isSwitching || role === activeRole) {
                return { success: role === activeRole };
            }

            setIsSwitching(true);
            try {
                const { data } = await axios.post(route('active-role.switch'), { role });
                const dashboard = data?.dashboard;
                if (dashboard) {
                    router.visit(dashboard, { preserveScroll: false });
                } else {
                    router.reload();
                }
                return { success: true };
            } catch (error: any) {
                const message =
                    error?.response?.data?.errors?.role?.[0] ||
                    error?.response?.data?.message ||
                    'Failed to switch role. Please try again.';
                return { success: false, error: message };
            } finally {
                setIsSwitching(false);
            }
        },
        [activeRole, isSwitching]
    );

    const refreshRoleContext = useCallback(() => {
        router.reload({ only: ['auth'] });
    }, []);

    const value = useMemo<ActiveRoleContextValue>(
        () => ({ activeRole, availableRoles, switchRole, isSwitching, refreshRoleContext }),
        [activeRole, availableRoles, switchRole, isSwitching, refreshRoleContext]
    );

    return <ActiveRoleContext.Provider value={value}>{children}</ActiveRoleContext.Provider>;
}

export function useActiveRole(): ActiveRoleContextValue {
    const ctx = useContext(ActiveRoleContext);
    if (!ctx) {
        throw new Error('useActiveRole must be used within an ActiveRoleProvider');
    }
    return ctx;
}
