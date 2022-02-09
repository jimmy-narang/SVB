//@ts-check

/**
 * Subset of image-based questions in our surveys that need Javascript actions. 
 * The Enum value MUST BE stored as the attribute 'data-qtype' in the <img> tag. 
 */
var QTYPE = Object.freeze({

    // Question types common to both sharers and receivers survey
    C_PRIOR: 'C_PRIOR', //respondent's prior about a story, 0-100%
    C_PRIOR_BIN: 'C_PRIOR_BIN', //respondent's prior about a story, binary
    C_VERACITY: "C_VERACITY", // Final section, where the story's truth is revealed.

    // Questions from the sharers survey
    S_SHARE: 'S_SHARE', //sharer's sharing choice,
    S_EXPLANATION: 'S_EXPLANATION', //sharer's explanation
    S_SVB_DIRECT: "S_SVB_DIRECT", //Ask for credibility threshold directly
    S_SVB_INDIRECT: "S_SVB_INDIRECT", //Ask for credibility threshold indirectly 
    S_VIRALITY: "S_VIRALITY", //Ask if they've seen it before

    // Questions from the receivers survey
    R_POST_RSB: 'R_POST_RSB', //Receiver's posterior after {R}evealing {S}harer's {B}elief.
    R_POST_RSBB: 'R_POST_RSBB', //Receiver's posterior after {R}evealing {S}harer's {B}elief in {B}inary form.
    R_POST_RSO: 'R_POST_RSO', //Receiver's posterior after {R}evealing {S}harer's decision ONLY if they {S}hared the story.
    R_POST_RSNS: 'R_POST_RSNS', //Receiver's posterior after {R}evealing  {S}harer's decision either way: {S}hare/{N}ot share.
    R_POST_SW: 'R_POST_SW', //Receiver's posterior after seeing a (weak) signal 
    R_POST_SS: 'R_POST_SS' //Receiver's posterior after seeing a (strong) signal
});

/**
 * PLACEHOLDERS: These blanks -- wherever found in QUESTION TEXT -- get replaced 
 * with localized strings that describe the sharer's choice/belief etc.
 */
var BLANK = Object.freeze({
    PRIOR: "_____",
    SHARING_CHOICE: "-----",
    SHARER_PRIOR: "XXXXX",
    LINKS: "--here--",
    VERACITY: "*****"
});


class ImgQuestion {

    /**
     * Initialize with a handle to the question object OR the question ID.
     * @param {string} QID the Qualtrics question ID.
     */
    constructor(QID, imgProp = null, loadImg = false) {

        this.QID = QID;

        // @ts-ignore. Confirm this is a valid Qualtrics question.
        this.DOM = jQuery('#' + QID)[0];
        if (!this.DOM) {
            throw new TypeError(`no QID ${QID} found`);
        }
        let questionId = this.DOM.getAttribute('questionid');
        if (!questionId || questionId != QID) {
            throw new TypeError(`QID ${QID} does not match questionid ${questionId}`);
        }

        if (imgProp) {
            this._imgProp = imgProp;
        } else {
            // Try loading through data-imgid
            let images = EmbeddedData.getObj(EMQLIST.IMAGES);
            console.log("trying to load imgID from attribute data-imgid")
            let img_id = this.getImgAttribute('data-imgid');
            let matches = images.filter(x => x.qualtricsURL == img_id)
            if (matches && matches.length > 0) {
                this._imgProp = matches[0];
            } else {
                // Try searching by source URL
                console.log("trying to load imgID from attribute src")
                let src = this.getImgAttribute('src')
                let matches = images.filter(x => x.qualtricsURL == src)
                if (matches && matches.length > 0)
                    this._imgProp = matches[0];
                else {
                    console.warn('No img properties found for ' + this.QID + ". Defaulting to placeholder");
                    this._imgProp = {
                        imgID: "placeholder"
                    };
                }
            }
        }

        if (loadImg) {
            this.loadImageIntoQ();
        }

    }

    // Get image attribute
    getImgAttribute(attribute) {
        return this.DOM.getElementsBySelector(" .QuestionText Img")[0].getAttribute(attribute);
    }

