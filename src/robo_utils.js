import robojournalist from "robojournalist";
import { adjectify, uncap1, uncap1ofEng, regionThe, ordinal_suffix_of } from './robo_utils_pure_functions.js';
import strings from './robo-strings/robo-strings.csv';

// Transform robo string csv to object
let roboStrings = {};
strings.forEach(d => {roboStrings[d.varCode] = d.template;});

// A variable to keep track of previous sentence
let intro = true;

// Function creates a sentence given an array of topics
function sentGenerator(place, topics, pNum, AB) {

    let dataSelect = place
    for (let i = 0; i < topics.length; i++)  {
        dataSelect = dataSelect[topics[i]]
    }

    // Function returns boolean depending on whether 
    let isChange = isXYearChange(dataSelect, topics, AB);
    let measure = topicify(dataSelect, topics, isChange);
    let ordSuf = (dataSelect['label']?dataSelect['value']:dataSelect[isChange?"change":"2011"][measure[2]?measure[3]:"all"]);
    let nationRank = (dataSelect['label']?place['data'][dataSelect['label'].split("_")[0]][dataSelect['label'].split("_")[1]][isChange?"change":"2011"][measure[2]?measure[3]:"all"]:place['data'][topics[1]][topics[2].substring(0, topics[2].length - 6)][isChange?"change":"2011"][measure[2]?measure[3]:"all"]);
    let parentName = place.parents[0].name

    // Breaks to determine the decile of national ranks for wards and districts
    let breaks = []; for (let i=0; i<10; i++) {breaks.push(Math.round((i * ((place.type=="wd")?8056:336)) / 10))}
    let LocalBreaks = []; for (let i=0; i<10; i++) {LocalBreaks.push(Math.round(i * place.siblings.length / 10))}

    let topTen = Math.abs(ordSuf)<=10;

    let changeValue = topics[2]?(measure[2]?place[topics[0]][topics[1]]["perc"]["change"][measure[3]]:false):(measure[2]?place[topics[0]][topics[1]]["abVal"][measure[3]]:false);
    let isChangeNeg = changeNeg(place, topics, measure)

    let roboSentence = 
    topTen? robojournalist(roboStrings["ranking_1_sent"], {
        Current: !isChange,
        firstPara: (pNum % 2 == 0),
        ladName: place.name,
        measure: measure[0],
        size: measure[1],
        ordinalSuffix: ordinal_suffix_of(Math.abs(ordSuf)),
        rankIsNeg: ( ordSuf < 0),
        changeNeg: isChangeNeg,
        regionName: (nationRank==ordSuf?"England and Wales":uncap1(robojournalist('{place ^regionThe}', { place: parentName, regionThe }))),
        intro: intro,
    }) :    robojournalist(roboStrings["relative_1_sent"], {
        Current: !isChange,
        firstPara: ((pNum==0)|(pNum==3)),
        ladName: place.name,
        measure: measure[0],
        size: measure[1],
        ordinalSuffix: ordinal_suffix_of(Math.abs(ordSuf)),
        rankIsNeg: ( ordSuf < 0),
        changeNeg: changeNeg,
        intro: intro,
        changeValue: changeValue,
        adj: adjectify(nationRank, ['more', 'less'], breaks)
    })

    return roboSentence;
}

function changeNeg(place, topics, measure) {
    let changeNeg
    if (topics[2]) {
        let changeNeg = place[topics[0]][topics[1]][measure[2]?'perc':'value']['change'][measure[2]?measure[3]:"all"] < 0
    } else {
        let changeNeg = place[topics[0]][topics[1]]['abVal'] < 0
    }
    return changeNeg
}

// A variable that keeps track if the last sentence created was change
let lastChange = false

// Removes the smallest value in array
function removeHigh(arr){
    arr = arr.slice(); //copy the array
    arr.splice( arr.indexOf(Math.min.apply(null, arr)),1)
    return arr;
}

