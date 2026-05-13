import { Platform } from 'react-native';
import { Keypoint } from './keypoints';

// 只有在非 Web 下才去执行真正的推断逻辑
let useTensorflowModel: any = () => ({ state: 'loading' });
let useFrameProcessor: any = () => null;
let runOnJS: any = (fn: any) => fn;
let useResizePlugin: any = () => null;

if (Platform.OS !== 'web') {
  const tflite = require('react-native-fast-tflite');
  const vc = require('react-native-vision-camera');
  const worklets = require('react-native-worklets-core');
  const resizePlugin = require('vision-camera-resize-plugin');
  
  useTensorflowModel = tflite.useTensorflowModel || tflite.default?.useTensorflowModel;
  useFrameProcessor = vc.useFrameProcessor || vc.default?.useFrameProcessor;
  runOnJS = worklets.runOnJS || worklets.default?.runOnJS;
  useResizePlugin = resizePlugin.useResizePlugin || resizePlugin.default?.useResizePlugin;
}

export function useMovenet(onFrame: (kps: Keypoint[]) => void) {
  // 加载本地 Movenet 模型
  const model = useTensorflowModel(
    Platform.OS === 'web' ? null : require('../../../assets/models/movenet_lightning.tflite')
  );
  
  const resize = typeof useResizePlugin === 'function' ? useResizePlugin() : null;

  let onFrameJS: any = null;
  if (typeof runOnJS === 'function') {
    onFrameJS = runOnJS(onFrame);
  }

  const frameProcessor = typeof useFrameProcessor === 'function' ? useFrameProcessor((frame: any) => {
    'worklet';
    if (!model.state || model.state !== 'loaded' || !model.model || !resize) return;
    
    try {
      // 1. 将高分辨率相机帧缩放为 192x192 的 RGB Float32 数组，供 MoveNet 使用
      const resized = resize(frame, {
        scale: {
          width: 192,
          height: 192,
        },
        pixelFormat: 'rgb',
        dataType: 'float32',
      });

      // 2. 执行真正的 AI 骨骼点推断
      const outputs = model.model.runSync([resized]);
      const keypointsRaw = outputs[0]; 
      
      if (!keypointsRaw || keypointsRaw.length < 51) return;

      const kps: Keypoint[] = [];
      for (let i = 0; i < 17; i++) {
        // MoveNet 的坐标是归一化过的 (0~1)，且顺序是 Y, X, Score
        const y = Number(keypointsRaw[i * 3]);
        const x = Number(keypointsRaw[i * 3 + 1]);
        const score = Number(keypointsRaw[i * 3 + 2]);
        kps.push({ x, y, score });
      }

      if (onFrameJS) onFrameJS(kps);

    } catch (e) {
      // 捕获可能的数据结构错误
    }
  }, [model, resize]) : null;

  return { model, frameProcessor };
}
