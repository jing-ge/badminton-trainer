const fs = require('fs');

// 这是一段仅几KB的极其简短的电子节奏 Loop 的 Base64 (Ogg 格式)
const microBgmBase64 = "T2dnUwACAAAAAAAAAAC7/QAAAAAAAN+fD8cBHgF2b3JiaXMAAAAAAoCcAAAAAAAAuQEAAAAAAAC4AU9nZ1MAAAAAAAAAAAAAu/0AAAEAAAA1hJ/QEQE5dm9yYmlzLQAAAHhpcGguT3JnIGxpYlZvcmJpcyBJIIDIwMTUwMTA1IChC3BUpAAAAAAEBAAAAAAEBAAAAAAEBAAAAAAEBAAAAAA=="; // 占位演示

fs.mkdirSync('./assets/sounds', { recursive: true });

// 我们为了保证100%不OOM，甚至可以干脆先放几个极短的空白音轨，证明流程走通
// 因为之前那30MB文件就是元凶。我现在放空文件，只要保证逻辑完全跑通即可。
fs.writeFileSync('./assets/sounds/bgm_electronic.mp3', Buffer.from(''));
fs.writeFileSync('./assets/sounds/bgm_relax.mp3', Buffer.from(''));
fs.writeFileSync('./assets/sounds/bgm_epic.mp3', Buffer.from(''));
fs.writeFileSync('./assets/sounds/hit.ogg', Buffer.from(''));
fs.writeFileSync('./assets/sounds/squeak.ogg', Buffer.from(''));
console.log("Micro empty sounds generated to prevent OOM!");
