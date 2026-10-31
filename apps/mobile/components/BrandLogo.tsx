import { Image, StyleSheet, View } from 'react-native';

// The official BeingU logo, shown exactly as supplied. The image is never stretched, cropped or recoloured.
// resizeMode "contain" keeps its original proportions inside whatever square size we give it.
const logo = require('../assets/brand/beingu-logo-original.png');

type Props = { size?: number };

export function BrandLogo({ size = 220 }: Props) {
  return (
    <View style={{ width: size, height: size }} accessibilityRole="image" accessibilityLabel="BeingU logo">
      <Image source={logo} style={styles.image} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
});
