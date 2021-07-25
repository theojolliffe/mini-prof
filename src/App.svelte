<script>
	import { getData, suffixer } from "./utils";
	import { urls, types, codes, mapSources, mapLayers, mapPaint } from "./config";
	import ColChart from "./chart/ColChart.svelte";
	import SpineChart from "./chart/SpineChart.svelte";
	import GridChart from "./chart/GridChart.svelte";
	import Select from "./ui/Select.svelte";
	import Warning from "./ui/Warning.svelte";
	import Map from "./map/Map.svelte";
	import MapSource from "./map/MapSource.svelte";
	import MapLayer from "./map/MapLayer.svelte";
	import { Tabs, TabList, TabPanel, Tab } from './tabs.js';
	import CHUNKS from './CHUNKS.svelte';
	import REPORT from './REPORT.svelte';
	import REPORT2 from './REPORT2.svelte';
	import BULLET from './BULLET.svelte';


	
	let options, selected, place, ew, quartiles;
	let map = null;
	let active = {
		selected: null,
		type: null,
		childType: null,
		highlighted: [],
		hovered:  null
	};
	
	getData(urls.options)
	.then(res => {
		res.forEach(d => {
			d.typepl = types[d.type].pl;
			d.typenm = types[d.type].name;
		});
		options = res.sort((a, b) => a.name.localeCompare(b.name));
		selected = options.find(d => d.name == 'Manchester');
		loadEW();
		loadArea(selected.code);
	});
	
	function loadArea(code) {
		fetch(urls.places + code + '.json')
		.then(res => res.json())
		.then(json => {
			json.children = options.filter(d => d.parent == code);
			json.siblings = options.filter(d => d.parent == json['parents'][0]['code']);
			
			if (json.count > 20) {
				fetch(urls.quantiles + json.type + '.json')
				.then(res => res.json())
				.then(quart => {
					quartiles = quart;
					place = json;
					updateActive(place);
					fitMap(place.bounds);
					console.log("Place", place)
					console.log("Priorities", place.Priorities)
				});
			} else {
				quartiles = null;
				place = json;
				updateActive(place);
				fitMap(place.bounds);
				console.log("Place", place)
			}
		});
	}

	function loadEW() {
		const code = 'K04000001';
		fetch(urls.places + code + '.json')
		.then(res => res.json())
		.then(json => {
			json.children = options.filter(d => d.parent == code);
			ew = json;
		});
	}

	function updateActive(place)  {
		let prev = JSON.parse(JSON.stringify(active));
		let code = place.code;
		let type = place.type;
		let siblings = options.filter(d => d.type == type && d.code != code).map(d => d.code);
		let children = place.children[0] ? place.children.map(d => d.code) : [];
		let childType = children[0] ? place.children[0].type : null;

		active.selected = code;
		active.type = type;
		active.childType = childType;
		active.highlighted = [...siblings, ...children];

		let keys = Object.keys(mapLayers);
		let fillProps = ['fill-color', 'fill-opacity'];
		let lineProps = ['line-color', 'line-width', 'line-opacity'];

		// Change layer visibility and paint properties if geography level changes
		if (map && active.type != prev.type) {
			// Reset map layer visibility properties
			keys.forEach(key => {
				map.setLayoutProperty(key + '-fill', 'visibility', 'none');
				map.setLayoutProperty(key + '-bounds', 'visibility', 'none');
				map.setLayoutProperty(key + '-self', 'visibility', 'none');
			});

			// Set new visibility and paint properties
			map.setLayoutProperty(type + '-fill', 'visibility', 'visible');
			map.setLayoutProperty(type + '-bounds', 'visibility', 'visible');
			map.setLayoutProperty(type + '-self', 'visibility', 'visible');
			lineProps.forEach(prop => map.setPaintProperty(type + '-self', prop, mapPaint['line-self'][prop]));
				
			if (place.parents[0]) {
				fillProps.forEach(prop => map.setPaintProperty(type + '-fill', prop, mapPaint[children[0] ? 'fill-active' : 'fill-self'][prop]));
				lineProps.forEach(prop => map.setPaintProperty(type + '-bounds', prop, mapPaint['line-active'][prop]));
			}
			if (childType) {
				map.setLayoutProperty(childType + '-fill', 'visibility', 'visible');
				map.setLayoutProperty(childType + '-bounds', 'visibility', 'visible');
				fillProps.forEach(prop => map.setPaintProperty(childType + '-fill', prop, mapPaint['fill-child'][prop]));
				lineProps.forEach(prop => map.setPaintProperty(childType + '-bounds', prop, mapPaint['line-child'][prop]));
			}
		}
	}
	function fitMap(bounds) {
		if (map) {
			map.fitBounds(bounds, {padding: 20});
		}
	}
	function mapSelect(ev) {
		selected = options.find(d => d.code == ev.detail.code);
		loadArea(selected.code);
	}
</script>

<Warning/>

