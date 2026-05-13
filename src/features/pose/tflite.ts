import { Platform } from 'react-native';
import { Keypoint, KP } from './keypoints';

let useTensorflowModel: any = () => null;
let useFrameProcessor: any = () => null;

if (Platform.OS !== 'web') {
  const tflite = require('react-native-fast-tflite');
  const vc = require('react-native-vision-camera');
  useTensorflowModel = tflite.useTensorflowModel;
  useFrameProcessor = vc.useFrameProcessor;
}

export function useMovenet(onFrame: (kps: Keypoint[]) => void) {
  const model = useTensorflowModel(
    Platform.OS === 'web' ? null : require('@/../assets/models/movenet_lightning.tflite')
  );

  const frameProcessor = useFrameProcessor((frame: any) => {
    'worklet';
    if (!model.state || model.state !== 'loaded' || !model.model) return;
    try {
    } catch (e) {}
  }, [model]);

  return { model, frameProcessor };
}