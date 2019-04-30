import SpreadSheet from './index';

const install = (Vue) => {
    Vue.component(SpreadSheet.name, SpreadSheet);
};

/* 支持使用标签的方式引入 */
if (typeof window !== 'undefined' && window.Vue) {
    install(window.Vue);
}

export {
    install,
    SpreadSheet
}

export default SpreadSheet