export type Architecture = 'x64' | 'arm64';

type Platform = 'mac' | 'windows' | 'linux';

type Apps = 'desktop';

export const downloadMatrix = {
    desktop: {
        windows: {
            title: "Windows",
            downloads: {
                exe: {
                    recommended: true,
                    name: "Installer (.exe)",
                    x64: "https://github.com/TriliumNext/Notes/releases/download/nightly/TriliumNextNotes-develop-windows-x64.exe",
                    arm64: "https://github.com/TriliumNext/Notes/releases/download/nightly/TriliumNextNotes-develop-windows-arm64.exe"
                },
                zip: {
                    name: "Portable (.zip)",
                    x64: "https://github.com/TriliumNext/Notes/releases/download/nightly/TriliumNextNotes-develop-windows-x64.zip",
                    arm64: "https://github.com/TriliumNext/Notes/releases/download/nightly/TriliumNextNotes-develop-windows-arm64.zip"
                }
            }
        },
        linux: {
            title: "Linux",
            downloads: {
                deb: {
                    name: "Debian/Ubuntu (.deb)",
                    x64: "https://github.com/TriliumNext/Notes/releases/download/nightly/TriliumNextNotes-develop-linux-x64.deb",
                    arm64: "https://github.com/TriliumNext/Notes/releases/download/nightly/TriliumNextNotes-develop-linux-arm64.deb"
                },
                rpm: {
                    name: "Red Hat-based distributions (.rpm)",
                    x64: "https://github.com/TriliumNext/Notes/releases/download/nightly/TriliumNextNotes-develop-linux-x64.rpm",
                    arm64: "https://github.com/TriliumNext/Notes/releases/download/nightly/TriliumNextNotes-develop-linux-arm64.rpm"
                },
                flatpak: {
                    name: "Flatpak (.flatpak)",
                    x64: "https://github.com/TriliumNext/Notes/releases/download/nightly/TriliumNextNotes-develop-linux-x64.flatpak",
                    arm64: "https://github.com/TriliumNext/Notes/releases/download/nightly/TriliumNextNotes-develop-linux-arm64.flatpak"
                },
                zip: {
                    name: "Portable (.zip)",
                    x64: "https://github.com/TriliumNext/Notes/releases/download/nightly/TriliumNextNotes-develop-linux-x64.zip",
                    arm64: "https://github.com/TriliumNext/Notes/releases/download/nightly/TriliumNextNotes-develop-linux-arm64.zip"
                }
            }
        },
        mac: {
            title: "macOS",
            downloads: {
                dmg: {
                    recommended: true,
                    name: "Installer (.dmg)",
                    x64: "https://github.com/TriliumNext/Notes/releases/download/nightly/TriliumNextNotes-develop-macos-x64.dmg",
                    arm64: "https://github.com/TriliumNext/Notes/releases/download/nightly/TriliumNextNotes-develop-macos-arm64.dmg"
                },
                zip: {
                    name: "Portable (.zip)",
                    x64: "https://github.com/TriliumNext/Notes/releases/download/nightly/TriliumNextNotes-develop-macos-x64.zip",
                    arm64: "https://github.com/TriliumNext/Notes/releases/download/nightly/TriliumNextNotes-develop-macos-arm64.zip"
                }
            }
        }
    }
};

function getArchitecture(): Architecture {
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
