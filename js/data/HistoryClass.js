/**
 * Class dealing with history info of requester ID's and group ID's.
 * @class HistoryClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
**/
class HistoryClass {
  constructor(unsavedCheck=true) {
		this.resultsHistDate = null;		// Date last maintained the search results history so it only does it once a day.
		this.theCache = new LRU(600);		// Create a LRU cache to hold all the HIT information that it needs for fast retrieval.
		this.doSaveTime = 80000;				// The time in milliseconds to use for checking for any unsaved HIT information in the cache and searchResults to save to the database.
		this.searchResults = [];				// An array keeping all the HITs seen on MTURK search page prepared to be saved to the database at specific times.
		this.statsCache = {'collected':[], 'accepted':[]}; 		// An object of arrays to hold all the data to be added to the stats database in a cache to be all saved later.
		if (unsavedCheck) setTimeout(() => { this.checkUnsaved(); }, this.doSaveTime);  // Check for any HIT information cache or searchResults updates to save to the database.
	}
	/** Adds the data to the cache with the from set and saved flag set.
	 * @param  {object} data -The data to be added to cache.  @param  {string} from -Data came from where?  @param  {bool} [saved] - Data already saved?
	**/
	addToCache(data, from, saved=false) {
		for (const key of Object.keys(data)) {
			if (key.includes('--')) continue;
			let item = data[key], pay = (item.pay) ? item.pay : item.price, duration = item.duration | item.assignedTime; if (checkString(pay)) pay = parseFloat(pay);
			let nowDate = new Date().getTime(), theDate = (item.date) ? Date.parse(item.date) : nowDate;
			this.theCache.write(key, {'reqId':item.reqId, 'pay': pay, 'title': item.title, 'description':item.description, 'duration': duration, 'date': theDate, 'hits':item.hitsAvailable, 'theId':key, 'from':from, 'updated':nowDate, 'requester':false, 'filled':true}, saved);
			if (item.reqId) { this.theCache.write(item.reqId, {'reqName':item.reqName, 'theId':item.reqId, 'from':from, 'updated':nowDate, 'requester':true, 'filled':true}, saved); }
			if (from === 'searchResults') this.searchResults.push({'gid':key, 'rid':item.reqId, 'hits':item.hitsAvailable, 'date':nowDate, 'expires':item.expires});
		}
	}
	/** Flush all the search results from the search results array and save them to database.
	 * @async - To wait for all the data to be saved in the database.
	**/
	async flushSearchResults() {
		if (MyOptions.getSaveHistResults()) { let saveResults = [...this.searchResults]; this.searchResults = []; await MYDB.addToDB('searching', 'results', saveResults); }
	}
	/** Adds any data to be saved to the stats in a cache which will be saved at a later time.
	 * @param  {string} name - Name of storage to save to.  @param  {object} data - The data to be saved.
	**/
	addToStats(name, data) { if (name === 'accepted' || name === 'collected') { this.statsCache[name].push(data); }}
	/** Flushes all the data in the stats cache to the database in two transactions for accepted and collected storage.
	 * @async - To wait for all the data to be saved in the database.
	 * @param  {string} name - Name of storage to save to.
	**/
	async flushUnsavedStats(name) {
		let theDatas = [...this.statsCache[name]]; this.statsCache[name] = [];
		if (theDatas.length > 0) { await MYDB.addToDB('stats', (name === 'collected') ? _ : 'accepted', theDatas).then( () => {} ); }
		theDatas = null;
	}
	/** Checks the cache for any unsaved data so they can be saved to the database.
	 * @async - To wait for all the data to be saved in the database.
	**/
	async flushUnsaved() {
		let theUnsaved = this.theCache.getUnSaved(), saveThese = [];
		if (!$.isEmptyObject(theUnsaved)) await MYDB.getFromDB('history',_,_, Object.keys(theUnsaved)).then( async (r) => {
			for (const key of Object.keys(r)) {
				let item = r[key], oldUpdate = (item) ? r[key].updated : '01-01-2000', doUpdate = !isSameDay(new Date(oldUpdate));
				if (doUpdate) saveThese.push(theUnsaved[key]);
			}
			if (saveThese.length) await MYDB.addToDB('history',_, saveThese);
		});
	}
	/** Flush all cached data but on a random delay so everything won't be saved at the same time. */
	flushAllDelayed() {
		let firstTime = Math.floor(Math.random() * 2000) + 1000; this.flushUnsaved();
		setTimeout(() => {
			let secondTime = Math.floor(Math.random() * 1500) + 1000; this.flushSearchResults();
			setTimeout(() => {
				let thirdTime = Math.floor(Math.random() * 1300) + 1000; this.flushUnsavedStats('accepted');
				setTimeout(() => { this.flushUnsavedStats('collected'); }, thirdTime);
			}, secondTime);
		}, firstTime);
	}
	/** Flushes any unsaved data from theCache, search results and stats. Then sets the timeout to redo again. **/
	checkUnsaved() { this.flushAllDelayed(); setTimeout(() => { this.checkUnsaved(); }, this.doSaveTime); }
	/** Wipes all the data in the history database. Usually because of an import.
	 * @async - To wait for database to completely wipe all data.
	**/
	async wipeData() { await MYDB.openHistory().then( async () => { await MYDB.deleteDB('history'); }) }
	/** Finds values in the history with the keys given.
	 * @async									- To wait for the data to be got from the database.
	 * @param  {array} values - Array of keys.
	 * @return {array}			  - Returns the data from the keys given.
	**/
	async findValues(values) {
		let theseValues = [], cacheValue = {}, returnValue = {};
		for (const val of values) { let readVal = this.theCache.read(val); if (readVal) cacheValue[val] = readVal; else theseValues.push(val); }
		await MYDB.getFromDB('history',_,_, theseValues).then( r => { returnValue = Object.assign({}, cacheValue, r); } );
		return returnValue;
	}
	/** Deletes data that is from searchResults and hasn't been updated in the days set from the options.
	 * @async - To wait for all the records to be deleted from the database that needed to be deleted.
	 * @param  {function} [afterFunc] - Function to call after done to send success array or error object.
	**/
	async maintenance(afterFunc=null) {
		let beforeDate = new Date(), dayLimit = MyOptions.doGeneral().historyDays; beforeDate.setDate(beforeDate.getDate() - dayLimit);
		let keyRange = IDBKeyRange.bound(['searchResults',0], ['searchResults',beforeDate.getTime()]);
		await MYDB.deleteFromDB('history',_, keyRange, 'searchDate').then( null, (rejected) => console.log(rejected));
		let limitDate = new Date(); limitDate.setDate(limitDate.getDate() - 7);
		keyRange = IDBKeyRange.bound(0, limitDate.getTime());
		await MYDB.deleteFromDB('stats',_, keyRange, 'start').then( null, (rejected) => console.log(rejected));
		if (afterFunc) afterFunc(['History Database Maintenance Finished.']);
	}
	/** Updates the database with new data.
	 * @async										- To wait for the database to be updated.
	 * @param  {object} newData - New data  @param  {string} [key] - The key.
	**/
	async updateToDB(newData, key=null) {
		if (MYDB) {
			let onlyNew = (key) ? true : false;
 			await MYDB.addToDB('history',_, newData, onlyNew, key, r => {
				let oldUpdate = r.updated, doUpdate = !isSameDay(new Date(oldUpdate));
				if (newData.from === 'searchResults' && newData.from !== r.from) newData.from = r.from;
				if (r.from !== newData.from) doUpdate = true;
				if (doUpdate) r = Object.assign(r, newData);
				return doUpdate;
			}).then( () => {}, rejected => { MyPandaUI.haltScript(rejected, 'Failed adding new data to database for a panda so had to end script.', 'Error adding panda data. Error:'); });
		}
	}
	/** Close the database and flush the search results cache to the database.
	 * @async - To wait for all the search results to be saved to the database.
	**/
	async closeDB() {
		await this.flushUnsaved(); await this.flushSearchResults(); await this.flushUnsavedStats('accepted'); await this.flushUnsavedStats('collected');
		MYDB.closeDB('history');
	}
	/** Removes value key in database by changing the from value to searchResults so maintenance can delete it later.
	 * @param  {string} value - The key value that needs to be removed.
	**/
	deleteThis(value) { if (value) MYDB.getFromDB('history',_, value).then( r => { if (r) { r.from = 'searchResults'; this.updateToDB(r); } }); }
	/** Fill in the history database with the group ID and requester info from history object.
	 * @async										  - To wait for database to be updated.
	 * @param  {object} theHistory - History object.  @param  {string} [from] - Originated from.
	**/
	async fillInHistory(theHistory, from='unknown') {
		this.addToCache(theHistory, from);
		if (this.resultsHistDate === null) {
			let limitDays = 7, beforeDate = new Date();
			beforeDate.setDate( beforeDate.getDate() - limitDays );
			let keyRange = IDBKeyRange.bound(0, beforeDate.getTime()); this.resultsHistDate = new Date();
			MYDB.deleteFromDB('searching', 'results', keyRange, 'date').then( null, rejected => console.log(rejected));
		}
	}
	/** Saves all the search results data from the database to a CSV formatted string with all name, descriptions and titles set. (Testing for stats page.)
	 * @async 					- To wait for the data to be loaded from the database.
	 * @return {string} - Returns a string in a CSV format to save to a file.
	**/
	async searchResultsToCSV() {
		let fromDate = new Date(), toDate = new Date(); fromDate.setDate(fromDate.getDate() - 1); fromDate.setHours(0,0,0,0);
		let keyRange = IDBKeyRange.bound(fromDate.getTime(), toDate.getTime()), returnString = '', unknownReqInfo = {'hits':0,'reqName':'unknown', 'theId':'unknown', 'updated':'unknown'};
		let unknownGidInfo = {'date':'unknown', 'description':'unknown', 'duration':0, 'pay':0.0, 'reqId':'unknown', 'title':'unknown', 'updated':'unknown'};
		await MYDB.getFromDB('searching','results', keyRange,_, 'date').then( async (sResults) => {
			let requesterObj = {}, requesterSet = new Set(), gidObj = {}, gidSet = new Set();
			for (const item of sResults) {
				let gid = item.gid, rid = item.rid;
				if (rid && gid) {
					if (!requesterObj[rid]) { requesterObj[rid] = {'stats':{'gids':new Set(), 'count':0}}; requesterSet.add(rid); }
					requesterObj[rid].stats.count++; requesterObj[rid].stats.gids.add(gid);
					if (!gidObj[gid]) { gidObj[gid] = {'stats':{'hits':[], 'dates':[], 'count':0}}; gidSet.add(gid); }
					gidObj[gid].stats.count++; gidObj[gid].stats.hits.push(item.hits); gidObj[gid].stats.dates.push(item.date);
				}
			}
			await this.findValues(Array.from(requesterSet)).then( (reqFound) => {
				for (const requester of Object.keys(reqFound)) { let infoResult = (reqFound[requester]) ? reqFound[requester] : unknownReqInfo; requesterObj[requester].info = infoResult; }
			});
			await this.findValues(Array.from(gidSet)).then( (gidFound) => {
				for (const groupId of Object.keys(gidFound)) { let infoResult = (gidFound[groupId]) ? gidFound[groupId] : unknownGidInfo; gidObj[groupId].info = infoResult; }
			});
			returnString = `date,group id,requester id,requester name,title,hits,pay,duration\r\n`;
			for (const item of sResults) {
				let requesterName = requesterObj[item.rid].info.reqName.trim(), title = gidObj[item.gid].info.title.trim();
				let pay = gidObj[item.gid].info.pay, duration = gidObj[item.gid].info.duration;
				returnString += `${formatAMPM('short',new Date(item.date))},${item.gid},${item.rid},${requesterName},${title},${item.hits},${pay},${duration}\r\n`;
			}
		}, (rejected) => console.log(rejected));
		return returnString;
	}
	/** Gathers the total HITs found per day from the search results and returns it back in an array.
	 * @async 				 - To wait for counting of the database to finish for each day.
	 * @return {array} - Returns the count values in the search results database for each day in an array.
	**/
	async getCounts() {
		let countArray = [];
		for (let i=0; i<7; i++) {
			let fromDate = new Date(), toDate = new Date(); fromDate.setDate(fromDate.getDate() - i); toDate.setDate(toDate.getDate() - i);
			fromDate.setHours(0,0,0,0); toDate.setHours(24,0,0,0);
			let keyRange = IDBKeyRange.bound(fromDate.getTime(), toDate.getTime());
			await MYDB.getFromDB('searching','results', keyRange,_, 'date', true).then( async (sCount) => { countArray.push(sCount); });
			keyRange = IDBKeyRange.bound(fromDate.getTime(), toDate.getTime())
		}
		return countArray;
	}
}
