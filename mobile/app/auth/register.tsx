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
  View,
} from 'react-native';
import { router } from 'expo-router';
import { register } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';

function validateEmail(email: string): string {
  if (!email.trim()) return 'E-posta adresi zorunludur.';
  if (!email.includes('@') || !email.includes('.')) return 'Geçerli bir e-posta adresi girin.';
  return '';
}

function validatePassword(password: string): string {
  if (!password) return 'Şifre zorunludur.';
  if (password.length < 8) return 'Şifre en az 8 karakter olmalıdır.';
  if (!/[A-Z]/.test(password)) return 'Şifre en az bir büyük harf içermelidir.';
  if (!/[0-9]/.test(password)) return 'Şifre en az bir rakam içermelidir.';
  return '';
}

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const setAuth = useAuthStore((s) => s.setAuth);

  function validate(): boolean {
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    setGeneralError('');
    return !eErr && !pErr;
  }

  async function handleRegister() {
    if (!validate()) return;

    setIsLoading(true);
    setGeneralError('');
    try {
      const { user, accessToken, refreshToken } = await register(email.trim(), password);
      await setAuth(user, accessToken, refreshToken);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setEmailError('Bu e-posta adresi zaten kullanılıyor.');
      } else {
        setGeneralError('Kayıt işlemi başarısız oldu. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsLoading(false);
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
        <Text style={styles.title}>Kayıt Ol</Text>

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
            onChangeText={(t) => {
              setEmail(t);
              if (emailError) setEmailError(validateEmail(t));
              setGeneralError('');
            }}
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
            onSubmitEditing={handleRegister}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (passwordError) setPasswordError(validatePassword(t));
              setGeneralError('');
            }}
            accessibilityLabel="Şifre"
          />
          {passwordError ? <Text style={styles.fieldErrorText}>{passwordError}</Text> : null}
          <Text style={styles.hint}>
            En az 8 karakter, 1 büyük harf ve 1 rakam içermelidir.
          </Text>
        </View>

        {/* General error */}
        {generalError ? <Text style={styles.generalErrorText}>{generalError}</Text> : null}

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [styles.button, (isLoading || pressed) && styles.buttonPressed]}
          onPress={handleRegister}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Kayıt Ol"
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Kayıt Ol</Text>
          )}
        </Pressable>

        {/* Login link */}
        <Pressable
          style={styles.linkButton}
          onPress={() => router.push('/auth/login')}
          accessibilityRole="link"
        >
          <Text style={styles.linkText}>
            Zaten hesabın var mı?{' '}
            <Text style={styles.linkHighlight}>Giriş yap</Text>
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
  hint: {
    color: '#666666',
    fontSize: 11,
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
