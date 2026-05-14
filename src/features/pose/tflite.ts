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
  const [modelUri, setModelUri] = useState<string | null>(null);
  const [modelState, setModelState] = useState<'loading' | 'loaded' | 'error' | 'mock'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);

  // 用 expo-asset 把本地模型从 APK 中提取到设备文件系统，使用 file:// 协议传给 TFLite
  // 由于我们启用了 android:largeHeap="true"，App 现在拥有最高 512MB 的堆内存可以做这一步
  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      try {
        const asset = Asset.fromModule(require('../../../assets/models/movenet_lightning.tflite'));
        await asset.downloadAsync();
        let uri = asset.localUri || asset.uri;
        if (uri) {
          // 修补 file:// 协议头，防止 TFLite 底层 MalformedURLException
          if (uri.startsWith('/') || uri.startsWith('assets_')) {
            uri = `file://${uri.startsWith('/') ? '' : '/'}${uri}`;
          }
          setModelUri(uri);
        } else {
          setLoadError('无法获取模型本地路径');
        }
      } catch (err: any) {
        setLoadError(`模型读取失败: ${err.message || String(err)}`);
      }
    })();
  }, []);

  const baseModel = useTensorflowModel(modelUri ? { url: modelUri } : null);

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
          fakeKps.push({ x: 0.5, y: 0.5, score: 0.8 });
        }
        onFrameJS(fakeKps);
      }
      return;
    }

    if (modelState !== 'loaded' || !baseModel.model || !resize) {
      return;
    }
    
    // 【终极 OOM 防御】: 极度暴力随机丢帧！(30fps -> 3fps)
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
        kps.push({ 
          x: Number(keypointsRaw[i * 3 + 1]), 
          y: Number(keypointsRaw[i * 3]), 
          score: Number(keypointsRaw[i * 3 + 2]) 
        });
      }

      if (onFrameJS) onFrameJS(kps);

    } catch (e: any) {
      // 静默处理，绝不阻塞
    }
  }, [baseModel, resize, modelState]) : null;

  return { 
    model: {
      ...baseModel,
      state: modelState,
      error: baseModel.error || (loadError ? new Error(loadError) : undefined)
    }, 
    frameProcessor 
  };
}
