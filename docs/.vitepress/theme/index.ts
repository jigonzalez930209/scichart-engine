import DefaultTheme from 'vitepress/theme'
import ChartDemo from './ChartDemo.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ChartDemo', ChartDemo)
  }
}
