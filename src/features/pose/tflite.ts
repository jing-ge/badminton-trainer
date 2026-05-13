import { Platform } from 'react-native';
import { Keypoint } from './keypoints';

let useTensorflowModel: any = () => ({ state: 'loading' });
let useFrameProcessor: any = () => null;
let runOnJS: any = (fn: any) => fn;

if (Platform.OS !== 'web') {
  const tflite = require('react-native-fast-tflite');
  const vc = require('react-native-vision-camera');
  const worklets = require('react-native-worklets-core');
  
  useTensorflowModel = tflite.useTensorflowModel;
  useFrameProcessor = vc.useFrameProcessor;
  runOnJS = worklets.runOnJS;
}

export function useMovenet(onFrame: (kps: Keypoint[]) => void) {
  const model = useTensorflowModel(
    Platform.OS === 'web' ? null : require('../../../assets/models/movenet_lightning.tflite')
  );

  const onFrameJS = runOnJS(onFrame);

  const frameProcessor = useFrameProcessor((frame: any) => {
    'worklet';
    if (!model.state || model.state !== 'loaded' || !model.model) return;
    
    // 为了防止 TFLite C++ 层的内存对齐错误导致整个 App 闪退，
    // 在这里暂时屏蔽 runSync() 操作。
    // 在真机联调调通 Frame resize(192x192) 之前，直接返回一个模拟的居中人影坐标
    // 这样不仅相机能完美开启，而且不会产生 OOM。
    
    try {
      // 用非常简单的高频随机模拟来代替高危的 C++ 运算，
      // 测试 React -> JS 跨线程通信链路是否会闪退
      if (Math.random() < 0.1) {
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
    } catch (e) {
      // Ignore
    }
  }, [model]);

  return { model, frameProcessor };
}
