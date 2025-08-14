/**
 * EXIF Data Viewer Module for Trilium Notes
 * Extracts and displays EXIF metadata from images
 */

/**
 * EXIF data structure
 */
export interface ExifData {
    // Image information
    make?: string;
    model?: string;
    software?: string;
    dateTime?: Date;
    dateTimeOriginal?: Date;
    dateTimeDigitized?: Date;
    
    // Camera settings
    exposureTime?: string;
    fNumber?: number;
    exposureProgram?: string;
    iso?: number;
    shutterSpeedValue?: string;
    apertureValue?: number;
    brightnessValue?: number;
    exposureBiasValue?: number;
    maxApertureValue?: number;
    meteringMode?: string;
    flash?: string;
    focalLength?: number;
    focalLengthIn35mm?: number;
    
    // Image properties
    imageWidth?: number;
    imageHeight?: number;
    orientation?: number;
    xResolution?: number;
    yResolution?: number;
    resolutionUnit?: string;
    colorSpace?: string;
    whiteBalance?: string;
    
    // GPS information
    gpsLatitude?: number;
    gpsLongitude?: number;
    gpsAltitude?: number;
    gpsTimestamp?: Date;
    gpsSpeed?: number;
    gpsDirection?: number;
    
    // Other metadata
    artist?: string;
    copyright?: string;
    userComment?: string;
    imageDescription?: string;
    lensModel?: string;
    lensMake?: string;
    
    // Raw data
    raw?: Record<string, any>;
}

/**
 * EXIF tag definitions
 */
const EXIF_TAGS: Record<number, string> = {
    0x010F: 'make',
    0x0110: 'model',
    0x0131: 'software',
    0x0132: 'dateTime',
    0x829A: 'exposureTime',
    0x829D: 'fNumber',
    0x8822: 'exposureProgram',
    0x8827: 'iso',
    0x9003: 'dateTimeOriginal',
    0x9004: 'dateTimeDigitized',
    0x9201: 'shutterSpeedValue',
    0x9202: 'apertureValue',
    0x9203: 'brightnessValue',
    0x9204: 'exposureBiasValue',
    0x9205: 'maxApertureValue',
    0x9207: 'meteringMode',
    0x9209: 'flash',
    0x920A: 'focalLength',
    0xA002: 'imageWidth',
    0xA003: 'imageHeight',
    0x0112: 'orientation',
    0x011A: 'xResolution',
    0x011B: 'yResolution',
    0x0128: 'resolutionUnit',
    0xA001: 'colorSpace',
    0xA403: 'whiteBalance',
    0x8298: 'copyright',
    0x013B: 'artist',
    0x9286: 'userComment',
    0x010E: 'imageDescription',
    0xA434: 'lensModel',
    0xA433: 'lensMake',
    0xA432: 'focalLengthIn35mm'
};

/**
 * GPS tag definitions
 */
const GPS_TAGS: Record<number, string> = {
    0x0001: 'gpsLatitudeRef',
    0x0002: 'gpsLatitude',
    0x0003: 'gpsLongitudeRef',
    0x0004: 'gpsLongitude',
    0x0005: 'gpsAltitudeRef',
    0x0006: 'gpsAltitude',
    0x0007: 'gpsTimestamp',
    0x000D: 'gpsSpeed',
    0x0010: 'gpsDirection'
};

/**
 * ImageExifService extracts and manages EXIF metadata from images
 */
class ImageExifService {
    private static instance: ImageExifService;
    private exifCache: Map<string, ExifData> = new Map();
    private cacheOrder: string[] = []; // Track cache insertion order for LRU
    private readonly MAX_CACHE_SIZE = 50; // Maximum number of cached entries
    private readonly MAX_BUFFER_SIZE = 100 * 1024 * 1024; // 100MB max buffer size

    private constructor() {}

    static getInstance(): ImageExifService {
        if (!ImageExifService.instance) {
            ImageExifService.instance = new ImageExifService();
        }
        return ImageExifService.instance;
    }

