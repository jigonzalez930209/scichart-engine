import DefaultTheme from 'vitepress/theme'
import ChartDemo from './ChartDemo.vue'
import TenMillionPoints from './TenMillionPoints.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }: { app: any }) {
    app.component('ChartDemo', ChartDemo)
    app.component('TenMillionPoints', TenMillionPoints)
  }
}