function isXYearChange(dataSelect, topics, AB) {
    let trueFalse;

    // If the topic is percentage based find the out if the top rank variable is change 
    if (topics[2].slice(0, 4)=="perc") {

        // Is it the second sentence of the same topic (Bullets)
        if (AB=="B") {

            // Create one array for all the % values within 2011 object and one array for change object 
            let arr2011Abs = [];
            let arrChangeAbs = [];
            Object.values(dataSelect['2011']).forEach(e => arr2011Abs.push(Math.abs(e)));
            Object.values(dataSelect['change']).forEach(e => arrChangeAbs.push(Math.abs(e)));

            if (lastChange==true) {arrChangeAbs = removeHigh(arrChangeAbs)} else {arr2011Abs = removeHigh(arr2011Abs)}

            // If the lowest rank of the change array is lower than lowest of 2011 isChange is true 
            if (Math.min(...arr2011Abs)>Math.min(...arrChangeAbs)) {
                intro = !(intro==true);
                trueFalse = true
            } else {trueFalse = false}
        } else {

            // Create one array for all the % values within 2011 object and one array for change object 
            let arr2011Abs = [];
            let arrChangeAbs = [];
            Object.values(dataSelect['2011']).forEach(e => arr2011Abs.push(Math.abs(e)));
            Object.values(dataSelect['change']).forEach(e => arrChangeAbs.push(Math.abs(e)));

            // If the lowest rank of the change array is lower than lowest of 2011 isChange is true 
            if (Math.min(...arr2011Abs)>Math.min(...arrChangeAbs)) {
                intro = !(intro==true);
                trueFalse = true
            } else {trueFalse = false}
        }

    } 
    // For non-perc based topics we only need to compare rank of 'all' data 
    else if (Math.abs(dataSelect['2011'].all)>Math.abs(dataSelect['change'].all)) {
        intro = !(intro==true);
        trueFalse = true
    } else {trueFalse = false}

    // Keep track of whether change for next sentence to be generated
    if (trueFalse == true) {lastChange = true} else {lastChange = false}

    return trueFalse
}

function isXYearChangeOLD(dataSelect, topics) {
    let trueFalse;
    let currentData;
    let changeData;

    // topics[2] checks whether function is not called by the priorities ranking
    if (topics[2]?topics[2].slice(0, 4)=="perc":false) {

        let arr2011Abs = [];
        Object.values(dataSelect['2011']).forEach(e => arr2011Abs.push(Math.abs(e)));
        currentData = Math.min(...arr2011Abs);

        let arrChangeAbs = [];
        Object.values(dataSelect['change']).forEach(e => arrChangeAbs.push(Math.abs(e)));
        changeData = Math.min(...arrChangeAbs);

    } else if (topics[2]) {
        currentData = Math.abs(dataSelect['2011'].all);
        changeData = Math.abs(dataSelect['change'].all);    
    } 
    if (topics[2]?(currentData>changeData):(dataSelect['label'].split("_")[2]=="change")) {
        intro = !(intro==true);
        trueFalse = true
    } else {trueFalse = false}

    return trueFalse
}

function topicify(dataSelect, topics, isChange, AB) {
    let topicExpanded;
    let isSize = false;
    let isPerc = false;
    let profHighest;

    // If topic is % based
    if (topics[2].slice(0, 4)=="perc") {

        isPerc = true


        let keyss = Object.keys(dataSelect[isChange?"change":"2011"])

        let kevVals = keyss.map((keyss) => {return dataSelect[isChange?"change":"2011"][keyss]})

        var sortable = [];
        for (var obj in dataSelect[isChange?"change":"2011"]) {
            sortable.push([obj, dataSelect[isChange?"change":"2011"][obj]]);
        }

        sortable.sort(function(a, b) {
            return Math.abs(a[1]) - Math.abs(b[1]);
        });

        profHighest = keyss.reduce((a, b) => Math.abs(dataSelect[isChange?"change":"2011"][a]) < Math.abs(dataSelect[isChange?"change":"2011"][b]) ? a : b)

        if  (dataSelect['label']?(dataSelect['label'].split("_")[0] == "age10yr"):(topics[1] == "age10yr")) {
            topicExpanded = " proportion of " + profHighest +  " year olds"
        }
        else if  (dataSelect['label']?(dataSelect['label'].split("_")[0] == "health"):(topics[1] == "health")) {
            topicExpanded = " proportion of residents in " + profHighest +  " health"
        }
        else if  (dataSelect['label']?(dataSelect['label'].split("_")[0] == "economic"):(topics[1] == "economic")) {
            topicExpanded = " proportion of " + profHighest +  " residents"
        }
        else if  (dataSelect['label']?(dataSelect['label'].split("_")[0] == "ethnicity"):(topics[1] == "ethnicity")) {
            topicExpanded = " proportion of residents of " + profHighest +  " ethnicity"
        }
        else {
            topicExpanded = (dataSelect['label']?dataSelect['label'].split("_")[0]:topics[1])
        }
    }

    // If topic is value based
    if (topics[2].slice(0, 5)=="value") {
        if  (dataSelect['label']?(dataSelect['label'].split("_")[0] == "density"):(topics[1] == "density")) {
            topicExpanded = "population density"
        }
        else if  (dataSelect['label']?(dataSelect['label'].split("_")[0] == "agemed"):(topics[1] == "agemed")) {
            topicExpanded = "median age"

        }
        else if  (dataSelect['label']?(dataSelect['label'].split("_")[0] == "population"):(topics[1] == "population")) {
            topicExpanded = "population"
            isSize = true;
        }
        else {
            topicExpanded = (dataSelect['label']?dataSelect['label'].split("_")[0]:topics[1])
        }
    }

    return [topicExpanded, isSize, isPerc, profHighest]
}

