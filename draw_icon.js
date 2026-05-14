const { createCanvas } = require('canvas');
const fs = require('fs');

// ==== 生成桌面图标 (1024x1024) ====
const iconCanvas = createCanvas(1024, 1024);
const ctx = iconCanvas.getContext('2d');

// 背景 - 透明，由 app.json 的 backgroundColor 填充
ctx.clearRect(0, 0, 1024, 1024);

// 绘制一个极简的白色羽毛球
ctx.translate(512, 512); // 移到中心
ctx.rotate(45 * Math.PI / 180); // 倾斜一点，更有动感

ctx.fillStyle = '#FFFFFF';
ctx.strokeStyle = '#FFFFFF';
ctx.lineWidth = 24;
ctx.lineJoin = 'round';
ctx.lineCap = 'round';

// 球头 (半圆)
ctx.beginPath();
ctx.arc(0, 150, 80, 0, Math.PI, false);
ctx.fill();

// 软木托上方的横线
ctx.beginPath();
ctx.moveTo(-80, 150);
ctx.lineTo(80, 150);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(-60, 110);
ctx.lineTo(60, 110);
ctx.stroke();

// 羽毛 1 (左边)
ctx.beginPath();
ctx.moveTo(-60, 110);
ctx.lineTo(-140, -180);
ctx.lineTo(-40, -150);
ctx.closePath();
ctx.stroke();

// 羽毛 2 (中间)
ctx.beginPath();
ctx.moveTo(0, 110);
ctx.lineTo(0, -220);
ctx.stroke();

// 羽毛 3 (右边)
ctx.beginPath();
ctx.moveTo(60, 110);
ctx.lineTo(140, -180);
ctx.lineTo(40, -150);
ctx.closePath();
ctx.stroke();

// 串联羽毛的横线
ctx.beginPath();
ctx.moveTo(-100, -20);
ctx.lineTo(100, -20);
ctx.stroke();

// 保存为 PNG
const iconBuffer = iconCanvas.toBuffer('image/png');
fs.writeFileSync('assets/images/icon.png', iconBuffer);

// ==== 生成启动屏 Splash (1080x1920) ====
const splashCanvas = createCanvas(1080, 1920);
const sctx = splashCanvas.getContext('2d');

// 背景色深蓝
sctx.fillStyle = '#0B1220';
sctx.fillRect(0, 0, 1080, 1920);

// 把刚才画的图标放进去
sctx.drawImage(iconCanvas, (1080 - 400) / 2, 700, 400, 400);

// 文字
sctx.fillStyle = '#10B981';
sctx.font = 'bold 64px Arial';
sctx.textAlign = 'center';
sctx.fillText('BADMINTON', 540, 1200);

sctx.fillStyle = '#FFFFFF';
sctx.font = '48px Arial';
sctx.fillText('TRAINER', 540, 1280);

const splashBuffer = splashCanvas.toBuffer('image/png');
fs.writeFileSync('assets/images/splash.png', splashBuffer);

console.log("Clean geometric icons generated successfully!");
