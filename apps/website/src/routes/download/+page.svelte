<script>
    import { downloadMatrix, getArchitecture } from "$lib/download-helper";

    let architecture = getArchitecture();
</script>

<section class="mt-20 max-w-6xl mx-auto px-4">
    <h2 class="text-3xl font-bold text-center mb-12">Desktop application</h2>

    <!-- Architecture pill selector -->
    <div class="col-span-3 flex justify-center items-center gap-3 mb-6">
        <span class="text-gray-600 font-medium mr-2">Architecture:</span>
        <div class="inline-flex bg-violet-100 rounded-full shadow p-1">
            {#each ["x64", "arm64"] as arch}            
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
        {#each Object.values(downloadMatrix.desktop) as platform}
        <div class="bg-white rounded-xl shadow overflow-hidden">
            <div class="p-6">
                <h3 class="text-xl font-semibold mb-2">{platform.title} ({architecture})</h3>
                <div class="flex flex-wrap gap-y-2">
                    {#each Object.values(platform.downloads) as download}
                        <a href={download[architecture]} class={
                            download.recommended
                            ? "py-2 px-5 bg-violet-600 text-white font-semibold rounded-full shadow-md hover:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-400 focus:ring-opacity-75 grow"
                            : "py-2 px-5 border-1 border-gray-500 text-gray-500 font-semibold rounded-full shadow-md grow"
                            }>
                            {download.name}
                            {#if download.recommended}
                            <span class="text-sm text-gray-300 ml-2">Recommended</span>
                            {/if}
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
