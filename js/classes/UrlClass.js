/**
 * A class that deals with the basic url object.
 * @class UrlClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class UrlClass {
	/**
 * @param  {string} thisUrl - The url string that is being used for this class.
	 */
	constructor(thisUrl) {
		this.url = thisUrl;
	}
	/**
	 * Gets the url being used by this class.
	 * @return {string} - The url string that this class is using.
	 */
	returnUrl() { return this.url; }
	/**
	 * Fetches the url and handles mturk results.
	 * Detects json result and text result.
	 */
	async goFetch() {
		try {
			const response = await fetch(this.url, { credentials: `include` });
			if (response.ok || response.status === 422 || response.status === 429) {
				// sorts response into json or text
				const type = response.headers.get('Content-Type');
				if (type.includes("application/json")) {
					const json = await response.json();
					return { type: "ok.json", url: response.url, status: response.status, data: json };
				}
				else {
					const text = await response.text();
					return { type: "ok.text", url: response.url, status: response.status, data: text };
				}
			}
			else {
				console.log("Fetch responses was not OK."); console.log(response);
				return { type: "not.ok", url: response.url, status: response.status, data: null };
			}
		}
		catch (e) {
			console.log("Got an error when trying to fetch the url.");
			return null;
		}
	}
}
