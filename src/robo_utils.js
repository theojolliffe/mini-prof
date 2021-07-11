import { types, codes } from "./config";
import robojournalist from "robojournalist";
import { adjectify, uncap1, regionThe, ordinal_suffix_of } from './robo_utils_pure_functions.js';
import strings from './robo-strings/robo-strings.csv';

// Transform csv to object
let roboStrings = {};
strings.forEach(d => {roboStrings[d.varCode] = d.template;});

// A variable to keep track of previous sentence
let intro = true;

function headlineTopic(dataSelect) {
    let topic2;
    let keyWord = dataSelect[0].label.split("_")[3];
    let keyWord2 = dataSelect[0].label.split("_")[0];

    if (keyWord=="good") {
        topic2 = "Good health"
    } else if (keyWord=="bad") {
        topic2 = "Poor health"
    } else if (keyWord=="fair") {
        topic2 = "Fair health"
    } else if (keyWord=="asian") {
        topic2 = "Proportion of Asian residents"
    } else if (keyWord=="black") {
        topic2 = "Proportion of black residents"
    } else if (keyWord=="white") {
        topic2 = "Proportion of white residents"
    } else if (keyWord=="mixed") {
        topic2 = "Proportion of residents of mixed ethnicity"
    } else if (keyWord=="self-employed") {
        topic2 = "Rate of self-employed"
    } else if (keyWord=="employee") {
        topic2 = "Employment rate"
    } else if (keyWord=="inactive") {
        topic2 = "Economic inactivity"
    } else if (keyWord=="unemployed") {
        topic2 = "Unemployment"
    } else if (keyWord=="students") {
        topic2 = "Proportion of students"
    } else if (keyWord=="all") {
        if (keyWord2=="popuation") {
            topic2 = "Population"
        } else if (keyWord=="agemed") {
            topic2 = "Average age"
        }
    }
    return topic2
}

// This function creates sentences in single chunks for the first section 
function headGenerator(place) {

    // Find the highest rank that is change
    let dataSelect = [];
    for (let i=0; i<20; i++) {
        if ("change" == place['Priorities'][i]['label'].split("_")[2]) {
            // Less interested in these groups, this will be expanded into a more general rule for prioritising certain topics
            if (place['Priorities'][i]['label'].split("_")[0] == "age10yr" | place['Priorities'][i]['label'].split("_")[0] == "travel" | place['Priorities'][i]['label'].split("_")[0] == "tenure" | place['Priorities'][i]['label'].split("_")[0] == "density") {
                place['Priorities'][i].sqrt = place['Priorities'][i].sqrt + 5;
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

    let topic = headlineTopic(dataSelect);

    let roboSentence1 = robojournalist(roboStrings["headline_2"], {
        topic: topic,
        declinesRises: dataSelect[0].abVal<0?"falls":"rises",
        ladName: place.name,
    })

    let thisTopic = dataSelect[0]['label'].split("_")[0]
    let thisRankType = (thisTopic=="population")? "value_rank_local" : "perc_rank_local";

    let roboSentence2 = sentGenerator(place, ["data", thisTopic, thisRankType], 0)
    
    console.log("*****************isChange dataSelect", dataSelect)

    return [roboSentence1, roboSentence2];
}


// This function creates sentences in single chunks for the first section 
function sentGenerator(place, topics, pNum) {
    console.log("Topics", topics)

    let dataSelect = place
    for (let i = 0; i < topics.length; i++)  {
        dataSelect = dataSelect[topics[i]]
    }

    // Function returns boolean depending on whether 
    let isChange = isXYearChange(dataSelect, topics);
    let measure = topicify(dataSelect, topics, isChange);
    let ordSuf = (dataSelect['label']?dataSelect['value']:dataSelect[isChange?"change":"2011"][measure[2]?measure[3]:"all"]);
    let nationRank = (dataSelect['label']?place['data'][dataSelect['label'].split("_")[0]][dataSelect['label'].split("_")[1]][isChange?"change":"2011"][measure[2]?measure[3]:"all"]:place['data'][topics[1]][topics[2].substring(0, topics[2].length - 6)][isChange?"change":"2011"][measure[2]?measure[3]:"all"]);
    let parentName = place.parents[0].name

    let breaks = []; for (let i=0; i<10; i++) {breaks.push(Math.round((i * ((place.type=="wd")?8056:336)) / 10))}
    let LocalBreaks = []; for (let i=0; i<10; i++) {LocalBreaks.push(Math.round(i * place.siblings.length / 10))}

    let topTen = Math.abs(ordSuf)<=10;

    let changeValue = topics[2]?(measure[2]?place[topics[0]][topics[1]]["perc"]["change"][measure[3]]:false):(measure[2]?place[topics[0]][topics[1]]["abVal"][measure[3]]:false);
    console.log("changeValue", changeValue)
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

     console.log("roboSentence", roboSentence)

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

function isXYearChange(dataSelect, topics) {
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

    //  
    if (topics[2]?(currentData>changeData):(dataSelect['label'].split("_")[2]=="change")) {
        intro = !(intro==true);
        trueFalse = true
    } else {trueFalse = false}

    return trueFalse
    }

function topicify(dataSelect, topics, isChange) {
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

export { sentGenerator, headGenerator };