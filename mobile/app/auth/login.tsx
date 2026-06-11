import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { login, forgotPassword } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const setAuth = useAuthStore((s) => s.setAuth);

  function showToast(message: string) {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
    // On iOS we show it as a general message banner instead
    if (Platform.OS === 'ios') {
      setGeneralError(message);
      setTimeout(() => setGeneralError(''), 3000);
    }
  }

  function validate(): boolean {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    if (!email.trim()) {
      setEmailError('E-posta adresi zorunludur.');
      valid = false;
    }
    if (!password) {
      setPasswordError('Şifre zorunludur.');
      valid = false;
    }
    return valid;
  }

  async function handleLogin() {
    if (!validate()) return;

    setIsLoading(true);
    setGeneralError('');
    try {
      const { user, accessToken, refreshToken } = await login(email.trim(), password);
      await setAuth(user, accessToken, refreshToken);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setGeneralError('E-posta veya şifre hatalı.');
      } else if (status === 423) {
        setGeneralError('Hesap geçici olarak kilitlendi.');
      } else {
        setGeneralError('Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleForgotPassword() {
    setGeneralError('');
    if (!email.trim()) {
      setEmailError('Şifre sıfırlama için önce e-posta adresinizi girin.');
      return;
    }
    setForgotLoading(true);
    try {
      await forgotPassword(email.trim());
      showToast('Sıfırlama bağlantısı gönderildi.');
    } catch {
      setGeneralError('Sıfırlama bağlantısı gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Giriş Yap</Text>

        {/* Email */}
        <View style={styles.fieldWrapper}>
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            placeholder="E-posta"
            placeholderTextColor="#888888"
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            value={email}
            onChangeText={(t) => { setEmail(t); setEmailError(''); setGeneralError(''); }}
            accessibilityLabel="E-posta adresi"
          />
          {emailError ? <Text style={styles.fieldErrorText}>{emailError}</Text> : null}
        </View>

        {/* Password */}
        <View style={styles.fieldWrapper}>
          <TextInput
            style={[styles.input, passwordError ? styles.inputError : null]}
            placeholder="Şifre"
            placeholderTextColor="#888888"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            value={password}
            onChangeText={(t) => { setPassword(t); setPasswordError(''); setGeneralError(''); }}
            accessibilityLabel="Şifre"
          />
          {passwordError ? <Text style={styles.fieldErrorText}>{passwordError}</Text> : null}
        </View>

        {/* General error */}
        {generalError ? <Text style={styles.generalErrorText}>{generalError}</Text> : null}

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [styles.button, (isLoading || pressed) && styles.buttonPressed]}
          onPress={handleLogin}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Giriş Yap"
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Giriş Yap</Text>
          )}
        </Pressable>

        {/* Forgot password */}
        <Pressable
          style={styles.linkButton}
          onPress={handleForgotPassword}
          disabled={forgotLoading}
          accessibilityRole="button"
        >
          {forgotLoading ? (
            <ActivityIndicator color="#1DB954" size="small" />
          ) : (
            <Text style={styles.linkText}>Şifremi Unuttum</Text>
          )}
        </Pressable>

        {/* Register link */}
        <Pressable
          style={styles.linkButton}
          onPress={() => router.push('/auth/register')}
          accessibilityRole="link"
        >
          <Text style={styles.linkText}>
            Henüz hesabın yok mu?{' '}
            <Text style={styles.linkHighlight}>Kayıt ol</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 32,
  },
  fieldWrapper: {
    width: '100%',
    marginBottom: 12,
  },
  input: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  inputError: {
    borderColor: '#FF4444',
  },
  fieldErrorText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  generalErrorText: {
    color: '#FF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    width: '100%',
  },
  button: {
    width: '100%',
    backgroundColor: '#1DB954',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  linkText: {
    color: '#888888',
    fontSize: 14,
  },
  linkHighlight: {
    color: '#1DB954',
    fontWeight: '600',
  },
});
