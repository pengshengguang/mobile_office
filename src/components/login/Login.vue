<template>
  <div class="login-wrapper">
    <div class="logo-box">
      <img src="./../../assets/img/login/logo1.png">
      <div class="login-name">光子工作室</div>
    </div>
    <div class="login-box">
      <div class="username-box">
        <input name="username" type="text" v-model.trim="userName" placeholder="用户名" class="username-input" onkeyup="this.value=this.value.replace(/\s/g,'')">
      </div>
      <div class="password-box">
        <input name="password" type="password" v-model.trim="userPwd" placeholder="密码" class="password-input" @keyup.enter="enter" onkeyup="this.value=this.value.replace(/\s/g,'')">
      </div>
      <div class="help-box">
        <a class="forget" href="#" @click="toForgotVive"><span class="forgetIcon"></span>忘记密码</a>
        <a class="register" href="#" @click="toRegisterView"><span class="aaa"></span>用户注册</a>
        <a class="problem" href="#"  @click="showPop = true"><x-switch title="" v-model="showPop" class="problem-switch"></x-switch>遇到问题</a>
      </div>
      <button name="login" @click="login">登 陆</button>
    </div>
    <div v-transfer-dom>
      <popup v-model="showPop" height="210px" is-transparent>
        <div style="width: 95%;background-color:#fff;height:200px;margin:0 auto;border-radius:5px;padding-top:10px;">
          <group>
            <cell title="开发者" value="彭胜光"></cell>
            <cell title="技术支持" value="13160675356"></cell>
          </group>
          <div style="padding:20px 15px;">
            <x-button type="primary" @click.native="showPop = false">确定</x-button>
          </div>
        </div>
      </popup>
    </div>
    <router-view></router-view>
  </div>
</template>

<script>
  import Httpservice from '@/services/HttpService'
  import { TransferDom, Popup, XSwitch, Group, Cell, XButton } from 'vux'
  import { mapState } from 'vuex'

  export default {
    directives: {
      TransferDom
    },
    components: {
      Popup,
      XSwitch,
      Group,
      Cell,
      XButton
    },
    data () {
      return {
        msg: '',
        http: Httpservice.getAxios,
        userName: '',
        userPwd: '',
        showPop: false
      }
    },
    mounted () {
      if (this.$route.params.hah === 1) { // 判断是否从个人信息页面转过来的，是的话就不用验证身份
        return
      }
      this.checkLogin()
    },
    computed: {
      ...mapState(['nickName'])
    },
    methods: {
      loading (isShow) {
        if (isShow) {
          this.$vux.loading.show({ text: '登陆中...' })
        } else {
          this.$vux.loading.hide()
        }
      },
      // 检查是否登陆
      checkLogin () {
        this.http.get('/users/checkLogin').then((response) => {
          let res = response.data
          if (res.status === '0') {
            this.$store.commit('updateUserInfo', res.result)
            // 前往主页面
            this.$router.push({
              name: 'work'
            })
            this.$vux.toast.show({
              text: '欢迎回来',
              type: 'text',
              time: 1500,
              position: 'bottom'
            })
          } else {
            this.$vux.toast.show({
              text: '请登陆',
              type: 'text',
              time: 1500,
              position: 'bottom'
            })
          }
        })
      },
      // 登陆
      login () {
        if (!this.userName || !this.userPwd) {
          this.$vux.toast.show({
            text: '用户名和密码不能为空',
            type: 'text',
            width: '12em',
            time: 1500
          })
          return
        }
        let userConfig = {
          userName: this.userName,
          userPwd: this.userPwd
        }
        this.loading(true)
        this.http.post('/users/login', userConfig).then((response) => {
          let res = response.data
          this.loading(false)
          if (res.status === '0') {
            this.$store.commit('updateUserInfo', res.result.userName)
            // 前往主页面
            this.$router.push({
              name: 'work'
            })
          } else {
            this.$vux.alert.show({
              content: '您输入的账号/密码无效，请重新输入',
              type: 'error',
              time: 1500
            })
            console.log('登陆失败')
          }
        }, () => {
          this.loading(false)
          this.$vux.toast.show({ text: '登录失败', type: 'cancel' })
        })
      },
      enter (event) {
        if (event.keyCode === 13) {
          this.login()
        }
      },
      toForgotVive () {
        this.$router.push({
          path: 'login/forget'
        })
      },
      toRegisterView () {
        this.$router.push({
          path: 'login/registered'
        })
      }
    }
  }
