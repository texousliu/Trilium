<script lang="ts">
    import type { Platform } from "$lib/download-helper";
    import { buildDesktopDownloadUrl, downloadMatrix, getArchitecture } from "$lib/download-helper";

    let architectures = ["x64", "arm64"];
    let architecture = getArchitecture();
</script>

<div class="bg-gray-50 py-20">
    <section class="max-w-6xl mx-auto px-4">
        <h2 class="text-4xl font-bold text-center text-gray-900 mb-12">Download the desktop application</h2>
    
        <!-- Architecture pill selector -->
        <div class="col-span-3 flex justify-center items-center gap-3 mb-6">
            <span class="text-gray-600 font-medium mr-2">Architecture:</span>
            <div class="inline-flex bg-violet-100 rounded-full shadow p-1">
                {#each architectures as arch}            
                    <button class="py-2 px-6 rounded-full font-semibold focus:outline-none transition
                        text-violet-700 border-violet-700
                        aria-pressed:bg-violet-700 aria-pressed:text-violet-100
                        " aria-pressed={architecture === arch} on:click={() => architecture = arch}>
                        {arch}
                    </button>
                {/each}
            </div>
        </div>
    
        <div class="grid md:grid-cols-3 gap-10">
            {#each Object.entries(downloadMatrix.desktop) as [platformId, platform]}
            {@const recommended = Object.entries(platform.downloads).find((e) => e[1].recommended)}
            {@const textColor = (platformId === "windows" ? "text-blue-600" : platformId === "linux" ? "text-violet-600" : "text-gray-800")}
            {@const bgColor = (platformId === "windows" ? "bg-blue-600" : platformId === "linux" ? "bg-violet-600" : "bg-gray-800")}
            {@const hoverColor = (platformId === "windows" ? "hover:bg-blue-700" : platformId === "linux" ? "hover:bg-violet-700" : "hover:bg-gray-900")}
            
            <div class="bg-white border border-gray-200 rounded-2xl shadow-lg p-8 flex flex-col items-start">
                <h3 class="text-2xl font-semibold {textColor} mb-2">{platform.title[architecture]}</h3>
                <p class="text-gray-700 mb-12">{platform.description}</p>                
                <div class="space-y-2 mt-auto w-full">
                    {#if recommended}
                        <a href={buildDesktopDownloadUrl(platformId as Platform, recommended[0], architecture)} class="mt-auto block text-center {bgColor} {hoverColor} text-white font-medium py-2 px-5 rounded-full shadow transition">
                            Download {recommended[1].name}
                        </a>
                    {/if}
                    <div class="flex justify-center gap-4 text-sm {textColor} mt-2">
                        {#each Object.entries(platform.downloads).filter((e) => !e[1].recommended) as [format, download]}
                            <a href={buildDesktopDownloadUrl(platformId as Platform, format, architecture)} class="hover:underline block">
                                {download.name}
                            </a>
                        {/each}
                    </div>
                </div>
            </div>
            {/each}
        </div>
    </section>

    <section class="mt-20 max-w-5xl mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">Server</h2>
        <div class="grid md:grid-cols-2 gap-10 justify-center">
            <div class="bg-white rounded-xl shadow overflow-hidden">
                <div class="p-6">
                    <h3 class="text-xl font-semibold mb-2">Docker (recommended)</h3>
                    <div class="flex flex-wrap gap-2">
                        <a class="py-2 px-5 border-1 border-gray-500 text-gray-500 font-semibold rounded-full shadow-md grow" href="#">
                            DockerHub
                        </a>

                        <a class="py-2 px-5 border-1 border-gray-500 text-gray-500 font-semibold rounded-full shadow-md grow" href="https://github.com/TriliumNext/Notes/pkgs/container/notes">
                            ghcr.io
                        </a>                    
                    </div>

                    <a href="#" class="block mt-4">See documentation</a>
                </div>            
            </div>

            <div class="bg-white rounded-xl shadow overflow-hidden">
                <div class="p-6">
                    <h3 class="text-xl font-semibold mb-2">Linux</h3>
                    <div class="flex flex-wrap gap-y-2">
                        <a class="py-2 px-5 border-1 border-gray-500 text-gray-500 font-semibold rounded-full shadow-md grow" href="#">
                            Portable for x86 devices (.tar.xz)
                        </a>
                        <a class="py-2 px-5 border-1 border-gray-500 text-gray-500 font-semibold rounded-full shadow-md grow" href="#">
                            Portable for ARM devices (.tar.xz)
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>

</div>
