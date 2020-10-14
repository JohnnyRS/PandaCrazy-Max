class DatabasesClass {
  constructor() {
    this.history = {'dbName':'Pcm_History', 'storeName':'theHistory', 'db':null, 'default':false};
    this.stats = {'dbName':'Pcm_PandaStats', 'storeName':'collectionStore', 'accepted':'acceptedStore', 'db':null, 'default':false};
    this.panda = {'dbName':'PandaCrazyMax', 'storeName':'pandaStore', 'tabs':'tabsStore', 'options':'optionsStore', 'alarms':'alarmsStore', 'grouping':'groupingStore', 'db':null, 'default':false};
    this.searching = {'dbName':'Pcm_Searching', 'storeName':'searchTriggers', 'options':'searchOptions', 'rules':'searchRules', 'history':'searchHistory', 'db':null, 'default':false};
  }
  openPCM(del=false) {
    return new Promise( (resolve, reject) => {
      this.panda.db = new DatabaseClass(this.panda.dbName, 1);
      this.panda.db.openDB( del, (e) => {
        if (e.oldVersion === 0) {
          e.target.result.createObjectStore(this.panda.storeName, {keyPath:"id", autoIncrement:"true"}).createIndex("groupId", "groupId", {unique:false});
          e.target.result.createObjectStore(this.panda.tabs, {keyPath:"id", autoIncrement:"true"}).createIndex("position", "position", {unique:false});
          e.target.result.createObjectStore(this.panda.options, {keyPath:"category"});
          e.target.result.createObjectStore(this.panda.alarms, {keyPath:"id", autoIncrement:"true"}).createIndex("name", "name", {unique:false});
          e.target.result.createObjectStore(this.panda.grouping, {keyPath:"id", autoIncrement:"true"});
          this.panda.default = true;
        }
      }).then( response => { if (response === 'OPENED') resolve(this.panda.db); }, rejected => { console.error(rejected); reject(rejected); });
    });
  }
  openHistory(del=false) {
		return new Promise( (resolve, reject) => {
      this.history.db = new DatabaseClass(this.history.dbName, 1);
			this.history.db.openDB( del, (e) => {
				if (e.oldVersion === 0) {
          let store1 = e.target.result.createObjectStore(this.history.storeName, {keyPath:'theId', autoIncrement:'false'});
          store1.createIndex('reqId', 'reqId', {unique:false}); store1.createIndex('pay', 'pay', {unique:false});
          store1.createIndex('from', 'from', {unique:false}); store1.createIndex('date', 'date', {unique:false});
          store1.createIndex('updated', 'updated', {unique:false}); store1.createIndex('searchDate', ['from', 'updated'], {unique:false});
          this.history.default = true;
        }
			}).then( response => { if (response === 'OPENED') resolve(this.history.db); }, rejected => { console.error(rejected); reject(rejected); });
		});
  }
  openSearching(del=false) {
		return new Promise( (resolve, reject) => {
			this.searching.db = new DatabaseClass(this.searching.dbName, 1);
    	this.searching.db.openDB( del, (e) => {
				if (e.oldVersion === 0) {
          let store1 = e.target.result.createObjectStore(this.searching.storeName, {keyPath:'id', autoIncrement:'true'});
          store1.createIndex('type', 'type', {unique:false}); store1.createIndex('value', 'value', {unique:false}); store1.createIndex('unique', ['type', 'value'], {unique:false});
					e.target.result.createObjectStore(this.searching.options, {keyPath:"dbId", autoIncrement:"false"});
					e.target.result.createObjectStore(this.searching.rules, {keyPath:"dbId", autoIncrement:"false"});
					e.target.result.createObjectStore(this.searching.history, {keyPath:"dbId", autoIncrement:"false"});
          this.searching.default = true;
        }
      }).then( response => { if (response === 'OPENED') resolve(this.searching.db); }, rejected => { console.error(rejected); reject(rejected); });
		});
  }
  openStats(del=false) {
		return new Promise( (resolve, reject) => {
			this.stats.db = new DatabaseClass(this.stats.dbName, 1);
    	this.stats.db.openDB( del, (e) => {
				if (e.oldVersion === 0) { // Had no database so let's initialise it.
					e.target.result.createObjectStore(this.stats.storeName, {keyPath:"id", autoIncrement:"true"}).createIndex("dbId", "dbId", {unique:false});
					let objStore = e.target.result.createObjectStore(this.stats.accepted, {keyPath:"id", autoIncrement:"true"});
					objStore.createIndex("dbId", "dbId", {unique:false}); // dbId is an index to search faster.
					objStore.createIndex("gid", "gid", {unique:false}); // gid is an index to search faster on Group Ids.
					objStore.createIndex("rid", "rid", {unique:false}); // rid is an index to search faster on Requester Ids.
          this.stats.default = true;
				}
      }).then( response => { if (response === 'OPENED') resolve(this.stats.db); }, rejected => { console.error(rejected); reject(rejected); });
		});
  }
  closeDB(target) { this[target].db.closeDB(); this[target].db = null; }
  async deleteDB(target) { if (this[target].db !== null) this[target].db.closeDB(); await this[target].db.deleteDB(); this[target].db = null; }
  useDefault(target) { return this[target].default; }
  getFromDB(target, store='storeName', key=null, keys=null) {
		return new Promise( (resolve, reject) => { this[target].db.getFromDB(this[target][store], key, keys).then( r => resolve(r), e => reject(e) ); });
  }
  addToDB(target, store='storeName', mData=null, onlyNew=false, key=null, updateFunc=null) {
		return new Promise( (resolve, reject) => { this[target].db.addToDB(this[target][store], mData, onlyNew, key, updateFunc).then( r => resolve(r), e => reject(e) ); });
  }
  deleteFromDB(target, store='storeName', key=null, indexName=null) {
		return new Promise( (resolve, reject) => { this[target].db.deleteFromDB(this[target][store], key, indexName).then( r => resolve(r), e => reject(e) ); });
  }
  testDB() { return new Promise( (resolve, reject) => { this.panda.db.testDB().then( r => resolve(r), e => reject(e) ); }); }
}
/** Class for using datbases with promises for operations so it can wait for completion of function.
 * @class DatabaseClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class DatabaseClass {
  /**
   * @param {string} dbName      Name of the database to be used.
   * @param {number} dbVersion   Version number for this database.
   */
  constructor(dbName, dbVersion) {
    this.db = null;                 // Database variable to the indexedDB object.
    this.dbName = dbName;           // Database name for the indexedDB object.
    this.dbVersion = dbVersion;     // Database version for the indexedDB object.
    this.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
  }
  /** Test the database to make sure there are stores available.
   * @Return {promise} - Resolves with 'good' or rejects with 'bad'. */
  testDB() {
    return new Promise( (resolve, reject) => {
      let request = this.indexedDB.open( this.dbName, this.dbVersion );
      request.onsuccess = () => { if (request.result.objectStoreNames.length === 0) { request.result.close(); reject('bad'); } else resolve('good'); };
      request.onerror = () => { request.result.close(); reject('bad'); }
    });
  }
  deleteDB() { 
    return new Promise( (resolve, reject) => {
      let deleteRequest = this.indexedDB.deleteDatabase(this.dbName);
      deleteRequest.onerror = () => { reject(new Error(`Delete: ${this.dbName} error: ${deleteRequest.error.message}`)); }
      deleteRequest.onsuccess = () => { resolve('SUCCESS'); }
    });
  }
  /** Opens this database using dbName and dbVersion properties of class.
   * Assigns db property to opened database request.
   * @param {bool} deleteFirst - Delete database @param {function} upgrade - Function to be used when upgrade is needed because newer version.
   * @return {promise}         - Database version in resolve. Error object in reject. */
  openDB(deleteFirst, upgrade) {
    return new Promise( async (resolve, reject) => {
      if (!this.indexedDB) reject(new Error('indexedDB is Not supported'));
      else {
        if (deleteFirst) await this.deleteDB();
        let openRequest = this.indexedDB.open( this.dbName, this.dbVersion );
        openRequest.onupgradeneeded = e => { upgrade(e); } // if need to upgrade then call upgrade function
        openRequest.onsuccess = () => { this.db = openRequest.result; resolve('OPENED'); } // set database pointer
        openRequest.onerror = () => { reject(new Error(`Open: ${this.dbName} error: ${openRequest.error.message}`)); }
        openRequest.onabort = () => { reject(new Error(`Open: ${this.dbName} error: ${openRequest.error.message}`)); }
      }  
    });
  }
  /** Adds data to database with a key in data or next key available.
   * @param {string} storeName - Store name @param {object} mdata    - Data             @param {bool} [onlyNew=false]   - True for only updating data that is new.
   * @param {bool} [key=null]  - Key @param {bool} [updateFunc=null] - Update function
   * @return {promise}         - Database key or new key in resolve. Error object in reject. */
  addToDB(storeName, mData, onlyNew=false, key=null, updateFunc=null) {
    return new Promise( (resolve, reject) => {
      let newId = null, tx = this.db.transaction( [storeName], "readwrite" );
      let datas = (Array.isArray(mData)) ? mData : [mData], storage = tx.objectStore(storeName);
      for (const data of datas) {
        let countRequest = storage.count(key);
        countRequest.onsuccess = (e) => {
          if ( (onlyNew && e.target.result === 0) || !onlyNew) { 
            storage.put(data).onsuccess = (e) => { let mainKey = e.target.source.keyPath; data[mainKey] = newId = e.target.result; }
          } else if (updateFunc) {
            storage.get(key).onsuccess = (e) => { if (updateFunc(e.target.result)) storage.put(e.target.result); }
          }
        }
      }
      tx.onabort = () => { reject(new Error(`Add to: ${storeName} error: ${tx.error.message}`)); }
      tx.oncomplete = () => { resolve( (datas.length > 1) ? -1 : newId ); }
    });
  }
  /** Get an array or object of items from database with a key.
   * @param {string} storeName - Store name to be used for adding data to.
   * @param {string} key       - Get the item with this key.
   * @return {promise}         - Array or object in resolve. Error object in reject. */
  getFromDB(storeName, key=null, keys=null) {
    return new Promise( (resolve, reject) => {
      let tx = this.db.transaction( [storeName], "readonly" ), store = tx.objectStore( storeName ), filledData = {};
      if (keys === null) {
        let request = (key !== null) ? store.get(key) : store.getAll(); // Open cursor or just get an item?
        request.onsuccess = () => resolve(request.result);
        request.onabort = e => { reject(new Error(`Get from: ${storeName} error: ${request.error.message}`)); }
      } else {
        for (const thisKey of keys) {
          filledData[thisKey] = null;
          store.get(thisKey).onsuccess = (e) => { filledData[thisKey] = e.target.result; }
        }
        tx.oncomplete = () => resolve(filledData);
      }
    });
  }
  /** Delete an item or items from a database with a key using an index if necessary.
   * @param {string} storeName        - Store name to be used for adding data to.
   * @param {string} key              - Delete the item with this key.
   * @param {string} [indexName=null] - Use index name and delete all items with key.
   * @return {promise}                - Key in resolve. Error object in reject. */
  deleteFromDB(storeName, key, indexName=null) {
    return new Promise( (resolve, reject) => {
      let completed = false, error = '';
      let tx = this.db.transaction( [storeName], "readwrite" );
      let store = tx.objectStore(storeName);
      if (indexName) { // Should an index be used for the key?
        const index = store.index(indexName);
        const listDel = index.getAllKeys(key); // Get all items with this key in index.
        listDel.onsuccess = e => { completed = true; listDel.result.forEach(mainKey => { store.delete(mainKey); }); }
        listDel.onerror = e => { error = listDel.error.message; } // Error when problems with index happen.
      } else {
        let count = store.count(key); count.onsuccess = () => { // Get number of items with Key
          if (count.result > 0 && key !== null) { const request = store.delete(key); request.onsuccess = () => { completed = true; } }
          else if (key === null) { store.clear(); completed = true; }
          else { error = `Key: [${key}] not found in ${storeName}`; } // Error if key not found.
        }
      }
      tx.onabort = e => { reject(new Error(`Del from: ${storeName} error: ${tx.error.message}`)); }
      tx.oncomplete = e => {
        if (completed) resolve(key); else reject(new Error(`Del from: ${storeName} error: ${error}`));
      }
    });
  }
  /** Clear the data from a store name in this database.
   * @param  {string} storeName - Store name to be used for adding data to.
   * @return {promise}          - Key in resolve. Error object in reject. */
  clearStore(storeName) {
    return new Promise( (resolve, reject) => {
      let tx = this.db.transaction( [storeName], "readwrite" );
      tx.objectStore(storeName).clear();
      tx.oncomplete = () => { resolve(true); }
      tx.onabort = () => { reject(new Error(`Clear from: ${storeName} error: ${tx.error.message}`)); }
    });
  }
  /** Close the database. Usually before deleting it for complete reset. */
  closeDB() { if (this.db) this.db.close(); }
}