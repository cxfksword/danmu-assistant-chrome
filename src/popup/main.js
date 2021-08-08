// 非B站播放页显示使用提示
chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
    if (tabs[0].url.indexOf("bilibili.com/bangumi/play/") > -1 || tabs[0].url.indexOf("bilibili.com/video/") > -1) {
        document.querySelector("#warning").style.display = "none";
        document.querySelector("#app").style.display = "block";
    } else {
        document.querySelector("#warning").style.display = "block";
        document.querySelector("#app").style.display = "none";
    }
});

import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus';
import 'element-plus/lib/theme-chalk/index.css';

const app = createApp(App)
app.use(ElementPlus)
app.mount('#app')
