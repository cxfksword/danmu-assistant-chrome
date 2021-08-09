'use strict';

var utils = {};

utils.getCurrentTabUrl = function (callback) {
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function (tabs) {
        var tab = tabs[0];
        callback(tab.title, tab.url);
    });
};

utils.ajax = function(url, option) {
    let  method = option.method || 'GET',
        data = option.data,
        headers = option.headers || {},
        timeout = option.timeout || 60000,
        success = option.success,
        error = option.error;

    let xhr = new XMLHttpRequest();
    xhr.timeout = timeout;
    xhr.onreadystatechange = function () {
        if (this.readyState === 4) {
            if (this.status === 200 || this.status === 304) {
                success && success(this);
            } else {
                error && error(this);
            }
        }
    };
    xhr.ontimeout = function () {
        console.error("网络请求超时, 请重试")
    };
    xhr.onerror = function () {
        console.error("响应错误")
    };
    xhr.open(method, url, true);
    for (let k in headers) {
        xhr.setRequestHeader(k, headers[k]);
    }
    if (data) {
        xhr.send(data);
    } else {
        xhr.send();
    }
}

utils.getUrlParameter = function(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

utils.paddingZero = function(number) {
    if (number < 10) {
        return `0${number}`
    } else {
        return `${number}`
    }
}

utils.removeQuerystring = function(url) {
    return url.replace(/(\?|#).*/gi, '');
}

utils.getPageOptions = function(key, url, callback) {
    chrome.storage.sync.get({ [key]: '{}' }, function(result) {
        if (result && result[key]) {
            const read = result[key];
            let options = JSON.parse(read);
            if (options && options.url && options.url == utils.removeQuerystring(url)) {
                callback(options.value)
                return
            }

        }

        callback({})
    });
}

utils.setPageOptions = function(key, options, url) {
    let data = {
        url : utils.removeQuerystring(url),
        value: options
    }
    let write = {}
    write[key] = JSON.stringify(data);
    chrome.storage.sync.set(write, function(value) {
        
    });
}

utils.getOptions = async function(key, callback) {
    chrome.storage.sync.get({ [key]: '{}' }, function(result) {
        if (result && result[key]) {
            const read = result[key];
            let options = JSON.parse(read);
            callback(options)
            return
        }

        callback({})
    });
}

utils.setOptions = function(key, options) {
    let write = {}
    write[key] =  JSON.stringify(options);
    chrome.storage.sync.set(write, function(value) {

    });
}


utils.extractAss = function(content) {
    let extractContent = '';
    let match = /\[V4\+\s+?Styles\][\w\W]+/.exec(content);
    if (match && match.length > 0) {
        extractContent = match[0];
    }

    match = /PlayResX\:\s*?(\d+)/.exec(content);
    if (match && match.length > 0) {
        let playResX = parseInt(match[1], 10);
        let changeRes = playResX - 560;
        let changeFontSize = changeRes > 0 ? Math.ceil(changeRes / 100) : Math.floor(changeRes / 100)

        extractContent = extractContent.replace(/Style\:.*?,.*?,(\d+?),/gi, function(match, p1) {
            let fontSize = parseInt(p1, 10) + changeFontSize;
            return match.replace(`,${p1},`, `,${fontSize},`);
        });
    }

    return extractContent;
}

utils.sleep = function (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

export default utils;