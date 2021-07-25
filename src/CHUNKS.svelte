<script>
    import { sentGenerator } from './robo_utils.js';
    import { introPara } from './robo_intro.js';
    import ColChart from "./chart/ColChart.svelte";
	import SpineChart from "./chart/SpineChart.svelte";
    import GridChart from "./chart/GridChart.svelte";
    import { getData, suffixer } from "./utils";
    import { urls, types, codes, mapSources, mapLayers, mapPaint } from "./config";


    
    export let place;
    export let quartiles;
    export let ew;

    function makeData(props) {
		let code = props[0];
		let val = props[1];
		let year = props[2];
		
		let source = place.data[code][val][year];
		let sourceEW = ew.data[code][val][year];

		let keys = codes[code].map(d => d.code);
		let labels = codes[code].map(d => d.label ? d.label : d.code);
		let data = keys.map((key, i) => {
			return {x: labels[i], y: source[key], ew: sourceEW[key]};
		});
		return data;
    }
    
</script>

<h3>Little sentences/chunks of text for area profiles.</h3>

<div style="padding-left: 15%; padding-right: 15%;">
    <p>
        {introPara(place)}
    </p>
</div>

<div class="profile-grid mt">

    <div>
        <span class="text-label">Population</span>
        <br/>
        <span class="text-big">{place.data.population.value['2011'].all.toLocaleString()}</span>
        <span class="text-change" class:increase="{place.data.population.value.change.all > 0}">{place.data.population.value.change.all}%</span>
        {#if quartiles}
        <div class="chart" style="height: 40px;">
            <SpineChart data="{[{x: place.data.population.value['2011'].all}]}" ticks="{quartiles.population.value['2011'].all}" formatTick="{d => (d / 1000).toFixed(0)}" suffix="k" scale="sqrt"/>
        </div>
        {/if}
        {#if place.data.population.value_rank}
        <div class="text-small muted">{place.data.population.value_rank['2011'].all.toLocaleString()}{suffixer(place.data.population.value_rank['2011'].all)} most populous of {place.count.toLocaleString()} UK {types[place.type].pl.toLowerCase()}</div>
        {/if}
    </div>

    <div>
        <p>{sentGenerator(place, ["data", "population", "value_rank_local"], 0)}</p>
    </div>

    <div>
        <span class="text-label">Density</span>
        <br/>
        <span class="text-big">{place.data.density.value['2011'].all.toFixed(1)}</span>
        <span>people per hectare</span>
        {#if quartiles}
        <div class="chart" style="height: 40px;">
            <SpineChart data="{[{x: place.data.density.value['2011'].all}]}" ticks="{quartiles.density.value['2011'].all}" formatTick="{d => d.toFixed(0)}" scale="sqrt"/>
        </div>
        {/if}
        {#if place.data.density.value_rank}
        <div class="text-small muted">{place.data.density.value_rank['2011'].all.toLocaleString()}{suffixer(place.data.density.value_rank['2011'].all)} densest of {place.count.toLocaleString()} UK {types[place.type].pl.toLowerCase()}</div>
        {/if}
    </div>


    <div>
        <p>{sentGenerator(place, ["data", "density", "value_rank_local"], 0)}</p>
    </div>

    <div>
        <span class="text-label">Median Age</span>
        <br/>
        <span class="text-big">{place.data.agemed.value['2011'].all}</span>
        <span class="text-change" class:increase="{place.data.agemed.value['2011'].all - place.data.agemed.value['2001'].all > 0}">{place.data.agemed.value['2011'].all - place.data.agemed.value['2001'].all} yrs</span>
        {#if quartiles}
        <div class="chart" style="height: 40px;">
            <SpineChart data="{[{x: place.data.agemed.value['2011'].all}]}" ticks="{quartiles.agemed.value['2011'].all}" formatTick="{d => d.toFixed(0)}" scale="log"/>
        </div>
        {/if}
        {#if place.data.agemed.value_rank}
        <div class="text-small muted">{place.data.agemed.value_rank['2011'].all.toLocaleString()}{suffixer(place.data.agemed.value_rank['2011'].all)} oldest of {place.count.toLocaleString()} UK {types[place.type].pl.toLowerCase()}</div>
        {/if}
    </div>

    <div>
        <p>{sentGenerator(place, ["data", "agemed", "value_rank_local"], 0)}</p>
    </div>

    <div>
        <span class="text-label">Age profile</span><br/>
        <div class="chart" style="height: 85px;">
            <ColChart data="{place && makeData(['age10yr', 'perc', '2011'])}"/>
        </div>
    </div>

    <div>
        <p>{sentGenerator(place, ["data", "age10yr", "perc_rank_local"], 0)}</p>
    </div>

    <div>
        <span class="text-label">General health</span><br/>
        <GridChart data="{place && makeData(['health', 'perc', '2011'])}"/>
    </div>

    <div>
        <p>{sentGenerator(place, ["data", "health", "perc_rank_local"], 0)}</p>
    </div>

    <div>
        <span class="text-label">Economic activity</span><br/>
        <GridChart data="{place && makeData(['economic', 'perc', '2011'])}"/>
    </div>

    <div>
        <p>{sentGenerator(place, ["data", "economic", "perc_rank_local"], 0)}</p>
    </div>

    <div>
        <span class="text-label">Ethnicity</span><br/>
        <GridChart data="{place && makeData(['ethnicity', 'perc', '2011'])}"/>
    </div>

    <div>
        <p>{sentGenerator(place, ["data", "ethnicity", "perc_rank_local"], 0)}</p>
    </div>

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