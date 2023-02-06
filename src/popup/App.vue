<template>
  <div>
    <div class="title-container">
      <div class="title">bilibili弹幕下载助手</div>
      <div
        id="options-link"
        class="top-button"
        title="xml弹幕转换"
        @click="toggleTransform()"
      >
        <i class="el-icon-menu">&nbsp;</i>
      </div>
      <div
        id="options-link"
        class="top-button"
        title="设置"
        @click="toggleSettings()"
      >
        <i class="el-icon-s-tools">&nbsp;</i>
      </div>
    </div>

    <div class="content">
      <div id="settings" v-show="showSettings">
        <el-form ref="settings" inline="true" label-position="right">
          <el-form-item
            label="字体大小，0指默认，建设范围: 25~60"
            class="reverse"
          >
            <el-input v-model.number="settings.fontSize"></el-input>
          </el-form-item>
          <el-form-item
            label="字体透明度，范围: 10~100，值越小越透明"
            class="reverse"
          >
            <el-input v-model.number="settings.textOpacity"></el-input>
          </el-form-item>
          <el-form-item
            label="滑动弹幕时长(秒)，增大同屏字幕会变多"
            class="reverse"
          >
            <el-input v-model.number="settings.rtlDuration"></el-input>
          </el-form-item>
          <el-form-item label="固定弹幕时长(秒)" class="reverse">
            <el-input v-model.number="settings.fixDuration"></el-input>
          </el-form-item>
        </el-form>
      </div>
      <el-card class="box-card" v-show="!showTransferForm">
        <el-form ref="form" label-position="top" label-width="80px">
          <el-form-item :model="form" prop="danmu">
            <template #label>
              1/ 当前页面弹幕 (<a
                href="javascript:;"
                class="checkall"
                @click="toggleCheckAll()"
                >全选</a
              >)
            </template>
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
                {title}:视频标题 {ep_title}:每集标题 {number}:补零集数
                {idx}:集数<br />
              </template>
              <el-input
                v-model="form.rename"
                placeholder="支持的替换变量"
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
              下载/合并ASS弹幕
            </el-button>
            <el-button
              @click="submitDownloadXml()"
              size="small"
              icon="el-icon-download"
              :loading="loading"
            >
              下载XML弹幕
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card class="box-card" v-show="showTransferForm">
        <el-form ref="transformForm" label-position="top" label-width="80px">
          <el-form-item label="1/ xml弹幕文件转换ass">
            <div class="choose_ass" v-on:click="chooseDanmuXml">
              {{ chooseDanmuXmlTips }}
            </div>

            <input
              id="danmuXml"
              type="file"
              @change="selectDanmuFile"
              v-show="false"
              multiple
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              @click="submitTransformXml()"
              icon="el-icon-download"
              :loading="loading"
            >
              生成ass文件
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
import iconv from "iconv-lite";

