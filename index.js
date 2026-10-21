/**
 * @format
 */

import 'react-native-gesture-handler'; // MUST BE AT THE VERY TOP
import { AppRegistry } from 'react-native';
import { LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
LogBox.ignoreLogs([
  '[Reanimated] Dependencies should only be used on the web',
]);