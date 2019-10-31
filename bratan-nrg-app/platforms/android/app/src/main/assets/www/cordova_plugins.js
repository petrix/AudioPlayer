cordova.define('cordova/plugin_list', function(require, exports, module) {
  module.exports = [
    {
      "id": "cordova-plugin-nativeaudio.nativeaudio",
      "file": "plugins/cordova-plugin-nativeaudio/www/nativeaudio.js",
      "pluginId": "cordova-plugin-nativeaudio",
      "clobbers": [
        "window.plugins.NativeAudio"
      ]
    }
  ];
  module.exports.metadata = {
    "cordova-plugin-nativeaudio": "3.0.9",
    "cordova-plugin-whitelist": "1.3.4"
  };
});