'use client';

interface StatsDisplayProps {
    latency?: number;
    bitrate?: number;
    fps?: number;
    duration: number;
    className?: string;
}

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatBitrate(bps?: number): string {
    if (!bps) return 'N/A';
    const mbps = bps / 1000000;
    return `${mbps.toFixed(1)} Mbps`;
}

export function StatsDisplay({
    latency,
    bitrate,
    fps,
    duration,
    className = '',
}: StatsDisplayProps) {
    return (
        <div className={`bg-black/60 border border-white/10 rounded-lg p-3 ${className}`}>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                {/* Latency */}
                <div>
                    <div className="text-gray-400">Latency</div>
                    <div className={`font-medium ${latency !== undefined
                            ? latency < 50 ? 'text-green-400' : latency < 100 ? 'text-yellow-400' : 'text-red-400'
                            : 'text-gray-500'
                        }`}>
                        {latency !== undefined ? `${latency}ms` : 'N/A'}
                    </div>
                </div>

                {/* Bitrate */}
                <div>
                    <div className="text-gray-400">Bitrate</div>
                    <div className="text-white font-medium">
                        {formatBitrate(bitrate)}
                    </div>
                </div>

                {/* FPS */}
                <div>
                    <div className="text-gray-400">FPS</div>
                    <div className={`font-medium ${fps !== undefined
                            ? fps >= 55 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'
                            : 'text-gray-500'
                        }`}>
                        {fps !== undefined ? fps : 'N/A'}
                    </div>
                </div>

                {/* Duration */}
                <div>
                    <div className="text-gray-400">Duration</div>
                    <div className="text-white font-medium">
                        {formatDuration(duration)}
                    </div>
                </div>
            </div>
        </div>
    );
}
