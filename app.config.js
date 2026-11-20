const fs = require('fs');

module.exports = ({ config }) => {
  const googleServices =
    process.env.GOOGLE_SERVICES_JSON ||
    (fs.existsSync('./google-services.json')
      ? './google-services.json'
      : undefined);

  return {
    ...config,
    android: {
      ...config.android,
      ...(googleServices ? { googleServicesFile: googleServices } : {}),
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
  };
};