    /**
     * Extract EXIF data from image URL or file
     */
    async extractExifData(source: string | File | Blob): Promise<ExifData | null> {
        try {
            // Check cache if URL
            if (typeof source === 'string' && this.exifCache.has(source)) {
                // Move to end for LRU
                this.updateCacheOrder(source);
                return this.exifCache.get(source)!;
            }

            // Get array buffer with size validation
            const buffer = await this.getArrayBuffer(source);
            
            // Validate buffer size
            if (buffer.byteLength > this.MAX_BUFFER_SIZE) {
                console.error('Buffer size exceeds maximum allowed size');
                return null;
            }
            
            // Parse EXIF data
            const exifData = this.parseExifData(buffer);
            
            // Cache if URL with LRU eviction
            if (typeof source === 'string' && exifData) {
                this.addToCache(source, exifData);
            }
            
            return exifData;
        } catch (error) {
            console.error('Failed to extract EXIF data:', error);
            return null;
        }
    }

    /**
     * Get array buffer from various sources
     */
    private async getArrayBuffer(source: string | File | Blob): Promise<ArrayBuffer> {
        if (source instanceof File || source instanceof Blob) {
            return source.arrayBuffer();
        } else {
            const response = await fetch(source);
            return response.arrayBuffer();
        }
    }

    /**
     * Parse EXIF data from array buffer
     */
    private parseExifData(buffer: ArrayBuffer): ExifData | null {
        const dataView = new DataView(buffer);
        
        // Check for JPEG SOI marker
        if (dataView.getUint16(0) !== 0xFFD8) {
            return null; // Not a JPEG
        }

        // Find APP1 marker (EXIF)
        let offset = 2;
        let marker;
        
        while (offset < dataView.byteLength) {
            marker = dataView.getUint16(offset);
            
            if (marker === 0xFFE1) {
                // Found EXIF marker
                return this.parseExifSegment(dataView, offset + 2);
            }
            
            if ((marker & 0xFF00) !== 0xFF00) {
                break; // Invalid marker
            }
            
            offset += 2 + dataView.getUint16(offset + 2);
        }
        
        return null;
    }

    /**
     * Parse EXIF segment with bounds checking
     */
    private parseExifSegment(dataView: DataView, offset: number): ExifData | null {
        // Bounds check
        if (offset + 2 > dataView.byteLength) {
            console.error('Invalid offset for EXIF segment');
            return null;
        }
        
        const length = dataView.getUint16(offset);
        
        // Validate segment length
        if (offset + length > dataView.byteLength) {
            console.error('EXIF segment length exceeds buffer size');
            return null;
        }
        
        // Check for "Exif\0\0" identifier with bounds check
        if (offset + 6 > dataView.byteLength) {
            console.error('Invalid EXIF header offset');
            return null;
        }
        
        const exifHeader = String.fromCharCode(
            dataView.getUint8(offset + 2),
            dataView.getUint8(offset + 3),
            dataView.getUint8(offset + 4),
            dataView.getUint8(offset + 5)
        );
        
        if (exifHeader !== 'Exif') {
            return null;
        }
        
        // TIFF header offset
        const tiffOffset = offset + 8;
        
        // Check byte order
        const byteOrder = dataView.getUint16(tiffOffset);
        const littleEndian = byteOrder === 0x4949; // 'II' for Intel
        
        if (byteOrder !== 0x4949 && byteOrder !== 0x4D4D) {
            return null; // Invalid byte order
        }
        
        // Parse IFD
        const ifdOffset = this.getUint32(dataView, tiffOffset + 4, littleEndian);
        const exifData = this.parseIFD(dataView, tiffOffset, tiffOffset + ifdOffset, littleEndian);
        
        // Parse GPS data if available
        if (exifData.raw?.gpsIFDPointer) {
            const gpsData = this.parseGPSIFD(
                dataView,
                tiffOffset,
                tiffOffset + exifData.raw.gpsIFDPointer,
                littleEndian
            );
            Object.assign(exifData, gpsData);
        }
        
        return this.formatExifData(exifData);
    }

