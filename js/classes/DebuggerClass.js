/** Class dealing with any debug logging or error logging.
 * From options it will know when to show a log or error on console. Will even halt program if needed.
 * @class DebuggerClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class DebuggerClass {
  constructor() {
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
      'all':true, 'Main':false, 'TimerClass':false, 'LogTabsClass':false, 'MturkQueue':false, 'MturkPanda':false, 'MturkHitSearch':false
    }
  }
  /** Checks the error number, debug number and className for permission to display a message.
   * @param {number} eLevel    - Level error number for an error message.
   * @param {number} lLevel    - Level logging number for a debug message.
   * @param {string} className - The name of the class logging a debug or error message.
   * @return {bool}            - Returns true if good to show message. */
  checkDebug( eLevel, lLevel, className ) { 
    let returnValue = false;
    if (eLevel != -1 && this.errorLevel >= eLevel) returnValue = true; // Is error level number good to log?
    if (lLevel != -1 && this.logLevel >= lLevel) returnValue = true; // Is log level number good to log?
    if (returnValue && !this.classesLog.all) { // Check if className is permitted to log errors or log info?
      if (className != '' && this.classesLog.hasOwnProperty(className) && this.classLog[className]) returnvalue=true;
      else returnvalue=false;
    }
    return returnValue;
  }
  /** Checks the error number only for permission to display a message.
   * @param  {number} eLevel    - Level error number for an error message.
   * @param  {string} className - The name of the class logging a debug or error message.
   * @return {bool}             - Returns true if good to show message. */
  checkErrorDebug(eLevel, className) { return this.checkDebug(eLevel, -1, className); }
  /** Checks the log number only for permission to display a message.
   * @param  {number} lLevel    - Level logging number for a debug message.
   * @param  {string} className - The name of the class logging a debug or error message.
   * @return {bool}             - Returns true if good to show message. */
  checkLogDebug(lLevel, className) { return this.checkDebug(-1, lLevel, className); }
}

const gDebugLog = new DebuggerClass();

// global functions so popup pages can use it in a short format instead of using debugger class name.
function dError(levelNumber, className) { return gDebugLog.checkErrorDebug(levelNumber, className); }
function dLog(levelNumber, className) { return gDebugLog.checkLogDebug(levelNumber, className); }
