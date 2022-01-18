/* CONSTANTS */

// Localized versions of a substrings used in question text	
var EMLOCALE = Object.freeze({
    TRUE: "TRUE", // "true"
    FALSE: "FALSE", // "false"
    SHARE: "SHARE", //User decided to "share" the story
    NOSHARE: "NOSHARE", //User decided to "NOT share" the story
    NOSEE: "NOSEE", //User "either didn't see or decided to not share" the story
    FAKED: "FAKED", //"In fact, it was faked/photoshopped by us."
    HERE: "HERE", // See "here"
});

// Names of dictionaries where we store WHICH images to show in each round,
// as well as user's responses to them (where necessary).
var EMDICT = Object.freeze({
    SHARING_CHOICES: "sharing_choices", //(sharer or receiver)
    PRIORS: "priors", //own priors (sharer or receiver)
    SHARER_PRIORS: "sharer_priors", // sharer's priors (receiver only)
    SIGNALS: "signals", // signals shown to the sharer
    IMAGES: "images" //the set of 20? images (and properties) to be shown to the user.
});

//Other constants in embedded data
var EMMISC = Object.freeze({
    IMG_DB_URL: "img_db_url", //Location where this survey's images will be loaded from.
    WEAK_SIGNAL: "weak_signal", // Strength/ diagnosticity of the "weaker" signal
    STRONG_SIGNAL: "strong_signal", // Diagnosticity of the "stronger" signal
    QUESTION_TYPE: "question_type" // The type of question (set as em.data at the start of each block).
});


class EmbeddedData {

    // Just a wrapper to get a variable from embedded data.
    static getValue(varName) {
        //@ts-ignore
        return Qualtrics.SurveyEngine.getEmbeddedData(varName);
    }

    //Whether the object is a valid (if empty) array or dictionary. 
    static isDict(obj) {
        //return obj && typeof (obj) == "object" && !Array.isArray(obj)
        return obj && typeof (obj) == "object" 
    }

    // Retrieve a JSON object that was stored as Qualtrics embedded-data
    static getDict(dictName) {
        // @ts-ignore
        var embedStr = EmbeddedData.getValue(dictName);
        var obj = JSON.parse(embedStr);
        if (!EmbeddedData.isDict(obj)) {
            console.error(`ERROR: embedded data ${embedStr} is not a valid dictionary. Resetting.`);
            obj = {};
        }
        return (obj);
    }

    // Save a JSON object as qualtrics embedded data.
    static saveDict(dictName, dictVal) {
        Qualtrics.SurveyEngine.setEmbeddedData(dictName, JSON.stringify(dictVal));
    }
    
}
