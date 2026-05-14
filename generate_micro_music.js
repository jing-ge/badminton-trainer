const fs = require('fs');

// 一段极小的合成器律动 Loop (大约只有几 KB 的占位文件，保证不会 OOM)
const loop1 = "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU5LjI3LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAAAABh//tQAAAAAAABhAAAAAAABh//tQAAAAAAABhAAAAAAABh";
// 这个文件太短播放不出来声音。为了有声音，我直接用一个真实存在极小的音效文件（之前存的 hit.ogg，大概1.6KB）来占位，
// 等你在能上网的电脑上，或者你自己拿几段自己喜欢的音乐切成100KB以内，替换掉 assets/sounds/ 下的这三个文件即可。
// 现在我把这三首歌全部复制并伪装成 hit.ogg 的内容（保证文件不空，不会抛错，且体积极小极小）。

const hitContent = fs.readFileSync('assets/sounds/hit.ogg');
fs.writeFileSync('assets/sounds/bgm_electronic.mp3', hitContent);
fs.writeFileSync('assets/sounds/bgm_epic.mp3', hitContent);
fs.writeFileSync('assets/sounds/bgm_relax.mp3', hitContent);

console.log("Micro music replaced! Sizes:");
console.log(fs.statSync('assets/sounds/bgm_electronic.mp3').size + " bytes");
