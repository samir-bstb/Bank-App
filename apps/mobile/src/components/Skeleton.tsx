import { useEffect, useRef } from 'react';
import { Animated, type ViewStyle } from 'react-native';

interface Props {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  light?: boolean; // for use on dark backgrounds
  style?: ViewStyle;
}

export default function Skeleton({ width = '100%', height = 16, radius = 8, light = false, style }: Props) {
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
    outputRange: light
      ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.28)']
      : ['#E2E4E8', '#F0F1F3'],
  });

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: bg, overflow: 'hidden' }, style]}
    />
  );
}