    /**
     * Parse IFD (Image File Directory) with bounds checking
     */
    private parseIFD(
        dataView: DataView,
        tiffOffset: number,
        ifdOffset: number,
        littleEndian: boolean
    ): ExifData {
        // Bounds check for IFD offset
        if (ifdOffset + 2 > dataView.byteLength) {
            console.error('Invalid IFD offset');
            return { raw: {} };
        }
        
        const numEntries = this.getUint16(dataView, ifdOffset, littleEndian);
        
        // Validate number of entries
        if (numEntries > 1000) { // Reasonable limit
            console.error('Too many IFD entries');
            return { raw: {} };
        }
        
        const data: ExifData = { raw: {} };
        
        for (let i = 0; i < numEntries; i++) {
            const entryOffset = ifdOffset + 2 + (i * 12);
            
            // Bounds check for entry
            if (entryOffset + 12 > dataView.byteLength) {
                console.warn('IFD entry exceeds buffer bounds');
                break;
            }
            
            const tag = this.getUint16(dataView, entryOffset, littleEndian);
            const type = this.getUint16(dataView, entryOffset + 2, littleEndian);
            const count = this.getUint32(dataView, entryOffset + 4, littleEndian);
            const valueOffset = entryOffset + 8;
            
            const value = this.getTagValue(
                dataView,
                tiffOffset,
                type,
                count,
                valueOffset,
                littleEndian
            );
            
            const tagName = EXIF_TAGS[tag];
            if (tagName) {
                (data as any)[tagName] = value;
            }
            
            // Store raw value
            data.raw![tag] = value;
            
            // Check for EXIF IFD pointer
            if (tag === 0x8769) {
                const exifIFDOffset = tiffOffset + value;
                const exifData = this.parseIFD(dataView, tiffOffset, exifIFDOffset, littleEndian);
                Object.assign(data, exifData);
            }
            
            // Store GPS IFD pointer
            if (tag === 0x8825) {
                data.raw!.gpsIFDPointer = value;
            }
        }
        
        return data;
    }

    /**
     * Parse GPS IFD
     */
    private parseGPSIFD(
        dataView: DataView,
        tiffOffset: number,
        ifdOffset: number,
        littleEndian: boolean
    ): Partial<ExifData> {
        const numEntries = this.getUint16(dataView, ifdOffset, littleEndian);
        const gpsData: any = {};
        
        for (let i = 0; i < numEntries; i++) {
            const entryOffset = ifdOffset + 2 + (i * 12);
            
            // Bounds check for entry
            if (entryOffset + 12 > dataView.byteLength) {
                console.warn('IFD entry exceeds buffer bounds');
                break;
            }
            
            const tag = this.getUint16(dataView, entryOffset, littleEndian);
            const type = this.getUint16(dataView, entryOffset + 2, littleEndian);
            const count = this.getUint32(dataView, entryOffset + 4, littleEndian);
            const valueOffset = entryOffset + 8;
            
            const value = this.getTagValue(
                dataView,
                tiffOffset,
                type,
                count,
                valueOffset,
                littleEndian
            );
            
            const tagName = GPS_TAGS[tag];
            if (tagName) {
                gpsData[tagName] = value;
            }
        }
        
        // Convert GPS coordinates
        const result: Partial<ExifData> = {};
        
        if (gpsData.gpsLatitude && gpsData.gpsLatitudeRef) {
            result.gpsLatitude = this.convertGPSCoordinate(
                gpsData.gpsLatitude,
                gpsData.gpsLatitudeRef
            );
        }
        
        if (gpsData.gpsLongitude && gpsData.gpsLongitudeRef) {
            result.gpsLongitude = this.convertGPSCoordinate(
                gpsData.gpsLongitude,
                gpsData.gpsLongitudeRef
            );
        }
        
        if (gpsData.gpsAltitude) {
            result.gpsAltitude = gpsData.gpsAltitude;
        }
        
        return result;
    }

