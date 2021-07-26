import robojournalist from "robojournalist";
import { sentGenerator } from './robo_utils.js';
import strings from './robo-strings/report-strings.csv';
import topicLookup from './data/topicLookup.js';

// Transform robo string csv to object
let roboStrings = {};
strings.forEach(d => {roboStrings[d.varCode] = d.template;});

// This function creates a headline a subheading 
function headGenerator(place, dataSelect) {

    let selectors = dataSelect.label.split("_")
    if (selectors[4]) {
        selectors[3] = selectors[3] + "_"+selectors[4]
        selectors[4] = null
    }
    let keyWord = selectors[0] + "_" + selectors[3];
    let topic = topicLookup[keyWord][dataSelect.abVal>0?'positive':'negative'];

    let roboSentence1 = robojournalist(roboStrings["headline_"+topic[0]], {
        topic: topic[1],
        ladName: place.name,
    })

    let thisTopic = dataSelect['label'].split("_")[0]
    let thisRankType = (thisTopic=="population")? "value_rank_local" : "perc_rank_local";

    // Find substring to remove last character (fullstop) and add comma clause 
    let roboSentence2 = sentGenerator(place, ["data", thisTopic, thisRankType], 0).substring(0, sentGenerator(place, ["data", thisTopic, thisRankType], 0).length - 1) + ", according to 2011 Census."
    
    return [roboSentence1, roboSentence2];
}

export { headGenerator };