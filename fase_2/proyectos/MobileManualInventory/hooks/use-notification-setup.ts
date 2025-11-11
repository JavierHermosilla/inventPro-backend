import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useEffect } from 'react';
import { Platform } from 'react-native';

const isExpoGo = Constants.executionEnvironment === 'expo-go';
const isWeb = Platform.OS === 'web';
let notificationsConfigured = false;

export const useNotificationSetup = () => {
  useEffect(() => {
    if (isExpoGo || isWeb) {
      console.warn('[notifications] Skip push setup (Expo Go/web no soportado).');
      return;
    }

    let mounted = true;

    (async () => {
      const Notifications = await import('expo-notifications');

      if (!notificationsConfigured) {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldSetBadge: false,
            shouldPlaySound: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        notificationsConfigured = true;
      }

      if (!Device.isDevice) {
        console.warn('[notifications] Las notificaciones push requieren un dispositivo físico.');
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (!mounted || finalStatus !== 'granted') {
        if (finalStatus !== 'granted') {
          console.warn('[notifications] Permisos denegados por el usuario.');
        }
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('manual-inventory-alerts', {
          name: 'Manual Inventory Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);
};

export default useNotificationSetup;