    /**
     * Get tag value based on type
     */
    private getTagValue(
        dataView: DataView,
        tiffOffset: number,
        type: number,
        count: number,
        offset: number,
        littleEndian: boolean
    ): any {
        switch (type) {
            case 1: // BYTE
            case 7: // UNDEFINED
                if (count === 1) {
                    return dataView.getUint8(offset);
                }
                const bytes = [];
                for (let i = 0; i < count; i++) {
                    bytes.push(dataView.getUint8(offset + i));
                }
                return bytes;
                
            case 2: // ASCII
                const stringOffset = count > 4 
                    ? tiffOffset + this.getUint32(dataView, offset, littleEndian)
                    : offset;
                let str = '';
                for (let i = 0; i < count - 1; i++) {
                    const char = dataView.getUint8(stringOffset + i);
                    if (char === 0) break;
                    str += String.fromCharCode(char);
                }
                return str;
                
            case 3: // SHORT
                if (count === 1) {
                    return this.getUint16(dataView, offset, littleEndian);
                }
                const shorts = [];
                const shortOffset = count > 2
                    ? tiffOffset + this.getUint32(dataView, offset, littleEndian)
                    : offset;
                for (let i = 0; i < count; i++) {
                    shorts.push(this.getUint16(dataView, shortOffset + i * 2, littleEndian));
                }
                return shorts;
                
            case 4: // LONG
                if (count === 1) {
                    return this.getUint32(dataView, offset, littleEndian);
                }
                const longs = [];
                const longOffset = tiffOffset + this.getUint32(dataView, offset, littleEndian);
                for (let i = 0; i < count; i++) {
                    longs.push(this.getUint32(dataView, longOffset + i * 4, littleEndian));
                }
                return longs;
                
            case 5: // RATIONAL
                const ratOffset = tiffOffset + this.getUint32(dataView, offset, littleEndian);
                if (count === 1) {
                    const num = this.getUint32(dataView, ratOffset, littleEndian);
                    const den = this.getUint32(dataView, ratOffset + 4, littleEndian);
                    return den === 0 ? 0 : num / den;
                }
                const rationals = [];
                for (let i = 0; i < count; i++) {
                    const num = this.getUint32(dataView, ratOffset + i * 8, littleEndian);
                    const den = this.getUint32(dataView, ratOffset + i * 8 + 4, littleEndian);
                    rationals.push(den === 0 ? 0 : num / den);
                }
                return rationals;
                
            default:
                return null;
        }
    }

    /**
     * Convert GPS coordinate to decimal degrees
     */
    private convertGPSCoordinate(coord: number[], ref: string): number {
        if (!coord || coord.length !== 3) return 0;
        
        const degrees = coord[0];
        const minutes = coord[1];
        const seconds = coord[2];
        
        let decimal = degrees + minutes / 60 + seconds / 3600;
        
        if (ref === 'S' || ref === 'W') {
            decimal = -decimal;
        }
        
        return decimal;
    }

    /**
     * Format EXIF data for display
     */
    private formatExifData(data: ExifData): ExifData {
        const formatted: ExifData = { ...data };
        
        // Format dates
        if (formatted.dateTime) {
            formatted.dateTime = this.parseExifDate(formatted.dateTime as any);
        }
        if (formatted.dateTimeOriginal) {
            formatted.dateTimeOriginal = this.parseExifDate(formatted.dateTimeOriginal as any);
        }
        if (formatted.dateTimeDigitized) {
            formatted.dateTimeDigitized = this.parseExifDate(formatted.dateTimeDigitized as any);
        }
        
        // Format exposure time
        if (formatted.exposureTime) {
            const time = formatted.exposureTime as any;
            if (typeof time === 'number') {
                if (time < 1) {
                    formatted.exposureTime = `1/${Math.round(1 / time)}`;
                } else {
                    formatted.exposureTime = `${time}s`;
                }
            }
        }
        
        // Format exposure program
        if (formatted.exposureProgram) {
            const programs = [
                'Not defined',
                'Manual',
                'Normal program',
                'Aperture priority',
                'Shutter priority',
                'Creative program',
                'Action program',
                'Portrait mode',
                'Landscape mode'
            ];
            const index = formatted.exposureProgram as any;
            formatted.exposureProgram = programs[index] || 'Unknown';
        }
        
        // Format metering mode
        if (formatted.meteringMode) {
            const modes = [
                'Unknown',
                'Average',
                'Center-weighted average',
                'Spot',
                'Multi-spot',
                'Pattern',
                'Partial'
            ];
            const index = formatted.meteringMode as any;
            formatted.meteringMode = modes[index] || 'Unknown';
        }
        
        // Format flash
        if (formatted.flash !== undefined) {
            const flash = formatted.flash as any;
            formatted.flash = (flash & 1) ? 'Flash fired' : 'Flash did not fire';
        }
        
        return formatted;
    }

