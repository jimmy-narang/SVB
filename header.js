//@ts-check

function loadImageIntoQ(QID, imgProp) {
    // Clear any pre-existing image
    // Traditional d3 selector does not work with IDs that start with numbers
    console.log("Loading image " + imgProp + " into " + QID);
    let that = document.querySelector("[id='" + QID + "'] img");
    // @ts-ignore
    that.src = imgProp.qualtricsURL;
    // @ts-ignore
    that.style = imgProp.style;
}

// Records every instance of when this entity ('key') was clicked
function recordTime(key) {
    var dict = EmbeddedData.getObj(EMDICT.LINK_CLICKS);
    if (!dict[key]) {
        // @ts-ignore
        dict[key] = [jQuery.now()];
    } else {
        // @ts-ignore
        dict[key].push(jQuery.now());
    }
    EmbeddedData.saveObj(EMDICT.LINK_CLICKS, dict);
}

// Event handler that saves the user's response in Embedded data.
function onSubmitAnswer() {
    var qType = EmbeddedData.getValue(EMMISC.QUESTION_TYPE);
    let QID = this.id.split('~').find(x => x.includes("QID"));
    var Q = new ImgQuestion(QID, null, false);
    switch (qType) {

        case QTYPE.C_PRIOR:
        case QTYPE.C_PRIOR_BIN:
        case QTYPE.R_PRIOR_RSCL:
        case QTYPE.R_PRIOR_RSBL:
        case QTYPE.R_PRIOR_SSL:
        
            var priors = EmbeddedData.getObj(EMDICT.PRIORS);
            priors[Q.imgID] = Q.response;
            EmbeddedData.saveObj(EMDICT.PRIORS, priors);
            return;

        case QTYPE.S_SHARE:
            var sc = EmbeddedData.getObj(EMDICT.SHARING_CHOICES);
            sc[Q.imgID] = Q.response.choice;
            EmbeddedData.saveObj(EMDICT.SHARING_CHOICES, sc);

            var s_msg = EmbeddedData.getObj(EMDICT.SHARER_MSGS);
            s_msg[Q.imgID] = Q.response.msg;
            EmbeddedData.saveObj(EMDICT.SHARER_MSGS, s_msg);
            return;

            //NOTE: The signal is saved onLoad(), and not onSubmit(). 
        default:
            return;
    }
}

function onClickLink() {
    let imgID = this.id.split('~')[1]; //The second element is the image ID
    recordTime(imgID);
}

function getLoopNumberOld() {
    // Old Method. Worked before but failing now :( 
    let cl = parseInt("${lm://CurrentLoopNumber}");
    if (isNaN(cl)) {
        console.error("Invalid / empty loop number. Setting CL to 0");
        return 0;
    } else {
        return cl - 1; //L&M indexing starts at 1, not 0
    }
}

function getLoopNumber() {
    // Loop and Merge questions have IDs of type loopnumber_xxQID 
    // @ts-ignore
    let cl = Object.keys(Qualtrics.SurveyEngine.QuestionInfo)[0].split("_")[0];
    // @ts-ignore
    if (jQuery.isNumeric(cl) && !isNaN(parseInt(cl))) {
        return parseInt(cl) - 1;
    } else {
        console.error("Invalid / empty loop number. Setting CL to 0");
        return 0;
    }
}

function loadImgQsOnPage(imgList) {

    // Get the list of image questions on this page
    // @ts-ignore
    let questions = Object.values(Qualtrics.SurveyEngine.QuestionInfo).filter(
        (x) => x.QuestionText.match("<img.*>"));

    var cl = getLoopNumber();

    // Replace image placeholders with the appropriate images 
    for (let i = 0; i < questions.length; i++) {
        let j = (questions.length * cl) + i;

        // Load into Img into Q; change the question text.
        let Q = new ImgQuestion(questions[i].QuestionID, imgList[j], true);
        Q.onLoadQuestion();
    }
}

function loadVeracityPage() {
    //@ts-ignore. Get a handle to the only (text/graphic) question on this page
    let questions = Object.values(Qualtrics.SurveyEngine.QuestionInfo).filter(x => x.QuestionType == "DB");
    let Q = new ImgQuestion(questions[0].QuestionID);
    Q.onLoadVeracityQ();
    // @ts-ignore. Add a click counter to each external link
    jQuery("a.veracity_link").click(onClickLink);
}


