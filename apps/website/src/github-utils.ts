const API_URL = "https://api.github.com/repos/TriliumNext/Trilium";

/** Returns the number of stargazers of the Trilium's GitHub repository. */
export async function getRepoStargazersCount() {
	const response = await fetch(API_URL);
	
	if (response.ok) {
		const details = await response.json();
		if ("stargazers_count" in details) {
			return details["stargazers_count"];
		}
	}

	return 31862; // The count as of 2025-10-03
}