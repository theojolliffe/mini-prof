import { types, codes } from "./config";
import robojournalist from "robojournalist";
import { regionThe, ordinal_suffix_of } from './robo_utils_pure_functions.js';


/////////// PARAGRAPH ////////////
function sentGenerator(place, topic) {
    console.log("Place", place)
    console.log("Topic", topic)

    // determine if percentage or value should be compared
    let catType = (place.data[topic].perc_rank && topic!="population"? "perc_rank":"value_rank")

    // determine if current or change is higher rank
    let currentChange = (place.data[topic][catType]['2011'].all>place.data[topic][catType]['change'].all?"change":"2011");
    
    let sentence = place.name + " has the " + rankify(place, topic) +  " " + changify(currentChange) + " "  + topicify(place, topic, currentChange, catType) + " of any " + types[place.type].name.toLowerCase() + " in " + robojournalist('{place ^regionThe}', {place: place.parents[place.parents.length - 1].name, regionThe }) + "."

    return sentence;
}

function topicify(place, topic, currentChange, catType) {
    let topicExpanded;
    if (catType=="perc_rank") {
        let profRang = place.data[topic].perc_rank[currentChange]
        let profHighest = Object.keys(profRang).reduce((a, b) => profRang[a] < profRang[b] ? a : b)
        let profLowest = Object.keys(profRang).reduce((a, b) => profRang[a] > profRang[b] ? a : b)
        if (topic == "age10yr") {
            topicExpanded = " proportion of " + profHighest +  " year olds"
        }
        else if (topic == "health") {
            topicExpanded = " proportion of residents in " + profHighest +  " health"
        }
        else if (topic == "economic") {
            topicExpanded = " proportion of " + profHighest +  " residents"
        }
        else if (topic == "ethnicity") {
            topicExpanded = " proportion of " + profHighest +  " residents"
        }
        else {
            topicExpanded = topic
        }
    }

    if (catType=="value_rank") {
        if (topic == "density") {
            topicExpanded = "population density"
        }
        else if (topic == "agemed") {
            topicExpanded = "median age"
        }
        else {
            topicExpanded = topic
        }
    }

    return topicExpanded
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