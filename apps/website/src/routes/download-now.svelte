<script>
    import { getRecommendedDownload } from "$lib/download-helper";

    let recommendedDownload = getRecommendedDownload();
</script>

{#if recommendedDownload}
    <a href="#" class="py-2 px-5 bg-violet-600 text-white font-semibold rounded-full shadow-md hover:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-400 focus:ring-opacity-75">
        Download now
        <span class="text-sm text-gray-300">
            ({recommendedDownload.platform} {recommendedDownload.architecture})
        </span>
    </a>
{/if}