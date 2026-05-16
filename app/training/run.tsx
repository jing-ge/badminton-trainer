import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Platform, Pressable, StyleSheet, Text, View, ImageBackground } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { Audio, Video, ResizeMode } from 'expo-av';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { vibrateLight, vibrateMedium, vibrateSuccess, vibrateHeavy } from '@/utils/haptics';
import { colors, font, radius, spacing } from '@/theme/tokens';
import { getActivePlan } from '@/db/plans';
import { selectToday } from '@/data/selectToday';
import type { TrainingItem, TrainingModule } from '@/data/planTypes';
import { TutorialMedia } from '@/components/animations/TutorialMedia';
import { getStreak, listTrainingLogs } from '@/db/trainingLogs';
import { TransitionScene } from '@/features/run/TransitionScene';

import { defaultPlans } from '@/data/presets';

const TRANSITION_SECONDS = 5;

// v0.23 语音工具：阿拉伯数字 → 汉字，防止 TTS 把 "3" 读成 "three" / 走调
// 覆盖 0-99（训练倒数最多到几十；> 99 罕见，原文兜底）
const DIGIT_CHAR = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
function numToChinese(n: number): string {
  if (n < 0 || n > 99 || !Number.isInteger(n)) return String(n);
  if (n < 10) return DIGIT_CHAR[n];
  if (n === 10) return '十';
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const tensPart = tens === 1 ? '十' : DIGIT_CHAR[tens] + '十';
  return ones === 0 ? tensPart : tensPart + DIGIT_CHAR[ones];
}
function toChinesePronunciation(text: string): string {
  // 把所有 0-99 的数字 token 替换成汉字（包含纯数字串 + 句子里的独立数字）
  // 例：'3' → '三'；'15' → '十五'；'第 2 组' → '第 二 组'
  return text.replace(/\d+/g, (m) => {
    const n = parseInt(m, 10);
    return n >= 0 && n <= 99 ? numToChinese(n) : m;
  });
}
// 普通话语音参数：pitch / rate 默认 1.0（v0.24 用户可在「我的→语音设置」自定义覆盖）
const SPEECH_BASE_OPTIONS = { language: 'zh-CN' };

const CATEGORY_EMOJI: Record<string, string> = {
  tech: '🏸',
  footwork: '👟',
  fitness: '💪',
  match: '🎯',
};
const CATEGORY_LABEL: Record<string, string> = {
  tech: '技术',
  footwork: '步法',
  fitness: '体能',
  match: '对抗',
  recovery: '恢复',
};

const BGM_LIST = [
  { id: 'electronic', name: '动感电子' },
  { id: 'relax', name: '轻松纯音' },
  { id: 'epic', name: '史诗激昂' },
  { id: 'none', name: '无音乐' }
];

// 使用按需获取 require，防止顶层三个大体积 mp3 被同时装载挤爆内存
function getBgmFile(id: string) {
  switch (id) {
    case 'electronic': return require('../../assets/sounds/bgm_electronic.mp3');
    case 'relax': return require('../../assets/sounds/bgm_relax.mp3');
    case 'epic': return require('../../assets/sounds/bgm_epic.mp3');
    default: return null;
  }
}

