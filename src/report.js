import robojournalist from "robojournalist";
import { adjectify, uncap1, uncap1ofEng, regionThe, ordinal_suffix_of } from './robo_utils_pure_functions.js';
import strings from './robo-strings/report-strings.csv';
import variableChange from './data/populationChange.csv';
import ladLookup from './data/censusAreaLookup.csv';
import subGroupLookup from './data/subGroupLookup.js';
import topicLookup from './data/topicLookup.js';

// Transform lad lookup csv to object
let ladType = {};
ladLookup.forEach(d => {ladType[d['Code']] = d['Subgroup code'];});

// Transform report string csv to object
let roboStrings = {};
strings.forEach(d => {roboStrings[d.varCode] = d.template;});

let gssLookup = {"E09": "London borough", "E08": "metropolitan district", "E07": "non-metropolitan district", "E06": "unitary authority"}
let gssLookupShort = {"E09": "borough", "E08": "district", "E07": "district", "E06": "authority"}

//  Finds districts that have been overtaken by spotlight area
function overTake(place, selectors) {
    let var01 = place['data'][selectors[0]][selectors[1]][2001][selectors[3]]
    let var11 = place['data'][selectors[0]][selectors[1]][2011][selectors[3]]
    console.log("var11", var11)
    let variableFilter = variableChange.filter( item => {
        return  item["2001"] > var01 &&
                item["2011"] < var11 && 
                item["topic"] == selectors[0]+"_"+selectors[3]
    });
    console.log("variableFilter", variableFilter)
    if (variableFilter.length > 10) {
        return variableFilter.length + " areas"
    } else if (variableFilter.length > 3) {
        return variableFilter.length + " areas, including " + variableFilter[0].lad + " and " + variableFilter[1].lad 
    } else if (variableFilter.length == 3) {
        return variableFilter[0].lad + ", " + variableFilter[1].lad + " and " + variableFilter[2].lad; 
    } else {
        return variableFilter[0].lad + (variableFilter[1]?" and " + variableFilter[1].lad:"")
    }
}

//  Finds next highest district within region, should adapt to make it find one higher if spotlight not top rank
function nextHighest(place, selectors) {
    let variableFilter = variableChange.filter( item => {
        return item["parent"] == place.parents[0].name &&
               item["topic"] == selectors[0]+"_"+selectors[3]
    });
    variableFilter.sort(function(a, b) {
        return Math.abs(b['2011']) - Math.abs(a['2011']);
    });
    let index = variableFilter.map((item) => {return item['lad']}).indexOf(place.name)
    return variableFilter[index+1]
}

// Finds the top areas for nationally if rank is 2 or 3, if rank is 1 find next highest
function topBelow(place, selectors, natRank) {
    if (natRank>1) {
        let variableFilter = variableChange.filter( item => {
            return  item["topic"] == selectors[0]+"_"+selectors[3]
        });
        console.log("*** variableFilter", selectors[0]+"_"+selectors[3])
        variableFilter.sort(function(a, b) {
            return Math.abs(b['change']) - Math.abs(a['change']);
        });    
        return variableFilter[0].lad + " (+" + dec(variableFilter[0].change) + "%)" + (variableFilter[1]?" and " + variableFilter[1].lad  + " (+" + dec(variableFilter[0].change) + "%)" + " have":" has")
    } else {
        let variableFilter = variableChange.filter( item => {
            return item["topic"] == selectors[0]+"_"+selectors[3];
        });
        variableFilter.sort(function(a, b) {
            return Math.abs(b['change']) - Math.abs(a['change']);
        });
        let index = variableFilter.map((item) => {return item['lad']}).indexOf(place.name)    
        return variableFilter[index+1].lad + " (+" + dec(variableFilter[index+1].change) + (perc?"pp)":"%)");
    }
}

