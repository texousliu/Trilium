<script lang="ts">
	import '../app.css';
    import Header from './header.svelte';
	
	let { children } = $props();
</script>

<Header />

{@render children()}
