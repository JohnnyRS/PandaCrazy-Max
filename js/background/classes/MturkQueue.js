class MturkQueue extends MturkClass {
	constructor(timer, loggedOffTimer=5000) {
    super();
    this.timer = timer;
    this.loggedOffTimer = loggedOffTimer;
    this.queueUnique = null;
    this.queueUrl = new UrlClass("https://worker.mturk.com/tasks");
    this.queueResults = [];
    this.loggedOff = false;
    this.authenticityToken = null;
		queueTimer.setMyClass(this);				// Tell timer what class is using it so it can send information back
		queueTimer.setTimer(timer);
  }
  timerInfo(infoObj) {}
  sendQueueResults() {
    myPanda.gotNewQueue(this.queueResults,this.authenticityToken);
    mySearch.gotNewQueue(this.queueResults,this.authenticityToken);
  }
  setTimer(timer) { this.timer = timer; }
  startQueueMonitor() {
    if (!queueTimer.running) {
      gDebugLog.logThis(1, "MturkQueue", "Starting Queue Monitor.");
      this.queueUnique = queueTimer.addToQueue(-1, this, (unique, elapsed, myId, obj) => { obj.goFetch(obj.queueUrl, unique, elapsed); }, (myId, obj) => { obj.stopQueueMonitor(); });
    }
  }
	stopQueueMonitor() {
    gDebugLog.logThis(1, "MturkQueue", `Stop queue monitor. delete ${this.queueUnique}`);
    queueTimer.deleteFromQueue(this.queueUnique);
  }
  totalResults(rId="", gId="", price=0) {
    let total = 0;
    if (gId!=="") total = this.queueResults.filter( item => item.project.hit_set_id===gId ).length;
    else if (rId!=="") total = this.queueResults.filter( item => item.project.requester_id===rId ).length;
    else total = parseFloat(this.queueResults.map( item => item.project.monetary_reward.amount_in_dollars )
      .reduce( (acc, reward) => { return acc +  ( (reward>price) ? reward : 0 ); }, 0 )).toFixed(2);
    return total;
  }
  nowLoggedOff() {
    this.loggedOff = true; queueTimer.setTimer(this.loggedOffTimer);
    myPanda.nowLoggedOff(); mySearch.nowLoggedOff(); // show logged off warning on all running windows.
  }
  nowLoggedOn() {
    this.loggedOff = false; queueTimer.setTimer(this.timer);
    myPanda.nowLoggedOn(); mySearch.nowLoggedOn(); // remove logged off warning on all running windows.
  }
  goFetch(objUrl, queueUnique, elapsed) { // Can deal with getting search results data.
		super.goFetch(objUrl).then(result => {
      gDebugLog.logThis(4, "MturkQueue", `going to fetch ${JSON.stringify(objUrl)}`);
			if (result.mode === "logged out" && queueUnique !== null) { this.nowLoggedOff(); }
      else if (result.type === "ok.text") {
        if (this.loggedOff) this.nowLoggedOn();
        const html = $.parseHTML( result.data );
        const errorPage = $(html).find(".error-page");
        if (errorPage.length>0) {
          const errorMessage = $(errorPage).find("p.message").html();
          if (errorMessage.includes("We have detected an excessive rate of page"))
            gDebugLog.logThis(1, "MturkQueue", "Received a Queue PRE!!");
        } else {
          const targetDiv = $(html).find(".task-queue-header").next("div");
          const rawProps = $(targetDiv).find("div[data-react-props]").attr("data-react-props");
          const authenticityToken = $(html).filter('meta[name="csrf-token"]')[0].content;
          if (authenticityToken) this.authenticityToken = authenticityToken;
          this.queueResults = JSON.parse(rawProps).bodyData;
          this.sendQueueResults();
        }
      }
    });
  }
}

if (chrome.runtime) {
  chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => {
    if (request.command === "startQueueMonitor") { myQueue.startQueueMonitor(); }
    else if (request.command === "totalResults") { sendResponse({hits:myQueue.totalResults(request.rId, request.gId, request.price)}); }
  });
}
