//@ts-check


if (typeof (d3) !== "function") {
    jQuery.getScript("https://d3js.org/d3.v7.min.js");
}
if (typeof (EmbeddedData) !== "function") {
    jQuery.getScript("https://cdn.jsdelivr.net/gh/jimmy-narang/SVB@main/EmbeddedData.js");
}
if (typeof (ImgProperties) !== "function") {
    jQuery.getScript("https://cdn.jsdelivr.net/gh/jimmy-narang/SVB@main/ImgProperties.js");
}
if (typeof (ImgQuestion) !== "function") {
    jQuery.getScript("https://cdn.jsdelivr.net/gh/jimmy-narang/SVB@main/ImgQuestionStatic.js");
}


let is_set = ImgProperties.toBoolean(EmbeddedData.getValue(EMMISC.IS_SET));
let load_images = false;
var images = EmbeddedData.getDict(EMDICT.IMAGES);

if (!is_set) {

    /*
    if(load_images){
        console.log("is_set is false; loading images from gDrive");

        var linkToImgDB = EmbeddedData.getValue(EMMISC.IMG_DB_URL);
        console.log("Fetching images data from " + linkToImgDB);
        let images_raw = await ImgProperties.getImgDB(linkToImgDB);
    
        // Filter out images with missing metadata; shuffle the rest.
        var images = d3.shuffle(images_raw.filter(d => 
            d.imgID && 
            d.qualtricsID && 
            d.qualtricsID.startsWith("IM_") 
            && d.veracity != null));
    
        EmbeddedData.saveDict(EMDICT.IMAGES, images);    
    }
    */

    console.log("Creating image lists for other rounds");

    // temporary array that gets chopped up to assign images to each round.
    let shuffled = d3.shuffle(images);
    var list_map = null;

    if (EmbeddedData.getSurveyType() == EMSURVEYTYPE.SHARER) {
        // This is a sharer's survey
        list_map = new Map([
            [EMQLIST.S_EXP, EMMISC.MEDQ],
            [EMQLIST.S_SVB, EMMISC.MEDQ],
            [EMQLIST.S_VIR, EMMISC.MEDQ]
        ]);
    } else if (EmbeddedData.getSurveyType() == EMSURVEYTYPE.RECEIVER) {
        // This is a receiver's survey
        list_map = new Map([
            [EMQLIST.R_RSB, EMMISC.MEDQ],
            [EMQLIST.R_RSC, EMMISC.MEDQ],
            [EMQLIST.R_SW, EMMISC.MEDQ],
            [EMQLIST.R_SS, EMMISC.MEDQ],
        ]);
    }

    if (list_map) {
        list_map.forEach((value, key) => {
            let arr = shuffled.splice(0,value);
            EmbeddedData.saveDict(key, arr);
            console.log("For " + key + ", saved " + arr);
        });
    }

    // Done. set is_set
    Qualtrics.SurveyEngine.setEmbeddedData(EMMISC.IS_SET, 1);
}


function loadImageIntoQ(QID, imgProp) {
    // Clear any pre-existing image
    // Traditional d3 selector does not work with IDs that start with numbers
    console.log("Loading image " + imgProp + " into " + QID);
    let that = document.querySelector("[id='" + QID + "'] img");
    that.src = imgProp.qualtricsURL;
    that.style = imgProp.style;
}


// Records every instance of when this entity ('key') was clicked
function recordTime(key, dictName){
    var dict = EmbeddedData.getDict(dictName);
    if (!dict[key]){
        dict[key] = [jQuery.now()];
    } else {
        dict[key].push(jQuery.now());
    }
    EmbeddedData.saveDict(dictName, dict);
}


