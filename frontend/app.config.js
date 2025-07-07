module.exports = {
  expo: {
    name: "Guard Study",
    slug: "flash-card",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    extra: {
      "eas": {
        "projectId": "71d27c6f-ba57-472d-b79c-860444b92770"
      }
    },
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.flashcard.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.flashcard.app"
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    scheme: "flashcard-app",
    sdkVersion: "53.0.0"
  }
}; 