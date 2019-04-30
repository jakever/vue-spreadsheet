<template>
    <div :class="{[s.dropdown]: true, [s.active]: store.dropdownKey}" :style="dropdownSty" v-clickoutside="handleClickoutside">
        <div :class="s.sort">
            <a :class="{[s.active]: dropdownConfig.sort === 'asce'}" @click="sort('asce')"><Icon type="asce"></Icon>升序</a>
            <a :class="{[s.active]: dropdownConfig.sort === 'desc'}" @click="sort('desc')"><Icon type="desc"></Icon>降序</a>
        </div>
        <div :class="s.filter">
            <div :class="s.filter_list">
                <div :class="s.item" v-for="(item, key) in dropdownConfig.data" :key="key">
                    <el-checkbox v-model="item.checked"></el-checkbox>
                    <span>{{key}}</span>
                </div>
            </div>
            <div :class="s.btns">
                <el-button type="text" :disabled="isDisabled()" @click="doFilter">筛选</el-button>
                <el-button type="text" @click="resetFilter">重置</el-button>
            </div>
        </div>
    </div>
</template>
<script>
import Clickoutside from '../utils/clickoutside'
export default {
    name: 'ExcelDropdown',
    inject: ['store'],
    directives: { Clickoutside },
    data() {
        return {
            left: 0
        }
    },
    computed: {
        dropdownConfig() {
            return this.store.dropdownConfig
        },
        dropdownSty() {
            if (this.store.dropdownIndex) {
                if (this.store.sheetConfig.fixedColumnsLeft > this.store.dropdownIndex) {
                    this.left = this.store.everyColumnsTotal[this.store.dropdownIndex - 1]
                } else {
                    this.left = this.store.everyColumnsTotal[this.store.dropdownIndex - 1] - this.$parent.tableScrollLeft
                }
            }
            return {
                top: `${this.store.sheetConfig.headerHeight + 1}px`,
                left: this.left + 'px'
            }
        }
    },
    methods: {
        isDisabled() {
            let hasChecked = false
            for (const key in this.dropdownConfig.data) {
                if (this.dropdownConfig.data[key].checked) {
                    hasChecked = true
                }
            }
            if (!hasChecked) {
                return true
            }
            return false
        },
        sort(type) {
            this.store.sort(type)
        },
        doFilter() {
            this.store.handFilter()
        },
        resetFilter() {
            this.store.resetFilter()
        },
        handleClickoutside() {
            this.store.handleDropdown()
        }
    }
}
</script>
<style module="s" lang="scss">
.dropdown {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 999;
    min-width: 110px;
    transform: rotateX(90deg);
    transform-origin: top center;
    transition: transform 0.3s;
    border: 1px solid #ebeef5;
    border-radius: 2px;
    background-color: #fff;
    box-shadow: 0 0 20px 1px rgba(0, 0, 0, 0.2);
    padding: 8px;
    overflow-y: auto;
    overflow-x: hidden;

    &.active {
        transform: rotateX(0);
    }
}

.sort {
    display: flex;
    font-size: 13px;
    margin-bottom: 4px;

    > a {
        display: flex;
        align-items: center;
        cursor: pointer;
        padding: 4px 8px;
        transition: all 0.3s;
        color: #80848f;

        &.active {
            background-color: #c5e1ba;
        }

        &:hover {
            background-color: #cfc;
        }

        > svg {
            color: #80848f;
            margin-right: 4px;
        }
    }
}

.filter {
    border: 1px solid #e1e6eb;
    padding: 5px;
}

.filter_list {
    max-height: 150px;
    overflow-x: hidden;
    overflow-y: auto;
}

.item {
    margin: 4px 0;
    font-size: 12px;
}

.btns {
    padding-top: 5px;
    border-top: 1px solid #e1e6eb;

    button {
        font-size: 13px;
        padding: 0;
    }
}
</style>