</script>
<style lang="scss">
  .login-wrapper{
    .login-box{
      .help-box{
        .problem-switch {
          padding-top: 0px!important;
          padding-bottom: 0px!important;
          .weui-switch{
            position: absolute;
            width: 34px;
            height: 20px;
            left: -80px;
            &:before{
              width: 32px;
              height: 18px;
            }
            &:after{
              width: 18px;
              height: 18px;
            }
          }
        }
      }
    }
  }
</style>
<style  scoped lang="scss">
  .login-wrapper{
    display: flex;
    flex-direction: column;
    align-items: center;
    /*padding-top: 60px;*/
    height: 100%;
    background-color: #fff;
    .logo-box{
      font-family: kuzhanziti;
      padding-top: 50px;
      background-color: #fff;
      width: 100%;
      height: 34%;
      display: flex;
      flex-direction: column;
      flex: none;
      align-items: center;
      justify-content: center;
      img{
        width: 200px;
        align-items: center;
        /*border: 1px solid #000;*/
        /*border-radius: 50%;*/
      }
      .login-name{
        color: #5fb913;
        font-size: 44px;
        font-weight: bold;
      }
    }
    .login-box {
      width: 100%;
      display: flex;
      flex-direction: column;
      padding-top: 10px;
      .userIcon {
        width: 26px;
      }
      input {
        height: 30px;
        border-left: none;
        border-right: none;
        border-top: none;
        margin: 20px 20px 0 20px;
        outline-style: none;
        font-size: 14px;
        padding-left: 24px;
        width: 90%;
      }
      button {
        margin: 30px 20px 0 20px;
        background-color: #60bc5e;
        border-radius: 22px;
        border: none;
        height: 38px;
        color: #fff;
        font-size: 16px;
      }
      .help-box {
        display: flex;
        margin-left: 20px;
        margin-right: 20px;
        margin-top: 16px;
        justify-content: space-between;
        position: relative;
        a {
          text-decoration: none;
          color: grey;
          font-size: 14px;
          position: relative;
          &.forget {
            position: relative;
            padding-left: 20px;
            .forgetIcon {
              height: 20px;
              width: 20px;
              position: absolute;
              left: -1px;
              background: url("./../../assets/img/login/problemIcon.png") no-repeat;
              background-size: 100% 100%;
            }
          }
          &.register {
            position: relative;
            .aaa {
              position: absolute;
              left: -20px;
              /*bottom: 0px;*/  /*这个bottom用加，加了这个家伙，虚拟键盘出来的时候，这货图片位置会向上偏移！！！！*/
              width: 20px;
              height: 20px;
              background: url("./../../assets/img/login/register.png") no-repeat;
              background-size: 100% 100%;
            }
          }
        }
        &.problem {
            }
      }
        .username-box {
          position: relative;
          &:before {
            width: 20px;
            height: 20px;
            content: ' ';
            left: 20px;
            bottom: 6px;
            position: absolute;
            background: url("./../../assets/img/login/usernameIcon.png") no-repeat;
            background-size: 100% 100%;
          }
        }
        .password-box {
          position: relative;
          &:before {
            width: 20px;
            height: 20px;
            content: ' ';
            left: 20px;
            bottom: 6px;
            position: absolute;
            background: url("./../../assets/img/login/passwordIcon.png") no-repeat;
            background-size: 100% 100%;
          }
        }
      }
  }
</style>
