var express = require('express')
var router = express.Router()
require('./../../src/services/util')

var User = require('./../models/user')
var Questionnaire = require('./../models/questionnaires')

router.get('/', function (req, res, next) {
  res.send('response with a resource')
})

/* 获取用户待参与问卷 */
router.get('/getNotInvolved', (req, res, next) => {
  let userName = req.cookies.userName
  // let currentDate = new Date().Format('yyyy-MM-dd')
  // let params = {// 查询参数，&lte：意为小于。即问卷结束时间小于当前时间
  //   timeEnd: {
  //     $lte: currentDate
  //   }
  // }
  let questionnaireModel = Questionnaire.find({})
  questionnaireModel.sort({'timeEnd': -1}) // 按开始时间降序排序
  questionnaireModel.exec((err, questionnaireDoc) => {
    if (err) {
      res.json({
        status: '1',
        msg: err.message,
        result: ''
      })
    } else {
      if (questionnaireDoc) {
        let questionnaireList = []
        questionnaireDoc.forEach(questionnaireItem => {
          if (questionnaireItem.participants.indexOf(userName) === -1) { // 当前用户没答过该问卷
            questionnaireList.push(questionnaireItem)
          }
        })
        res.json({
          status: '0',
          msg: '',
          result: questionnaireList
        })
      } else {
        res.json({
          status: '1',
          msg: err.message,
          result: '问卷为空！'
        })
      }
    }
  })
})

/* 获取用户已参与问卷 */
router.get('/getInvolved', (req, res, next) => {
  let userName = req.cookies.userName
  let params = {
    userName: userName
  }
  User.findOne(params, (err, userDoc) => {
    if (err) {
      res.json({
        status: '1',
        msg: err.message,
        result: ''
      })
    } else {
      if (userDoc) {
        if (userDoc.questionnaireList.length === 0) {
          res.json({
            status: '0',
            msg: '当前用户无参与的问卷',
            result: []
          })
          return
        }
        Questionnaire.find({}, (err1, questionnairesDoc) => { // 获取系统所有问卷
          if (err1) {
            res.json({
              status: '1',
              msg: err.message,
              result: ''
            })
          } else {
            if (questionnairesDoc) {
              for (let i = 0; i < userDoc.questionnaireList.length; i++) { // 循环用户问卷列表
                for (let j = 0; j < questionnairesDoc.length; j++) { // 循环系统所有问卷列表
                  if (userDoc.questionnaireList[i].questionnaireId === questionnairesDoc[j].questionnaireId) {
                    userDoc.questionnaireList[i].attendNum = questionnairesDoc[j].attendNum
                    break
                  }
                }
              }
            }
            let list = userDoc.questionnaireList
            res.json({
              status: '0',
              msg: '',
              result: list
            })
          }
        })
      } else {
        res.json({
          status: '1',
          msg: err.message,
          result: '无法从cookies中获取用户姓名！'
        })
      }
    }
  })
})

