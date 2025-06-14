<section class="mt-20 max-w-6xl mx-auto px-4">
    <h2 class="text-3xl font-bold text-center mb-12">Desktop application</h2>

    <div class="grid md:grid-cols-3 gap-10">
        <!-- Architecture pill selector -->
        <div class="col-span-3 flex justify-center items-center gap-3">
            <span class="text-gray-600 font-medium mr-2">Architecture:</span>
            <div class="inline-flex bg-violet-100 rounded-full shadow p-1">
                <button class="py-2 px-6 rounded-full font-semibold focus:outline-none transition
                    text-violet-100 bg-violet-700 shadow
                    aria-pressed:bg-violet-700 aria-pressed:text-violet-100
                    " aria-pressed="true">
                    x86
                </button>
                <button class="py-2 px-6 rounded-full font-semibold focus:outline-none transition
                    text-violet-700 bg-transparent hover:bg-violet-200
                    " aria-pressed="false">
                    ARM
                </button>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow overflow-hidden">
            <div class="p-6">
                <h3 class="text-xl font-semibold mb-2">Windows</h3>
                
                <div class="flex flex-wrap gap-y-2">
                    <a class="py-2 px-5 bg-violet-600 text-white font-semibold rounded-full shadow-md hover:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-400 focus:ring-opacity-75 grow" href="#">
                        Installer (.exe)
                        <span class="text-sm text-gray-300 ml-2">Recommended</span>
                    </a>

                    <a class="py-2 px-5 border-1 border-gray-500 text-gray-500 font-semibold rounded-full shadow-md grow" href="#">
                        Portable (.zip)
                    </a>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow overflow-hidden">
            <div class="p-6">
                <h3 class="text-xl font-semibold mb-2">Linux</h3>

                <div class="flex flex-wrap gap-y-2">                    
                    <a class="py-2 px-5 border-1 border-gray-500 text-gray-500 font-semibold rounded-full shadow-md grow" href="#">
                        Debian-based distributions (.deb)
                    </a>

                    <a class="py-2 px-5 border-1 border-gray-500 text-gray-500 font-semibold rounded-full shadow-md grow" href="#">
                        Red Hat-based distributions (.rpm)
                    </a>

                    <a class="py-2 px-5 border-1 border-gray-500 text-gray-500 font-semibold rounded-full shadow-md grow" href="#">
                        Flatpak (.flatpak)
                    </a>

                    <a class="py-2 px-5 border-1 border-gray-500 text-gray-500 font-semibold rounded-full shadow-md grow" href="#">
                        Portable (.zip)
                    </a>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow overflow-hidden">
            <div class="p-6">
                <h3 class="text-xl font-semibold mb-2">macOS</h3>

                <div class="flex flex-wrap gap-y-2">
                    <a class="py-2 px-5 bg-violet-600 text-white font-semibold rounded-full shadow-md hover:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-400 focus:ring-opacity-75 grow" href="#">
                        Disk image (.dmg)
                        <span class="text-sm text-gray-300 ml-2">Recommended</span>
                    </a>

                    <a class="py-2 px-5 border-1 border-gray-500 text-gray-500 font-semibold rounded-full shadow-md grow" href="#">
                        Portable (.zip)
                    </a>
                </div>
            </div>
        </div>
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