    /**
     * Parse EXIF date string
     */
    private parseExifDate(dateStr: string): Date {
        // EXIF date format: "YYYY:MM:DD HH:MM:SS"
        const parts = dateStr.split(' ');
        if (parts.length !== 2) return new Date(dateStr);
        
        const dateParts = parts[0].split(':');
        const timeParts = parts[1].split(':');
        
        if (dateParts.length !== 3 || timeParts.length !== 3) {
            return new Date(dateStr);
        }
        
        return new Date(
            parseInt(dateParts[0]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[2]),
            parseInt(timeParts[0]),
            parseInt(timeParts[1]),
            parseInt(timeParts[2])
        );
    }

    /**
     * Get uint16 with endianness and bounds checking
     */
    private getUint16(dataView: DataView, offset: number, littleEndian: boolean): number {
        if (offset + 2 > dataView.byteLength) {
            console.error('Uint16 read exceeds buffer bounds');
            return 0;
        }
        return dataView.getUint16(offset, littleEndian);
    }

    /**
     * Get uint32 with endianness and bounds checking
     */
    private getUint32(dataView: DataView, offset: number, littleEndian: boolean): number {
        if (offset + 4 > dataView.byteLength) {
            console.error('Uint32 read exceeds buffer bounds');
            return 0;
        }
        return dataView.getUint32(offset, littleEndian);
    }

    /**
     * Create EXIF display panel
     */
    createExifPanel(exifData: ExifData): HTMLElement {
        const panel = document.createElement('div');
        panel.className = 'exif-panel';
        panel.style.cssText = `
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            max-width: 400px;
            max-height: 500px;
            overflow-y: auto;
            font-size: 12px;
        `;

        const sections = [
            {
                title: 'Camera',
                fields: ['make', 'model', 'lensModel']
            },
            {
                title: 'Settings',
                fields: ['exposureTime', 'fNumber', 'iso', 'focalLength', 'exposureProgram', 'meteringMode', 'flash']
            },
            {
                title: 'Image',
                fields: ['imageWidth', 'imageHeight', 'orientation', 'colorSpace', 'whiteBalance']
            },
            {
                title: 'Date/Time',
                fields: ['dateTimeOriginal', 'dateTime']
            },
            {
                title: 'Location',
                fields: ['gpsLatitude', 'gpsLongitude', 'gpsAltitude']
            },
            {
                title: 'Other',
                fields: ['software', 'artist', 'copyright', 'imageDescription']
            }
        ];

        sections.forEach(section => {
            const hasData = section.fields.some(field => (exifData as any)[field]);
            if (!hasData) return;

            const sectionDiv = document.createElement('div');
            sectionDiv.style.marginBottom = '15px';
            
            const title = document.createElement('h4');
            // Use textContent for safe title insertion
            title.textContent = section.title;
            title.style.cssText = 'margin: 0 0 8px 0; color: #4CAF50;';
            title.setAttribute('aria-label', `Section: ${section.title}`);
            sectionDiv.appendChild(title);

            section.fields.forEach(field => {
                const value = (exifData as any)[field];
                if (!value) return;

                const row = document.createElement('div');
                row.style.cssText = 'display: flex; justify-content: space-between; margin: 4px 0;';
                
                const label = document.createElement('span');
                // Use textContent for safe text insertion
                label.textContent = this.formatFieldName(field) + ':';
                label.style.color = '#aaa';
                
                const val = document.createElement('span');
                // Use textContent for safe value insertion  
                val.textContent = this.formatFieldValue(field, value);
                val.style.textAlign = 'right';
                
                row.appendChild(label);
                row.appendChild(val);
                sectionDiv.appendChild(row);
            });

            panel.appendChild(sectionDiv);
        });

        // Add GPS map link if coordinates available
        if (exifData.gpsLatitude && exifData.gpsLongitude) {
            const mapLink = document.createElement('a');
            mapLink.href = `https://www.google.com/maps?q=${exifData.gpsLatitude},${exifData.gpsLongitude}`;
            mapLink.target = '_blank';
            mapLink.textContent = 'View on Map';
            mapLink.style.cssText = `
                display: inline-block;
                margin-top: 10px;
                padding: 8px 12px;
                background: #4CAF50;
                color: white;
                text-decoration: none;
                border-radius: 4px;
            `;
            panel.appendChild(mapLink);
        }

        return panel;
    }

