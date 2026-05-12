import { Platform } from 'react-native';

type CameraModule = {
  Camera: any;
  useCameraDevice: (pos: 'front' | 'back') => any;
  useCameraPermission: () => { hasPermission: boolean; requestPermission: () => Promise<boolean> };
};

let mod: CameraModule;

if (Platform.OS === 'web') {
  const Stub = () => null;
  mod = {
    Camera: Stub,
    useCameraDevice: () => null,
    useCameraPermission: () => ({
      hasPermission: false,
      requestPermission: async () => false,
    }),
  };
} else {
  // 仅在原生平台 require，避免 web bundle 时执行
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mod = require('react-native-vision-camera');
}

export const Camera = mod.Camera;
export const useCameraDevice = mod.useCameraDevice;
export const useCameraPermission = mod.useCameraPermission;