    // Return a binary signal about veracity that's accurate with probability p
    static generateSignal(p, veracity) {
        var signal = (Math.random() < p) ? true : false;
        return (veracity) ? signal : !signal;
    }

    get qType() {
        return EmbeddedData.getValue(EMMISC.QUESTION_TYPE);
        //TODO: if not available, try inferring through data-qtype
    }

    // The getters below extract values from DOM

    get questionText() {
        return this.DOM.getElementsBySelector(" .QuestionText")[0].innerHTML
    }

    get response() {

        switch (this.qType) {

            // Binary radio button
            case QTYPE.C_PRIOR_BIN:
                // @ts-ignore
                return parseInt(jQuery("#" + this.QID + " :checked").val()) == 1;

                // Slider question
            case QTYPE.C_PRIOR:
            case QTYPE.R_POST_RSNS:
            case QTYPE.R_POST_RSO:
            case QTYPE.R_POST_RSB:
            case QTYPE.R_POST_SW:
            case QTYPE.R_POST_SS:
                // @ts-ignore
                return jQuery("#" + this.QID + " input").val();

                // Checkbox question with one option
            case QTYPE.S_SHARE:
                // @ts-ignore
                return jQuery("#" + this.QID + " :checked").length;

            default:
                return null;
        }
    }

    get imgProperties() {
        return this._imgProp;
    }

    get imgID() {
        return this._imgProp.imgID;
    }

    set imgProperties(value) {
        //TODO: check if value is valid imgProperties type
        if (value) {
            this._imgProp = value;
            this.loadImageIntoQ();
        }
    }

    // Set question text.    
    set questionText(str) {
        this.DOM.getElementsBySelector(" .QuestionText")[0].innerHTML = str;
    }

    loadImageIntoQ() {
        let that = document.querySelector("[id='" + this.QID + "'] img");
        // @ts-ignore
        that.src = this.imgProperties.qualtricsURL;
        // @ts-ignore
        that.style = this.imgProperties.style;
        that.setAttribute("data-imgid", this.imgID);
    }

    /* EVENT HANDLERS */

    //Applicable to Receivers
    onLoadSignalQ() {

        // Generate the signal
        let sType = (this.qType == QTYPE.R_POST_SW) ? EMMISC.WEAK_SIGNAL : EMMISC.STRONG_SIGNAL
        var signalStrength = parseFloat(EmbeddedData.getValue(sType));
        var signal = ImgQuestion.generateSignal(signalStrength, this.imgProperties.veracity);
        console.log(`Generated signal ${signal} of diagnosticity ${signalStrength} for ${this.imgID}`)

        // Store the signal
        var signals = EmbeddedData.getObj(EMDICT.SIGNALS);
        signals[this.imgID] = signal;
        EmbeddedData.saveObj(EMDICT.SIGNALS, signals);

        // Show the generated signal along with a reminder of the receiver's prior.
        var prior = EmbeddedData.getObj(EMDICT.PRIORS)[this.imgID];
        this.questionText = this.questionText.replace(BLANK.PRIOR, prior);
    }

    //Applicable to Receivers, except in the case of sharer's explanations.
    onLoadRevealedShareQ() {

        var sc = EmbeddedData.getObj(EMDICT.SHARING_CHOICES)[this.imgID];
        var scStr = '';
        var prior = null;

        switch (this.qType) {

            case QTYPE.R_POST_RSO:
                scStr = (sc) ? EmbeddedData.getValue(EMLOCALE.SHARE) : EmbeddedData.getValue(EMLOCALE.NOSEE);
                //No Break!

            case QTYPE.R_POST_RSNS:
                scStr = (sc) ? EmbeddedData.getValue(EMLOCALE.SHARE) : EmbeddedData.getValue(EMLOCALE.NOSHARE);
                prior = EmbeddedData.getObj(EMDICT.PRIORS)[this.imgID];
                this.questionText = this.questionText.replace(BLANK.PRIOR, prior).replace(BLANK.SHARING_CHOICE, scStr);
                break;

            default:
                throw new TypeError("Revealed-share handler called for invalid question type " + this.qType);
        }

    }

