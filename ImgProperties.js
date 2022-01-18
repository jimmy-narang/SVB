class ImgProperties {

	constructor(){};

	//Convert value to a boolean
	static toBoolean(value){
		value = String(value); //just in case.
		switch(value.toLowerCase().trim()){
			case "true": 
			case "yes": 
			case "1": 
			return true;

			case "false": 
			case "no": 
			case "0": 
			return false;

			default: 
			return null;
		}
	}

	//Convert a URL, a concatenated string of URLs, or a single URL to an array of URL(s).
	static toArrayOfURLs(value){
		if (typeof(value) == 'string' && (/\s/).test(value)) {
			return value.split(/\s/);
		} else if (typeof (value) == 'string') {
			return [value];
		} else if (Array.isArray(value)) {
			return value;
		}
		else {
			console.error(`${value} is an invalid externalURLs type.`);
			return [];
		}
	}

	static toQualtricsURL(value) {
		return 'https://berkeley.ca1.qualtrics.com/CP/Graphic.php?IM=' + value;
	}

	static toArrOfImgProperties(images_raw){
		return images_raw.map(function(d){
			return {
				imgID: d.imgID, 
				qualtricsID: d.qualtricsID,
				qualtricsURL: ImgProperties.toQualtricsURL(d.qualtricsID),
				externalURLs: ImgProperties.toArrayOfURLs(d.externalURLs),
				fakedByUs: ImgProperties.toBoolean(d.fakedByUs),
				veracity: ImgProperties.toBoolean(d.veracity),
				style: d.style 
			}
		}).filter(d => 
			d.imgID && 
			d.qualtricsID && 
			d.qualtricsID.startsWith("IM_") 
			&& d.veracity != null);
	}

	static toMapOfImgProperties(images_raw){
		let temp = ImgProperties.toArrOfImgProperties(images_raw);
		let map = new Map(temp.map((x) => [x.imgID, x]));
		return map;
	}
}

