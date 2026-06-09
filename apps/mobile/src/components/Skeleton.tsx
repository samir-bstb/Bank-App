import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type ViewStyle } from 'react-native';

interface Props {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export default function Skeleton({ width = '100%', height = 16, radius = 8, style }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 750, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const bg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E2E4E8', '#F0F1F3'],
  });

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius: radius, backgroundColor: bg },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
});
