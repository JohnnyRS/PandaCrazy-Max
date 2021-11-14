/** This class deals with the use of themes to add to the CSS style of the pages.
 * @class ThemesClass ##
 * @author JohnnyRS - johnnyrs@allbyjohn.com */
class ThemesClass {
  constructor() {
    this.theStyle = ``;
    this.themeIndex = 0;
    this.modalOptions = null;
    this.pcmStylesheet = document.getElementById('pcm-stylesheet').getAttribute('href');
  }
  /** Loads a new css stylesheet in the header with the css styles provided.
   * @param {string} cssStyles - CSS Theme Styles */
  loadCSS(cssStyles) {
    let oldTheme = document.getElementById('pcm-usingTheme');
    if (oldTheme) { oldTheme.parentNode.removeChild(oldTheme); }
    let link = document.createElement('link');
    link.href = `data:text/css;base64,${btoa(cssStyles)}`; link.type = 'text/css'; link.id = 'pcm-usingTheme'; link.rel = 'stylesheet';
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  /** Loads the new CSS style theme and resets the default theme. Also will reset the CSS values from CSS variables.
   * @param {bool} [reset] - Reset Default Theme? */
  prepareThemes(reset=false) {
    this.themeIndex = MyOptions.theThemeIndex(); this.theStyle = MyOptions.theThemes();
    this.loadCSS(this.theStyle);
    if (reset) {
      document.getElementById('pcm-stylesheet').setAttribute('href', '');
      document.getElementById('pcm-stylesheet').setAttribute('href', this.pcmStylesheet);
      if (pandaUI) { pandaUI.resetCSSValues(); bgPage.themeChanged(); }
    }
  }
  /** Shows a dialog modal which allows the user to change the current theme by calling the showThemeModal from the modalOptions Class. */
  showThemeModal() { if (!this.modalOptions) this.modalOptions = new ModalOptionsClass(); this.modalOptions.showThemeModal( () => this.modalOptions = null ); }
}