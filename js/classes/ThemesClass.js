function loadCSS(cssStyles) {
  const link = document.createElement('link');
  link.href = `data:text/css;base64,${btoa(cssStyles)}`;
  link.type = 'text/css';
  link.id = 'pcm-usingTheme'
  link.rel = 'stylesheet';
  document.getElementsByTagName('head')[0].appendChild(link);
}

loadCSS(``);
setTimeout(() => {
 // $(`#pcm-usingTheme`).remove();
}, 10000);