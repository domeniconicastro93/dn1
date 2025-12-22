/**
 * RTP H.264 Packetizer (RFC 6184)
 * 
 * Packetizes H.264 NAL units into RTP packets for WebRTC
 */

import { NALUnit } from './h264-parser';

export interface RTPPacket {
    payload: Buffer;
    marker: boolean; // Last packet of frame
    timestamp: number;
}

/**
 * RTP H.264 Packetizer
 * 
 * Implements RFC 6184 - RTP Payload Format for H.264 Video
 */
export class RTPPacketizer {
    private sequenceNumber: number = 0;
    private timestamp: number = 0;
    private readonly clockRate: number = 90000; // H.264 clock rate
    private readonly maxPayloadSize: number = 1200; // MTU safe size

    constructor(private readonly fps: number) { }

    /**
     * Packetize NAL unit into RTP packets
     * 
     * Single NAL Unit Mode or Fragmentation Unit (FU-A) mode
     */
    packetize(nalUnit: NALUnit): RTPPacket[] {
        const packets: RTPPacket[] = [];

        // Small NAL units: Single NAL Unit Mode
        if (nalUnit.data.length <= this.maxPayloadSize) {
            packets.push({
                payload: nalUnit.data,
                marker: true, // End of frame
                timestamp: this.timestamp
            });
        }
        // Large NAL units: Fragmentation Unit (FU-A) Mode
        else {
            const fragments = this.fragmentNALUnit(nalUnit);

            fragments.forEach((fragment, index) => {
                const isLast = index === fragments.length - 1;

                packets.push({
                    payload: fragment,
                    marker: isLast, // Mark last fragment
                    timestamp: this.timestamp
                });
            });
        }

        // Advance timestamp for next frame
        // timestamp increment = 90000 / fps
        const timestampIncrement = Math.floor(this.clockRate / this.fps);
        this.timestamp += timestampIncrement;

        return packets;
    }

    /**
     * Fragment large NAL unit using FU-A (Fragmentation Unit)
     * 
     * FU-A format:
     * +---------------+
     * |0|1|2|3|4|5|6|7|
     * +-+-+-+-+-+-+-+-+
     * |F|NRI|  Type   |  FU indicator
     * +---------------+
     * |S|E|R|  Type   |  FU header  
     * +---------------+
     * |  Payload...   |
     */
    private fragmentNALUnit(nalUnit: NALUnit): Buffer[] {
        const fragments: Buffer[] = [];
        const nalHeader = nalUnit.data[0];
        const nalType = nalHeader & 0x1F;
        const nalNri = nalHeader & 0xE0; // Network Reference Index

        // FU indicator: F + NRI + Type=28 (FU-A)
        const fuIndicator = nalNri | 28;

        // NAL unit payload (skip header byte)
        const payload = nalUnit.data.slice(1);

        let offset = 0;
        let isFirst = true;

        while (offset < payload.length) {
            const remainingBytes = payload.length - offset;
            const fragmentSize = Math.min(this.maxPayloadSize - 2, remainingBytes); // -2 for FU headers

            const isLast = offset + fragmentSize >= payload.length;

            // FU header: S + E + R + Type
            let fuHeader = nalType;
            if (isFirst) fuHeader |= 0x80; // Start bit
            if (isLast) fuHeader |= 0x40;  // End bit

            // Create fragment: FU indicator + FU header + payload
            const fragment = Buffer.allocUnsafe(fragmentSize + 2);
            fragment[0] = fuIndicator;
            fragment[1] = fuHeader;
            payload.copy(fragment, 2, offset, offset + fragmentSize);

            fragments.push(fragment);

            offset += fragmentSize;
            isFirst = false;
        }

        return fragments;
    }

    /**
     * Get current sequence number
     */
    getSequenceNumber(): number {
        return this.sequenceNumber;
    }

    /**
     * Increment sequence number
     */
    incrementSequenceNumber(): void {
        this.sequenceNumber = (this.sequenceNumber + 1) % 65536;
    }

    /**
     * Get current timestamp
     */
    getTimestamp(): number {
        return this.timestamp;
    }

    /**
     * Reset packetizer
     */
    reset(): void {
        this.sequenceNumber = 0;
        this.timestamp = 0;
    }
}
