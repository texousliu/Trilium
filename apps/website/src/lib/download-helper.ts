import rootPackageJson from '../../../../package.json';

export type Architecture = 'x64' | 'arm64';

export type Platform = 'mac' | 'windows' | 'linux';

let version = rootPackageJson.version;

export function buildDesktopDownloadUrl(platform: Platform, format: string, architecture: Architecture): string {
    return `https://github.com/TriliumNext/Notes/releases/download/${version}/TriliumNextNotes-${version}-${platform}-${architecture}.${format}`;
}

export const downloadMatrix = {
    desktop: {
        windows: {
            title: "Windows",
            downloads: {
                exe: {
                    recommended: true,
                    name: "Installer (.exe)"
                },
                zip: {
                    name: "Portable (.zip)"
                }
            }
        },
        linux: {
            title: "Linux",
            downloads: {
                deb: {
                    name: "Debian/Ubuntu (.deb)"
                },
                rpm: {
                    name: "Red Hat-based distributions (.rpm)"
                },
                flatpak: {
                    name: "Flatpak (.flatpak)"
                },
                zip: {
                    name: "Portable (.zip)"
                }
            }
        },
        macos: {
            title: "macOS",
            downloads: {
                dmg: {
                    recommended: true,
                    name: "Installer (.dmg)"
                },
                zip: {
                    name: "Portable (.zip)"
                }
            }
        }
    }
};

export function getArchitecture(): Architecture {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('arm64') || userAgent.includes('aarch64')) {
        return 'arm64';
    }

    return "x64";
}

function getPlatform(): Platform {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('macintosh') || userAgent.includes('mac os x')) {
        return "mac";
    } else if (userAgent.includes('windows') || userAgent.includes('win32')) {
        return "windows";
    } else {
        return "linux";
    }
}

function getDownloadLink(platform: Platform, architecture: Architecture) {
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
    return getDownloadLink(platform, architecture);
}
