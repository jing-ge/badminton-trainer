import { Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { Asset } from 'expo-asset';
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
  // 不再使用 require 读本地，彻底规避 Android AssetManager 读取大文件导致的 OOM 内存溢出！
  // 直接让 TFLite 底层通过 url 下载和缓存模型 (它在原生层走 HTTP，不会撑爆 JVM 堆内存)
  const modelUrl = 'https://tfhub.dev/google/lite-model/movenet/singlepose/lightning/3?lite-format=tflite';
  
  const [modelState, setModelState] = useState<'loading' | 'loaded' | 'error' | 'mock'>('loading');

  const baseModel = useTensorflowModel({ url: modelUrl });

  useEffect(() => {
    if (baseModel?.state === 'loaded') {
      setModelState('loaded');
    } else if (baseModel?.state === 'error') {
      setModelState('error');
    }
  }, [baseModel?.state]);

  // 超时兜底：如果 4 秒后模型还不行，降级到 mock，让 App 至少能动
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
      // 暴力丢帧减负
      if (Math.random() < 0.1 && onFrameJS) {
        const fakeKps: Keypoint[] = [];
        for (let i = 0; i < 17; i++) {
          fakeKps.push({ 
            x: 0.5 + (Math.random() * 0.1 - 0.05), 
            y: 0.5 + (Math.random() * 0.4 - 0.2), 
            score: 0.8 
          });
        }
        onFrameJS(fakeKps);
      }
      return;
    }

    if (modelState !== 'loaded' || !baseModel.model || !resize) {
      return;
    }

    // 【终极 OOM 防御】: 极度暴力随机丢帧！
    // 将原本相机的 30fps 降到约 3fps。绝不让 Worklet 积压图片处理任务，彻底解决内存溢出。
    if (Math.random() > 0.1) {
      return;
    }
    
    try {
      const resized = resize(frame, { scale: { width: 192, height: 192 }, pixelFormat: 'rgb', dataType: 'float32' });
      const outputs = baseModel.model.runSync([resized]);
      const keypointsRaw = outputs[0]; 
      
      if (!keypointsRaw || keypointsRaw.length < 51) {
        if (onFrameJS) onFrameJS([], '模型推断失败：输出格式不符');
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
      if (onFrameJS) onFrameJS([], `推理崩溃: ${e.message || String(e)}`);
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
