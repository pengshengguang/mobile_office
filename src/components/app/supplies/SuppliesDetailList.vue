<template>
  <div class="supplies-detail-list-wrapper cover">
    <x-header class="whiteBgHeader" :left-options="{backText:'', preventGoBack: true}" @on-click-back="goBack">办公用品<div class="add" slot="right" @click="toSuppliesView"></div></x-header>
    <div class="tabBoxOuter" ref="tabBoxOuter" style="width: 100%;overflow:scroll;-webkit-overflow-scrolling:touch;">
      <tab ref="tabBox" style="background-color: #f2f4f5;font-size: 14px" bar-active-color="#149c81" :line-width="4"
           :custom-bar-width="getBarWidth" :style="{width: tabWidth + 'px'}">
        <tab-item v-for="(item,index) in smallClassList" :key="index" @on-item-click="onItemClick(item.smallClass, index, item.smallClassCode)">{{item.smallClass}}
        </tab-item>
      </tab>
    </div>
    <div class="list-box" style="padding-bottom: 100px">
      <div class="item-wrapper" v-for="item in suppliesList">
        <supplies-product-Item :item="item" :isShopping="isShopping"></supplies-product-Item>
      </div>
      <div class="loading-icon" style="text-align: center" v-infinite-scroll="loadMore" infinite-scroll-disabled="busy" infinite-scroll-distance="10">
        <spinner type='lines' v-show="loading"></spinner>
      </div>
    </div>
    <div class="btn-box">
      <div class="text" @click="showCart">选择{{suppliesCart.length}}个品类/共{{count}}件</div>
      <div class="confirm" @click="confirm">确认</div>
    </div>
    <!--底部弹出div-->
    <div class="myPopup" v-if="showPop">
      <div class="mask" @click="closePop"></div>
      <div class="popupContent">
        <!--购物车列表详情-->
        <div class="cartContent" v-for="item in suppliesCart">
          <supplies-product-Item :item="item" :isShopping="isShopping" :bottomCart="true"></supplies-product-Item>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { Tab, TabItem, XButton, XHeader, Spinner } from 'vux'
  import SuppliesProductItem from './assembly/SuppliesProductItem.vue'
  import Httpservice from '@/services/HttpService'

  export default {
    components: {
      Tab,
      TabItem,
      XButton,
      XHeader,
      SuppliesProductItem,
      Spinner
    },
    data () {
      return {
        http: Httpservice.getAxios,
        // tab标签div长度
        tabWidth: document.body.clientWidth,
        showPop: false,
        smallClassList: [], // 二级目录列表
        smallClassIndex: '0', // 点击的二级目录下标
        smallClassCode: '', // 点击的二级目录代码
        suppliesList: null, // 办公用品列表
        page: 1,
        pageSize: 8,
        busy: true,
        loading: false,
        suppliesCart: [], // 购物车
        count: 0 // 购物车物品数量
      }
    },
    mounted () {
      this.init()
    },
    methods: {
      // 初始化
      init () {
        this.setTabWidth()
        this.getSuppliesStore()
        setTimeout(() => {
          this.clickTabItemById(this.smallClassIndex)
        }, 20)
        this.totalCount()
      },
      // 获取初始状态信息
      getSuppliesStore () {
        // 从store状态读数据
        this.smallClassList = this.$store.state.supplies.smallClassList // 一级index
        this.smallClassIndex = this.$store.state.supplies.smallClassIndex // 二级index
        this.suppliesCart = this.$store.state.supplies.suppliesCart // 购物车列表
        this.smallClassCode = this.smallClassList[this.smallClassIndex].smallClassCode // 二级code
      },
      // 根据二级smallClassCode获取办公用品list
      getSuppliesList (smallClassCode, flag) {  // flag为true，证明第二次加载数据
        this.smallClassCode = smallClassCode
        let param = {
          smallClassCode: smallClassCode,
          page: this.page,
          pageSize: this.pageSize
        }
        this.loading = true
        this.http.get('/supplies/getSuppliesList', {params: param}).then(response => { // axios 传参，前平面一定要加params套进去，不然是不对的
          this.loading = false
          if (response.status === 200) {
            let res = response.data
            if (res.status === '0') {
              if (flag) { // 第二次加载数据
                let newList = this.addAttribute(res.result.list)
                newList = this.assemblyToolListData(newList)
                this.suppliesList = this.suppliesList.concat(newList)
                if (res.result.count === 0) {
                  this.busy = true
                  this.$vux.toast.show({
                    text: '没有更多',
                    time: 600
                  })
                } else {
                  this.busy = false
                }
              } else { // 第一次加载数据
                let newList = this.addAttribute(res.result.list)
                newList = this.assemblyToolListData(newList)
                this.suppliesList = newList // 办公用品列表
                this.busy = false
                if (res.result.count === 0) {
                  this.$vux.toast.show({
                    text: '没有更多',
                    time: 1000
                  })
                  this.busy = true
                }
              }
            } else {
              this.$vux.toast.show({ text: '请求失败', type: 'text' })
            }
          } else {
            this.$vux.toast.show({ text: '接口异常', type: 'text' })
          }
        })
      },
      // 加载更多
      loadMore () {
        this.busy = true
        setTimeout(() => {
          this.page++
          this.getSuppliesList(this.smallClassCode, true)
        }, 500)
      },
      // 检查加载办公用品是否存在于购物车中，是的话就把购物车对应的物品赋值给其中
      assemblyToolListData (newList) {
        for (let i = 0; i < newList.length; i++) {
          for (let j = 0; j < this.suppliesCart.length; j++) {
            // 在相同id下，如果newList中的办公用品中与购物车的办公用品不相等，就将newList中的商品改动为购物车中的对应商品
            if (newList[i].code === this.suppliesCart[j].code && newList[i] !== this.suppliesCart[j]) {
              newList[i] = this.suppliesCart[j]
            }
          }
        }
        return newList
      },
      // 为数据库中查询出来的办公用品添加数量字段
      addAttribute (list) {
        list.forEach(item => {
          item.quantity = 1
        })
        return list
      },
      // 办公用品处理
      isShopping (item, shoppingType) {
        // 获取下标
        let listNumber = this.suppliesCart.indexOf(item)
        // 添加清单操作
        if (shoppingType === 'add') {
          listNumber !== -1 ? this.suppliesCart[listNumber] = item : this.suppliesCart.push(item)
        }
        // 删除清单操作
        if (shoppingType === 'remove' && listNumber !== -1) {
          this.suppliesCart.splice(listNumber, 1)
        }
        this.totalCount()
      },
      // 计算总数
      totalCount () {
        let count = 0
        this.suppliesCart.forEach((item) => {
          count += parseInt(item.quantity, 10)
        })
        this.count = count
      },
      // 确认事件
      confirm () {
        // 把suppliesCart提交至状态
        this.$store.commit('setSuppliesCart', this.suppliesCart)
        // 把suppliesCart提交至数据库
        let userConfig = {
          suppliesCart: this.suppliesCart
        }
        this.http.post('/supplies/saveSuppliesCart', userConfig).then((response) => {
          if (response.status === 200) {
            let res = response.data
            if (res.status === '0') {
              this.$router.push({
                name: 'SuppliesConfirm'
              })
            } else {
              this.$vux.toast.show({ text: '数据保存失败', type: 'text' })
            }
          } else {
            this.$vux.toast.show({ text: '接口异常', type: 'text' })
          }
        })
      },
      /* ------------------------------------------------------------------------ */
      goBack () {
        this.$store.commit('setSuppliesCart', this.suppliesCart)
        this.$router.back(-1)
      },
      toSuppliesView () {
        this.$router.push({
          name: 'Supplies'
        })
      },
      // 选中tab-item居中显示
      clickTabItemById (index) {
        // 模拟点击事件
        this.$refs.tabBox.$children[index].onItemClick()
        // 滑动到对应的点击标签页
        // 这里值得注意的是，为什么tabBoxOut的宽度明明只有屏幕的宽度，而里面的tabBox是超过屏幕的宽度的，所有才
        // 可以滑动，滑动的是tabBox这个div，而真正滑动的事件却是绑定在tabBoxOut这个div当中。所以，当你使用scrollLeft
        // 这个属性的时候，是要用在tabBoxOut这个div上，而不是在tabBox这个div上。
        // ----------------------------------------------------------------
        // 接下来可以运用offsetLeft计算tab-item在父div tabBox横轴偏移量、scrollLeft滑动到对应的tab-item，然后运用数学公式来把激活的tab-item滚动到tabBoxOuter这个div
        // 的中心
        let tabConter = (document.body.clientWidth - this.$refs.tabBox.$children[index].$el.offsetWidth) / 2
        this.$refs.tabBoxOuter.scrollLeft = this.$refs.tabBox.$children[index].$el.offsetLeft - tabConter
      },
      // 底部bar精准跟随，点击tab-item触发事件
      onItemClick (keyword, index, smallClassCode) {
        let barLeft = 0
//        document.getElementsByClassName('vux-tab-ink-bar')[0].style.right = '100%'
        document.getElementsByClassName('vux-tab-ink-bar')[0].style.display = 'none'
        for (let i = 0; i < this.smallClassList.length;) {
          if (document.getElementsByClassName('vux-tab-item')[i].innerText === keyword) {
//            console.log('document.getElementsByClassName(\'vux-tab-item\')[' + index + '].offsetWidth = ' + document.getElementsByClassName('vux-tab-item')[i].offsetWidth)
            barLeft += document.getElementsByClassName('vux-tab-item')[i].offsetWidth / 2
            barLeft -= 22.5
            break
          }
          barLeft += document.getElementsByClassName('vux-tab-item')[i].offsetWidth
          i += 1
        }
        document.getElementsByClassName('vux-tab-ink-bar')[0].style.left = (barLeft + 'px')
        // 根据二级类别code查suppliesList
        if (smallClassCode) {
          // 清空分页数据
          this.page = 1 // 每一次点击tab-item，都需要初始化页码
          this.getSuppliesList(smallClassCode)
        }
      },
      // 函数控制tab-bar的宽度,如果tab标签页数量为1，则隐藏tab-bar
      getBarWidth () {
        if (this.list && this.list.length === 1) {
          return '0px'
        }
        return '45px'
      },
      // 控制可滑动的tab的宽度
      setTabWidth () {
        // 页面完成刷新之后
        this.$nextTick(() => {
          let ofwidth = 0
          let efwidth = 0
          // efwidth为每一个tab-item的长度总和,因为tab-item的父级为flex布局,而tab-item的flex: none，所以初始化的时候，tab-item会根据自己的字体长度，自动扩张宽度。
          for (let i = 0; i < this.$refs.tabBox.$children.length;) {
            efwidth += this.$refs.tabBox.$children[i].$el.offsetWidth
            i += 1
          }
          // 同样是计算初始化的时候，每一个tab-item的总宽度，但当tab-item总长度大于tab的总长度时，立马退出程序
          for (let i = 0; i < this.$refs.tabBox.$children.length;) {
            ofwidth += this.$refs.tabBox.$children[i].$el.offsetWidth
            if (ofwidth > (document.body.clientWidth)) {
              break
            }
            i += 1
          }
          // 假如tab-item的总宽度小于显示tabwidth，则评分tab的剩余空间，加到每一个tab-item中
          if (ofwidth < (document.body.clientWidth)) {
            for (let i = 0; i < this.$refs.tabBox.$children.length;) {
              this.$refs.tabBox.$children[i].$el.style.width = (this.$refs.tabBox.$children[i].$el.clientWidth + (((document.body.clientWidth) - ofwidth) / this.$refs.tabBox.$children.length)) + 'px'
//              console.log(((((document.body.clientWidth) - ofwidth) / this.$refs.tabBox.$children.length)) + 'px')
              i += 1
            }
            this.tabWidth = (document.body.clientWidth)
          } else {
            this.tabWidth = efwidth
          }
        }, 1000)
      },
      showCart () {
        this.showPop = !this.showPop
      },
      closePop () {
        this.showPop = false
      }
    }
  }
