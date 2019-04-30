<template>
  <div>
    <home-page></home-page>
  </div>
</template>
<script>
import homePage from './components/index.vue'
export default {
  name: 'App',
  components: { homePage } 
}
</script>
<style>
@import '../static/style/base.scss'
</style>
