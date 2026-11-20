const fs = require('fs');

module.exports = ({ config }) => {
  const googleServices =
    process.env.GOOGLE_SERVICES_JSON ||
    (fs.existsSync('./google-services.json')
      ? './google-services.json'
      : undefined);

  const plugins = (config.plugins ?? []).filter((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;

    return name !== 'expo-location' &&
           name !== 'react-native-maps';
  });

  return {
    ...config,

    plugins: [
      ...plugins,
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'TapIn membutuhkan lokasi untuk memverifikasi kehadiran di laboratorium.',
        },
      ],
      [
        'react-native-maps',
        {
          androidGoogleMapsApiKey:
            process.env.GOOGLE_MAPS_API_KEY,
        },
      ],
    ],

    android: {
      ...config.android,
      ...(googleServices ? { googleServicesFile: googleServices } : {}),
    },
  };
};