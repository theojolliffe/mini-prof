import {sentGenerator} from './robo_utils.js'

function getOccurrence(array, value) {
    var count = 0;
    array.forEach((v) => (v === value && count++));
    return count;
}


// Function creates top ranked bullet points 
function bullGenerator(place, pNum0, pNum) {

    let roboSentences = []
    let sentTopics = []
    let ext = 0;

    // Find the highest rank that is change
    let dataSelect = [];
    for (let i=0; i<40; i++) {
        if ("change" == place['Priorities'][i]['label'].split("_")[2] & "female" != place['Priorities'][i]['label'].split("_")[3] & "male" != place['Priorities'][i]['label'].split("_")[3]) {
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

    // Figure out topic order for n number of enteries before writing sentences
    for (let i = pNum0; i < pNum; i++) {

        // What is the next highest topic in the priority ranking
        let thisTopic = dataSelect[i+ext]['label'].split("_")[0]

        // if topic has appeared twice don't create sentence, instead reduce i to rerun loop and add value to extender to increment down priority list
        if ((getOccurrence(sentTopics, thisTopic)==2) & (sentTopics.length<6)) {

            ext = ext+1
            i = i-1
        }
        // if topic has appeared once place topic after first appearance
        if (getOccurrence(sentTopics, thisTopic)==1) {
            let indexofTopic = sentTopics.indexOf(thisTopic)
            sentTopics.splice(indexofTopic+1, 0, thisTopic)
        }
        // Add topic if hasn't already been added to topic list 
        if (getOccurrence(sentTopics, thisTopic)==0) {
            sentTopics.push(thisTopic)
        }
    }

    // Create the array of bullet points between the two paragraph numbers specified
    for (let i = 0; i < sentTopics.length; i++) {
        let thisTopic = sentTopics[i]
        let sameTopic = sentTopics[i]==sentTopics[i-1]?"B":"A";
        // Certain topics use value rank instead of % rank
        let thisRankType = (thisTopic=="population" | thisTopic=="agemed" | thisTopic=="density")? "value_rank_local" : "perc_rank_local";
        roboSentences.push({topic: thisTopic, sent: sentGenerator(place, ["data", thisTopic, thisRankType], i+ext, sameTopic)})
    }
    
    return roboSentences;
}

// Function creates top ranked bullet points 
function bullGeneratorOLD(place, dataSelect, pNum0, pNum) {

    let roboSentences = []
    let ext = 0;

    // Create the array of bullet points between the two paragraph numbers specified
    for (let i = pNum0; i < pNum; i++) {

        // What is the next highest topic in the priority ranking
        let thisTopic = dataSelect[i+ext]['label'].split("_")[0]
        // Certain topics use value rank instead of % rank
        let thisRankType = (thisTopic=="population" | thisTopic=="agemed" | thisTopic=="density")? "value_rank_local" : "perc_rank_local";
        // map array of sentence objects into array of just topics
        let transRobo = roboSentences.map((val) => {return val.topic})

        // If this topic hasn't been added to bullet list create sentence at end of array
        if (getOccurrence(transRobo, thisTopic)==0) {
            roboSentences.push({topic: thisTopic, sent: sentGenerator(place, ["data", thisTopic, thisRankType], i+ext)})
        }
        // if topic has appeared once place new sentence after first appearance
        if (getOccurrence(transRobo, thisTopic)==1) {
            let indexofTopic = transRobo.indexOf(thisTopic)
            console.log("******2nd topic bullet*****")
            roboSentences.splice(indexofTopic+1, 0, {topic: thisTopic, sent: sentGenerator(place, ["data", thisTopic, thisRankType], pNum0+indexofTopic+1, "B")})
        }
        // if topic has appeared twice don't create sentence, instead reduce i to rerun loop and add value to extender to increment down priority list
        if (getOccurrence(transRobo, thisTopic)==2) {
            ext = ext+1
            i = i-1
        }
    }
    
    return roboSentences;
}

export { bullGenerator };