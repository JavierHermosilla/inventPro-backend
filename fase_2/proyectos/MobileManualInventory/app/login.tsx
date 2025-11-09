import { Image } from 'expo-image';
import { Link, Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/auth';

export default function LoginScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const login = useAuthStore((state) => state.login);
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const resetError = useAuthStore((state) => state.resetError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user) {
    return <Redirect href="/" />;
  }

  const handleLogin = async () => {
    try {
      resetError();
      await login(email.trim(), password);
      router.replace('/');
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes('exclusiva')) {
        Alert.alert('Acceso restringido', err.message);
        return;
      }
      Alert.alert('Inicio de sesión', 'No pudimos validar tus credenciales.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: palette.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Image
          source={require('@/assets/images/logo-invent-pro.png')}
          style={styles.logo}
          contentFit="contain"
          accessibilityRole="image"
        />
        <Text style={styles.title}>InventPro · Manual Inventory</Text>
        <Text style={styles.subtitle}>
          Aplicación móvil orientada a Bodega. Solo Administradores y Bodegueros pueden ingresar.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Correo corporativo</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            placeholder="bodega@inventpro.com"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            secureTextEntry
            style={styles.input}
            placeholder="********"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Text style={styles.accessNote}>Roles permitidos: Administrador y Bodeguero.</Text>

        <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Ingresando...' : 'Ingresar'}</Text>
        </Pressable>

        <Text style={styles.helper}>
          ¿Necesitas acceso?{' '}
          <Link href="mailto:soporte@inventpro.com" style={styles.link}>
            Contáctanos
          </Link>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    gap: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  logo: {
    width: 150,
    height: 70,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#475467',
    textAlign: 'center',
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    color: '#475467',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0EA5E9',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  helper: {
    textAlign: 'center',
    color: '#6B7280',
  },
  link: {
    color: '#0EA5E9',
    fontWeight: '600',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  accessNote: {
    textAlign: 'center',
    color: '#0F172A',
    fontWeight: '600',
  },
});
