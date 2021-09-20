/** Class dealing with the handling of the databases using promises to wait for completion.
 * @class DatabasesClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class DatabasesClass {
  constructor() {
    this.history = {'dbName':'Pcm_History', 'storeName':'theHistory', 'db':null, 'default':false};
    this.stats = {'dbName':'Pcm_PandaStats', 'storeName':'collectionStore', 'accepted':'acceptedStore', 'db':null, 'default':false};
    this.panda = {'dbName':'PandaCrazyMax', 'storeName':'pandaStore', 'tabs':'tabsStore', 'options':'optionsStore', 'alarms':'alarmsStore', 'grouping':'groupingStore', 'db':null, 'default':false};
    this.searching = {'dbName':'Pcm_Searching', 'storeName':'searchTriggers', 'options':'searchOptions', 'rules':'searchRules', 'grouping':'searchGroups', 'history':'searchHistory', 'db':null, 'default':false};
  }
  /** This opens the main panda database and will delete first if needed. Restores the indexes after a delete.
   * @param {bool} [del] - Delete from database?
   * @return {promise} - 'OPENED' or rejected has any errors. */
  openPCM(del=false) {
    return new Promise( (resolve, reject) => {
      this.panda.db = new DatabaseClass(this.panda.dbName, 1);
      this.panda.db.openDB( del, e => {
        if (e.oldVersion === 0) {
          e.target.result.createObjectStore(this.panda.storeName, {'keyPath':'id', 'autoIncrement':'true'}).createIndex('groupId', 'groupId', {'unique':false});
          e.target.result.createObjectStore(this.panda.tabs, {'keyPath':'id', 'autoIncrement':'true'}).createIndex('position', 'position', {'unique':false});
          e.target.result.createObjectStore(this.panda.options, {'keyPath':'category'});
          e.target.result.createObjectStore(this.panda.alarms, {'keyPath':'id', 'autoIncrement':'true'}).createIndex('name', 'name', {'unique':false});
          e.target.result.createObjectStore(this.panda.grouping, {'keyPath':'id', 'autoIncrement':'true'});
          this.panda.default = true;
        }
      }).then( response => { if (response === 'OPENED') resolve(this.panda.db); }, rejected => { console.error(rejected); reject(rejected); });
    });
  }
  /** This opens the main history database and will delete first if needed. Restores the indexes after a delete.
   * @param {bool} [del] - Delete from database?
   * @return {promise} - 'OPENED' or rejected has any errors. */
  openHistory(del=false) {
		return new Promise( (resolve, reject) => {
      this.history.db = new DatabaseClass(this.history.dbName, 1);
			this.history.db.openDB( del, e => {
				if (e.oldVersion === 0) {
          let store1 = e.target.result.createObjectStore(this.history.storeName, {'keyPath':'theId', 'autoIncrement':'false'});
          store1.createIndex('reqId', 'reqId', {'unique':false}); store1.createIndex('pay', 'pay', {'unique':false});
          store1.createIndex('from', 'from', {'unique':false}); store1.createIndex('date', 'date', {'unique':false});
          store1.createIndex('updated', 'updated', {'unique':false}); store1.createIndex('searchDate', ['from', 'updated'], {'unique':false});
          this.history.default = true;
        }
			}).then( response => { if (response === 'OPENED') resolve(this.history.db); }, rejected => { console.error(rejected); reject(rejected); });
		});
  }
  /** This opens the main search database and will delete first if needed. Restores the indexes after a delete.
   * @param {bool} [del] - Delete from database?
   * @return {promise} - 'OPENED' or rejected has any errors. */
  openSearching(del=false) {
		return new Promise( (resolve, reject) => {
			this.searching.db = new DatabaseClass(this.searching.dbName, 3);
    	this.searching.db.openDB( del, e => {
				if (e.oldVersion < 3) {
          let db = e.target.result;
          if (!db.objectStoreNames.contains(this.searching.storeName)) {
            let store1 = db.createObjectStore(this.searching.storeName, {'keyPath':'id', 'autoIncrement':'true'});
            store1.createIndex('type', 'type', {'unique':false}); store1.createIndex('value', 'value', {'unique':false}); store1.createIndex('unique', ['type', 'value'], {'unique':false});
          }
          if (!db.objectStoreNames.contains(this.searching.options)) { db.createObjectStore(this.searching.options, {'keyPath':'dbId', 'autoIncrement':'false'}); }
          if (!db.objectStoreNames.contains(this.searching.rules)) { db.createObjectStore(this.searching.rules, {'keyPath':'dbId', 'autoIncrement':'false'}); }
          if (!db.objectStoreNames.contains(this.searching.grouping)) { db.createObjectStore(this.searching.grouping, {'keyPath':'id', 'autoIncrement':'true'}); }
          if (db.objectStoreNames.contains(this.searching.history)) db.deleteObjectStore(this.searching.history);
          let store2 = db.createObjectStore(this.searching.history, {'keyPath':'id', 'autoIncrement':'true'});
          store2.createIndex('dbId', 'dbId', {'unique':false}); store2.createIndex('gid', 'gid', {'unique':false}); store2.createIndex('date', 'date', {'unique':false});
          store2.createIndex('dbIdDate', ['dbId', 'date'], {'unique':false}); store2.createIndex('dbIdGid', ['dbId', 'gid'], {'unique':false});
          this.searching.default = true;
        }
      }).then( response => { if (response === 'OPENED') resolve(this.searching.db); }, rejected => { console.error(rejected); reject(rejected); });
		});
  }
  /** This opens the main stats database and will delete first if needed. Restores the indexes after a delete.
   * @param {bool} [del] - Delete from database?
   * @return {promise} - 'OPENED' or rejected has any errors. */
  openStats(del=false) {
		return new Promise( (resolve, reject) => {
			this.stats.db = new DatabaseClass(this.stats.dbName, 1);
    	this.stats.db.openDB( del, e => {
				if (e.oldVersion === 0) { // Had no database so let's initialize it.
					e.target.result.createObjectStore(this.stats.storeName, {'keyPath':'id', 'autoIncrement':'true'}).createIndex('dbId', 'dbId', {'unique':false});
					let objStore = e.target.result.createObjectStore(this.stats.accepted, {'keyPath':'id', 'autoIncrement':'true'});
					objStore.createIndex('dbId', 'dbId', {'unique':false}); objStore.createIndex('gid', 'gid', {'unique':false}); objStore.createIndex('rid', 'rid', {'unique':false});
          this.stats.default = true;
				}
      }).then( response => { if (response === 'OPENED') resolve(this.stats.db); }, rejected => { console.error(rejected); reject(rejected); });
		});
  }
  /** This will close the database with the target property for the database object name.
   * @param {string} target - The property name of database to close. */
  closeDB(target) { this[target].db.closeDB(); this[target].db = null; }
  /** This will delete the database with the target property for the database object name.
   * @async                 - To wait for the database to be fully deleted.
   * @param {string} target - The property name of database to delete. */
  async deleteDB(target) { if (this[target].db !== null) this[target].db.closeDB(); await this[target].db.deleteDB(); this[target].db = null; }
  /** Returns if database is using default values.
   * @param {string} target - The property name of database to return default value.
   * @return {bool}         - Returns the value representing if database was set to default values. */
  useDefault(target) { return this[target].default; }
  /** Gets data from the database, store and keys provided. Can send back count number. Force to use cursor. Limit number of data returned and in what order with a start index.
   * @param {string} target   - Database Name  @param {string} [store] - Store Name   @param {string} [key]  - Key Name     @param {array} [keys] - Key Names
   * @param {string} [indexN] - Index Name     @param {bool} [count]   - Count Items  @param {bool} [cursor] - Use Cursor?  @param {bool} [asc]   - Ascending?
   * @param {number} [limit]  - Limit Number   @param {number} [start] - Index to start at
   * @return {promise}        - Array or object in resolve. Error object in reject. */
  getFromDB(target, store='storeName', key=null, keys=null, indexN=null, count=null, cursor=false, asc=true, limit=0, start=0) {
		return new Promise((resolve, reject) => { this[target].db.getFromDB(this[target][store], key, keys, indexN, count, cursor, asc, limit, start).then( r => resolve(r), e => reject(e) ); });
  }
  /** Adds data to database with a key in data or next key available. Can add Multiple or save only new. Can use a function when data gets updated.
   * @param {string} target - Database Name  @param {string} [store]        - Store Name  @param {array} [mData] - Multiple Data  @param {bool} [onlyNew] Save New Only
   * @param {string} [key]  - Key Name       @param {function} [updateFunc] - Function to call when updated.
   * @return {promise}      - Database key or new key in resolve. Error object in reject. */
  addToDB(target, store='storeName', mData=null, onlyNew=false, key=null, updateFunc=null) {
		return new Promise((resolve, reject) => { this[target].db.addToDB(this[target][store], mData, onlyNew, key, updateFunc).then( r => resolve(r), e => reject(e) ); });
  }
  /** Deletes data from the database in the store name and the key. Can use an index name also.
   * @param {string} target - Database Name  @param {string} [store] - Store Name  @param {string} [key] - Key Name  @param {string} [indexName] - Index Name
   * @return {promise}      - Key in resolve. Error object in reject. */
  deleteFromDB(target, store='storeName', key=null, indexName=null) {
		return new Promise((resolve, reject) => { this[target].db.deleteFromDB(this[target][store], key, indexName).then( r => resolve(r), e => reject(e) ); });
  }
  /** Tests the database to make sure it was created and can open correctly.
   * @return {promise} - 'good' for test successful or bad in reject for errors. */
  testDB() { return new Promise( (resolve, reject) => { this.panda.db.testDB().then( r => resolve(r), e => reject(e) ); }); }
  /** Clears the store name given in the database provided.
   * @param {string} target - Database Name  @param {string} store - Store Name */
  clearStore(target, store='storeName') { this[target].db.clearStore(this[target][store]); }
}
/** Class for using databases with promises for operations so it can wait for completion of function.
 * @class DatabaseClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class DatabaseClass {
  /**
   * @param {string} dbName    - Name of the database to be used.
   * @param {number} dbVersion - Version number for this database.
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
  /** Deletes this database with all data with it.
   * @return {promise} - 'SUCCESS' in resolve or Errors in reject. */
  deleteDB() { 
    return new Promise( (resolve, reject) => {
      let deleteRequest = this.indexedDB.deleteDatabase(this.dbName);
      deleteRequest.onerror = () => { reject(new Error(`Delete: ${this.dbName} error: ${deleteRequest.error.message}`)); }
      deleteRequest.onsuccess = () => { resolve('SUCCESS'); }
    });
  }
  /** Opens this database using dbName and dbVersion properties of class. Assigns db property to opened database request.
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
  /** Adds data to database with a key in data or next key available. Can add Multiple or save only new. Can use a function when data gets updated.
   * @param {string} storeName - Store name  @param {object} mdata      - Multiple Data   @param {bool} [onlyNew] - True for only updating data that is new.
   * @param {bool} [key]       - Key         @param {bool} [updateFunc] - Update function
   * @return {promise}         - Database key or new key in resolve. Error object in reject. */
  addToDB(storeName, mData, onlyNew=false, key=null, updateFunc=null) {
    return new Promise( (resolve, reject) => {
      let newId = null, tx = this.db.transaction( [storeName], 'readwrite' ), datas = (Array.isArray(mData)) ? mData : [mData], storage = tx.objectStore(storeName);
      for (const data of datas) {
        let countRequest = storage.count(key);
        countRequest.onsuccess = e => {
          if ( (onlyNew && e.target.result === 0) || !onlyNew) { 
            storage.put(data).onsuccess = e => { let mainKey = e.target.source.keyPath; data[mainKey] = newId = e.target.result; };
          } else if (updateFunc) {
            storage.get(key).onsuccess = e => { if (updateFunc(e.target.result)) storage.put(e.target.result); };
          }
        }
      }
      tx.onabort = () => { reject(new Error(`Add to: ${storeName} error: ${tx.error.message}`)); }
      tx.oncomplete = () => { resolve( (datas.length > 1) ? -1 : newId ); }
    });
  }
  /** Gets data from the database, store and keys provided. Can send back count number. Force to use cursor. Limit number of data returned and in what order with a start index.
   * @param {string} storeName - Store name    @param  {string} [key]     - Key Name     @param  {array} [keys]     - Key Names  @param  {string} [indexName] - Index Name
   * @param {bool} [count]     - Count Items?  @param  {bool} [useCursor] - Use Cursor?  @param  {bool} [ascending] - Ascending?
   * @param {number} [limit]   - Limit Number  @param {number} [start]    - Index to start at
   * @return {promise}         - Array or object in resolve. Error object in reject. */
  getFromDB(storeName, key=null, keys=null, indexName=null, count=false, useCursor=false, ascending=true, limit=0, start=0) {
    return new Promise( (resolve, reject) => {
      let tx = this.db.transaction( [storeName], 'readonly' ), store = tx.objectStore(storeName), filledData = {}, direction = (ascending) ? 'next' : 'prev';
      if (keys === null) {
        let using = (indexName) ? store.index(indexName) : store, allKey = (indexName) ? key : _, cursorArray = [];
        if (useCursor) {
          let cursorRequest = using.openCursor(allKey, direction);
          cursorRequest.onsuccess = e => {
            let cursor = e.target.result;
            if (cursor) {
              cursorArray.push(cursor.value);
              if (limit === 0 || (limit && cursorArray.length < limit)) cursor.continue(); else resolve(cursorArray);
            } else resolve(cursorArray);
          }
          cursorRequest.onabort = () => { reject(new Error(`Get cursor from: ${storeName} error: ${cursorRequest.error.message}`)); }
        } else {
          let request = (key !== null && !allKey) ? using.get(key) : (count) ? using.count(allKey) : using.getAll(allKey);
          request.onsuccess = () => { resolve(request.result); };
          request.onabort = () => { reject(`Get from: ${storeName} error: ${request.error.message}`); };
        }
      } else {
        for (const thisKey of keys) { filledData[thisKey] = null; store.get(thisKey).onsuccess = e => { filledData[thisKey] = e.target.result; } }
        tx.oncomplete = () => resolve(filledData);
      }
    });
  }
  /** Delete an item or items from a database with a key using an index if necessary.
   * @param {string} storeName - Store name  @param {string} key - Key  @param {string} [indexName] - Index name
   * @return {promise}         - Key in resolve. Error object in reject. */
  deleteFromDB(storeName, key, indexName=null) {
    return new Promise( (resolve, reject) => {
      let completed = false, error = '', tx = this.db.transaction( [storeName], 'readwrite' ), store = tx.objectStore(storeName);
      if (indexName) { // Should an index be used for the key?
        const index = store.index(indexName), listDel = index.getAllKeys(key); // Get all items with this key in index.
        listDel.onsuccess = () => { completed = true; listDel.result.forEach(mainKey => { store.delete(mainKey); }); };
        listDel.onerror = () => { error = listDel.error.message; }; // Error when problems with index happen.
      } else {
        let count = store.count(key); count.onsuccess = () => { // Get number of items with Key
          if (count.result > 0 && key !== null) { const request = store.delete(key); request.onsuccess = () => { completed = true; } }
          else if (key === null) { store.clear(); completed = true; }
          else { error = `KEY: [${key}] not found in ${storeName}`; } // Error if key not found.
        }
      }
      tx.onabort = () => { reject(`DEL from: ${storeName} error: ${tx.error.message}`); }
      tx.oncomplete = () => { if (completed) resolve(key); else reject(`Del from: ${storeName} error: ${error}`); }
    });
  }
  /** Clear the data from a store name in this database.
   * @param  {string} storeName - Store name to be used for adding data to.
   * @return {promise}          - Key in resolve. Error object in reject. */
  clearStore(storeName) {
    return new Promise( (resolve, reject) => {
      let tx = this.db.transaction( [storeName], 'readwrite' );
      tx.objectStore(storeName).clear();
      tx.oncomplete = () => { resolve(true); };
      tx.onabort = () => { reject(new Error(`Clear from: ${storeName} error: ${tx.error.message}`)); };
    });
  }
  /** Close the database. Usually before deleting it for complete reset. */
  closeDB() { if (this.db) this.db.close(); }
}