export default function TrainingRunScreen() {
  const { mid, plan_id } = useLocalSearchParams<{ mid?: string; plan_id?: string }>();
  const router = useRouter();

  const [bgmIndex, setBgmIndex] = useState(0); // 默认 0 (动感电子)
  const [showBgmMenu, setShowBgmMenu] = useState(false);

  const [items, setItems] = useState<TrainingItem[]>([]);
  const [totalMin, setTotalMin] = useState(0);
  const [planId, setPlanId] = useState('');

  const currentIndexRef = useRef(0);
  const [currentIndex, setCurrentIndexState] = useState(0);

  function setCurrentIndex(idx: number) {
    currentIndexRef.current = idx;
    setCurrentIndexState(idx);
  }

  const [timeLeft, setTimeLeft] = useState(0); // 当前项剩余秒数
  const [status, setStatus] = useState<'idle' | 'preparing' | 'running' | 'paused' | 'transitioning' | 'finished'>('idle');
  const [prepTime, setPrepTime] = useState(5); // 准备期倒计时
  const [transitionLeft, setTransitionLeft] = useState(TRANSITION_SECONDS); // 项间过渡倒计时

  const [conditionScale, setConditionScale] = useState<number>(1.0); // 身体状态缩放系数

  // 拖拽进度条时,用 dragging 屏蔽真实 setTimeLeft 节流避免 timer 重建
  const [dragValue, setDragValue] = useState<number | null>(null);
  const [currentItemDurationSec, setCurrentItemDurationSec] = useState(0); // 当前项总时长(应用 conditionScale 后),用于进度条

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 完成态：连续天数预告 + 徽章入场动画
  const [streakPreview, setStreakPreview] = useState<number | null>(null);
  const badgeAnim = useRef(new Animated.Value(0)).current; // 0→1 用于 scale+opacity

  // idle 态：副标题闪动 + 选中卡片缩放反馈 + 上次训练承接横幅
  const subtitleAnim = useRef(new Animated.Value(1)).current;
  const conditionCardAnim = useRef(new Animated.Value(1)).current;
  const [recentBanner, setRecentBanner] = useState<string | null>(null);

  // 背景音乐和音效引用
  const bgmSoundRef = useRef<Audio.Sound | null>(null);
  const sfxHitRef = useRef<Audio.Sound | null>(null);
  const sfxSqueakRef = useRef<Audio.Sound | null>(null);

  // v0.23 / v0.24 普通话 voice 选择 + 用户自定义参数
  // 1. 优先用户在「设置 → 语音」选定的 voice / rate / pitch（持久化在 AsyncStorage）
  // 2. 用户没选过则自动挑 zh-CN，排除 zh-TW / zh-HK
  const zhVoiceRef = useRef<string | undefined>(undefined);
  const ttsRateRef = useRef<number>(1.0);
  const ttsPitchRef = useRef<number>(1.0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 先读用户偏好（含 voice / rate / pitch）
        const [savedVoice, savedRate, savedPitch, voices] = await Promise.all([
          AsyncStorage.getItem('prefs.ttsVoice'),
          AsyncStorage.getItem('prefs.ttsRate'),
          AsyncStorage.getItem('prefs.ttsPitch'),
          Speech.getAvailableVoicesAsync(),
        ]);
        if (cancelled) return;

        if (savedRate) {
          const r = parseFloat(savedRate);
          if (!isNaN(r) && r > 0) ttsRateRef.current = r;
        }
        if (savedPitch) {
          const p = parseFloat(savedPitch);
          if (!isNaN(p) && p > 0) ttsPitchRef.current = p;
        }

        // 验证用户选的 voice 还在列表里（系统升级可能让 id 失效）
        if (savedVoice && voices.some((v) => v.identifier === savedVoice)) {
          zhVoiceRef.current = savedVoice;
          return;
        }

        // fallback：优先级 zh-CN > zh-Hans > zh-*（排除 zh-TW / zh-HK）
        const pick =
          voices.find((v) => v.language === 'zh-CN') ??
          voices.find((v) => v.language === 'zh-Hans') ??
          voices.find((v) => v.language?.toLowerCase().startsWith('zh') &&
                             !v.language.toLowerCase().includes('tw') &&
                             !v.language.toLowerCase().includes('hk'));
        if (pick) zhVoiceRef.current = pick.identifier;
      } catch {
        // 静默：拿不到就走系统默认，speak 仍带 language: 'zh-CN' 兜底
      }
    })();
    return () => { cancelled = true; };
  }, []);


  // 预加载音效
  useEffect(() => {
    let cancelled = false;
    let hitSnd: Audio.Sound | null = null;
    let squeakSnd: Audio.Sound | null = null;
    (async () => {
      try {
        const { sound: hitSound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/hit.ogg')
        );
        const { sound: squeakSound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/squeak.ogg')
        );
        if (cancelled) {
          // 组件已卸载,立刻 unload 防泄漏
          hitSound.unloadAsync().catch(() => {});
          squeakSound.unloadAsync().catch(() => {});
          return;
        }
        hitSnd = hitSound;
        squeakSnd = squeakSound;
        sfxHitRef.current = hitSound;
        sfxSqueakRef.current = squeakSound;
      } catch(e) {
        console.log('SFX load failed:', e);
      }
    })();
    return () => {
      cancelled = true;
      hitSnd?.unloadAsync().catch(() => {});
      squeakSnd?.unloadAsync().catch(() => {});
      bgmSoundRef.current?.unloadAsync().catch(() => {});
      sfxHitRef.current = null;
      sfxSqueakRef.current = null;
    };
  }, []);

  // 加载特定 BGM
  async function loadBgm(index: number, currentStatus: string) {
    if (bgmSoundRef.current) {
      await bgmSoundRef.current.unloadAsync();
      bgmSoundRef.current = null;
    }
    const bgm = BGM_LIST[index];
    const file = getBgmFile(bgm.id);
    if (file) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          file,
          { shouldPlay: currentStatus === 'running' || currentStatus === 'transitioning', isLooping: true, volume: 0.15 }
        );
        bgmSoundRef.current = sound;
      } catch (e) {
        console.log('BGM load failed:', e);
      }
    }
  }

  // 初次加载和切换时触发
  useEffect(() => {
    loadBgm(bgmIndex, status);
  }, [bgmIndex]);

  // BGM 跟随 status 暂停/继续(独立 effect,避免与计时器 effect 互相干扰导致重复 play 警告)
  useEffect(() => {
    const s = bgmSoundRef.current;
    if (!s) return;
    if (status === 'running' || status === 'transitioning') {
      s.playAsync().catch(() => {});
    } else {
      s.pauseAsync().catch(() => {});
    }
  }, [status]);

  // idle 态挂载：恢复上次身体状态选择（"被记起来了"彩蛋）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const v = await AsyncStorage.getItem('prefs.lastCondition');
        if (cancelled || !v) return;
        const num = parseFloat(v);
        if (num === 1.0 || num === 0.75 || num === 0.5) {
          setConditionScale(num);
          vibrateLight();
        }
      } catch {
        // 读取失败 → 保持默认 1.0,静默
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // idle 态挂载：拉一次最近一次训练日志,生成承接横幅文案
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const recent = await listTrainingLogs(1);
        if (cancelled || recent.length === 0) return;
        const last = recent[0];
        const diffDays = dayjs().startOf('day').diff(dayjs(last.date).startOf('day'), 'day');
        if (diffDays === 0) {
          setRecentBanner(`今天已练过 ${last.duration_min} 分钟，再来一组？`);
        } else if (diffDays >= 1 && diffDays <= 6) {
          setRecentBanner(`距上次训练 ${diffDays} 天，状态调好再开始`);
        }
        // ≥7 天 / 无记录 → 不渲染(setRecentBanner 保持 null)
      } catch {
        // 拉取失败 → 不渲染,静默
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 切换身体状态：保存 + 副标题闪动 + 选中卡片缩放反馈
  function pickCondition(scale: number) {
    setConditionScale(scale);
    vibrateLight();
    AsyncStorage.setItem('prefs.lastCondition', String(scale)).catch((e) => {
      console.warn('save lastCondition failed', e);
    });
    // 副标题 opacity 闪动 0.4→1.0
    subtitleAnim.setValue(0.4);
    Animated.timing(subtitleAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    // 选中卡片 scale 反馈 1.0→1.08→1.0,共 220ms
    conditionCardAnim.setValue(1);
    Animated.sequence([
      Animated.timing(conditionCardAnim, { toValue: 1.08, duration: 110, useNativeDriver: true }),
      Animated.timing(conditionCardAnim, { toValue: 1, duration: 110, useNativeDriver: true }),
    ]).start();
  }

  useEffect(() => {
    (async () => {
      const plan = await getActivePlan();
      setPlanId(plan.id);
      let targetModules: TrainingModule[] = [];
      
      if (mid) {
        // 先在当前激活计划找
        let m = plan.modules.find((x) => x.id === mid);
        // 找不到，且如果传了 plan_id，去预置计划里找
        if (!m && plan_id) {
          const fallbackPlan = defaultPlans.find((p) => p.id === plan_id);
          if (fallbackPlan) {
            m = fallbackPlan.modules.find((x) => x.id === mid);
            setPlanId(fallbackPlan.id);
          }
        }
        if (m) targetModules = [m];
      } else {
        targetModules = selectToday(plan).modules;
      }

      const flatItems = targetModules.flatMap((m) => m.items);
      setItems(flatItems);
      setTotalMin(flatItems.reduce((acc, it) => acc + it.duration_min, 0));
    })();
    
    return () => {
      stopTimer();
      Speech.stop();
    };
  }, [mid]);

  // 准备期倒计时(独立 effect)
  useEffect(() => {
    if (status !== 'preparing') return;
    timerRef.current = setInterval(() => {
      setPrepTime((prev) => {
        if (prev <= 1) {
          stopTimer();
          setStatus('running');
          vibrateMedium();
          speakRaw('开始');
          return 0;
        }
        // v0.25 用 speakRaw 不打断前一个字，让"四、三、二、一"在 TTS 队列里自然衔接
        speakRaw(numToChinese(prev - 1));
        vibrateLight();
        return prev - 1;
      });
    }, 1000);
    return stopTimer;
  }, [status]);

  // 训练运行倒计时(只依赖 status,内部用函数式 setTimeLeft 读最新值,避免 timeLeft 变化重建 interval)
  useEffect(() => {
    if (status !== 'running') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // 用 setTimeout 让本轮 state 更新完成后再 finish,避免在 setter 内部直接改 status 触发警告
          setTimeout(() => handleItemFinish(), 0);
          return 0;
        }
        const currentItem = items[currentIndexRef.current];
        if (currentItem) {
          const totalSec = Math.max(1, Math.round(currentItem.duration_min * conditionScale)) * 60;
          const elapsed = totalSec - prev;
          runGhostCoach(currentItem, prev, elapsed);
        }
        return prev - 1;
      });
    }, 1000);
    return stopTimer;
  }, [status, items, conditionScale]);

  // 项间「Next Up + 深呼吸」过渡倒计时（v0.10.0）
  useEffect(() => {
    if (status !== 'transitioning') return;
    timerRef.current = setInterval(() => {
      setTransitionLeft((prev) => {
        if (prev <= 1) {
          stopTimer();
          // 倒数完成 → 进入下一项的常规 startItem 流程
          startItem(currentIndexRef.current + 1);
          return 0;
        }
        // 在「呼气最深处」（4→3 切换瞬间，约第 2 秒末）震一次 light，每个 transitioning 周期只震 1 次
        if (prev === 4) vibrateLight();
        return prev - 1;
      });
    }, 1000);
    return stopTimer;
  }, [status]);

  // 进入 finished：拉一次 streak + 判定今日是否已打卡，并跑徽章入场动画
  useEffect(() => {
    if (status !== 'finished') return;
    let cancelled = false;
    (async () => {
      try {
        const [streak, recent] = await Promise.all([getStreak(), listTrainingLogs(1)]);
        if (cancelled) return;
        const today = dayjs().format('YYYY-MM-DD');
        const alreadyLoggedToday = recent.length > 0 && recent[0].date === today;
        // 今日已打卡 → 当前 streak 已含今天；未打卡 → 打卡后会变 streak+1
        setStreakPreview(alreadyLoggedToday ? streak : streak + 1);
      } catch {
        if (!cancelled) setStreakPreview(null);
      }
    })();
    badgeAnim.setValue(0);
    Animated.timing(badgeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    return () => { cancelled = true; };
  }, [status]);

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function speak(text: string, rate: number = 1.0) {
    Speech.stop();
    speakImpl(text);
    void rate;
  }

  // v0.25 用于"连续数字朗读"场景（倒数、次数报点、节拍）：
  // 不调 Speech.stop()，让 TTS 按顺序排队朗读，避免每秒切断前一个字导致的"机器人单字感"。
  function speakRaw(text: string) {
    speakImpl(text);
  }

  function speakImpl(text: string) {
    const spoken = toChinesePronunciation(text);
    const opts: Speech.SpeechOptions = {
      ...SPEECH_BASE_OPTIONS,
      rate: ttsRateRef.current,
      pitch: ttsPitchRef.current,
    };
    if (zhVoiceRef.current) opts.voice = zhVoiceRef.current;
    Speech.speak(spoken, opts);
  }

  function runGhostCoach(item: TrainingItem, timeLeftSec: number, elapsed: number) {
    if (timeLeftSec === 11) {
      speak('当前动作最后十秒');
      return;
    }
    if (timeLeftSec <= 10) return; // 倒数 10 秒留给结束
    if (elapsed <= 5) return; // 开场前 5 秒留给名称播报

    const adjElapsed = elapsed - 5;

    const playHit = () => { sfxHitRef.current?.replayAsync().catch(()=>{}); };
    const playSqueak = () => { sfxSqueakRef.current?.replayAsync().catch(()=>{}); };

    // 1. 匹配「次数/个数」：例如 "波比跳 4x15个"
    const matchReps = item.name.match(/(\d+)\s*[x×*]\s*(\d+)\s*(个|次)/);
    if (matchReps) {
      const sets = parseInt(matchReps[1], 10);
      const reps = parseInt(matchReps[2], 10);
      const repTime = 3; // 默认一个动作 3 秒
      const restTime = 30; // 默认休息 30 秒
      const cycleTime = reps * repTime + restTime;

      const currentSet = Math.floor(adjElapsed / cycleTime) + 1;
      const t = adjElapsed % cycleTime;

      if (currentSet <= sets) {
        if (t === 0 && currentSet > 1) {
          speak(`第 ${currentSet} 组，开始`);
        } else if (t < reps * repTime) {
          // 工作期：计数
          if (t % repTime === 0) {
            const rep = Math.floor(t / repTime) + 1;
            if (rep <= reps) {
              // v0.25 次数报点用 speakRaw 不打断，TTS 队列衔接更自然
              speakRaw(rep.toString());
              if (item.category === 'tech' || item.category === 'match') playHit();
              if (item.category === 'footwork') playSqueak();
            }
            if (rep === reps) setTimeout(() => speak('好，休息三十秒'), 1500);
          }
        } else {
          // 休息期：倒计时
          const restLeft = cycleTime - t;
          if (restLeft <= 3 && restLeft > 0) speakRaw(restLeft.toString());
        }
        return; // 被精细正则接管后，跳过兜底逻辑
      }
    }

    // 2. 匹配「按秒分组」：例如 "六点步法 5x30秒"
    const matchTime = item.name.match(/(\d+)\s*[x×*]\s*(\d+)\s*(秒)/);
    if (matchTime) {
      const sets = parseInt(matchTime[1], 10);
      const workSec = parseInt(matchTime[2], 10);
      const restTime = 30;
      const cycleTime = workSec + restTime;

      const currentSet = Math.floor(adjElapsed / cycleTime) + 1;
      const t = adjElapsed % cycleTime;

      if (currentSet <= sets) {
        if (t === 0 && currentSet > 1) {
          speak(`第 ${currentSet} 组，开始`);
        } else if (t < workSec) {
          // 工作期
          const workLeft = workSec - t;
          if (workLeft === Math.floor(workSec / 2)) speak('过半了，坚持住');
          if (workLeft <= 3 && workLeft > 0) speakRaw(workLeft.toString());
          if (workLeft === 1) setTimeout(() => speak('好，休息三十秒'), 1500);
          
          // 在时间组内，如果是步法，继续播报随机点
          if (workLeft > 3 && workLeft % 3 === 0 && item.name.includes('六点')) {
            const pts = ['左前网', '右前网', '左后退', '右后退', '左接杀', '右接杀'];
            speak(pts[Math.floor(Math.random() * pts.length)], 1.3);
            playSqueak();
          } else if (workLeft > 3 && workLeft % 4 === 0 && item.name.includes('四方')) {
            const pts = ['左前', '右前', '左后', '右后'];
            speak(pts[Math.floor(Math.random() * pts.length)], 1.3);
            playSqueak();
          }
        } else {
          // 休息期
          const restLeft = cycleTime - t;
          if (restLeft === 10) speak('准备下一组');
          if (restLeft <= 3 && restLeft > 0) speakRaw(restLeft.toString());
        }
        return;
      }
    }

    // 3. 兜底逻辑：普通的没写组数的动作
    if (item.name.includes('六点') && timeLeftSec % 3 === 0) {
      const pts = ['左前网', '右前网', '左后退', '右后退', '左接杀', '右接杀'];
      speak(pts[Math.floor(Math.random() * pts.length)], 1.3);
      playSqueak();
    } else if (item.name.includes('四方') && timeLeftSec % 4 === 0) {
      const pts = ['左前', '右前', '左后', '右后'];
      speak(pts[Math.floor(Math.random() * pts.length)], 1.3);
      playSqueak();
    } else if (item.category === 'fitness' && timeLeftSec % 15 === 0) {
      const pts = ['坚持住', '注意呼吸', '保持节奏', '核心收紧', '发力'];
      speak(pts[Math.floor(Math.random() * pts.length)], 1.2);
    } else if (item.category === 'tech') {
      if (timeLeftSec % 3 === 0) {
        const beat = Math.floor(elapsed / 3) % 4 + 1;
        speakRaw(beat.toString());
        playHit();
      } else if (timeLeftSec % 20 === 0) {
        const pts = ['注意动作完整', '体会发力', '回中要快', '盯住球'];
        speak(pts[Math.floor(Math.random() * pts.length)], 1.2);
      }
    } else {
      if (timeLeftSec % 30 === 0) speak('做得很好，继续保持');
    }
  }

  function startWorkout() {
    if (items.length === 0) return;
    vibrateMedium();
    startItem(0, true);
  }

  function startItem(idx: number, isFirst: boolean = false) {
    const it = items[idx];
    setCurrentIndex(idx);
    
    // 应用身体状态缩放系数，最小不低于 1 分钟
    const scaledMin = Math.max(1, Math.round(it.duration_min * conditionScale));
    const scaledSec = scaledMin * 60;
    setCurrentItemDurationSec(scaledSec);
    setTimeLeft(scaledSec);
    
    let text = `下一个动作：${it.name}，时长 ${scaledMin} 分钟。`;
    if (it.notes) text += `注意：${it.notes}`;
    
    speak(text);
    
    // 给足语音播报的时间，稍微长一点再切入倒数
    setTimeout(() => {
      setPrepTime(5);
      setStatus('preparing');
      setTimeout(() => { speak('五', 1.0); vibrateLight(); }, 1000);
    }, isFirst ? 2000 : 3500); 
  }

  function handleItemFinish() {
    stopTimer();
    const nextIdx = currentIndexRef.current + 1;
    if (nextIdx < items.length) {
      const nextItem = items[nextIdx];
      // 防御：理论上 nextIdx < items.length 必有，但兜底直接进下一项
      if (!nextItem) { startItem(nextIdx); return; }
      vibrateMedium();
      speak(`很好，先调整呼吸，下一个是 ${nextItem.name}。`);
      setTransitionLeft(TRANSITION_SECONDS);
      setStatus('transitioning');
    } else {
      vibrateHeavy();
      setStatus('finished');
      vibrateSuccess();
      speak('恭喜你，已完成本次所有训练内容，太棒了！');
    }
  }

  function nextItemManually() {
    vibrateLight();
    if (Platform.OS === 'web') {
      const ok = window.confirm('你确定要提前结束当前动作进入下一项吗？');
      if (ok) {
        stopTimer();
        handleItemFinish();
      }
      return;
    }
    Alert.alert('跳过此项？', '你确定要提前结束当前动作进入下一项吗？', [
      { text: '取消', style: 'cancel' },
      { text: '跳过', onPress: () => {
          stopTimer();
          handleItemFinish();
        } 
      }
    ]);
  }

  function togglePause() {
    vibrateMedium();
    if (status === 'running') {
      setStatus('paused');
      speak('训练已暂停');
    } else if (status === 'paused') {
      setStatus('running');
      speak('继续训练');
    }
  }

  function exitWorkout() {
    if (Platform.OS === 'web') {
      const ok = window.confirm('结束训练？记录将不会被保存');
      if (ok) {
        router.back();
      }
      return;
    }
    Alert.alert('结束训练？', '记录将不会被保存', [
      { text: '继续练', style: 'cancel' },
      { text: '直接退出', style: 'destructive', onPress: () => router.back() }
    ]);
  }

  // finished → 再来一组：清状态回到 idle
  function restartWorkout() {
    vibrateLight();
    stopTimer();
    Speech.stop();
    setCurrentIndex(0);
    setTimeLeft(0);
    setPrepTime(5);
    setCurrentItemDurationSec(0);
    setDragValue(null);
    setStatus('idle');
  }

  if (items.length === 0) {
    return <Screen><Text style={{ color: colors.textDim }}>没有训练项</Text></Screen>;
  }

  if (status === 'idle') {
    const scaledTotalMin = items.reduce(
      (a, it) => a + Math.max(1, Math.round(it.duration_min * conditionScale)),
      0,
    );
    const scaledSubtitle =
      conditionScale === 1.0
        ? `🔋 满血模式 · 预计 ${scaledTotalMin} 分钟完成`
        : conditionScale === 0.75
          ? `⚡ 让步 25% · 预计 ${scaledTotalMin} 分钟完成`
          : `🌙 半负荷 · 预计 ${scaledTotalMin} 分钟完成`;
    const startBtnSub =
      conditionScale === 1.0
        ? '（按 100% 强度执行）'
        : conditionScale === 0.75
          ? '（按 75% 强度执行）'
          : '（按 50% 强度执行）';
    return (
      <View style={{ flex: 1 }}>
        <Screen scroll={false} transparent={true}>
          <WorkoutBackground />
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.navBackBtn}>
              <Ionicons name="chevron-back" size={20} color={colors.text} style={{ marginRight: 2 }} />
              <Text style={styles.navBackText}>返回</Text>
            </Pressable>
          </View>
          <View style={styles.centerWrap}>
            <Text style={{ fontSize: 60, marginBottom: spacing.md }}>🏸</Text>
            {recentBanner && <Text style={styles.recentBanner}>{recentBanner}</Text>}
            <Text style={styles.title}>本次训练共 {items.length} 项</Text>
            <Text style={styles.meta}>原定需要 {totalMin} 分钟</Text>
            <Animated.Text style={[styles.scaledTimeText, { opacity: subtitleAnim }]}>
              {scaledSubtitle}
            </Animated.Text>

            {/* 增加今天状态的调查问卷 */}
            <View style={{ marginTop: spacing.xl, width: '100%', paddingHorizontal: spacing.xl }}>
              <Text style={{ color: colors.text, textAlign: 'center', marginBottom: spacing.md, fontWeight: '600' }}>今天感觉怎么样？</Text>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Animated.View style={{ flex: 1, transform: [{ scale: conditionScale === 1.0 ? conditionCardAnim : 1 }] }}>
                  <Pressable onPress={() => pickCondition(1.0)} style={[styles.conditionBtn, conditionScale === 1.0 && styles.conditionBtnActive]}>
                    <Text style={{ fontSize: 28 }}>💪</Text>
                    <Text style={[styles.conditionText, conditionScale === 1.0 && { color: colors.primary }]}>满血</Text>
                    <Text style={styles.conditionDesc}>100% 负荷</Text>
                  </Pressable>
                </Animated.View>
                <Animated.View style={{ flex: 1, transform: [{ scale: conditionScale === 0.75 ? conditionCardAnim : 1 }] }}>
                  <Pressable onPress={() => pickCondition(0.75)} style={[styles.conditionBtn, conditionScale === 0.75 && styles.conditionBtnActive]}>
                    <Text style={{ fontSize: 28 }}>⚡</Text>
                    <Text style={[styles.conditionText, conditionScale === 0.75 && { color: colors.primary }]}>一般</Text>
                    <Text style={styles.conditionDesc}>75% 负荷</Text>
                  </Pressable>
                </Animated.View>
                <Animated.View style={{ flex: 1, transform: [{ scale: conditionScale === 0.5 ? conditionCardAnim : 1 }] }}>
                  <Pressable onPress={() => pickCondition(0.5)} style={[styles.conditionBtn, conditionScale === 0.5 && styles.conditionBtnActive]}>
                    <Text style={{ fontSize: 28 }}>🪫</Text>
                    <Text style={[styles.conditionText, conditionScale === 0.5 && { color: colors.primary }]}>疲惫</Text>
                    <Text style={styles.conditionDesc}>50% 负荷</Text>
                  </Pressable>
                </Animated.View>
              </View>
            </View>

            <Pressable style={styles.startBtnBig} onPress={startWorkout}>
              <Text style={styles.startBtnBigText}>▶ 开始跟练</Text>
              <Text style={styles.startBtnSubText}>{startBtnSub}</Text>
            </Pressable>
          </View>
        </Screen>
      </View>
    );
  }

  if (status === 'preparing') {
    const currentItem = items[currentIndex];
    return (
      <View style={{ flex: 1 }}>
        <Screen scroll={false} transparent={true}>
          <WorkoutBackground />
          <View style={[styles.centerWrap, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <Text style={{ color: colors.primary, fontSize: font.h2, fontWeight: '700', marginBottom: spacing.lg }}>准备动作</Text>
            <Text style={{ color: colors.text, fontSize: 32, fontWeight: '800', textAlign: 'center', marginHorizontal: spacing.lg }}>{currentItem.name}</Text>
            {currentItem.notes ? <Text style={{ color: colors.warn, fontSize: font.h3, marginTop: spacing.md, textAlign: 'center' }}>💡 {currentItem.notes}</Text> : null}
            <Text style={{ color: colors.text, fontSize: 120, fontWeight: '800', marginTop: spacing.xxl, fontVariant: ['tabular-nums'] }}>{prepTime}</Text>
          </View>
        </Screen>
      </View>
    );
  }

  if (status === 'finished') {
    const actualMin = items.reduce((acc, it) => acc + Math.max(1, Math.round(it.duration_min * conditionScale)), 0);
    const plannedTotalMin = items.reduce((a, it) => a + it.duration_min, 0);
    const completionPct = plannedTotalMin > 0
      ? Math.min(100, Math.round((actualMin / plannedTotalMin) * 100))
      : 0;
    const finishedQuote = conditionScale >= 1
      ? '满血状态拉满一整套，状态在线 👏'
      : conditionScale >= 0.75
        ? '状态一般还能咬牙完成，自律者得自由 💪'
        : '疲惫的日子也没缺席，这就是冠军心态 🔥';

    return (
      <View style={{ flex: 1 }}>
        <Screen scroll={false} transparent={true}>
          <WorkoutBackground />
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.navBackBtn}>
              <Ionicons name="chevron-back" size={20} color={colors.text} style={{ marginRight: 2 }} />
              <Text style={styles.navBackText}>返回</Text>
            </Pressable>
          </View>
          <View style={styles.centerWrap}>
            <Animated.View
              style={[
                styles.badgeWrap,
                {
                  opacity: badgeAnim,
                  transform: [{
                    scale: badgeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
                  }],
                },
              ]}
            >
              <Text style={{ fontSize: 80 }}>🏆</Text>
            </Animated.View>
            <Text style={[styles.title, { color: colors.warn, fontSize: 36, marginTop: spacing.lg }]}>训练完成！</Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryNum}>{actualMin}</Text>
                <Text style={styles.summaryLabel}>分钟</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCol}>
                <Text style={styles.summaryNum}>{items.length}/{items.length}</Text>
                <Text style={styles.summaryLabel}>完成项</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCol}>
                <Text style={styles.summaryNum}>{completionPct}%</Text>
                <Text style={styles.summaryLabel}>完成率</Text>
              </View>
            </View>

            <Text style={styles.finishedQuote}>{finishedQuote}</Text>

            {streakPreview !== null && (
              <Text style={styles.streakPreview}>🔥 今日打卡后将达到 {streakPreview} 天连续</Text>
            )}

            <Pressable
              style={[styles.startBtnBig, { backgroundColor: colors.warn }]}
              onPress={() => {
                router.replace({ pathname: '/training/log', params: { plan_id: planId, mins: String(actualMin) } });
              }}
            >
              <Text style={[styles.startBtnBigText, { color: '#000' }]}>📝 领取奖励并打卡</Text>
            </Pressable>

            <Pressable onPress={restartWorkout} style={{ marginTop: spacing.md }}>
              <Text style={styles.restartLink}>再来一组同样的训练 →</Text>
            </Pressable>
          </View>
        </Screen>
      </View>
    );
  }

  const currentItem = items[currentIndex];
  const nextItem = currentIndex + 1 < items.length ? items[currentIndex + 1] : null;
  const nextScaledMin = nextItem ? Math.max(1, Math.round(nextItem.duration_min * conditionScale)) : 0;

  // 全局进度: 已完成项数 + 当前项已完成比例,除以总项数
  // transitioning 时强制 currentItemProgress = 1，让进度条与「已完成 X/Y」徽章对齐
  const currentItemProgress = status === 'transitioning'
    ? 1
    : currentItemDurationSec > 0
      ? Math.max(0, Math.min(1, (currentItemDurationSec - timeLeft) / currentItemDurationSec))
      : 0;
  const overallProgress = items.length > 0
    ? (currentIndex + currentItemProgress) / items.length
    : 0;
  const progressBarColor = status === 'paused' ? colors.textDim : colors.primary;

  return (
    <View style={{ flex: 1 }}>
      <Screen scroll={false} transparent={true}>
        <WorkoutBackground />
        <View style={styles.runContainer}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.navBackBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.text} style={{ marginRight: 2 }} />
            <Text style={styles.navBackText}>返回</Text>
          </Pressable>
          <Text style={styles.progressText}>
            已完成 {currentIndex} 个，共 {items.length} 个
          </Text>
          <Pressable onPress={() => setShowBgmMenu(!showBgmMenu)} style={styles.bgmBtn}>
            <Text style={styles.bgmBtnText}>🎵 {BGM_LIST[bgmIndex].name}</Text>
          </Pressable>
        </View>

        {showBgmMenu && (
          <View style={styles.bgmMenu}>
            {BGM_LIST.map((bgm, i) => (
              <Pressable 
                key={bgm.id} 
                style={[styles.bgmMenuItem, i === bgmIndex && styles.bgmMenuItemActive]}
                onPress={() => {
                  setBgmIndex(i);
                  setShowBgmMenu(false);
                }}
              >
                <Text style={[styles.bgmMenuText, i === bgmIndex && { color: colors.primary }]}>
                  {bgm.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* 全局训练进度条 */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(overallProgress * 100)}%`, backgroundColor: progressBarColor }]} />
        </View>

        {status === 'transitioning' && nextItem ? (
          <TransitionScene
            currentIndex={currentIndex}
            totalItems={items.length}
            nextItem={nextItem}
            scaledMin={nextScaledMin}
            secondsLeft={transitionLeft}
            onSkip={() => {
              vibrateLight();
              stopTimer();
              startItem(currentIndexRef.current + 1);
            }}
          />
        ) : (
          <>
        <View style={styles.mainBox}>
          {currentItem.animationType ? (
            <View style={styles.demoVideoWrap}>
              <TutorialMedia
                animationType={currentItem.animationType}
                name={currentItem.name}
                height={260}
                style={{ borderRadius: 0, backgroundColor: 'transparent' }}
              />
            </View>
          ) : currentItem.videoUri ? (
            <View style={styles.demoVideoWrap}>
              <Video
                source={{ uri: currentItem.videoUri }}
                style={StyleSheet.absoluteFillObject}
                resizeMode={ResizeMode.COVER}
                shouldPlay={status === 'running'}
                isLooping
                isMuted // 必须静音，否则会干扰教练说话和BGM
              />
            </View>
          ) : (
            <Text style={styles.categoryTag}>
              {currentItem.category === 'tech' ? '🏸 技术' : currentItem.category === 'footwork' ? '👟 步法' : '💪 体能/其他'}
            </Text>
          )}

          <Text style={styles.currentItemName}>{currentItem.name}</Text>
          {currentItem.notes ? (
            <Text style={styles.currentNotes}>💡 {currentItem.notes}</Text>
          ) : null}

          <Text style={[styles.timer, status === 'paused' && { color: colors.textDim }]}>
            {fmtTime(timeLeft)}
          </Text>
          {status === 'running' && (currentItem.name.includes('六点') || currentItem.name.includes('四方')) && (
            <Text style={styles.coachHint}>🎧 虚拟教练正在随机报点...</Text>
          )}

          {/* 时间微调滑动条:拖动时仅本地态变化,松手才真正 setTimeLeft 避免重建 timer */}
          <View style={{ width: '80%', marginTop: spacing.lg }}>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0}
              maximumValue={Math.max(1, currentItemDurationSec)}
              value={dragValue ?? timeLeft}
              onValueChange={(val) => setDragValue(Math.floor(val))}
              onSlidingComplete={(val) => {
                const v = Math.max(0, Math.floor(val));
                setTimeLeft(v);
                setDragValue(null);
                vibrateLight();
              }}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor="#fff"
            />
            <Text style={{ color: colors.textDim, fontSize: font.tiny, textAlign: 'center' }}>
              拖动可直接调整剩余时间
            </Text>
          </View>
        </View>

        <View style={styles.bottomArea}>
          <View style={styles.nextBox}>
            {nextItem ? (() => {
              const emoji = CATEGORY_EMOJI[nextItem.category] ?? '🎯';
              const catLabel = CATEGORY_LABEL[nextItem.category] ?? '训练';
              return (
                <>
                  <View style={styles.nextBadge}>
                    <Text style={styles.nextBadgeEmoji}>{emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nextTitle} numberOfLines={1}>下一个 · {nextItem.name}</Text>
                    <Text style={styles.nextMeta}>{nextItem.duration_min} 分钟 · {catLabel}</Text>
                  </View>
                </>
              );
            })() : (
              <>
                <View style={[styles.nextBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Text style={styles.nextBadgeEmoji}>🏆</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nextTitle}>🏁 这是最后一项</Text>
                  <Text style={styles.nextMeta}>坚持到底！</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.controls}>
            <Pressable style={styles.iconBtn} onPress={exitWorkout}>
              <View style={[styles.roundSmallBtn, { backgroundColor: colors.danger }]}>
                <Ionicons name="stop" size={24} color="#fff" />
              </View>
              <Text style={styles.iconBtnLabel}>结束</Text>
            </Pressable>
            
            <Pressable style={styles.playPauseBtn} onPress={togglePause}>
              <Ionicons name={status === 'running' ? 'pause' : 'play'} size={36} color="#fff" style={{ marginLeft: status === 'running' ? 0 : 4 }} />
            </Pressable>
            
            <Pressable style={styles.iconBtn} onPress={nextItemManually}>
              <View style={[styles.roundSmallBtn, { backgroundColor: colors.cardAlt }]}>
                <Ionicons name="play-skip-forward" size={24} color="#fff" />
              </View>
              <Text style={styles.iconBtnLabel}>跳过</Text>
            </Pressable>
          </View>
        </View>
        </>
        )}
        </View>
      </Screen>
    </View>
  );
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function WorkoutBackground() {
  // 使用一张暗调、动感十足的健身/羽毛球场地的图片作为背景，加上一层黑色半透明遮罩，保证前景白色文字清晰可见
  return (
    <View style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }]}>
      <ImageBackground 
        source={require('../../assets/images/court_bg.jpg')}
        style={{ flex: 1, width: '100%', height: '100%' }}
        resizeMode="cover"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(11, 18, 32, 0.85)' }} />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  title: { color: colors.text, fontSize: font.h1, fontWeight: '700' },
  meta: { color: colors.textDim, fontSize: font.body, marginTop: spacing.md },
  startBtnBig: { backgroundColor: colors.primary, paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, borderRadius: radius.pill, marginTop: spacing.xxl },
  startBtnBigText: { color: '#fff', fontSize: font.h3, fontWeight: '800' },
  runContainer: { flex: 1, justifyContent: 'space-between', zIndex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.md, paddingHorizontal: spacing.md, minHeight: 44, zIndex: 10 },
  progressText: { color: colors.textDim, fontSize: font.body, fontWeight: '600', letterSpacing: 1 },
  demoVideoWrap: { width: '100%', height: 260, borderRadius: radius.lg, backgroundColor: colors.card, overflow: 'hidden', marginBottom: spacing.md, borderWidth: 3, borderColor: colors.primary },
  bgmBtn: { backgroundColor: colors.cardAlt, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  bgmBtnText: { color: colors.text, fontSize: font.small, fontWeight: '600' },
  bgmMenu: { position: 'absolute', top: 60, right: spacing.md, backgroundColor: colors.cardAlt, borderRadius: radius.md, zIndex: 10, padding: 4, elevation: 5, shadowColor: '#000', shadowOffset: { width:0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8 },
  bgmMenuItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  bgmMenuItemActive: { backgroundColor: colors.card },
  bgmMenuText: { color: colors.text, fontSize: font.body, textAlign: 'center' },
  navBackBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardAlt, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  navBackText: { color: colors.text, fontSize: font.small, fontWeight: '600' },
  progressTrack: { height: 3, backgroundColor: colors.border, marginHorizontal: spacing.md, marginTop: spacing.sm, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  mainBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg, zIndex: 1 },
  categoryTag: { color: colors.primary, fontSize: font.body, fontWeight: '700', marginBottom: spacing.md },
  currentItemName: { color: colors.text, fontSize: 32, fontWeight: '800', textAlign: 'center', lineHeight: 44 },
  currentNotes: { color: colors.warn, fontSize: font.body, marginTop: spacing.lg, textAlign: 'center' },
  timer: { color: colors.text, fontSize: 80, fontWeight: '800', fontVariant: ['tabular-nums'], marginTop: spacing.xxl, letterSpacing: 2 },
  coachHint: { color: colors.accent, marginTop: spacing.lg, fontSize: font.small, fontWeight: '600' },
  bottomArea: { paddingBottom: spacing.xl },
  nextBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
  },
  nextBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  nextBadgeEmoji: { fontSize: 16 },
  nextTitle: { color: colors.text, fontSize: font.small, fontWeight: '600' },
  nextMeta: { color: colors.textDim, fontSize: font.tiny, marginTop: 2 },
  nextText: { color: colors.textDim, fontSize: font.small, textAlign: 'center' },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl },
  iconBtn: { alignItems: 'center', width: 60 },
  roundSmallBtn: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  iconBtnLabel: { color: colors.textDim, fontSize: font.tiny, marginTop: 8 },
  playPauseBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  conditionBtn: { flex: 1, alignItems: 'center', backgroundColor: colors.card, padding: spacing.md, borderRadius: radius.md, borderWidth: 2, borderColor: 'transparent' },
  conditionBtnActive: { borderColor: colors.primary, backgroundColor: colors.cardAlt },
  conditionText: { color: colors.textDim, fontWeight: '700', fontSize: font.h3, marginTop: spacing.sm },
  conditionDesc: { color: colors.textDim, fontSize: font.tiny, marginTop: 4 },
  badgeWrap: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(245, 158, 11, 0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: colors.warn, shadowColor: colors.warn, shadowOpacity: 0.8, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } },
  summaryCard: {
    flexDirection: 'row',
    width: '80%',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryNum: { color: colors.text, fontSize: font.h2, fontWeight: '800', fontVariant: ['tabular-nums'] },
  summaryLabel: { color: colors.textDim, fontSize: font.tiny, marginTop: 4 },
  summaryDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.08)' },
  finishedQuote: { color: colors.text, fontSize: font.body, marginTop: spacing.lg, textAlign: 'center', paddingHorizontal: spacing.lg },
  streakPreview: { color: colors.primary, fontSize: font.small, marginTop: spacing.sm, fontWeight: '600' },
  restartLink: { color: colors.textDim, fontSize: font.body, fontWeight: '600' },
  recentBanner: { color: colors.textDim, fontSize: font.tiny, marginBottom: spacing.sm, textAlign: 'center' },
  scaledTimeText: { color: colors.primary, fontSize: font.small, marginTop: spacing.sm, fontWeight: '600', textAlign: 'center' },
  startBtnSubText: { color: 'rgba(255,255,255,0.7)', fontSize: font.tiny, marginTop: 4, textAlign: 'center' },
});