function topicifyOLD(dataSelect, topics, isChange) {
    let topicExpanded;
    let isSize = false;
    let isPerc = false;
    let profHighest;
    if (topics[2]?(topics[2].slice(0, 4)=="perc"):(dataSelect['label'].split("_")[1]=="perc")) {
        isPerc = true
        if (topics[2]) {
            profHighest = Object.keys(dataSelect[isChange?"change":"2011"]).reduce((a, b) => Math.abs(dataSelect[isChange?"change":"2011"][a]) < Math.abs(dataSelect[isChange?"change":"2011"][b]) ? a : b)
        } else {profHighest=dataSelect['label'].split("_")[3]}

        if  (dataSelect['label']?(dataSelect['label'].split("_")[0] == "age10yr"):(topics[1] == "age10yr")) {
            topicExpanded = " proportion of " + profHighest +  " year olds"
        }
        else if  (dataSelect['label']?(dataSelect['label'].split("_")[0] == "health"):(topics[1] == "health")) {
            topicExpanded = " proportion of residents in " + profHighest +  " health"
        }
        else if  (dataSelect['label']?(dataSelect['label'].split("_")[0] == "economic"):(topics[1] == "economic")) {
            topicExpanded = " proportion of " + profHighest +  " residents"
        }
        else if  (dataSelect['label']?(dataSelect['label'].split("_")[0] == "ethnicity"):(topics[1] == "ethnicity")) {
            topicExpanded = " proportion of residents of " + profHighest +  " ethnicity"
        }
        else {
            topicExpanded = (dataSelect['label']?dataSelect['label'].split("_")[0]:topics[1])
        }
    }

    if (topics[2]?(topics[2].slice(0, 5)=="value"):(dataSelect['label'].split("_")[1]=="value")) {
        if  (dataSelect['label']?(dataSelect['label'].split("_")[0] == "density"):(topics[1] == "density")) {
            topicExpanded = "population density"
        }
        else if  (dataSelect['label']?(dataSelect['label'].split("_")[0] == "agemed"):(topics[1] == "agemed")) {
            topicExpanded = "median age"

        }
        else if  (dataSelect['label']?(dataSelect['label'].split("_")[0] == "population"):(topics[1] == "population")) {
            topicExpanded = "population"
            isSize = true;
        }
        else {
            topicExpanded = (dataSelect['label']?dataSelect['label'].split("_")[0]:topics[1])
        }
    }
    return [topicExpanded, isSize, isPerc, profHighest]
}


function parentify(place) {
    let article = (place.parents[place.parents.length - 1].name == "London"| place.parents[place.parents.length - 1].name == "England and Wales"? " " : " the ");
    return article + place.parents[place.parents.length - 1].name;
}

function changify(currentChange) {
    let adjective;
    if (currentChange=="change") {
        adjective = "fastest-growing";
    }
    else if (currentChange=="2011") {
        adjective = "highest";
    }
    return adjective;
}

function rankify(place, topic) {
    let ranks = ["", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth"]
    return ranks[Math.floor(Math.random() * 9)]
}

export { sentGenerator };
