class DatabaseClass {
  constructor( dbName, dbVersion ) {
    this.db = null; // database pointer
    this.dbName = dbName; // name of database to be used
    this.dbVersion = dbVersion; // the version number for this database
    this.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
  }
  openDB( deleteFirst, upgrade ) {
    return new Promise( (resolve, reject) => { // using a promise to make opening database synchronous so it waits
      if (!this.indexedDB) reject(Error("indexedDB is Not supported")); // if no indexedDB then big fail
      else {
        if (deleteFirst) { // used to delete database but temporary for testing purposes
          let deleteRequest = this.indexedDB.deleteDatabase( this.dbName ); // delete database
          deleteRequest.onerror = e => { console.log(e.target.error.message); } // show error if deleting database failed
        }
        let openRequest = this.indexedDB.open( this.dbName, this.dbVersion ); // try to open databse
        openRequest.onupgradeneeded = e => { upgrade(e); } // if need to upgrade then call upgrade function
        openRequest.onsuccess = e => { this.db = e.target.result; resolve("OPENED"); } // set database pointer on success
        openRequest.onerror = error => { reject(error); } // reject promise if open database failed
      }  
    });
  }
  addToDB( storeName, data ) {
    return new Promise( (resolve, reject) => { // using a promise to make adding to database synchronous so it waits
      let transaction = this.db.transaction( [storeName], "readwrite" ); // start tranasaction first with read/write
      let items = transaction.objectStore( storeName ); // create object store on transaction
      let request = items.add(data); // request to add data to object store
      request.onsuccess = e => { } // do nothing on success because transaction oncomplete will take care of it
      request.onerror = e => { } // do nothing on error because transaction onerror will take care of it
      transaction.onerror = e => { reject(e.target.error); } // reject promise if an error happened
      transaction.oncomplete = e => { resolve("ADDED"); } // resolve promise on success
    });
  }
  getFromDBCursor( storeName, doWithCursor ) {
    return new Promise( (resolve, reject) => { // using a promise to make getting from database synchronous so it waits
      let transaction = this.db.transaction( [storeName], "readonly" ); // start transaction first with read only
      let store = transaction.objectStore( storeName ); // create object store on transaction
      let myArray = ""; // create an array to store the data from database
      let request = store.openCursor(); // let's open a curosr on transaction
      request.onsuccess = (e) => { // on success get cursor and call doWithCursor function
        let cursor = e.target.result; // get cursor object
        if (cursor) {
          myArray += doWithCursor(cursor); // add to array with whatever returned from doWithCursor function
          cursor.continue(); // continue with next cursor
        }
      };
      request.onerror = e => { } // do nothing on error because transaction onerror will take care of it
      transaction.onerror = e => reject(e.target.error); // reject promise if an error happened
      transaction.oncomplete = e => resolve(myArray); // resolve promise on success
    });
  }
}