import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldSetBadge: false,
    shouldPlaySound: true,
  }),
});

export const useNotificationSetup = () => {
  useEffect(() => {
    (async () => {
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

      if (finalStatus !== 'granted') {
        console.warn('[notifications] Permisos denegados por el usuario.');
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
  }, []);
};

export default useNotificationSetup;
