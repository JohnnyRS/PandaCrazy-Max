/** This class deals with fetching urls from MTURK and send results back to other classes.
 * @class MturkClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class MturkClass {
	constructor() {
		this.resultUrl = ''; // Just a place to keep results from fetch for future use.
	}
	/** Fetches the url in url object and handles MTURK results. Can deal with Pre's, maxed out and logged out for any MTURK URL;
	 * @param  {object} objUrl - The url object to use for fetching.
	 * @return {object} 			 - Returns data in an object or null if got nothing. */
	goFetch(objUrl) {
		const response = objUrl.goFetch().then( result => {
			if (!result) return null;
			this.resultUrl = result.url;
			let returnObj = { type:result.type, status:result.status, mode: '', data:result.data, url:result.url };
			if (this.resultUrl && this.resultUrl.includes('https://www.amazon.com/ap/signin')) { returnObj.mode = 'logged out'; returnObj.data = null; }
			else if (result.type === 'ok.json' && result.data.error && result.data.error.includes('You have exceeded the allowable')) { returnObj.mode = 'pre'; returnObj.data = null; }
			else if (result.type === 'ok.json' && result.data.message && result.data.message.includes('You have accepted the maximum number')) { returnObj.mode = 'maxedOut'; returnObj.data = null; }
			else if (result.type === 'ok.json' && result.data.message && result.data.message.includes('cannot work on any more HITs today')) { returnObj.mode = 'mturkLimit'; returnObj.data = null; }
			else if (result.type === 'ok.json' && result.data.message && result.data.message === 'There are no more of these HITs available.') { returnObj.mode = 'noMoreHits'; returnObj.data = null; }
			else if ( result.type === 'ok.json' && result.data.message && result.data.message.includes('you do not meet those Qualifications') ) { returnObj.mode = 'noQual'; returnObj.data = null; }
			else if ( result.type === 'ok.json' && result.data.message && result.data.message.includes('address is not valid') ) { returnObj.mode = 'notValid'; returnObj.data = null; }
			else if ( result.type === 'ok.json' && result.data.message && result.data.message.includes('prevent you from working') ) { returnObj.mode = 'blocked'; returnObj.data = null; }
			else if ( result.type === 'ok.json' && result.data.message ) { returnObj.mode = 'unknown';  }
			else if ( result.type === 'bad.request.text' && result.data.includes('Header Or Cookie Too Large') ) { returnObj.mode = 'cookies.large'; returnObj.data = null; }
			else if ( result.type === 'ok.text' && result.data.includes('Please type the following characters in the text box below') ) { returnObj.mode = 'captcha'; returnObj.data = null; }
			result = {};
			return returnObj;
		}, () => { console.error('error has occurred'); });
		return response;
	}
}