{#if place && ew}
<div class="grid">
	<div class="text-small">
		{#if place.parents[0]}
		{#each [...place.parents].reverse() as parent, i}
		<a href="#{parent.code}" on:click="{() => loadArea(parent.code)}">{parent.name}</a>{@html ' &gt; '}
		{/each}
		{/if}
		{place.name}
	</div>
</div>
	
<div class="grid-2">
	<div>
		<span class="text-big">{place.name}</span><br/>
		{#if place.parents[0]}
		{types[place.type].name} in {place.parents[0].name}
		{/if}
	</div>
	<div>
		<div style="width: 240px; float: right;">
		<Select {options} bind:selected group="typenm" search={true} on:select="{() => { if (selected) { loadArea(selected.code) }}}"/>
		</div>
	</div>
</div>

<div class="grid mt">
	<div class="map">
		<Map bind:map location={{bounds: place.bounds}}>
			<MapSource {...mapSources.wd}>
				<MapLayer
					{...mapLayers.wd}
					id="wd-fill"
					type="fill"
					click={true}
					selected={active.selected}
					on:select={mapSelect}
					highlight={true}
					highlighted={active.highlighted}
					hover={true}
					hovered={active.hovered}
					layout={{visibility: active.type == 'wd' || active.childType == 'wd' ? 'visible' : 'none'}}
					paint={active.type == 'wd' ? mapPaint['fill-self'] : active.childType == 'wd' ? mapPaint['fill-child'] : mapPaint.fill}/>
				<MapLayer
					{...mapLayers.wd}
					id="wd-bounds"
					type="line"
					selected={active.selected}
					highlight={true}
					highlighted={active.highlighted}
					layout={{visibility: active.type == 'wd' || active.childType == 'wd' ? 'visible' : 'none'}}
					paint={active.type == 'wd' ? mapPaint['line-active'] : active.childType == 'wd' ? mapPaint['line-child'] : mapPaint.line}/>
				<MapLayer
					{...mapLayers.wd}
					id="wd-self"
					type="line"
					selected={active.selected}
					layout={{visibility: active.type == 'wd' ? 'visible' : 'none'}}
					paint={active.type == 'wd' ? mapPaint['line-self'] : mapPaint.line}/>
			</MapSource>
			<MapSource {...mapSources.crd}>
				{#each Object.keys(mapLayers).filter(d => d != 'wd') as key}
				<MapLayer
					{...mapLayers[key]}
					id={key + "-fill"}
					type="fill"
					click={true}
					selected={active.selected}
					on:select={mapSelect}
					highlight={true}
					highlighted={active.highlighted}
					hover={true}
					hovered={active.hovered}
					layout={{visibility: active.type == key || active.childType == key ? 'visible' : 'none'}}
					paint={active.type == key ? mapPaint['fill-active'] : active.childType == key ? mapPaint['fill-child'] : mapPaint.fill}/>
				<MapLayer
					{...mapLayers[key]}
					id={key + "-bounds"}
					type="line"
					selected={active.selected}
					highlight={true}
					highlighted={active.highlighted}
					layout={{visibility: active.type == key || active.childType == key ? 'visible' : 'none'}}
					paint={active.type == key ? mapPaint['line-active'] : active.childType == key ? mapPaint['line-child'] : mapPaint.line}/>
				<MapLayer
					{...mapLayers[key]}
					id={key + "-self"}
					type="line"
					selected={active.selected}
					layout={{visibility: active.type == key ? 'visible' : 'none'}}
					paint={active.type == key ? mapPaint['line-self'] : mapPaint.line}/>
				{/each}
			</MapSource>
		</Map>
	</div>
</div>


<Tabs>
	<TabList>
		<Tab>1. Area Report</Tab>
		<Tab>2. Area Profiles</Tab>
		<Tab>3. Reports</Tab>
		<Tab>4. Bullet points</Tab>
	</TabList>

	<TabPanel>
		<REPORT2 place={place} ew={ew} quartiles={quartiles}></REPORT2>
	</TabPanel>

	<TabPanel>
		<CHUNKS place={place} ew={ew} quartiles={quartiles}></CHUNKS>
	</TabPanel>

	<TabPanel>
		<REPORT place={place}></REPORT>
	</TabPanel>

	<TabPanel>
		<BULLET place={place}></BULLET>
	</TabPanel>
</Tabs>

{#if place.children[0]}
<div class="grid mt">
	<div>
		<span class="text-label">{place.children[0].typepl} within {place.name}</span><br/>
		<span class="text-small">
		{#each place.children as child, i}
		<a href="#{child.code}" on:click="{() => loadArea(child.code)}">{child.name}</a>{ i < place.children.length - 1 ? ', ' : ''}
		{/each}
		</span>
	</div>
</div>
{/if}

<div class="grid-2 mt">
	<div>
		<img src="https://onsvisual.github.io/svelte-scrolly/img/ons-logo-pos-en.svg" alt="Office for National Statistics"/>
	</div>
	<div class="right">
		<span class="text-small">Source: Census 2011, with change +/- from Census 2001.</span>
	</div>
</div>
{/if}

<style>
	@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap');
	:global(body) {
		font-family: 'Open Sans', sans-serif;
		padding: 20px;
		font-size: x-large;
		line-height: 2;
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
		font-size: small;
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