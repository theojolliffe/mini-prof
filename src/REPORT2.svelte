<script>
	import { headGenerator } from './robo_headline.js';
	import { reportGenerator } from './report.js';
    import robojournalist from "robojournalist";
	import { adjectify, uncap1, regionThe, ordinal_suffix_of } from './robo_utils_pure_functions.js';
	import strings from './robo-strings/report-strings.csv';
	import SpineChart from "./chart/SpineChart.svelte";
	import { suffixer } from "./utils";
	import { types } from "./config";

	export let place;
	export let quartiles;
    export let ew;

	// Transform robo string csv to object
	let roboStrings = {};
	strings.forEach(d => {roboStrings[d.varCode] = d.template;});

	let topicList = ["age10yr", "travel", "tenure", "density"] 
	let subjectList = ["bus"] 
	
	function priorities(place) {
    // Filter ranks to only include change ranks
	let dataSelect = [];
    for (let i=0; i<50; i++) {
        if ("change" == place['Priorities'][i]['label'].split("_")[2] & "female" != place['Priorities'][i]['label'].split("_")[3] & "male" != place['Priorities'][i]['label'].split("_")[3]) {
            // Less interested in these groups, this will be expanded into a more general rule for prioritising certain topics
            if (topicList.includes(place['Priorities'][i]['label'].split("_")[0])) {
                place['Priorities'][i].sqrt = place['Priorities'][i].sqrt + 1;
			}
			// Less interested in these groups, this will be expanded into a more general rule for prioritising certain topics
			if (subjectList.includes(place['Priorities'][i]['label'].split("_")[3])) {
                place['Priorities'][i].sqrt = place['Priorities'][i].sqrt + 1;
            }
            dataSelect.push(place['Priorities'][i])
        }
    }
    dataSelect.sort(function(a, b) {
        // Reorder the objects
        if (a.sqrt < b.sqrt) return -1;
        if (a.sqrt > b.sqrt) return 1;
        return 0;
    });
    dataSelect.sort(function(a, b) {
        // Select the highest abVal for equal change ranks
        if (a.sqrt == b.sqrt) {
            if (a.abVal < b.abVal) return 1;
            if (a.abVal > b.abVal) return -1;
        }
		return 0;
	});

	return dataSelect
}
let data1 = priorities(place)[0]
let data2 = priorities(place)[1]
console.log("priorities(place)", priorities(place))

</script>