</script>
<style lang="scss">
  .supplies-detail-list-wrapper{
    display: flex;
    flex-direction: column;
    .whiteBgHeader{
      flex: none;
      .add{
        width: 22px;
        height: 22px;
        display: inline-block;
        background: url("./../../../assets/img/supplies/icon-application.png") no-repeat;
        background-size: 100% 100%;
      }
    }
    .tabBoxOuter{
      flex: none;
    }
    .list-box{
      flex: auto;
      overflow: auto;
      .item-wrapper{
        overflow: auto;
      }
      .loading-icon{
        .vux-spinner{
          stroke: #149c81;
          height: 50px;
          width: 50px;
          svg{
            height: 50px;
            width: 50px;
          }
        }
      }
    }
    .btn-box{
      border-top: 1px solid #ebebeb;
      position: fixed;
      z-index: 1001;
      bottom: 0;
      height: 44px;
      width: 100%;
      display: flex;
      justify-content: flex-end;
      background-color: #ffffff;
      .text{
        flex: 0 0 70%;
        display: flex;
        align-items: center;
        font-size: 16px;
        padding-left: 10px;
        &:after{
          content: '';
          display: inline-block;
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 8px solid #c5c5c5;
        }
      }
      .confirm{
        font-size: 18px;
        color: #ffffff;
        flex: 0 0 30%;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #149c81;
      }
    }
    .myPopup{
      .mask {
        top: 0;
        bottom: 150px;
        z-index: 1000;
        position: fixed;
        height: 100%;
        width: 100%;
        background-color: rgba(6, 6, 6, 0.45);
      }
      .popupContent{
        width: 100%;
        max-height: 70%;
        background-color: #fff;
        overflow-y: scroll;
        overflow-x: hidden;
        position: fixed;
        bottom: 0;
        z-index: 1001;
        margin-bottom: 44px;
      }
    }

  }