// Find out if area is first second, third or significantly higher 
function nationComp(place, breaks, natRank, selectors) {
    if (natRank<2) {
        return " is growing faster here than any other " + gssLookupShort[place.code.slice(0,3)]
    }
    if (natRank<4) {
        return " the " + ordinal_suffix_of(Math.abs(natRank)) + " fastest growing of any " + gssLookupShort[place.code.slice(0,3)]
    }
    else {
        return " is growing " + adjectify(place['data'][selectors[0]][selectors[1]+'_rank'][selectors[2]][selectors[3]], ['faster here', 'slower here'], breaks) + " the average"
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

let fraction_map = {'one in two': 0.5, 'one in three': 0.333, 'one in four': 0.25, 'one in five': 0.2, 'one in six': 0.167, 'one in seven': 0.143, 'one in eight': 0.125, 'one in nine': 0.111, 'one in ten': 0.1, 'two in ten': 0.2, 'three in ten': 0.3, 'four in ten': 0.4, 'six in ten': 0.6, 'seven in ten': 0.7, 'eight in ten': 0.8, 'nine in ten': 0.9, 'all': 1.0}

let OverUnder;
function get_word(fraction) {
    let lowest = 2;
    let lowest_label;
    for (const label in fraction_map) {
        if (Math.abs(fraction-fraction_map[label])<lowest) {
            lowest = Math.abs(fraction-fraction_map[label]) 
            lowest_label = label
            if (fraction-fraction_map[label]==0) {
                OverUnder = 0; 
            }
            else if (fraction-fraction_map[label]>0) {
                OverUnder = 1;
            }
            else if (fraction-fraction_map[label]<0) {
                OverUnder = -1;
            }
        }
    }
    return lowest_label
}

function fracPerc(place, selectors) {
    var sortable = [];
    for (var obj in place['data'][selectors[0]]['perc'][2011]) {
        sortable.push([obj, dec(place['data'][selectors[0]]['perc'][2011][obj])]);
    }
    sortable.sort(function(a, b) {
        return Math.abs(b[1]) - Math.abs(a[1]);
    });
    console.log("sortable", sortable)
    let fraction = sortable[1][1]/100
    let words = get_word(fraction)
    return [OverUnder==0? capitalizeFirstLetter(words) + " (" + dec(sortable[1][1]) + "%)": (OverUnder<0?"Almost ":"Just over ") + words + " (" + dec(sortable[1][1]) + "%)", sortable]
}

let perc;
let pos;

function dec(num) {
    return Math.round(num * 10)/10 
}
// Creates sentences for first report section
function reportGenerator(place, dataSelect, sect, ew) {

    let breaks = []; for (let i=0; i<10; i++) {breaks.push(Math.round((i * ((place.type=="wd")?8056:336)) / 10))}
    let selectors = dataSelect['label'].split("_")
    if (selectors[4]) {
        selectors[3] = selectors[3] + "_" + selectors[4];
    }
    perc = selectors[1]=="perc"?true:false;
    pos = place.data[selectors[0]][selectors[1]][selectors[2]][selectors[3]]>0? true:false;
    let keyWord = selectors[0] + "_" + selectors[3];
    let locRank = place['data'][selectors[0]][selectors[1]+'_rank_local'][selectors[2]][selectors[3]]
    let natRank = place['data'][selectors[0]][selectors[1]+'_rank'][selectors[2]][selectors[3]]
    let natRankTot = place['data'][selectors[0]][selectors[1]+'_rank'][2011][selectors[3]]

    let topic = topicLookup[keyWord][dataSelect.abVal>0?'positive':'negative'];

    let sentence1 = robojournalist(roboStrings["first_"+topic[0]], {
        topicLong: topicLookup[selectors[0]+"_"+selectors[3]]['positive'][2],
        topic: topicLookup[selectors[0]+"_"+selectors[3]]['positive'][1],
        ladName: place.name, 
        shortType: gssLookupShort[place.code.slice(0,3)],
        percChange: dec(place.data[selectors[0]][selectors[1]][selectors[2]][selectors[3]]), 
        accord: sect==0?", according to the 2021 census":"",
    })
    if (sect==1) {
        let sentence1a = robojournalist("The 2021 Census also appears to show a significant shift in the local population's well-being.", {
            type: gssLookupShort[place.code.slice(0,3)],
            top: topBelow(place, selectors, natRank),
            topic: topicLookup[selectors[0]+"_"+selectors[3]]['positive'][2]
        })
        sentence1 = sentence1a + " " + sentence1
    }

    let sentence2 = robojournalist(roboStrings["second_"+topic[0]], {
        ladName: place.name,
        topicLong: topicLookup[selectors[0]+"_"+selectors[3]]['positive'][2],
        topic: topicLookup[selectors[0]+"_"+selectors[3]]['positive'][1], 
        fasterSlower: nationComp(place, breaks, natRank, selectors),
        localComp: natRank==1?"":robojournalist(" and the {ordinalSuffix} fastest growing in {parent}", {
            ordinalSuffix: ordinal_suffix_of(Math.abs(locRank)),
            parent: uncap1(robojournalist('{place ^regionThe}', { 
                place: place.parents[0].name, regionThe 
            }))
        })
    })
    if (natRank<4) {
        let sentence2b = robojournalist(natRank==1?"The next fastest growing {top}.":"Across all {type}s, only {top} a faster growing {topic}.", {
            type: gssLookupShort[place.code.slice(0,3)],
            top: topBelow(place, selectors, natRank),
            topic: topicLookup[selectors[0]+"_"+selectors[3]]['positive'][2]
        })
        sentence2 = sentence2 + " " + sentence2b
    }

    let sentence3 = robojournalist(roboStrings["third"], {
        ladName: place.name,
        natRank: ordinal_suffix_of(natRankTot),
        placeType: sect==0?subGroupLookup[ladType[place.code]]:gssLookup[place.code.slice(0,3)],
        overTake: overTake(place, selectors),
        topicAdj: topic[3],
        outOf: natRankTot>15?" out of 336 districts":"district",
        tenYears: sect==1?"In the decade to 2021":"Between 2011 and 2021",
        adject: natRankTot<10?"":robojournalist("This means {ladName} remains {moreLess} the average district.", {
            moreLess: adjectify(place['data'][selectors[0]][selectors[1]+'_rank'][2011][selectors[3]], ['more '+ topic[3], 'less '+ topic[3]], breaks),
            ladName: place.name,
        })
    })

    let sentence4 = robojournalist(roboStrings["fourth_"+topic[0]], {
        popChange: (place.data.population.value['2011'].all - place.data.population.value['2001'].all).toLocaleString(),
        pop: place.data.population.value['2011'].all.toLocaleString(),
        shortType: gssLookupShort[place.code.slice(0,3)],
        localRank11: ordinal_suffix_of(place['data'][selectors[0]][selectors[1]+'_rank_local']['2011'][selectors[3]]),
        topic: topicLookup[selectors[0]+"_"+selectors[3]]['positive'][1],
        topicSyn: topicLookup[selectors[0]+"_"+selectors[3]]['positive'][4],
        parent: uncap1(robojournalist('{place ^regionThe}', { place: place.parents[0].name, regionThe })),
        absVal: place.data[selectors[0]].value['2011'][selectors[3]].toLocaleString(), 
        percVal: selectors[1]=='perc'?dec(place.data[selectors[0]].perc['2011'][selectors[3]]).toLocaleString():"", 
        fracPerc: selectors[1]=='perc'?fracPerc(place, selectors)[0]:"",
        fracVar: selectors[1]=='perc'?fracPerc(place, selectors)[1][1][0]:"",
        percVal2: selectors[1]=='perc'?fracPerc(place, selectors)[1][2][1]:"",
        percVar2: selectors[1]=='perc'?fracPerc(place, selectors)[1][2][0]:"",
    })
    let sentence5 = robojournalist(roboStrings["fifth_"+topic[0]], {
        nextHighest: nextHighest(place, selectors).lad,
        shortType: gssLookupShort[place.code.slice(0,3)],
        topic: topicLookup[selectors[0]+"_"+selectors[3]]['positive'][1],
        nextPop: (dec(Math.abs(nextHighest(place, selectors)['2011']))).toLocaleString(),
        parent: uncap1(robojournalist('{place ^regionThe}', { place: place.parents[0].name, regionThe })),
        topicAdj: topicLookup[selectors[0]+"_"+selectors[3]]['positive'][3],
        behind: place['data'][selectors[0]][selectors[1]+'_rank_local']['2011'][selectors[3]]==1?"": "Manchester is behind Liverpool, with 85% of residents in good health, while ",
    })
    if ((sentence1+sentence5).length<250) {
        sentence4 = sentence4 + " " + sentence5
        sentence5 = null
    }

    let sentence6 = robojournalist(roboStrings["sixth_"+topic[0]], {
        lad: place.name,
        alt: topic[5]?topicLookup[topic[5]][dataSelect.abVal>0?'positive':'negative'][1]:"",
        measure: topic[5]?topicLookup[topic[5]][dataSelect.abval>0?'positive':'negative'][2]:"",
        altVal: topic[5]?dec(place.data[topic[5]][selectors[1]]['2011'][selectors[3]]):"",
        altValNat: topic[5]?dec(ew.data[topic[5]][selectors[1]]['2011'][selectors[3]]):"",
        highLow: topic[5]?adjectify(place['data'][topic[5]][selectors[1]+'_rank'][2011][selectors[3]], ['higher', 'lower'], breaks):"", 
        perc: dec(ew.data[selectors[0]][selectors[1]]['2011'][selectors[3]]),
        ave: (dec(ew.data[selectors[0]][selectors[1]]['2011'][selectors[3]]/336)).toLocaleString(),
        topic: topicLookup[selectors[0]+"_"+selectors[3]]['positive'][1],
        opt: !topic[5]?fracPerc(place, selectors)[1][0][0]:"",
        opt2: !topic[5]?fracPerc(place, selectors)[1][1][0]:"",
        opt3: !topic[5]?fracPerc(place, selectors)[1][2][0]:"",
        perc2: !topic[5]?fracPerc(place, selectors)[1][1][1]:"",
        perc3: !topic[5]?fracPerc(place, selectors)[1][2][1]:"",
    })
    console.log("fracPerc(place, selectors)", fracPerc(place, selectors));

    return [sentence1, sentence2, sentence3, sentence4, sentence5, sentence6]
}


export { reportGenerator };


