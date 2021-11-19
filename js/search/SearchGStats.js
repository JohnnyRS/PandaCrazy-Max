/** This class stores the search stats data and values.
 * @class SearchGStats ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class SearchGStats {
	constructor() {
		this.errors = 0;								// Amount of errors that happened while searching.
		this.totalPandas = 0;						// Total number of panda's found.
		this.totalSearches = 0;					// Total number of searches made.
		this.searchNow = {'value':false, 'id':'#pcm-searchNow', 'disabled':false, 'type':'boolean', 'onClass':'pcm-searchingOn', 'offClass':'pcm-searchingOff'};
		this.searching = {'value':false, 'id':'#pcm-searching', 'disabled':false, 'type':'boolean', 'onClass':'pcm-span-on', 'offClass':'pcm-span-off'};
		this.searchElapsed = {'value':0, 'id':'#pcm-searchElapsed', 'disabled':false, 'type':'integer', 'string':`Elapsed:`};
		this.totalSearchFetched = {'value': 0, 'id':'#pcm-searchTotalFetched', 'disabled':false, 'type':'integer', 'string':`Fetched:`};
		this.totalSearchPREs = {'value': 0, 'id':'#pcm-totalSearchPREs', 'disabled':false, 'type':'integer', 'string':`SearchPRE's: `};
		this.totalSearchHits = {'value': 0, 'id':'#pcm-searchHitsFound', 'disabled':false, 'type':'integer', 'string':`HITs Found: `};
		this.totalSearchResults = {'value': 0, 'id':'#pcm-searchResults', 'disabled':false, 'type':'integer', 'string':`HITs Available: `};
		this.fetchedElapsed = {'value': 0, 'id':'#pcm-fetchedElapsed', 'disabled':true, 'type':'integer', 'string':`Fetch Elapsed: `};
		this.timerStats = [this.searchElapsed, this.fetchedElapsed];
	}
	/** Checks to see if searching is on by using searching value.
	 * @return {bool} - True if searching is on now. */
	isSearchOn() { return this.searching.value; }
	/** Checks to see if searching is on by using searchNow value.
	 * @return {bool} - True if searchNow is on. */
	isSearchNowOn() { return this.searchNow.value; }
	/** Updates the given stat object on the status bar and pass a text to use too.
	 * @param  {object} statObj   - The stat object  @param  {string} [text] - The text to use in the status bar for this stat object. */
	updateStatNav(statObj, text='') { MySearchUI.updateStatNav(statObj, text); }
	toggleStat(oldToggled, toggled, theArray) {
		this[theArray][oldToggled-1].disabled = true; this[theArray][toggled-1].disabled = false;
		this.updateStatNav(this[theArray][toggled-1]);
	}
	/** Set the searching value and searching now value to on and update stat in status bar. */
	prepare() {
		this.updateStatNav(this.timerStats[0]); this.updateStatNav(this.totalSearchFetched); this.updateStatNav(this.totalSearchPREs);
		this.updateStatNav(this.totalSearchHits); this.updateStatNav(this.totalSearchResults); this.updateStatNav(this.fetchedElapsed);
	}
	searchingOn() { this.searching.value = true; this.searchNow.value = true; this.updateStatNav(this.searching, null); this.updateStatNav(this.searchNow, null); }
	/** Set the searching value to off and update stat in status bar. */
	searchingOff() { this.searching.value = false; this.searchNow.value = false; this.updateStatNav(this.searching, null); this.updateStatNav(this.searchNow, null); }
	/** Set the search elapsed time value and update stat in status bar.
	 * @param  {bool} value */
	setSearchElapsed(value) { this.searchElapsed.value = value; this.updateStatNav(this.searchElapsed); }
	/** Add 1 to the total amount of searches fetched and update stat in status bar. */
	addTotalSearchFetched() { this.totalSearchFetched.value++; this.updateStatNav(this.totalSearchFetched); }
	/** Add 1 to the total amount of PRE's found and update stat in status bar. */
	addTotalSearchPRE() { this.totalSearchPREs.value++; this.updateStatNav(this.totalSearchPREs); }
	/** Set the total search HITs value to value and update stat in status bar.
	 * @param  {number} value - The new value for the total number of HITs in the database. */
	addTotalSearchHits(value) { this.totalSearchHits.value = value; }
	/** Set the total search results value to value and update stat in status bar.
	 * @param  {number} value - The new value for the total amount of HITs found in one search result. */
	addTotalSearchResults(value) { this.totalSearchResults.value = value; this.updateStatNav(this.totalSearchResults); }
	addFetchedElapsed(value) { this.fetchedElapsed.value = value; this.updateStatNav(this.fetchedElapsed); }
	getStats() { return {'searchElapsed':this.searchElapsed, 'totalSearchFetched':this.totalSearchFetched, 'totalSearchPREs':this.totalSearchPREs, 'totalSearchHits':this.totalSearchHits, 'totalSearchResults':this.totalSearchResults}; }
}