</style>
<!--此style用来设置组件去除横向滚动条显示-->
<style scoped>
  /*定义滚动条高宽及背景 高宽分别对应横竖滚动条的尺寸,在这里设置滚动条宽度为0px*/
  ::-webkit-scrollbar {
    width: 0px;
    display: none;
    background-color: #fff;
  }

  /*定义滚动条轨道 内阴影+圆角*/
  ::-webkit-scrollbar-track {
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    background-color: #fff;
  }

  /*定义滑块 内阴影+圆角*/
  ::-webkit-scrollbar-thumb {
    border-radius: 10px;
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, .3);
    background-color: #fff;
  }
</style>
<!--此style用来设置vux组件的部分样式调整-->
<style>
  .supplies-detail-list-wrapper .vux-tab-bar-inner {
    border-radius: 10px !important;
  }

  /*改变原来tabBox的flex布局*/
  .supplies-detail-list-wrapper .vux-tab .vux-tab-item {
    display: inline-block;
    width: auto;
    height: 100%;
    padding: 0 10px;
    flex: none;
    background-color: #f2f4f5;
  }

  /*定义tab-item选中时的样式*/
  .supplies-detail-list-wrapper .vux-tab .vux-tab-item.vux-tab-selected {
    font-size: 16px;
    color: #149c81;
    border-bottom: 3px solid #04BE02;
  }
</style>
