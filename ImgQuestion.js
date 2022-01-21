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
    constructor(QID) {

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

        // Obtain question type from Embedded data.
        this._qType = EmbeddedData.getValue(EMMISC.QUESTION_TYPE);
        // throw new TypeError(`${this._qType} is not one of ${QTYPE}`);
        // console.error("ERROR: Img question does not appear to have a valid type");
    }

    // Get image attribute
    getImgAttribute(attribute){
        return this.DOM.getElementsBySelector(" .QuestionText Img")[0].getAttribute(attribute);
    }


    // Return a binary signal about veracity that's accurate with probability p
    static generateSignal(p, veracity) {
        var signal = (Math.random() < p) ? true : false;
        return (veracity) ? signal : !signal;
    }

    // The getters below extract values from DOM

    get qType() {
        return this._qType;
        //TODO: if not available through data-qtype, try inferring
    }

    get questionText() {
        return this.DOM.getElementsBySelector(" .QuestionText")[0].innerHTML
    }

    get response() {

        switch (this.qType) {

            // A belief elicitation question (prior or posterior).
            case QTYPE.C_PRIOR:
            case QTYPE.R_POST_RSNS:
            case QTYPE.R_POST_RSO:
            case QTYPE.R_POST_RSB:
            case QTYPE.R_POST_SW:
            case QTYPE.R_POST_SS:
                return this.DOM.getElementsBySelector(' .ChoiceStructure input')[0].value;

            // A sharing choice elicitation question. TODO: There HAS to be a better way!
            case QTYPE.S_SHARE:
                return this.DOM.getElementsBySelector('label')[0].hasClassName('q-checked');

            default:
                return null;
        }
    }

    get handle() {
        return this.DOM;
    }

    get imgProperties() {
        let images = EmbeddedData.getDict(EMDICT.IMAGES);
        return images.filter(x => x.imgID == this.imgID)[0];
    }

    // Set question text.    
    set questionText(str) {
        this.DOM.getElementsBySelector(" .QuestionText")[0].innerHTML = str;
    }

    /* EVENT HANDLERS */

    //Applicable to Receivers
    onLoadSignalQ() {

        var signalStrength = parseFloat(EmbeddedData.getValue(
            (this.qType == QTYPE.R_POST_SW)? EMMISC.WEAK_SIGNAL : EMMISC.STRONG_SIGNAL
        ));
           
        // Generate the signal
        var signal = ImgQuestion.generateSignal(signalStrength, this.imgProperties.veracity);
        console.log(`Generated signal ${signal} of diagnosticity ${signalStrength} for ${this.imgID}`)

        // Store the signal
        var signals = EmbeddedData.getDict(EMDICT.SIGNALS);
        signals[this.imgID] = signal;
        EmbeddedData.saveDict(EMDICT.SIGNALS, signals);

        // Show the generated signal along with a reminder of the receiver's prior.
        var prior = EmbeddedData.getDict(EMDICT.PRIORS)[this.imgID];
        this.questionText = this.questionText.replace(BLANK.PRIOR, prior);
    }

    //Applicable to Receivers, except in the case of sharer's explanations.
    onLoadRevealedShareQ() {

        var sc = EmbeddedData.getDict(EMDICT.SHARING_CHOICES)[this.imgID];
        var scStr = '';
        var prior = null;

        switch (this.qType) {

            case QTYPE.R_POST_RSO:
                scStr = (sc) ? EmbeddedData.getValue(EMLOCALE.SHARE) : EmbeddedData.getValue(EMLOCALE.NOSEE);
            //No Break!

            case QTYPE.R_POST_RSNS:
                scStr = (sc) ? EmbeddedData.getValue(EMLOCALE.SHARE) : EmbeddedData.getValue(EMLOCALE.NOSHARE);
                prior = EmbeddedData.getDict(EMDICT.PRIORS)[this.imgID];
                this.questionText = this.questionText.replace(BLANK.PRIOR, prior).replace(BLANK.SHARING_CHOICE, scStr);
                break;

            default:
                throw new TypeError("Revealed-share handler called for invalid question type " + this.qType);
        }

    }

    //Applicable to Receivers, except in the case of sharer's explanations.
    onLoadRevealedBeliefQ() {

        var sc = EmbeddedData.getDict(EMDICT.SHARING_CHOICES)[this.imgID];
        var scStr = '';
        var prior = null;

        switch (this.qType) {

            case QTYPE.R_POST_RSB:
                prior = EmbeddedData.getDict(EMDICT.PRIORS)[this.imgID];
                var sp = EmbeddedData.getDict(EMDICT.SHARER_PRIORS)[this.imgID];
                this.questionText = this.questionText.replace(BLANK.PRIOR, prior).replace(BLANK.SHARER_PRIOR, sp);
                break;

            case QTYPE.R_POST_RSBB:
                prior = EmbeddedData.getDict(EMDICT.PRIORS)[this.imgID];
                var sp = EmbeddedData.getDict(EMDICT.SHARER_PRIORS)[this.imgID];
                this.questionText = this.questionText.replace(BLANK.PRIOR, prior).replace(BLANK.SHARER_PRIOR, sp);
                break;

            default:
                throw new TypeError("Revealed-belief handler called for invalid question type");
        }

    }

    //Reveal if the story was actually true or false, and list references.
    onLoadVeracityQ() {

        let links = this.imgProperties.external_urls.map(x => `<a href=${x}>${EMLOCALE.HERE}</a>`).join(', ');
        let verStr = (this.imgProperties.veracity) ? EMLOCALE.TRUE : EMLOCALE.FALSE;

        //If we faked the story, add a disclaimer saying so. 
        if (!this.imgProperties.veracity && this.imgProperties.fakedByUs) {
            verStr = verStr + EMLOCALE.FAKED;
        }

        this.questionText = this.questionText.replace(BLANK.VERACITY, verStr).replace(BLANK.LINKS, links);
    }

    onLoadExplanationQ() {
        var sc = EmbeddedData.getDict(EMDICT.SHARING_CHOICES)[this.imgID];
        var scStr = (sc) ? EmbeddedData.getValue(EMLOCALE.SHARE) : EmbeddedData.getValue(EMLOCALE.NOSHARE);
        this.questionText = this.questionText.replace(BLANK.SHARING_CHOICE, scStr);
    }

    onLoadSharingQ(){

    }

    onLoadPriorQ(){

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

    // Event handler for when the user submits their answer.
    onSubmitAnswer() {
        switch (this.qType) {

            case QTYPE.C_PRIOR:
                var priors = EmbeddedData.getDict(EMDICT.PRIORS);
                priors[this.imgID] = this.response;
                EmbeddedData.saveDict(EMDICT.PRIORS, priors);
                return;

            case QTYPE.S_SHARE:
                var sc = EmbeddedData.getDict(EMDICT.SHARING_CHOICES);
                sc[this.imgID] = this.response;
                EmbeddedData.saveDict(EMDICT.SHARING_CHOICES, sc);
                return;

            //NOTE: The signal is saved onLoad(), and not onSubmit(). 
            default:
                return;
        }
    }
}
