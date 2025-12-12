/**
 * WebRTC Session Types
 * 
 * Type definitions for cloud gaming sessions using Sunshine + WebRTC
 */

/**
 * WebRTC connection configuration
 */
export interface WebRTCConfig {
    /** Sunshine streaming host */
    host: string;
    /** Sunshine streaming port (default: 47984) */
    streamPort: number;
    /** Sunshine Web UI port (default: 47985) */
    webPort: number;
    /** Use HTTPS for Web UI */
    useHttps: boolean;
    /** ICE servers for WebRTC */
    iceServers: RTCIceServer[];
}

/**
 * ICE server configuration
 */
export interface RTCIceServer {
    urls: string | string[];
    username?: string;
    credential?: string;
}

/**
 * Session state
 */
export type SessionState =
    | 'PENDING'      // Session created, waiting for VM
    | 'STARTING'     // VM allocated, game launching
    | 'ACTIVE'       // Game running, stream active
    | 'PAUSED'       // Stream paused (future feature)
    | 'STOPPING'     // Cleanup in progress
    | 'ENDED'        // Session terminated
    | 'ERROR';       // Error occurred

/**
 * Cloud gaming session
 */
export interface CloudGamingSession {
    /** Unique session ID */
    sessionId: string;
    /** User ID */
    userId: string;
    /** Game/App ID */
    appId: string;
    /** Steam App ID (if applicable) */
    steamAppId?: string;
    /** VM ID */
    vmId: string;
    /** Session state */
    state: SessionState;
    /** WebRTC configuration */
    webrtc: WebRTCConfig;
    /** Session metadata */
    metadata: SessionMetadata;
    /** Created timestamp */
    createdAt: Date;
    /** Updated timestamp */
    updatedAt: Date;
    /** Ended timestamp */
    endedAt?: Date;
}

/**
 * Session metadata
 */
export interface SessionMetadata {
    /** VM hostname/IP */
    vmHost: string;
    /** Game title */
    gameTitle?: string;
    /** Client device info */
    deviceInfo?: {
        userAgent?: string;
        platform?: string;
        screenResolution?: string;
    };
    /** Error details (if state is ERROR) */
    error?: {
        code: string;
        message: string;
        timestamp: Date;
    };
}

/**
 * Session start request
 */
export interface SessionStartRequest {
    /** User ID */
    userId: string;
    /** Game/App ID */
    appId: string;
    /** Steam App ID (optional) */
    steamAppId?: string;
    /** Preferred region (future feature) */
    region?: string;
    /** Device info */
    deviceInfo?: SessionMetadata['deviceInfo'];
}

export interface SessionStartResponse {
    /** Session ID */
    sessionId: string;
    /** Session state */
    state: SessionState;
    /** Sunshine host */
    sunshineHost: string;
    /** Sunshine Web/API port (PHASE 11 FINAL: for WebRTC signaling) */
    sunshinePort: number;
    /** Sunshine streaming port */
    sunshineStreamPort: number;
    /** App index in Sunshine /api/apps (PHASE 11 FINAL: 1 = Steam) */
    appIndex: number;
    /** WebRTC configuration */
    webrtc: {
        /** ICE servers */
        iceServers: RTCIceServer[];
        /** WebRTC offer (if available) */
        offer?: any;
    };
    /** App ID */
    appId: string;
    /** Steam App ID */
    steamAppId?: string;

    // MOONLIGHT CLIENT COMPATIBILITY
    /** Host (alias for sunshineHost) */
    host: string;
    /** Port (alias for sunshinePort) */
    port: number;
    /** Use HTTPS */
    useHttps: boolean;
    /** UDP ports for streaming */
    udpPorts: number[];
}

/**
 * Session status response
 */
export interface SessionStatusResponse {
    /** Session ID */
    sessionId: string;
    /** Session state */
    state: SessionState;
    /** Sunshine host */
    sunshineHost: string;
    /** Sunshine streaming port */
    sunshineStreamPort: number;
    /** WebRTC configuration */
    webrtc: {
        iceServers: RTCIceServer[];
    };
    /** App ID */
    appId: string;
    /** Steam App ID */
    steamAppId?: string;
    /** Created timestamp */
    createdAt: string;
    /** Session duration (seconds) */
    duration?: number;
    /** Error details (if state is ERROR) */
    error?: {
        code: string;
        message: string;
        details?: string;
    };
    /** Health status */
    health?: {
        vmReachable: boolean;
        sunshineReachable: boolean;
        streamActive: boolean;
    };
}


/**
 * Session stop request
 */
export interface SessionStopRequest {
    /** Session ID */
    sessionId: string;
    /** Reason for stopping */
    reason?: 'user_exit' | 'timeout' | 'error' | 'admin';
}

/**
 * Session stop response
 */
export interface SessionStopResponse {
    /** Success flag */
    success: boolean;
    /** Session ID */
    sessionId: string;
    /** Final state */
    state: SessionState;
    /** Message */
    message: string;
}

/**
 * Sunshine authentication credentials
 */
export interface SunshineCredentials {
    /** Sunshine username */
    username: string;
    /** Sunshine password */
    password: string;
}

/**
 * Sunshine session info
 */
export interface SunshineSessionInfo {
    /** Session token */
    token?: string;
    /** Authenticated */
    authenticated: boolean;
    /** Sunshine version */
    version?: string;
    /** Available apps */
    apps?: SunshineApp[];
}

/**
 * Sunshine application
 */
export interface SunshineApp {
    /** App index */
    index: number;
    /** App name */
    name: string;
    /** Command to execute */
    cmd: string;
    /** Working directory */
    workingDir?: string;
}
