<script>
    import { slide } from "svelte/transition";
    import { bullGenerator } from './robo_bullet.js';

    export let entry
    export let place

	let isOpen = false
    const toggle = () => isOpen = !isOpen
    

</script>
<style>
	button {border: none; background: none;display:block; color: inherit; cursor: pointer; margin: 0; padding-bottom: 0.5em; padding-top: 0.5em}

	svg { transition: transform 0.1s ease-in;
    }
    
    li {
        padding: 15px;
    }
	
	[aria-expanded=true] svg { transform: rotate(0.25turn); }
</style>
<button on:click={toggle} aria-expanded={isOpen}><svg style="tran"  width="12" height="12" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7"></path></svg> {entry} </button>
{#if isOpen}
<ul transition:slide={{ duration: 200 }}>

    {#each bullGenerator(place, 1, 7) as bullet}

        <li>{bullet.sent}</li>

    {/each}

</ul>
{/if}
