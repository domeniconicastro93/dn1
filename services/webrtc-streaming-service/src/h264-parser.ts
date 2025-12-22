/**
 * H.264 NAL Unit Parser
 * 
 * Parses H.264 Annex B byte stream into NAL units
 * Needed for RTP packetization
 */

export interface NALUnit {
    type: number;
    data: Buffer;
    isKeyframe: boolean;
}

/**
 * Parse H.264 byte stream into NAL units
 * 
 * H.264 Annex B format:
 * - Start codes: 0x00 0x00 0x00 0x01 or 0x00 0x00 0x01
 * - NAL unit header: first byte after start code
 * - NAL unit type: bits 0-4 of header byte
 */
export class H264Parser {
    private buffer: Buffer = Buffer.alloc(0);
    private readonly START_CODE_3 = Buffer.from([0x00, 0x00, 0x01]);
    private readonly START_CODE_4 = Buffer.from([0x00, 0x00, 0x00, 0x01]);

    /**
     * Add H.264 data to parser buffer
     */
    addData(data: Buffer): void {
        this.buffer = Buffer.concat([this.buffer, data]);
    }

    /**
     * Extract all complete NAL units from buffer
     */
    extractNALUnits(): NALUnit[] {
        const nalUnits: NALUnit[] = [];
        let offset = 0;

        while (offset < this.buffer.length) {
            // Find start code
            const startCodePos = this.findStartCode(offset);

            if (startCodePos === -1) {
                // No more start codes found
                break;
            }

            // Determine start code length (3 or 4 bytes)
            const startCodeLength = this.getStartCodeLength(startCodePos);

            // Find next start code
            const nextStartCodePos = this.findStartCode(startCodePos + startCodeLength);

            if (nextStartCodePos === -1) {
                // This is the last NAL unit (incomplete), keep in buffer
                break;
            }

            // Extract NAL unit
            const nalStart = startCodePos + startCodeLength;
            const nalEnd = nextStartCodePos;
            const nalData = this.buffer.slice(nalStart, nalEnd);

            if (nalData.length > 0) {
                const nalUnit = this.parseNALUnit(nalData);
                if (nalUnit) {
                    nalUnits.push(nalUnit);
                }
            }

            offset = nextStartCodePos;
        }

        // Remove processed data from buffer
        if (offset > 0) {
            this.buffer = this.buffer.slice(offset);
        }

        return nalUnits;
    }

    /**
     * Find next start code position
     */
    private findStartCode(startOffset: number): number {
        for (let i = startOffset; i < this.buffer.length - 2; i++) {
            // Check for 0x00 0x00 0x01
            if (this.buffer[i] === 0x00 &&
                this.buffer[i + 1] === 0x00 &&
                this.buffer[i + 2] === 0x01) {
                return i;
            }

            // Check for 0x00 0x00 0x00 0x01
            if (i < this.buffer.length - 3 &&
                this.buffer[i] === 0x00 &&
                this.buffer[i + 1] === 0x00 &&
                this.buffer[i + 2] === 0x00 &&
                this.buffer[i + 3] === 0x01) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Get start code length at position
     */
    private getStartCodeLength(pos: number): number {
        if (pos + 3 < this.buffer.length &&
            this.buffer[pos] === 0x00 &&
            this.buffer[pos + 1] === 0x00 &&
            this.buffer[pos + 2] === 0x00 &&
            this.buffer[pos + 3] === 0x01) {
            return 4;
        }
        return 3;
    }

    /**
     * Parse NAL unit header and data
     */
    private parseNALUnit(data: Buffer): NALUnit | null {
        if (data.length === 0) {
            return null;
        }

        const header = data[0];
        const nalType = header & 0x1F; // Bits 0-4

        // NAL unit types (H.264):
        // 1 = Non-IDR slice
        // 5 = IDR slice (keyframe)
        // 6 = SEI
        // 7 = SPS
        // 8 = PPS
        // 9 = Access unit delimiter

        const isKeyframe = nalType === 5; // IDR slice

        return {
            type: nalType,
            data: data,
            isKeyframe: isKeyframe
        };
    }

    /**
     * Clear buffer
     */
    clear(): void {
        this.buffer = Buffer.alloc(0);
    }

    /**
     * Get NAL unit type name (for debugging)
     */
    static getNALTypeName(type: number): string {
        const types: { [key: number]: string } = {
            1: 'Non-IDR Slice',
            2: 'Slice Data Partition A',
            3: 'Slice Data Partition B',
            4: 'Slice Data Partition C',
            5: 'IDR Slice (Keyframe)',
            6: 'SEI',
            7: 'SPS',
            8: 'PPS',
            9: 'Access Unit Delimiter',
            10: 'End of Sequence',
            11: 'End of Stream',
            12: 'Filler Data'
        };

        return types[type] || `Unknown (${type})`;
    }
}
