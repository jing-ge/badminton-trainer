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
    Platform.OS === 'web' ? null : require('@/../assets/models/movenet_lightning.tflite')
  );

  const onFrameJS = runOnJS(onFrame);

  const frameProcessor = useFrameProcessor((frame: any) => {
    'worklet';
    if (!model.state || model.state !== 'loaded' || !model.model) return;
    
    try {
      // 执行推断
      const outputs = model.model.runSync([frame]);
      const keypointsRaw = outputs[0]; 
      
      if (!keypointsRaw || keypointsRaw.length < 51) return;

      const kps: Keypoint[] = [];
      for (let i = 0; i < 17; i++) {
        const y = Number(keypointsRaw[i * 3]);
        const x = Number(keypointsRaw[i * 3 + 1]);
        const score = Number(keypointsRaw[i * 3 + 2]);
        kps.push({ x, y, score });
      }

      onFrameJS(kps);
    } catch (e) {
      // 忽略推断错误以免阻塞相机线程
    }
  }, [model]);

  return { model, frameProcessor };
}
