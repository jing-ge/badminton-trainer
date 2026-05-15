/**
 * 程序化生成训练 run 页的本地背景图：暗夜羽毛球场顶光感
 *   产物：assets/images/court_bg.jpg
 *   目标：≤ 500KB，分辨率 1080×1920，纯本地资源（v0.8.0 拔掉 Unsplash 远程依赖）
 *
 * 调性：暗调球馆顶光，居中俯视半透明球场剪影，顶部圆形 spotlight，底部黑色 vignette。
 * 注意：上层 WorkoutBackground 还会盖 rgba(11,18,32,0.85) 蒙层，所以这张图只是给"质感"的底子。
 */
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const W = 1080;
const H = 1920;
const OUT = path.join(__dirname, 'assets', 'images', 'court_bg.jpg');

const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// 1. 底色：上深下更深的垂直渐变（贴 colors.bg #0B1220）
const grad = ctx.createLinearGradient(0, 0, 0, H);
grad.addColorStop(0, '#0F1A2E');
grad.addColorStop(0.5, '#0B1220');
grad.addColorStop(1, '#05080F');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, W, H);

// 2. 顶部 spotlight：径向高光从屏幕上方 1/4 处发散，模拟球馆顶灯
const cx = W / 2;
const cy = H * 0.28;
const spot = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.85);
spot.addColorStop(0, 'rgba(80, 130, 200, 0.22)'); // 冷光淡蓝
spot.addColorStop(0.4, 'rgba(40, 70, 120, 0.10)');
spot.addColorStop(1, 'rgba(0, 0, 0, 0)');
ctx.fillStyle = spot;
ctx.fillRect(0, 0, W, H);

// 3. 居中俯视球场剪影：半透明白色描线，比例 6.10m × 13.40m（短边/长边 ≈ 0.455）
//    占屏 65% 宽，居中（略偏下，留顶部 spotlight 主导）
const courtW = W * 0.65;
const courtH = courtW / 0.455; // 保持真实比例
const courtX = (W - courtW) / 2;
const courtY = (H - courtH) / 2 + H * 0.04;

ctx.save();
ctx.strokeStyle = 'rgba(180, 200, 230, 0.18)';
ctx.lineWidth = 2;

// 外框
ctx.strokeRect(courtX, courtY, courtW, courtH);

// 中线（球网位置）
ctx.beginPath();
ctx.moveTo(courtX, courtY + courtH / 2);
ctx.lineTo(courtX + courtW, courtY + courtH / 2);
ctx.stroke();

// 单打边线（内 0.42m 缩进，6.10 → 5.18，缩进比 ≈ 0.075）
const singleInset = courtW * 0.075;
ctx.strokeRect(courtX + singleInset, courtY, courtW - singleInset * 2, courtH);

// 前发球线（距网 1.98m，球场半长 6.70m，比例 ≈ 0.295）
const frontInset = (courtH / 2) * 0.59;
ctx.beginPath();
ctx.moveTo(courtX, courtY + courtH / 2 - frontInset);
ctx.lineTo(courtX + courtW, courtY + courtH / 2 - frontInset);
ctx.moveTo(courtX, courtY + courtH / 2 + frontInset);
ctx.lineTo(courtX + courtW, courtY + courtH / 2 + frontInset);
ctx.stroke();

// 后发球线（距底线 0.76m，比例 ≈ 0.114）
const backInset = (courtH / 2) * 0.114;
ctx.beginPath();
ctx.moveTo(courtX + singleInset, courtY + backInset);
ctx.lineTo(courtX + courtW - singleInset, courtY + backInset);
ctx.moveTo(courtX + singleInset, courtY + courtH - backInset);
ctx.lineTo(courtX + courtW - singleInset, courtY + courtH - backInset);
ctx.stroke();

// 中线（前发球线 → 端线，把后场分左右）
const centerX = courtX + courtW / 2;
ctx.beginPath();
ctx.moveTo(centerX, courtY + courtH / 2 - frontInset);
ctx.lineTo(centerX, courtY + backInset);
ctx.moveTo(centerX, courtY + courtH / 2 + frontInset);
ctx.lineTo(centerX, courtY + courtH - backInset);
ctx.stroke();

// 球网线（中线上叠一条更亮一点的）
ctx.strokeStyle = 'rgba(220, 230, 245, 0.28)';
ctx.lineWidth = 1.5;
ctx.beginPath();
ctx.moveTo(courtX - 20, courtY + courtH / 2);
ctx.lineTo(courtX + courtW + 20, courtY + courtH / 2);
ctx.stroke();

ctx.restore();

// 4. 底部 vignette：贴近底色，加重沉浸感
const vignette = ctx.createRadialGradient(W / 2, H * 0.72, W * 0.3, W / 2, H * 0.72, W * 1.0);
vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
ctx.fillStyle = vignette;
ctx.fillRect(0, 0, W, H);

// 5. 轻微噪点：每 4 像素一个小斑，alpha 极低，破解纯色压缩条带
const imgData = ctx.getImageData(0, 0, W, H);
const data = imgData.data;
for (let i = 0; i < data.length; i += 4) {
  // ~3% 像素加噪
  if (Math.random() < 0.03) {
    const n = (Math.random() - 0.5) * 14;
    data[i] = Math.max(0, Math.min(255, data[i] + n));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
  }
}
ctx.putImageData(imgData, 0, 0);

// 6. JPEG 输出（quality 0.78，目标 ≤ 200KB）
const buf = canvas.toBuffer('image/jpeg', { quality: 0.78, progressive: true });
fs.writeFileSync(OUT, buf);
console.log(`[court_bg] wrote ${OUT} (${(buf.length / 1024).toFixed(1)} KB, ${W}x${H})`);