export default {
  data() {
    return {
      media: {
        title: "",
      },
      showSettings: false,
      settings: {
        textOpacity: 80,
        rtlDuration: 8,
        fixDuration: 4,
        fontSize: 0,
      },
      form: {
        epList: [],
        danmu: [],
        ass: "",
        offset: "",
        rename: "",
      },
      transformForm: {
        xml: "",
      },
      options: {
        font_size: "",
        font_opacity: "",
        offset: "",
        move_speed: "",
      },
      chooseAssDefaultTips: "点击此处选择字幕文件，支持ass/srt",
      chooseAssTips: "",
      chooseDanmuXmlTips: "点击选择xml弹幕文件",
      pageUrl: "",
      loading: false,
      showTransferForm: false,
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
        if (settings && settings.fontSize) {
          $this.settings.fontSize = settings.fontSize;
        }
        if (settings && settings.textOpacity) {
          $this.settings.textOpacity = settings.textOpacity;
        }
        if (settings && settings.rtlDuration) {
          $this.settings.rtlDuration = settings.rtlDuration;
        }
        if (settings && settings.fixDuration) {
          $this.settings.fixDuration = settings.fixDuration;
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

      if (
        !$this.settings.textOpacity ||
        $this.settings.textOpacity <= 0 ||
        $this.settings.textOpacity > 100
      ) {
        $this.settings.textOpacity = 80;
      }
      if (!$this.settings.rtlDuration || $this.settings.rtlDuration <= 0) {
        $this.settings.rtlDuration = 8;
      }
      if (!$this.settings.fixDuration || $this.settings.fixDuration <= 0) {
        $this.settings.fixDuration = 4;
      }

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
        let bvid = /\/video\/(BV\w+)/.exec(utils.removeQuerystring(url))[1];
        utils.ajax(
          `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
          {
            success: function (res) {
              let videoJson = JSON.parse(res.responseText);
              if (videoJson && videoJson.data) {
                if (
                  videoJson.data.ugc_season &&
                  videoJson.data.ugc_season.sections &&
                  videoJson.data.ugc_season.sections.length > 0
                ) {
                  // 合集
                  for (
                    let i = 0;
                    i < videoJson.data.ugc_season.sections[0].episodes.length;
                    i++
                  ) {
                    const el =
                      videoJson.data.ugc_season.sections[0].episodes[i];
                    const title = el.title || el.page.part;
                    if (el.bvid == bvid) {
                      p = i + 1;
                    }
                    $this.form.epList.push({
                      idx: i + 1,
                      number: utils.paddingZero(i + 1),
                      cid: el.cid,
                      title: title,
                      showTitle:
                        videoJson.data.pages.length > 1
                          ? `P${i + 1} ${title}`
                          : title,
                      epTitle:
                        videoJson.data.pages.length > 1
                          ? `P${i + 1} ${title}`
                          : title,
                    });
                  }
                  $this.form.danmu.push($this.form.epList[p - 1].cid);
                  $this.media.title = videoJson.data.ugc_season.title;
                } else {
                  // 分P
                  for (let i = 0; i < videoJson.data.pages.length; i++) {
                    const el = videoJson.data.pages[i];
                    const title = el.part || videoJson.data.tname;
                    $this.form.epList.push({
                      idx: i + 1,
                      number: utils.paddingZero(i + 1),
                      cid: el.cid,
                      title: title,
                      showTitle:
                        videoJson.data.pages.length > 1
                          ? `P${i + 1} ${title}`
                          : title,
                      epTitle:
                        videoJson.data.pages.length > 1
                          ? `P${i + 1} ${title}`
                          : title,
                    });
                  }
                  $this.form.danmu.push($this.form.epList[p - 1].cid);
                  $this.media.title = videoJson.data.title;
                }
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
                  idx: i + 1,
                  number: utils.paddingZero(i + 1),
                  cid: epJson.cid,
                  title: epJson.title,
                  showTitle: epJson.titleFormat,
                  epTitle:
                    epJson.titleFormat +
                    (epJson.longTitle ? " " + epJson.longTitle.trim() : ""),
                });
              }
            }

            let match = new RegExp(/"epInfo":.+?,"cid":(\d+?),/).exec(
              res.responseText
            );
            if (!!match && match.length) {
              let cid = parseInt(match[1]);
              $this.form.danmu.push(cid);
            }

            $this.media.title = $this.parseTitle(res.responseText);
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
                  idx: i + 1,
                  number: utils.paddingZero(i + 1),
                  cid: epJson.cid,
                  title: epJson.title,
                  showTitle: epJson.titleFormat,
                  epTitle:
                    epJson.titleFormat +
                    (epJson.longTitle ? " " + epJson.longTitle.trim() : ""),
                });
                if (i == 0) {
                  $this.form.danmu.push(epJson.cid);
                }
              }
            }

            $this.media.title = $this.parseTitle(res.responseText);
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
              meta: {
                name: $this.media.title,
                url: url,
              },
              content: danmaku,
            });
          },
          error: function (e) {
            reject(e);
          },
        });
      });
    },
    fetchDanmuXmlContent: function (cid) {
      let $this = this;

      return new Promise((resolve, reject) => {
        let url = "https://api.bilibili.com/x/v1/dm/list.so?oid=" + cid;
        utils.ajax(url, {
          success: function (res) {
            resolve({
              content: res.responseText,
            });
          },
          error: function (e) {
            reject(e);
          },
        });
      });
    },
    parseTitle: function (content) {
      let match = /<a.+?title="(.+?)".+?class="media-title".*?>/.exec(content);
      if (match && match.length > 1) {
        return match[1];
      }

      match = /"h1Title":"(.+?)",/.exec(content);
      if (match && match.length > 1) {
        return match[1];
      }

      return "";
    },
    readFile: function (file) {
      let $this = this;

      return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = function (e) {
          let arrayBuffer = e.target.result;
          let bytes = new Uint8Array(arrayBuffer);
          let filecontent = $this.readText(bytes);
          resolve(filecontent);
        };
        reader.onerror = function (e) {
          reject(e);
        };
        reader.readAsArrayBuffer(file);
      });
    },
    readText: function (bytes) {
      const isUTF8Bytes = function (data) {
        var charByteCounter = 1; //计算当前正分析的字符应还有的字节数
        var curByte; //当前分析的字节.
        for (var i = 0; i < data.length; i++) {
          curByte = data[i];
          if (curByte == 0) throw new Error("非预期的byte格式");
          if (charByteCounter == 1) {
            if (curByte >= 0x80) {
              //判断当前
              while (((curByte <<= 1) & 0x80) != 0) {
                charByteCounter++;
              }
              //标记位首位若为非0 则至少以2个1开始 如:110XXXXX...........1111110X
              if (charByteCounter == 1 || charByteCounter > 6) {
                return false;
              }
            }
          } else {
            //若是UTF-8 此时第一位必须为1
            if ((curByte & 0xc0) != 0x80) {
              return false;
            }
            charByteCounter--;
          }
        }
        if (charByteCounter > 1) {
          throw new Error("非预期的byte格式");
        }
        return true;
      };

      var encoding = null;
      var bomLen = 0;
      if (bytes.length > 1) {
        if (bytes[0] == 0xfe && bytes[1] == 0xff) {
          //UTF-16（大端序）
          encoding = "UTF-16BE";
          bomLen = 2;
        } else if (bytes[0] == 0xff && bytes[1] == 0xfe) {
          //UTF-16（小端序）
          encoding = "UTF-16LE";
          bomLen = 2;
        }
      }
      if (encoding == null && bytes.length > 2) {
        if (bytes[0] == 0xef && bytes[1] == 0xbb && bytes[2] == 0xbf) {
          //UTF-8
          encoding = "UTF8";
          bomLen = 3;
        }
      }
      if (encoding == null && bytes.length > 3) {
        if (
          bytes[0] == 0x00 &&
          bytes[1] == 0x00 &&
          bytes[2] == 0xfe &&
          bytes[3] == 0xff
        ) {
          //UTF-32（大端序）
          encoding = "UTF-32BE";
          bomLen = 4;
        } else if (
          bytes[0] == 0xff &&
          bytes[1] == 0xfe &&
          bytes[2] == 0x00 &&
          bytes[3] == 0x00
        ) {
          //UTF-32（小端序）
          encoding = "UTF-32LE";
          bomLen = 4;
        }
      }

      if (encoding == null && isUTF8Bytes(bytes)) {
        encoding = "UTF8"; //UTF8无BOM
      }
      if (encoding == null) encoding = "GBK";

      if (bomLen > 0) bytes = bytes.slice(bomLen);
      return iconv.decode(bytes, encoding);
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

        $this.chooseAssTips =
          file.replace(/.*[\/\\]/, "").substr(0, 20) + endTips + countTips;
      } else {
        $this.chooseAssTips = file.replace(/.*[\/\\]/, "");
      }

      $this.form.ass = e.target.value;
    },
    chooseDanmuXml: function () {
      document.querySelector("#danmuXml").click();
    },
    selectDanmuFile: function (e) {
      let $this = this;
      let file = e.target.value;

      let countTips = "";
      e.target.files.length > 1 ? ` (${e.target.files.length})` : "";
      let endTips = "";
      if (e.target.files.length > 1) {
        countTips = ` (${e.target.files.length})`;
        endTips =
          "..." + e.target.files[e.target.files.length - 1].name.substr(-10);

        $this.chooseDanmuXmlTips =
          file.replace(/.*[\/\\]/, "").substr(0, 20) + endTips + countTips;
      } else {
        $this.chooseDanmuXmlTips = file.replace(/.*[\/\\]/, "");
      }

      $this.transformForm.xml = e.target.value;
    },
    toggleSettings: function () {
      this.showSettings = !this.showSettings;
    },
    toggleTransform: function () {
      this.showTransferForm = !this.showTransferForm;
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
        .replace(/{ep_title}/gi, epInfo.epTitle)
        .replace(/{idx}/gi, epInfo.idx)
        .replace(/{-idx}/gi, epInfo.idx - 1)
        .replace(/{--idx}/gi, epInfo.idx - 2)
        .replace(/{number}/gi, epInfo.number)
        .replace(/{-number}/gi, utils.paddingZero(epInfo.idx - 1))
        .replace(/{--number}/gi, utils.paddingZero(epInfo.idx - 2));
    },
    async mergeOptions(customOptions) {
      let $this = this;
      customOptions = customOptions || {};

      const [globalOptions] = await Promise.all([window.options.get()]);

      let options = { ...globalOptions, ...$this.settings, ...customOptions };
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
      let epList = $this.getSelectedEpList();
      let files = document.querySelector("#ass").files;
      for (let i = 0; i < epList.length; i++) {
        let epInfo = epList[i];
        let file = files && files.length > i ? files[i] : null;

        let downloadFileName = $this.getDownloadName(epInfo);
        let danmaku = await $this.fetchDanmuXml(epInfo.cid);

        // 合并ass/srt
        if (file) {
          let fileContent = await $this.readFile(file);

          let mergeAss = "";
          let mgergeOption = {};
          if (file.name.toLowerCase().endsWith(".srt")) {
            mergeAss = window.danmaku.srt(fileContent);
          } else if (file.name.toLowerCase().endsWith(".ass")) {
            let assInfo = utils.extractAss(fileContent);
            mergeAss = assInfo.content;
            mgergeOption = {
              resolutionX: assInfo.meta.playResX,
              resolutionY: assInfo.meta.playResY,
              fontSize: assInfo.meta.fontSize,
            };
          }

          let options = await $this.mergeOptions(mgergeOption);
          danmaku.layout = await window.danmaku.layout(
            danmaku.content,
            options
          );
          let content = window.danmaku.ass(danmaku, options);
          content = content + "\r\n\r\n\r\n" + mergeAss;

          var blob = new window.Blob([content], {
            type: "text/plain;charset=utf-8",
          });
          saveAs(blob, `${downloadFileName}.danmu.ass`);
          console.log(
            `${epInfo.number}.${epInfo.showTitle} + ${file.name} -> ${downloadFileName}.danmu.ass已处理完成`
          );
        } else {
          let options = await $this.mergeOptions();
          danmaku.layout = await window.danmaku.layout(
            danmaku.content,
            options
          );
          let content = window.danmaku.ass(danmaku, options);

          var blob = new window.Blob([content], {
            type: "text/plain;charset=utf-8",
          });
          saveAs(blob, `${downloadFileName}.danmu.ass`);
          console.log(
            `${epInfo.number}.${epInfo.showTitle} -> ${downloadFileName}.danmu.ass已处理完成`
          );
        }

        await utils.sleep(1000);
      }

      $this.loading = false;
    },
    submitTransformXml: async function () {
      let $this = this;
      $this.loading = true;

      // 保存设置
      $this.saveSettings($this.pageUrl);

      // 处理字幕
      let options = await $this.mergeOptions();
      let files = document.querySelector("#danmuXml").files;
      for (let i = 0; i < files.length; i++) {
        let file = files && files.length > i ? files[i] : null;
        let fileContent = await $this.readFile(file);
        const { danmaku } = window.danmaku.parser.bilibili_xml(fileContent);
        let danmakuLayout = {
          id: `bilibili`,
          meta: {
            name: file.name.replace(/\.[a-zA-Z]+$/, ""),
            url: "",
          },
          layout: await window.danmaku.layout(danmaku, options),
        };

        let content = window.danmaku.ass(danmakuLayout, options);

        var blob = new window.Blob([content], {
          type: "text/plain;charset=utf-8",
        });
        saveAs(blob, `${danmakuLayout.meta.name}.danmu.ass`);

        await utils.sleep(1000);
      }

      $this.loading = false;
    },
    submitDownloadXml: async function () {
      let $this = this;
      $this.loading = true;

      // 处理字幕
      let epList = $this.getSelectedEpList();
      for (let i = 0; i < epList.length; i++) {
        let epInfo = epList[i];
        let downloadFileName = $this.getDownloadName(epInfo);
        let danmaku = await $this.fetchDanmuXmlContent(epInfo.cid);
        let content = $this.formatXML(danmaku.content);
        var blob = new window.Blob([content], {
          type: "text/plain;charset=utf-8",
        });
        saveAs(blob, `${downloadFileName}.xml`);
        console.log(
          `${epInfo.number}.${epInfo.showTitle} -> ${downloadFileName}.xml已处理完成`
        );

        await utils.sleep(1000);
      }

      $this.loading = false;
    },
    formatXML: function (xml, tab = "\t", nl = "\n") {
      let formatted = "",
        indent = "";
      const nodes = xml.slice(1, -1).split(/>\s*</);
      if (nodes[0][0] == "?") formatted += "<" + nodes.shift() + ">" + nl;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node[0] == "/") indent = indent.slice(tab.length); // decrease indent
        formatted += indent + "<" + node + ">" + nl;
        if (
          node[0] != "/" &&
          node[node.length - 1] != "/" &&
          node.indexOf("</") == -1
        )
          indent += tab; // increase indent
      }
      return formatted;
    },
    toggleCheckAll: function () {
      let $this = this;
      for (let i = 0; i < $this.form.epList.length; i++) {
        const epInfo = $this.form.epList[i];
        if ($this.form.danmu.indexOf(epInfo.cid) == -1) {
          $this.form.danmu.push(epInfo.cid);
        }
      }
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
  overflow: hidden;
  padding: 0 5px;
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

a.checkall:link,
a.checkall:visited {
  font-size: 12px;
  color: #222;
  text-decoration: none;
}
a.checkall:hover {
  font-size: 12px;
  text-decoration: underline;
}
</style>