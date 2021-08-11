; (function () {
    
    const srt = (function () {

        /**
         * @param {string|ArrayBuffer} content
         * @return {{ danmaku: Array<Danmaku> }}
         */
        const parse = function (content) {
            let data = typeof content === 'string' ? content : new TextDecoder('utf-8').decode(content);
            const formatTime = function(val) {
                var regex = /(\d+):(\d{2}):(\d{2}),(\d{2})/;
                var parts = regex.exec(val);
    
                if (parts === null) {
                    return '00:00:00.00';
                }
    
                // hours + minutes + seconds + ms
                return `${parts[1]}:${parts[2]}:${parts[3]}.${parts[4]}`;
            };
        
            data = data.replace(/\r/g, '');
            var regex = /(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/g;
            data = data.split(regex);
            data.shift();
    
            var items = [];
            for (var i = 0; i < data.length; i += 4) {
                items.push(
                {
                    id: data[i].trim(),
                    start:  formatTime(data[i + 1].trim()),
                    end: formatTime(data[i + 2].trim()),
                    text: data[i + 3].trim()
                });
            }
    
            return items;
        };


        const toAss = function(data, options) {
            console.log(data)
            // Ass header
            const header = [
                '[V4+ Styles]',
                'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
                `Style: SrtDefault,微软雅黑,40,&H00F5F5F7,&H00F5F5F7,&H001D1D1F,&H001D1D1F,0,0,0,0,100,100,0,0,1,1,1,2,5,5,14,134`,
                '',
                '[Events]',
                'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
              ];
        
              let lines = [];
              for (let i = 0; i < data.length; i++) {
                  const line = data[i];
                  
                  lines.push(`Dialogue: 0,${line.start},${line.end},SrtDefault,,0000,0000,0000,,${line.text}`)
              }
        
        
              return  header.join('\r\n') + '\r\n' + lines.join('\r\n');
        };

    return (content, options) => {
        let data = parse(content);
        return toAss(data, options);
        };
    }());

    window.danmaku = window.danmaku || {};
    window.danmaku.srt = srt;

}());
      