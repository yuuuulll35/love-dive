import { mount } from 'svelte';
import '@fontsource/jua/400.css';
import '@fontsource/gowun-dodum/400.css';
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './styles/global.scss';
import App from './App.svelte';

export default mount(App, { target: document.getElementById('app')! });
