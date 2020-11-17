'use strict'
/** This class gets the earnings from the dashboard for the current date.
 * @class MturkDashboard
 * @extends MturkClass
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class MturkDashboard extends MturkClass {
	constructor() {
    super();
    this.disconnected = false;
    this.firstCheck = false;
    this.dashDone = false;
    this.interrupt = false;
    this.loggedOff = false;
    this.paused = false;
    this.minTimer = 400;
    this.page = 1;
    this.total = 0.00;
    this.dashUrl = 'https://worker.mturk.com/status_details/';
  }
  isFetching() { return !this.dashDone; }
  /** Starts calculating the earnings for today by checking the dashboard. */
  doDashEarns(start=true) { if (start) { this.dashDone = false; this.total = 0.00; this.page = 1; } this.goFetch(); }
	/** Stop the queue monitor by removing job from timer queue. */
	stopDashEarns(paused=false) { if (paused) this.paused = true; else { this.dashDone = true; extPandaUI.setEarnings(this.total) } }
  /** Changes the timer to a longer time and informs panda and search class when logged off. */
  nowLoggedOff() { this.loggedOff = true; this.stopDashEarns(true); }
  /** Changes the timer to the normal time and informs panda and search class when logged back in. */
  nowLoggedOn() { this.loggedOff = false; this.paused = false; if (!this.dashDone) this.doDashEarns(false); }
  /** Fetches the url for the queue after timer class tells it to do so and handles mturk results.
   * Can detect logged off, PRE's and good queue results. */
  goFetch() {
    let theDate = moment().format('YYYY-MM-DD'), urlString = `${this.dashUrl}${theDate}`, startTime = new Date().getTime();
    urlString = urlString + ((this.page > 1) ? `/?page_number=${this.page}` : '/'); let theUrl = new UrlClass(urlString);
    super.goFetch(theUrl).then(result => {
      if (!result) { console.error('Returned result fetch was a null.', JSON.stringify(theUrl)); }
      else {
        if (result.mode === 'logged out') { this.nowLoggedOff(); }
        else if (result.type === 'ok.text') {
          if (this.loggedOff) this.nowLoggedOn();
          let errorPage = $(result.data).find('.error-page');
          if (errorPage.length > 0) {
            let errorMessage = errorPage.find('p.message').html();
            if (errorMessage.includes('We have detected an excessive rate of page')) console.info('%cReceived a dash PRE!!',CONSOLE_WARN);
            errorMessage = null;
          } else {
            let pagination = $(result.data).find(`.pagination-holder:first div[data-react-props]`).attr('data-react-props');
            if (!pagination && this.page !== 1) { this.interrupt = true; this.stopDashEarns(); }
            else if (!pagination && this.page === 1) { this.firstCheck = true; this.stopDashEarns(); }
            else {
              extPandaUI.waitEarningsPage(this.page);
              let pageData = JSON.parse(pagination), targetDiv = $(result.data).find(`.hits-status-details-table-header:first`).next('div'), total = 0.00;
              let rawProps = targetDiv.find('div[data-react-props]').attr('data-react-props'), hitsData = JSON.parse(rawProps).bodyData;
              for (const hit of hitsData) { if (hit.status !== 'Rejected') total += hit.reward; }
              this.total += parseFloat(parseFloat(total).toFixed(2)); this.page++;
              let endTime = new Date().getTime() - startTime, leftover = this.minTimer - endTime, newTimer = (leftover > 0) ? leftover : 0;
              if (pageData.currentPage === pageData.lastPage) { this.firstCheck = true; this.stopDashEarns(); }
              else setTimeout(() => { this.goFetch(); }, newTimer);
              targetDiv = null; rawProps = null; pageData = null;
            }
            pagination = null;
          }
          errorPage = null;
        } else if (result.type === 'caught.error') {
          if (JSON.stringify(result.status).includes('Failed to fetch')) { console.log('disconnected'); this.disconnected = true; this.stopDashEarns(true); }
          console.log(`Mturk might be slow or you're disconnected. Received a service unavailable error.`);
        }
      }
      result = null;
    });
  }
}
