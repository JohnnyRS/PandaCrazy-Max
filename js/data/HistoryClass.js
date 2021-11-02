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
				let oldUpdate = r.updated, doUpdate = !isSameDay(new Date(oldUpdate));
				if (newData.from === 'searchResults' && newData.from !== r.from) newData.from = r.from;
				if (r.from !== newData.from) doUpdate = true;
				if (doUpdate) r = Object.assign(r, newData);
				return doUpdate;
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
	* @param  {object} history - History object @param  {string} [from] - Originated @param  {bool} [loaded] - Data loaded?
	*/
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
			if (from === 'searchResults') MYDB.addToDB('searching', 'results', {'gid':key, 'rid':item.reqId, 'hits':item.hitsAvailable, 'date':new Date().getTime(), 'expires':item.expires}, false).then(null, rejected => console.log(rejected));
		}
	}
	async testing() {
		let fromDate = new Date(), toDate = new Date(); /* fromDate.setDate(fromDate.getDate() - 0); */ fromDate.setHours(0,0,0,0);
		let keyRange = IDBKeyRange.bound(0, toDate.getTime()), returnString = '', unknownReqInfo = {'hits':0,'reqName':'unknown', 'theId':'unknown', 'updated':'unknown'};
		let unknownGidInfo = {date:'unknown',description:'unknown',duration:0,pay:0.0,reqId:'unknown',title:'unknown',updated:'unknown'};
		await MYDB.getFromDB('searching','results', keyRange,_, 'date').then( async (result) => {
			let requesterObj = {}, requesterSet = new Set(), gidObj = {}, gidSet = new Set();
			for (const item of result) {
				let gid = item.gid, rid = item.rid;
				if (rid && gid) {
					if (!requesterObj[rid]) { requesterObj[rid] = {'stats':{'gids':new Set(), 'count':0}}; requesterSet.add(rid); }
					requesterObj[rid].stats.count++; requesterObj[rid].stats.gids.add(gid);
					if (!gidObj[gid]) { gidObj[gid] = {'stats':{'hits':[], 'dates':[], 'count':0}}; gidSet.add(gid); }
					gidObj[gid].stats.count++; gidObj[gid].stats.hits.push(item.hits); gidObj[gid].stats.dates.push(item.date);
				}
			}
			await this.findValues(requesterSet).then( (result) => {
				for (const requester of Object.keys(result)) { let infoResult = (result[requester]) ? result[requester] : unknownReqInfo; requesterObj[requester].info = infoResult; }
			});
			await this.findValues(gidSet).then( (result) => {
				for (const groupId of Object.keys(result)) { let infoResult = (result[groupId]) ? result[groupId] : unknownGidInfo; gidObj[groupId].info = infoResult; }
			});
			returnString = `date,group id,requester id,requester name,title,hits,pay,duration\r\n`;
			for (const item of result) {
				let requesterName = requesterObj[item.rid].info.reqName.trim(), title = gidObj[item.gid].info.title.trim();
				let pay = gidObj[item.gid].info.pay, duration = gidObj[item.gid].info.duration;
				returnString += `${formatAMPM('short',new Date(item.date))},${item.gid},${item.rid},${requesterName},${title},${item.hits},${pay},${duration}\r\n`;
			}
		}, (rejected) => console.log(rejected));
		return returnString;
	}
}
