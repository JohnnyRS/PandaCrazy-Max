/**
 * Class dealing with any debug logging or error logging.
 * From options it will know when to show a log or error on console. Will even halt program if needed.
 */
class DebuggerClass {
  constructor() {
    this.onPage = true;
    this.inModal = true;
    this.consoleLogE = 
    this.consoleLogL = 3; // console.log Log level
    this.errorLevel = 2; // Level number for reporting errors.
    /**
      * 0-fatal = Errors that can crash or stall program.
      * 1-error = Errors that shouldn't be happening but may not be fatal.
      * 2-warn = Warnings of errors that could be bad but mostly can be self corrected.
      */
    this.logLevel = 3; // Level number for reporting debugging information.
    /**
      * 1-info = Shows basic information of progress of program.
      * 2-debug = Shows the flow of the program with more debugging information.
      * 3-trace = More details shown including variable contents and functions being called.
      * 4-trace urls = Shows full details of variables, functions, fetching urls and flow of program.
      */
    this.classesLog = { // Name of classes to log only or log all.
      'all':true, 'Main':false, 'TimerClass':false, 'LogTabsClass':false, 'MturkQueue':false
    }
  }
  /**
   * Checks the error number, debug number and className for permission to display a message.
   * @param {number} eLevel       Level error number for an error message.
   * @param {number} lLevel       Level logging number for a debug message.
   * @param {string} className    The name of the class logging a debug or error message.
   * @return {bool}               Returns true if good to show message.
   */
  checkDebug( eLevel, lLevel, className ) { 
    let returnValue = false;
    if (eLevel!=-1 && this.errorLevel>=eLevel) returnValue = true; // Is error level number good to log?
    if (lLevel!=-1 && this.logLevel>=lLevel) returnValue = true; // Is log level number good to log?
    if (returnValue && !this.classesLog.all) { // Check if className is permitted to log errors or log info?
      if (className!='' && this.classesLog.hasOwnProperty(className) && this.classLog[className]) returnvalue=true;
      else returnvalue=false;
    }
    return returnValue;
  }
  /**
   * Checks the error number only for permission to display a message.
   * @param  {number} eLevel      Level error number for an error message.
   * @param  {string} className   The name of the class logging a debug or error message.
   * @return {bool}               Returns true if good to show message.
   */
  checkErrorDebug(eLevel, className) { return this.checkDebug(eLevel, -1, className); }
  /**
   * Checks the log number only for permission to display a message.
   * @param  {number} lLevel      Level logging number for a debug message.
   * @param  {string} className   The name of the class logging a debug or error message.
   * @return {bool}               Returns true if good to show message.
   */
  checkLogDebug(lLevel, className) { return this.checkDebug(-1, lLevel, className); }
  /**
   * @param  {number} number
   * @param  {string} theClass
   * @param  {string} description
   * @param  {string} title
   * @param  {string} type
   * @param  {number} consoleNumber
   * @param  {bool} bg
   */
  addDebugItem(number, theClass, description, title, type, consoleNumber, bg) {
    let now = new Date(), justDate = now.toISOString().split('T')[0];
    // check if saving to file database is permitted by checking file number
    if (consoleNumber>=number) { // check if showing to console is permitted by checking console number
      if (bg) console.log(description); else return true; // show description on bg console or current window console
    }
    return false;
  }
  /**
   * @param  {number} number
   * @param  {string} theClass
   * @param  {string} description
   * @param  {string} title='log'
   * @param  {bool} bg=true
   */
  logThis(number, theClass, description, title='log', bg=true) { // for logging or debugging info
    if (!this.checkLogDebug(number,theClass)) return; // check if logging is permitted for this number level
    return this.addDebugItem(number, theClass, description, title, 'log', this.logLevel, bg);
  }
  /**
   * @param  {number} number
   * @param  {string} theClass
   * @param  {string} description
   * @param  {string} title='error'
   * @param  {bool} bg=true
   */
  logError(number, theClass, description, title='error', bg=true) { // for error or warning info
    if (!this.checkErrorDebug(number,theClass)) return; // check if error logging is permitted for thie number level
     return this.addDebugItem(number, theClass, description, title, 'error', this.errorLevel, bg);
  }
}

const gDebugLog = new DebuggerClass();

// global functions so popup pages can use it instead of messaging.
function logThis(num, theClass, desc, title) { return gDebugLog.logThis(num, theClass, desc, title, false); }
function logError(num, theClass, desc, title) { return gDebugLog.logError(num, theClass, desc, title, false); }
function dError(levelNumber, className) { return gDebugLog.checkErrorDebug(levelNumber, className); }
function dLog(levelNumber, className) { return gDebugLog.checkLogDebug(levelNumber, className); }
