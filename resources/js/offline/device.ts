import { OFFLINE_CONFIG } from './config';
import { db, LocalDevice } from './database';

const DEVICE_KEY = 'the_inns_device_id';
const DEVICE_NAME_KEY = 'the_inns_device_name';

export function getDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_KEY);

    if (!deviceId) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            deviceId = crypto.randomUUID();
        } else {
            deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        }
        localStorage.setItem(DEVICE_KEY, deviceId);
    }

    return deviceId;
}

export function getDeviceName(): string {
    let name = localStorage.getItem(DEVICE_NAME_KEY);
    if (!name) {
        const platform = (navigator as any).userAgentData?.platform || navigator.platform || 'Device';
        name = `${platform} - PWA Terminal`;
        localStorage.setItem(DEVICE_NAME_KEY, name);
    }
    return name;
}

export async function registerDevice(tenantId?: string): Promise<{ success: boolean; device?: LocalDevice; error?: string }> {
    const deviceId = getDeviceId();
    const deviceName = getDeviceName();

    try {
        const response = await fetch(`${OFFLINE_CONFIG.apiBaseUrl}${OFFLINE_CONFIG.deviceEndpoint}`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Device-Id': deviceId,
            },
            body: JSON.stringify({
                device_id: deviceId,
                device_name: deviceName,
            }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Device registration failed with status ${response.status}`);
        }

        const data = await response.json();
        const serverDevice = data.device || {};

        const localDevice: LocalDevice = {
            deviceId: serverDevice.device_id || deviceId,
            tenantId: serverDevice.tenant_id || tenantId || 'unknown',
            deviceName: serverDevice.device_name || deviceName,
            registeredAt: new Date().toISOString(),
            lastSeenAt: serverDevice.last_seen_at || new Date().toISOString(),
            isRevoked: false,
        };

        if (localDevice.tenantId !== 'unknown') {
            await db.devices.put(localDevice);
        }

        return { success: true, device: localDevice };
    } catch (error: any) {
        console.warn('[OfflineDevice] Registration deferred or offline:', error.message);
        return { success: false, error: error.message };
    }
}
