<template>
  <div>
    <div class="questionnaire-result-home-wrapper cover">
      <x-header class="whiteBgHeader" :left-options="{backText:'', preventGoBack: true}" @on-click-back="goBack">统计分析</x-header>
      <div class="main-box">
        <div class="list-wrapper" v-for="questionnaire in questionnaireList">
          <personal-item :questionnaire="questionnaire" :tabnum="2"></personal-item>
        </div>
        <div class="loading-icon" style="text-align: center" v-infinite-scroll="loadMore" infinite-scroll-disabled="busy" infinite-scroll-distance="10">
          <spinner type='lines' v-show="loading"></spinner>
        </div>
        <div class="empty-tips-wrapper" v-if="questionnaireList.length === 0">
          <div class="empty-tips-box">
            <div class="line-1">你好，暂无统计</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { XHeader, Spinner } from 'vux'
  import HttpService from '@/services/HttpService'
  import PersonalItem from './assembly/PersonalItem.vue'

  export default {
    data () {
      return {
        http: HttpService.getAxios,
        applyList: [], // 申请列表
        userName: '',
        isApproval: false,
        tabState: {}, // tab标签页数据
        // 分页查询参数
        page: 1,
        pageSize: 8,
        busy: true,
        isLoading: false,
        /* ----------- */
        showTips: true,
        questionnaireList: [],
        tabnum: 2 // 标签页
      }
    },
    components: {
      XHeader,
      Spinner,
      PersonalItem
    },
    mounted () {
      this.init()
    },
    methods: {
      loading (isShow) {
        if (isShow) {
          this.$vux.loading.show({ text: '加载中' })
        } else {
          this.$vux.loading.hide()
        }
      },
      goBack () {
        this.$router.back()
      },
      // 初始化
      init () {
        this.getAllQuestionnaires()
      },
      // 获取所有问卷
      getAllQuestionnaires (flag) {
        let param = {
          page: this.page,
          pageSize: this.pageSize
        }
        this.loading = true
        this.http.get('questionnaires/getAllQuestionnaires', {params: param}).then((response) => {
          this.loading = false
          if (response.status === 200) {
            let res = response.data
            if (res.status === '0') {
              let newList = res.result
              if (flag) { // 第二次加载数据
                this.questionnaireList = this.questionnaireList.concat(newList)
                if (newList.length === 0) {
                  this.$vux.toast.show({
                    text: '没有更多'
                  })
                  this.busy = true
                } else {
                  this.busy = false
                }
              } else { // 第一次加载数据
                this.questionnaireList = newList || []
                this.busy = false
                if (newList.length === 0) {
                  this.$vux.toast.show({
                    text: '没有更多'
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
          this.getAllQuestionnaires(true)
        }, 500)
      }
    }
  }
</script>

<style lang="scss">
  .questionnaire-result-home-wrapper{
    .vux-header{
      .vux-header-right{
        top: 12px;
      }
    }
    .main-box{
      .loading-icon{
        flex: 0 0 50px;
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
  }
</style>

<style lang="scss" scoped>
  .questionnaire-result-home-wrapper{
    color: #020F17 !important;
    display: flex;
    flex-direction: column;
    .whiteBgHeader{
      flex: 0 0 44px;
      .add{
        font-size: 18px;
        width: 36px;
        height: 22px;
        color: #008e6f;
        display: inline-block;
        /*background: url("./../../../assets/img/questionnaire/statisticsIcon.png") no-repeat;*/
        background-size: 100% 100%;
        position: relative;
        i{
          position: absolute;
          top: -10px;
          right: -11px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f7524f;
          color: #fff;
          font-size: 13px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
      }
    }
    .tab-box{
      flex: 0 0 40px;
      display: flex;
      border-bottom: 1px solid #DFE1E3;
      background: #f0f4f7;
      align-items: center;/*让中间的分割线剧中*/
      /*background-color: #009de6;*/
      .feedback-tab{
        flex: auto;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        i{
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: red;
          top: 0px;
          right: 45px;
        }
      }
      .empty{
        flex: 0 0 1px;
        background-color: #DFE1E3;
        height: 30px;
      }
      .no-feedback-tab{
        flex: auto;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        i{
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: red;
          top: 0px;
          right: 45px;
        }
      }
      .approvaling-tab{
        flex: auto;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        i{
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: red;
          top: 0px;
          right: 45px;
        }
      }

      .active{
        position: relative;
        color: #149c81;
        font-size: 16px;
        line-height: 2.75;
        &:before{
          content: "";
          background: #149c81;
          position: absolute;
          bottom: 2px;
          left: 50%;
          width: 74px;
          height: 2px;
          margin-left: -41px;
        }
      }
    }
    .tips-box{
      flex: 0 0 30px;
      justify-content: space-between;
      display: flex;
      align-items: center;
      background-color: #f0f4f7;
      font-size: 15px;
      /*font-weight: bold;*/
      span{
        padding-left: 12px
      }
      i{
        height: 20px;
        width: 20px;
        background: url("./../../../assets/img/questionnaire/delIcon.png") no-repeat;
        background-size: 100% 100%;
        margin-right: 20px;
      }
    }
    .main-box{
      flex: auto;
      display: flex;
      flex-direction: column;
      overflow: auto;
      .list-wrapper{
        .item-wrapper{

        }
      }
      .empty-tips-wrapper{
        flex: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-top: 50px;
        .empty-tips-box{
          flex: none;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 200px;
          height: 200px;
          font-size: 16px;
          position: relative;
          .add-approval-icon{
            width: 50px;
            height: 50px;
            background-size: 100% 100%;
          }
          .line-1{
            padding-top: 10px;
          }
          .line-2{
          }
          .spring-arrow-icon{
            width: 100px;
            height: 100px;
            background-size: 100% 100%;
            position: absolute;
            z-index: -1;
            top: 44px;
            right: -25px;
          }
        }
      }
    }
  }
</style>
