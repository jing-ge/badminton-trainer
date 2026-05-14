import { Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { Keypoint } from './keypoints';

let useTensorflowModel: any = () => ({ state: 'loading' });
let useFrameProcessor: any = () => null;
let runOnJS: any = (fn: any) => fn;
let useResizePlugin: any = () => null;

if (Platform.OS !== 'web') {
  try {
    const tflite = require('react-native-fast-tflite');
    const vc = require('react-native-vision-camera');
    const worklets = require('react-native-worklets-core');
    const resizePlugin = require('vision-camera-resize-plugin');
    
    useTensorflowModel = tflite.useTensorflowModel || tflite.default?.useTensorflowModel || (() => ({ state: 'loading' }));
    useFrameProcessor = vc.useFrameProcessor || vc.default?.useFrameProcessor || (() => null);
    runOnJS = worklets.runOnJS || worklets.default?.runOnJS || ((fn: any) => fn);
    useResizePlugin = resizePlugin.useResizePlugin || resizePlugin.default?.useResizePlugin || (() => null);
  } catch(e) {
    console.log('TFLite modules require failed');
  }
}

export function useMovenet(onFrame: (kps: Keypoint[], errorMsg?: string) => void) {
  const [modelState, setModelState] = useState<'loading' | 'loaded' | 'error' | 'mock'>('loading');

  // 终极防 OOM 加载方案：
  // 我们直接将模型文件通过 require 交给 TFLite，完全不使用 Expo 的 Asset.downloadAsync 去进行内存复制。
  // fast-tflite 的底层会自动通过 AAssetManager 以 zero-copy (零拷贝) 的形式读取这个 9MB 的模型。
  let modelSource = null;
  if (Platform.OS !== 'web') {
    modelSource = require('../../../assets/models/movenet_lightning.tflite');
  }

  const baseModel = useTensorflowModel(modelSource);

  useEffect(() => {
    if (baseModel?.state === 'loaded') {
      setModelState('loaded');
    } else if (baseModel?.state === 'error') {
      setModelState('error');
    }
  }, [baseModel?.state]);

  // 超时兜底：如果 4 秒后模型还不行，降级到 mock
  useEffect(() => {
    const timer = setTimeout(() => {
      setModelState((prev) => {
        if (prev === 'loading' || prev === 'error') return 'mock';
        return prev;
      });
    }, 4000);
    return () => clearTimeout(timer);
  }, []);
  
  const resize = typeof useResizePlugin === 'function' ? useResizePlugin() : null;

  let onFrameJS: any = null;
  if (typeof runOnJS === 'function') {
    onFrameJS = runOnJS(onFrame);
  }

  const frameProcessor = typeof useFrameProcessor === 'function' ? useFrameProcessor((frame: any) => {
    'worklet';
    
    if (modelState === 'mock') {
      if (Math.random() < 0.1 && onFrameJS) {
        const fakeKps: Keypoint[] = [];
        for (let i = 0; i < 17; i++) {
          fakeKps.push({ x: 0.5, y: 0.5, score: 0.8 }); // 简化
        }
        onFrameJS(fakeKps);
      }
      return;
    }

    if (modelState !== 'loaded' || !baseModel.model || !resize) {
      return;
    }
    
    // 【终极 OOM 防御】: 极度暴力随机丢帧！
    if (Math.random() > 0.1) {
      return;
    }
    
    try {
      const resized = resize(frame, { scale: { width: 192, height: 192 }, pixelFormat: 'rgb', dataType: 'float32' });
      const outputs = baseModel.model.runSync([resized]);
      
      const keypointsRaw = outputs[0]; 
      
      if (!keypointsRaw || keypointsRaw.length < 51) {
        return;
      }

      const kps: Keypoint[] = [];
      for (let i = 0; i < 17; i++) {
        // AI 的预测坐标 y 和 x 经常因为手机的前置摄像头默认是横向(landscape)的而相互倒置，
        // 且 MoveNet 默认输出是 [Y, X, Score]
        const y = Number(keypointsRaw[i * 3]);
        const x = Number(keypointsRaw[i * 3 + 1]);
        const score = Number(keypointsRaw[i * 3 + 2]);
        kps.push({ x, y, score });
      }

      if (onFrameJS) onFrameJS(kps);

    } catch (e: any) {
      // 静默处理，绝不阻塞
    }
  }, [baseModel, resize, modelState]) : null;

  return { 
    model: {
      ...baseModel,
      state: modelState
    }, 
    frameProcessor 
  };
}