// Event handler that saves the user's response in Embedded data.
function  onSubmitAnswer() {
    var qType = EmbeddedData.getValue(EMMISC.QUESTION_TYPE);
    let QID = this.id.split('~').find(x => x.includes("QID"));
    var Q = new ImgQuestion(QID, null, false);
        switch (qType) {

            case QTYPE.C_PRIOR:
            case QTYPE.C_PRIOR_BIN:
                var priors = EmbeddedData.getDict(EMDICT.PRIORS);
                priors[Q.imgID] = Q.response;
                EmbeddedData.saveDict(EMDICT.PRIORS, priors);
                recordTime(Q.imgID, EMDICT.LINK_CLICKS);
                return;

            case QTYPE.S_SHARE:
                var sc = EmbeddedData.getDict(EMDICT.SHARING_CHOICES);
                sc[Q.imgID] = Q.response;
                EmbeddedData.saveDict(EMDICT.SHARING_CHOICES, sc);
                recordTime(Q.imgID, EMDICT.LINK_CLICKS);
                return;

            //NOTE: The signal is saved onLoad(), and not onSubmit(). 
            default:
                return;
        }
    }


function loadImgQsOnPage(imgList){
    
    // Get the list of image questions on this page
    let questions = Object.values(Qualtrics.SurveyEngine.QuestionInfo).filter(
        (x) => x.QuestionText.match("<img.*>"));

        
    // If this is a Loop 'n Merge page, get the loop number 
    let cl = parseInt("${lm://CurrentLoopNumber}"); 
    console.log('Current loop no.:' + cl);
    if (isNaN(cl)) {
        //This is NOT a loop and merge page
        console.error("Invalid / empty loop number");
        cl = 0; 
    } else {
        cl = cl - 1; //L&M indexing starts at 1, not 0
    }

    // Replace image placeholders with the appropriate images 
    for (let i = 0; i < questions.length; i++) {
        let j = (questions.length * cl) + i;

        // Load into Img into Q; change the question text.
        let Q = new ImgQuestion(questions[i].QuestionID,imgList[j], true);
        Q.onLoadQuestion();        
    }

}

function loadPage() {

    // Get the current block/question type
    var qType = EmbeddedData.getValue(EMMISC.QUESTION_TYPE);
    console.log("qType is: " + qType);

    switch (qType) {

        case QTYPE.R_POST_RSB:
        case QTYPE.R_POST_RSBB: 
            loadImgQsOnPage(EmbeddedData.getDict(EMQLIST.R_RSB));
            break;

        case QTYPE.R_POST_RSNS:
        case QTYPE.R_POST_RSO:
            loadImgQsOnPage(EmbeddedData.getDict(EMQLIST.R_RSC));
            break;

        case QTYPE.R_POST_SS:
            loadImgQsOnPage(EmbeddedData.getDict(EMQLIST.R_SS));
            break;

        case QTYPE.R_POST_SW:
            loadImgQsOnPage(EmbeddedData.getDict(EMQLIST.R_SW));
            break;

        case QTYPE.S_SVB_DIRECT:
        case QTYPE.S_SVB_INDIRECT:
            loadImgQsOnPage(EmbeddedData.getDict(EMQLIST.S_SVB));
            break;

        case QTYPE.S_EXPLANATION:
            loadImgQsOnPage(EmbeddedData.getDict(EMQLIST.S_EXP));
            break;

        case QTYPE.S_VIRALITY:
            loadImgQsOnPage(EmbeddedData.getDict(EMQLIST.S_VIR));
            break;

        case QTYPE.C_PRIOR:
        case QTYPE.C_PRIOR_BIN:
        case QTYPE.S_SHARE:
        case QTYPE.C_VERACITY:
            loadImgQsOnPage(EmbeddedData.getDict(EMDICT.IMAGES));
            jQuery(".QuestionOuter input").change(onSubmitAnswer);
            break;

        default:
            console.log("IN DEFAULT: " + qType);
            break;
    }
}

Qualtrics.SurveyEngine.addOnload(function () {

    Qualtrics.SurveyEngine.setEmbeddedData("test", "test");
    console.log(Qualtrics.SurveyEngine.getEmbeddedData("test"))
    loadPage();

}); 