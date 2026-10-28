import { mount } from 'svelte';
import '@fontsource/gowun-batang/400.css';
import '@fontsource/gowun-batang/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './styles/global.scss';
import App from './App.svelte';

export default mount(App, { target: document.getElementById('app')! });
