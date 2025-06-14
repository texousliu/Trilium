import rootPackageJson from '../../../../package.json';

type App = "desktop" | "server";

export type Architecture = 'x64' | 'arm64';

export type Platform = 'macos' | 'windows' | 'linux';

let version = rootPackageJson.version;

export function buildDesktopDownloadUrl(platform: Platform, format: string, architecture: Architecture): string {
    return `https://github.com/TriliumNext/Notes/releases/download/${version}/TriliumNextNotes-${version}-${platform}-${architecture}.${format}`;
}

export interface DownloadInfo {
    recommended?: boolean;
    name: string;
}

export interface DownloadMatrixEntry {
    title: Record<Architecture, string> | string;
    description: Record<Architecture, string> | string;
    downloads: Record<string, DownloadInfo>;
}

type DownloadMatrix = Record<App, Record<Platform, DownloadMatrixEntry>>;

// Keep compatibility info inline with https://github.com/electron/electron/blob/main/README.md#platform-support.
export const downloadMatrix: DownloadMatrix = {
    desktop: {
        windows: {
            title: {
                x64: "Windows 64-bit",
                arm64: "Windows on ARM"
            },
            description: {
                x64: "Compatible with Intel or AMD devices running Windows 10 and 11.",
                arm64: "Compatible with ARM devices (e.g. with Qualcomm Snapdragon).",
            },
            downloads: {
                exe: {
                    recommended: true,
                    name: "Download Installer (.exe)"
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
            description: {
                x64: "For most Linux distributions, compatible with x86_64 architecture.",
                arm64: "For ARM-based Linux distributions, compatible with aarch64 architecture.",
            },
            downloads: {
                deb: {
                    recommended: true,
                    name: "Download .deb"
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
            description: {
                x64: "For Intel-based Macs running macOS Big Sur or later.",
                arm64: "For Apple Silicon Macs such as those with M1 and M2 chips.",
            },
            downloads: {
                dmg: {
                    recommended: true,
                    name: "Download Installer (.dmg)"
                },
                zip: {
                    name: "Portable (.zip)"
                }
            }
        }
    },
    server: {
        linux: {
            title: "Self-hosted (Linux)",
            description: "Deploy Trilium Notes on your own server or VPS, compatible with most Linux distributions.",
            downloads: {
                docker: {
                    recommended: true,
                    name: "View on Docker Hub"
                },
                tarX64: {
                    name: "x86 (.tar.xz)"
                },
                tarArm64: {
                    name: "ARM (.tar.xz)"
                },
            }
        },
        pikapod: {
            title: "Paid hosting",
            description: "Trilium Notes hosted on PikaPods, a paid service for easy access and management.",
            downloads: {
                pikapod: {
                    recommended: true,
                    name: "Set up on PikaPods"
                },
                triliumcc: {
                    name: "Alternatively see trilium.cc"
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
