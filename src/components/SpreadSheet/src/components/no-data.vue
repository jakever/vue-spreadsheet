<template>
    <div>
        <img src="./images/noData.png" />
        <div :class="s.noDataText">
            <slot>搜索不到您想要的数据~换个条件试一下</slot>
        </div>
    </div>
</template>
<script>
export default {
}
</script>
<style module="s" lang="scss">
.noDataText {
    color: #80848f;
    font-size: 14px;
    margin: 8px 0 16px;
}
</style>