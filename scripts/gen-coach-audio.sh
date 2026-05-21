#!/usr/bin/env bash
# 用 macOS `say` 命令生成训练教练高频短句的本地音频
# 目的：绕开 Android 系统 TTS 引擎差异，让倒数 / 计数 / 高频金句体验一致
# 替换为真人录音时直接覆盖同名 .m4a 即可
#
# Usage: bash scripts/gen-coach-audio.sh
#        COACH_VOICE=Sinji bash scripts/gen-coach-audio.sh

set -euo pipefail

VOICE="${COACH_VOICE:-Tingting}"
RATE="${COACH_RATE:-180}"
OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/assets/sounds/coach"

mkdir -p "$OUT_DIR"

# 1) 倒数 / 准备完成 / 休息 / 完成
declare -a BASIC=(
  "start|开始"
  "rest|休息"
  "end|完成"
)

# 2) 数字 0-20（覆盖 99% 的 rep 计数 / 倒数场景；> 20 自动 fallback TTS）
declare -a NUMBERS=(
  "n0|零"  "n1|一"  "n2|二"  "n3|三"  "n4|四"
  "n5|五"  "n6|六"  "n7|七"  "n8|八"  "n9|九"
  "n10|十" "n11|十一" "n12|十二" "n13|十三" "n14|十四"
  "n15|十五" "n16|十六" "n17|十七" "n18|十八" "n19|十九" "n20|二十"
)

# 3) 5 个高频金句（替换 run.tsx 里硬编码的 speak('...')）
declare -a PHRASES=(
  "next-set|准备下一组"
  "keep-going|过半了，坚持住"
  "well-done|做得很好，继续保持"
  "paused|训练已暂停"
  "rest-30|好，休息三十秒"
)

ALL=("${BASIC[@]}" "${NUMBERS[@]}" "${PHRASES[@]}")

echo "🎙  voice=$VOICE rate=$RATE → $OUT_DIR"
echo "    ${#ALL[@]} clips"

for entry in "${ALL[@]}"; do
  name="${entry%%|*}"
  text="${entry##*|}"
  aiff="$(mktemp -t coach_${name}).aiff"
  m4a="$OUT_DIR/$name.m4a"
  say -v "$VOICE" -r "$RATE" -o "$aiff" "$text"
  afconvert -f m4af -d aac "$aiff" "$m4a" >/dev/null
  rm -f "$aiff"
done

total=$(du -sh "$OUT_DIR" | cut -f1)
count=$(ls -1 "$OUT_DIR"/*.m4a | wc -l | tr -d ' ')
echo "🟢 done. $count files, total=$total"