/* 获取所有问卷，即统计数据 */
router.get('/getAllQuestionnaires', (req, res, next) => {
  // let currentDate = new Date().Format('yyyy-MM-dd')
  // let params = {// 查询参数，&lte：意为小于。即问卷结束时间小于当前时间
  //   timeEnd: {
  //     $lte: currentDate
  //   }
  // }
  let userName = req.cookies.userName
  let params = {
    userName: userName
  }
  let questionnaireModel = Questionnaire.find({})
  questionnaireModel.sort({'timeEnd': -1}) // 按开始时间降序排序
  questionnaireModel.exec((err, questionnairesDoc) => { // 第一步：获取系统所有问卷
    if (err) {
      res.json({
        status: '1',
        msg: err.message,
        result: ''
      })
    } else {
      if (questionnairesDoc) {
        let sysQuestionnaireList = questionnairesDoc // 系统所有问卷
        User.findOne(params, (err1, userDoc) => { // 第二步：获取当前用户的所有问卷列表
          if (err) {
            res.json({
              status: '1',
              msg: err.message,
              result: ''
            })
          } else {
            if (userDoc) {
              let userQuestionnaireList = userDoc.questionnaireList // 当前用户所有参与问卷
              for (let i = 0; i < sysQuestionnaireList.length; i++) { // 第三步：循环系统问卷，如果当前用户参与该问卷，就把当前用户的选项答案赋值给对应的系统问卷
                if (sysQuestionnaireList[i].participants.indexOf(userName) !== -1) { // 如果用户参与了该问卷
                  for (let j = 0; j < userQuestionnaireList.length; j++) { // 循环用户问卷列表，找出该问卷，然后赋值答案
                    if (sysQuestionnaireList[i].questionnaireId === userQuestionnaireList[j].questionnaireId) {
                      sysQuestionnaireList[i] = getAnswer(sysQuestionnaireList[i], userQuestionnaireList[j])
                      break
                    }
                  }
                }
              }
              res.json({
                status: '0',
                msg: '',
                result: modifyType(sysQuestionnaireList)
              })
            } else {
              res.json({
                status: '1',
                msg: '系统不存在该用户',
                result: ''
              })
            }
          }
        })
      } else {
        res.json({
          status: '1',
          msg: err.message,
          result: '问卷为空！'
        })
      }
    }
  })
})
// 获取用户已参与问卷的答案，赋值到总问卷中
function getAnswer (sysQuestionnaire, perQuestionnaire) {
  for (let i = 0; i < perQuestionnaire.list.length; i++) { // 循环当前用户问卷问题列表
    if (perQuestionnaire.list[i].isDid) { // 如果该问题有做
      if (perQuestionnaire.list[i].type === '3') { // 如果该题为简答题
        sysQuestionnaire.list[i].answer = perQuestionnaire.list[i].answer
      } else { // 该题为单选或多选题
        for (let j = 0; j < perQuestionnaire.list[i].options.length; j++) { // 循环选项
          if (perQuestionnaire.list[i].options[j].isSelected) { // 如果该选项是当前用户选中的
            sysQuestionnaire.list[i].options[j].isSelected = true // 就把系统问卷该题该选项选中标志变为true
          }
        }
      }
    }
  }
  return sysQuestionnaire
}
// 将总问卷的type改为4
function modifyType (questionnaireList) {
  for (let i = 0; i < questionnaireList.length; i++) {
    for (let j = 0; j < questionnaireList[i].list.length; j++) {
      if (questionnaireList[i].list[j].type !== '3') {
        questionnaireList[i].list[j].type = '4'
      }
    }
  }
  return questionnaireList
}

/* 提交问卷，且更新总问卷中的选中数量 */
router.post('/commitQuestionnaire', (req, res, next) => {
  let userName = req.cookies.userName
  let questionnaire = req.body.questionnaire
  let params = {
    userName: userName
  }
  User.findOne(params, (err, userDoc) => {
    if (err) {
      res.json({
        status: '1',
        msg: err.message,
        result: ''
      })
    } else {
      if (userDoc) { // 第一步，找出当前用户，把问卷加入到用户已参与问卷数组列表中 questionnaireList[]
        userDoc.questionnaireList.push(questionnaire)
        // 保存
        userDoc.save((err1, userDoc1) => {
          if (err1) {
            res.json({
              status: '1',
              msg: err1.message,
              result: ''
            })
          } else { // 第二步，保存问卷到个人问卷列表成功之后，查找问卷列表，更新答题数量
            let queryParams = {
              questionnaireId: questionnaire.questionnaireId
            }
            Questionnaire.findOne(queryParams, (err1, questionnairesDoc) => {
              if (err1) {
                res.json({
                  status: '1',
                  msg: err1.message,
                  result: ''
                })
              } else {
                if (questionnairesDoc) {
                  questionnairesDoc.attendNum += 1 // 当前问卷已参与人数+1
                  questionnairesDoc.participants.push(userName) // 将当前用户加入到问卷参与者列表中
                  for (let i = 0; i < questionnaire.list.length; i++) {  // 循环答题者问卷的所有问题
                    if (questionnaire.list[i].isDid && questionnaire.list[i].type !== '3') { // 该问题是否已做，并且不为简答题
                      for (let j = 0; j < questionnaire.list[i].options.length; j++) { // 循环该问题的所有选项
                        if (questionnaire.list[i].options[j].isSelected) {
                          questionnairesDoc.list[i].options[j].selectedNum += 1
                        }
                      }
                    }
                  }
                  questionnairesDoc.save((err2, questionnairesDoc2) => {
                    if (err1) {
                      res.json({
                        status: '1',
                        msg: err1.message,
                        result: ''
                      })
                    } else {
                      res.json({
                        status: '0',
                        msg: '问卷数据全部联动保存成功！',
                        result: ''
                      })
                    }
                  })
                } else {
                  res.json({
                    status: '1',
                    msg: '问卷不存在！',
                    result: ''
                  })
                }
              }
            })
          }
        })
      } else {
        res.json({
          status: '1',
          msg: err.message,
          result: '无法从cookies中获取用户姓名！'
        })
      }
    }
  })
})

module.exports = router