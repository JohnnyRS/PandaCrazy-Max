/**
 * Class dealing with history info of requester ID's and group ID's.
 * @class HistoryClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com
 */
class HistoryClass {
  constructor() {
		this.dbHistoryName = "Pcm_History";		// Name of the database used for all storage.
    this.storeHistName = 'theHistory';
    this.useDefault = false;
		this.db = new DatabaseClass(this.dbHistoryName, 1);  // Set up the search database class.
  }
  /** Opens the history database or creates it if not found.
   * @param  {bool} [del=true] - Delete database before opening it.
	 * @return {promise}         - Error if rejected. */
  openDB(del=false) {
		return new Promise( (resolve, reject) => {
			this.db.openDB( del, (e) => {
				if (e.oldVersion === 0) { // Had no database so let's initialise it.
          let store1 = e.target.result.createObjectStore(this.storeHistName, {keyPath:'theId', autoIncrement:'false'});
          store1.createIndex('reqId', 'reqId', {unique:false});
          store1.createIndex('pay', 'pay', {unique:false});
          store1.createIndex('from', 'from', {unique:false});
          store1.createIndex('date', 'date', {unique:false});
          store1.createIndex('updated', 'updated', {unique:false});
          store1.createIndex('searchDate', ['from', 'updated'], {unique:false});
          this.useDefault = true;
        }
			} ).then( response => resolve(response), rejected => { console.error(rejected); reject(rejected); });
		});
	}
	wipeData() { this.db.deleteDB(); }
	async findValue(value) {
		await this.db.getFromDB(this.storeHistName, value).then( r => {
			console.log('found: ',r);
		} )
	}
	/** Deletes data that is from searchResults and hasn't been updated in 15 days. */
	maintenance() {
		let beforeDate = new Date(); beforeDate.setDate( beforeDate.getDate() - 15 );
		let keyRange = IDBKeyRange.bound(['searchResults',0], ['searchResults',beforeDate.getTime()]);
		this.db.deleteFromDB(this.storeHistName, keyRange, 'searchDate').then( null, (rejected) => console.error(rejected));
	}
	/** Updates the database with new data.
	 * @async											 - To wait for the database to be updated.
	 * @param  {object} newData    - New data to be saved in database.
	 * @param  {string} [key=null] - If key exists then update only if it is not from searchresults or not the same day. */
	async updateToDB(newData, key=null) {
		if (this.db) {
			let onlyNew = (key) ? true : false;
 			await this.db.addToDB(this.storeHistName, newData, onlyNew, key, (r) => {
				let updateThis = false;
				if (newData.from !== 'searchResults' && newData.from !== r.from) { r.from = newData.from; updateThis = true; }
				else updateThis = !isSameDay(new Date(r.updated));
				return updateThis;
			}).then(_, rejected => { extPandaUI.haltScript(rejected, 'Failed adding new data to database for a panda so had to end script.', 'Error adding panda data. Error:'); });
		}
	}
	/** Close the database usually when importing. */
	closeDB() { this.db.closeDB(); this.db = null; }
	/** Removes value key in database by changing the from value to searchResults so maintenance can delete it later.
	 * @param  {string} value - The key value that needs to be removed. */
	deleteThis(value) { if (value) this.db.getFromDB(this.storeHistName, value).then( r => { r.from = 'searchResults'; this.updateToDB(r); } ); }
	/** Fill in the history database with the group ID and requester info from history object.
	 * @async														 - To wait for database to be updated.
	 * @param  {object} history          - History object with all data.
	 * @param  {string} [from='unknown'] - Where data comes from.
	 * @param  {bool} [loaded=false]   - If data is loaded from database then no need to update history. */
	async fillInHistory(history, from='unknown', loaded=false) {
		let newHits = {};
		for (const key of Object.keys(history)) {
			let item = history[key], hits = 1, nowDate = new Date().getTime(), passKey = (loaded) ? null : key;
			let reqKey = (item.reqId && item.reqId !== ''), theDate = (item.date) ? Date.parse(item.date) : nowDate;
			if (reqKey) newHits[item.reqId] = 0;
			if (key.charAt(0).toUpperCase() !== 'A') {
				let pay = (item.pay) ? item.pay : item.price, duration = item.duration | item.assignedTime;
				await this.updateToDB({'reqId':item.reqId, 'pay': pay, 'title': item.title, 'description':item.description, 'duration': duration, 'date': theDate, 'theId':key, 'from':from, 'updated':nowDate, 'filled':true}, passKey);
			}
			if (reqKey) await this.updateToDB({'reqName':item.reqName, 'hits':hits, 'theId':item.reqId, 'from':from, 'updated':nowDate, 'filled':true}, passKey);
		}
	}
}