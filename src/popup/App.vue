<template>
  <div>
    <div class="title-container">
      <div class="title">bilibili弹幕下载助手</div>
      <div
        id="options-link"
        class="top-button"
        title="Options"
        @click="toggleSettings()"
      >
        <i class="el-icon-s-tools">&nbsp;</i>
      </div>
    </div>

    <div class="content">
      <div id="settings" v-show="showSettings">
        <el-form ref="settings" inline="true" label-position="right">
          <el-form-item
            label="字体透明度,范围: 10~100. 100为全透明"
            class="reverse"
          >
            <el-input v-model.number="settings.textOpacity"></el-input>
          </el-form-item>
        </el-form>
      </div>
      <el-card class="box-card">
        <el-form ref="form" label-position="top" label-width="80px">
          <el-form-item :model="form" label="1/ 当前页面弹幕" prop="danmu">
            <el-checkbox-group v-model="form.danmu">
              <el-checkbox
                :label="d.cid"
                v-bind:key="d.cid"
                v-for="d in form.epList"
                >{{ d.showTitle }}</el-checkbox
              >
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="2/ 弹幕偏移(秒)">
            <el-tooltip class="item" effect="dark" placement="top">
              <template #content>
                正数延后, 负数提前, 用于跳过一些多余的片头时间，如：<br />
                &nbsp;3 表示弹幕延后3秒显示<br />
                -3 表示弹幕提前3秒显示<br />
              </template>
              <el-input
                v-model.number="form.offset"
                placeholder="正数延后, 负数提前"
              ></el-input>
            </el-tooltip>
          </el-form-item>
          <el-form-item label="3/ 合并字幕">
            <el-tooltip class="item" effect="dark" placement="top">
              <template #content> 需保持和选中的字幕数量一致 </template>
              <div class="choose_ass" v-on:click="chooseAss">
                {{ chooseAssTips }}
              </div>
            </el-tooltip>

            <input
              id="ass"
              type="file"
              @change="selectFile"
              v-show="false"
              multiple
            />
          </el-form-item>
          <el-form-item label="4/ 文件重命名">
            <el-tooltip class="item" effect="dark" placement="top">
              <template #content>
                {title}:视频标题 {ep_title}:每集标题 {number}:集数<br />
              </template>
              <el-input
                v-model="form.rename"
                placeholder="支持的替换变量："
              ></el-input>
            </el-tooltip>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              @click="submit()"
              icon="el-icon-download"
              :loading="loading"
            >
              下载/合并弹幕
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script>
import utils from "../assets/js/utils";
import { saveAs } from "file-saver";
export default {
  data() {
    return {
      media: {
        title: "",
      },
      showSettings: false,
      settings: {
        textOpacity: 60,
      },
      form: {
        epList: [],
        danmu: [],
        ass: "",
        offset: "",
        rename: "",
      },
      options: {
        font_size: "",
        font_opacity: "",
        offset: "",
        move_speed: "",
      },
      chooseAssDefaultTips: "点击此处选择字幕文件，支持ass/srt",
      chooseAssTips: "",
      pageUrl: "",
      loading: false,
    };
  },
  created() {
    let $this = this;
  },
  mounted() {
    let $this = this;

    $this.chooseAssTips = $this.chooseAssDefaultTips;
    utils.getCurrentTabUrl(function (title, url) {
      console.warn(url);
      $this.pageUrl = url;
      $this.restoreSettings(url);
      $this.fetchCid(url);
    });
  },
  methods: {
    restoreSettings: function (url) {
      let $this = this;

      utils.getOptions("settings", function (settings) {
        if (settings && settings.textOpacity) {
          $this.settings.textOpacity = settings.textOpacity;
        }
      });

      utils.getPageOptions("page-settings", url, function (pageSettings) {
        if (pageSettings && pageSettings.offset) {
          $this.form.offset = pageSettings.offset;
        }
        if (pageSettings && pageSettings.rename) {
          $this.form.rename = pageSettings.rename;
        }
      });
    },
    saveSettings: function (url) {
      let $this = this;

      utils.setOptions("settings", $this.settings);

      utils.setPageOptions(
        "page-settings",
        {
          offset: $this.form.offset,
          rename: $this.form.rename,
        },
        url
      );
    },
    fetchCid: function (url, done) {
      if (
        url.indexOf("bilibili.com/bangumi/play/") < 0 &&
        url.indexOf("bilibili.com/video/") < 0
      ) {
        return;
      }

      let $this = this;
      $this.form.epList.splice(0);
      $this.form.danmu = [];
      $this.media.title = "";

      //普通视频
      if (/\/video\/BV.*/.test(url)) {
        let p = utils.getUrlParameter("p", url) || 1;
        let bvid = /\/video\/(BV.*)/.exec(utils.removeQuerystring(url))[1];
        utils.ajax(
          `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
          {
            success: function (res) {
              let videoJson = JSON.parse(res.responseText);
              if (videoJson && videoJson.data) {
                for (let i = 0; i < videoJson.data.pages.length; i++) {
                  const el = videoJson.data.pages[i];
                  $this.form.epList.push({
                    number: utils.paddingZero(i + 1),
                    cid: el.cid,
                    title: el.part,
                    showTitle:
                      videoJson.data.pages.length > 1
                        ? `P${i + 1} ${el.part}`
                        : el.part,
                  });
                }
                $this.form.danmu.push($this.form.epList[p - 1].cid);
                $this.media.title = videoJson.data.title;
              }
            },
          }
        );
      }

      //番剧/电影播放页
      if (/\/bangumi\/play\/ep\d+/.test(url)) {
        utils.ajax(url, {
          success: function (res) {
            let epList = new RegExp(/"epList":(\[{".+}]),"epInfo"/).exec(
              res.responseText
            );
            if (!!epList && epList.length) {
              let epListJson = JSON.parse(epList[1]);
              for (let i = 0; i < epListJson.length; i++) {
                const epJson = epListJson[i];
                $this.form.epList.push({
                  number: utils.paddingZero(i + 1),
                  cid: epJson.cid,
                  title: epJson.title,
                  showTitle: epJson.titleFormat,
                });
              }
            }

            let epInfo = new RegExp(/"epInfo":(\{.+?\}),"sections"/).exec(
              res.responseText
            );
            if (!!epInfo && epInfo.length) {
              let epJson = JSON.parse(epInfo[1]);
              $this.form.danmu.push(epJson.cid);
            }

            let match = /"h1Title":"(.+?)",/.exec(res.responseText);
            if (match && match.length > 1) {
              $this.media.title = match[1];
            }
          },
        });
      }

      //番剧/电影剧集页
      if (/\/bangumi\/play\/ss\d+/.test(url)) {
        utils.ajax(url, {
          success: function (res) {
            let epList = new RegExp(/"epList":(\[{".+}]),"epInfo"/).exec(
              res.responseText
            );
            if (!!epList && epList.length) {
              let epListJson = JSON.parse(epList[1]);
              for (let i = 0; i < epListJson.length; i++) {
                const epJson = epListJson[i];
                $this.form.epList.push({
                  number: utils.paddingZero(i + 1),
                  cid: epJson.cid,
                  title: epJson.title,
                  showTitle: epJson.titleFormat,
                });
                if (i == 0) {
                  $this.form.danmu.push(epJson.cid);
                }
              }
            }

            let match = /"h1Title":"(.+?)",/.exec(res.responseText);
            if (match && match.length > 1) {
              $this.media.title = match[1];
            }
          },
        });
      }
    },
    fetchDanmuXml: function (cid) {
      let $this = this;

      return new Promise((resolve, reject) => {
        let url = "https://api.bilibili.com/x/v1/dm/list.so?oid=" + cid;
        utils.ajax(url, {
          success: function (res) {
            const { id, danmaku } = window.danmaku.parser.bilibili_xml(
              res.responseText
            );

            resolve({
              id: `bilibili-${cid}`,
              meta: { url },
              content: danmaku,
            });
          },
          error: function (e) {
            reject(e);
          },
        });
      });
    },
    chooseAss: function () {
      document.querySelector("#ass").click();
    },
    selectFile: function (e) {
      let $this = this;
      let file = e.target.value;

      let countTips = "";
      e.target.files.length > 1 ? ` (${e.target.files.length})` : "";
      let endTips = "";
      if (e.target.files.length > 1) {
        countTips = ` (${e.target.files.length})`;
        endTips =
          "..." + e.target.files[e.target.files.length - 1].name.substr(-10);
      }
      $this.chooseAssTips = file.replace(/.*[\/\\]/, "") + endTips + countTips;
      $this.form.ass = e.target.value;
    },
    toggleSettings: function () {
      this.showSettings = !this.showSettings;
    },
    getSelectedEpList: function () {
      let epList = [];
      for (let i = 0; i < this.form.epList.length; i++) {
        const el = this.form.epList[i];
        if (this.form.danmu.indexOf(el.cid) >= 0) {
          epList.push(el);
        }
      }

      return epList;
    },
    getDownloadName(epInfo) {
      let $this = this;

      let name = $this.form.rename || "{video_title}-{ep_title}";
      return name
        .replace(/{title}/gi, $this.media.title)
        .replace(/{video_title}/gi, $this.media.title)
        .replace(/{ep_title}/gi, epInfo.title)
        .replace(/{number}/gi, epInfo.number);
    },
    async mergeOptions() {
      let $this = this;

      const [globalOptions] = await Promise.all([window.options.get()]);

      let options = { ...globalOptions, ...$this.settings };
      options = { ...options, ...{ offset: $this.form.offset || 0.0 } };
      console.log(options);
      return options;
    },
    submit: async function () {
      let $this = this;
      $this.loading = true;

      // 保存设置
      $this.saveSettings($this.pageUrl);

      // 处理字幕
      let options = await $this.mergeOptions();
      let epList = $this.getSelectedEpList();
      let files = document.querySelector("#ass").files;
      for (let i = 0; i < epList.length; i++) {
        let epInfo = epList[i];
        let file = files && files.length > i ? files[i] : null;

        let downloadFileName = $this.getDownloadName(epInfo);
        let danmaku = await $this.fetchDanmuXml(epInfo.cid);

        danmaku.layout = await window.danmaku.layout(danmaku.content, options);
        let content = window.danmaku.ass(danmaku, options);
        // 合并ass/srt
        if (file) {
          let reader = new FileReader();
          reader.onload = function (e) {
            let mergeAss = "";
            if (file.name.toLowerCase().endsWith(".srt")) {
              mergeAss = window.danmaku.srt(e.target.result);
            } else if (file.name.toLowerCase().endsWith(".ass")) {
              mergeAss = utils.extractAss(e.target.result);
            }
            content = content + "\r\n\r\n\r\n" + mergeAss;

            var blob = new window.Blob([content], {
              type: "text/plain;charset=utf-8",
            });
            saveAs(blob, `${downloadFileName}.danmu.ass`);
            console.log(
              `${epInfo.number}.${epInfo.title}(${file.name}) -> ${downloadFileName}.danmu.ass已处理完成`
            );
          };
          reader.readAsText(file);
        } else {
          var blob = new window.Blob([content], {
            type: "text/plain;charset=utf-8",
          });
          saveAs(blob, `${downloadFileName}.danmu.ass`);
          console.log(
            `${epInfo.number}.${epInfo.title} -> ${downloadFileName}.danmu.ass已处理完成`
          );
        }

        await utils.sleep(1000);
      }

      $this.loading = false;
    },
  },
};
</script>

<style>
body {
  background-color: #fafafa;
  color: #222;
  font-family: "Roboto", "Helvetica", "Arial", sans-serif;
  font-weight: 300;
  font-size: 14px;
  min-width: 400px;
  padding: 8px;
}

h1,
h2 {
  margin: 0;
  padding: 0;
}

input,
textarea {
  color: #000000;
}

label {
  color: #ffbe00;
}

.bottom-controls {
  margin-top: 24px;
}

.btn-primary,
.btn-primary:hover,
.btn-primary:focus,
.btn-primary:active,
.btn-primary.active,
.open .dropdown-toggle.btn-primary {
  background-color: #3f51b5 !important;
  border-color: #3f51b5 !important;
  color: #ffffff !important;
}

.btn-primary:active,
.btn-primary.active,
.open .dropdown-toggle.btn-primary {
  background-image: none !important;
}

.btn-primary .badge {
  background-color: #ffffff !important;
  color: #0041ff !important;
}

.character-count,
#result {
  float: right;
}

.content {
  margin: 0 auto;
  padding: 12px 8px;
}

.panel-body {
  padding: 16px 32px;
}

.panel-primary {
  border-color: #0041ff;
}

.panel-primary > .panel-heading {
  background-color: #0041ff;
}

.pushpush-container {
  margin: 8px;
}

.title {
  color: #3498db;
  flex-grow: 1;
  font-size: 1.5em;
  margin-left: 8px;
  margin-top: 8px;
}

.title-container {
  display: flex;
}

.top-button {
  margin: 8px;
  font-size: 1.3em;
}

#clear-all-notifications-link,
#options-link,
#popout-link {
  cursor: pointer;
  right: 0;
}

.choose_ass {
  height: 3em;
  text-align: center;
  color: #ccc;
  cursor: pointer;
  line-height: 3em;
  border: 1px dashed #ccc;
  border-radius: 5px;
}

.reverse {
  flex-flow: row-reverse;
}

.reverse .el-input {
  width: 80px !important;
  margin-right: 10px;
}

#warning {
  height: 3em;
  text-align: center;
  line-height: 3em;
}

.el-form-item {
  margin-bottom: 8px !important;
}

.el-form--label-top .el-form-item__label {
  padding: 0 !important;
}

.el-form-item__content {
  line-height: 12px !important;
}

.el-checkbox {
  width: 160px;
  overflow: hidden;
  margin-right: 10px !important;
}

.el-button--primary {
  margin-top: 10px;
}
</style>