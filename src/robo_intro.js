import robojournalist from "robojournalist";
import { adjectify, uncap1ofEng, regionThe, ordinal_suffix_of } from './robo_utils_pure_functions.js';

import strings from './robo-strings/robo-strings.csv';

import countyLookup from './data/ladLookupOut.csv';
import ladLookup from './data/censusAreaLookup.csv';
import countyPopLookup from './data/countyPop.csv';

// Transform robo string csv to object
let roboStrings = {};
strings.forEach(d => {roboStrings[d.varCode] = d.template;});

// Transform lad lookup csv to object
let ladType = {};
ladLookup.forEach(d => {ladType[d['Code']] = d['Subgroup code'];});

// Transform lad lookup csv to object
let countyPops = {};
countyPopLookup.forEach(d => {countyPops[d['Code']] = {"Name": d['Name'], "Geography": d['Geography'], "Rank": d['Rank']};});

// Transform lad lookup csv to object
let counties = {};
countyLookup.forEach(d => {counties[d['LAD19CD']] = {"countyName": d['CTY19NM'], "countyCode": d['CTY19CD']};});

let subGroupLookup = {
    "1a1r": "a rural-urban fringe area", 
    "1b1r": "an affluent rural area", 
    "1b2r": "a growing rural area", 
    "2a1r": "a city", 
    "2b1r": "a university city", 
    "3a2r": "a sparse area of countryside", 
    "3a1r": "an agricultural area", 
    "3b1r": "an ageing coastal area",
    "3b2r": "a seaside  area",
    "3b1r": "an ageing coastal area",
    "4a1r": "an ethnically diverse urban area",
    "5a1r": "a cosmopolitan area",
    "6a2r": "an area with a mining history",
    "6a3r": "a service economy area",
    "6a1r": "an area with a manufacturing history",
    "7a1r": "an area of countryside",
    "7c2r": "a prosperous suburban area",
    "7c1r": "a prosperous semi-rural area",
    "8a1r": "a multi-ethnic industrial area",
    "8a2r": "an urban area",
    "8b1r": "a city periphery",
    "8b2r": "an area of urban expansion",
}

let gssLookup = {"E09": "borough", "E08": "metropolitan district", "E07": "non-metropolitan district", "E06": "unitary authority"}
let gssLookupShort = {"E09": "borough", "E08": "district", "E07": "district", "E06": "authority"}

// Create intro paragraph for area profile page
function introPara(place) {

    // Breaks to determine the decile of national ranks for wards and districts
    let breaks = []; for (let i=0; i<10; i++) {breaks.push(Math.round((i * ((place.type=="wd")?8056:336)) / 10))}

    let intro = counties[place.code]?
    robojournalist(roboStrings["intro"], {
        ladName: place.name,
        placeType: subGroupLookup[ladType[place.code]],
        gssType: gssLookup[place.code.slice(0,3)],
        gssTypeShort: gssLookupShort[place.code.slice(0,3)],
        county: counties[place.code]['countyName'],
        parentArea: uncap1ofEng(robojournalist('{place ^regionThe}', { place: place.parents[0].name, regionThe })),
        ordPop: ordinal_suffix_of(Math.abs(place.data.population.value_rank[2011].all)),
        smallestLargest: place.data.population.value_rank[2011].all<0?"smallest":"largest",
        popu: place.data.population.value[2011].all.toLocaleString(),
        popChange: Math.round(place.data.population.value.change.all),
        moreLess: adjectify(place.data.population.value_rank.change.all, ['more', 'less'], breaks),
        ordPopCounty: ordinal_suffix_of(countyPops[counties[place.code]['countyCode']]["Rank"]),
        mostLeast: "most",
        parentType: countyPops[counties[place.code]['countyCode']]["Geography"],
    }) :
    robojournalist(roboStrings["intro2"], {
        ladName: place.name,
        placeType: subGroupLookup[ladType[place.code]],
        gssType: gssLookup[place.code.slice(0,3)],
        parentArea: uncap1ofEng(robojournalist('{place ^regionThe}', { place: place.parents[0].name, regionThe })),
        ordPop: ordinal_suffix_of(Math.abs(place.data.population.value_rank[2011].all)),
        smallestLargest: place.data.population.value_rank[2011].all<0?"smallest":"largest",
        popu: place.data.population.value[2011].all.toLocaleString(),
        popChange: Math.round(place.data.population.value.change.all),
        moreLess: adjectify(place.data.population.value_rank.change.all, ['more', 'less'], breaks),
    })
    return intro
}

export { introPara };