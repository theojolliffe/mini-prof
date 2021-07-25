<script>
    import { headGenerator } from './robo_headline.js';
    import robojournalist from "robojournalist";
	import { adjectify, uncap1, regionThe, ordinal_suffix_of } from './robo_utils_pure_functions.js';
	
	import Item from './Item.svelte'

    export let place;

    let breaks = []; for (let i=0; i<10; i++) {breaks.push(Math.round((i * ((place.type=="wd")?8056:336)) / 10))}

</script>

<div class="section-2">

    <div>
        <h1>{headGenerator(place)[0]}</h1>
        <h4>{headGenerator(place)[1]}</h4>
	</div>
	
	<Item place={place} entry={place.name+" at a glance"}/>
    
    <div>
        <p>
            {robojournalist("On Census day 2011, {ladName} had a population of {population}, {increaseDecrease} of {percChange}% compared to 2001, {moreLess} than the average change across all local authorities. Its population density was {density} people per hectare, {highLow} average.", {
                ladName: place.name, 
                population: place.data.population.value['2011'].all.toLocaleString(), 
                increaseDecrease: (place.data.population.value['change'].all<0)?"a decrease":"an increase", 
                percChange: place.data.population.value['change'].all, 
                moreLess: adjectify(place['data']['population']['value_rank']['change']["all"], ['more', 'less'], breaks),
                density: place.data.density.value['2011'].all.toLocaleString(),
                highLow: adjectify(place['data']['density']['value_rank']['change']["all"], ['higher', 'lower'], breaks)
                })}
        </p>
        <p>
            {robojournalist("During the 10 years prior the 2011 Census, the median age here {increaseDecrease} by {ageChange} to {medAge}. The current median age is {highLow} the average across other local authorities in England and Wales. Of the total population, {under20}% are aged under 20, {twenty59}% are 20 to 59, and {over60}% are aged 60 or over.", 
            {
                increaseDecrease: (place.data.agemed.value['2011'].all-place.data.agemed.value['2001'].all)<0?"decreased":"increased",
                ageChange: Math.abs(place.data.agemed.value['2011'].all-place.data.agemed.value['2001'].all) + (Math.abs(place.data.agemed.value['2011'].all-place.data.agemed.value['2001'].all==1)?" year":" years"),
                medAge: place.data.agemed.value['2011'].all,
                highLow: adjectify(place['data']['agemed']['value_rank']['2011']["all"], ['higher', 'lower'], breaks),
                under20: Number(place.data.age10yr.perc['2011']['0-9'] + place.data.age10yr.perc['2011']['10-19']).toFixed(0),
                twenty59: Number(place.data.age10yr.perc['2011']['20-29'] + place.data.age10yr.perc['2011']['30-39'] + place.data.age10yr.perc['2011']['40-49'] + place.data.age10yr.perc['2011']['50-59']).toFixed(0),
                over60: Number(place.data.age10yr.perc['2011']['60-69'] + place.data.age10yr.perc['2011']['70plus']).toFixed(0),
                })}
        </p>
        <p>    
            {robojournalist("The employment rate has {increaseDecrease} by {empChange} percentage points to {emp}% since the previous Census. This is {higherLower} the average across all {wardRegion} in England and Wales. An additional {selfEmp}% are self-employed. There are now {unemp} unemployed residents and {inact} who are economically inactive, totalling a combined proportion of {unempInact}% of the local population.", 
            {
                increaseDecrease: (place['data']['economic']['perc']['change']["employee"]<0)?"decreased":"increased",
                empChange: Math.abs(place['data']['economic']['perc']['change']["employee"]),
                emp: (place['data']['economic']['perc']['2011']["employee"]),
                selfEmp: (place['data']['economic']['perc']['2011']["self-employed"]),
                unemp: (place['data']['economic']['value']['2011']["unemployed"]),
                inact: (place['data']['economic']['value']['2011']["inactive"]),
                unempInact: (place['data']['economic']['perc']['2011']["unemployed"]) + (place['data']['economic']['perc']['2011']["inactive"]),
                higherLower: adjectify(place['data']['economic']['perc_rank']['2011']["employee"], ['higher', 'lower'], breaks),
                wardRegion: place.type=="wd"?"wards":"regions",
                })}
        </p>
        <p>    
            {robojournalist("The proportion of ethnic minority residents is {smallerGreater} the average across the country, with BAME communities making up {bame}% of the population. This is an {increaseDecrease} of {bameChange}% compared to 2001. Of the total population, {white}% is White, {asian}% is Asian, {black}% is Black, and {mixedOther}% is from mixed or other backgrounds.", 
            {
                ladName: place.name,
                smallerGreater: adjectify(place['data']['ethnicity']['perc_rank']['2011']["white"], ['greater', 'smaller'], breaks),
                bame: Number(100-place['data']['ethnicity']['perc']['2011']["white"]).toFixed(1),
                bameChange: Math.abs(place['data']['ethnicity']['perc']['change']["white"]),
                increaseDecrease: (place.data.ethnicity.perc['change'].white<0)?"increase":"decrease",
                white: Number(place['data']['ethnicity']['perc']['2011']["white"]).toFixed(0),
                asian: Number(place['data']['ethnicity']['perc']['2011']["asian"]).toFixed(0),
                black: Number(place['data']['ethnicity']['perc']['2011']["black"]).toFixed(0),
                mixedOther: Number(place['data']['ethnicity']['perc']['2011']["mixed"]+place['data']['ethnicity']['perc']['2011']["other"]).toFixed(0),
                })}
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
	h1:first-letter {
		text-transform: capitalize;
	}
	</style>