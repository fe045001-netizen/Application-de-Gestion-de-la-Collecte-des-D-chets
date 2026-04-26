import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function IndexScreen() {
  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    try {
      const token = await AsyncStorage.getItem('token');
      const user  = await AsyncStorage.getItem('user');
      if (token && user) router.replace('/home');
      else router.replace('/login');
    } catch {
      router.replace('/login');
    }
  }

  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#0F6E56' }}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}