    /**
     * Format field name for display
     */
    private formatFieldName(field: string): string {
        const names: Record<string, string> = {
            make: 'Camera Make',
            model: 'Camera Model',
            lensModel: 'Lens',
            exposureTime: 'Shutter Speed',
            fNumber: 'Aperture',
            iso: 'ISO',
            focalLength: 'Focal Length',
            exposureProgram: 'Mode',
            meteringMode: 'Metering',
            flash: 'Flash',
            imageWidth: 'Width',
            imageHeight: 'Height',
            orientation: 'Orientation',
            colorSpace: 'Color Space',
            whiteBalance: 'White Balance',
            dateTimeOriginal: 'Date Taken',
            dateTime: 'Date Modified',
            gpsLatitude: 'Latitude',
            gpsLongitude: 'Longitude',
            gpsAltitude: 'Altitude',
            software: 'Software',
            artist: 'Artist',
            copyright: 'Copyright',
            imageDescription: 'Description'
        };
        return names[field] || field;
    }

    /**
     * Format field value for display
     */
    private formatFieldValue(field: string, value: any): string {
        if (value instanceof Date) {
            return value.toLocaleString();
        }
        
        switch (field) {
            case 'fNumber':
                return `f/${value}`;
            case 'focalLength':
                return `${value}mm`;
            case 'gpsLatitude':
            case 'gpsLongitude':
                return value.toFixed(6) + '°';
            case 'gpsAltitude':
                return `${value.toFixed(1)}m`;
            case 'imageWidth':
            case 'imageHeight':
                return `${value}px`;
            default:
                return String(value);
        }
    }

    /**
     * Add to cache with LRU eviction
     */
    private addToCache(key: string, data: ExifData): void {
        // Remove from order if exists
        const existingIndex = this.cacheOrder.indexOf(key);
        if (existingIndex !== -1) {
            this.cacheOrder.splice(existingIndex, 1);
        }
        
        // Add to end
        this.cacheOrder.push(key);
        this.exifCache.set(key, data);
        
        // Evict oldest if over limit
        while (this.cacheOrder.length > this.MAX_CACHE_SIZE) {
            const oldestKey = this.cacheOrder.shift();
            if (oldestKey) {
                this.exifCache.delete(oldestKey);
            }
        }
    }
    
    /**
     * Update cache order for LRU
     */
    private updateCacheOrder(key: string): void {
        const index = this.cacheOrder.indexOf(key);
        if (index !== -1) {
            this.cacheOrder.splice(index, 1);
            this.cacheOrder.push(key);
        }
    }
    
    /**
     * Clear EXIF cache
     */
    clearCache(): void {
        this.exifCache.clear();
        this.cacheOrder = [];
    }
}

export default ImageExifService.getInstance();