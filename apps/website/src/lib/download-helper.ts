function getArchitecture() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('x86_64') || userAgent.includes('x64') || userAgent.includes('amd64')) {
        return 'x64';
    } else if (userAgent.includes('arm64') || userAgent.includes('aarch64')) {
        return 'arm64';
    }
}

function getPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('macintosh') || userAgent.includes('mac os x')) {
        return "mac";
    } else if (userAgent.includes('windows') || userAgent.includes('win32')) {
        return "windows";
    } else {
        return "linux";
    }
}

function getDownloadLink(platform: string, architecture: string) {
    const baseUrl = 'https://example.com/downloads';
    let url;
    if (platform === 'mac') {
        url = `${baseUrl}/mac-${architecture}.dmg`;
    } else if (platform === 'windows') {
        url = `${baseUrl}/windows-${architecture}.exe`;
    } else if (platform === 'linux') {
        url = `${baseUrl}/linux-${architecture}.tar.gz`;
    } else {
        url = `${baseUrl}/other-${architecture}.zip`;
    }

    return {
        url: url,
        platform: platform,
        architecture: architecture
    };
}

export function getRecommendedDownload() {
    const architecture = getArchitecture();
    const platform = getPlatform();
    console.log(`Detected platform: ${platform}, architecture: ${architecture}`);
    if (!architecture || !platform) {
        return null;
    }
    return getDownloadLink(platform, architecture);
}