<div class="section-2">

    <div>
        <h1>{headGenerator(place, data1)[0]}</h1>
        <h4>{reportGenerator(place, data1, 0, ew)[0]}</h4>
	</div>
	    
    <div>
        <p>
            {reportGenerator(place, data1, 0, ew)[1]}
        </p>
		<p>
            {reportGenerator(place, data1, 0, ew)[2]}
		</p>        
		<p>
            {reportGenerator(place, data1, 0, ew)[3]}
		</p>     
		{#if reportGenerator(place, data1, 0, ew)[4]}   
			<p>
				{reportGenerator(place, data1, 0, ew)[4]}
			</p> 
		{/if}
		<p>
            {reportGenerator(place, data1, 0, ew)[5]}
		</p> 

	</div>
    <div style="margin-top: 50px; margin-bottom: 50px; width: 80%">
        <span class="text-label">Population</span>
        <span>This chart is a placeholder</span>
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
        <p class="section-head">{headGenerator(place, data2)[0]}</p>
	</div>
	    
    <div>
		<p>
			{reportGenerator(place, data2, 1, ew)[0]}
		</p>
        <p>
            {reportGenerator(place, data2, 1, ew)[1]}
        </p>
		<p>
            {reportGenerator(place, data2, 1, ew)[2]}
		</p>        
		<p>
            {reportGenerator(place, data2, 1, ew)[3]}
		</p>        
		{#if reportGenerator(place, data2, 1, ew)[4]}
			<p>
				{reportGenerator(place, data2, 1, ew)[4]}
			</p>
		{/if}
		<p>
            {reportGenerator(place, data2, 1, ew)[5]}
		</p> 
        
       
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
		margin-top: 30px;
	}
	h1, h3, h4:first-letter {
		text-transform: capitalize;
	}
	p:first-letter {
		text-transform: capitalize;
	}
	.section-head:first-letter {
		text-transform: capitalize
	}
	.section-head {
		font-size:2.8rem
	}
	</style>

	<!--


		smallerGreater: adjectify(place['data']['ethnicity']['perc_rank']['2011']["white"], ['greater', 'smaller'], breaks),
        bame: Number(100-place['data']['ethnicity']['perc']['2011']["white"]).toFixed(1),
        bameChange: Math.abs(place['data']['ethnicity']['perc']['change']["white"]),
        increaseDecrease: (place.data.ethnicity.perc['change'].white<0)?"increase":"decrease",
        white: Number(place['data']['ethnicity']['perc']['2011']["white"]).toFixed(0),
        asian: Number(place['data']['ethnicity']['perc']['2011']["asian"]).toFixed(0),
        black: Number(place['data']['ethnicity']['perc']['2011']["black"]).toFixed(0),
        mixedOther: Number(place['data']['ethnicity']['perc']['2011']["mixed"]+place['data']['ethnicity']['perc']['2011']["other"]).toFixed(0),
        population: place.data.population.value['2011'].all.toLocaleString(), 
        increaseDecrease: (place.data.population.value['change'].all<0)?"a decrease":"an increase", 
        moreLess: adjectify(place['data']['population']['value_rank']['change']["all"], ['more', 'less'], breaks),
        density: place.data.density.value['2011'].all.toLocaleString(),
        highLow: adjectify(place['data']['density']['value_rank']['change']["all"], ['higher', 'lower'], breaks),
        increaseDecrease: (place.data.agemed.value['2011'].all-place.data.agemed.value['2001'].all)<0?"decreased":"increased",
        ageChange: Math.abs(place.data.agemed.value['2011'].all-place.data.agemed.value['2001'].all) + (Math.abs(place.data.agemed.value['2011'].all-place.data.agemed.value['2001'].all==1)?" year":" years"),
        medAge: place.data.agemed.value['2011'].all,
        under20: Number(place.data.age10yr.perc['2011']['0-9'] + place.data.age10yr.perc['2011']['10-19']).toFixed(0),
        twenty59: Number(place.data.age10yr.perc['2011']['20-29'] + place.data.age10yr.perc['2011']['30-39'] + place.data.age10yr.perc['2011']['40-49'] + place.data.age10yr.perc['2011']['50-59']).toFixed(0),
        over60: Number(place.data.age10yr.perc['2011']['60-69'] + place.data.age10yr.perc['2011']['70plus']).toFixed(0),
        increaseDecrease: (place['data']['economic']['perc']['change']["employee"]<0)?"decreased":"increased",
        empChange: Math.abs(place['data']['economic']['perc']['change']["employee"]),
        emp: (place['data']['economic']['perc']['2011']["employee"]),
        selfEmp: (place['data']['economic']['perc']['2011']["self-employed"]),
        unemp: (place['data']['economic']['value']['2011']["unemployed"]),
        inact: (place['data']['economic']['value']['2011']["inactive"]),
        unempInact: (place['data']['economic']['perc']['2011']["unemployed"]) + (place['data']['economic']['perc']['2011']["inactive"]),
        higherLower: adjectify(place['data']['economic']['perc_rank']['2011']["employee"], ['higher', 'lower'], breaks),
        wardRegion: place.type=="wd"?"wards":"regions",
        bame: Number(100-place['data']['ethnicity']['perc']['2011']["white"]).toFixed(1),
        bameChange: Math.abs(place['data']['ethnicity']['perc']['change']["white"]),
        increaseDecrease: (place.data.ethnicity.perc['change'].white<0)?"increase":"decrease",
        white: Number(place['data']['ethnicity']['perc']['2011']["white"]).toFixed(0),
        asian: Number(place['data']['ethnicity']['perc']['2011']["asian"]).toFixed(0),
        black: Number(place['data']['ethnicity']['perc']['2011']["black"]).toFixed(0),
        mixedOther: Number(place['data']['ethnicity']['perc']['2011']["mixed"]+place['data']['ethnicity']['perc']['2011']["other"]).toFixed(0),
        smallerGreater: adjectify(place['data']['ethnicity']['perc_rank']['2011']["white"], ['greater', 'smaller'], breaks),



	-->