// ---- Methods to get static files from GitHub

const proxyFetch = (url: string) => {
  return fetch(
    'https://api.codetabs.com/v1/proxy/?quest=' + url,
    undefined,
  ).then((res) => {
    if (!res.ok) throw new Error('Could not load ' + url)
    return res.text();
  })
}

const loadData = (data: string, element: string) => {
  // Method to load CSS, JS, and other elements into the preview body.
  if (data) {
    var style = document.createElement(element)
    style.innerHTML = data
    document.head.appendChild(style)
  }
}

const loadPageElements = (uri: string) => {
    // Next, load CSS for styles
    const link = document.querySelectorAll<HTMLLinkElement>('link[rel=stylesheet]');
    console.log(link)
    const links = [];
    for (let i = 0; i < link.length; ++i) {
        let href = link[i].href;
        links.push(proxyFetch(href));
    }
    Promise.all(links).then(function (res) {
        for (let i = 0; i < res.length; ++i) {
            loadData(res[i], 'style');
        }
    });
    // Load page JS
    const script = document.querySelectorAll<HTMLScriptElement>('script[type="text/javascript"]');
    const scripts = [];
    for (let i = 0; i < script.length; ++i) {
        const src = script[i].src; //Get absolute URL
        if (src.indexOf('//raw.githubusercontent.com') > 0) { //Check if it's from raw.github.com or bitbucket.org
            scripts.push(proxyFetch(src)); //Then add it to scripts queue and fetch using CORS proxy
        } else {
            script[i].removeAttribute('type');
            scripts.push(script[i].innerHTML); //Add inline script to queue to eval in order
        }
    }
    Promise.all(scripts).then(function (res) {
        for (let i = 0; i < res.length; ++i) {
            loadData(res[i], 'script');
        }
        document.dispatchEvent(new Event('DOMContentLoaded', {bubbles: true, cancelable: true})); //Dispatch DOMContentLoaded event after loading all scripts
    });

}

const isHTML = (text: string) => {
    var a = document.createElement('div');
    a.innerHTML = text;

    for (var c = a.childNodes, i = c.length; i--; ) {
      if (c[i].nodeType == 1) return true; 
    }
    return false;
  }

const loadHTML = (data: string, url: string) => {
  // Load HTML into an iFrame
  if (data && isHTML(data)) {
    console.log(data);
    data = data.replace(/<head([^>]*)>/i, '<head$1><base href="' + url + '">')
    setTimeout(function () {
      document.open()
      document.write(data)
      document.close()
      loadPageElements(url);
    }, 10) //Delay updating document to have it cleared before
  }
}

const renderPage = (url: string) => {
  // Check for source uri string, which follows several different cases.
  if (url.indexOf('.html') > 0) {
    // The user has provided us with an index.html file.
    // Simply return this same URL, as it is our source.
    url = url
      .replace('//github.com/', '//raw.githubusercontent.com/')
      .replace(/\/blob\//, '/') //Get URL of the raw file

    proxyFetch(url)
      .then((data) => {
          loadHTML(data, url)
      })
      .catch(function (error) {
        console.error(error)
      })
  }
  // Otherwise, we need to check if index.html exists. Try /main/ and /master/.
  url = url
    .replace('//github.com/', '//raw.githubusercontent.com/')
    .replace(/\/blob\//, '/') // Get URL of the raw file
  const urls = [url + '/main/index.html', url + '/master/index.html']
  for (let u of urls) {
    proxyFetch(u)
      .then((data) => {
          loadHTML(data, u)
        })
      .catch(function (error) {
        console.error(error)
      })
  }
  // If none of these paths leads to an index.html file, that means there is no index.html file in this repo.
  // Inform the user.
  return null
}

export { renderPage }