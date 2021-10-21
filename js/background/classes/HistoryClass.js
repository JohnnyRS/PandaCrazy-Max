/**
 * Class dealing with history info of requester ID's and group ID's.
 * @class HistoryClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class HistoryClass {
  constructor() {
		this.resultsHistDate = null;
	}
	/** Wipes all the data in the history database. Usually because of an import.
	 * @async - To wait for database to completely wipe all data. */
	async wipeData() { await MYDB.openHistory().then( async () => { await MYDB.deleteDB('history'); }) }
	/** Finds values in the history with the keys given.
	 * @async									- To wait for the data to be got from the database.
	 * @param  {array} values - Array of Keys
	 * @return {array}			  - Returns the data from the keys given. */
	async findValues(values) { let returnValue = {}; await MYDB.getFromDB('history',_,_, values).then( r => { returnValue = r; } ); return returnValue; }
	/** Deletes data that is from searchResults and hasn't been updated in 15 days. */
	maintenance() {
		let beforeDate = new Date(), dayLimit = MyOptions.doGeneral().historyDays; beforeDate.setDate( beforeDate.getDate() - dayLimit );
		let keyRange = IDBKeyRange.bound(['searchResults',0], ['searchResults',beforeDate.getTime()]);
		MYDB.deleteFromDB('history',_, keyRange, 'searchDate').then( null, (rejected) => console.log(rejected));
	}
	/** Updates the database with new data.
	 * @async											 - To wait for the database to be updated.
	 * @param  {object} newData    - New data  @param  {string} [key] - The key */
	async updateToDB(newData, key=null) {
		if (MYDB) {
			let onlyNew = (key) ? true : false;
 			await MYDB.addToDB('history',_, newData, onlyNew, key, r => {
				let updateThis = false;
				if (newData.from !== 'searchResults' && newData.from !== r.from) { r.from = newData.from; updateThis = true; }
				else updateThis = !isSameDay(new Date(r.updated));
				return updateThis;
			}).then( () => {}, rejected => { extPandaUI.haltScript(rejected, 'Failed adding new data to database for a panda so had to end script.', 'Error adding panda data. Error:'); });
		}
	}
	/** Close the database usually when importing. */
	closeDB() { MYDB.closeDB('history'); }
	/** Removes value key in database by changing the from value to searchResults so maintenance can delete it later.
	 * @param  {string} value - The key value that needs to be removed. */
	deleteThis(value) {
		if (value) MYDB.getFromDB('history',_, value).then( r => { if (r) { r.from = 'searchResults'; this.updateToDB(r); } });
	}
	/** Fill in the history database with the group ID and requester info from history object.
	 * @async										- To wait for database to be updated.
	 * @param  {object} history - History object @param  {string} [from] - Originated @param  {bool} [loaded] - Data loaded? */
	async fillInHistory(history, from='unknown', loaded=false) {
		if (this.resultsHistDate === null) {
			let limitDays = 7, beforeDate = new Date();
			beforeDate.setDate( beforeDate.getDate() - limitDays );
			let keyRange = IDBKeyRange.bound(0, beforeDate.getTime()); this.resultsHistDate = new Date();
			MYDB.deleteFromDB('searching', 'results', keyRange, 'date').then( null, rejected => console.log(rejected));
		}
		for (const key of Object.keys(history)) {
			let item = history[key], hits = 1, nowDate = new Date().getTime(), passKey = (loaded) ? null : key;
			let reqKey = (item.reqId && item.reqId !== ''), theDate = (item.date) ? Date.parse(item.date) : nowDate;
			if (key && key.charAt(0).toUpperCase() !== 'A') {
				let pay = (item.pay) ? item.pay : item.price, duration = item.duration | item.assignedTime; if (checkString(pay)) pay = parseFloat(pay);
				this.updateToDB({'reqId':item.reqId, 'pay': pay, 'title': item.title, 'description':item.description, 'duration': duration, 'date': theDate, 'theId':key, 'from':from, 'updated':nowDate, 'filled':true}, passKey);
			}
			if (reqKey) this.updateToDB({'reqName':item.reqName, 'hits':hits, 'theId':item.reqId, 'from':from, 'updated':nowDate, 'filled':true}, (passKey) ? item.reqId : null);
			//if (from === 'searchResults') MYDB.addToDB('searching', 'results', {'gid':key, 'rid':item.reqId, 'hits':item.hitsAvailable, 'date':new Date().getTime(), 'expires':item.expires}, false).then(null, rejected => console.log(rejected));
		}
	}
	testing() {
		let fromDate = new Date(), toDate = new Date(); fromDate.setDate(fromDate.getDate() - 1); fromDate.setHours(0,0,0,0);
		let keyRange = IDBKeyRange.bound(fromDate.getTime(), toDate.getTime());
		MYDB.getFromDB('searching','results', keyRange,_, 'date').then( (result) => {
			let requesterObj = {}, requesterSet = new Set(), gidObj = {}, gidSet = new Set();
			console.log(result.length);
			for (const item of result) {
				let gid = item.gid, rid = item.rid;
				if (rid && gid) {
					if (!requesterObj[rid]) { requesterObj[rid] = {'gids':new Set(), 'count':0}; requesterSet.add(rid); }
					requesterObj[rid].count++; requesterObj[rid].gids.add(gid);
					if (!gidObj[gid]) { gidObj[gid] = {'hits':[], 'dates':[], 'count':0}; gidSet.add(gid); }
					gidObj[gid].count++; gidObj[gid].hits.push(item.hits); gidObj[gid].dates.push(item.date);
				}
			}
			console.log(requesterObj);
			console.log(gidObj);
		}, (rejected) => console.log(rejected));
	}
}