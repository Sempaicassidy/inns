import { OFFLINE_CONFIG } from './config';

export type NetworkStatus = 'ONLINE' | 'OFFLINE' | 'SERVER_UNREACHABLE';

export interface NetworkDetail {
    online: boolean;
    serverReachable: boolean;
    status: NetworkStatus;
}

class NetworkManager extends EventTarget {
    private browserOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
    private serverReachable: boolean = false;
    private pingTimer: any = null;

    constructor() {
        super();

        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.handleBrowserChange(true));
            window.addEventListener('offline', () => this.handleBrowserChange(false));

            // Start background ping checks
            this.checkServerConnectivity();
            this.pingTimer = setInterval(() => {
                this.checkServerConnectivity();
            }, OFFLINE_CONFIG.pingInterval);
        }
    }

    private handleBrowserChange(isOnline: boolean) {
        this.browserOnline = isOnline;
        if (!isOnline) {
            this.serverReachable = false;
            this.emitStatus();
        } else {
            // Verify if server is actually reachable
            this.checkServerConnectivity();
        }
    }

    public async checkServerConnectivity(): Promise<boolean> {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            this.serverReachable = false;
            this.emitStatus();
            return false;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const pingUrl = `${OFFLINE_CONFIG.apiBaseUrl}${OFFLINE_CONFIG.pingEndpoint}?_t=${Date.now()}`;
            const response = await fetch(pingUrl, {
                method: 'GET',
                cache: 'no-store',
                signal: controller.signal,
                credentials: 'include',
            });

            clearTimeout(timeoutId);

            const reachable = response.ok;
            if (this.serverReachable !== reachable) {
                this.serverReachable = reachable;
                this.emitStatus();
            }
            return reachable;
        } catch {
            if (this.serverReachable) {
                this.serverReachable = false;
                this.emitStatus();
            }
            return false;
        }
    }

    private emitStatus() {
        const status: NetworkStatus = !this.browserOnline
            ? 'OFFLINE'
            : this.serverReachable
            ? 'ONLINE'
            : 'SERVER_UNREACHABLE';

        this.dispatchEvent(
            new CustomEvent<NetworkDetail>('change', {
                detail: {
                    online: this.browserOnline,
                    serverReachable: this.serverReachable,
                    status,
                },
            })
        );
    }

    public isOnline(): boolean {
        return this.browserOnline && this.serverReachable;
    }

    public isBrowserOnline(): boolean {
        return this.browserOnline;
    }

    public isServerReachable(): boolean {
        return this.serverReachable;
    }

    public destroy() {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
    }
}

export const network = new NetworkManager();
