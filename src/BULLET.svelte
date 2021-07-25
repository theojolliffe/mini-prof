<script>
    import { bullGenerator } from './robo_bullet.js';

	export let place;
	
    // Find the highest rank that is change
	let bullDataSelect = [];
    for (let i=0; i<40; i++) {
        if ("change" == place['Priorities'][i]['label'].split("_")[2] & "female" != place['Priorities'][i]['label'].split("_")[3] & "male" != place['Priorities'][i]['label'].split("_")[3]) {
            // Less interested in these groups, this will be expanded into a more general rule for prioritising certain topics
            if (place['Priorities'][i]['label'].split("_")[0] == "age10yr" | place['Priorities'][i]['label'].split("_")[0] == "travel" | place['Priorities'][i]['label'].split("_")[0] == "tenure" | place['Priorities'][i]['label'].split("_")[0] == "density") {
                place['Priorities'][i].sqrt = place['Priorities'][i].sqrt + 5;
            }
            bullDataSelect.push(place['Priorities'][i])
        }
    }
    bullDataSelect.sort(function(a, b) {
        // Reorder the objects
        if (a.sqrt < b.sqrt) return -1;
        if (a.sqrt > b.sqrt) return 1;
        return 0;
    });
    bullDataSelect.sort(function(a, b) {
        // Select the highest abVal for equal change ranks
        if (a.sqrt == b.sqrt) {
            if (a.abVal < b.abVal) return 1;
            if (a.abVal > b.abVal) return -1;
        }
        return 0;
    });

</script>

<h3>Bullet point area summaries for local journalists.</h3>


<div class="section-2">

    <div>
        <h1>{place.name}</h1>
	</div>
	
	{#each bullGenerator(place, bullDataSelect, 0, 6) as bullet}

		<div>
			<p>{bullet.sent}</p>
		</div> 

	{/each}
    
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap');
	:global(body) {
		font-family: 'Open Sans', sans-serif;
		padding: 20px;
	}
	a {
		color: rgb(0, 60, 87);
	}
	img {
		width: 200px;
	}
	.text-big {
		font-size: 2em;
		font-weight: bold;
	}
	.text-small {
		font-size: 0.85em;
	}
	.text-label {
		font-weight: bold;
	}
	.text-change {
		color: red;
	}
	.muted {
		color: grey;
	}
	.increase {
		color: green;
	}
	.increase::before {
		content: "+";
	}
	.right {
		text-align: right;
	}
	.mt {
		margin-top: 20px;
	}
	.grid {
		display: grid;
		width: 100%;
		grid-gap: 20px;
		grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
		justify-content: stretch;
		grid-auto-flow: row dense;
	}
	.grid-2 {
		display: grid;
		width: 100%;
		grid-gap: 10px;
		grid-template-columns: auto auto;
	}
	.chart {
		width: 100%;
	}
	.map {
		grid-column: span 2;
		grid-row: span 2;
		min-height: 350px;
	}
	@media screen and (max-width:575px){
		.map {
			grid-column: span 1;
		}
	}

	.profile-grid {
		display: grid;
		width: 70%;
		grid-gap: 20px 5%;
		grid-template-columns: 50% 50%;
		justify-content: stretch;
		margin-left: auto;
	    margin-right: auto;
	}
	ul {
		list-style-image: url('data:image/svg+xml;base64,PHN2ZyBjbGFzcz0ibGF5ZXJjYWtlLWxheW91dC1zdmcgc3ZlbHRlLXU4NGQ4ZCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiA8Y2lyY2xlIGN4PSI4IiBjeT0iOCIgcj0iOCIgZmlsbD0iIzIwNjA5NSIgc3Ryb2tlLXdpZHRoPSIwIi8+Cjwvc3ZnPgo=');
		vertical-align: middle;
	}
	.profile-grid > div > p {
		text-align: justify;
		padding: 5%;
	}
	.section-2 {
		margin: auto;
		width: 60%;
		margin-top: 100px;
		margin-bottom: 100px;
	}
	.section-2 > div {
		margin-top: 60px;
	}
	</style>