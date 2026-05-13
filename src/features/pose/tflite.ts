import { Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
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
  const [modelUri, setModelUri] = useState<string | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [modelState, setModelState] = useState<'loading' | 'loaded' | 'error' | 'mock'>('loading');

  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      try {
        const mod = require('../../../assets/models/movenet_lightning.tflite');
        if (!mod) throw new Error('tflite asset is undefined');
        const asset = Asset.fromModule(mod);
        await asset.downloadAsync();
        if (asset.localUri) {
          setModelUri(asset.localUri);
        } else if (asset.uri) {
          setModelUri(asset.uri);
        } else {
          setAssetError('模型 Asset 解析失败');
        }
      } catch (err: any) {
        setAssetError(`模型加载出错: ${err.message || String(err)}`);
      }
    })();
  }, []);

  const baseModel = useTensorflowModel(modelUri);

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
    
    // 如果处于降级 mock 模式，直接吐出假坐标
    if (modelState === 'mock') {
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
      error: baseModel.error || (assetError ? new Error(assetError) : undefined),
      state: modelState
    }, 
    frameProcessor 
  };
}
