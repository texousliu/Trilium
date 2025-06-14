import rootPackageJson from '../../../../package.json';

export type Architecture = 'x64' | 'arm64';

export type Platform = 'mac' | 'windows' | 'linux';

let version = rootPackageJson.version;

export function buildDesktopDownloadUrl(platform: Platform, format: string, architecture: Architecture): string {
    return `https://github.com/TriliumNext/Notes/releases/download/${version}/TriliumNextNotes-${version}-${platform}-${architecture}.${format}`;
}

// Keep compatibility info inline with https://github.com/electron/electron/blob/main/README.md#platform-support.
export const downloadMatrix = {
    desktop: {
        windows: {
            title: {
                x64: "Windows 64-bit",
                arm64: "Windows on ARM"
            },
            description: "Compatible with Windows 10 and 11.",
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
            title: {
                x64: "Linux 64-bit",
                arm64: "Linux on ARM"
            },
            description: "Runs on most major distributions.",
            downloads: {
                deb: {
                    recommended: true,
                    name: ".deb"
                },
                rpm: {
                    name: ".rpm"
                },
                flatpak: {
                    name: ".flatpak"
                },
                zip: {
                    name: "Portable (.zip)"
                }
            }
        },
        macos: {
            title: {
                x64: "macOS for Intel",
                arm64: "macOS for Apple Silicon"
            },
            description: "Works on macOS Big Sur and up.",
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
