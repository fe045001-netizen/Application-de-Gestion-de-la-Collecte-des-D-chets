// App.jsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useEffect, useState } from "react";

import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import MyRouteScreen from "./src/screens/MyRouteScreen";
import PointDetailScreen from "./src/screens/PointDetailScreen";
import SplashScreen from "./src/screens/SplashScreen";

const Stack = createStackNavigator();

export default function App() {
  const [ready, setReady] = useState(false);
  const [user,  setUser]  = useState(null);

  useEffect(() => {
    // Vérifier si déjà connecté
    const check = async () => {
      const saved = await AsyncStorage.getItem("user");
      if (saved) setUser(JSON.parse(saved));
      setTimeout(() => setReady(true), 2500); // durée splash
    };
    check();
  }, []);

  if (!ready) return <SplashScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login">
            {props => <LoginScreen {...props} onLogin={u => setUser(u)} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Home">
              {props => <HomeScreen {...props} user={user} onLogout={() => setUser(null)} />}
            </Stack.Screen>
            <Stack.Screen name="MyRoute"       component={MyRouteScreen} />
            <Stack.Screen name="PointDetail"   component={PointDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}