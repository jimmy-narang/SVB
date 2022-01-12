/****************************
 * 			MAIN			*			
 ***************************/


// Fetch images from this survey's image list (google sheet).
var linkToImgDB = EmbeddedData.getValue(EMMISC.IMG_DB_URL);
console.log("Fetching images data from " + linkToImgDB);
let images_raw = await ImgProperties.getImgDB(linkToImgDB);

// Filter out images with missing metadata; shuffle the rest.
var images = d3.shuffle(images_raw.filter(d => 
    d.imgID && 
    d.qualtricsID && 
    d.qualtricsID.startsWith("IM_") 
    && d.veracity != null));

// TODO: Ensure array of images is of "sufficient" length


//TODO: 