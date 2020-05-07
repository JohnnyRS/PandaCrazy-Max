class DebuggerClass {
  constructor(dbName,storeName,version) {
    this.dbName = dbName; // name of database to be used
    this.storeName = storeName; // name of the store name to be used
    this.dbVersion = version; // the version number for this database
    this.consoleLogE = 0; // console.log error level
    this.consoleLogL = 3; // console.log Log level
    this.fileLogE = 0; // file error level
    this.fileLogL = 3; // file log level
    this.errorLevel = this.consoleLogE | this.fileLogE; // 0-fatal = Errors that can crash or stall program,
      // 1-warn = Warnings of errors that could be bad most mostly can be self corrected,
      // 2-error = Errors that shouldn't be happening but may not be fatal
    this.logLevel = this.consoleLogL | this.fileLogL; // 1-info = Minimal information of actions,
      // 2-debug = Details of the flow of the process,
      // 3-trace = More details of the flow of variables and functions being called,
      // 4-trace urls = Full details of what urls being checked at each time.
    this.classesLog = {
      "all":true, "TimerClass":false, "LogTabsClass":false, "MturkQueue":false
    }
    this.debugDB = new DatabaseClass(this.dbName, version); // using indexedDB for fileLog so user has to save log to a file
  }
  checkDebug( eLevel, lLevel, className ) {
    let returnValue = false;
    if (eLevel!=-1 && this.errorLevel>=eLevel) returnValue = true; // is error level number good to log?
    if (lLevel!=-1 && this.logLevel>=lLevel) returnValue = true; // is log level number goot to log?
    if (returnValue && !this.classesLog.all) { // if something to log but only logging certain classes
      // check if className is permitted to log errors or log info?
      if (className!="" && this.classesLog.hasOwnProperty(className) && this.classLog[className]) returnvalue=true;
      else returnvalue=false;
    }
    return returnValue;
  }
  checkErrorDebug(eLevel, className) { return this.checkDebug(eLevel, -1, className); } // check if write to error log
  checkLogDebug(lLevel, className) { return this.checkDebug(-1, lLevel, className); } // check if write to log debug
  openDebuggerDB() {
    return new Promise( (resolve, reject) => { // using a promise to make opening database synchronous so it waits
      this.debugDB.openDB( false, (e) => {
        if (e.oldVersion == 0) { // Had no database so let's initialise it.
          let objectStore = e.target.result.createObjectStore(this.storeName, {keyPath:"dateTime"});
          objectStore.createIndex("date", "date", {unique:false}); // date is an index to search faster
          objectStore.createIndex("type", "type", {unique:false}); // type of log is an index to search faster
          objectStore.createIndex("class", "class", {unique:false}); // class name is an index to search faster
        }
      } ).then( response => resolve(response) ).catch( error => reject(error) );
    });
  }
  addDebugItem(number, theClass, description, title, type, fileNumber, consoleNumber, bg) {
    // now will be the exact date now. justDate is the date now without the time information
    let now = new Date(), justDate = now.toISOString().split("T")[0];
    // check if saving to file database is permitted by checking file number
    if (fileNumber>=number) this.debugDB.addToDB( this.storeName, { "dateTime": now.getTime()+ Math.random(), "date": justDate, "class": theClass, "type": type, "number": number, "title": encodeURI(title), "description": encodeURI(description) } )
        .then( event => {} ) // do nothing if add to database was good.
        .catch( error => console.log(error.message) ); // show the error message if adding to database failed
    if (consoleNumber>=number) { // check if showing to console is permitted by checking console number
      if (bg) console.log(description); else return true; // show description on bg console or current window console
    }
    return false;
  }
  logThis(number, theClass, description, title="log", bg=true) { // for logging or debugging info
    if (!this.checkLogDebug(number,theClass)) return; // check if logging is permitted for this number level
    return this.addDebugItem(number, theClass, description, title, "log", this.fileLogL, this.consoleLogL, bg);
  }
  logError(number, theClass, description, title="error", bg=true) { // for error or warning info
    if (!this.checkErrorDebug(number,theClass)) return; // check if error logging is permitted for thie number level
     return this.addDebugItem(number, theClass, description, title, "error", this.fileLogE, this.consoleLogE, bg);
  }
  saveToFile() { // save this debug database to a file
    this.debugDB.getFromDBCursor( this.storeName, (cursor) => {
      return `${cursor.value.date} - ${decodeURI(cursor.value.description)}` + "\n";
    } ).then( result => { saveToFile(result); } )
      .catch( error => console.log(error.message) ); // show any error messages if getting from database failed
  }
}

let debuggerGood = false, debuggerErrorMessage="", gDebugLog = new DebuggerClass("debugTest", "debug", 1);
gDebugLog.openDebuggerDB().then( e => { debuggerGood = true; })
  .catch(error => { console.log(error.message); debuggerErrorMessage=error.message; });
// global functions so popup pages can use it instead of messaging.
function gCheckDebugger() { return debuggerGood; } // did the debugger open up with no errors?
function gDebugLogThis(num, theClass, desc, title) { return gDebugLog.logThis(num, theClass, desc, title, false); }
function gDebugLogError(num, theClass, desc, title) { return gDebugLog.logError(num, theClass, desc, title, false); }
function gDebugToFile() { gDebugLog.saveToFile(); }
