import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  const scale   = useRef(new Animated.Value(0.4)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const textY   = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo apparaît
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
      // Texte glisse
      Animated.timing(textY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Cercles décoratifs */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      {/* Logo animé */}
      <Animated.View style={[styles.logoContainer, { transform: [{ scale }], opacity }]}>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>🗑️</Text>
        </View>
      </Animated.View>

      {/* Texte */}
      <Animated.View style={{ transform: [{ translateY: textY }], opacity }}>
        <Text style={styles.title}>CollecteMaroc</Text>
        <Text style={styles.subtitle}>ENS Marrakech — Dep. Informatique</Text>
        <Text style={styles.tagline}>Gestion de collecte des déchets</Text>
      </Animated.View>

      {/* Indicateur chargement */}
      <View style={styles.loadingDots}>
        {[0, 1, 2].map(i => (
          <LoadingDot key={i} delay={i * 200} />
        ))}
      </View>
    </View>
  );
}

function LoadingDot({ delay }) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(bounce, { toValue: -8, duration: 300, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(600),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={[styles.dot, { transform: [{ translateY: bounce }] }]} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F6E56",
    alignItems: "center",
    justifyContent: "center",
  },
  circle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255,255,255,0.04)",
    top: -80,
    right: -80,
  },
  circle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -60,
    left: -60,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
  },
  logoEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: 6,
  },
  tagline: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginTop: 3,
  },
  loadingDots: {
    flexDirection: "row",
    gap: 8,
    position: "absolute",
    bottom: 60,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
});