    //Applicable to Receivers, except in the case of sharer's explanations.
    onLoadRevealedBeliefQ() {

        // @ts-ignore
        var sc = EmbeddedData.getObj(EMDICT.SHARING_CHOICES)[this.imgID];
        // @ts-ignore
        var scStr = '';
        var prior = null;

        switch (this.qType) {

            case QTYPE.R_POST_RSB:
                prior = EmbeddedData.getObj(EMDICT.PRIORS)[this.imgID];
                var sp = EmbeddedData.getObj(EMDICT.SHARER_PRIORS)[this.imgID];
                this.questionText = this.questionText.replace(BLANK.PRIOR, prior).replace(BLANK.SHARER_PRIOR, sp);
                break;

            case QTYPE.R_POST_RSBB:
                prior = EmbeddedData.getObj(EMDICT.PRIORS)[this.imgID];
                var sp = EmbeddedData.getObj(EMDICT.SHARER_PRIORS)[this.imgID];
                this.questionText = this.questionText.replace(BLANK.PRIOR, prior).replace(BLANK.SHARER_PRIOR, sp);
                break;

            default:
                throw new TypeError("Revealed-belief handler called for invalid question type");
        }

    }

    //Reveal if the story was actually true or false, and list references.
    onLoadVeracityQ() {

        // Get the locale-specific, formatted strings for "here", "true", "false" etc.
        let here_lc = EmbeddedData.getValue(EMLOCALE.HERE);
        let ver_lc = (this.imgProperties.veracity) ? EmbeddedData.getValue(EMLOCALE.TRUE) : EmbeddedData.getValue(EMLOCALE.FALSE);
        let new_txt = this.questionText.replace(BLANK.VERACITY, ver_lc) + '<br>';

        // In addition to the story's veracity, we also need to include links to the fact-check, source article, etc.
        let links = this.imgProperties.externalURLs.map((url, i) =>
            `<a href=${url} rel="noopener noreferrer nofollow" target="_blank" class="veracity_link" id="link~${this.imgID}~${i}">${here_lc}</a>`).join(', ');

        let style = "";
        if (this.imgProperties.veracity) {
            style = "5px solid #00ff00;"
            new_txt = new_txt + EmbeddedData.getValue(EMLOCALE.VER_TRUE);
        } else {
            style = "5px solid #ff0000;"
            let fake_str = (this.imgProperties.fakedByUs) ? EmbeddedData.getValue(EMLOCALE.VER_FAKED) : EmbeddedData.getValue(EMLOCALE.VER_FALSE)
            new_txt = new_txt + fake_str;
        }
        this.questionText = new_txt.replace(BLANK.LINKS, links);

        //@ts-ignore
        jQuery('#' + this.QID + " img").css({
            'border': style
        })
    }


    onLoadExplanationQ() {
        var sc = EmbeddedData.getObj(EMDICT.SHARING_CHOICES)[this.imgID];
        var scStr = (sc) ? EmbeddedData.getValue(EMLOCALE.SHARE) : EmbeddedData.getValue(EMLOCALE.NOSHARE);
        this.questionText = this.questionText.replace(BLANK.SHARING_CHOICE, scStr);
    }

    onLoadSharingQ() {
        // Nothing to do.
    }

    onLoadPriorQ() {
        // Nothing to do.
    }

    // Event handler for when a question is loaded.
    onLoadQuestion() {

        switch (this.qType) {

            case QTYPE.R_POST_SW:
            case QTYPE.R_POST_SS:
                this.onLoadSignalQ();
                return;

            case QTYPE.R_POST_RSNS:
            case QTYPE.R_POST_RSO:
                this.onLoadRevealedShareQ();
                return;

            case QTYPE.R_POST_RSB:
            case QTYPE.R_POST_RSBB:
                this.onLoadRevealedBeliefQ();
                return;

            case QTYPE.S_EXPLANATION:
                this.onLoadExplanationQ();
                return;

            case QTYPE.S_SHARE:
                this.onLoadSharingQ();
                return;

            case QTYPE.C_PRIOR:
            case QTYPE.C_PRIOR_BIN:
                this.onLoadPriorQ();
                return;

            case QTYPE.C_VERACITY:
                this.onLoadVeracityQ();
                return;

            default:
                //Do nothing
                return;
        }
    }

}