function loadPage() {

    // Get the current block/question type
    var qType = EmbeddedData.getValue(EMMISC.QUESTION_TYPE);
    console.log("qType is: " + qType);

    switch (qType) {

        case QTYPE.R_POST_RSB:
        case QTYPE.R_POST_RSBB:
        case QTYPE.R_PRIOR_RSBL:
            loadImgQsOnPage(EmbeddedData.getObj(EMQLIST.R_RSB));
            break;

        case QTYPE.R_POST_RSNS:
        case QTYPE.R_POST_RSO:
        case QTYPE.R_POST_RSOP:
        case QTYPE.R_PRIOR_RSCL:
            loadImgQsOnPage(EmbeddedData.getObj(EMQLIST.R_RSC));
            break;

        case QTYPE.R_POST_SS:
        case QTYPE.R_PRIOR_SSL:
            loadImgQsOnPage(EmbeddedData.getObj(EMQLIST.R_SS));
            break;

        case QTYPE.R_POST_SW:
            loadImgQsOnPage(EmbeddedData.getObj(EMQLIST.R_SW));
            break;

        case QTYPE.S_SVB_DIRECT:
        case QTYPE.S_SVB_INDIRECT:
            loadImgQsOnPage(EmbeddedData.getObj(EMQLIST.S_SVB));
            break;

        case QTYPE.S_EXPLANATION:
            loadImgQsOnPage(EmbeddedData.getObj(EMQLIST.S_EXP));
            break;

        case QTYPE.S_VIRALITY:
            loadImgQsOnPage(EmbeddedData.getObj(EMQLIST.S_VIR));
            break;

        case QTYPE.C_PRIOR:
        case QTYPE.C_PRIOR_BIN:
        case QTYPE.S_SHARE:
            loadImgQsOnPage(EmbeddedData.getObj(EMQLIST.IMAGES));
            // @ts-ignore
            jQuery(".QuestionOuter input").change(onSubmitAnswer);
            break;

        case QTYPE.C_VERACITY:
            loadVeracityPage();
            break;

        default:
            console.log("IN DEFAULT: " + qType);
            break;
    }
}

function getImgDB(data) {

    console.log(`Raw data contains ${data.length} rows`);

    // Convert each row to a standardized object 
    var images_raw = data.map((d) => {
        return {
            imgID: d.imgID,
            qualtricsID: d.qualtricsID,
            qualtricsURL: ImgProperties.toQualtricsURL(d.qualtricsID),
            externalURLs: ImgProperties.toArrayOfURLs(d.externalURLs),
            fakedByUs: ImgProperties.toBoolean(d.fakedByUs),
            veracity: ImgProperties.toBoolean(d.veracity),
            style: d.style,
            forQType: d.forQType,
            caption: d.caption
        };
    });

    // Filter out images with missing metadata; shuffle the rest.
    // @ts-ignore
    var images = d3.shuffle(images_raw.filter(d =>
        d.imgID &&
        d.qualtricsID &&
        d.qualtricsID.startsWith("IM_") &&
        d.veracity != null));

    console.log(`Final list contains ${images.length} objects`);
    // Save the list
    EmbeddedData.saveObj(EMQLIST.IMAGES, images);
    console.log("Images saved:" + JSON.stringify(EmbeddedData.getObj(EMQLIST.IMAGES)));
}


// Assign images to rounds based on values specified in the imageDB's forQType column
function assignAsSpecified(images, list_map) {
    list_map.forEach((round_length, round_name) => {
        let arr = images.filter(d => d.forQType.includes(round_name));
        EmbeddedData.saveObj(round_name, arr);
        console.log("For " + round_name + ", saved (selected) arr of length " + arr.length);
    });
}

// Assign images to rounds by shuffling and partitioning
function assignAsRandom(images, list_map) {
    // temporary array that gets chopped up to assign images to each round.
    // @ts-ignore
    let shuffled = d3.shuffle(images);
    list_map.forEach((round_length, round_name) => {
        let arr = shuffled.splice(0, round_length);
        EmbeddedData.saveObj(round_name, arr);
        console.log("For " + round_name + ", saved (random) arr of length " + arr.length);
    });
}
