//@ts-check

/* CONSTANTS */

// Localized versions of a substrings used in question text	
var EMLOCALE = Object.freeze({
    TRUE: "TRUE", // "true"
    FALSE: "FALSE", // "false"
    SHARE: "SHARE", //User decided to "share" the story
    SHARED_BY: "SHARED_BY",
    NOSHARE: "NOSHARE", //User decided to "NOT share" the story
    NOSEE_OR_NOSHARE: "NOSEE_OR_NOSHARE", //User either didn't see or decided to not share the story,
    NOSEE: "NOSEE", //User didn't see the story
    HERE: "HERE", // See "here",
    VER_FAKED: "VER_FAKED", //"In fact, it was faked/photoshopped by us."
    VER_TRUE: "VER_TRUE", //"See here for the original news article."
    VER_FALSE: "VER_FALSE" // See here for a fact-check
});

// Names of dictionaries where we store WHICH images to show in each round,
// as well as user's responses to them (where necessary).
var EMDICT = Object.freeze({
    SHARING_CHOICES: "sharing_choices", //dict of sharing_choices (sharer or receiver)
    PRIORS: "priors", //dict of own priors (sharer or receiver)
    SHARER_PRIORS: "sharer_priors", // dict of sharer's priors (receiver only)
    SHARER_MSGS: "sharer_msgs", // msgs sharer passes along with sharing choices. 
    SIGNALS: "signals", // dict of signals shown to the sharer
    LINK_CLICKS: "link_clicks" // How often was each link clicked.
});

var EMQLIST = Object.freeze({
    IMAGES: "images", //Array of images (and properties) to be shown to the user.
    S_EXP: "exp_list", //Ask explanations for these images.
    S_SVB: "svb_list", // elicit credibility threshold (directly or indirectly) for these images
    S_VIR: "virality_list", // ask if these images were seen before
    R_RSB: "rev_beliefs_list", // elicit posterior after revealing sharer's beliefs (RSB, RSBB)
    R_RSC: "rev_share_list", // elicit posterior after revealing sharering choice (RSO, RSNS)
    R_SW: "signal_weak_list", // elicit posterior after revealing a weak signal (SW)
    R_SS: "signal_strong_list" // elicit posterior after revealing a strong signal (SS)
});

//Other constants in embedded data
var EMMISC = Object.freeze({
    SURVEY_TYPE: "survey_type", // One of "sharer" or "receiver" (case insensitive)
    IMG_DB_URL: "img_db_url", //Location where this survey's images will be loaded from.
    WEAK_SIGNAL: "weak_signal", // Strength/ diagnosticity of the "weaker" signal
    STRONG_SIGNAL: "strong_signal", // Diagnosticity of the "stronger" signal
    QUESTION_TYPE: "question_type", // The type of question (set as em.data at the start of each block).
    IS_SET: "is_set", // whether we have decided which images to show in each round.
    PAGE: "page", // Whether this (veracity) page shows list of true or false stories 
    MAXQ: 20, // length of the priors / sharing_choices round.
    Q_NO_SEE: "q_no_see" // Probability with which we change the label of a "no share" to "no see"
});

var EMSURVEYTYPE = Object.freeze({
    SHARER: "sharer",
    RECEIVER: "receiver",
    RECEIVER_SIMPLIFIED: "receiver_simplified",
    FOLLOW_UP: "follow_up"
});

class EmbeddedData {

    // Just a wrapper to get a variable from embedded data.
    static getValue(varName) {
        //@ts-ignore
        return Qualtrics.SurveyEngine.getEmbeddedData(varName);
    }

    static getSurveyType() {
        let st = EmbeddedData.getValue(EMMISC.SURVEY_TYPE);
        if (Object.values(EMSURVEYTYPE).includes(st)) {
            return st;
        }
        return null;
    }

    //Whether the object is a valid (if empty) array or dictionary. 
    static isObj(obj) {
        //return obj && typeof (obj) == "object" && !Array.isArray(obj)
        return obj && typeof (obj) == "object"
    }

    // Retrieve a JSON object that was stored as Qualtrics embedded-data
    static getObj(objName) {
        // @ts-ignore
        var embedStr = EmbeddedData.getValue(objName);
        var obj = JSON.parse(embedStr);
        if (!EmbeddedData.isObj(obj)) {
            console.error(`ERROR: embedded data ${objName} is not a valid dictionary.`);
        }
        return (obj);
    }

    // Save a JSON object as qualtrics embedded data.
    static saveObj(objName, objVal) {
        //@ts-ignore
        Qualtrics.SurveyEngine.setEmbeddedData(objName, JSON.stringify(objVal));
    }

}